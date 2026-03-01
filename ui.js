// ============================================================
// SYSTEMIC RISK MODEL v4.0 - UI CONTROLLER (Scroll Layout)
// ============================================================

(() => {
'use strict';

let results = null;
let charts = {};
let currentPreset = 'current';
let chartsDrawn = false;

// ---- SCROLL SPY ----
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a');
const navBar = document.getElementById('nav');

function updateNav() {
  const scrollY = window.scrollY + 120;
  let currentId = '';
  sections.forEach(s => {
    if (s.offsetTop <= scrollY) currentId = s.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
  });
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ---- BUILD PRESETS ----
const presetGrid = document.getElementById('preset-grid');
for (const [key, p] of Object.entries(ENGINE.PRESETS)) {
  const el = document.createElement('div');
  el.className = 'preset-card' + (key === 'current' ? ' active' : '');
  el.dataset.preset = key;
  el.innerHTML = `<div class="preset-name">${p.label}</div><div class="preset-desc">${p.desc}</div>`;
  el.addEventListener('click', () => applyPreset(key));
  presetGrid.appendChild(el);
}

// ---- EVENT DESCRIPTIONS ----
const EVENT_INFO = {
  ai: {
    what: 'Structural displacement of cognitive and knowledge work by AI systems. Affects professional, creative, and analytical roles previously considered automation-resistant.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability that significant AI labor displacement fires during 2027-2030. If it fires, it persists for 8 years (displaced jobs do not return). Disruption magnitude: 0.30.`
  },
  ins: {
    what: 'Permanent withdrawal of private insurance from high-risk geographies. Shifts uninsured losses onto public balance sheets. No major insurer has ever returned to a market it abandoned.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of major insurance market failure during 2027-2031. If it fires, it persists for the full 10-year window. Disruption magnitude: 0.25.`
  },
  climate: {
    what: 'Confirmed crossing of a climate tipping point (ice sheet collapse, Amazon dieback, permafrost release). Irreversible once triggered. Late-decade peak reflects the lag between emissions and observable system response.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of a confirmed tipping signal during 2031-2035. If confirmed, it persists permanently (10 years). Disruption magnitude: 0.35.`
  },
  conflict: {
    what: 'Major conventional military conflict between or within significant states. Acute shock to trade, energy, and financial systems. Wars end and economies recover.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of major conventional conflict during 2026-2035. If it fires, it persists for 3 years (acute shock). Disruption magnitude: 0.22.`
  },
  nuclear: {
    what: 'Any use of nuclear weapons in conflict, including tactical deployment. Highest magnitude event in the model. No recovery pathway within the simulation window.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of nuclear exchange during 2026-2035. If it fires, it persists for 10 years. Disruption magnitude: 0.55 (highest in model).`
  },
  pandemic: {
    what: 'Major pandemic or biosecurity event comparable to or exceeding COVID-19. Acute shock with demonstrated societal adaptation capacity. Systems rebuild within 2 years.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of a major pandemic during 2026-2035. If it fires, it persists for 2 years (acute, rapid adaptation). Disruption magnitude: 0.20.`
  },
  debt: {
    what: 'Sovereign debt crisis in one or more G7 economies. Restructuring compresses fiscal space for crisis response. Currently at historical debt-to-GDP levels.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of sovereign debt crisis during 2027-2032. If it fires, it persists for 4 years (restructuring period). Disruption magnitude: 0.28.`
  },
  food: {
    what: 'Structural food system failure: pollinator collapse, soil degradation beyond recovery, or supply chain concentration failure. Not a single-season drought but a systemic shift.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of structural food system shock during 2029-2035. If it fires, it persists for 8 years (structural, not seasonal). Disruption magnitude: 0.30.`
  },
  cyber: {
    what: 'Major cyberattack on critical infrastructure: power grids, financial systems, communications. Acute shock with relatively rapid system rebuild.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of major cyber/infrastructure attack during 2026-2032. If it fires, it persists for 2 years (systems rebuild). Disruption magnitude: 0.26.`
  },
  democracy: {
    what: 'Continued erosion or collapse of democratic governance in major economies. Affects rule of law, contract enforcement, regulatory stability. 18 consecutive years of global decline already observed.',
    interp: (v) => `At ${v}%: there is a ${Math.abs(v)}% cumulative probability of significant democratic collapse during 2026-2031. If it fires, it persists for 10 years (generational recovery). Disruption magnitude: 0.32.`
  },
  energy: {
    what: 'Bidirectional: the trajectory of global energy transition. Negative values = clean energy succeeds (stabilizing). Positive values = transition fails or is disorderly (destabilizing).',
    interp: (v) => {
      if (v < 0) return `At ${v}%: there is a ${Math.abs(v)}% cumulative probability that clean energy transition succeeds significantly during 2028-2034. If it fires, it acts as a stabilizing force for 7 years, partially offsetting other disruptions.`;
      if (v > 0) return `At ${v}%: there is a ${v}% cumulative probability that energy transition fails or is disorderly during 2028-2034. If it fires, it acts as a disruption for 7 years. Magnitude: 0.30.`;
      return 'At 0%: energy transition is neutral. Neither stabilizing nor destabilizing.';
    }
  },
  formation: {
    what: 'Bidirectional: the rate of new institutional capacity building. Negative values = new institutions forming (stabilizing: community resilience, governance innovation, risk pooling). Positive values = institutional decay.',
    interp: (v) => {
      if (v < 0) return `At ${v}%: there is a ${Math.abs(v)}% cumulative probability that significant institutional formation occurs during 2029-2035. If it fires, it acts as a stabilizing force for 8 years.`;
      if (v > 0) return `At ${v}%: there is a ${v}% cumulative probability of accelerating institutional decay during 2029-2035. If it fires, it acts as a disruption for 8 years. Magnitude: 0.25.`;
      return 'At 0%: institutional capacity is neither forming nor decaying.';
    }
  }
};

// ---- BUILD SLIDERS ----
const slidersContainer = document.getElementById('sliders-container');
for (const evt of ENGINE.EVENTS) {
  const isBi = evt.bidirectional;
  const info = EVENT_INFO[evt.id] || { what: evt.desc, interp: (v) => `${v}% probability over the peak window.` };
  const d = document.createElement('div');
  d.className = 'sg';
  d.innerHTML = `
    <div class="sl">
      <span class="sn">${evt.name}${isBi ? ' \u2195' : ''}</span>
      <span class="sv${isBi && evt.base < 0 ? ' neg' : ''}" id="val-${evt.id}">${evt.base}%</span>
    </div>
    <div class="sm"><strong>What is this?</strong> ${info.what}</div>
    <input type="range" id="slider-${evt.id}" min="${isBi ? -80 : 0}" max="${isBi ? 80 : 95}" value="${evt.base}" class="${isBi ? 'stab' : ''}">
    <div class="sm" style="color:var(--teal2);margin-top:0.15rem" id="interp-${evt.id}">${typeof info.interp === 'function' ? info.interp(evt.base) : ''}</div>
  `;
  slidersContainer.appendChild(d);
  const sl = d.querySelector('input');
  const vl = d.querySelector('.sv');
  const interpEl = d.querySelector(`#interp-${evt.id}`);
  sl.addEventListener('input', () => {
    const v = parseInt(sl.value);
    vl.textContent = v + '%';
    vl.classList.toggle('neg', isBi && v < 0);
    if (typeof info.interp === 'function') interpEl.textContent = info.interp(v);
    clearPresetHighlight();
  });
}

// ---- EROI SLIDER ----
const eroiSlider = document.getElementById('slider-eroi');
const eroiVal = document.getElementById('val-eroi');
const eroiInterp = document.getElementById('eroi-interp');
function updateEroiInterp(v) {
  const pct = (v * 0.15 * 100).toFixed(1);
  const desc = v < 0.2 ? 'Minimal EROI pressure. Assumes abundant surplus energy throughout the decade.' :
               v < 0.4 ? 'Low EROI pressure. Modest energy constraints.' :
               v < 0.6 ? 'Moderate EROI decline. Reflects mainstream energy research estimates.' :
               v < 0.8 ? 'Significant EROI decline. Net energy surplus noticeably constraining institutional capacity.' :
               'Severe EROI decline. Consistent with rapid fossil fuel depletion without adequate replacement.';
  eroiInterp.textContent = `At ${v.toFixed(2)}: adds ~${pct}% cumulative downward pressure on transitions by Year 10. ${desc}`;
}
eroiSlider.addEventListener('input', () => {
  const v = parseInt(eroiSlider.value) / 100;
  eroiVal.textContent = v.toFixed(2);
  updateEroiInterp(v);
  clearPresetHighlight();
});

// ---- COMPOUNDING SLIDER ----
const compSlider = document.getElementById('slider-compounding');
const compVal = document.getElementById('val-compounding');
const compInterp = document.getElementById('comp-interp');
function updateCompInterp(v) {
  // Calculate what 3 events at rawP=0.5 would produce
  const comp3 = (1 - Math.pow(0.5, 1 + 3 * v)) ;
  const additive = 0.5;
  const amplification = ((comp3 / additive - 1) * 100).toFixed(0);
  const desc = v <= 0.15 ? 'Conservative: crises are mostly independent. Appropriate if you believe institutional firewalls effectively contain cascades.' :
               v <= 0.25 ? 'Moderate: meaningful interaction between simultaneous crises but limited cascade amplification.' :
               v <= 0.35 ? 'Calibrated default: three simultaneous crises produce significant emergent damage. Based on 2008 financial crisis dynamics.' :
               'Aggressive: strong cascade amplification. Appropriate if you believe institutional interconnection is deeper than conventional models assume.';
  compInterp.textContent = `At ${v.toFixed(2)}: three simultaneous events produce ~${amplification}% more pressure than their sum. ${desc}`;
}
compSlider.addEventListener('input', () => {
  const v = parseInt(compSlider.value) / 100;
  compVal.textContent = v.toFixed(2);
  updateCompInterp(v);
  clearPresetHighlight();
});

// ---- STARTING STATE ----
const startInterp = document.getElementById('start-interp');
const startDescs = {
  0: 'At "Stable": the world begins with institutions functioning well and disruptions absorbed. Requires belief that 2026 conditions are better than observable data suggests.',
  1: 'At "Managed": the world begins with measurable stress across multiple domains but institutions still operational. This is where observable 2026 data places us.',
  2: 'At "Severe": the world begins already in significant disruption. Multiple crises active and institutional capacity strained. A pessimistic starting point.',
  3: 'At "Crisis": the world begins in institutional failure. An extreme starting point that assumes 2026 conditions are already critical.'
};
document.querySelectorAll('.sso-o').forEach(o => {
  o.addEventListener('click', () => {
    document.querySelectorAll('.sso-o').forEach(x => x.classList.remove('active'));
    o.classList.add('active');
    startInterp.textContent = startDescs[parseInt(o.dataset.state)] || '';
    clearPresetHighlight();
  });
});

// ---- CORRELATION MATRIX ----
buildCorrMatrix();

// ---- METHODOLOGY TABLE ----
buildMethodTable();

// ---- PRESET APPLICATION ----
function applyPreset(key) {
  const p = ENGINE.PRESETS[key];
  if (!p) return;
  currentPreset = key;
  document.querySelectorAll('.preset-card').forEach(c => c.classList.toggle('active', c.dataset.preset === key));
  for (const evt of ENGINE.EVENTS) {
    const sl = document.getElementById('slider-' + evt.id);
    const vl = document.getElementById('val-' + evt.id);
    const interpEl = document.getElementById('interp-' + evt.id);
    const v = p[evt.id] !== undefined ? p[evt.id] : evt.base;
    sl.value = v;
    vl.textContent = v + '%';
    vl.classList.toggle('neg', evt.bidirectional && v < 0);
    const info = EVENT_INFO[evt.id];
    if (info && typeof info.interp === 'function' && interpEl) interpEl.textContent = info.interp(v);
  }
  document.querySelectorAll('.sso-o').forEach(o => {
    const st = parseInt(o.dataset.state);
    o.classList.toggle('active', st === (p.startState || 1));
  });
  startInterp.textContent = startDescs[p.startState || 1] || '';
  const er = p.eroi !== undefined ? p.eroi : 0.5;
  eroiSlider.value = Math.round(er * 100);
  eroiVal.textContent = er.toFixed(2);
  updateEroiInterp(er);
  // Compounding stays at user setting unless preset specifies it
  const comp = p.compounding !== undefined ? p.compounding : 0.3;
  compSlider.value = Math.round(comp * 100);
  compVal.textContent = comp.toFixed(2);
  updateCompInterp(comp);
  runSim();
}

function clearPresetHighlight() {
  document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
  currentPreset = null;
}

// ---- GATHER PARAMS ----
function gatherParams() {
  const params = {};
  for (const evt of ENGINE.EVENTS) {
    params[evt.id] = parseInt(document.getElementById('slider-' + evt.id).value);
  }
  const activeState = document.querySelector('.sso-o.active');
  params.startState = activeState ? parseInt(activeState.dataset.state) : 1;
  params.eroi = parseInt(eroiSlider.value) / 100;
  params.compounding = parseInt(compSlider.value) / 100;
  return params;
}

// ---- RUN ----
document.getElementById('btn-run').addEventListener('click', runSim);
document.getElementById('btn-reroll').addEventListener('click', runSim);

function runSim() {
  const status = document.getElementById('sim-status');
  status.textContent = 'Running...';
  setTimeout(() => {
    const params = gatherParams();
    results = ENGINE.runSimulations(params, 5000);
    updateAll();
    status.textContent = 'Complete. 5,000 simulations.';
    setTimeout(() => { status.textContent = ''; }, 2500);
  }, 30);
}

// ---- UPDATE ALL ----
function updateAll() {
  if (!results) return;
  const r = results;
  const t = r.terminalStates;
  const n = t.reduce((a, b) => a + b, 0);
  const pct = t.map(v => v / n);

  const sevP = ((pct[2] + pct[3] + pct[4]) * 100).toFixed(1);
  const criP = ((pct[3] + pct[4]) * 100).toFixed(1);
  setStatColor('qs-sev', sevP + '%', sevP);
  setStatColor('qs-cri', criP + '%', criP);

  const subY10 = r.substrateHealth[10];
  document.getElementById('qs-sub-val').textContent = subY10.toFixed(0) + '/100';
  const subFill = document.getElementById('qs-sub');
  subFill.style.width = Math.max(3, subY10) + '%';
  subFill.style.background = subY10 > 60 ? 'var(--green)' : subY10 > 35 ? 'var(--amber)' : 'var(--red)';

  setStatColor('stat-severe', sevP + '%', sevP);
  setStatColor('stat-crisis', criP + '%', criP);
  setStatColor('stat-civil', (pct[4] * 100).toFixed(1) + '%', pct[4] * 100);

  const bar = document.getElementById('dist-bar');
  bar.innerHTML = '';
  const leg = document.getElementById('dist-legend');
  leg.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const seg = document.createElement('div');
    seg.className = 'sseg';
    seg.style.width = (pct[i] * 100).toFixed(1) + '%';
    seg.style.background = ENGINE.STATE_COLORS[i];
    if (pct[i] > 0.04) seg.textContent = (pct[i] * 100).toFixed(0) + '%';
    bar.appendChild(seg);
    const li = document.createElement('div');
    li.className = 'sleg-i';
    li.innerHTML = `<div class="sdot" style="background:${ENGINE.STATE_COLORS[i]}"></div>${ENGINE.STATES[i]} ${(pct[i]*100).toFixed(1)}%`;
    leg.appendChild(li);
  }

  setStatColor('q-severe', sevP + '%', sevP);
  const casEl = document.getElementById('cascade-prob');
  casEl.textContent = ((pct[3] + pct[4]) * 100).toFixed(1) + '%';

  document.getElementById('p-cm').textContent = '$' + fmt(ENGINE.median(r.portfolios.conv)) + 'M';
  document.getElementById('p-rm').textContent = '$' + fmt(ENGINE.median(r.portfolios.real)) + 'M';
  document.getElementById('p-fm').textContent = '$' + fmt(ENGINE.median(r.portfolios.form)) + 'M';
  document.getElementById('p-c10').textContent = '$' + fmt(ENGINE.pctl(r.portfolios.conv, 10)) + 'M';
  document.getElementById('p-r10').textContent = '$' + fmt(ENGINE.pctl(r.portfolios.real, 10)) + 'M';
  document.getElementById('p-f10').textContent = '$' + fmt(ENGINE.pctl(r.portfolios.form, 10)) + 'M';

  drawCharts();
}

function setStatColor(id, text, val) {
  const el = document.getElementById(id);
  el.textContent = text;
  const v = parseFloat(val);
  el.className = 'stat-v ' + (v >= 40 ? 'danger' : v >= 20 ? 'warning' : 'safe');
}

function fmt(v) { return (v / 100 * 100).toFixed(1); }

// ---- CHARTS ----
function drawCharts() {
  if (!results) return;
  drawTimeline();
  drawPaths();
  drawSubstrate();
  drawCascadeChart();
  drawTrajectory();
  drawPortfolioDist();
  chartsDrawn = true;
}

const cDef = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(30,45,64,0.5)' }, ticks: { color: '#4d6070', font: { family: "'DM Sans'", size: 10 } } },
    y: { grid: { color: 'rgba(30,45,64,0.5)' }, ticks: { color: '#4d6070', font: { family: "'JetBrains Mono'", size: 10 } } }
  }
};

