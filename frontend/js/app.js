/**
 * LA VOÛTE SAVOIE - Main JavaScript
 * Restaurant Gastronomique
 */

(function() {
    'use strict';

    // ==========================================================================
    // Configuration
    // ==========================================================================
    const CONFIG = {
        API_URL: '/api',
        SCROLL_OFFSET: 80,
        ANIMATION_THRESHOLD: 0.1
    };

    // ==========================================================================
    // DOM Elements
    // ==========================================================================
    const DOM = {
        preloader: document.getElementById('preloader'),
        header: document.getElementById('header'),
        navToggle: document.querySelector('.nav-toggle'),
        navMenu: document.querySelector('.nav-menu'),
        navLinks: document.querySelectorAll('.nav-link'),
        menuTabs: document.querySelectorAll('.menu-tab'),
        menuPanels: document.querySelectorAll('.menu-panel'),
        reservationForm: document.getElementById('reservation-form'),
        formStatus: document.getElementById('form-status'),
        dateInput: document.getElementById('date')
    };

    // ==========================================================================
    // Preloader
    // ==========================================================================
    function initPreloader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                DOM.preloader.classList.add('loaded');
                document.body.style.overflow = '';
            }, 500);
        });

        // Fallback: hide preloader after 3 seconds max
        setTimeout(() => {
            DOM.preloader.classList.add('loaded');
            document.body.style.overflow = '';
        }, 3000);
    }

    // ==========================================================================
    // Navigation
    // ==========================================================================
    function initNavigation() {
        // Mobile menu toggle
        if (DOM.navToggle) {
            DOM.navToggle.addEventListener('click', toggleMobileMenu);
        }

        // Close menu on link click
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
                updateActiveLink(link);
            });
        });

        // Header scroll effect
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                DOM.header.classList.add('scrolled');
            } else {
                DOM.header.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        }, { passive: true });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    smoothScrollTo(target);
                }
            });
        });

        // Update active link on scroll
        window.addEventListener('scroll', updateActiveNavOnScroll, { passive: true });
    }

    function toggleMobileMenu() {
        const isExpanded = DOM.navToggle.getAttribute('aria-expanded') === 'true';
        DOM.navToggle.setAttribute('aria-expanded', !isExpanded);
        DOM.navMenu.classList.toggle('active');
        document.body.style.overflow = isExpanded ? '' : 'hidden';
    }

    function closeMobileMenu() {
        DOM.navToggle.setAttribute('aria-expanded', 'false');
        DOM.navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateActiveLink(activeLink) {
        DOM.navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    function updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.pageYOffset + CONFIG.SCROLL_OFFSET + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                DOM.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    function smoothScrollTo(target) {
        const targetPosition = target.offsetTop - CONFIG.SCROLL_OFFSET;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // ==========================================================================
    // Menu Tabs
    // ==========================================================================
    function initMenuTabs() {
        DOM.menuTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.dataset.tab;

                // Update tabs
                DOM.menuTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update panels
                DOM.menuPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === targetPanel) {
                        panel.classList.add('active');
                    }
                });
            });
        });
    }

    // ==========================================================================
    // Reservation Form
    // ==========================================================================
    function initReservationForm() {
        if (!DOM.reservationForm) return;

        // Set minimum date to today
        if (DOM.dateInput) {
            const today = new Date().toISOString().split('T')[0];
            DOM.dateInput.setAttribute('min', today);

            // Set max date to 3 months ahead
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            DOM.dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
        }

        // Form submission
        DOM.reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    async function handleReservationSubmit(e) {
        e.preventDefault();

        const submitBtn = DOM.reservationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Envoi en cours...</span>';

        // Collect form data
        const formData = {
            name: DOM.reservationForm.name.value.trim(),
            email: DOM.reservationForm.email.value.trim(),
            phone: DOM.reservationForm.phone.value.trim(),
            date: DOM.reservationForm.date.value,
            time: DOM.reservationForm.time.value,
            guests: DOM.reservationForm.guests.value,
            message: DOM.reservationForm.message.value.trim()
        };

        // Validate
        if (!validateReservation(formData)) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showFormStatus('success', 'Votre demande de réservation a été envoyée ! Vous recevrez une confirmation par email sous 24h.');
                DOM.reservationForm.reset();
            } else {
                throw new Error(data.message || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Reservation error:', error);

            let errorMessage = 'Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.';

            if (error.message.includes('complet') || error.message.includes('disponible')) {
                errorMessage = error.message;
            }

            showFormStatus('error', errorMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    function validateReservation(data) {
        // Name validation
        if (data.name.length < 2) {
            showFormStatus('error', 'Veuillez entrer un nom valide.');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showFormStatus('error', 'Veuillez entrer une adresse email valide.');
            return false;
        }

        // Phone validation (French format)
        const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
        if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
            showFormStatus('error', 'Veuillez entrer un numéro de téléphone valide.');
            return false;
        }

        // Date validation
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            showFormStatus('error', 'La date ne peut pas être dans le passé.');
            return false;
        }

        // Check if restaurant is closed (Wednesday and Thursday)
        const dayOfWeek = selectedDate.getDay();
        if (dayOfWeek === 3 || dayOfWeek === 4) {
            showFormStatus('error', 'Désolé, le restaurant est fermé le mercredi et le jeudi.');
            return false;
        }

        // Check if Sunday dinner
        if (dayOfWeek === 0 && data.time >= '19:00') {
            showFormStatus('error', 'Désolé, le restaurant n\'est pas ouvert le dimanche soir.');
            return false;
        }

        return true;
    }

    function showFormStatus(type, message) {
        DOM.formStatus.className = `form-status ${type}`;
        DOM.formStatus.textContent = message;
        DOM.formStatus.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                DOM.formStatus.style.display = 'none';
            }, 10000);
        }

        // Scroll to form status
        DOM.formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ==========================================================================
    // Scroll Animations
    // ==========================================================================
    function initScrollAnimations() {
        const revealElements = document.querySelectorAll('.section-header, .about-content, .about-image, .value-card, .menu-item, .menu-card, .gallery-item, .info-card');

        // Add reveal class
        revealElements.forEach(el => el.classList.add('reveal'));

        // Intersection Observer
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: CONFIG.ANIMATION_THRESHOLD
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => observer.observe(el));
    }

    // ==========================================================================
    // Gallery Lightbox (Simple implementation)
    // ==========================================================================
    function initGallery() {
        const galleryItems = document.querySelectorAll('.gallery-item');

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) {
                    openLightbox(img.src, img.alt);
                }
            });
        });
    }

    function openLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay"></div>
            <div class="lightbox-content">
                <img src="${src}" alt="${alt}">
                <button class="lightbox-close" aria-label="Fermer">&times;</button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .lightbox {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            .lightbox-overlay {
                position: absolute;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.95);
            }
            .lightbox-content {
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
            }
            .lightbox-content img {
                max-width: 100%;
                max-height: 90vh;
                object-fit: contain;
                border-radius: 4px;
            }
            .lightbox-close {
                position: absolute;
                top: -40px;
                right: 0;
                width: 40px;
                height: 40px;
                font-size: 32px;
                color: white;
                background: none;
                border: none;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .lightbox-close:hover {
                transform: scale(1.2);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';

        // Close events
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const overlay = lightbox.querySelector('.lightbox-overlay');

        const closeLightbox = () => {
            lightbox.remove();
            style.remove();
            document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        }, { once: true });
    }

    // ==========================================================================
    // Parallax Effect
    // ==========================================================================
    function initParallax() {
        const heroSection = document.querySelector('.hero-bg');

        if (!heroSection || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            heroSection.style.transform = `translateY(${scrolled * 0.4}px)`;
        }, { passive: true });
    }

    // ==========================================================================
    // Utility Functions
    // ==========================================================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ==========================================================================
    // Phone Number Formatting
    // ==========================================================================
    function initPhoneFormatting() {
        const phoneInput = document.getElementById('phone');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');

            // Format as French phone number
            if (value.length > 0) {
                if (value.startsWith('33')) {
                    value = '0' + value.slice(2);
                }

                let formatted = '';
                for (let i = 0; i < value.length && i < 10; i++) {
                    if (i > 0 && i % 2 === 0) {
                        formatted += ' ';
                    }
                    formatted += value[i];
                }
                e.target.value = formatted;
            }
        });
    }

    // ==========================================================================
    // Initialize
    // ==========================================================================
    function init() {
        initPreloader();
        initNavigation();
        initMenuTabs();
        initReservationForm();
        initScrollAnimations();
        initGallery();
        initParallax();
        initPhoneFormatting();

        console.log('%c La Voûte Savoie ', 'background: #c9a962; color: #0a0a0a; font-size: 14px; padding: 10px 20px; font-family: serif;');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
