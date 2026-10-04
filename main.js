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

            if (typeof triggerBrandLogoAnimation === 'function') {
                triggerBrandLogoAnimation();
            }

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

/* =========================================
   Section Heading Character Reveal Animations
   (Matches Intro Page Staggered Down-to-Up Reveal)
   ========================================= */
function splitHeadingIntoChars(el) {
    if (!el || el.dataset.charsSplit === 'true') return;
    el.dataset.charsSplit = 'true';

    const originalText = el.textContent.trim();
    if (!originalText) return;
    el.setAttribute('aria-label', originalText);

    let charCounter = 0;

    function processText(text) {
        const words = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        words.forEach(word => {
            if (/^\s+$/.test(word)) {
                const spaceSpan = document.createElement('span');
                spaceSpan.className = 'char-space';
                spaceSpan.innerHTML = '&nbsp;';
                fragment.appendChild(spaceSpan);
            } else if (word.length > 0) {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'char-word';
                for (let i = 0; i < word.length; i++) {
                    const charWrap = document.createElement('span');
                    charWrap.className = 'title-char-wrap';
                    const charSpan = document.createElement('span');
                    charSpan.className = 'title-char';
                    charSpan.style.setProperty('--i', charCounter++);
                    charSpan.textContent = word[i];
                    charWrap.appendChild(charSpan);
                    wordSpan.appendChild(charWrap);
                }
                fragment.appendChild(wordSpan);
            }
        });
        return fragment;
    }

    const childNodes = Array.from(el.childNodes);
    el.innerHTML = '';

    childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            el.appendChild(processText(node.textContent));
        } else if (node.nodeName === 'BR') {
            el.appendChild(document.createElement('br'));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            clone.appendChild(processText(node.textContent));
            el.appendChild(clone);
        }
    });
}

