class RealEstateChatbot {
    constructor() {
        this.history = [];
        this.isOpen = false;
        this.isAiMode = true; // Direct AI mode
        this.workerUrl = 'https://long-wave-c9b2.cogniqaiamruthap.workers.dev/';

        this.init();
    }

    init() {
        const root = document.getElementById('chatbot-root');
        if (!root) return;

        root.innerHTML = `
            <div id="chatbot-container">
                <div class="chat-bubble" id="chat-toggle">
                    <i class="fas fa-comment-dots"></i>
                </div>
                <div class="chat-window" id="chat-window">
                    <div class="chat-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0 fw-bold">Sabharwal Assistant</h6>
                            <small class="opacity-75" id="chat-status">Online | Fast Response</small>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <i class="fas fa-trash-alt cursor-pointer text-white-50 hover-white" id="chat-clear" title="Clear Chat"></i>
                            <i class="fas fa-times cursor-pointer" id="chat-close"></i>
                        </div>
                    </div>
                    <div class="chat-body" id="chat-messages"></div>
                    <div class="chat-footer" id="chat-input-area">
                        <div class="input-group">
                            <input type="text" id="chat-input" class="form-control" placeholder="Type your message...">
                            <button class="btn btn-primary" id="chat-send">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            toggle: document.getElementById('chat-toggle'),
            window: document.getElementById('chat-window'),
            close: document.getElementById('chat-close'),
            messages: document.getElementById('chat-messages'),
            inputArea: document.getElementById('chat-input-area'),
            input: document.getElementById('chat-input'),
            send: document.getElementById('chat-send'),
            status: document.getElementById('chat-status'),
            clear: document.getElementById('chat-clear')
        };

        this.elements.toggle.addEventListener('click', () => this.toggleChat());
        this.elements.close.addEventListener('click', () => this.toggleChat());
        this.elements.send.addEventListener('click', () => this.handleInput());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleInput();
        });
        this.elements.clear.addEventListener('click', () => this.clearChat());

        // Start with a greeting
        this.addMessage("Hello! I'm your Sabharwal Associates assistant for Punjabi Bagh real estate. Ask me about properties, pricing, or schedule a viewing!");
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.elements.window.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            this.elements.toggle.style.transform = 'scale(0)';
            this.elements.input.focus();
        } else {
            this.elements.toggle.style.transform = 'scale(1)';
        }
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.history = [];
            this.elements.messages.innerHTML = '';
            this.addMessage("Chat cleared. How can I help you today?");
        }
    }

    addMessage(text, type = 'bot') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `${type}-msg`;
        msgDiv.innerText = text;
        this.elements.messages.appendChild(msgDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

        // Add to history for AI
        this.history.push({ role: type === 'bot' ? 'model' : 'user', text: text });
    }

    addOptions(options) {
        // Kept for flexibility if needed later, but not used in current direct flow
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'mt-2 chat-options';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-option-btn';
            btn.innerText = opt;
            btn.onclick = () => {
                optionsDiv.remove();
                this.addMessage(opt, 'user');
                this.getAiResponse(opt);
            };
            optionsDiv.appendChild(btn);
        });
        this.elements.messages.appendChild(optionsDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-msg typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerText = '...';
        this.elements.messages.appendChild(typingDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    hideTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async handleInput() {
        const val = this.elements.input.value.trim();
        if (!val) return;

        this.addMessage(val, 'user');
        this.elements.input.value = '';
        await this.getAiResponse(val);
    }

    async getAiResponse(userMessage) {
        this.showTyping();
        // this.elements.status.innerText = 'AI is thinking...';

        try {
            const response = await fetch(this.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    business: 'sabharwal',
                    model: 'gemma-3-4b-it',
                    history: this.history.slice(0, -1) // Exclude the message we just added
                })
            });

            const data = await response.json();
            this.hideTyping();

            if (data.success) {
                this.addMessage(data.reply);
            } else {
                this.addMessage("I'm sorry, I'm having trouble connecting right now. Please try again or call us directly.");
                console.error("AI Error:", data.error);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage("Connection error. Please check your internet or try again later.");
            console.error("Fetch Error:", error);
        } finally {
            // this.elements.status.innerText = 'Online | Fast Response';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RealEstateChatbot();
});
