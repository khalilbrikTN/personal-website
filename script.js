document.addEventListener('DOMContentLoaded', () => {
    const menuTrigger = document.querySelector('.menu-trigger');
    const navOverlay = document.querySelector('.nav-overlay');
    const closeMenu = document.querySelector('.close-menu');
    const navLinks = document.querySelectorAll('.nav-links-overlay a');

    function toggleMenu() {
        navOverlay.classList.toggle('active');
    }

    if (menuTrigger) {
        menuTrigger.addEventListener('click', toggleMenu);
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navOverlay.classList.remove('active');
        });
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
            statusTextElement.textContent = "Not available";
            statusTextElement.style.color = "#ef4444"; // Error Red
            indicatorElement.className = "status-indicator offline"; // Or just 'offline' style
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
            setInterval(() => {
                this.currentIndex = (this.currentIndex + 1) % this.texts.length;
                this.animateText(this.currentIndex);
            }, this.interval + 1000); // Add buffer for animation duration
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


    new RotationAnimation('rotating-text', rotatingTexts, 1000);

    // Personal Map Implementation
    const initMap = () => {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        // Initialize map centered to show North America, North Africa, and Europe
        // Center approx: Atlantic Ocean
        const map = L.map('map', {
            center: [34.0, -40.0],
            zoom: 3,
            minZoom: 2,
            scrollWheelZoom: false // Disable scroll zoom for better UX
        });

        // CartoDB Dark Matter Tiles (Free, minimal, dark theme)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Custom Circle Marker Style
        const markerStyle = {
            radius: 6,
            fillColor: "#eb5e28", // Spicy Paprika
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        };

        const locations = [
            { coords: [36.8065, 10.1815], city: "Tunis", country: "Tunisia", context: "Origin" },
            { coords: [30.0444, 31.2357], city: "Cairo", country: "Egypt", context: "Study & Live" },
            { coords: [31.2001, 29.9187], city: "Alexandria", country: "Egypt", context: "Travel" },
            { coords: [32.7765, -79.9311], city: "Charleston", country: "USA (SC)", context: "Study Abroad" },
            { coords: [40.4406, -79.9959], city: "Pittsburgh", country: "USA (PA)", context: "Research" },
            { coords: [38.9072, -77.0369], city: "Washington", country: "USA (DC)", context: "Travel" },
            { coords: [40.7128, -74.0060], city: "New York City", country: "USA (NY)", context: "Travel" },
            { coords: [40.7357, -74.1724], city: "Newark", country: "USA (NJ)", context: "Travel" },
            { coords: [34.7304, -86.5861], city: "Huntsville", country: "USA (AL)", context: "NASA Course" }
        ];

        locations.forEach(loc => {
            L.circleMarker(loc.coords, markerStyle)
                .addTo(map)
                .bindPopup(`
                    <span class="map-popup-context">${loc.context}</span>
                    <span class="map-popup-title">${loc.city}</span>
                    <span class="map-popup-location">${loc.country}</span>
                `);
        });
    };

    // Initialize map
    initMap();
});