function initSectionHeadingAnimations() {
    const headings = document.querySelectorAll('.section-title, .footer-heading, .about-greeting-title');
    const tags = document.querySelectorAll('.section-tag, .footer-tag');

    // Split headings into animated character spans
    headings.forEach(h => splitHeadingIntoChars(h));

    // Mark tags for animation styling
    tags.forEach(t => t.classList.add('anim-tag'));

    if (!('IntersectionObserver' in window)) {
        headings.forEach(h => h.classList.add('title-revealed'));
        tags.forEach(t => t.classList.add('tag-revealed'));
        return;
    }

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    };

    const titleObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('title-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    headings.forEach(h => titleObserver.observe(h));

    const tagObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('tag-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    tags.forEach(t => tagObserver.observe(t));
}

/* =========================================
   Section Parts Staggered Scroll Reveal Animations
   ========================================= */
function initSectionPartsAnimation() {
    // 1. Grouped selectors where siblings get automatic staggered delays
    const siblingGroups = [
        { selector: '.project-glass-card', step: 0.18, base: 0.05 },
        { selector: '.journey-timeline-node', step: 0.12, base: 0.08 },
        { selector: '.faq-item', step: 0.07, base: 0.04 },
        { selector: '.skills-marquee-wrapper', step: 0.14, base: 0.06 },
        { selector: '.project-card', step: 0.1, base: 0.05 }
    ];

    siblingGroups.forEach(group => {
        const items = document.querySelectorAll(group.selector);
        items.forEach((item, idx) => {
            item.classList.add('scroll-part');
            item.style.setProperty('--part-delay', `${(group.base + (idx % 6) * group.step).toFixed(2)}s`);
        });
    });

    // 2. Singular content blocks that glide in as distinct parts
    const individualParts = [
        { sel: '.about-hero-photo-wrap', delay: '0s' },
        { sel: '.about-hero-headline', delay: '0.08s' },
        { sel: '.about-bio-text', delay: '0.16s' },
        { sel: '.about-action-row', delay: '0.24s' },
        { sel: '#skills .section-desc, #skills .section-header p', delay: '0.04s' },
        { sel: '#education .section-header p', delay: '0.04s' },
        { sel: '.journey-timeline-line', delay: '0.02s' },
        { sel: '#certifications .section-header p', delay: '0.04s' },
        { sel: '.cert-card-premium', delay: '0.08s' },
        { sel: '#featured-projects .section-desc', delay: '0.04s' },
        { sel: '.view-all-projects-btn', delay: '0.22s' },
        { sel: '.faq-subtitle', delay: '0.04s' },
        { sel: '.footer-subtext', delay: '0.04s' },
        { sel: '.contact-card-new', delay: '0.12s' },
        { sel: '.footer-bottom', delay: '0.22s' },
        { sel: '.projects-filter', delay: '0.04s' }
    ];

    individualParts.forEach(item => {
        const els = document.querySelectorAll(item.sel);
        els.forEach(el => {
            el.classList.add('scroll-part');
            el.style.setProperty('--part-delay', item.delay);
        });
    });

    const allParts = document.querySelectorAll('.scroll-part');

    if (!('IntersectionObserver' in window)) {
        allParts.forEach(p => {
            p.classList.add('revealed', 'visible');
        });
        return;
    }

    const partObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                entry.target.classList.add('visible');
                // Clear delay after entrance completes so hover/focus reactions are instantaneous
                setTimeout(() => {
                    entry.target.style.transitionDelay = '0s';
                }, 1400);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    allParts.forEach(p => {
        partObserver.observe(p);
        const rect = p.getBoundingClientRect();
        if (rect.top < window.innerHeight - 30) {
            p.classList.add('revealed', 'visible');
        }
    });
}

let heroCloudsInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize intro preloader
    initIntroPreloader();

    // Initialize FAQ Accordion
    initFaqAccordion();

    // Initialize Dynamic Mobile Navigation
    initMobileMenu();

    // Initialize Section Heading Character Reveal Animations
    initSectionHeadingAnimations();

    // Initialize Staggered Scroll Animations for All Section Parts
    initSectionPartsAnimation();

    // Initialize Hero Steam Train & Swaying Trees Scene
    initHeroTrain();

    // Initialize Hero Snow / Star Particle Effect
    initHeroSnow();

    // Initialize Hero Real Hills & Clouds Engine
    initHeroHills();

    // Initialize Animated Brand Logo Replay Interaction
    initAnimatedBrandLogo();

    /* =========================================
       Scroll Reveal Animation (Sections Only)
       ========================================= */
    const sections = document.querySelectorAll('section, footer');

    const revealSection = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Trigger any headings & tags inside this section
                const headings = entry.target.querySelectorAll('.section-title, .footer-heading, .about-greeting-title');
                headings.forEach(h => h.classList.add('title-revealed'));
                const tags = entry.target.querySelectorAll('.section-tag, .footer-tag');
                tags.forEach(t => t.classList.add('tag-revealed'));
                const parts = entry.target.querySelectorAll('.scroll-part');
                parts.forEach(p => p.classList.add('revealed'));
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
       Glassy Dock Tooltip Interaction (Touch + Pointer)
       ========================================= */
    const dockTooltipItems = document.querySelectorAll('.glassy-nav [data-tooltip]');
    let dockTooltipTimer = null;

    dockTooltipItems.forEach(item => {
        const triggerTooltip = () => {
            dockTooltipItems.forEach(i => i.classList.remove('tooltip-active'));
            item.classList.add('tooltip-active');
            if (dockTooltipTimer) clearTimeout(dockTooltipTimer);
            dockTooltipTimer = setTimeout(() => {
                item.classList.remove('tooltip-active');
            }, 1800);
        };

        item.addEventListener('touchstart', triggerTooltip, { passive: true });
        item.addEventListener('pointerenter', () => {
            item.classList.add('tooltip-active');
        });
        item.addEventListener('pointerleave', () => {
            item.classList.remove('tooltip-active');
        });
    });

    document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.glassy-nav')) {
            dockTooltipItems.forEach(i => i.classList.remove('tooltip-active'));
        }
    }, { passive: true });

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
       Glassy Dock Navigation & Back to Top
       (Show dock ONLY after user scrolls past hero section)
       ========================================= */
    const glassyNavContainer = document.querySelector('.glassy-nav-container');
    const backToTopBtn = document.querySelector('.back-to-top');
    const heroSection = document.getElementById('home') || document.querySelector('.hero-editorial-section');

    const updateDockAndBackToTop = () => {
        const scrollPos = window.scrollY || document.documentElement.scrollTop;

        // Determine if user has scrolled past the hero section
        let isPastHero = false;
        if (heroSection) {
            const heroHeight = heroSection.offsetHeight;
            // Dock appears smoothly as user leaves hero (past ~65% of hero height)
            isPastHero = scrollPos >= (heroHeight * 0.65);
        } else {
            // On subpages without a hero, show when scrolled past top header
            isPastHero = scrollPos > 80;
        }

        if (glassyNavContainer) {
            glassyNavContainer.classList.toggle('dock-visible', isPastHero);
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('visible', scrollPos > 300);
        }
    };

    window.addEventListener('scroll', updateDockAndBackToTop, { passive: true });
    window.addEventListener('resize', updateDockAndBackToTop, { passive: true });
    window.addEventListener('load', updateDockAndBackToTop);
    document.addEventListener('DOMContentLoaded', updateDockAndBackToTop);
    updateDockAndBackToTop();

    if (backToTopBtn) {
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

    // Initialize theme based on local storage (default is dark mode)
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "light") {
        document.body.classList.remove("dark-theme");
    } else {
        document.body.classList.add("dark-theme"); // Default mode is dark
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

        if (heroHillsInstance && typeof heroHillsInstance.setMode === 'function') {
            heroHillsInstance.setMode(isDark ? 'night' : 'day');
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
       Smooth Manual Swiper for Featured Projects
       ========================================= */
    function initFeaturedProjectsSlider() {
        const sliderWrapper = document.querySelector('.featured-projects-slider-wrapper');
        const sliderTrack = document.querySelector('.featured-projects-slider');
        if (!sliderWrapper || !sliderTrack) return;

        // Clean up any cloned elements from previous sessions
        const clones = sliderTrack.querySelectorAll('[aria-hidden="true"]');
        clones.forEach(c => c.remove());
        delete sliderTrack.dataset.cloned;

        let isDragging = false;
        let startX = 0;
        let scrollStart = 0;
        let dragDist = 0;

        // Mouse Drag Support
        sliderWrapper.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragDist = 0;
            startX = e.pageX - sliderWrapper.offsetLeft;
            scrollStart = sliderWrapper.scrollLeft;
            sliderWrapper.classList.add('is-dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const x = e.pageX - sliderWrapper.offsetLeft;
            const walk = (x - startX) * 1.4;
            dragDist += Math.abs(walk);
            sliderWrapper.scrollLeft = scrollStart - walk;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                sliderWrapper.classList.remove('is-dragging');
            }
        });

        // Touch Swipe Support (Mobile & Tablet)
        sliderWrapper.addEventListener('touchstart', (e) => {
            isDragging = true;
            dragDist = 0;
            startX = e.touches[0].pageX - sliderWrapper.offsetLeft;
            scrollStart = sliderWrapper.scrollLeft;
        }, { passive: true });

        sliderWrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const x = e.touches[0].pageX - sliderWrapper.offsetLeft;
            const walk = (x - startX) * 1.4;
            dragDist += Math.abs(walk);
            sliderWrapper.scrollLeft = scrollStart - walk;
        }, { passive: true });

        sliderWrapper.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Prevent accidental link opening while dragging
        sliderWrapper.addEventListener('click', (e) => {
            if (dragDist > 10) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }

    initFeaturedProjectsSlider();

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

/* =========================================
   Hero Steam Train & Swaying Trees Curve
   ========================================= */
function wheelSVG(cx, cy, r, spokes) {
    let s = `<g transform="translate(${cx} ${cy})"><g class="rot" data-r="${r}">` +
        `<circle class="train-wheel-rim" r="${r}" fill="#0a1128"/>` +
        `<circle class="train-wheel-disc" r="${r - 2.6}" fill="url(#whiteG)"/>` +
        `<circle class="train-spoke-ring" r="${r - 4.6}" fill="none" stroke="#1e40af" stroke-width=".8"/>`;
    for (let i = 0; i < spokes; i++) {
        s += `<line class="train-spoke" y2="${-(r - 3)}" stroke="#1e40af" stroke-width="${r > 10 ? 1.7 : 1.1}" transform="rotate(${i * 360 / spokes})"/>`;
    }
    return s + `<circle class="train-wheel-hub" r="${r * 0.28}" fill="url(#goldG)" stroke="#a96d10" stroke-width=".8"/>` +
        `<circle class="train-wheel-pin" r="${r * 0.1}" fill="#e8631c"/></g></g>`;
}

function locoSVG() {
    let s = '<polygon class="train-beam" points="96,-46 330,-70 330,-12" fill="url(#beamG)" opacity=".45"/>';
    s += '<rect class="train-chassis" x="-80" y="-27" width="198" height="9" rx="2" fill="#0a1128"/>';
    s += '<rect class="train-boiler" x="0" y="-55" width="86" height="29" rx="9" fill="url(#whiteG)"/>';
    s += '<rect class="train-band" x="16" y="-55" width="3" height="29" fill="#f59e0b"/>' +
         '<rect class="train-band" x="42" y="-55" width="3" height="29" fill="#f59e0b"/>' +
         '<rect class="train-band" x="64" y="-55" width="3" height="29" fill="#f59e0b"/>' +
         '<rect class="train-highlight" x="6" y="-52" width="72" height="4" rx="2" fill="#ffffff" opacity=".35"/>';
    s += '<rect class="train-smokebox" x="72" y="-55" width="20" height="29" rx="8" fill="#0c1e4c"/>' +
         '<rect class="train-band" x="72" y="-55" width="3" height="29" fill="#f59e0b"/>';
    s += '<path class="train-stack" d="M73 -55L76 -68L68 -77H94L86 -68L89 -55Z" fill="url(#whiteG)"/>' +
         '<rect class="train-cap" x="66" y="-81" width="30" height="5" rx="2.5" fill="url(#goldG)"/>';
    s += '<path class="train-dome" d="M26 -55Q26 -68 37 -68Q48 -68 48 -55Z" fill="url(#whiteG)" stroke="#1e40af" stroke-width=".8"/>' +
         '<circle class="train-finial" cx="37" cy="-71" r="3.2" fill="#f59e0b"/>';
    s += '<path class="train-dome" d="M50 -55Q50 -65 55 -65Q60 -65 60 -55Z" fill="url(#whiteG)" stroke="#a96d10" stroke-width=".7"/>' +
         '<circle class="train-finial" cx="55" cy="-66.5" r="1.6" fill="#f59e0b"/>';
    s += '<rect class="train-cab-neck" x="-8" y="-56" width="14" height="30" fill="url(#whiteG)"/>';
    s += '<rect class="train-cab-body" x="-68" y="-70" width="64" height="44" rx="3" fill="url(#whiteG)"/>' +
         '<rect class="train-cab-roof" x="-75" y="-79" width="78" height="10" rx="3.5" fill="#0a1532"/>' +
         '<rect class="train-cab-gutter" x="-75" y="-79" width="78" height="3" rx="1.5" fill="#f59e0b"/>' +
         '<rect class="train-cab-trim" x="-68" y="-31" width="64" height="3" fill="#f59e0b"/>';
    s += '<path class="train-window" d="M-60 -36V-54Q-60 -63 -52 -63Q-44 -63 -44 -54V-36Z" fill="url(#glassC)" stroke="#f59e0b" stroke-width="2"/>' +
         '<path class="train-window" d="M-36 -36V-54Q-36 -63 -28 -63Q-20 -63 -20 -54V-36Z" fill="url(#glassC)" stroke="#f59e0b" stroke-width="2"/>';
    s += '<path d="M-56 -56l5 -4l-1 12z" fill="#fff" opacity=".4"/>' +
         '<path d="M-32 -56l5 -4l-1 12z" fill="#fff" opacity=".4"/>';
    s += '<rect x="-14" y="-27.5" width="1" height="0" />' +
         '<rect class="train-cylinder" x="50" y="-30" width="26" height="12" rx="4" fill="url(#whiteG)" stroke="#1e40af" stroke-width=".8"/>';
    s += '<path class="train-cowcatcher-base" d="M90 -28H100L124 -4V0H98Z" fill="url(#whiteG)" stroke="#1e3a8a" stroke-width=".8"/>' +
         '<path class="train-cowcatcher-bars" d="M103 -22L112 -2M109 -24L118 -4" stroke="#3b82f6" stroke-width="1.2"/>';
    s += wheelSVG(-30, -17, 17, 12) + wheelSVG(4, -17, 17, 12) + wheelSVG(38, -17, 17, 12) + wheelSVG(78, -9, 9, 8);
    s += '<line class="rod" stroke="#bfdbfe" stroke-width="3.2" stroke-linecap="round"/>' +
         '<circle class="pin" r="2.4" fill="#f59e0b"/>' +
         '<circle class="pin" r="2.4" fill="#f59e0b"/>' +
         '<circle class="pin" r="2.4" fill="#f59e0b"/>';
    s += '<circle class="train-lamp-glow" cx="94" cy="-41" r="9" fill="url(#glowW)"/>' +
         '<circle class="train-lamp-lens" cx="92.5" cy="-41" r="4.6" fill="#fff8d6" stroke="#f59e0b" stroke-width="1.6"/>';
    return s;
}

function coachSVG() {
    let s = '<rect class="train-coupler" x="-64" y="-9" width="8" height="3" fill="#0a1128"/>' +
            '<rect class="train-coupler" x="56" y="-9" width="8" height="3" fill="#0a1128"/>';
    s += '<rect class="train-chassis" x="-56" y="-13" width="112" height="7" rx="1.5" fill="#0a1128"/>';
    s += '<rect class="train-coach-body" x="-54" y="-52" width="108" height="40" rx="2" fill="url(#creamG)" stroke="#1d4ed8" stroke-width=".8"/>';
    s += '<path class="train-roof" d="M-59 -50Q-59 -60 -49 -62H49Q59 -60 59 -50Z" fill="url(#roofG)"/>' +
         '<rect class="train-roof-trim" x="-60" y="-51" width="120" height="3.2" rx="1.6" fill="#0f172a"/>';
    [-34, 0, 34].forEach(x => { s += `<rect class="train-roof-vent" x="${x - 5}" y="-66" width="10" height="5" rx="1.6" fill="#1e293b"/>`; });
    for (let i = 0; i < 5; i++) {
        let x = -46 + i * 19.4;
        s += `<path class="train-window" d="M${x} -26V-39Q${x} -46 ${x + 6.5} -46Q${x + 13} -46 ${x + 13} -39V-26Z" fill="url(#glassC)" stroke="#f59e0b" stroke-width="1.4"/>` +
             `<rect class="train-sill" x="${x - 1.5}" y="-26" width="16" height="2.6" rx="1" fill="#f59e0b"/>` +
             `<path d="M${x + 1.5} -42l4 -3l-1 11z" fill="#fff" opacity=".4"/>`;
        s += `<path class="train-crest" d="M${x + 0.5} -15A6 6 0 0 1 ${x + 12.5} -15Z" fill="url(#goldG)" stroke="#2563eb" stroke-width="1.2"/>`;
    }
    s += '<rect class="train-bogie" x="-36" y="-10" width="24" height="5" rx="2" fill="#0a1128"/>' +
         '<rect class="train-bogie" x="12" y="-10" width="24" height="5" rx="2" fill="#0a1128"/>';
    s += wheelSVG(-30, -7, 7, 6) + wheelSVG(-18, -7, 7, 6) + wheelSVG(18, -7, 7, 6) + wheelSVG(30, -7, 7, 6);
    return s;
}

function treesSVG(P, total) {
    let seed = 11;
    function R() {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    }
    function pick(a) { return a[Math.floor(R() * a.length)]; }
    function tree(far) {
        let pine = R() < 0.6,
            h = (far ? 34 : 46) + R() * (far ? 34 : 60),
            w = h * (pine ? 0.5 : 0.66),
            s = '',
            c = far ? pick(['#2a4a66', '#2c5470', '#27425e']) : (pine ? pick(['#183d3a', '#1f4b44', '#14322f']) : pick(['#23554a', '#2a6252', '#1c463f']));
        s += `<rect x="${-w * 0.06}" y="${-h * 0.2}" width="${w * 0.12}" height="${h * 0.2}" fill="${far ? '#233a52' : '#2a1d18'}"/>`;
        if (pine) {
            [[-0.55, -0.1, 0.52], [-0.78, -0.3, 0.42], [-1, -0.55, 0.32]].forEach(t => {
                let a = t[0] * h, b = t[1] * h, hw = t[2] * w;
                s += `<polygon points="0,${a} ${-hw},${b} ${hw},${b}" fill="${c}"/><polygon points="0,${a} 0,${b} ${hw},${b}" fill="#fff" opacity=".07"/>`;
            });
        } else {
            s += `<circle cx="0" cy="${-h * 0.62}" r="${w * 0.5}" fill="${c}"/><circle cx="${-w * 0.3}" cy="${-h * 0.46}" r="${w * 0.36}" fill="${c}"/><circle cx="${w * 0.3}" cy="${-h * 0.48}" r="${w * 0.36}" fill="${c}"/><circle cx="${w * 0.14}" cy="${-h * 0.7}" r="${w * 0.3}" fill="#fff" opacity=".07"/>`;
        }
        return s;
    }
    let out = '';
    [[true, 26, 40, -6], [false, 40, 56, 3]].forEach(L => {
        for (let d = 30; d < total - 30; d += L[1] + R() * L[2]) {
            let p = P(d);
            out += `<g transform="translate(${p.x.toFixed(1)} ${(p.y + L[3]).toFixed(1)})"><g class="tree" style="animation-delay:-${(R() * 5).toFixed(2)}s">${tree(L[0])}</g></g>`;
        }
    });
    return out;
}

function initHeroTrain() {
    const track = document.getElementById('hero-track');
    if (!track) return;
    const train = document.getElementById('hero-train');
    const steam = document.getElementById('hero-steam');
    const trees = document.getElementById('hero-trees');
    const NS = "http://www.w3.org/2000/svg";
    if (!train || !steam || !trees) return;

    const total = track.getTotalLength();
    trees.innerHTML = treesSVG(s => track.getPointAtLength(s), total);

    const S = 0.9, SPEED = 165;
    let last = 0, pos = 120, cars = [], puffs = [], acc = 0;

    [['loco', 0, 106], ['coach', 140, 60], ['coach', 262, 60], ['coach', 384, 60]].forEach(d => {
        const g = document.createElementNS(NS, 'g');
        g.innerHTML = d[0] === 'loco' ? locoSVG() : coachSVG();
        train.appendChild(g);
        cars.push({
            g: g,
            off: d[1] * S,
            span: d[2] * S,
            loco: d[0] === 'loco',
            rots: [].slice.call(g.querySelectorAll('.rot')),
            rod: g.querySelector('.rod'),
            pins: [].slice.call(g.querySelectorAll('.pin'))
        });
    });

    function P(s) {
        return track.getPointAtLength(Math.min(Math.max(s, 0), total));
    }

    function place(c, s, t, spawn) {
        const cs = s - c.off, a = P(cs), b = P(cs + c.span);
        const ang = Math.atan2(b.y - a.y, b.x - a.x), deg = ang * 57.2958, w = pos / S;
        c.g.setAttribute('transform', `translate(${a.x} ${a.y + Math.sin(t / 60 + c.off) * 0.3}) rotate(${deg}) scale(${S}) translate(30 0)`);
        c.g.style.display = (cs < -300 || cs > total + 300) ? 'none' : '';
        c.rots.forEach(r => {
            r.setAttribute('transform', `rotate(${w / r.getAttribute('data-r') * 57.2958})`);
        });
        if (c.loco) {
            const q = w / 17, cx = Math.cos(q) * 8, cy = Math.sin(q) * 8, xs = [-30, 4, 38];
            c.rod.setAttribute('x1', xs[0] + cx);
            c.rod.setAttribute('y1', -17 + cy);
            c.rod.setAttribute('x2', xs[2] + cx);
            c.rod.setAttribute('y2', -17 + cy);
            c.pins.forEach((p, i) => {
                p.setAttribute('cx', xs[i] + cx);
                p.setAttribute('cy', -17 + cy);
            });
            if (spawn) {
                const u = S * 110, v = S * -82;
                puff(a.x + u * Math.cos(ang) - v * Math.sin(ang), a.y + u * Math.sin(ang) + v * Math.cos(ang));
            }
        }
    }

    function puff(x, y) {
        const g = document.createElementNS(NS, 'g');
        const isDark = document.body.classList.contains('dark-theme');
        const k = [[0, 0, 1], [-7, 3, 0.8], [6, 2, 0.75]].map(o => {
            const e = document.createElementNS(NS, 'circle');
            e.setAttribute('class', 'train-steam-circle');
            e.setAttribute('fill', isDark ? '#f4f6fa' : '#ffffff');
            if (!isDark) {
                e.setAttribute('stroke', 'rgba(65, 105, 225, 0.20)');
                e.setAttribute('stroke-width', '0.6');
            }
            g.appendChild(e);
            return { e, o };
        });
        steam.appendChild(g);
        puffs.push({ g, k, x, y, age: 0, vx: -12 - Math.random() * 10, vy: -26 - Math.random() * 10 });
    }

    function frame(t) {
        const dt = Math.min((t - last) / 1000, 0.05);
        last = t;
        pos += SPEED * dt;
        acc += dt;
        const isNarrow = window.innerWidth < 768;
        const resetMax = isNarrow ? total + 260 : total + 500;
        const resetMin = isNarrow ? -200 : -450;
        if (pos > resetMax) pos = resetMin;
        const spawn = acc > 0.16 && pos > -100 && pos < total + 100;
        if (spawn) acc = 0;
        cars.forEach(c => { place(c, pos, t, spawn); });
        for (let i = puffs.length - 1; i >= 0; i--) {
            const p = puffs[i];
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const l = p.age / 2.4;
            if (l >= 1) {
                steam.removeChild(p.g);
                puffs.splice(i, 1);
                continue;
            }
            p.k.forEach(k => {
                k.e.setAttribute('cx', p.x + k.o[0] * (1 + l));
                k.e.setAttribute('cy', p.y + k.o[1]);
                k.e.setAttribute('r', (6 + l * 16) * k.o[2]);
            });
            p.g.setAttribute('opacity', (0.9 * (1 - l * l)).toFixed(2));
        }
        requestAnimationFrame(frame);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pos = total * 0.55;
        cars.forEach(c => { place(c, pos, 0, false); });
    } else {
        requestAnimationFrame(frame);
    }
}

/* =========================================
   Hero Snow / Star Particle Effect
   ========================================= */
function initHeroSnow() {
    const canvas = document.getElementById('hero-snow-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const section = canvas.closest('.hero-editorial-section') || canvas.parentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speedScale = prefersReducedMotion ? 0.35 : 1.0;

    let W = 0, H = 0;
    let dpr = 1;
    let particles = [];
    let rafId = null;

    function resize() {
        const rect = section ? section.getBoundingClientRect() : null;
        W = (rect && rect.width > 0) ? rect.width : (section && section.offsetWidth > 0 ? section.offsetWidth : window.innerWidth);
        H = (rect && rect.height > 0) ? rect.height : (section && section.offsetHeight > 0 ? section.offsetHeight : (window.innerHeight || 800));
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
    }

    function makeParticle(initial) {
        const isStar = Math.random() < 0.28;
        return {
            type      : isStar ? 'star' : 'dot',
            x         : Math.random() * (W || window.innerWidth),
            y         : initial ? Math.random() * (H || window.innerHeight) : -15 - Math.random() * 30,
            r         : isStar ? 1.6 + Math.random() * 2.2 : 1.2 + Math.random() * 2.6,
            speed     : (0.65 + Math.random() * 0.95) * speedScale,
            swayAmp   : 0.5 + Math.random() * 0.8,
            swaySpeed : 0.012 + Math.random() * 0.018,
            drift     : (Math.random() - 0.5) * 0.35,
            alpha     : 0.55 + Math.random() * 0.42,
            twinkle   : 0.01 + Math.random() * 0.02,
            phase     : Math.random() * Math.PI * 2,
            rot       : Math.random() * Math.PI * 2,
            rotSpeed  : (Math.random() - 0.5) * 0.018,
        };
    }

    function drawStar(cx, cy, r, rot) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        const pts = 4, inner = r * 0.38;
        for (let i = 0; i < pts * 2; i++) {
            const angle = (i * Math.PI) / pts - Math.PI / 2;
            const radius = i % 2 === 0 ? r : inner;
            i === 0
                ? ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
                : ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function init() {
        resize();
        const count = (W < 768) ? 65 : 110;
        particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function frame() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const isDark = document.body.classList.contains('dark-theme');

        particles.forEach(p => {
            p.phase += p.swaySpeed;
            p.x += Math.sin(p.phase) * p.swayAmp + p.drift;
            p.y += p.speed;
            p.rot += p.rotSpeed;

            const twinkledAlpha = Math.min(1, Math.max(0.2, p.alpha * (0.75 + 0.25 * Math.sin(p.phase))));

            if (p.y > H + 20) {
                Object.assign(p, makeParticle(false));
                p.x = Math.random() * W;
            }
            if (p.x < -20) p.x = W + 10;
            if (p.x > W + 20) p.x = -10;

            ctx.globalAlpha = twinkledAlpha;

            if (isDark) {
                ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
                ctx.shadowBlur = p.r > 2.2 ? 5 : 2;
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.shadowColor = 'rgba(65, 105, 225, 0.45)';
                ctx.shadowBlur = p.r > 2 ? 4 : 2;
                ctx.fillStyle = p.type === 'star' ? 'rgba(50, 95, 215, 0.95)' : 'rgba(65, 105, 225, 0.85)';
            }

            if (p.type === 'star') {
                drawStar(p.x, p.y, p.r, p.rot);
            } else {
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                if (isDark) {
                    grad.addColorStop(0,   'rgba(255, 255, 255, 1)');
                    grad.addColorStop(0.7, 'rgba(220, 235, 255, 0.85)');
                    grad.addColorStop(1,   'rgba(200, 220, 255, 0)');
                } else {
                    grad.addColorStop(0,   'rgba(55, 95, 215, 1)');
                    grad.addColorStop(0.65,'rgba(75, 120, 235, 0.7)');
                    grad.addColorStop(1,   'rgba(100, 150, 255, 0)');
                }
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        rafId = requestAnimationFrame(frame);
    }

    // Pause when hero is scrolled out of view (saves GPU)
    if ('IntersectionObserver' in window && section) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    if (!rafId) rafId = requestAnimationFrame(frame);
                } else {
                    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                }
            });
        }, { threshold: 0 });
        observer.observe(section);
    }

    window.addEventListener('resize', () => {
        resize();
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(resize, 100);
    });

    init();
    rafId = requestAnimationFrame(frame);
}

