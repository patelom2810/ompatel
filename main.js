// Main JS file
console.log("Portfolio UI Loaded");

/* =========================================
   Intro Preloader Curtain Animation
   ========================================= */
function initIntroPreloader() {
    const curtain = document.getElementById('intro-curtain');
    const counterEl = document.getElementById('intro-counter');
    const centerContent = document.querySelector('.intro-center-content');
    const counterBox = document.querySelector('.intro-counter-box');
    const skipBtn = document.getElementById('intro-skip-btn');

    if (!curtain || !counterEl) return;

    // Lock scrolling during intro
    document.body.classList.add('intro-active');

    let current = 0;
    const target = 100;
    const duration = 3500; // slowed to 3.5 seconds
    const startTime = performance.now();
    let animFrameId = null;
    let dismissed = false;

    // ── Dismiss helper (shared by counter finish & skip) ──
    function dismissCurtain(instant) {
        if (dismissed) return;
        dismissed = true;
        if (animFrameId) cancelAnimationFrame(animFrameId);

        const delay = instant ? 0 : 200;

        if (centerContent) centerContent.classList.add('intro-fade-out');
        if (counterBox) counterBox.classList.add('intro-fade-out');
        if (skipBtn) skipBtn.style.opacity = '0';

        setTimeout(() => {
            curtain.classList.add('intro-exit');
            document.body.classList.remove('intro-active');
            document.body.classList.add('intro-complete');

            setTimeout(() => {
                curtain.style.display = 'none';
                curtain.setAttribute('aria-hidden', 'true');
            }, 1700); // match CSS transition 1.6s + buffer
        }, delay);
    }

    // ── Skip button ──
    if (skipBtn) {
        skipBtn.addEventListener('click', () => dismissCurtain(true));
    }

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth cubic ease-out for realistic loading count
        const ease = 1 - Math.pow(1 - progress, 2.5);
        current = Math.floor(ease * target);

        // Format to 3-digit padded string (000, 015, 046, 100)
        counterEl.textContent = String(current).padStart(3, '0');

        if (progress < 1) {
            animFrameId = requestAnimationFrame(updateCounter);
        } else {
            counterEl.textContent = '100';
            // Brief pause at 100 before smooth exit
            setTimeout(() => dismissCurtain(false), 200);
        }
    }

    animFrameId = requestAnimationFrame(updateCounter);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize intro preloader
    initIntroPreloader();

    // Initialize FAQ Accordion
    initFaqAccordion();

    // Initialize Dynamic Mobile Navigation
    initMobileMenu();

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
        if (section.id === 'home') {
            section.classList.add('visible');
        } else {
            sectionObserver.observe(section);
            section.classList.add('section-hidden');
        }
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
    const searchInputs = document.querySelectorAll('#nav-search');

    const applySearchAndCategoryFilter = () => {
        const activeBtn = document.querySelector('.filter-btn.active');
        const currentCategory = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
        
        const searchInput = document.querySelector('#nav-search');
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let visibleCount = 0;

        projectCards.forEach((card) => {
            if (card.dataset.timeoutId) {
                clearTimeout(parseInt(card.dataset.timeoutId, 10));
            }
            if (card.dataset.fadeTimeoutId) {
                clearTimeout(parseInt(card.dataset.fadeTimeoutId, 10));
            }

            const categories = (card.getAttribute('data-category') || '').split(' ');
            
            // Support both project details format (projects.html uses .project-card-title / .project-card-desc, homepage uses .project-ny-title / .project-ny-subtitle)
            const titleEl = card.querySelector('.project-card-title') || card.querySelector('.project-ny-title');
            const title = titleEl ? titleEl.textContent.toLowerCase() : '';
            
            const subtitleEl = card.querySelector('.project-card-desc') || card.querySelector('.project-ny-subtitle');
            const subtitle = subtitleEl ? subtitleEl.textContent.toLowerCase() : '';

            // Also search inside technical skill badges for a better search experience
            const skillBadges = Array.from(card.querySelectorAll('.skill-badge')).map(badge => badge.textContent.toLowerCase());

            const categoryMatches = currentCategory === 'all' || categories.includes(currentCategory);
            const searchMatches = searchQuery === '' || 
                                  title.includes(searchQuery) || 
                                  subtitle.includes(searchQuery) || 
                                  categories.some(cat => cat.includes(searchQuery)) ||
                                  skillBadges.some(badge => badge.includes(searchQuery));

            const isVisible = categoryMatches && searchMatches;

            if (isVisible) {
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
            applySearchAndCategoryFilter();
        });
    });

    // Search input handlers
    searchInputs.forEach(input => {
        input.addEventListener('input', () => {
            applySearchAndCategoryFilter();
        });

        // On home page, pressing Enter redirects to projects page
        if (!document.querySelector('.projects-grid')) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = input.value.trim();
                    if (query) {
                        window.location.href = `projects.html?search=${encodeURIComponent(query)}`;
                    }
                }
            });
        }
    });

    // Initial load — check URL params and apply filters
    setTimeout(() => {
        if (document.querySelector('.projects-grid')) {
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            if (searchQuery) {
                searchInputs.forEach(input => {
                    input.value = searchQuery;
                });
            }
        }
        applySearchAndCategoryFilter();
    }, 100);

    /* =========================================
       Back to Top Button
       ========================================= */
    const backToTopBtn = document.querySelector('.back-to-top');

    if (backToTopBtn) {
        const glassyNavContainer = document.querySelector('.glassy-nav-container');
        const toggleBackToTop = () => {
            const isScrolled = window.scrollY > 300;
            backToTopBtn.classList.toggle('visible', isScrolled);
            if (glassyNavContainer) {
                glassyNavContainer.classList.toggle('dock-shrunk', isScrolled);
            }
        };

        window.addEventListener('scroll', toggleBackToTop);
        window.addEventListener('load', toggleBackToTop);
        document.addEventListener('DOMContentLoaded', toggleBackToTop);
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
    const themeToggles = document.querySelectorAll('.theme-toggle-btn, #theme-toggle, #theme-toggle-dock, #theme-toggle-header, #mobile-theme-toggle');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // Initialize theme based on local storage or system preference
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "dark") {
        document.body.classList.add("dark-theme");
    } else if (currentTheme === "light") {
        document.body.classList.remove("dark-theme");
    } else if (prefersDarkScheme.matches) {
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.add("dark-theme"); // Default to dark mode for portfolio theme
    }

    // Function to update icon and labels
    const updateIcon = () => {
        const isDark = document.body.classList.contains("dark-theme");
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('.theme-icon');
            if (icon) {
                if (isDark) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        });

        const mobileThemeLabel = document.querySelector('.mobile-theme-label');
        if (mobileThemeLabel) {
            mobileThemeLabel.textContent = isDark ? "Light Mode" : "Dark Mode";
        }
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

    /* =========================================
       Drag-to-Scroll for Featured Projects
       ========================================= */
    const slider = document.querySelector('.featured-projects-slider-wrapper');
    if (slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // scroll speed multiplier
            slider.scrollLeft = scrollLeft - walk;
        });
    }

    /* =========================================
       Text Highlight Sweeper Observer
       ========================================= */

    // Text Highlight Sweeper Observer
    const highlightContainers = document.querySelectorAll('.highlight-container');
    const highlightObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Clear any existing timeouts to prevent overlapping animation cycles
                if (entry.target.highlightTimeout) {
                    clearTimeout(entry.target.highlightTimeout);
                }
                
                entry.target.classList.add('active');
                entry.target.classList.remove('completed');
                
                entry.target.highlightTimeout = setTimeout(() => {
                    entry.target.classList.add('completed');
                }, 1800);
            } else {
                // Reset highlight state when out of view so it animations play again on scroll back
                entry.target.classList.remove('active', 'completed');
                if (entry.target.highlightTimeout) {
                    clearTimeout(entry.target.highlightTimeout);
                }
            }
        });
    }, { threshold: 0.15 });

    highlightContainers.forEach(container => highlightObserver.observe(container));

    /* =========================================
       Scroll-driven Background Curves Parallax
       ========================================= */
    const heroSvg = document.querySelector('.hero-svg-bg');
    const projectsArc = document.querySelector('.projects-arc-container');
    const projectsSection = document.getElementById('featured-projects');

    let parallaxTicking = false;

    function updateParallax() {
        const scrollTop = window.scrollY;

        // 1. Hero background curves & circles slide up slightly on scroll
        if (heroSvg && scrollTop < window.innerHeight) {
            heroSvg.style.transform = `translateY(${scrollTop * -0.2}px)`;
        }

        const heroCircle1 = document.querySelector('.hero-circle-1');
        const heroCircle2 = document.querySelector('.hero-circle-2');
        const heroCircle3 = document.querySelector('.hero-circle-3');

        if (heroCircle1 && scrollTop < window.innerHeight) {
            heroCircle1.style.transform = `translateY(${scrollTop * -0.15}px)`;
        }
        if (heroCircle2 && scrollTop < window.innerHeight) {
            heroCircle2.style.transform = `translateY(${scrollTop * -0.25}px)`;
        }
        if (heroCircle3 && scrollTop < window.innerHeight) {
            heroCircle3.style.transform = `translateY(${scrollTop * -0.35}px)`;
        }

        // 2. Featured Projects nested circles slide up at different speeds on scroll
        if (projectsSection) {
            const rect = projectsSection.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            if (rect.top < viewHeight && rect.bottom > 0) {
                const progress = (viewHeight - rect.top) / (viewHeight + rect.height);
                
                const outerCircle = document.querySelector('.projects-arc-outer');
                const middleCircle = document.querySelector('.projects-arc-middle');
                const innerCircle = document.querySelector('.projects-arc-inner');
                
                if (outerCircle) {
                    const yOuter = 40 - progress * 80;
                    outerCircle.style.transform = `translateY(${yOuter}px)`;
                }
                if (middleCircle) {
                    const yMiddle = 50 - progress * 100;
                    middleCircle.style.transform = `translateY(${yMiddle}px)`;
                }
                if (innerCircle) {
                    const yInner = 60 - progress * 120;
                    innerCircle.style.transform = `translateY(${yInner}px)`;
                }
            }
        }

        parallaxTicking = false;
    }

    window.addEventListener('scroll', () => {
        if (!parallaxTicking) {
            window.requestAnimationFrame(updateParallax);
            parallaxTicking = true;
        }
    }, { passive: true });

    // Project Cards Scroll Reveal Observer (Staggered slide-up)
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Remove transition delay after reveal completes to make hover transitions instant
                const index = parseInt(entry.target.getAttribute('data-index') || 0);
                setTimeout(() => {
                    entry.target.style.transitionDelay = '';
                }, 600 + (index * 100));
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const glassProjectCards = document.querySelectorAll('.project-glass-card');
    glassProjectCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 100}ms`;
        card.setAttribute('data-index', index);
        cardObserver.observe(card);
    });

    // Run once on load to initialize positions
    updateParallax();
});

// Toggle education tree nodes
function toggleTreeNode(node) {
    node.classList.toggle('expanded');
}

/* =========================================
   FAQ Accordion Functionality
   ========================================= */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question-btn');
        const collapse = item.querySelector('.faq-answer-collapse');

        if (!btn || !collapse) return;

        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            // Close all other accordion items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherBtn = otherItem.querySelector('.faq-question-btn');
                    const otherCollapse = otherItem.querySelector('.faq-answer-collapse');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                    if (otherCollapse) otherCollapse.style.maxHeight = null;
                }
            });

            // Toggle current item
            if (isOpen) {
                item.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
                collapse.style.maxHeight = null;
            } else {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
                collapse.style.maxHeight = collapse.scrollHeight + 'px';
            }
        });
    });
}

/* =========================================
   Dynamic Mobile Navigation Drawer
   ========================================= */
function initMobileMenu() {
    const mobileMenuToggles = document.querySelectorAll('#mobile-menu-toggle');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');
    const mobileSearchInput = document.getElementById('mobile-nav-search');

    if (!mobileNavOverlay) return;

    const openMenu = () => {
        mobileNavOverlay.classList.add('active');
        mobileNavOverlay.setAttribute('aria-hidden', 'false');
        mobileMenuToggles.forEach(btn => {
            btn.classList.add('active');
            btn.setAttribute('aria-expanded', 'true');
        });
        document.body.classList.add('no-scroll');
    };

    const closeMenu = () => {
        mobileNavOverlay.classList.remove('active');
        mobileNavOverlay.setAttribute('aria-hidden', 'true');
        mobileMenuToggles.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        });
        document.body.classList.remove('no-scroll');
    };

    mobileMenuToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileNavOverlay.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    });

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMenu);
    }

    if (mobileNavBackdrop) {
        mobileNavBackdrop.addEventListener('click', closeMenu);
    }

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNavOverlay.classList.contains('active')) {
            closeMenu();
        }
    });

    // Mobile Search Input Enter Behavior
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = mobileSearchInput.value.trim();
                if (!query) return;
                closeMenu();
                if (window.location.pathname.includes('projects.html')) {
                    const desktopSearch = document.getElementById('nav-search');
                    if (desktopSearch) {
                        desktopSearch.value = query;
                        desktopSearch.dispatchEvent(new Event('input'));
                    }
                } else {
                    window.location.href = `projects.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

