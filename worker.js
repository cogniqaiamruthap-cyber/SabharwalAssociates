// Universal Cloudflare Worker for Multiple Business Chatbots
// Supports unlimited businesses with Gemini Models
// Model: gemini-1.5-flash (default)

export default {
    async fetch(request, env) {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        // Only allow POST requests for chat
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            // Get the API key from environment variables
            const GEMINI_API_KEY = env.GEMINI_API_KEY;

            if (!GEMINI_API_KEY) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'API key not configured'
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            }

            // Parse the incoming request
            const body = await request.json();
            let userMessage = body.message || body.prompt || '';
            // Support passing systemPrompt directly from client for generic usage
            const clientSystemPrompt = body.systemPrompt || body.systemInstruction;

            const businessId = body.business || body.businessId || 'default';
            const model = body.model || env.AI_MODEL || 'gemini-1.5-flash';



            // const image = body.image || null; // Support for base64 images (handled in contents construction)
            const history = body.history || [];

            // Extract only the actual customer message (remove system prompt if present)
            if (userMessage.includes('Customer:')) {
                const parts = userMessage.split('Customer:');
                userMessage = parts[parts.length - 1].trim();
            }

            if (!userMessage) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'No message provided'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            }

            // Sabharwal Associates Configuration (Locked for this worker)
            const bizConfig = {
                name: 'Sabharwal Associates',
                location: 'Punjabi Bagh, Delhi, India',
                type: 'Real Estate Agency — Property Dealer & Consultant',
                services: 'Buying, selling, leasing and consulting for residential and commercial properties (plots, builder floors, flats, offices, shops).',
                summary: 'We help clients list and find properties across various categories — residential, commercial, land and rental — with personalised guidance throughout the process.',
                systemPrompt: `You are the Virtual Assistant for Sabharwal Associates.
                
IDENTITY:
- Name: Sabharwal Associates
- Location: Punjabi Bagh, Delhi, India
- Role: Real Estate Agency — Property Dealer & Consultant

CORE MISSION:
- Assist clients with buying, selling, leasing, and consulting.
- Cover all property types: Plots, builder floors, flats, offices, and shops.
- Provide personalised guidance for residential, commercial, and rental needs.

STRICT RULES:
1. You are ONLY for Sabharwal Associates. NEVER mention dental clinics, gyms, or Birmingham.
2. If asked about something unrelated to Sabharwal Associates or real estate in Delhi, politely redirect the conversation.
3. Keep responses professional, warm, and concise (2-3 sentences).
4. Always prioritize Punjabi Bagh and surrounding Delhi areas.
5. NEVER use emojis in your responses. Keep the tone strictly professional.`
            };

            const finalSystemPrompt = bizConfig.systemPrompt || env.SYSTEM_PROMPT || 'You are a helpful assistant.';
            const businessName = bizConfig.name;

            // Build conversation contents with multimodal support
            const contents = [];

            // Add conversation history if provided (Actual conversation only)
            if (history && history.length > 0) {
                // Gemini API requirements:
                // 1. role must alternate between 'user' and 'model'
                // 2. The sequence MUST start with 'user'
                let historyMessages = history.slice(-10);

                // Filter out any leading 'model' messages (like the greeting) to ensure we start with 'user'
                while (historyMessages.length > 0 && historyMessages[0].role !== 'user') {
                    historyMessages.shift();
                }

                historyMessages.forEach(msg => {
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                    });
                });
            }

            // Gemma-3 models or non-Gemini models: prepend system prompt to contents
            if (model.includes('gemma') || !model.includes('gemini')) {
                const systemPromptMessage = {
                    role: "user",
                    parts: [{ text: `INSTRUCTIONS:\n${finalSystemPrompt}\n\nUNDERSTOOD. I will act as the assistant according to these instructions.` }]
                };
                const systemAckMessage = {
                    role: "model",
                    parts: [{ text: `Understood. I am now acting as the ${businessName} Virtual Assistant.` }]
                };
                contents.unshift(systemPromptMessage, systemAckMessage);
            }

            // Build current message parts
            const currentParts = [{ text: userMessage }];

            // Add current message
            contents.push({
                role: "user",
                parts: currentParts
            });

            // Construct the Google AI Studio API request
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

            const apiRequest = {
                contents: contents,
                // Use system_instruction only for Gemini 1.5/1.0 models (excluding Gemma)
                ...(model.includes('gemini-1') ? {
                    system_instruction: {
                        parts: [{ text: finalSystemPrompt }]
                    }
                } : {}),
                generationConfig: {
                    temperature: body.temperature || 0.85,
                    topK: body.topK || 40,
                    topP: body.topP || 0.95,
                    maxOutputTokens: body.maxOutputTokens || 512,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };

            // Call the Google AI Studio API
            const apiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiRequest),
            });

            const apiData = await apiResponse.json();

            // Handle rate limiting with retry suggestion
            if (apiData?.error?.code === 429) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Rate limit exceeded. Please try again in a moment.',
                    retry: true
                }), {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            }

            // Handle overload errors
            if (apiData?.error?.code === 503) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Service temporarily overloaded. Please retry.',
                    retry: true
                }), {
                    status: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            }

            // Check for other errors
            if (!apiResponse.ok) {
                console.error('API Error:', apiData);
                return new Response(JSON.stringify({
                    success: false,
                    error: apiData.error?.message || 'Failed to get response from AI',
                    details: apiData
                }), {
                    status: apiResponse.status,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            }

            // Extract the response text
            const responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text ||
                'I apologize, but I\'m having trouble generating a response. Please contact us for assistance.';

            // Return the response in multiple formats for compatibility
            return new Response(JSON.stringify({
                success: true,
                reply: responseText,
                response: responseText,
                message: responseText,
                text: responseText,
                model: model,
                business: businessName
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            });

        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            });
        }
    },
};