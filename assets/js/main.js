document.addEventListener('DOMContentLoaded', () => {
    // Header Scroll Logic
    const header = document.querySelector('.site-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Navigation Logic
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const closeMenuBtn = document.querySelector('.close-menu');
    const navLinks = document.querySelectorAll('.nav-links-overlay a, .nav-desktop a');

    function openMenu() {
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu() {
        if (navOverlay.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMenu);
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Cairo Status Logic
    function updateCairoStatus() {
        const timeElement = document.getElementById('cairo-time');
        const statusTextElement = document.getElementById('availability-status');
        const indicatorElement = document.querySelector('.status-indicator');

        if (!timeElement || !statusTextElement || !indicatorElement) return;

        // Get current time in Cairo
        const now = new Date();
        const options = {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            weekday: 'long'
        };

        const cairoTimeFormatter = new Intl.DateTimeFormat('en-US', options);
        const parts = cairoTimeFormatter.formatToParts(now);
        const dateString = cairoTimeFormatter.format(now);

        // Extract parts for logic
        const dayPart = parts.find(p => p.type === 'weekday').value;
        const hourPart = parts.find(p => p.type === 'hour').value;
        const dayPeriodPart = parts.find(p => p.type === 'dayPeriod').value; // AM/PM

        // Parse hour to 24h format for easier comparison
        let hour = parseInt(hourPart);
        if (dayPeriodPart === 'PM' && hour !== 12) hour += 12;
        if (dayPeriodPart === 'AM' && hour === 12) hour = 0;

        // Display Time
        // Clean up string to show "HH:MM:SS AM/PM"
        // format() returns something like "Sunday, 2:30:45 PM" depending on options
        // Let's just use the time portion for display
        const timeDisplayOptions = {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        timeElement.textContent = new Intl.DateTimeFormat('en-US', timeDisplayOptions).format(now) + " (Cairo)";

        // Logic: Online if Sunday(0)..Thursday(4) AND 9am..6pm (18:00)
        // Map day string to index? Or use getDay() from a Cairo-adjusted date object?
        // Constructing a Cairo specific Date object is safer.
        // Hacky but effective: Map weekday names.
        const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const isWorkDay = validDays.includes(dayPart);
        const isWorkHour = hour >= 9 && hour < 18; // 9:00 to 17:59

        if (isWorkDay && isWorkHour) {
            statusTextElement.textContent = "Khalil is online";
            statusTextElement.style.color = "#10b981"; // Success Green
            indicatorElement.className = "status-indicator online";
        } else {
            statusTextElement.textContent = "Available for freelance";
            statusTextElement.style.color = "#f59e0b"; // Amber
            indicatorElement.className = "status-indicator offline";
        }
    }

    // Update immediately and then every second
    updateCairoStatus();
    setInterval(updateCairoStatus, 1000);

    // Rotating Text Animation
    class RotationAnimation {
        constructor(elementId, texts, interval = 2000) {
            this.container = document.getElementById(elementId);
            this.texts = texts;
            this.interval = interval;
            this.currentIndex = 0;
            this.isAnimating = false;

            if (this.container) {
                this.init();
            }
        }

        init() {
            this.animateText(this.currentIndex);
        }

        splitText(text) {
            const words = text.split(' ');
            return words.map(word => {
                const chars = word.split('').map(char => `<span class="rotating-char">${char}</span>`).join('');
                return `<span class="rotating-word">${chars}</span>`;
            }).join('<span class="rotating-space"> </span>');
        }

        animateText(index) {
            if (this.isAnimating) return;
            this.isAnimating = true;

            const text = this.texts[index];

            // Out animation for current text (if any)
            const currentChars = this.container.querySelectorAll('.rotating-char');
            if (currentChars.length > 0) {
                currentChars.forEach((char, i) => {
                    char.classList.remove('in');
                    char.classList.add('out');
                    char.style.animationDelay = `${i * 0.05}s`;
                });

                // Wait for exit animation to finish before clearing
                const exitDuration = (currentChars.length * 50) + 500;

                setTimeout(() => {
                    this.container.innerHTML = this.splitText(text);
                    this.animateIn();
                }, exitDuration);
            } else {
                // First run
                this.container.innerHTML = this.splitText(text);
                this.animateIn();
            }
        }

        animateIn() {
            const newChars = this.container.querySelectorAll('.rotating-char');
            newChars.forEach((char, i) => {
                // Force reflow
                void char.offsetWidth;
                char.classList.remove('out');
                char.classList.add('in');
                char.style.animationDelay = `${i * 0.05}s`;
            });

            // Reset animating flag after entrance finishes
            const entranceDuration = (newChars.length * 50) + 500;
            setTimeout(() => {
                this.isAnimating = false;

                // Schedule next rotation
                setTimeout(() => {
                    this.currentIndex = (this.currentIndex + 1) % this.texts.length;
                    this.animateText(this.currentIndex);
                }, this.interval);
            }, entranceDuration);
        }
    }

    // Initialize Rotating Text with explicit items
    const rotatingTexts = [
        "Artificial Intelligence",
        "Software Engineering",
        "Quantum Computing",
        "Mathematics"
    ];


    new RotationAnimation('rotating-text', rotatingTexts, 2000);

    // Back to Top Button Logic
    function initBackToTop() {
        // Create button element
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.className = 'back-to-top-btn';
        btn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(btn);

        // Scroll event to toggle visibility
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        // Click event to scroll to top
        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Initialize Back to Top
    initBackToTop();

    // Global Footprint Map Implementation
    const initMap = () => {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        const map = L.map('map', {
            center: [34.0, -25.0],
            zoom: 3,
            minZoom: 2,
            scrollWheelZoom: false,
            zoomControl: false // Handled in CSS/Config
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Custom Pulsing Radar Icon
        const radarIcon = L.divIcon({
            className: 'radar-marker-container',
            html: '<div class="radar-marker"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const locations = [
            { coords: [36.8065, 10.1815], city: "Tunis", country: "Tunisia", context: "Origin" },
            { coords: [30.0444, 31.2357], city: "Cairo", country: "Egypt", context: "HQ & Research" },
            { coords: [32.7765, -79.9311], city: "Charleston", country: "USA (SC)", context: "Academic Exchange" },
            { coords: [40.4406, -79.9959], city: "Pittsburgh", country: "USA (PA)", context: "Research Frontier" },
            { coords: [38.9072, -77.0369], city: "Washington", country: "USA (DC)", context: "Strategic Travel" },
            { coords: [40.7128, -74.0060], city: "New York City", country: "USA (NY)", context: "Global Network" },
            { coords: [34.7304, -86.5861], city: "Huntsville", country: "USA (AL)", context: "Aerospace Course" }
        ];

        locations.forEach(loc => {
            L.marker(loc.coords, { icon: radarIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="map-popup">
                        <span class="map-popup-context">${loc.context}</span>
                        <span class="map-popup-title">${loc.city}</span>
                        <span class="map-popup-location">${loc.country}</span>
                    </div>
                `, {
                    closeButton: false,
                    offset: [0, -10]
                });
        });
    };

    // Initialize map
    initMap();
});
