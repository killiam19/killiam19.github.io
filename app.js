// ════════════════════════════════════════════════════════
//  KeKiSan TP 3D  —  app.js
// ════════════════════════════════════════════════════════

// ── DOM refs ──────────────────────────────────────────
const contenedor    = document.getElementById("contenedor-3d");
const panelInfo     = document.getElementById("info-modal");
const btnCerrar     = document.getElementById("btn-cerrar");
const toggles       = document.querySelectorAll('.layout-toggle');
const filterBtns    = document.querySelectorAll('.filter-btn');
const toolModal     = document.getElementById("tool-modal");
const toolBtnClose  = document.getElementById("tool-btn-cerrar");
const toolTitle     = document.getElementById("tool-modal-title");
const toolBody      = document.getElementById("tool-modal-body");

// ── State ─────────────────────────────────────────────
let elementosQuimicos  = [];
let totalElementos     = 0;
let modoActual         = 'table';
let filtroActual       = 'all';
let elementoActual     = null;

// Rotation
let anguloX = 0, anguloY = 0;
let targetX = 0, targetY = 0;
let keys = {};
let autoRotX = 0, autoRotY = 0;
const autoSpeed = 0.18;
let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;
let dragVelX = 0, dragVelY = 0;
let inertiaX = 0, inertiaY = 0;

