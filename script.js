// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Active navigation link highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.project-card, .skill-item, .stat-item, .about-text, .contact-info');
    animateElements.forEach(el => observer.observe(el));
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // Basic validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Simulate form submission (replace with actual form handling)
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        this.reset();
    });
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 1rem;
        padding: 0;
        line-height: 1;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
`;
document.head.appendChild(notificationStyles);

// Typing animation for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing animation when page loads
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.innerHTML;
        // Only animate if the text contains the placeholder
        if (originalText.includes('Your Name')) {
            setTimeout(() => {
                typeWriter(heroTitle, originalText, 50);
            }, 1000);
        }
    }
});

// Project card hover effects
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Skill item hover effects
document.querySelectorAll('.skill-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.05)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add loading styles
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
    
    body.loaded {
        opacity: 1;
    }
`;
document.head.appendChild(loadingStyles);

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    }
    
    updateCounter();
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-item h3');
            statNumbers.forEach(stat => {
                const target = stat.textContent;
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const aboutStats = document.querySelector('.about-stats');
if (aboutStats) {
    statsObserver.observe(aboutStats);
}

// Add active class to nav links on scroll
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);

// Add active nav link styles
const activeNavStyles = document.createElement('style');
activeNavStyles.textContent = `
    .nav-link.active {
        color: #667eea !important;
    }
    
    .nav-link.active::after {
        width: 100% !important;
    }
`;
document.head.appendChild(activeNavStyles); 

// News Section Navigation - Updated for smaller cards
document.addEventListener('DOMContentLoaded', () => {
    const newsScrollWrapper = document.querySelector('.news-scroll-wrapper');
    const prevBtn = document.getElementById('newsPrev');
    const nextBtn = document.getElementById('newsNext');
    
    if (newsScrollWrapper && prevBtn && nextBtn) {
        const cardWidth = 220 + 24; // card width + gap for smaller cards
        
        prevBtn.addEventListener('click', () => {
            newsScrollWrapper.scrollBy({
                left: -cardWidth * 3, // scroll 3 cards at a time
                behavior: 'smooth'
            });
        });
        
        nextBtn.addEventListener('click', () => {
            newsScrollWrapper.scrollBy({
                left: cardWidth * 3, // scroll 3 cards at a time
                behavior: 'smooth'
            });
        });
        
        // Update navigation button states
        const updateNavButtons = () => {
            const scrollLeft = newsScrollWrapper.scrollLeft;
            const maxScroll = newsScrollWrapper.scrollWidth - newsScrollWrapper.clientWidth;
            
            prevBtn.disabled = scrollLeft <= 0;
            nextBtn.disabled = scrollLeft >= maxScroll - 5; // 5px tolerance
        };
        
        newsScrollWrapper.addEventListener('scroll', updateNavButtons);
        updateNavButtons(); // Initial state
        
        // Touch/swipe support for mobile
        let isDown = false;
        let startX;
        let scrollLeft;
        
        newsScrollWrapper.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - newsScrollWrapper.offsetLeft;
            scrollLeft = newsScrollWrapper.scrollLeft;
            newsScrollWrapper.style.cursor = 'grabbing';
        });
        
        newsScrollWrapper.addEventListener('mouseleave', () => {
            isDown = false;
            newsScrollWrapper.style.cursor = 'grab';
        });
        
        newsScrollWrapper.addEventListener('mouseup', () => {
            isDown = false;
            newsScrollWrapper.style.cursor = 'grab';
        });
        
        newsScrollWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - newsScrollWrapper.offsetLeft;
            const walk = (x - startX) * 2;
            newsScrollWrapper.scrollLeft = scrollLeft - walk;
        });
    }
});


// News Card Click Handler
function openNewsPage(newsId) {
    // Create news pages folder if it doesn't exist
    const newsUrl = `news/${newsId}.html`;
    window.open(newsUrl, '_blank');
}

