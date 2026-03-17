// --- Elements ---
const tabs = {
    workspace: document.getElementById('tab-workspace'),
    library: document.getElementById('tab-library')
};
const views = {
    workspace: document.getElementById('view-workspace'),
    library: document.getElementById('view-library')
};
const preview = document.getElementById('preview-element');
const cssOutput = document.getElementById('css-output');
const copyBtn = document.getElementById('copy-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const previewArea = document.querySelector('.preview-area');

// Inputs
const inputs = {
    x: document.getElementById('x-offset'),
    y: document.getElementById('y-offset'),
    blur: document.getElementById('blur-radius'),
    spread: document.getElementById('spread-radius'),
    sColor: document.getElementById('shadow-color'),
    g1: document.getElementById('grad-color-1'),
    g2: document.getElementById('grad-color-2'),
    angle: document.getElementById('grad-angle'),
    radius: document.getElementById('border-radius'),
    glassBlur: document.getElementById('glass-blur'),
    bgOpac: document.getElementById('bg-opac')
};

const labels = {
    x: document.getElementById('x-val'),
    y: document.getElementById('y-val'),
    blur: document.getElementById('blur-val'),
    spread: document.getElementById('spread-val'),
    angle: document.getElementById('angle-val'),
    radius: document.getElementById('radius-val'),
    glassBlur: document.getElementById('glass-blur-val'),
    bgOpac: document.getElementById('bg-opac-val')
};

const hexLabels = {
    sColor: document.getElementById('shadow-hex'),
    g1: document.getElementById('g1-hex'),
    g2: document.getElementById('g2-hex')
};

// Modal / State
const modal = document.getElementById('save-modal');
let savedSnippets = JSON.parse(localStorage.getItem('devForgeVault')) || [];
let activeEditId = null;

// --- Theme Toggle ---
let isLightMode = false;
themeToggleBtn.onclick = () => {
    isLightMode = !isLightMode;
    previewArea.classList.toggle('light-mode', isLightMode);
    themeToggleBtn.textContent = isLightMode ? '🌙' : '☀️';
};

// --- Helpers ---
function hexToRgba(hex, opacity) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// --- Core Update ---
function updateUI() {
    const x = inputs.x.value, y = inputs.y.value;
    const blur = inputs.blur.value, spread = inputs.spread.value;
    const sColor = inputs.sColor.value;
    const g1 = inputs.g1.value, g2 = inputs.g2.value;
    const angle = inputs.angle.value;
    const radius = inputs.radius.value;
    const glassBlur = inputs.glassBlur.value;
    const bgOpac = inputs.bgOpac.value;

    const shadow = `${x}px ${y}px ${blur}px ${spread}px ${sColor}`;
    const c1 = hexToRgba(g1, bgOpac);
    const c2 = hexToRgba(g2, bgOpac);
    const gradient = `linear-gradient(${angle}deg, ${c1}, ${c2})`;

    preview.style.boxShadow = shadow;
    preview.style.background = gradient;
    preview.style.borderRadius = `${radius}px`;

    let cssText = `background: ${gradient};\nbox-shadow: ${shadow};\nborder-radius: ${radius}px;`;

    // Glassmorphism conditional logic
    if (glassBlur > 0) {
        preview.style.backdropFilter = `blur(${glassBlur}px)`;
        preview.style.webkitBackdropFilter = `blur(${glassBlur}px)`;
        preview.style.border = `1px solid rgba(255,255,255,0.2)`;
        cssText += `\nbackdrop-filter: blur(${glassBlur}px);\n-webkit-backdrop-filter: blur(${glassBlur}px);\nborder: 1px solid rgba(255, 255, 255, 0.2);`;
    } else {
        preview.style.backdropFilter = 'none';
        preview.style.webkitBackdropFilter = 'none';
        preview.style.border = '1px solid transparent'; 
    }

    // Update numeric labels
    labels.x.textContent = x;
    labels.y.textContent = y;
    labels.blur.textContent = blur;
    labels.spread.textContent = spread;
    labels.angle.textContent = angle;
    labels.radius.textContent = radius;
    labels.glassBlur.textContent = glassBlur;
    labels.bgOpac.textContent = bgOpac;

    // Update hex labels
    hexLabels.sColor.textContent = sColor;
    hexLabels.g1.textContent = g1;
    hexLabels.g2.textContent = g2;

    // CSS output
    cssOutput.textContent = cssText;
}

// Live updates
Object.values(inputs).forEach(input => input.addEventListener('input', updateUI));

// --- Tab Logic ---
tabs.workspace.onclick = () => switchTab('workspace');
tabs.library.onclick = () => switchTab('library');

function switchTab(target) {
    Object.keys(views).forEach(k => {
        views[k].classList.toggle('hidden', k !== target);
        views[k].classList.toggle('active-view', k === target);
        tabs[k].classList.toggle('active', k === target);
    });
    if (target === 'library') renderLibrary();
}

// --- Copy CSS ---
copyBtn.onclick = () => {
    // Dynamic text pull removes the need to hardcode the template string here
    navigator.clipboard.writeText(cssOutput.textContent).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
    });
};