// ════════════════════════════════════════════════════════
//  DATA LOAD
// ════════════════════════════════════════════════════════
async function cargarElementos() {
    try {
        const respuesta = await fetch('elementos.json');
        elementosQuimicos = await respuesta.json();
        totalElementos = elementosQuimicos.length;
        dibujarElementos();
        cambiarVista('table');
        actualizarAnimacion();
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<p style="color:#ff5252;border:2px solid #ff5252;padding:20px;border-radius:8px;">
            Error al cargar los elementos químicos.<br>
            <small>Usa un servidor local: <code>python -m http.server 8000</code></small></p>`;
    }
}

// ════════════════════════════════════════════════════════
//  TABLA PERIÓDICA — draw cards
// ════════════════════════════════════════════════════════
function dibujarElementos() {
    contenedor.innerHTML = "";
    elementosQuimicos.forEach((elemento, indice) => {
        const card = document.createElement("div");
        card.className = `elemento-card ${elemento.familia}`;
        card.id = `card-${elemento.numero}`;
        card.dataset.indice = indice;
        card.dataset.familia = elemento.familia;

        card.innerHTML = `
            <span class="card-num">${elemento.numero}</span>
            <span class="card-sym">${elemento.simbolo}</span>`;

        card.addEventListener("click", e => {
            e.preventDefault(); e.stopPropagation();
            mostrarModalElemento(elemento);
        });

        contenedor.appendChild(card);
    });
}

// ════════════════════════════════════════════════════════
//  DATOS DEL ELEMETO — Generación Lógica de Información
// ════════════════════════════════════════════════════════
function obtenerDatosElemento(elemento) {
    const nombreFamilia = familiaNombres[elemento.familia] || elemento.familia.replace(/-/g, ' ');
    return [
        `El ${elemento.nombre} (${elemento.simbolo}) es un elemento químico con el número atómico ${elemento.numero}, situado en el período ${elemento.periodo} y el grupo ${elemento.grupo || 'N/A'}.`,
        `Pertenece a la categoría de los ${nombreFamilia.toLowerCase()}, compartiendo propiedades características con los miembros de su grupo.`,
        `Posee una masa atómica de ${elemento.peso} g/mol, calculada promediando las abundancias de sus isótopos estables en la naturaleza.`,
        `Su electronegatividad es de ${elemento.electronegatividad !== undefined && elemento.electronegatividad !== null ? elemento.electronegatividad : 'no determinada / gas noble'} en la escala de Pauling, lo que define su afinidad química para formar enlaces.`,
        `Presenta los siguientes estados de oxidación comunes en compuestos químicos: ${elemento.oxidacion || 'ninguno o variables'}.`
    ];
}

function renderCurioContent(container, curiosidades) {
    container.innerHTML = curiosidades
        .map((c, i) => `<div class="curio-item">
            <span class="curio-num">${i + 1}</span>
            <p>${c}</p>
        </div>`).join('');
}

// ════════════════════════════════════════════════════════
//  ELEMENT MODAL
// ════════════════════════════════════════════════════════
const familiaNombres = {
    'alcalinos':'Metales Alcalinos','alcalinoterreos':'Metales Alcalinotérreos',
    'metales-transicion':'Metales de Transición','otros-metales':'Otros Metales',
    'metaloides':'Metaloides','no-metales':'No Metales','halogenos':'Halógenos',
    'gases-nobles':'Gases Nobles','lantanidos':'Lantánidos','actinidos':'Actínidos'
};

function mostrarModalElemento(elemento) {
    elementoActual = elemento;

    document.getElementById("modal-simbolo").innerText    = elemento.simbolo;
    document.getElementById("modal-nombre").innerText     = elemento.nombre;
    document.getElementById("modal-numero").innerText     = elemento.numero;
    document.getElementById("modal-peso").innerText       = elemento.peso;
    document.getElementById("modal-electroneg").innerText = elemento.electronegatividad;
    document.getElementById("modal-oxidacion").innerText  = elemento.oxidacion;
    document.getElementById("modal-grupo").innerText      = elemento.grupo;
    document.getElementById("modal-periodo").innerText    = elemento.periodo;

    const badge = document.getElementById("modal-familia-badge");
    badge.textContent = familiaNombres[elemento.familia] || elemento.familia.replace(/-/g, ' ');
    badge.dataset.familia = elemento.familia;

    const mc = document.querySelector('.modal-content');
    mc.dataset.familia = elemento.familia;

    // Reset data panel
    const panel   = document.getElementById('curiosidades-panel');
    const content = document.getElementById('curiosidades-content');
    const btn     = document.getElementById('btn-curiosidad');
    panel.classList.add('oculto');
    btn.classList.remove('active');

    panelInfo.classList.remove("oculto");
}

// Dynamic info toggle button inside modal
document.getElementById('btn-curiosidad').addEventListener('click', () => {
    if (!elementoActual) return;
    const panel   = document.getElementById('curiosidades-panel');
    const content = document.getElementById('curiosidades-content');
    const btn     = document.getElementById('btn-curiosidad');

    if (!panel.classList.contains('oculto')) {
        panel.classList.add('oculto');
        btn.classList.remove('active');
        return;
    }

    panel.classList.remove('oculto');
    btn.classList.add('active');
    
    const data = obtenerDatosElemento(elementoActual);
    renderCurioContent(content, data);
});

btnCerrar.addEventListener("click", () => panelInfo.classList.add("oculto"));
panelInfo.addEventListener("click", e => { if (e.target === panelInfo) panelInfo.classList.add("oculto"); });

// ════════════════════════════════════════════════════════
//  FILTER + LAYOUT
// ════════════════════════════════════════════════════════
function aplicarFiltro(filtro) {
    filtroActual = filtro;
    document.querySelectorAll('.elemento-card').forEach(card => {
        const match = filtro === 'all' || card.dataset.familia === filtro;
        card.classList.toggle('dimmed',      !match);
        card.classList.toggle('highlighted',  match);
    });
}

function calcularPosiciones(tipo) {
    document.querySelectorAll('.elemento-card').forEach(card => {
        const i = parseInt(card.dataset.indice);
        const el = elementosQuimicos[i];
        if (tipo === 'table') {
            card.style.transform = "";
            card.style.gridColumn = el.grupo;
            card.style.gridRow    = el.periodo;
        } else {
            const radio = 340;
            if (tipo === 'sphere') {
                const phi   = Math.acos(-1 + (2 * i) / totalElementos);
                const theta = Math.sqrt(totalElementos * Math.PI) * phi;
                const x = radio * Math.sin(phi) * Math.cos(theta);
                const y = radio * Math.cos(phi);
                const z = radio * Math.sin(phi) * Math.sin(theta);
                const lat = Math.asin(y / radio);
                const lon = Math.atan2(x, z);
                card.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${lon*180/Math.PI}deg) rotateX(${-lat*180/Math.PI}deg)`;
            } else if (tipo === 'helix') {
                const theta = i * 0.175 + Math.PI;
                const y = (i * 5) - 280;
                const x = radio * 0.75 * Math.sin(theta);
                const z = radio * 0.75 * Math.cos(theta);
                card.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${theta*180/Math.PI}deg)`;
            }
        }
    });
}

function cambiarVista(tipo) {
    modoActual = tipo;
    document.getElementById('hint-3d').classList.toggle('visible', tipo !== 'table');
    anguloX = 0; anguloY = 0;
    targetX = 0; targetY = 0;
    autoRotX = 0; autoRotY = 0;
    inertiaX = 0; inertiaY = 0;
    contenedor.style.transform = "rotateX(0deg) rotateY(0deg)";
    contenedor.className = tipo === 'table' ? "modo-table" : "modo-3d";
    calcularPosiciones(tipo);
    aplicarFiltro(filtroActual);
}

// ── Animation loop ─────────────────────────────────────
function actualizarAnimacion() {
    if (modoActual !== 'table') {
        const vel = 1.5;
        if (keys['ArrowUp'])    { anguloX -= vel; autoRotX -= vel; }
        if (keys['ArrowDown'])  { anguloX += vel; autoRotX += vel; }
        if (keys['ArrowLeft'])  { anguloY -= vel; autoRotY -= vel; }
        if (keys['ArrowRight']) { anguloY += vel; autoRotY += vel; }

        if (!isDragging) {
            inertiaX *= 0.92; inertiaY *= 0.92;
            autoRotY += autoSpeed + inertiaY;
            autoRotX += inertiaX;
            if (modoActual === 'sphere') autoRotX += Math.sin(Date.now() * 0.0003) * 0.05;
        }
        contenedor.style.transform = `rotateX(${autoRotX + anguloX}deg) rotateY(${autoRotY + anguloY}deg)`;
    }
    requestAnimationFrame(actualizarAnimacion);
}

// ── Drag ──────────────────────────────────────────────
const mainEl = document.querySelector('main');
mainEl.addEventListener('mousedown', e => {
    if (modoActual === 'table') return;
    isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY;
    dragVelX = 0; dragVelY = 0;
});
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    dragVelX = (e.clientY - lastMouseY) * 0.25;
    dragVelY = (e.clientX - lastMouseX) * 0.25;
    autoRotX += dragVelX; autoRotY += dragVelY;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
});
window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false; inertiaX = dragVelX; inertiaY = dragVelY;
});
mainEl.addEventListener('touchstart', e => {
    if (modoActual === 'table') return;
    isDragging = true;
    lastMouseX = e.touches[0].clientX; lastMouseY = e.touches[0].clientY;
    dragVelX = 0; dragVelY = 0;
}, { passive: true });
window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    dragVelX = (e.touches[0].clientY - lastMouseY) * 0.25;
    dragVelY = (e.touches[0].clientX - lastMouseX) * 0.25;
    autoRotX += dragVelX; autoRotY += dragVelY;
    lastMouseX = e.touches[0].clientX; lastMouseY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', () => { isDragging = false; inertiaX = dragVelX; inertiaY = dragVelY; });
window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

toggles.forEach(btn => {
    btn.addEventListener('click', () => {
        toggles.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        cambiarVista(btn.id);
    });
});
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        aplicarFiltro(btn.dataset.filter);
    });
});

// ════════════════════════════════════════════════════════
//  NAVIGATION  Tabla ↔ Herramientas
// ════════════════════════════════════════════════════════
document.getElementById('nav-tabla').addEventListener('click', () => {
    document.getElementById('nav-tabla').classList.add('is-active');
    document.getElementById('nav-herramientas').classList.remove('is-active');
    document.getElementById('vista-tabla').classList.remove('oculto');
    document.getElementById('vista-herramientas').classList.add('oculto');
    document.getElementById('filter-bar').classList.remove('oculto');
    document.getElementById('tabla-controls').classList.remove('oculto');
});
document.getElementById('nav-herramientas').addEventListener('click', () => {
    document.getElementById('nav-herramientas').classList.add('is-active');
    document.getElementById('nav-tabla').classList.remove('is-active');
    document.getElementById('vista-herramientas').classList.remove('oculto');
    document.getElementById('vista-tabla').classList.add('oculto');
    document.getElementById('filter-bar').classList.add('oculto');
    document.getElementById('tabla-controls').classList.add('oculto');
});

// ════════════════════════════════════════════════════════
//  TOOL MODAL
// ════════════════════════════════════════════════════════
document.querySelectorAll('.herramienta-card').forEach(card => {
    card.addEventListener('click', () => abrirHerramienta(card.dataset.tool));
});
toolBtnClose.addEventListener('click', () => toolModal.classList.add('oculto'));
toolModal.addEventListener('click', e => { if (e.target === toolModal) toolModal.classList.add('oculto'); });

function abrirHerramienta(id) {
    toolModal.classList.remove('oculto');
    switch (id) {
        case 'balanceador': renderBalanceador(); break;
        case 'masa-molar':  renderMasaMolar();   break;
        case 'solubilidad': renderSolubilidad(); break;
        case 'conversor':   renderConversor();   break;
    }
}

// ════════════════════════════════════════════════════════
//  TOOL 1 — BALANCEADOR
// ════════════════════════════════════════════════════════
function parsearFormula(f) {
    const counts = {};
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let m;
    while ((m = regex.exec(f.trim())) !== null)
        if (m[1]) counts[m[1]] = (counts[m[1]] || 0) + parseInt(m[2] || '1');
    return counts;
}
function parsearLado(lado) {
    return lado.split('+').map(s => parsearFormula(s.trim())).filter(o => Object.keys(o).length > 0);
}

function renderBalanceador() {
    toolTitle.textContent = '⚖ Balanceador de ecuaciones';
    toolBody.innerHTML = `
        <div class="tool-section">
            <div class="tool-row">
                <div class="tool-field">
                    <label>REACTIVOS</label>
                    <input id="bal-reactivos" type="text" placeholder="p. ej., Fe + O2" autocomplete="off">
                </div>
                <span class="tool-arrow">→</span>
                <div class="tool-field">
                    <label>PRODUCTOS</label>
                    <input id="bal-productos" type="text" placeholder="p. ej., Fe2O3" autocomplete="off">
                </div>
            </div>
            <div class="tool-actions">
                <button class="tool-btn-primary" id="bal-btn">Balancear</button>
                <button class="tool-btn-secondary" id="bal-clear">Limpiar</button>
            </div>
            <div id="bal-result" class="tool-result"></div>
            <div class="tool-examples">
                <span>Ejemplos:</span>
                <button class="ex-btn" data-r="H2 + O2" data-p="H2O">H2+O2→H2O</button>
                <button class="ex-btn" data-r="Fe + O2" data-p="Fe2O3">Fe+O2→Fe2O3</button>
                <button class="ex-btn" data-r="CH4 + O2" data-p="CO2 + H2O">CH4+O2</button>
                <button class="ex-btn" data-r="Al + HCl" data-p="AlCl3 + H2">Al+HCl</button>
            </div>
        </div>`;
    document.getElementById('bal-btn').addEventListener('click', balancear);
    document.getElementById('bal-clear').addEventListener('click', () => {
        document.getElementById('bal-reactivos').value = '';
        document.getElementById('bal-productos').value = '';
        document.getElementById('bal-result').innerHTML = '';
    });
    document.querySelectorAll('.ex-btn').forEach(b => b.addEventListener('click', () => {
        document.getElementById('bal-reactivos').value = b.dataset.r;
        document.getElementById('bal-productos').value = b.dataset.p;
        balancear();
    }));
}

function balancear() {
    const rStr = document.getElementById('bal-reactivos').value.trim();
    const pStr = document.getElementById('bal-productos').value.trim();
    const resEl = document.getElementById('bal-result');
    if (!rStr || !pStr) { resEl.innerHTML = '<span class="res-error">Introduce reactivos y productos.</span>'; return; }
    const reactivos = parsearLado(rStr), productos = parsearLado(pStr);
    const elSet = new Set([...reactivos,...productos].flatMap(m => Object.keys(m)));
    const elArr = [...elSet];
    const nr = reactivos.length, np = productos.length, total = nr + np;
    if (total > 5) { resEl.innerHTML = '<span class="res-error">Máx. 5 compuestos.</span>'; return; }
    function check(c) {
        for (const el of elArr) {
            let L = 0, R = 0;
            reactivos.forEach((m,i) => L += (m[el]||0)*c[i]);
            productos.forEach((m,i) => R += (m[el]||0)*c[nr+i]);
            if (L !== R) return false;
        } return true;
    }
    function* combis(len,max) {
        const c = new Array(len).fill(1);
        while (true) {
            yield [...c];
            let i = len-1;
            while (i>=0 && c[i]===max) { c[i]=1; i--; }
            if (i<0) return; c[i]++;
        }
    }
    let found = null;
    for (const c of combis(total, 9)) { if (check(c)) { found = c; break; } }
    if (!found) { resEl.innerHTML = '<span class="res-error">No se pudo balancear. Verifica la ecuación.</span>'; return; }
    const fmt = (comp, c, off) => comp.map((m,i) => {
        const cf = c[i+off];
        const f  = Object.entries(m).map(([el,n]) => n===1?el:`${el}${n}`).join('');
        return `<span class="coef">${cf>1?cf:''}</span>${f}`;
    }).join(' + ');
    resEl.innerHTML = `<div class="res-ok">
        <div class="ec-balanceada">${fmt(reactivos,found,0)} <span class="arrow">→</span> ${fmt(productos,found,nr)}</div>
        <div class="coefs-list">Coeficientes: ${found.join(' : ')}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════
//  TOOL 2 — MASA MOLAR
// ════════════════════════════════════════════════════════
const MASAS = {
    H:1.008,He:4.003,Li:6.941,Be:9.012,B:10.811,C:12.011,N:14.007,O:15.999,
    F:18.998,Ne:20.180,Na:22.990,Mg:24.305,Al:26.982,Si:28.086,P:30.974,S:32.065,
    Cl:35.453,Ar:39.948,K:39.098,Ca:40.078,Sc:44.956,Ti:47.867,V:50.942,Cr:51.996,
    Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,Ga:69.723,Ge:72.630,
    As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62,Y:88.906,Zr:91.224,
    Nb:92.906,Mo:95.95,Tc:98,Ru:101.07,Rh:102.91,Pd:106.42,Ag:107.87,Cd:112.41,
    In:114.82,Sn:118.71,Sb:121.76,Te:127.60,I:126.90,Xe:131.29,Cs:132.91,Ba:137.33,
    La:138.91,Ce:140.12,Pr:140.91,Nd:144.24,Pm:145,Sm:150.36,Eu:151.96,Gd:157.25,
    Tb:158.93,Dy:162.50,Ho:164.93,Er:167.26,Tm:168.93,Yb:173.04,Lu:174.97,Hf:178.49,
    Ta:180.95,W:183.84,Re:186.21,Os:190.23,Ir:192.22,Pt:195.08,Au:196.97,Hg:200.59,
    Tl:204.38,Pb:207.2,Bi:208.98,Po:209,At:210,Rn:222,Fr:223,Ra:226,Ac:227,
    Th:232.04,Pa:231.04,U:238.03,Np:237,Pu:244,Am:243,Cm:247,Bk:247,Cf:251
};

function expandirFormula(f) {
    while (/\(/.test(f)) {
        f = f.replace(/\(([^()]+)\)(\d*)/g, (_, inner, mult) => {
            mult = parseInt(mult||'1');
            return inner.replace(/([A-Z][a-z]?)(\d*)/g,(_,el,n)=>el+(parseInt(n||'1')*mult));
        });
    }
    return f;
}

function calcularMasaMolar(formula) {
    if (formula.includes('.')) {
        let total=0, desglose=[];
        for (const part of formula.split('.')) {
            const m = part.match(/^(\d+)([A-Z].*)/);
            const mult = m ? parseInt(m[1]) : 1;
            const {masa,items} = calcularMasaSimple(m ? m[2] : part);
            total += masa * mult;
            items.forEach(it => {
                const ex = desglose.find(d=>d.el===it.el);
                if (ex) ex.contrib += it.contrib*mult;
                else desglose.push({el:it.el, n:it.n*mult, contrib:it.contrib*mult});
            });
        }
        return {masa:total, desglose};
    }
    const {masa,items} = calcularMasaSimple(formula);
    return {masa, desglose:items};
}

function calcularMasaSimple(formula) {
    const expanded = expandirFormula(formula);
    const counts={};
    const regex=/([A-Z][a-z]?)(\d*)/g; let m;
    while ((m=regex.exec(expanded))!==null)
        if(m[1]) counts[m[1]]=(counts[m[1]]||0)+parseInt(m[2]||'1');
    let total=0; const items=[];
    for (const [el,n] of Object.entries(counts)) {
        const ma = MASAS[el];
        if (!ma) throw new Error(`Elemento desconocido: ${el}`);
        const contrib = ma*n;
        total += contrib;
        items.push({el,n,contrib});
    }
    return {masa:total, items};
}

function renderMasaMolar() {
    toolTitle.textContent = '⚗ Calculadora de masa molar';
    toolBody.innerHTML = `
        <div class="tool-section">
            <div class="tool-field">
                <label>FÓRMULA QUÍMICA</label>
                <input id="mm-input" type="text" placeholder="p. ej. H2O, CuSO4.5H2O, Ca(OH)2" autocomplete="off">
            </div>
            <div class="tool-actions">
                <button class="tool-btn-primary" id="mm-btn">Calcular</button>
                <button class="tool-btn-secondary" id="mm-clear">Limpiar</button>
            </div>
            <div id="mm-result" class="tool-result"></div>
            <div class="tool-examples">
                <span>Ejemplos:</span>
                <button class="ex-btn" data-val="H2O">H2O</button>
                <button class="ex-btn" data-val="NaCl">NaCl</button>
                <button class="ex-btn" data-val="CO2">CO2</button>
                <button class="ex-btn" data-val="C6H12O6">C6H12O6</button>
                <button class="ex-btn" data-val="CuSO4.5H2O">CuSO4·5H2O</button>
                <button class="ex-btn" data-val="Ca(OH)2">Ca(OH)2</button>
            </div>
        </div>`;
    const input = document.getElementById('mm-input');
    document.getElementById('mm-btn').addEventListener('click', () => {
        const f = input.value.replace(/·/g,'.').trim();
        const resEl = document.getElementById('mm-result');
        if (!f) { resEl.innerHTML='<span class="res-error">Introduce una fórmula.</span>'; return; }
        try {
            const {masa,desglose} = calcularMasaMolar(f);
            resEl.innerHTML = `<div class="res-ok">
                <div class="masa-total">${masa.toFixed(4)} <span>g/mol</span></div>
                <table class="masa-table">
                    <thead><tr><th>Elem.</th><th>Átomos</th><th>Masa at.</th><th>Contrib.</th><th>%</th></tr></thead>
                    <tbody>${desglose.map(d=>`
                        <tr><td><strong>${d.el}</strong></td><td>${d.n}</td>
                        <td>${MASAS[d.el]?.toFixed(3)??'?'}</td>
                        <td>${d.contrib.toFixed(3)}</td>
                        <td>${((d.contrib/masa)*100).toFixed(1)}%</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        } catch(e) { resEl.innerHTML=`<span class="res-error">${e.message}</span>`; }
    });
    document.getElementById('mm-clear').addEventListener('click',()=>{input.value='';document.getElementById('mm-result').innerHTML='';});
    document.querySelectorAll('.ex-btn').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.val;document.getElementById('mm-btn').click();}));
}

