// Shared site header, mobile nav and footer: the single source of truth for every page.
//
// Usage: place this tag as the first element inside <body>; the header renders in place:
//   <script src="assets/js/site-chrome.js"></script>                (root pages)
//   <script src="../assets/js/site-chrome.js" data-offset></script> (pages with no top spacing)
// and, where the footer should go:
//   <footer class="footer" data-site-footer><p>&copy; Mohamed Khalil Brik</p></footer>
(function () {
    const script = document.currentScript;
    const base = script.src.replace(/assets\/js\/site-chrome\.js.*$/, '');
    const path = location.pathname;
    const file = path.split('/').pop() || 'index.html';
    const isHome = file === 'index.html' && !/\/(projects|posts)\//.test(path);
    const isBlog = file === 'blog.html' || /\/posts\//.test(path);

    const RESUME = base + 'assets/docs/MohamedKhalil_CV.pdf';
    const EMAIL = 'mohamedkhalil.brik@aucegypt.edu';
    const LINKEDIN = 'https://www.linkedin.com/in/mohamed-khalil-brik-457164183/';
    const GITHUB = 'https://github.com/khalilbrikTN';
    const WHATSAPP = 'https://wa.me/393522282361?text=' +
        encodeURIComponent('Hi Khalil, I found your website and would like to talk about an AI Engineering role.');
    const ICON_WHATSAPP = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.44 9.44 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 6.68 2.77 9.39 9.39 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.69C5.78.69.68 5.79.68 12.05c0 2 .52 3.96 1.52 5.68L.58 23.31l5.7-1.5a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04"/></svg>';

    // On the homepage, section links stay in-page; elsewhere they point back to it
    const section = hash => (isHome ? hash : base + 'index.html' + hash);
    const NAV = [
        { label: 'Experience', href: section('#experience') },
        { label: 'Projects', href: section('#projects') },
        { label: 'Research', href: section('#research') },
        { label: 'Blog', href: base + 'blog.html', active: isBlog },
        { label: 'Contact', href: section('#contact') },
    ];

    const svg = d => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
    const ICON_MENU = svg('<path d="M4 6h16M4 12h16M4 18h16"/>');
    const ICON_CLOSE = svg('<path d="M18 6 6 18M6 6l12 12"/>');

    const link = (n, cls) =>
        `<a href="${n.href}" class="${cls}${n.active ? ' active' : ''}"${n.active ? ' aria-current="page"' : ''}>${n.label}</a>`;

    const header = `
    <a href="#main" class="skip-link">Skip to content</a>
    <header class="site-header">
        <a href="${base}index.html" class="brand">
            <img src="${base}assets/img/me.webp" alt="" class="brand-img" width="32" height="32">
            <span class="brand-name">Mohamed Khalil Brik</span>
        </a>
        <nav class="nav-desktop" aria-label="Main">
            ${NAV.map(n => link(n, 'nav-link')).join('\n            ')}
            ${isHome ? '<button class="palette-hint" type="button" data-palette-open aria-label="Open command palette"><kbd>Ctrl</kbd><kbd>K</kbd></button>' : ''}
            <a href="${RESUME}" target="_blank" class="nav-cta">Resume</a>
        </nav>
        <button class="mobile-nav-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-overlay">${ICON_MENU}</button>
    </header>
    <div class="nav-overlay" id="nav-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <button class="close-menu" aria-label="Close navigation">${ICON_CLOSE}</button>
        <ul class="nav-links-overlay">
            ${NAV.map(n => `<li>${link(n, '')}</li>`).join('\n            ')}
            <li><a href="${RESUME}" target="_blank">Resume</a></li>
        </ul>
    </div>`;

    script.insertAdjacentHTML('beforebegin', header);
    document.body.classList.add('has-chrome');
    if (script.hasAttribute('data-offset')) document.body.classList.add('chrome-offset');

    // Skip link targets #main; give pages without one a sensible target
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('main')) {
            const target = document.querySelector('main, article, .container, section');
            if (target) target.id = target.id || 'main';
        }

        const year = new Date().getFullYear();
        document.querySelectorAll('[data-site-footer]').forEach(footer => {
            footer.innerHTML = `
        <p class="sf-status"><span class="sf-dot"></span> Open to remote work</p>
        <p class="sf-links">
            <a href="${RESUME}" target="_blank">Resume</a>
            <a href="mailto:${EMAIL}">Email</a>
            <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="${GITHUB}" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="${base}blog.html">Blog</a>
        </p>
        <p class="sf-minor">&copy; ${year} Mohamed Khalil Brik · <a href="${base}academics.html">Academics</a> · <a href="${base}services.html">Freelance services</a> · <a href="${base}resources.html">Resources</a></p>`;
        });

        // Floating WhatsApp contact button (styles: "Floating WhatsApp button" in main.css)
        if (!document.querySelector('.whatsapp-fab')) {
            document.body.insertAdjacentHTML('beforeend', `
    <a href="${WHATSAPP}" class="whatsapp-fab" target="_blank" rel="noopener noreferrer"
       aria-label="Chat on WhatsApp" title="Chat on WhatsApp">${ICON_WHATSAPP}<span class="whatsapp-fab-label" aria-hidden="true">WhatsApp</span></a>`);
        }
    });
})();
