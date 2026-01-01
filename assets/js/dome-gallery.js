
/**
 * Dome Gallery - Vanilla JS Implementation
 * Ported from React component
 */

(function () {
    // Config
    const DEFAULTS = {
        maxVerticalRotationDeg: 15, // Increased slightly for better look
        dragSensitivity: 20,
        enlargeTransitionMs: 400,
        segments: 35,
        dragDampening: 0.6,
        grayscale: true,
        fit: 0.5,
        padFactor: 0.25,
        minRadius: 600,
        maxRadius: 2000
    };

    // State
    const state = {
        rotation: { x: 0, y: 0 },
        startRot: { x: 0, y: 0 },
        startPos: null,
        dragging: false,
        moved: false,
        inertiaRAF: null,
        opening: false,
        openStartedAt: 0,
        lastDragEndAt: 0,
        focusedEl: null,
        originalTilePosition: null, // {left, top, width, height}
        lockedRadius: 600,
        scrollLocked: false
    };

    // Images Pool (Will be populated from DOM or defaults)
    let imagesPool = [];

    // DOM Elements
    let rootEl, mainEl, sphereEl, viewerEl, scrimEl, frameEl;

    // Helpers
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const normalizeAngle = d => ((d % 360) + 360) % 360;
    const wrapAngleSigned = deg => {
        const a = (((deg + 180) % 360) + 360) % 360;
        return a - 180;
    };
    
    // Geometry Builder
    function buildItems(pool, seg) {
        // xCols: -37 to +something in steps of 2
        // Based on original logic: Array.from({ length: seg }, (_, i) => -37 + i * 2);
        // segment count 35 => i=0..34 => -37 .. -37 + 68 = 31
        // Range approx -37 to 31 degrees "units" (not degrees strictly, these become grid coordinates)
        const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
        const evenYs = [-4, -2, 0, 2, 4];
        const oddYs = [-3, -1, 1, 3, 5];

        const coords = xCols.flatMap((x, c) => {
            const ys = c % 2 === 0 ? evenYs : oddYs;
            return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
        });

        const totalSlots = coords.length;
        if (pool.length === 0) return [];
        
        // Normalize pool
        const normalizedImages = pool.map(img => {
            if (typeof img === 'string') return { src: img, alt: '' };
            return { src: img.src || '', alt: img.alt || '' };
        });

        // Fill usedImages wrapping around
        const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

        // Dedup adjacent (simple shuffle check)
        // Original logic:
        for (let i = 1; i < usedImages.length; i++) {
            if (usedImages[i].src === usedImages[i - 1].src) {
                for (let j = i + 1; j < usedImages.length; j++) {
                    if (usedImages[j].src !== usedImages[i].src) {
                        const tmp = usedImages[i];
                        usedImages[i] = usedImages[j];
                        usedImages[j] = tmp;
                        break;
                    }
                }
            }
        }

        return coords.map((c, i) => ({
            ...c,
            src: usedImages[i].src,
            alt: usedImages[i].alt
        }));
    }

    function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
        const unit = 360 / segments / 2; // e.g. 360 / 35 / 2 ≈ 5.14
        const rotateY = unit * (offsetX + (sizeX - 1) / 2);
        const rotateX = unit * (offsetY - (sizeY - 1) / 2);
        return { rotateX, rotateY };
    }

    // --- Core Logic ---

    function applyTransform(xDeg, yDeg) {
        if (sphereEl) {
            // translateZ(-radius) pushes it back so center of sphere is at origin
            sphereEl.style.transform = `translateZ(calc(var(--sphere-radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
        }
    }

    function init() {
        rootEl = document.querySelector('.sphere-root');
        if (!rootEl) return;

        mainEl = rootEl.querySelector('.sphere-main');
        sphereEl = rootEl.querySelector('.sphere');
        viewerEl = rootEl.querySelector('.viewer');
        scrimEl = rootEl.querySelector('.scrim');
        frameEl = rootEl.querySelector('.frame');

        // Extract images from existing DOM or use defaults if empty
        // We will assume the user has populated the pool array or we can fetch defaults
        // For this implementation, let's use the defaults from the React code + the specific user assets
        
        const localImages = [
           "assets/img/Thesis_pic.jpeg",
           "assets/img/PMP_3.JPG",
           "assets/img/AI_Company_Logo.jpg",
           "assets/img/NCUR1.jpg",
           "assets/img/CFC1.jpg",
           "assets/img/Nasa1.jpg",
           "assets/img/Adib1.jpg",
           "assets/img/Diaspura.png",
           "assets/img/ECPC.jpg",
           "assets/img/aspire.jpg",
           "assets/img/AUC1.jpg",
           "assets/img/bac.png",
           "assets/img/me.jpeg",
           "assets/img/911_paper_pic.png",
           "assets/img/llm_swe_process.png",
           "assets/img/orbital_intelligence.png",
           "assets/img/space_train.png",
           "assets/img/Thesis_cover.png"
        ]; // Mixed list

        imagesPool = localImages.map(src => ({ src, alt: "Gallery Image" }));

        // Render Items
        const items = buildItems(imagesPool, DEFAULTS.segments);
        renderItems(items);

        // Resize Observer
        const ro = new ResizeObserver(entries => {
            const cr = entries[0].contentRect;
            const w = Math.max(1, cr.width);
            const h = Math.max(1, cr.height);
            const minDim = Math.min(w, h);
            
            // Calc Radius
            let radius = w * DEFAULTS.fit; // fit width
            const heightGuard = h * 1.35;
            radius = Math.min(radius, heightGuard);
            radius = clamp(radius, DEFAULTS.minRadius, DEFAULTS.maxRadius);
            
            state.lockedRadius = Math.round(radius);
            
            rootEl.style.setProperty('--sphere-radius', `${state.lockedRadius}px`);
            
            // Update enlarge overlay if active
            const enlargedOverlay = viewerEl.querySelector('.enlarge');
            if (enlargedOverlay && frameEl) {
                 const frameR = frameEl.getBoundingClientRect();
                 const mainR = mainEl.getBoundingClientRect();
                 // center it
                 enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
                 enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
                 enlargedOverlay.style.width = `${frameR.width}px`;
                 enlargedOverlay.style.height = `${frameR.height}px`;
            }

            applyTransform(state.rotation.x, state.rotation.y);
        });
        ro.observe(rootEl);

        // Event Listeners
        mainEl.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        
        mainEl.addEventListener('touchstart', onDragStart, { passive: false });
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);

        scrimEl.addEventListener('click', closeItem);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeItem();
        });

        // Initial Transform
        applyTransform(state.rotation.x, state.rotation.y);
    }

    function renderItems(items) {
        sphereEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        items.forEach(it => {
            const rot = computeItemBaseRotation(it.x, it.y, it.sizeX, it.sizeY, DEFAULTS.segments);
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dg-item';
            
            // Store data
            itemDiv.dataset.offsetX = it.x;
            itemDiv.dataset.offsetY = it.y;
            itemDiv.dataset.sizeX = it.sizeX;
            itemDiv.dataset.sizeY = it.sizeY;
            itemDiv.dataset.src = it.src;
            
            // Base transform: Rotate sphere logic
            // The item is placed at rotation X/Y.
            // transform: rotateY(...) rotateX(...) translateZ(radius)
            // Note: Order matters. rotateY first to swing around equator/longitude, then rotateX for latitude. 
            // Wait, React code uses: 
            // parent.style.setProperty('--rot-y-delta', ...) ???
            // No, that's for opening. 
            // The items in the sphere need to be positioned on the sphere surface.
            // React code: Doesn't explicitly show the CSS for .item transform!
            // But `computeItemBaseRotation` returns values.
            // Usually: rotateY(deg) rotateX(deg) translateZ(radius)
            
            itemDiv.style.transform = `rotateY(${rot.rotateY}deg) rotateX(${rot.rotateX}deg) translateZ(var(--sphere-radius))`;

            const imgDiv = document.createElement('div');
            imgDiv.className = 'dg-item__image';
            imgDiv.role = 'button';
            imgDiv.onclick = (e) => {
                e.stopPropagation(); // Prevent drag start somewhat?
                onTileClick(e, itemDiv);
            };
            // Also need touchend handling manually if we prevent defaults
            
            const img = document.createElement('img');
            img.src = it.src;
            img.alt = it.alt;
            img.loading = "lazy";
            img.draggable = false;
            
            imgDiv.appendChild(img);
            itemDiv.appendChild(imgDiv);
            fragment.appendChild(itemDiv);
        });

        sphereEl.appendChild(fragment);
    }

    // --- Interaction ---

    function onDragStart(e) {
        if (state.focusedEl) return;
        
        // If touching an image, we still allow drag, but we need to track if it was a tap or drag
        stopInertia();
        
        state.dragging = true;
        state.moved = false;
        state.startRot = { ...state.rotation };
        
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        state.startPos = { x: cx, y: cy };
        
        // Prevent default only on touch to stop scrolling ONLY if we are horizontal? 
        // Actually for sphere we probably want to stop scrolling
        if (e.touches) {
           // e.preventDefault(); 
        }
    }

    function onDragMove(e) {
        if (!state.dragging || !state.startPos || state.focusedEl) return;
        
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        
        const dx = cx - state.startPos.x;
        const dy = cy - state.startPos.y; // Invert logic: move up (negative dy) -> rotate X negative? 
        
        // Check movement threshold
        if (!state.moved) {
            const dist = dx*dx + dy*dy;
            if (dist > 10) state.moved = true;
        }

        if (state.moved && e.cancelable && e.touches) {
            e.preventDefault(); // Stop scrolling once we confirm it's a drag
        }

        // Update rotation
        // sensitivity: dividing by large number slows it down
        const nextX = clamp(
            state.startRot.x - dy / DEFAULTS.dragSensitivity, 
            -DEFAULTS.maxVerticalRotationDeg, 
            DEFAULTS.maxVerticalRotationDeg
        );
        const nextY = wrapAngleSigned(state.startRot.y + dx / DEFAULTS.dragSensitivity);
        
        state.rotation = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
    }

    function onDragEnd(e) {
        if (!state.dragging) return;
        
        state.dragging = false;
        
        if (state.moved) {
            state.lastDragEndAt = performance.now();
            
            // Calculate velocity (simplistic)
            // Ideally we'd track points. For now just 0 inertia or simple inertia based on last delta?
            // Since we don't have UseGesture's velocity, let's skip inertia or do a very simple glide if needed.
            // We'll skip complex inertia for vanilla port simplicity unless requested.
        }
    }

    function stopInertia() {
        if (state.inertiaRAF) {
            cancelAnimationFrame(state.inertiaRAF);
            state.inertiaRAF = null;
        }
    }

    // --- Enlarge / Zoom ---

    function onTileClick(e, itemEl) {
        if (state.moved || state.dragging) return;
        if (performance.now() - state.lastDragEndAt < 100) return;
        if (state.opening) return;
        
        openItem(itemEl);
    }

    function openItem(el) {
        state.opening = true;
        state.lockedScroll = true;
        document.body.classList.add('dg-scroll-lock');
        
        state.focusedEl = el;
        const imgDiv = el.querySelector('.dg-item__image');
        const img = imgDiv.querySelector('img');
        
        // Calculate rotations to face camera
        // We need the item to rotate to 0,0 relative to camera
        const storedX = parseFloat(el.dataset.offsetX);
        const storedY = parseFloat(el.dataset.offsetY);
        const storedSizeX = parseFloat(el.dataset.sizeX);
        const storedSizeY = parseFloat(el.dataset.sizeY);
        
        const baseRot = computeItemBaseRotation(storedX, storedY, storedSizeX, storedSizeY, DEFAULTS.segments);
        
        // Global rotation
        const globalY = normalizeAngle(state.rotation.y);
        const parentY = normalizeAngle(baseRot.rotateY);
        
        let targetRotY = -(parentY + globalY) % 360;
        if (targetRotY < -180) targetRotY += 360;
        
        const targetRotX = -baseRot.rotateX - state.rotation.x;
        
        // Apply counter-rotation to the specific item so it faces flat to the screen?
        // Actually the React code does something clever:
        // It creates a "reference" div in the sphere but hides the original
        // Then creates an overlay div that flies from the Sphere position to the Frame position.
        
        // 1. Get initial rect of the tile
        const rect = imgDiv.getBoundingClientRect();
        state.originalTilePosition = rect;
        
        // 2. Create Overlay
        const overlay = document.createElement('div');
        overlay.className = 'enlarge';
        const bigImg = img.cloneNode();
        overlay.appendChild(bigImg);
        
        viewerEl.appendChild(overlay);
        viewerEl.classList.add('active'); // show scrim
        
        // 3. Position Overlay at start
        const mainRect = mainEl.getBoundingClientRect();
        const frameRect = frameEl.getBoundingClientRect();
        
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        overlay.style.left = `${rect.left - mainRect.left}px`;
        overlay.style.top = `${rect.top - mainRect.top}px`;
        
        // 4. Force layout
        void overlay.offsetWidth;
        
        // 5. Transition to end (Frame)
        overlay.style.transition = `all ${DEFAULTS.enlargeTransitionMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
        overlay.style.width = `${frameRect.width}px`;
        overlay.style.height = `${frameRect.height}px`;
        overlay.style.left = `${frameRect.left - mainRect.left}px`;
        overlay.style.top = `${frameRect.top - mainRect.top}px`;
        
        // Hide original
        imgDiv.style.visibility = 'hidden';
    }

    function closeItem() {
        if (!state.opening || !state.focusedEl) return;
        
        const overlay = viewerEl.querySelector('.enlarge');
        if (!overlay) return;
        
        const imgDiv = state.focusedEl.querySelector('.dg-item__image');
        const mainRect = mainEl.getBoundingClientRect();
        
        // Need to find where the item is NOW (sphere might have moved? No, we block dragging)
        // Recalculate original position? 
        // Logic: transform overlay back to the original rect we stored, OR recalculate if needed.
        // Since we didn't move the sphere, the stored rect *should* be valid assuming no window resize.
        // Better: use getBoundingClientRect of the invisible item?
        imgDiv.style.visibility = '';
        imgDiv.style.opacity = '0'; // Keep hidden but occupy space
        const targetRect = imgDiv.getBoundingClientRect();
        
        overlay.style.width = `${targetRect.width}px`;
        overlay.style.height = `${targetRect.height}px`;
        overlay.style.left = `${targetRect.left - mainRect.left}px`;
        overlay.style.top = `${targetRect.top - mainRect.top}px`;
        
        viewerEl.classList.remove('active'); // hide scrim
        
        setTimeout(() => {
            overlay.remove();
            imgDiv.style.opacity = '1';
            state.opening = false;
            state.focusedEl = null;
            document.body.classList.remove('dg-scroll-lock');
        }, DEFAULTS.enlargeTransitionMs);
    }
    
    // Auto init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