// ════════════════════════════════════════════════════════
//  TOOL 3 — SOLUBILIDAD (Análisis Lógico basado en Reglas)
// ════════════════════════════════════════════════════════
const REGLAS_SOLUB = [
    {ion:'NO3⁻',nombre:'Nitrato',estado:'SOLUBLE',color:'green',excep:'Siempre soluble'},
    {ion:'CH3COO⁻',nombre:'Acetato',estado:'SOLUBLE',color:'green',excep:'Siempre soluble'},
    {ion:'ClO4⁻',nombre:'Perclorato',estado:'SOLUBLE',color:'green',excep:'Siempre soluble'},
    {ion:'Cl⁻ Br⁻ I⁻',nombre:'Halogenuros',estado:'SOLUBLE',color:'green',excep:'Ag⁺, Pb²⁺, Hg2²⁺',excepTag:'INSOL.'},
    {ion:'F⁻',nombre:'Fluoruro',estado:'SOLUBLE',color:'green',excep:'Ca²⁺, Ba²⁺, Pb²⁺, Mg²⁺',excepTag:'INSOL.'},
    {ion:'SO4²⁻',nombre:'Sulfato',estado:'SOLUBLE',color:'green',excep:'Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺',excepTag:'INSOL.'},
    {ion:'Na⁺ K⁺ Li⁺',nombre:'Alcalinos',estado:'SOLUBLE',color:'green',excep:'Siempre solubles'},
    {ion:'NH4⁺',nombre:'Amonio',estado:'SOLUBLE',color:'green',excep:'Siempre soluble'},
    {ion:'OH⁻',nombre:'Hidróxido',estado:'INSOL.',color:'red',excep:'Gr.1, Ba²⁺, Sr²⁺, NH4⁺',excepTag:'SOL.',nota:'Ca²⁺ ligeramente'},
    {ion:'CO3²⁻',nombre:'Carbonato',estado:'INSOL.',color:'red',excep:'Gr.1, NH4⁺',excepTag:'SOL.'},
    {ion:'PO4³⁻',nombre:'Fosfato',estado:'INSOL.',color:'red',excep:'Gr.1, NH4⁺',excepTag:'SOL.'},
    {ion:'S²⁻',nombre:'Sulfuro',estado:'INSOL.',color:'red',excep:'Gr.1, Gr.2, NH4⁺',excepTag:'SOL.'},
    {ion:'SO3²⁻',nombre:'Sulfito',estado:'INSOL.',color:'red',excep:'Gr.1, NH4⁺',excepTag:'SOL.'},
    {ion:'CrO4²⁻',nombre:'Cromato',estado:'SOLUBLE',color:'green',excep:'Ba²⁺, Pb²⁺, Ag⁺',excepTag:'INSOL.'},
    {ion:'C2O4²⁻',nombre:'Oxalato',estado:'INSOL.',color:'red',excep:'Gr.1, NH4⁺',excepTag:'SOL.'},
    {ion:'SiO3²⁻',nombre:'Silicato',estado:'INSOL.',color:'red',excep:'Gr.1',excepTag:'SOL.'},
];

