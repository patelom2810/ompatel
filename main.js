// Main JS file
console.log("Portfolio UI Loaded");

/* =========================================
   Project Filtering Logic (Bulletproof)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.querySelector('.back-to-top');

    // --- Scroll Reveal Animation (Sections Only) ---
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

    const animateProjects = () => {
        let visibleCount = 0;

        projectCards.forEach((card) => {
            // MATCHES: Show it immediately with animation
            card.classList.remove('hidden');
            card.style.display = 'block';

            // Staggered Animation
            const delay = visibleCount * 100; // 100ms stagger
            visibleCount++;

            // Immediate set for "start" position
            if (card.style.opacity === '0' || !card.style.opacity) {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            }

            // Animate In with Delay
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, delay);
        });
    };

    // Initial Trigger (Staggered Load)
    setTimeout(() => {
        animateProjects();
    }, 100);

    if (backToTopBtn) {
        const toggleBackToTop = () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        };

        window.addEventListener('scroll', toggleBackToTop);
        toggleBackToTop();

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
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

            // Show loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);

            fetch("https://formsubmit.co/ajax/omashwin28@gmail.com", {
                method: "POST",
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    alert("Message Sent Successfully! I'll get back to you soon. 🚀");
                    contactForm.reset();
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert("Something went wrong. Please try again or email me directly.");
                })
                .finally(() => {
                    // Reset button
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});
