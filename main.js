// Main JS file
console.log("Portfolio UI Loaded");

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       Scroll Reveal Animation (Sections Only)
       ========================================= */
    const sections = document.querySelectorAll('section');

    const revealSection = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const sectionObserver = new IntersectionObserver(revealSection, {
        root: null,
        threshold: 0.1,
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
        section.classList.add('section-hidden');
    });

    /* =========================================
       Project Filtering & Animation Logic
       ========================================= */
    const projectCards = document.querySelectorAll('.project-card');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const applyFilter = (filter) => {
        let visibleCount = 0;

        projectCards.forEach((card) => {
            const categories = (card.getAttribute('data-category') || '').split(' ');
            const matches = filter === 'all' || categories.includes(filter);

            if (matches) {
                card.style.display = '';
                card.style.animation = 'none';
                card.style.opacity = '0';
                const delay = visibleCount * 70;
                visibleCount++;
                setTimeout(() => {
                    card.style.animation = `card-in 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`;
                }, 10);
            } else {
                card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.94)';
                setTimeout(() => {
                    card.style.display = 'none';
                    card.style.transform = '';
                }, 220);
            }
        });
    };

    // Filter button click handler
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

    // Initial load — show all with stagger
    setTimeout(() => {
        applyFilter('all');
    }, 100);

    /* =========================================
       Back to Top Button
       ========================================= */
    const backToTopBtn = document.querySelector('.back-to-top');

    if (backToTopBtn) {
        const toggleBackToTop = () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        };

        window.addEventListener('scroll', toggleBackToTop);
        toggleBackToTop();

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* =========================================
       Contact Form Handling (FormSubmit AJAX)
       ========================================= */
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);

            fetch("https://formsubmit.co/ajax/omashwin28@gmail.com", {
                method: "POST",
                body: formData
            })
                .then(response => response.json())
                .then(() => {
                    alert("Message Sent Successfully! I'll get back to you soon. 🚀");
                    contactForm.reset();
                })
                .catch(() => {
                    alert("Something went wrong. Please try again or email me directly.");
                })
                .finally(() => {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});