function analizarSolubilidadLocal(formula) {
    const f = formula.trim();
    
    if (/Na|K|Li|NH4/.test(f)) {
        return {
            formula: f, nombre: "Compuesto de metal alcalino / amonio", nivel: "alta",
            regla: "Los compuestos de metales alcalinos (Grupo 1) y de amonio (NH4⁺) son solubles sin excepciones.",
            notas: "Completamente soluble en agua a 25°C.", aplicaciones: "Reactivos de laboratorio comunes."
        };
    }
    if (/NO3|CH3COO|ClO4/.test(f)) {
        return {
            formula: f, nombre: "Nitrato / Acetato / Perclorato", nivel: "alta",
            regla: "Todos los nitratos, acetatos y percloratos son solubles en agua.",
            notas: "No posee excepciones químicas comunes.", aplicaciones: "Preparación de disoluciones acuosas."
        };
    }
    if (/Cl|Br|I/.test(f)) {
        if (/Ag|Pb|Hg/.test(f)) {
            return {
                formula: f, nombre: "Halogenuro insoluble", nivel: "baja",
                regla: "Los cloruros, bromuros y yoduros son solubles EXCEPTO cuando se enlazan a Ag⁺, Pb²⁺ o Hg2²⁺.",
                notas: "El PbCl2 puede disolverse ligeramente en agua caliente.", aplicaciones: "Precipitado clásico en química analítica."
            };
        }
        return {
            formula: f, nombre: "Halogenuro soluble", nivel: "alta",
            regla: "Los cloruros, bromuros y yoduros son generalmente solubles.",
            notas: "Excelente estabilidad en medio acuoso.", aplicaciones: "Sales solubles neutras."
        };
    }
    if (/SO4/.test(f)) {
        if (/Ba|Pb|Ca|Sr/.test(f)) {
            return {
                formula: f, nombre: "Sulfato insoluble", nivel: "baja",
                regla: "Los sulfatos son solubles EXCEPTO con cationes de bario, plomo, calcio y estroncio.",
                notas: "El BaSO4 es extremadamente insoluble y estable.", aplicaciones: "Ensayos de gravimetría de sulfatos."
            };
        }
        return {
            formula: f, nombre: "Sulfato soluble", nivel: "alta",
            regla: "Los sulfatos son solubles con la mayoría de los metales alcalinos y de transición.",
            notas: "Disociación electrolítica fuerte.", aplicaciones: "Electrólitos y sales industriales."
        };
    }
    if (/OH/.test(f)) {
        if (/Ba|Sr/.test(f)) return { formula: f, nombre: "Hidróxido soluble", nivel: "alta", regla: "Los hidróxidos son insolubles excepto los del Grupo 1, Ba²⁺ y Sr²⁺.", notas: "Bases fuertes.", aplicaciones: "Ajuste de alcalinidad." };
        if (/Ca/.test(f)) return { formula: f, nombre: "Hidróxido ligeramente soluble", nivel: "media", regla: "El Ca(OH)2 es parcialmente soluble.", notas: "Conocido como agua de cal.", aplicaciones: "Neutralización de ácidos." };
        return {
            formula: f, nombre: "Hidróxido insoluble", nivel: "muy_baja",
            regla: "La mayoría de los hidróxidos metálicos son insolubles.",
            notas: "Forman suspensiones o precipitados gelatinosos.", aplicaciones: "Tratamiento y purificación de aguas."
        };
    }
    if (/CO3|PO4|S|SO3|CrO4|C2O4|SiO3/.test(f)) {
        return {
            formula: f, nombre: "Sal insoluble", nivel: "muy_baja",
            regla: "Carbonatos, fosfatos, sulfuros, sulfitos y cromatos son insolubles a menos que contengan Grupo 1 o amonio.",
            notas: "Fáciles de precipitar variando el pH.", aplicaciones: "Componentes minerales e insolubles."
        };
    }
    
    return {
        formula: f, nombre: "Sal / Compuesto general", nivel: "media",
        regla: "No se dedujo una regla directa simple para esta entrada específica.",
        notas: "Verifica los iones individuales en la tabla de reglas generales de abajo.", aplicaciones: "Análisis cualitativo manual."
    };
}

