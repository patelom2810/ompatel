// Main JS file
console.log("Portfolio UI Loaded");

/* =========================================
   Project Filtering Logic (Bulletproof)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
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
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    const filterProjects = (filterValue) => {
        let visibleCount = 0;

        projectCards.forEach((card) => {
            const categories = card.getAttribute('data-category'); // e.g. "visualization data-analysis"

            // Reset transition for clean animation
            card.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';

            // Check if (All) OR (Category string includes the filter value)
            if (filterValue === 'all' || categories.includes(filterValue)) {
                // MATCHES: Show it
                card.classList.remove('hidden');
                card.style.display = 'block';

                // Staggered Animation
                const delay = visibleCount * 100; // 100ms stagger
                visibleCount++;

                // Immediate set for "start" position (in case it was hidden)
                if (card.style.opacity === '0') {
                    card.style.transform = 'translateY(20px)';
                }

                // Animate In with Delay
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, delay);

            } else {
                // NO IT DOESN'T MATCH: Hide it
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.95)';

                // Wait for transition then display: none
                setTimeout(() => {
                    // Only hide if it hasn't been re-steams
                    if (card.style.opacity === '0') {
                        card.classList.add('hidden');
                        card.style.display = 'none';
                    }
                }, 500);
            }
        });
    };

    // Attach click listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            const clickedBtn = e.target.closest('.filter-btn');
            clickedBtn.classList.add('active');

            const filterValue = clickedBtn.getAttribute('data-filter');
            filterProjects(filterValue);
        });
    });

    // Initial Trigger (Staggered Load)
    setTimeout(() => {
        filterProjects('all');
    }, 100);

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
