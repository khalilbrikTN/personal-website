// Homepage interactions: copy-to-clipboard, local time, count-ups, micro-demos,
// skill ↔ evidence highlighting, tile hover, citation flashes, command palette.
(() => {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = matchMedia('(hover: hover)').matches;

    // ── Toast + clipboard ───────────────────────────────────
    const toast = document.getElementById('toast');
    let toastTimer;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    async function copyText(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(message);
        } catch {
            showToast('Copy failed: ' + text);
        }
    }

    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyText(btn.dataset.copy, 'Email copied ✓'));
    });

    document.querySelectorAll('[data-copy-bib]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = document.getElementById(btn.dataset.copyBib);
            if (tpl) copyText(tpl.innerHTML.trim(), 'BibTeX copied ✓');
        });
    });

    // ── Genova local time ───────────────────────────────────
    const timeEl = document.getElementById('genova-time');
    if (timeEl) {
        const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
        const tick = () => { timeEl.textContent = fmt.format(new Date()); };
        tick();
        setInterval(tick, 30000);
    }

    // ── QUBO dots: build the grid (decorative) ──────────────
    document.querySelectorAll('.dots[data-dots]').forEach(el => {
        const total = +el.dataset.dots;
        const keep = +el.dataset.keep;
        const kept = new Set();
        // deterministic spread so the 10% kept look scattered, not clustered
        for (let i = 0; kept.size < keep; i++) kept.add((i * 37 + 11) % total);
        el.innerHTML = Array.from({ length: total }, (_, i) => `<i${kept.has(i) ? ' class="keep"' : ''}></i>`).join('');
        if (reduceMotion) el.classList.add('settled');
    });

    // ── Count-ups ───────────────────────────────────────────
    function countUp(el) {
        const target = +el.dataset.count;
        const start = performance.now();
        const dur = 600;
        const step = now => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased).toLocaleString('en-US');
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ── In-view: micro-demos + count-ups, once ──────────────
    const demoTiles = document.querySelectorAll('.tile');
    demoTiles.forEach(t => t.classList.add('demo-armed'));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add('in-view');
                if (!reduceMotion) el.querySelectorAll('[data-count]').forEach(countUp);
                io.unobserve(el);
            });
        }, { threshold: 0.35 });
        document.querySelectorAll('.tile, .xp-row').forEach(el => io.observe(el));
    } else {
        demoTiles.forEach(t => t.classList.add('in-view'));
    }

    // ── Agent architecture tabs ─────────────────────────────
    const tabs = document.querySelectorAll('.agent-tabs [role="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
            document.querySelectorAll('[data-agent-panel]').forEach(p => {
                p.hidden = p.dataset.agentPanel !== tab.dataset.agent;
            });
            // replay the flow animation on the newly shown panel
            const tile = tab.closest('.tile');
            tile.classList.remove('in-view');
            void tile.offsetWidth;
            tile.classList.add('in-view');
        });
    });

    // ── Skill ↔ evidence highlighting ───────────────────────
    const evidence = [...document.querySelectorAll('[data-skills]')];
    const usage = document.getElementById('skill-usage');

    function highlight(skill) {
        const hits = evidence.filter(el => el.dataset.skills.split(' ').includes(skill));
        evidence.forEach(el => {
            el.classList.toggle('is-hit', hits.includes(el));
            el.classList.toggle('is-dim', !hits.includes(el));
        });
        if (usage) {
            usage.innerHTML = hits.length
                ? 'Used in: ' + hits.map(el => `<b>${el.dataset.name}</b>`).join(' · ')
                : 'Used in coursework and side projects.';
        }
    }

    function clearHighlight() {
        evidence.forEach(el => el.classList.remove('is-hit', 'is-dim'));
        document.querySelectorAll('.sk.is-active').forEach(b => b.classList.remove('is-active'));
        if (usage) usage.textContent = '';
    }

    document.querySelectorAll('.sk').forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        const on = () => highlight(btn.dataset.skill);
        if (canHover) {
            btn.addEventListener('mouseenter', on);
            btn.addEventListener('mouseleave', () => { if (!btn.classList.contains('is-active')) clearHighlight(); });
        }
        btn.addEventListener('focus', on);
        btn.addEventListener('blur', () => { if (!btn.classList.contains('is-active')) clearHighlight(); });
        // click/tap pins the highlight so touch users can scroll to the evidence
        btn.addEventListener('click', () => {
            const wasActive = btn.classList.contains('is-active');
            clearHighlight();
            document.querySelectorAll('.sk').forEach(b => b.setAttribute('aria-pressed', 'false'));
            if (!wasActive) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-pressed', 'true');
                highlight(btn.dataset.skill);
            }
        });
    });

    // ── Citation / anchor flashes ───────────────────────────
    function flashTarget(id) {
        const target = document.getElementById(id);
        if (!target) return;
        target.classList.remove('flash');
        void target.offsetWidth;
        target.classList.add('flash');
    }

    document.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href').slice(1);
        if (/^(xp|proj|pub)-/.test(id)) setTimeout(() => flashTarget(id), reduceMotion ? 0 : 450);
    });

    // ── Tile hover: cursor glow + subtle tilt (desktop) ─────
    if (canHover && !reduceMotion) {
        document.querySelectorAll('.tile').forEach(tile => {
            tile.addEventListener('pointermove', e => {
                const r = tile.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                tile.style.setProperty('--mx', `${x * 100}%`);
                tile.style.setProperty('--my', `${y * 100}%`);
                if (!tile.classList.contains('tile-xl')) {
                    tile.classList.add('tilt');
                    tile.style.setProperty('--rx', `${(0.5 - y) * 4}deg`);
                    tile.style.setProperty('--ry', `${(x - 0.5) * 4}deg`);
                }
            });
            tile.addEventListener('pointerleave', () => {
                tile.style.setProperty('--rx', '0deg');
                tile.style.setProperty('--ry', '0deg');
            });
        });

        // magnetic pull on the contact email button (max ~6px)
        document.querySelectorAll('.magnetic').forEach(btn => {
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
                const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
                btn.style.transform = `translate(${dx * 12}px, ${dy * 12}px)`;
            });
            btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
        });
    }

    // ── Command palette (Ctrl/⌘ + K) ────────────────────────
    const palette = document.getElementById('palette');
    const input = document.getElementById('palette-input');
    const list = document.getElementById('palette-list');
    if (!palette || !input || !list) return;

    const go = hash => () => { location.hash = hash; flashTarget(hash.slice(1)); };
    const commands = [
        { label: 'Download resume', hint: 'resume', run: () => window.open('assets/docs/MohamedKhalil_CV.pdf', '_blank') },
        { label: 'Email Khalil', hint: 'email', run: () => { location.href = 'mailto:mohamedkhalil.brik@aucegypt.edu'; } },
        { label: 'Copy email address', hint: 'copy', run: () => copyText('mohamedkhalil.brik@aucegypt.edu', 'Email copied ✓') },
        { label: 'Open LinkedIn', hint: 'linkedin', run: () => window.open('https://www.linkedin.com/in/mohamed-khalil-brik-457164183/', '_blank') },
        { label: 'Open GitHub', hint: 'github', run: () => window.open('https://github.com/khalilbrikTN', '_blank') },
        { label: 'Experience', hint: 'section', run: go('#experience') },
        { label: 'Project: 3 production AI agents', hint: 'project', run: go('#proj-agents') },
        { label: 'Project: immigration RAG chatbot', hint: 'project', run: go('#proj-diaspura') },
        { label: 'Project: quantum AP selection (QUBO)', hint: 'project', run: go('#proj-qubo') },
        { label: 'Project: emergency response LLM', hint: 'project', run: go('#proj-911') },
        { label: 'Skills', hint: 'section', run: go('#skills') },
        { label: 'Publications', hint: 'section', run: go('#research') },
        { label: 'Copy BibTeX: IEEE QCNC 2026', hint: 'bibtex', run: () => document.querySelector('[data-copy-bib="bib-qcnc"]')?.click() },
        { label: 'Contact', hint: 'section', run: go('#contact') },
        { label: 'Blog', hint: 'page', run: () => { location.href = 'blog.html'; } },
    ];

    let filtered = commands;
    let active = 0;
    let lastFocus = null;

    function render() {
        const q = input.value.trim().toLowerCase();
        filtered = commands.filter(c => (c.label + ' ' + c.hint).toLowerCase().includes(q));
        active = Math.min(active, Math.max(0, filtered.length - 1));
        list.innerHTML = filtered.map((c, i) =>
            `<li role="option" id="pal-${i}" aria-selected="${i === active}" data-i="${i}">${c.label}<span>${c.hint}</span></li>`
        ).join('') || '<li aria-disabled="true">No matches</li>';
        input.setAttribute('aria-activedescendant', filtered.length ? `pal-${active}` : '');
    }

    function openPalette() {
        lastFocus = document.activeElement;
        palette.hidden = false;
        input.value = '';
        active = 0;
        render();
        input.focus();
    }

    function closePalette() {
        palette.hidden = true;
        if (lastFocus) lastFocus.focus();
    }

    function runActive() {
        const cmd = filtered[active];
        if (!cmd) return;
        closePalette();
        cmd.run();
    }

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            palette.hidden ? openPalette() : closePalette();
        } else if (!palette.hidden && e.key === 'Escape') {
            closePalette();
        }
    });

    document.querySelectorAll('[data-palette-open]').forEach(b => b.addEventListener('click', openPalette));
    input.addEventListener('input', () => { active = 0; render(); });
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, filtered.length); render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % Math.max(1, filtered.length); render(); }
        else if (e.key === 'Enter') { e.preventDefault(); runActive(); }
        else if (e.key === 'Tab') { e.preventDefault(); } // keep focus inside the dialog
    });
    list.addEventListener('click', e => {
        const li = e.target.closest('li[data-i]');
        if (!li) return;
        active = +li.dataset.i;
        runActive();
    });
    palette.addEventListener('click', e => { if (e.target === palette) closePalette(); });
})();
