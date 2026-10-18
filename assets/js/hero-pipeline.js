// "Retrieval, Live": replays a scripted RAG query over real embeddings of my work.
// The page ships the final state as static HTML; this module only animates it.
// Data comes from tools/build_embeddings.py (assets/data/*.json).

const panel = document.getElementById('trace');
const canvas = document.getElementById('tp-canvas');

if (panel && canvas) init().catch(() => { /* keep the static final state */ });

async function init() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowEnd = (navigator.hardwareConcurrency || 8) <= 4
        || (navigator.deviceMemory || 8) <= 2
        || navigator.connection?.saveData === true;

    const [field, { scripts }] = await Promise.all([
        fetch('assets/data/embeddings.json?v=2').then(r => r.json()),
        fetch('assets/data/hero-scripts.json?v=2').then(r => r.json()),
    ]);

    const $ = sel => panel.querySelector(sel);
    const qEl = $('#tp-q');
    const hitsEl = $('#tp-hits');
    const answerEl = $('#tp-answer');
    const steps = [...panel.querySelectorAll('.tp-steps li')];
    const chips = [...panel.querySelectorAll('.tp-chip')];
    const toggle = document.getElementById('tp-toggle');
    const fieldBox = canvas.parentElement;

    // Screen-reader announcement happens once, after streaming finishes
    const live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    panel.appendChild(live);

    // ── Canvas field ────────────────────────────────────────
    const COLORS = ['34,211,238', '129,140,248', '100,116,139'];
    const ctx = canvas.getContext('2d');
    const points = field.points.map(([x, y, g, r], i) => ({ x, y, g, r, phase: i * 1.7 }));
    let W = 0, H = 0;

    // Visual state the draw() function reads
    const view = {
        query: null,      // [x, y] final query position
        queryDrop: 0,     // 0..1 drop-in progress
        edges: 0,         // 0..1 edge drawing progress
        hitPoints: [],    // point indices of retrieved chunks
        hitRefs: new Set(),
        t: 0,
    };

    function resize() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const r = fieldBox.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function pos(p) {
        const drift = lowEnd || reduce ? 0 : 1.6;
        return [p.x * W + Math.sin(view.t * 0.0007 + p.phase) * drift,
                p.y * H + Math.cos(view.t * 0.0006 + p.phase) * drift];
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const retrieving = view.edges > 0;

        for (const p of points) {
            const [x, y] = pos(p);
            const isHitRef = view.hitRefs.has(p.r);
            const alpha = retrieving ? (isHitRef ? 0.95 : 0.25) : 0.7;
            ctx.beginPath();
            ctx.arc(x, y, isHitRef && retrieving ? 2.6 : 2.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${COLORS[p.g]},${alpha})`;
            ctx.fill();
        }

        if (!view.query) return;
        const qx = view.query[0] * W;
        const qy = (view.query[1] * H) * view.queryDrop + (-0.1 * H) * (1 - view.queryDrop);

        // edges from the query to the top-k chunks
        if (view.edges > 0) {
            ctx.lineWidth = 1.2;
            view.hitPoints.forEach((idx, i) => {
                const local = Math.min(1, Math.max(0, view.edges * 3 - i));
                if (local <= 0) return;
                const [tx, ty] = pos(points[idx]);
                ctx.strokeStyle = 'rgba(34,211,238,0.75)';
                ctx.beginPath();
                ctx.moveTo(qx, qy);
                ctx.lineTo(qx + (tx - qx) * local, qy + (ty - qy) * local);
                ctx.stroke();
                if (local === 1) {
                    const pulse = lowEnd || reduce ? 0 : Math.sin(view.t * 0.004 + i) * 1.2;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 5 + pulse, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(34,211,238,0.95)';
                    ctx.shadowColor = '#22d3ee';
                    ctx.shadowBlur = 14;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#031018';
                    ctx.font = '600 9px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(i + 1), tx, ty + 0.5);
                }
            });
        }

        // the query point (a diamond)
        if (view.queryDrop > 0) {
            ctx.save();
            ctx.translate(qx, qy);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = '#fcd34d';
            ctx.shadowColor = '#fcd34d';
            ctx.shadowBlur = 16;
            ctx.fillRect(-4.5, -4.5, 9, 9);
            ctx.restore();
        }
    }

    // ── Animation loop (drift); stops when idle, hidden or paused ──
    let rafId = 0;
    let loopUntil = 0;
    let paused = false;
    let visible = true;

    function loop(now) {
        view.t = now;
        draw();
        if (!paused && visible && !document.hidden && now < loopUntil) {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = 0;
        }
    }

    function keepAlive(ms) {
        if (reduce || lowEnd) { draw(); return; }
        loopUntil = Math.max(loopUntil, performance.now() + ms);
        if (!rafId && !paused) rafId = requestAnimationFrame(loop);
    }

    // ── Timeline helpers (cancellable) ──────────────────────
    let runId = 0;
    const sleep = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === runId ? res() : rej('cancelled')), ms));

    function tween(ms, id, onUpdate) {
        return new Promise((res, rej) => {
            const start = performance.now();
            const step = now => {
                if (id !== runId) return rej('cancelled');
                const t = Math.min(1, (now - start) / ms);
                onUpdate(1 - Math.pow(1 - t, 3));
                if (lowEnd) draw();
                t < 1 ? requestAnimationFrame(step) : res();
            };
            requestAnimationFrame(step);
        });
    }

    function setStep(name, state) {
        const li = steps.find(s => s.dataset.step === name);
        if (!li) return;
        li.classList.remove('is-active', 'is-done');
        if (state) li.classList.add(state);
    }

    function hitsMarkup(sc) {
        return sc.hits.map((h, i) =>
            `<li><a class="tp-hit" href="${h.href}"><span class="tp-n">[${i + 1}]</span>` +
            `<span class="tp-score">${h.score.toFixed(2)}</span><span class="tp-hit-title">${esc(h.title)}</span>` +
            `<span class="tp-metric">${esc(h.metric)}</span></a></li>`).join('');
    }

    function answerTokens(sc) {
        // words, with [n] turned into citation links to the evidence
        return esc(sc.answer).split(/(\s+)/).map(tok =>
            tok.replace(/\[(\d)\]/g, (_, n) => `<a class="cite" href="${sc.hits[n - 1].href}">[${n}]</a>`));
    }

    function setFieldFor(sc, done) {
        view.query = sc.queryPoint;
        view.hitPoints = sc.hits.map(h => h.point);
        view.hitRefs = new Set(sc.hits.map(h => field.refs.indexOf(h.ref)));
        view.queryDrop = done ? 1 : 0;
        view.edges = done ? 1 : 0;
    }

    function showFinal(sc) {
        runId++;
        panel.classList.remove('is-running', 'is-typing');
        qEl.textContent = sc.q;
        steps.forEach(s => s.classList.add('is-done'));
        hitsEl.innerHTML = hitsMarkup(sc);
        answerEl.innerHTML = answerTokens(sc).join('');
        live.textContent = sc.answer;
        setFieldFor(sc, true);
        draw();
    }

    async function play(sc) {
        const id = ++runId;
        try {
            panel.classList.add('is-running', 'is-typing');
            steps.forEach(s => setStep(s.dataset.step, null));
            hitsEl.innerHTML = hitsMarkup(sc);
            answerEl.innerHTML = '';
            live.textContent = '';
            setFieldFor(sc, false);
            keepAlive(12000);

            // 1. type the query
            qEl.textContent = '';
            await sleep(250, id);
            for (const ch of sc.q) {
                qEl.textContent += ch;
                await sleep(24, id);
            }
            panel.classList.remove('is-typing');

            // 2. embed: the query drops into the field
            setStep('embed', 'is-active');
            await tween(500, id, v => { view.queryDrop = v; });
            setStep('embed', 'is-done');

            // 3. retrieve: draw edges, reveal the evidence cards
            setStep('retrieve', 'is-active');
            const cards = [...hitsEl.querySelectorAll('.tp-hit')];
            const edgeAnim = tween(800, id, v => { view.edges = v; });
            for (const card of cards) {
                await sleep(230, id);
                card.classList.add('is-in');
            }
            await edgeAnim;
            setStep('retrieve', 'is-done');

            // 4. generate: stream the grounded answer token by token
            setStep('generate', 'is-active');
            const tokens = answerTokens(sc);
            let out = '';
            for (const tok of tokens) {
                out += tok;
                answerEl.innerHTML = out;
                if (tok.trim()) await sleep(28, id);
            }
            setStep('generate', 'is-done');
            panel.classList.remove('is-running');
            live.textContent = sc.answer;
            keepAlive(8000);
        } catch (e) {
            if (e !== 'cancelled') throw e;
        }
    }

    // ── Wire up ─────────────────────────────────────────────
    const byId = Object.fromEntries(scripts.map(s => [s.id, s]));
    let current = scripts[0];

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const sc = byId[chip.dataset.script];
            if (!sc) return;
            current = sc;
            chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
            reduce || paused ? showFinal(sc) : play(sc);
        });
    });

    new ResizeObserver(resize).observe(fieldBox);
    resize();
    fieldBox.classList.add('has-canvas');

    if (reduce) {
        showFinal(current);
        return;
    }

    toggle.hidden = false;
    toggle.addEventListener('click', () => {
        paused = !paused;
        toggle.setAttribute('aria-label', paused ? 'Replay animation' : 'Pause animation');
        toggle.querySelector('use').setAttribute('href', paused ? '#i-replay' : '#i-pause');
        if (paused) {
            showFinal(current);
            cancelAnimationFrame(rafId);
            rafId = 0;
        } else {
            play(current);
        }
    });

    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) keepAlive(4000);
    }).observe(panel);

    document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAlive(4000); });

    // Start once the page is idle, so it never competes with first paint
    const start = () => play(current);
    'requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300);
}

function esc(s) {
    return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
