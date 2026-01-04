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
        ANIMATION_THRESHOLD: 0.1,
        CLOSED_DAYS: [3, 4], // Mercredi et Jeudi
        MONTHS_FR: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        DAYS_FR: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    };

    // ==========================================================================
    // State
    // ==========================================================================
    const bookingState = {
        guests: 2,
        date: null,
        time: null,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear()
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
        // Booking widget
        bookingForm: document.getElementById('reservation-form'),
        contactStep: document.getElementById('contact-step'),
        contactForm: document.getElementById('contact-form'),
        bookingNext: document.getElementById('booking-next'),
        backToBooking: document.getElementById('back-to-booking'),
        modifyReservation: document.getElementById('modify-reservation'),
        guestsDisplay: document.getElementById('guests-display'),
        dateDisplay: document.getElementById('date-display'),
        timeDisplay: document.getElementById('time-display'),
        guestsInput: document.getElementById('guests'),
        dateInput: document.getElementById('date'),
        timeInput: document.getElementById('time'),
        calendarGrid: document.getElementById('calendar-grid'),
        calendarMonth: document.getElementById('calendar-month'),
        calendarWrapper: document.getElementById('calendar-wrapper'),
        formStatus: document.getElementById('form-status'),
        dinnerService: document.getElementById('dinner-service'),
        // Summary
        summaryGuests: document.getElementById('summary-guests'),
        summaryDate: document.getElementById('summary-date'),
        summaryTime: document.getElementById('summary-time')
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

        setTimeout(() => {
            DOM.preloader.classList.add('loaded');
            document.body.style.overflow = '';
        }, 3000);
    }

    // ==========================================================================
    // Navigation
    // ==========================================================================
    function initNavigation() {
        if (DOM.navToggle) {
            DOM.navToggle.addEventListener('click', toggleMobileMenu);
        }

        DOM.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
                updateActiveLink(link);
            });
        });

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

                DOM.menuTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

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
    // Booking Widget (Zenchef Style)
    // ==========================================================================
    function initBookingWidget() {
        if (!DOM.bookingForm) return;

        // Initialize sections
        initBookingSections();
        initGuestsSelection();
        initDateSelection();
        initTimeSelection();
        initBookingNavigation();
        initContactForm();

        // Open first section by default
        document.getElementById('guests-section').classList.add('open');
    }

    function initBookingSections() {
        const headers = document.querySelectorAll('.booking-header[data-toggle]');

        headers.forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.toggle;
                const section = header.closest('.booking-section');
                const isOpen = section.classList.contains('open');

                // Close all sections
                document.querySelectorAll('.booking-section').forEach(s => {
                    s.classList.remove('open');
                });

                // Open clicked section if it was closed
                if (!isOpen) {
                    section.classList.add('open');
                }
            });
        });
    }

    function initGuestsSelection() {
        const guestBtns = document.querySelectorAll('.guest-btn');

        guestBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const guests = parseInt(btn.dataset.guests);

                // Handle "+" button for more than 9 guests
                if (guests === 10) {
                    const customGuests = prompt('Nombre de couverts (max 20):', '10');
                    if (customGuests && !isNaN(customGuests) && customGuests >= 1 && customGuests <= 20) {
                        bookingState.guests = parseInt(customGuests);
                    } else {
                        return;
                    }
                } else {
                    bookingState.guests = guests;
                }

                // Update UI
                guestBtns.forEach(b => b.classList.remove('active'));
                if (guests <= 9) {
                    btn.classList.add('active');
                }

                DOM.guestsDisplay.textContent = `${bookingState.guests} couvert${bookingState.guests > 1 ? 's' : ''}`;
                DOM.guestsInput.value = bookingState.guests;

                // Auto-advance to date
                setTimeout(() => {
                    document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('open'));
                    document.getElementById('date-section').classList.add('open');
                }, 300);
            });
        });
    }

    function initDateSelection() {
        // Quick date buttons
        const quickDateBtns = document.querySelectorAll('.quick-date-btn[data-offset]');

        quickDateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const offset = parseInt(btn.dataset.offset);
                const date = new Date();
                date.setDate(date.getDate() + offset);

                // Check if closed day
                if (CONFIG.CLOSED_DAYS.includes(date.getDay())) {
                    alert('Le restaurant est fermé ce jour-là (mercredi et jeudi).');
                    return;
                }

                selectDate(date);

                quickDateBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Calendar toggle
        const calendarToggle = document.querySelector('.calendar-toggle');
        if (calendarToggle) {
            calendarToggle.addEventListener('click', () => {
                DOM.calendarWrapper.classList.toggle('show');
                if (DOM.calendarWrapper.classList.contains('show')) {
                    renderCalendar();
                }
            });
        }

        // Calendar navigation
        const prevMonth = document.getElementById('prev-month');
        const nextMonth = document.getElementById('next-month');

        if (prevMonth) {
            prevMonth.addEventListener('click', () => {
                bookingState.currentMonth--;
                if (bookingState.currentMonth < 0) {
                    bookingState.currentMonth = 11;
                    bookingState.currentYear--;
                }
                renderCalendar();
            });
        }

        if (nextMonth) {
            nextMonth.addEventListener('click', () => {
                bookingState.currentMonth++;
                if (bookingState.currentMonth > 11) {
                    bookingState.currentMonth = 0;
                    bookingState.currentYear++;
                }
                renderCalendar();
            });
        }
    }

    function renderCalendar() {
        if (!DOM.calendarGrid) return;

        const year = bookingState.currentYear;
        const month = bookingState.currentMonth;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update month display
        DOM.calendarMonth.textContent = `${CONFIG.MONTHS_FR[month]} ${year}`;

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
        const totalDays = lastDay.getDate();

        // Max date (3 months ahead)
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);

        let html = '';

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            html += '<button type="button" class="calendar-day empty"></button>';
        }

        // Days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const isPast = date < today;
            const isTooFar = date > maxDate;
            const isClosed = CONFIG.CLOSED_DAYS.includes(date.getDay());
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = bookingState.date && date.toDateString() === bookingState.date.toDateString();

            let classes = ['calendar-day'];
            if (isPast || isTooFar || isClosed) classes.push('disabled');
            if (isToday) classes.push('today');
            if (isSelected) classes.push('active');

            html += `<button type="button" class="${classes.join(' ')}" data-date="${date.toISOString()}" ${isPast || isTooFar || isClosed ? 'disabled' : ''}>${day}</button>`;
        }

        DOM.calendarGrid.innerHTML = html;

        // Add click handlers
        DOM.calendarGrid.querySelectorAll('.calendar-day:not(.disabled):not(.empty)').forEach(dayBtn => {
            dayBtn.addEventListener('click', () => {
                const date = new Date(dayBtn.dataset.date);
                selectDate(date);

                // Update calendar UI
                DOM.calendarGrid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
                dayBtn.classList.add('active');

                // Clear quick date buttons
                document.querySelectorAll('.quick-date-btn').forEach(b => b.classList.remove('active'));
            });
        });
    }

    function selectDate(date) {
        bookingState.date = date;

        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        const formattedDate = date.toLocaleDateString('fr-FR', options);

        DOM.dateDisplay.textContent = formattedDate;
        DOM.dateInput.value = date.toISOString().split('T')[0];

        // Update time slots based on date (Sunday = no dinner)
        updateTimeSlots(date);

        // Auto-advance to time
        setTimeout(() => {
            document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('open'));
            document.getElementById('time-section').classList.add('open');
        }, 300);
    }

    function updateTimeSlots(date) {
        const isSunday = date.getDay() === 0;

        // Handle new time-slot-item format (vertical list)
        const dinnerSlotItems = document.querySelectorAll('#dinner-service .time-slot-item');
        dinnerSlotItems.forEach(slot => {
            if (isSunday) {
                slot.classList.add('disabled');
                slot.disabled = true;
            } else {
                slot.classList.remove('disabled');
                slot.disabled = false;
            }
        });

        // Legacy format support
        const dinnerSlots = document.querySelectorAll('.time-service:last-child .time-slot');
        dinnerSlots.forEach(slot => {
            if (isSunday) {
                slot.classList.add('disabled');
                slot.disabled = true;
            } else {
                slot.classList.remove('disabled');
                slot.disabled = false;
            }
        });
    }

    function initTimeSelection() {
        // New vertical list format (time-slot-item)
        const timeSlotItems = document.querySelectorAll('.time-slot-item');

        timeSlotItems.forEach(slot => {
            slot.addEventListener('click', () => {
                if (slot.disabled || slot.classList.contains('disabled')) return;

                const time = slot.dataset.time;
                bookingState.time = time;

                // Update UI - remove active from all
                timeSlotItems.forEach(s => s.classList.remove('active'));
                slot.classList.add('active');

                DOM.timeDisplay.textContent = time;
                DOM.timeInput.value = time;
            });
        });

        // Legacy format support (time-slot)
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                if (slot.disabled || slot.classList.contains('disabled')) return;

                const time = slot.dataset.time;
                bookingState.time = time;

                // Update UI
                timeSlots.forEach(s => s.classList.remove('active'));
                slot.classList.add('active');

                DOM.timeDisplay.textContent = time;
                DOM.timeInput.value = time;
            });
        });
    }

    function initBookingNavigation() {
        // Next button (to contact form)
        if (DOM.bookingNext) {
            DOM.bookingNext.addEventListener('click', () => {
                // Validate booking
                if (!bookingState.date) {
                    alert('Veuillez sélectionner une date.');
                    document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('open'));
                    document.getElementById('date-section').classList.add('open');
                    return;
                }

                if (!bookingState.time) {
                    alert('Veuillez sélectionner un horaire.');
                    document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('open'));
                    document.getElementById('time-section').classList.add('open');
                    return;
                }

                // Update summary
                DOM.summaryGuests.textContent = `${bookingState.guests}`;
                DOM.summaryDate.textContent = DOM.dateDisplay.textContent;
                DOM.summaryTime.textContent = bookingState.time;

                // Show contact step (new layout with form + summary)
                if (DOM.contactStep) {
                    DOM.bookingForm.classList.add('hidden');
                    DOM.contactStep.classList.remove('hidden');
                } else if (DOM.contactForm) {
                    // Legacy fallback
                    DOM.bookingForm.classList.add('hidden');
                    DOM.contactForm.classList.remove('hidden');
                }
            });
        }

        // Back button
        if (DOM.backToBooking) {
            DOM.backToBooking.addEventListener('click', () => {
                if (DOM.contactStep) {
                    DOM.contactStep.classList.add('hidden');
                } else if (DOM.contactForm) {
                    DOM.contactForm.classList.add('hidden');
                }
                DOM.bookingForm.classList.remove('hidden');
            });
        }

        // Modify reservation link (in summary panel)
        if (DOM.modifyReservation) {
            DOM.modifyReservation.addEventListener('click', () => {
                if (DOM.contactStep) {
                    DOM.contactStep.classList.add('hidden');
                }
                DOM.bookingForm.classList.remove('hidden');
            });
        }
    }

    function initContactForm() {
        if (!DOM.contactForm) return;

        DOM.contactForm.addEventListener('submit', handleReservationSubmit);
    }

    async function handleReservationSubmit(e) {
        e.preventDefault();

        const submitBtn = DOM.contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Get form fields (support both old and new format)
        const firstnameField = DOM.contactForm.querySelector('[name="firstname"]');
        const lastnameField = DOM.contactForm.querySelector('[name="lastname"]');
        const nameField = DOM.contactForm.querySelector('[name="name"]');
        const civilityField = DOM.contactForm.querySelector('[name="civility"]:checked');

        let fullName = '';
        if (firstnameField && lastnameField) {
            const civility = civilityField ? civilityField.value : '';
            fullName = `${civility} ${firstnameField.value.trim()} ${lastnameField.value.trim()}`.trim();
        } else if (nameField) {
            fullName = nameField.value.trim();
        }

        const formData = {
            name: fullName,
            email: DOM.contactForm.querySelector('[name="email"]').value.trim(),
            phone: DOM.contactForm.querySelector('[name="phone"]').value.trim(),
            date: DOM.dateInput.value,
            time: bookingState.time,
            guests: bookingState.guests,
            message: DOM.contactForm.querySelector('[name="message"]').value.trim()
        };

        if (!validateReservation(formData)) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
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
                showFormStatus('success', 'Votre réservation a été envoyée ! Vous recevrez une confirmation par email.');

                // Reset form
                DOM.contactForm.reset();
                bookingState.date = null;
                bookingState.time = null;
                DOM.dateDisplay.textContent = 'Choisir une date';
                DOM.timeDisplay.textContent = 'Choisir un horaire';

                // Clear time slot selection
                document.querySelectorAll('.time-slot-item, .time-slot').forEach(s => s.classList.remove('active'));

                // Go back to booking form after delay
                setTimeout(() => {
                    if (DOM.contactStep) {
                        DOM.contactStep.classList.add('hidden');
                    } else {
                        DOM.contactForm.classList.add('hidden');
                    }
                    DOM.bookingForm.classList.remove('hidden');
                    DOM.formStatus.style.display = 'none';
                }, 5000);
            } else {
                throw new Error(data.message || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Reservation error:', error);
            showFormStatus('error', error.message || 'Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }

    function validateReservation(data) {
        if (data.name.length < 2) {
            showFormStatus('error', 'Veuillez entrer un nom valide.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showFormStatus('error', 'Veuillez entrer une adresse email valide.');
            return false;
        }

        const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
        if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
            showFormStatus('error', 'Veuillez entrer un numéro de téléphone valide.');
            return false;
        }

        return true;
    }

    function showFormStatus(type, message) {
        DOM.formStatus.className = `form-status ${type}`;
        DOM.formStatus.textContent = message;
        DOM.formStatus.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                DOM.formStatus.style.display = 'none';
            }, 10000);
        }

        DOM.formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ==========================================================================
    // Scroll Animations
    // ==========================================================================
    function initScrollAnimations() {
        const revealElements = document.querySelectorAll('.section-header, .about-content, .about-image, .value-card, .menu-item, .menu-card, .gallery-item, .info-card-modern, .maitre-restaurateur-section');

        revealElements.forEach(el => el.classList.add('reveal'));

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
    // Gallery Lightbox
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
    // Phone Number Formatting
    // ==========================================================================
    function initPhoneFormatting() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');

        phoneInputs.forEach(phoneInput => {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');

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
        });
    }

    // ==========================================================================
    // Initialize
    // ==========================================================================
    function init() {
        initPreloader();
        initNavigation();
        initMenuTabs();
        initBookingWidget();
        initScrollAnimations();
        initGallery();
        initParallax();
        initPhoneFormatting();

        console.log('%c La Voûte Savoie ', 'background: #c9a962; color: #0a0a0a; font-size: 14px; padding: 10px 20px; font-family: serif;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
