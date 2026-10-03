/**
 * Om Patel Portfolio - Projects Page Scripts (projects.js)
 * High-performance, clean, modular script strictly for projects.html
 */

(function () {
    'use strict';

    /* =========================================
       1. Theme Toggle & State Synchronization
       ========================================= */
    function initTheme() {
        const themeToggles = document.querySelectorAll(
            '.theme-toggle-btn, #theme-toggle, #theme-toggle-dock, #theme-toggle-header, #mobile-theme-toggle'
        );
        const mobileThemeLabel = document.querySelector('.mobile-theme-label');

        const updateThemeUI = (isDark) => {
            themeToggles.forEach(toggle => {
                const icon = toggle.querySelector('.theme-icon') || toggle.querySelector('i');
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

            if (mobileThemeLabel) {
                mobileThemeLabel.textContent = isDark ? "Light Mode" : "Dark Mode";
            }
        };

        const toggleTheme = () => {
            const isDarkNow = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
            updateThemeUI(isDarkNow);
        };

        // Attach listeners
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        });

        // Initialize icons to match initial body state
        const initialIsDark = document.body.classList.contains('dark-theme');
        updateThemeUI(initialIsDark);
    }

    /* =========================================
       2. Dynamic Mobile Navigation Drawer Overlay
       ========================================= */
    function initMobileMenu() {
        const mobileMenuToggles = document.querySelectorAll('#mobile-menu-toggle');
        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        const mobileNavClose = document.getElementById('mobile-nav-close');
        const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');
        const mobileSearchInput = document.getElementById('mobile-nav-search');
        const desktopSearch = document.getElementById('nav-search');

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

        // Sync mobile search with desktop search
        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', () => {
                if (desktopSearch) {
                    desktopSearch.value = mobileSearchInput.value;
                }
                applySearchAndFilter();
            });

            mobileSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    closeMenu();
                }
            });
        }
    }

    /* =========================================
       3. Project Search & Category Filtering
       ========================================= */
    let applySearchAndFilter = () => {};

    function initProjectFiltering() {
        const projectCards = document.querySelectorAll('.project-card, .project-expanded-card');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const desktopSearch = document.getElementById('nav-search');
        const mobileSearch = document.getElementById('mobile-nav-search');

        applySearchAndFilter = () => {
            const activeBtn = document.querySelector('.filter-btn.active');
            const currentCategory = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

            const searchQuery = (desktopSearch ? desktopSearch.value : (mobileSearch ? mobileSearch.value : '')).toLowerCase().trim();

            let visibleCount = 0;

            projectCards.forEach(card => {
                if (card.dataset.timeoutId) {
                    clearTimeout(parseInt(card.dataset.timeoutId, 10));
                }
                if (card.dataset.fadeTimeoutId) {
                    clearTimeout(parseInt(card.dataset.fadeTimeoutId, 10));
                }

                const categories = (card.getAttribute('data-category') || '').split(' ');

                const titleEl = card.querySelector('.project-card-title') || card.querySelector('.project-ny-title');
                const title = titleEl ? titleEl.textContent.toLowerCase() : '';

                const descEl = card.querySelector('.project-card-desc') || card.querySelector('.project-ny-subtitle');
                const desc = descEl ? descEl.textContent.toLowerCase() : '';

                const tags = Array.from(card.querySelectorAll('.skill-badge, .meta-badge-text')).map(b => b.textContent.toLowerCase());

                const categoryMatches = currentCategory === 'all' || categories.includes(currentCategory);
                const searchMatches = searchQuery === '' ||
                    title.includes(searchQuery) ||
                    desc.includes(searchQuery) ||
                    categories.some(cat => cat.includes(searchQuery)) ||
                    tags.some(tag => tag.includes(searchQuery));

                const isVisible = categoryMatches && searchMatches;

                if (isVisible) {
                    card.style.display = '';
                    card.style.animation = 'none';
                    card.style.opacity = '0';
                    const delay = visibleCount * 60;
                    visibleCount++;
                    const tid = setTimeout(() => {
                        card.style.animation = `card-in 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`;
                    }, 10);
                    card.dataset.timeoutId = tid.toString();
                } else {
                    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    const ftid = setTimeout(() => {
                        card.style.display = 'none';
                        card.style.transform = '';
                    }, 200);
                    card.dataset.fadeTimeoutId = ftid.toString();
                }
            });
        };

        // Filter button clicks
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applySearchAndFilter();
            });
        });

        // Desktop search input listener
        if (desktopSearch) {
            desktopSearch.addEventListener('input', () => {
                if (mobileSearch) {
                    mobileSearch.value = desktopSearch.value;
                }
                applySearchAndFilter();
            });
        }

        // URL search param auto-populate
        const urlParams = new URLSearchParams(window.location.search);
        const initialSearch = urlParams.get('search');
        if (initialSearch) {
            if (desktopSearch) desktopSearch.value = initialSearch;
            if (mobileSearch) mobileSearch.value = initialSearch;
        }

        applySearchAndFilter();
    }

    /* =========================================
       4. Project Card Expand / Collapse Toggle
       ========================================= */
    window.toggleProjectExpand = function (trigger) {
        if (!trigger) return;
        const card = trigger.closest('.project-expanded-card') || trigger.closest('.project-card');
        if (card) {
            card.classList.toggle('expanded');
        }
    };

    function initProjectCardInteractions() {
        document.querySelectorAll('.project-expanded-card').forEach(card => {
            const headerRow = card.querySelector('.project-header-row');
            if (headerRow) {
                // Ensure clicking anywhere in header or toggle pills expands/collapses
                headerRow.addEventListener('click', (e) => {
                    // Avoid triggering if clicking an external link
                    if (e.target.closest('a')) return;
                    card.classList.toggle('expanded');
                });
            }
        });
    }

    /* =========================================
       5. Back to Top Button & Glassy Bottom Dock
       ========================================= */
    function initBackToTop() {
        const backToTopBtn = document.querySelector('.back-to-top');
        const glassyNavContainer = document.querySelector('.glassy-nav-container');

        if (!backToTopBtn) return;

        const handleScroll = () => {
            const isScrolled = window.scrollY > 300;
            backToTopBtn.classList.toggle('visible', isScrolled);
            if (glassyNavContainer) {
                glassyNavContainer.classList.toggle('dock-visible', window.scrollY > 80);
                glassyNavContainer.classList.toggle('dock-shrunk', isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Dock Tooltip touch & pointer interactions
        const dockTooltipItems = document.querySelectorAll('.glassy-nav [data-tooltip]');
        let dockTooltipTimer = null;

        dockTooltipItems.forEach(item => {
            item.addEventListener('touchstart', () => {
                dockTooltipItems.forEach(i => i.classList.remove('tooltip-active'));
                item.classList.add('tooltip-active');
                if (dockTooltipTimer) clearTimeout(dockTooltipTimer);
                dockTooltipTimer = setTimeout(() => {
                    item.classList.remove('tooltip-active');
                }, 1800);
            }, { passive: true });

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
    }

    /* =========================================
       6. Animated Brand Logo Replay Interaction
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
        const brandLinks = document.querySelectorAll('.hero-editorial-brand');
        brandLinks.forEach(brand => {
            brand.addEventListener('click', () => {
                triggerBrandLogoAnimation();
            });
        });

        // Trigger on load / refresh
        triggerBrandLogoAnimation();
    }

    /* =========================================
       DOMContentLoaded Initialization
       ========================================= */
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initMobileMenu();
        initProjectFiltering();
        initProjectCardInteractions();
        initBackToTop();
        initAnimatedBrandLogo();
    });
})();