// --- Modal Logic ---
function openModal() {
    document.getElementById('snippet-name').value = '';
    document.getElementById('snippet-tag').value = '';
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    activeEditId = null;
}

document.getElementById('open-modal-btn').onclick = openModal;
document.getElementById('cancel-btn').onclick = closeModal;
document.getElementById('cancel-btn-2').onclick = closeModal;
document.querySelector('.modal-backdrop').onclick = closeModal;

document.getElementById('confirm-save-btn').onclick = () => {
    const snippet = {
        id: activeEditId || Date.now(),
        name: document.getElementById('snippet-name').value.trim() || 'Untitled Component',
        tag: document.getElementById('snippet-tag').value.trim() || '#general',
        css: cssOutput.textContent,
        vals: Object.keys(inputs).reduce((acc, k) => ({ ...acc, [k]: inputs[k].value }), {})
    };

    if (activeEditId) {
        const idx = savedSnippets.findIndex(s => s.id === activeEditId);
        if (idx !== -1) savedSnippets[idx] = snippet;
    } else {
        savedSnippets.push(snippet);
    }

    localStorage.setItem('devForgeVault', JSON.stringify(savedSnippets));
    closeModal();
    showToast('Saved to Vault ✓');
};

// --- Toast ---
function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '2rem', left: '50%',
        transform: 'translateX(-50%) translateY(10px)',
        background: 'var(--accent)', color: '#000',
        padding: '0.6rem 1.4rem', borderRadius: '100px',
        fontFamily: 'var(--font-display)', fontWeight: '700',
        fontSize: '0.82rem', zIndex: '999',
        opacity: '0', transition: 'all 0.25s ease'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => t.remove(), 300);
    }, 2200);
}

// --- Library ---
function renderLibrary() {
    const grid = document.getElementById('library-grid');
    const count = document.getElementById('snippet-count');
    count.textContent = savedSnippets.length;

    if (!savedSnippets.length) {
        grid.innerHTML = '<div class="empty-state">Your vault is empty. Save some components first.</div>';
        return;
    }

    grid.innerHTML = '';
    savedSnippets.forEach(s => {
        const cssLines = s.css || '';
        const card = document.createElement('div');
        card.className = 'snippet-card';
        card.innerHTML = `
            <div class="card-preview">
                <div class="card-preview-box" style="${cssLines.replace(/\n/g, ' ')}">Preview</div>
            </div>
            <div class="card-body">
                <div class="card-name">${s.name}</div>
                <span class="card-tag">${s.tag}</span>
                <code class="card-code">${s.css}</code>
                <div class="card-actions">
                    <button class="card-edit-btn" data-id="${s.id}">Edit</button>
                    <button class="card-del-btn" data-id="${s.id}">Delete</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.card-edit-btn').forEach(btn =>
        btn.onclick = () => loadSnippet(parseInt(btn.dataset.id))
    );
    grid.querySelectorAll('.card-del-btn').forEach(btn =>
        btn.onclick = () => deleteSnippet(parseInt(btn.dataset.id))
    );
}

function loadSnippet(id) {
    const s = savedSnippets.find(x => x.id === id);
    if (!s) return;
    Object.keys(s.vals).forEach(k => { if (inputs[k]) inputs[k].value = s.vals[k]; });
    activeEditId = id;
    updateUI();
    switchTab('workspace');
}

function deleteSnippet(id) {
    if (!confirm('Delete this component?')) return;
    savedSnippets = savedSnippets.filter(s => s.id !== id);
    localStorage.setItem('devForgeVault', JSON.stringify(savedSnippets));
    renderLibrary();
}

// Init
updateUI();
