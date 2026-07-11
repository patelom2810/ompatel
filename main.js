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
       Scroll Spy for Glassy Nav Dock
       ========================================= */
    const navLinks = document.querySelectorAll('.nav-link-dock');
    const pageSections = document.querySelectorAll('section[id]');

    if (navLinks.length > 0 && pageSections.length > 0) {
        const handleScrollSpy = () => {
            let current = '';
            const scrollPos = window.scrollY || document.documentElement.scrollTop;

            pageSections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollPos >= (sectionTop - sectionHeight / 3.5)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                // If on projects page, keep the projects link active and don't clear it
                if (window.location.pathname.includes('projects.html') && href.includes('projects.html')) {
                    link.classList.add('active');
                    return;
                }

                link.classList.remove('active');
                if (href === `#${current}` || href === `index.html#${current}`) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', handleScrollSpy);
        handleScrollSpy();
    }

    /* =========================================
       Project Filtering & Animation Logic
       ========================================= */
    const projectCards = document.querySelectorAll('.project-card');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const applyFilter = (filter) => {
        let visibleCount = 0;

        projectCards.forEach((card) => {
            if (card.dataset.timeoutId) {
                clearTimeout(parseInt(card.dataset.timeoutId, 10));
            }
            if (card.dataset.fadeTimeoutId) {
                clearTimeout(parseInt(card.dataset.fadeTimeoutId, 10));
            }

            const categories = (card.getAttribute('data-category') || '').split(' ');
            const matches = filter === 'all' || categories.includes(filter);

            if (matches) {
                card.style.display = '';
                card.style.animation = 'none';
                card.style.opacity = '0';
                const delay = visibleCount * 70;
                visibleCount++;
                const tid = setTimeout(() => {
                    card.style.animation = `card-in 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`;
                }, 10);
                card.dataset.timeoutId = tid.toString();
            } else {
                card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.94)';
                const ftid = setTimeout(() => {
                    card.style.display = 'none';
                    card.style.transform = '';
                }, 220);
                card.dataset.fadeTimeoutId = ftid.toString();
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

    /* =========================================
       Theme Toggle (Dark / Light Mode)
       ========================================= */
    const themeToggles = document.querySelectorAll('#theme-toggle');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // Initialize theme based on local storage or system preference
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme == "dark") {
        document.body.classList.add("dark-theme");
    } else if (currentTheme == "light") {
        document.body.classList.remove("dark-theme");
    } else if (prefersDarkScheme.matches) {
        document.body.classList.add("dark-theme");
    }

    // Function to update icon
    const updateIcon = () => {
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('.theme-icon');
            if (document.body.classList.contains("dark-theme")) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });

    };
    
    // Initial icon update
    updateIcon();

    // Toggle logic
    themeToggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");
            
            // Save preference
            let theme = "light";
            if (document.body.classList.contains("dark-theme")) {
                theme = "dark";
            }
            localStorage.setItem("theme", theme);
            
            // Update icons
            updateIcon();
        });
    });

    // Theme Toggle on About Me Avatar click
    const aboutAvatarPill = document.querySelector('.about-avatar-pill');
    if (aboutAvatarPill) {
        aboutAvatarPill.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");
            
            let theme = "light";
            if (document.body.classList.contains("dark-theme")) {
                theme = "dark";
            }
            localStorage.setItem("theme", theme);
            updateIcon();
        });
    }
});

// Toggle education tree nodes
function toggleTreeNode(node) {
    node.classList.toggle('expanded');
}