/* =========================================
   Animated Brand Logo Interaction
   ========================================= */
function triggerBrandLogoAnimation() {
    const svgs = document.querySelectorAll('.hero-brand-svg');
    svgs.forEach(svg => {
        svg.classList.remove('play');
        void svg.offsetWidth;
        svg.classList.add('play');
    });
}

function initAnimatedBrandLogo() {
    // Re-play animation when the brand logo is clicked
    const brandLinks = document.querySelectorAll('.hero-editorial-brand');
    brandLinks.forEach(brand => {
        brand.addEventListener('click', () => {
            triggerBrandLogoAnimation();
        });
    });
    // NOTE: The initial play is triggered exclusively by dismissCurtain()
    // so the animation only runs once — after the intro curtain opens.
}

/* =========================================
   Procedural Real Hills & Drifting Clouds Engine
   (Integrated from Real Hills into Hero)
   ========================================= */
let heroHillsInstance = null;

function initHeroHills() {
    const cv = document.getElementById('hero-hills-canvas');
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const section = cv.closest('.hero-editorial-section') || cv.parentElement;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const P = {
        day: {
            sky: [[0, '#ffffff'], [0.35, '#edf5fe'], [0.7, '#c6ddf7'], [1, '#eaf4fb']],
            sun: [0.74, 0.26, '255,246,218'],
            hill: ['#a7bfd8', '#8aaac6', '#74a08e', '#55904f', '#3e7c36', '#2a602b'],
            haze: '#d3e4f2',
            cloud: '255,255,255',
            vignette: 0
        },
        night: {
            sky: [[0, '#060a14'], [0.45, '#0e1832'], [0.8, '#18274d'], [1, '#223666']],
            sun: [0.8, 0.32, '210,230,255'],
            hill: ['#3b4860', '#2d3b50', '#233042', '#1a2535', '#121c2a', '#0a111b'],
            haze: '#0e1830',
            cloud: '190,210,240',
            vignette: 0.28
        }
    };

    function Rn(s) {
        return function() {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function rgb(h) {
        return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    }

    function mix(a, b, t) {
        const x = rgb(a), y = rgb(b);
        return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')';
    }

    function mk(w, h) {
        const c = document.createElement('canvas');
        c.width = Math.ceil(w);
        c.height = Math.ceil(h);
        return c;
    }

    // Lowered hill anchors to keep text in clear sky
    const Y0 = [0.52, 0.59, 0.66, 0.73, 0.81, 0.90];
    const AM = [0.065, 0.07, 0.075, 0.085, 0.09, 0.07];
    const SP = [1.6, 3.2, 5.8, 10, 17, 28];

    let S = null;
    let animId = null;
    const t0 = performance.now();

    function make(tod) {
        const D = Math.min(window.devicePixelRatio || 1, 1.5);
        const rect = section ? section.getBoundingClientRect() : null;
        const W = Math.round((rect && rect.width > 0) ? rect.width : (cv.clientWidth || window.innerWidth));
        const H = Math.round((rect && rect.height > 0) ? rect.height : (cv.clientHeight || window.innerHeight || 800));
        const p = P[tod] || P.day;
        const Wt = Math.max(1100, Math.round(W * 1.25));

        const isPortrait = H > W * 1.05 || W < 650;
        const Y0 = isPortrait
            ? [0.63, 0.69, 0.75, 0.81, 0.87, 0.93]
            : [0.52, 0.59, 0.66, 0.73, 0.81, 0.90];
        const AM = isPortrait
            ? [0.034, 0.038, 0.044, 0.050, 0.054, 0.042]
            : [0.065, 0.07, 0.075, 0.085, 0.09, 0.07];

        cv.width = Math.round(W * D);
        cv.height = Math.round(H * D);

        const state = { D, W, H, Wt, p, L: [], cl: [], Y0, AM, isPortrait };
        const dir = p.sun[0] > 0.5 ? 1 : -1;
        const R = Rn(7);

        // Sky
        const sk = mk(W * D, H * D);
        const g = sk.getContext('2d');
        g.scale(D, D);
        const gr = g.createLinearGradient(0, 0, 0, H * 0.65);
        p.sky.forEach(s => gr.addColorStop(s[0], s[1]));
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);

        const sx = p.sun[0] * W, sy = p.sun[1] * H;
        const rg = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.75);
        rg.addColorStop(0, 'rgba(' + p.sun[2] + ',.95)');
        rg.addColorStop(0.06, 'rgba(' + p.sun[2] + ',.55)');
        rg.addColorStop(0.3, 'rgba(' + p.sun[2] + ',.16)');
        rg.addColorStop(1, 'rgba(' + p.sun[2] + ',0)');
        g.fillStyle = rg;
        g.fillRect(0, 0, W, H);
        state.sky = sk;

        // Clouds (adapted for mobile portrait)
        for (let k = 0; k < 7; k++) {
            const cw = (isPortrait ? 180 : 260) + R() * (isPortrait ? 220 : 340);
            const ch = cw * 0.34;
            const c = mk(cw * D, ch * D);
            const q = c.getContext('2d');
            q.scale(D, D);
            for (let b = 0; b < 46; b++) {
                const x = cw * (0.5 + (R() + R() + R() - 1.5) * 0.3);
                const y = ch * (0.58 + (R() - 0.5) * 0.28);
                const r = ch * (0.12 + R() * 0.26);
                const m = q.createRadialGradient(x, y, 0, x, y, r);
                m.addColorStop(0, 'rgba(' + p.cloud + ',.22)');
                m.addColorStop(1, 'rgba(' + p.cloud + ',0)');
                q.fillStyle = m;
                q.fillRect(x - r, y - r, r * 2, r * 2);
            }
            const cloudY = isPortrait ? H * (0.04 + R() * 0.18) : H * (0.07 + R() * 0.26);
            state.cl.push({ c, w: cw, h: ch, x: R() * (W + cw), y: cloudY, v: 4 + R() * 7 });
        }

        // Hills
        for (let i = 0; i < 6; i++) {
            const y0 = Y0[i] * H, am = AM[i] * H;
            const ph = [], fr = [1, 2, 3, 5, 8, 13, 21, 34], ap = [];
            let tot = 0;
            const r = Rn(100 + i * 13);
            const ys = new Float32Array(Wt + 16);

            for (let o = 0; o < (i < 2 ? 6 : fr.length); o++) {
                ph.push(r() * 6.283);
                ap.push(Math.pow(0.56, o));
                tot += ap[o];
            }
            for (let x = 0; x < Wt + 16; x++) {
                let s = 0;
                for (let o = 0; o < ph.length; o++) {
                    s += ap[o] * Math.sin(6.2832 * fr[o] * (x % Wt) / Wt + ph[o]);
                }
                ys[x] = y0 - am * (s / tot * 1.6);
            }

            const base = p.hill[i];
            const lc = mk(Wt * D, H * D);
            const a = lc.getContext('2d');
            a.scale(D, D);
            const top = y0 - am * 1.6;
            const gg = a.createLinearGradient(0, top, 0, H);
            gg.addColorStop(0, mix(base, '#ffffff', i < 3 ? 0.1 : 0.04));
            gg.addColorStop(1, i < 3 ? mix(base, p.haze, 0.65) : mix(base, '#000000', 0.42));
            a.fillStyle = gg;
            a.beginPath();
            a.moveTo(0, H);
            for (let x = 0; x <= Wt; x++) a.lineTo(x, ys[x]);
            a.lineTo(Wt, H);
            a.closePath();
            a.fill();

            // Trees on hills
            if (i >= 2) {
                const f1 = r() * 6.28, f2 = r() * 6.28;
                const dk = mix(base, '#04120a', 0.55);
                const lt = mix(base, '#cfe89a', 0.25);
                const nt = Math.round(Wt * (isPortrait ? (0.35 + i * 0.22) : (0.5 + i * 0.35)));
                for (let j = 0; j < nt; j++) {
                    const tx = Math.floor(r() * Wt);
                    const mk2 = (Math.sin(6.283 * 5 * tx / Wt + f1) + Math.sin(6.283 * 11 * tx / Wt + f2)) / 2;
                    if (mk2 < 0.05) continue;
                    const dp = Math.pow(r(), 2.2) * (10 + i * 9);
                    const ty = ys[tx] + dp;
                    const ts = (1.6 + i * 1.05) * (0.65 + r() * 0.7) * (1 + dp / 160);
                    a.fillStyle = r() < 0.5 ? dk : mix(base, '#06180c', 0.4 + r() * 0.2);
                    if (r() < 0.62) {
                        a.beginPath();
                        a.moveTo(tx, ty - ts * 3.1);
                        a.lineTo(tx - ts * 0.75, ty);
                        a.lineTo(tx + ts * 0.75, ty);
                        a.fill();
                        a.fillStyle = lt;
                        a.globalAlpha = 0.22;
                        a.beginPath();
                        a.moveTo(tx, ty - ts * 3.1);
                        a.lineTo(tx + dir * ts * 0.75, ty);
                        a.lineTo(tx, ty);
                        a.fill();
                        a.globalAlpha = 1;
                    } else {
                        a.beginPath();
                        a.ellipse(tx, ty - ts * 0.9, ts * 0.85, ts * 0.95, 0, 0, 6.3);
                        a.fill();
                        a.fillStyle = lt;
                        a.globalAlpha = 0.2;
                        a.beginPath();
                        a.ellipse(tx + dir * ts * 0.3, ty - ts * 1.15, ts * 0.5, ts * 0.5, 0, 0, 6.3);
                        a.fill();
                        a.globalAlpha = 1;
                    }
                }
            }

            // Slope lighting
            const sc = mk(Wt * D, H * D);
            const h = sc.getContext('2d');
            h.scale(D, D);
            const len = 70 + i * 30;
            for (let x = 0; x < Wt; x++) {
                const sl = (ys[(x + 12) % Wt] - ys[(x + Wt - 12) % Wt]) / 24 * dir;
                h.fillStyle = sl > 0 ? 'rgba(255,240,200,' + Math.min(0.5, sl * 0.4) + ')' : 'rgba(8,16,40,' + Math.min(0.6, -sl * 0.5) + ')';
                h.fillRect(x, ys[x], 1.3, len);
            }
            h.globalCompositeOperation = 'destination-in';
            const mg = h.createLinearGradient(0, top, 0, top + am * 3.2 + len);
            mg.addColorStop(0, '#000');
            mg.addColorStop(1, 'rgba(0,0,0,0)');
            h.fillStyle = mg;
            h.fillRect(0, 0, Wt, H);
            a.globalCompositeOperation = 'source-atop';
            a.drawImage(sc, 0, 0, Wt, H);

            // Grass textures
            if (i >= 2) {
                const n = Wt * (i - 1) * 0.7;
                for (let j = 0; j < n; j++) {
                    const gx = r() * Wt, gy = ys[Math.floor(gx)] + Math.pow(r(), 1.6) * (60 + i * 40), l = 2 + r() * (2 + i);
                    a.strokeStyle = r() < 0.5 ? mix(base, '#0a1a08', 0.5) : mix(base, '#e8f2b0', 0.35);
                    a.globalAlpha = 0.22;
                    a.lineWidth = 0.8;
                    a.beginPath();
                    a.moveTo(gx, gy);
                    a.lineTo(gx + (r() - 0.5) * 2, gy - l);
                    a.stroke();
                }
                a.globalAlpha = 1;
            }
            a.globalCompositeOperation = 'source-over';
            state.L.push({ c: lc, y0, v: SP[i] });
        }
        return state;
    }

    function draw(state, t) {
        if (!state) return;
        const { D, W, H, p } = state;
        cx.setTransform(D, 0, 0, D, 0, 0);
        cx.drawImage(state.sky, 0, 0, W, H);

        state.cl.forEach(q => {
            const x = ((q.x + t * q.v) % (W + q.w)) - q.w;
            cx.drawImage(q.c, x, q.y, q.w, q.h);
        });

        state.L.forEach((l, i) => {
            const off = (t * l.v) % state.Wt;
            cx.drawImage(l.c, -off, 0, state.Wt, H);
            cx.drawImage(l.c, state.Wt - off, 0, state.Wt, H);
            if (i < 5) {
                const nextY = (state.Y0[i + 1] !== undefined ? state.Y0[i + 1] : 1) * H + H * 0.03;
                const f = cx.createLinearGradient(0, l.y0, 0, nextY);
                const c = rgb(p.haze).join(',');
                f.addColorStop(0, 'rgba(' + c + ',0)');
                f.addColorStop(1, 'rgba(' + c + ',' + (0.5 - i * 0.07) + ')');
                cx.fillStyle = f;
                cx.fillRect(0, l.y0 - H * 0.1, W, H);
            }
        });

        if (p.vignette > 0) {
            const v = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.85);
            v.addColorStop(0, 'rgba(0,0,0,0)');
            v.addColorStop(1, 'rgba(0,0,0,' + p.vignette + ')');
            cx.fillStyle = v;
            cx.fillRect(0, 0, W, H);
        }
    }

    function currentMode() {
        return document.body.classList.contains('dark-theme') ? 'night' : 'day';
    }

    function rebuild(mode) {
        S = make(mode || currentMode());
        if (still) draw(S, 20);
    }

    function loop(n) {
        if (!document.hidden) {
            draw(S, (n - t0) / 1000 + 20);
        }
        animId = requestAnimationFrame(loop);
    }

    rebuild();
    if (still) {
        draw(S, 20);
    } else {
        animId = requestAnimationFrame(loop);
    }

    let rz;
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
        clearTimeout(rz);
        rz = setTimeout(() => {
            const curW = window.innerWidth;
            if (Math.abs(curW - lastW) > 10 || Math.abs(window.innerHeight - (S ? S.H : 0)) > 120) {
                lastW = curW;
                rebuild();
            }
        }, 180);
    });

    heroHillsInstance = {
        rebuild: rebuild,
        setMode: (mode) => { rebuild(mode); }
    };
    window.heroHills = heroHillsInstance;
}

