// ============================================================
// SYSTEMIC RISK PROJECTION MODEL v4.0 - ENGINE
// Monte Carlo State-Transition Framework
// 5,000 simulations · 12 vectors · 5 world-states
// EROI background constraint · Substrate health index
// Event correlation · Persistence · Recovery degradation
// ============================================================

const ENGINE = (() => {

const STATES = ['Stable Adaptation','Managed Disruption','Severe Disruption','Systemic Crisis','Civilisational Stress'];
const STATE_COLORS = ['#3a9e6e','#0d9da0','#c49a40','#c44040','#8b2020'];
const STATE_SHORT = ['SA','MD','SD','SC','CS'];

const EVENTS = [
  { id:'ai',       name:'AI Labour Displacement',   base:55, peak:[1,4], mag:0.30, dur:8,  recovery:true,  desc:'Structural automation of cognitive labour. No reversal once deployed.' },
  { id:'ins',      name:'Insurance Market Failure',  base:70, peak:[1,5], mag:0.25, dur:10, recovery:true,  desc:'Permanent withdrawal. No major insurer has returned to a withdrawn market.' },
  { id:'climate',  name:'Climate Tipping Signal',    base:30, peak:[5,9], mag:0.35, dur:10, recovery:false, desc:'Irreversible once confirmed. Late-decade peak reflects observation lag.' },
  { id:'conflict', name:'Conventional Conflict',     base:25, peak:[0,9], mag:0.22, dur:3,  recovery:true,  desc:'Acute shock. Wars end, economic recovery follows.' },
  { id:'nuclear',  name:'Nuclear Exchange',          base:8,  peak:[0,9], mag:0.55, dur:10, recovery:true,  desc:'Highest magnitude. No within-window recovery pathway.' },
  { id:'pandemic', name:'Pandemic / Biosecurity',    base:20, peak:[0,9], mag:0.20, dur:2,  recovery:true,  desc:'Acute shock with rapid adaptation. 2-year persistence.' },
  { id:'debt',     name:'Sovereign Debt Crisis',     base:35, peak:[1,6], mag:0.28, dur:4,  recovery:true,  desc:'Restructuring takes years. Compressed fiscal space for crisis response.' },
  { id:'food',     name:'Food System Shock',         base:25, peak:[3,9], mag:0.30, dur:8,  recovery:false, desc:'Structural: pollinator loss, soil degradation, supply chain fragility.' },
  { id:'cyber',    name:'Cyber / Infrastructure',    base:35, peak:[0,6], mag:0.26, dur:2,  recovery:true,  desc:'Acute shock. Systems rebuild, trust recovers.' },
  { id:'democracy',name:'Democratic Collapse',       base:40, peak:[0,5], mag:0.32, dur:10, recovery:true,  desc:'Generational recovery. 18 consecutive years of global decline.' },
  { id:'energy',   name:'Energy Transition',         base:-20,peak:[2,8], mag:0.30, dur:7,  recovery:false, bidirectional:true, desc:'Bidirectional. Negative = clean energy success (stabilising). Positive = disorderly failure.' },
  { id:'formation',name:'Institutional Formation',   base:-15,peak:[3,9], mag:0.25, dur:8,  recovery:false, bidirectional:true, desc:'Bidirectional. Negative = new institutional capacity (stabilising). Positive = institutional decay.' },
];

const SOURCES = {
  ai:       'MIT Work of the Future Lab; BLS Occupational Outlook. College graduate unemployment hit 5.8% in late 2025.',
  ins:      'CA Dept. of Insurance; FAIR Plan data. 668,609 policies by Dec 2025, 146% increase since Sep 2022. 18+ US states affected.',
  climate:  'IPCC AR6; Armstrong McKay et al. (2022). 5 tipping elements at risk below 1.5°C.',
  conflict: 'ACLED 2024 Annual Report; SIPRI Military Expenditure Database. Highest fatalities since 1994.',
  nuclear:  'Bulletin of Atomic Scientists Doomsday Clock 2025. 90 seconds to midnight, closest in 77 years.',
  pandemic: 'WHO IHR Review Committee 2024; Global Health Security Index. Average score 38.9/100, unchanged since 2019.',
  debt:     'IMF World Economic Outlook 2025; BIS Annual Report. G7 debt-to-GDP at historical highs.',
  food:     'FAO SOFI 2024; IPCC Chapter 5. Third consecutive year of elevated food price volatility.',
  cyber:    'CISA 2024 Threat Assessment; WEF Global Risk Report 2025. Top-5 global risk three consecutive years.',
  democracy:'Freedom House 2025; V-Dem Institute. 18 consecutive years of global democratic decline.',
  energy:   'IEA World Energy Outlook 2024. Default -20% reflects Announced Pledges Scenario.',
  formation:'Design parameter. Reflects current low levels of institutional innovation investment.',
};

// Pairwise correlation multipliers
const CORRELATIONS = [
  ['ins','debt',     1.4],
  ['ins','climate',  1.3],
  ['democracy','conflict', 1.3],
  ['democracy','debt', 1.25],
  ['climate','food',  1.5],
  ['ai','democracy',  1.2],
  ['ai','debt',       1.2],
  ['conflict','cyber', 1.3],
  ['debt','ins',      1.3],
  ['food','conflict', 1.3],
  ['nuclear','conflict',1.2],
  ['cyber','ins',     1.2],
];

// Base transition matrix (zero events, no EROI pressure)
const BASE_MATRIX = [
  [0.970, 0.025, 0.004, 0.001, 0.000],
  [0.350, 0.520, 0.100, 0.025, 0.005],
  [0.080, 0.270, 0.450, 0.150, 0.050],
  [0.020, 0.080, 0.220, 0.500, 0.180],
  [0.000, 0.020, 0.080, 0.250, 0.650],
];

// Portfolio returns [state][strategy: Conventional, Resilient Real Assets, Formation Capital]
const RETURNS = [
  [0.07, 0.05, 0.04],
  [0.02, 0.06, 0.08],
  [-0.10, 0.02, 0.10],
  [-0.28, -0.08, 0.03],
  [-0.50, -0.20, -0.08],
];

const RETURN_LABELS = ['Conventional','Resilient Real Assets','Formation Capital'];
const RETURN_COLORS = ['#c44040','#c49a40','#0d9da0'];

// ============================================================
// PRESETS - Story-driven
// ============================================================
const PRESETS = {
  optimist: {
    label: 'Optimist',
    desc: 'Strong institutions, rapid adaptation, successful energy transition. Requires belief that current trends reverse.',
    ai:25, ins:30, climate:15, conflict:15, nuclear:3, pandemic:10, debt:15, food:10, cyber:15, democracy:15, energy:-40, formation:-30, startState:0, eroi:0.2
  },
  adaptation: {
    label: 'Adaptation Succeeds',
    desc: 'Energy transition and institutional formation at strong levels. Everything else moderate. Shows whether positive vectors can overcome structural threats.',
    ai:40, ins:50, climate:25, conflict:20, nuclear:5, pandemic:15, debt:25, food:20, cyber:25, democracy:30, energy:-60, formation:-40, startState:1, eroi:0.3
  },
  current: {
    label: 'Current Trajectory',
    desc: 'Observable trends projected forward. No assumption of improvement or deterioration. Default 2026 starting point.',
    ai:55, ins:70, climate:30, conflict:25, nuclear:8, pandemic:20, debt:35, food:25, cyber:35, democracy:40, energy:-20, formation:-15, startState:1, eroi:0.5
  },
  twothings: {
    label: 'Just Two Things',
    desc: 'Only insurance failure and sovereign debt at high levels. Everything else low. Shows how correlation and cascade amplify even limited disruption.',
    ai:15, ins:85, climate:10, conflict:10, nuclear:3, pandemic:10, debt:65, food:10, cyber:15, democracy:15, energy:-25, formation:-20, startState:1, eroi:0.3
  },
  natesworld: {
    label: 'The Simplification',
    desc: 'Nate Hagens\u2019 thesis: declining EROI, material constraints binding, energy transition struggling. The biophysical squeeze without acute crises.',
    ai:35, ins:55, climate:40, conflict:20, nuclear:5, pandemic:15, debt:45, food:40, cyber:20, democracy:30, energy:15, formation:-10, startState:1, eroi:0.8
  },
  tindaletrap: {
    label: 'The Tindale Trap',
    desc: 'Current monetary framework producing long-run misallocation. Sovereign debt and democratic stress high, no catastrophic events. The slow structural contradiction.',
    ai:45, ins:60, climate:25, conflict:15, nuclear:5, pandemic:15, debt:70, food:20, cyber:25, democracy:55, energy:-15, formation:5, startState:1, eroi:0.5
  },
  convergence: {
    label: 'The Convergence',
    desc: 'Multiple front-loaded threats fire simultaneously in 2026-2030. The window of acute vulnerability followed by a persistence trap.',
    ai:65, ins:80, climate:35, conflict:30, nuclear:10, pandemic:25, debt:50, food:30, cyber:45, democracy:50, energy:-10, formation:-5, startState:1, eroi:0.6
  },
  pessimist: {
    label: 'Pessimist',
    desc: 'Multiple systems already failing. Most events at high probability. Represents the view that 2026 conditions are worse than commonly acknowledged.',
    ai:75, ins:85, climate:50, conflict:45, nuclear:15, pandemic:35, debt:55, food:45, cyber:50, democracy:60, energy:20, formation:5, startState:2, eroi:0.8
  },
};

// ============================================================
// SIMULATION ENGINE
// ============================================================
function runSimulations(params, nSims) {
  nSims = nSims || 5000;
  const years = 10;
  const eroi = params.eroi !== undefined ? params.eroi : 0.5;

  const results = {
    terminalStates: new Array(5).fill(0),
    yearlyDist: [],
    portfolios: { conv:[], real:[], form:[] },
    medianPaths: { conv:new Array(years+1).fill(0), real:new Array(years+1).fill(0), form:new Array(years+1).fill(0) },
    percentilePaths: { conv10:new Array(years+1).fill(0), conv90:new Array(years+1).fill(0), form10:new Array(years+1).fill(0), form90:new Array(years+1).fill(0) },
    samplePaths: [],
    substrateHealth: new Array(years+1).fill(0),
  };

  for (let y = 0; y <= years; y++) results.yearlyDist.push(new Array(5).fill(0));

  const yPort = { conv:[], real:[], form:[] };
  const ySubstrate = [];
  for (let y = 0; y <= years; y++) {
    yPort.conv.push([]); yPort.real.push([]); yPort.form.push([]);
    ySubstrate.push([]);
  }

  const startState = params.startState || 1;

  for (let sim = 0; sim < nSims; sim++) {
    let state = startState;
    let pC = 100, pR = 100, pF = 100;
    let subHealth = 100; // substrate health index starts at 100

    // Determine event fire years
    const fires = {};
    for (const evt of EVENTS) {
      const prob = Math.abs((params[evt.id] !== undefined ? params[evt.id] : evt.base) / 100);
      const wYrs = evt.peak[1] - evt.peak[0] + 1;
      const aProb = 1 - Math.pow(1 - prob, 1/wYrs);
      fires[evt.id] = -1;
      for (let y = evt.peak[0]; y <= evt.peak[1]; y++) {
        if (Math.random() < aProb) { fires[evt.id] = y; break; }
      }
    }

    let timeInStress = 0;
    results.yearlyDist[0][state]++;
    yPort.conv[0].push(pC); yPort.real[0].push(pR); yPort.form[0].push(pF);
    ySubstrate[0].push(subHealth);
    const path = [state];

    for (let y = 1; y <= years; y++) {
      // EROI background pressure: increases linearly over the decade
      const eroiPressure = eroi * (y / years) * 0.15;

      // Active events
      let active = [], stabilizing = [];
      for (const evt of EVENTS) {
        const fy = fires[evt.id];
        if (fy >= 0 && y >= fy && y < fy + evt.dur) {
          const pv = params[evt.id] !== undefined ? params[evt.id] : evt.base;
          if (evt.bidirectional && pv < 0) stabilizing.push(evt);
          else active.push(evt);
        }
      }

      // Disruption pressure
      let rawP = eroiPressure;
      for (const evt of active) {
        const mid = (evt.peak[0] + evt.peak[1]) / 2;
        const d = Math.abs(y - mid);
        rawP += evt.mag * (1 + 0.1 * Math.max(0, 3 - d));
      }

      // Correlation multiplier
      let corrM = 1;
      for (const [a, b, m] of CORRELATIONS) {
        if (active.some(e => e.id === a) && active.some(e => e.id === b)) corrM = Math.max(corrM, m);
      }
      rawP *= corrM;

      // Nonlinear compounding
      const ec = active.length;
      const capped = Math.min(rawP, 0.98);
      const comp = ec > 0 || eroiPressure > 0 ? 1 - Math.pow(1 - capped, 1 + Math.max(ec, 1) * 0.3) : 0;

      // Stabilization
      let stabilP = 0;
      for (const evt of stabilizing) stabilP += evt.mag * 0.5;

      // Recovery degradation
      if (state >= 2) timeInStress++;
      else timeInStress = Math.max(0, timeInStress - 0.5);
      const recovDeg = Math.min(0.6, timeInStress * 0.08);

      // Update substrate health
      const subDamage = comp * 8 + eroiPressure * 5;
      const subRecovery = stabilP * 6;
      subHealth = Math.max(0, Math.min(100, subHealth - subDamage + subRecovery + (state <= 1 ? 0.5 : -0.5)));

      // Build modified transition row
      const row = BASE_MATRIX[state].slice();

      // EROI tightens all transitions slightly toward worse states every year
      if (eroiPressure > 0 && state < 4) {
        const eroiShift = eroiPressure * 0.15;
        for (let s = 0; s <= state; s++) {
          const moved = row[s] * eroiShift;
          row[s] -= moved;
          row[Math.min(s + 1, 4)] += moved;
        }
      }

      // Downward push from disruption
      if (comp > 0) {
        const tf = 0.7;
        const transfer = comp * tf;
        for (let s = 0; s < state; s++) {
          const moved = row[s] * transfer * 0.5;
          row[s] -= moved;
          for (let ws = state + 1; ws < 5; ws++) {
            const w = ws - state;
            row[ws] += moved * w / sr(1, 4 - state);
          }
        }
        const selfT = row[state] * transfer * 0.3;
        row[state] -= selfT;
        for (let ws = state + 1; ws < 5; ws++) {
          const w = ws - state;
          row[ws] += selfT * w / sr(1, 4 - state);
        }
      }

      // Recovery suppression
      const recAff = active.filter(e => e.recovery);
      if (recAff.length > 0 || recovDeg > 0) {
        const supp = Math.min(0.8, recAff.length * 0.15 + recovDeg);
        for (let s = 0; s < state; s++) {
          const red = row[s] * supp;
          row[s] -= red;
          row[Math.min(state + 1, 4)] += red;
        }
      }

      // Stabilization push
      if (stabilP > 0) {
        const st = stabilP * 0.5;
        for (let s = state + 1; s < 5; s++) {
          const moved = row[s] * st * 0.3;
          row[s] -= moved;
          row[Math.max(s - 1, 0)] += moved;
        }
        if (state > 0) {
          const boost = row[state] * st * 0.2;
          row[state] -= boost;
          row[state - 1] += boost;
        }
      }

      // Normalize
      const sum = row.reduce((a, b) => a + b, 0);
      for (let s = 0; s < 5; s++) row[s] = Math.max(0, row[s] / sum);

      // Sample
      const r = Math.random();
      let cum = 0, ns = 4;
      for (let s = 0; s < 5; s++) { cum += row[s]; if (r < cum) { ns = s; break; } }
      state = ns;

      // Portfolio
      const noise = () => (Math.random() - 0.5) * 0.06;
      // Formation capital gets a small bonus when substrate health is improving
      const formBonus = subHealth > 60 ? 0.01 : subHealth < 30 ? -0.01 : 0;
      pC *= (1 + RETURNS[state][0] + noise());
      pR *= (1 + RETURNS[state][1] + noise());
      pF *= (1 + RETURNS[state][2] + formBonus + noise());

      results.yearlyDist[y][state]++;
      path.push(state);
      yPort.conv[y].push(pC); yPort.real[y].push(pR); yPort.form[y].push(pF);
      ySubstrate[y].push(subHealth);
    }

    results.terminalStates[state]++;
    results.portfolios.conv.push(pC);
    results.portfolios.real.push(pR);
    results.portfolios.form.push(pF);
    if (sim < 150) results.samplePaths.push(path);
  }

  // Compute medians and percentiles
  for (let y = 0; y <= years; y++) {
    yPort.conv[y].sort((a, b) => a - b);
    yPort.real[y].sort((a, b) => a - b);
    yPort.form[y].sort((a, b) => a - b);
    ySubstrate[y].sort((a, b) => a - b);
    const mid = Math.floor(nSims / 2);
    results.medianPaths.conv[y] = yPort.conv[y][mid] || 100;
    results.medianPaths.real[y] = yPort.real[y][mid] || 100;
    results.medianPaths.form[y] = yPort.form[y][mid] || 100;
    results.percentilePaths.conv10[y] = pctl(yPort.conv[y], 10);
    results.percentilePaths.conv90[y] = pctl(yPort.conv[y], 90);
    results.percentilePaths.form10[y] = pctl(yPort.form[y], 10);
    results.percentilePaths.form90[y] = pctl(yPort.form[y], 90);
    results.substrateHealth[y] = ySubstrate[y][mid] || 100;
  }

  results.portfolios.conv.sort((a, b) => a - b);
  results.portfolios.real.sort((a, b) => a - b);
  results.portfolios.form.sort((a, b) => a - b);

  return results;
}

function sr(a, b) { let s = 0; for (let i = a; i <= b; i++) s += i; return s || 1; }
function pctl(arr, p) { return arr[Math.min(Math.floor(arr.length * p / 100), arr.length - 1)]; }
function median(arr) { return pctl(arr, 50); }

return { STATES, STATE_COLORS, STATE_SHORT, EVENTS, CORRELATIONS, PRESETS, RETURNS, RETURN_LABELS, RETURN_COLORS, BASE_MATRIX, SOURCES, runSimulations, pctl, median };

})();