function makeChart(id, config) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  charts[id] = new Chart(ctx, config);
  return charts[id];
}

function drawTimeline() {
  const r = results;
  const labels = Array.from({length:11}, (_,i) => 2026+i);
  const datasets = [];
  for (let s = 4; s >= 0; s--) {
    datasets.push({
      label: ENGINE.STATES[s],
      data: r.yearlyDist.map(yr => { const t = yr.reduce((a,b)=>a+b,0); return (yr[s]/t)*100; }),
      backgroundColor: ENGINE.STATE_COLORS[s] + 'cc',
      borderColor: ENGINE.STATE_COLORS[s],
      borderWidth: 0.5,
      fill: true,
    });
  }
  makeChart('chart-timeline', {
    type: 'line', data: { labels, datasets },
    options: { ...cDef, plugins: { ...cDef.plugins, tooltip: { mode: 'index', intersect: false } },
      scales: { ...cDef.scales, y: { ...cDef.scales.y, stacked: true, min: 0, max: 100, ticks: { ...cDef.scales.y.ticks, callback: v => v + '%' } }, x: { ...cDef.scales.x, stacked: true } },
      elements: { point: { radius: 0 }, line: { tension: 0.3 } }
    }
  });
}

function drawPaths() {
  const labels = Array.from({length:11}, (_,i) => 2026+i);
  const datasets = results.samplePaths.slice(0, 80).map((p) => ({
    data: p, borderColor: ENGINE.STATE_COLORS[p[p.length-1]] + '30', borderWidth: 0.8, pointRadius: 0, tension: 0.2,
  }));
  makeChart('chart-paths', {
    type: 'line', data: { labels, datasets },
    options: { ...cDef, scales: { ...cDef.scales, y: { ...cDef.scales.y, min: -0.3, max: 4.3, ticks: { ...cDef.scales.y.ticks, callback: v => ENGINE.STATE_SHORT[Math.round(v)] || '' } } } }
  });
}