function renderSolubilidad() {
    toolTitle.textContent = '💧 Tabla de solubilidad';
    const filas = REGLAS_SOLUB.map(r=>`
        <tr>
            <td class="ion-cell">${r.ion} <small>${r.nombre}</small></td>
            <td><span class="tag-${r.color}">${r.estado}</span></td>
            <td>${r.excep||''} ${r.excepTag?`<span class="tag-inline">${r.excepTag}`:''}</span> ${r.nota?`<em class="tag-nota">${r.nota}</em>`:''}</td>
        </tr>`).join('');

    toolBody.innerHTML = `
        <div class="tool-section">
            <div class="solub-ai-box">
                <div class="solub-ai-title">🔍 Analizador de compuestos (Lógico)</div>
                <p class="solub-ai-desc">El sistema evalúa instantáneamente la solubilidad teórica del compuesto introducido.</p>
                <div class="tool-row">
                    <div class="tool-field" style="flex:1">
                        <label>FÓRMULA DEL COMPUESTO</label>
                        <input id="sol-ia-input" type="text" placeholder="p. ej. BaSO4, Fe(OH)3, PbCl2, Al2(SO4)3" autocomplete="off">
                    </div>
                    <button class="tool-btn-primary" id="sol-ia-btn">Analizar</button>
                </div>
                <div id="sol-ia-result" class="tool-result" style="margin-top:10px;"></div>
                <div class="tool-examples" style="margin-top:8px;">
                    <span>Prueba:</span>
                    <button class="ex-btn" data-val="AgCl">AgCl</button>
                    <button class="ex-btn" data-val="BaSO4">BaSO4</button>
                    <button class="ex-btn" data-val="Fe(OH)3">Fe(OH)3</button>
                    <button class="ex-btn" data-val="Ca3(PO4)2">Ca3(PO4)2</button>
                    <button class="ex-btn" data-val="CuS">CuS</button>
                    <button class="ex-btn" data-val="Al2(SO4)3">Al2(SO4)3</button>
                </div>
            </div>
            <div class="solub-reglas-title">📋 Reglas generales de solubilidad</div>
            <div style="overflow-x:auto;">
                <table class="solub-table">
                    <thead><tr><th>Ion</th><th>Regla</th><th>Excepciones</th></tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        </div>`;

    function ejecutarAnalisis() {
        const formula = document.getElementById('sol-ia-input').value.trim();
        const resEl   = document.getElementById('sol-ia-result');
        if (!formula) { resEl.innerHTML='<span class="res-error">Introduce una fórmula.</span>'; return; }
        
        const d = analizarSolubilidadLocal(formula);
        const cm = {alta:'green', media:'orange', baja:'red', muy_baja:'red'};
        const tm = {alta:'SOLUBLE', media:'POCO SOLUBLE', baja:'INSOLUBLE', muy_baja:'MUY INSOLUBLE'};
        const color = cm[d.nivel] || 'orange', tag = tm[d.nivel] || 'INDETERMINADO';
        
        resEl.innerHTML = `<div class="res-ok solub-ia-result">
            <div class="solub-ia-top">
                <span class="solub-ia-formula">${d.formula}</span>
                <span class="tag-${color}" style="font-size:.9rem;padding:4px 14px;">${tag}</span>
            </div>
            <div class="solub-ia-nombre">${d.nombre}</div>
            <div class="solub-ia-grid">
                <div class="solub-ia-item full"><span class="label">Regla aplicada</span><span>${d.regla}</span></div>
                <div class="solub-ia-item full"><span class="label">Condiciones / notas</span><span>${d.notas}</span></div>
                <div class="solub-ia-item full"><span class="label">Contexto práctico</span><span>${d.aplicaciones}</span></div>
            </div>
        </div>`;
    }

    document.getElementById('sol-ia-btn').addEventListener('click', ejecutarAnalisis);
    document.getElementById('sol-ia-input').addEventListener('keydown', e => { if(e.key === 'Enter') ejecutarAnalisis(); });
    document.querySelectorAll('.ex-btn').forEach(b => b.addEventListener('click', () => { 
        document.getElementById('sol-ia-input').value = b.dataset.val; 
        ejecutarAnalisis(); 
    }));
}