// Keyboard accessibility for news cards
document.addEventListener('DOMContentLoaded', () => {
    const newsCards = document.querySelectorAll('.news-card');
    
    newsCards.forEach((card, index) => {
        // Make cards keyboard accessible
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Read more about ${card.querySelector('h3').textContent}`);
        
        // Handle keyboard events
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
});

// Add this to a new file called 'contact.js' or include in your existing JS

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form');
    const submitBtn = form.querySelector('.btn');
    const originalBtnText = submitBtn.innerHTML;
    
    form.addEventListener('submit', function(e) {
        // Add submitting state
        form.classList.add('form-submitting');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Optional: Add analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'event_category': 'Contact',
                'event_label': 'Contact Form'
            });
        }
    });
    
    // Reset form state if user navigates back
    window.addEventListener('pageshow', function() {
        form.classList.remove('form-submitting');
        submitBtn.innerHTML = originalBtnText;
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const messagesDiv = document.getElementById('form-messages');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        // Prepare form data
        const formData = new FormData(form);
        formData.append('_subject', 'New contact form submission');
        
        // Submit to Formspree
        fetch('https://formspree.io/f/xpwlkaoy', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                messagesDiv.innerHTML = '<div style="color: green; padding: 1rem; background: #f0fff4; border: 1px solid #68d391; border-radius: 8px; margin-bottom: 1rem;">Thank you! Your message has been sent successfully.</div>';
                form.reset();
            } else {
                throw new Error('Form submission failed');
            }
        })
        .catch(error => {
            messagesDiv.innerHTML = '<div style="color: red; padding: 1rem; background: #fed7d7; border: 1px solid #fc8181; border-radius: 8px; margin-bottom: 1rem;">Sorry, there was an error sending your message. Please try again.</div>';
        })
        .finally(() => {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            submitBtn.disabled = false;
        });
    });
});

// Expand/Collapse Functionality for Coursework and Certifications
document.addEventListener('DOMContentLoaded', function() {
    // Coursework Expand/Collapse
    const expandCourseworkBtn = document.getElementById('expandCoursework');
    const courseworkContent = document.getElementById('courseworkContent');

    if (expandCourseworkBtn && courseworkContent) {
        expandCourseworkBtn.addEventListener('click', function() {
            const isExpanded = courseworkContent.style.display !== 'none';

            if (isExpanded) {
                // Collapse
                courseworkContent.style.display = 'none';
                expandCourseworkBtn.innerHTML = '<i class="fas fa-chevron-down"></i> View Complete Transcript';
                expandCourseworkBtn.classList.remove('expanded');
            } else {
                // Expand
                courseworkContent.style.display = 'grid';
                expandCourseworkBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Complete Transcript';
                expandCourseworkBtn.classList.add('expanded');

                // Smooth scroll to content
                setTimeout(() => {
                    courseworkContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        });
    }

    // Certifications Expand/Collapse
    const expandCertificationsBtn = document.getElementById('expandCertifications');
    const certificationsContent = document.getElementById('certificationsContent');

    if (expandCertificationsBtn && certificationsContent) {
        expandCertificationsBtn.addEventListener('click', function() {
            const isExpanded = certificationsContent.style.display !== 'none';

            if (isExpanded) {
                // Collapse
                certificationsContent.style.display = 'none';
                expandCertificationsBtn.innerHTML = '<i class="fas fa-chevron-down"></i> View All 18 Certifications';
                expandCertificationsBtn.classList.remove('expanded');
            } else {
                // Expand
                certificationsContent.style.display = 'grid';
                expandCertificationsBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Certifications';
                expandCertificationsBtn.classList.add('expanded');

                // Smooth scroll to content
                setTimeout(() => {
                    certificationsContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        });
    }
});

// Scroll Animations - Intersection Observer
const animateOnScroll = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('fade-in-up');
        observer.observe(section);
    });

    // Observe cards with stagger effect
    document.querySelectorAll('.news-grid').forEach(grid => {
        grid.classList.add('stagger-animation');
        observer.observe(grid);
    });

    document.querySelectorAll('.experience-content').forEach(content => {
        content.classList.add('stagger-animation');
        observer.observe(content);
    });

    document.querySelectorAll('.skills-category').forEach(category => {
        category.classList.add('scale-in');
        observer.observe(category);
    });
};

// Initialize animations when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateOnScroll);
} else {
    animateOnScroll();
}

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Check for saved dark mode preference
const isDarkMode = localStorage.getItem('darkMode') === 'enabled';

if (isDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // Update icon
    if (body.classList.contains('dark-mode')) {
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', 'disabled');
    }
});