function drawSubstrate() {
  const labels = Array.from({length:11}, (_,i) => 2026+i);
  const data = results.substrateHealth;
  makeChart('chart-substrate', {
    type: 'line',
    data: { labels, datasets: [{
        label: 'Substrate Health', data, borderColor: '#0d9da0', backgroundColor: 'rgba(13,157,160,0.1)', fill: true, borderWidth: 2, pointRadius: 3,
        pointBackgroundColor: data.map(v => v > 60 ? '#3a9e6e' : v > 35 ? '#c49a40' : '#c44040'), tension: 0.3,
      },{ label: 'Critical Threshold', data: new Array(11).fill(50), borderColor: 'rgba(196,64,64,0.4)', borderDash: [6,4], borderWidth: 1, pointRadius: 0, fill: false }]
    },
    options: { ...cDef, scales: { ...cDef.scales, y: { ...cDef.scales.y, min: 0, max: 105 } } }
  });
}

function drawCascadeChart() {
  makeChart('chart-cascade', {
    type: 'bar',
    data: { labels: ['Physical\nRisk', 'Insurance\nRetreat', 'Municipal\nStress', 'Sovereign\nContagion', 'Full\nCascade'],
      datasets: [{ data: [22, 33, 52, 71, 86],
        backgroundColor: ['#c49a40aa','#c49a40aa','#c44040aa','#c44040aa','#c44040'],
        borderColor: ['#c49a40','#c49a40','#c44040','#c44040','#c44040'], borderWidth: 1 }]
    },
    options: { ...cDef, indexAxis: 'y', scales: { ...cDef.scales, x: { ...cDef.scales.x, min: 0, max: 100, ticks: { ...cDef.scales.x.ticks, callback: v => v + '%' } } } }
  });
}

