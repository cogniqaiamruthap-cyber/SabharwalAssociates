const properties = [
    {
        id: 1,
        title: "Luxury Builder Floor",
        type: "residential",
        location: "Punjabi Bagh West",
        price: "₹4.5 Cr",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        specs: "4 BHK | 3000 Sq.Ft"
    },
    {
        id: 2,
        title: "Modern Office Space",
        type: "commercial",
        location: "Netaji Subhash Place",
        price: "₹2.8 Cr",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        specs: "Ready to Move | 1200 Sq.Ft"
    },
    {
        id: 3,
        title: "Residential Plot",
        type: "plots",
        location: "Paschim Vihar",
        price: "₹3.2 Cr",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        specs: "250 Sq.Yards | Corner"
    },
    {
        id: 4,
        title: "Premium Apartment",
        type: "residential",
        location: "Punjabi Bagh East",
        price: "₹1.75 Cr",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        specs: "3 BHK | 1800 Sq.Ft"
    },
    {
        id: 5,
        title: "High Street Shop",
        type: "commercial",
        location: "Punjabi Bagh Market",
        price: "₹95 Lacs",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        specs: "Ground Floor | 450 Sq.Ft"
    },
    {
        id: 6,
        title: "Investment Land",
        type: "plots",
        location: "Rohini Sector 13",
        price: "₹5.5 Cr",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        specs: "500 Sq.Yards | Industrial"
    }
];

function renderProperties(filter = 'all') {
    const container = document.getElementById('listings-container');
    container.innerHTML = '';

    const filtered = filter === 'all'
        ? properties
        : properties.filter(p => p.type === filter);

    filtered.forEach(p => {
        container.innerHTML += `
            <div class="col-md-6 col-lg-4 animate-up">
                <div class="card property-card shadow-sm">
                    <div class="card-img-wrapper">
                        <span class="badge bg-primary property-badge">${p.type.toUpperCase()}</span>
                        <img src="${p.image}" alt="${p.title}">
                    </div>
                    <div class="card-body p-4">
                        <h5 class="fw-bold mb-1">${p.title}</h5>
                        <p class="text-muted small mb-3"><i class="fas fa-map-marker-alt me-2 text-primary"></i>${p.location}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="fs-4 fw-bold text-primary">${p.price}</span>
                            <span class="text-muted small">${p.specs}</span>
                        </div>
                        <hr>
                        <button class="btn btn-outline-primary w-100" onclick="alert('Inquiry for ${p.title} sent!')">View Details</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderProperties();

    // Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProperties(btn.dataset.filter);
        });
    });

    // Form Handling
    const form = document.getElementById('lead-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you! Your inquiry has been submitted. Our agent will contact you soon.');
            form.reset();
        });
    }

    // Navbar transparency logic & Scroll Spy
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.classList.add('shadow-sm');
        } else {
            nav.classList.remove('shadow-sm');
        }

        // Scroll Spy
        const sections = document.querySelectorAll('section, header');
        const navLinks = document.querySelectorAll('.nav-link');

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Adjustment for fixed navbar (approx 70-100px)
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});
