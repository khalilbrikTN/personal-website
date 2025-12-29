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
});