function drawTrajectory() {
  const labels = Array.from({length:11}, (_,i) => 2026+i);
  const r = results;
  makeChart('chart-trajectory', {
    type: 'line',
    data: { labels, datasets: [
      { label: '', data: r.percentilePaths.conv10, borderColor: 'transparent', backgroundColor: 'rgba(196,64,64,0.08)', fill: '+1', pointRadius: 0 },
      { label: '', data: r.percentilePaths.conv90, borderColor: 'transparent', backgroundColor: 'transparent', fill: false, pointRadius: 0 },
      { label: 'Conventional', data: r.medianPaths.conv, borderColor: '#c44040', borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#c44040', tension: 0.3, fill: false },
      { label: 'Resilient Real Assets', data: r.medianPaths.real, borderColor: '#c49a40', borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#c49a40', tension: 0.3, fill: false },
      { label: '', data: r.percentilePaths.form10, borderColor: 'transparent', backgroundColor: 'rgba(13,157,160,0.08)', fill: '+1', pointRadius: 0 },
      { label: '', data: r.percentilePaths.form90, borderColor: 'transparent', backgroundColor: 'transparent', fill: false, pointRadius: 0 },
      { label: 'Formation Capital', data: r.medianPaths.form, borderColor: '#0d9da0', borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#0d9da0', tension: 0.3, fill: false },
    ]},
    options: { ...cDef,
      plugins: { ...cDef.plugins, legend: { display: true, labels: { color: '#7a8fa0', font: { family: "'DM Sans'", size: 10 }, filter: item => item.text && item.text.length > 0 } } },
      scales: { ...cDef.scales, y: { ...cDef.scales.y, ticks: { ...cDef.scales.y.ticks, callback: v => '$' + (v).toFixed(0) + 'M' } } }
    }
  });
}

function drawPortfolioDist() {
  const r = results;
  const bins = 40, min = 0, max = 300, bw = (max - min) / bins;
  const labels = [];
  const dC = new Array(bins).fill(0), dR = new Array(bins).fill(0), dF = new Array(bins).fill(0);
  for (let i = 0; i < bins; i++) labels.push('$' + (min + i * bw).toFixed(0) + 'M');
  const binIt = (arr, d) => { for (const v of arr) { const vi = v / 100 * 100; const b = Math.min(bins - 1, Math.max(0, Math.floor((vi - min) / bw))); d[b]++; } const n = arr.length; for (let i = 0; i < bins; i++) d[i] = (d[i] / n) * 100; };
  binIt(r.portfolios.conv, dC); binIt(r.portfolios.real, dR); binIt(r.portfolios.form, dF);
  makeChart('chart-portfolio', {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Conventional', data: dC, backgroundColor: '#c4404060', borderColor: '#c44040', borderWidth: 0.5 },
      { label: 'Resilient Real', data: dR, backgroundColor: '#c49a4050', borderColor: '#c49a40', borderWidth: 0.5 },
      { label: 'Formation', data: dF, backgroundColor: '#0d9da050', borderColor: '#0d9da0', borderWidth: 0.5 },
    ]},
    options: { ...cDef,
      plugins: { ...cDef.plugins, legend: { display: true, labels: { color: '#7a8fa0', font: { family: "'DM Sans'", size: 10 } } } },
      scales: { ...cDef.scales, x: { ...cDef.scales.x, ticks: { ...cDef.scales.x.ticks, maxTicksLimit: 10 } }, y: { ...cDef.scales.y, ticks: { ...cDef.scales.y.ticks, callback: v => v.toFixed(0) + '%' } } }
    }
  });
}

// ---- CORRELATION MATRIX ----
function buildCorrMatrix() {
  const ids = ['ins','debt','climate','food','ai','democracy','conflict','cyber','nuclear'];
  const names = { ins:'INS', debt:'DEBT', climate:'CLIM', food:'FOOD', ai:'AI', democracy:'DEM', conflict:'CONF', cyber:'CYB', nuclear:'NUC' };
  const n = ids.length;
  const el = document.getElementById('corr-matrix');
  const lookup = {};
  for (const [a, b, m] of ENGINE.CORRELATIONS) { lookup[a + '|' + b] = m; lookup[b + '|' + a] = m; }
  let html = `<div class="corr-g" style="grid-template-columns:repeat(${n+1},1fr)">`;
  html += `<div class="corr-c hdr"></div>`;
  for (const id of ids) html += `<div class="corr-c hdr">${names[id]}</div>`;
  for (let r = 0; r < n; r++) {
    html += `<div class="corr-c hdr">${names[ids[r]]}</div>`;
    for (let c = 0; c < n; c++) {
      if (r === c) { html += `<div class="corr-c dg">-</div>`; }
      else { const key = ids[r] + '|' + ids[c]; const v = lookup[key]; if (v) { const cls = v >= 1.4 ? 'hi' : v >= 1.2 ? 'md' : ''; html += `<div class="corr-c ${cls}">${v.toFixed(1)}x</div>`; } else { html += `<div class="corr-c">1.0</div>`; } }
    }
  }
  html += '</div>';
  el.innerHTML = html;
}

// ---- METHODOLOGY TABLE ----
function buildMethodTable() {
  const body = document.getElementById('meth-body');
  for (const evt of ENGINE.EVENTS) {
    const src = ENGINE.SOURCES[evt.id] || '';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${evt.name}</strong></td><td class="mono">${evt.base}%</td><td class="mono">Y${evt.peak[0]}-${evt.peak[1]}</td><td class="mono">${evt.mag.toFixed(2)}</td><td class="mono">${evt.dur}yr</td><td style="font-size:0.65rem;color:var(--text2)">${src}</td>`;
    body.appendChild(tr);
  }
}

// ---- INITIAL RUN ----
applyPreset('current');

})();