// ════════════════════════════════════════════════════════
//  TOOL 4 — CONVERSOR
// ════════════════════════════════════════════════════════
function renderConversor() {
    toolTitle.textContent = '🔁 Conversor de unidades';
    toolBody.innerHTML = `
        <div class="tool-section">
            <div class="conv-grid">
                <div class="tool-field">
                    <label>FÓRMULA (si usas gramos)</label>
                    <input id="cv-formula" type="text" placeholder="p. ej. H2O" autocomplete="off">
                </div>
                <div class="tool-field">
                    <label>VALOR</label>
                    <input id="cv-valor" type="number" placeholder="0" step="any" min="0">
                </div>
                <div class="tool-field">
                    <label>DE</label>
                    <select id="cv-de">
                        <option value="mol">mol</option>
                        <option value="g">gramos (g)</option>
                        <option value="mol23">moléculas</option>
                        <option value="L">litros a CN (L)</option>
                        <option value="mmol">milimol (mmol)</option>
                    </select>
                </div>
                <div class="tool-field">
                    <label>A</label>
                    <select id="cv-a">
                        <option value="g">gramos (g)</option>
                        <option value="mol">mol</option>
                        <option value="mol23">moléculas</option>
                        <option value="L">litros a CN (L)</option>
                        <option value="mmol">milimol (mmol)</option>
                    </select>
                </div>
            </div>
            <div class="tool-actions">
                <button class="tool-btn-primary" id="cv-btn">Convertir</button>
                <button class="tool-btn-secondary" id="cv-clear">Limpiar</button>
            </div>
            <div id="cv-result" class="tool-result"></div>
            <div class="conv-info"><p>📌 Avogadro: 6.022×10²³ mol⁻¹ &nbsp;|&nbsp; Vm CN: 22.414 L/mol</p></div>
        </div>`;
    document.getElementById('cv-btn').addEventListener('click', ()=>{
        const formula=document.getElementById('cv-formula').value.trim();
        const valor=parseFloat(document.getElementById('cv-valor').value);
        const de=document.getElementById('cv-de').value, a=document.getElementById('cv-a').value;
        const resEl=document.getElementById('cv-result');
        if(isNaN(valor)||valor<0){resEl.innerHTML='<span class="res-error">Valor inválido.</span>';return;}
        let mm=null;
        if(de==='g'||a==='g'){
            if(!formula){resEl.innerHTML='<span class="res-error">Introduce la fórmula para usar gramos.</span>';return;}
            try{mm=calcularMasaMolar(formula.replace(/·/g,'.')).masa;}catch(e){resEl.innerHTML=`<span class="res-error">${e.message}</span>`;return;}
        }
        const AVOG=6.022e23, VM=22.414;
        const moles={mol:valor,g:valor/mm,mol23:valor/AVOG,L:valor/VM,mmol:valor/1000}[de];
        const res={mol:moles,g:moles*mm,mol23:moles*AVOG,L:moles*VM,mmol:moles*1000}[a];
        const fmt=n=>n<0.001||n>1e9?n.toExponential(4):parseFloat(n.toPrecision(6)).toString();
        const deLbl=document.getElementById('cv-de').options[document.getElementById('cv-de').selectedIndex].text;
        const aLbl=document.getElementById('cv-a').options[document.getElementById('cv-a').selectedIndex].text;
        resEl.innerHTML=`<div class="res-ok">
            <div class="conv-result-big">${fmt(res)} <span>${a==='mol23'?'moléculas':aLbl}</span></div>
            <div class="conv-steps">
                <p>${valor} ${deLbl} ${formula?`de ${formula} (M=${mm?.toFixed(3)} g/mol)`:''}</p>
                <p>= ${fmt(moles)} mol → ${fmt(res)} ${aLbl}</p>
            </div>
        </div>`;
    });
    document.getElementById('cv-clear').addEventListener('click',()=>{
        document.getElementById('cv-formula').value='';
        document.getElementById('cv-valor').value='';
        document.getElementById('cv-result').innerHTML='';
    });
}

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
cargarElementos();