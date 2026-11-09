/* أوزاني — تسجيل أوزان النادي بدون اشتراك. كل البيانات في localStorage على جهاز المستخدم. عربي / English */
(() => {
  'use strict';

  const D = window.AWZ_DATA;
  const KEY = 'awzani.v1';
  const LB = 0.45359237;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');

  /* ---------- اللغة ---------- */
  let EN = false;
  const tr = (ar, en) => (EN ? en : ar);

  /* ---------- أدوات صغيرة ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const round2 = n => Math.round(n * 100) / 100;
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const fmt = n => nf.format(round2(+n || 0));
  const fmtIn = n => String(round2(+n || 0));
  const unitName = u => (u === 'lb' ? tr('رطل', 'lb') : tr('كجم', 'kg'));
  const conv = (w, from, to) => (from === to ? w : to === 'kg' ? w * LB : w / LB);
  const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30));
  const SEP = () => tr('، ', ', ');
  function num(v) {
    v = String(v).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,،]/g, '.').replace(/[^\d.]/g, '');
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  // [العربي: واحد، اثنين، 3-10، 11+] و [English: one, many]
  const W = {
    set: [['جلسة وحدة', 'جلستين', 'جلسات', 'جلسة'], ['set', 'sets']],
    rep: [['عدة وحدة', 'عدتين', 'عدات', 'عدة'], ['rep', 'reps']],
    mc: [['جهاز واحد', 'جهازين', 'أجهزة', 'جهاز'], ['machine', 'machines']],
    min: [['دقيقة وحدة', 'دقيقتين', 'دقائق', 'دقيقة'], ['min', 'min']],
    sec: [['ثانية وحدة', 'ثانيتين', 'ثواني', 'ثانية'], ['sec', 'sec']],
    day: [['يوم واحد', 'يومين', 'أيام', 'يوم'], ['day', 'days']],
    log: [['تسجيل واحد', 'تسجيلين', 'تسجيلات', 'تسجيل'], ['entry', 'entries']],
    ex: [['تمرين واحد', 'تمرينين', 'تمارين', 'تمرين'], ['exercise', 'exercises']],
    sc: [['قسم واحد', 'قسمين', 'أقسام', 'قسم'], ['section', 'sections']],
    wk: [['أسبوع واحد', 'أسبوعين', 'أسابيع', 'أسبوع'], ['week', 'weeks']]
  };
  // الكلمة بدون الرقم: 1 تمرين، 2 تمرينين، 3-10 تمارين، 11+ تمرين
  const exWord = n => (EN ? (n === 1 ? 'exercise' : 'exercises') : n === 2 ? 'تمرينين' : n >= 3 && n <= 10 ? 'تمارين' : 'تمرين');
  function plural(n, f) {
    n = round2(+n || 0);
    if (EN) return `${fmt(n)} ${n === 1 ? f[1][0] : f[1][1]}`;
    const a = f[0];
    if (n === 1) return a[0];
    if (n === 2) return a[1];
    if (n >= 3 && n <= 10 && Number.isInteger(n)) return `${n} ${a[2]}`;
    return `${fmt(n)} ${a[3]}`;
  }

  // رقم بخط الساعة + الكلمة بالخط العادي (1 و2 بالعربي تبقى كلمات)
  function numWord(n, f) {
    const t = plural(n, f);
    const m = t.match(/^([\d,.]+) (.+)$/);
    return m ? `<b class="nw">${m[1]}</b> ${m[2]}` : t;
  }

  /* ---------- التواريخ ---------- */
  let dfDay, dfDate, dfWeek, dfShort;
  function setLocale() {
    const L = EN ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn';
    dfDay = new Intl.DateTimeFormat(L, { weekday: 'long', day: 'numeric', month: 'long' });
    dfDate = new Intl.DateTimeFormat(L, { day: 'numeric', month: 'long', year: 'numeric' });
    dfWeek = new Intl.DateTimeFormat(L, { weekday: 'long' });
    dfShort = new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short' });
  }
  const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const daysAgo = t => Math.round((startOfDay(Date.now()) - startOfDay(t)) / 864e5);
  const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function rel(t) {
    const n = daysAgo(t);
    if (n <= 0) return tr('اليوم', 'today');
    if (n === 1) return tr('أمس', 'yesterday');
    if (n > 30) return dfDate.format(new Date(t));
    if (EN) return `${n} days ago`;
    if (n === 2) return 'قبل يومين';
    if (n <= 10) return `قبل ${n} أيام`;
    return `قبل ${n} يوم`;
  }

  /* ---------- التخزين ---------- */
  const COLORS = ['red', 'blue', 'yellow', 'green', 'white', 'silver', 'black', 'steel'];
  const KINDS = ['w', 'bw', 't', 'c'];
  const okId = id => typeof id === 'string' && /^[\w-]{1,48}$/.test(id);
  const okStr = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;

  function blank() {
    return { v: 1, name: '', body: [], logs: [], plans: [], custom: { sections: [], machines: [] }, hidden: [], prefs: { unit: 'kg', lang: 'ar', mu: {}, step: {} } };
  }
  function cleanSets(sets, k) {
    if (!Array.isArray(sets)) return null;
    const out = sets.slice(0, 50).map(s => (k === 't' ? { s: Math.max(0, +s.s || 0) } : { w: Math.max(0, +s.w || 0), r: Math.max(0, Math.round(+s.r || 0)) }));
    return out.length ? out : null;
  }
  function normalize(o) {
    const b = blank();
    if (!o || typeof o !== 'object') return b;
    if (Array.isArray(o.logs)) {
      o.logs.forEach(l => {
        if (!l || !okId(l.id) || !okId(l.m) || !isFinite(+l.t)) return;
        const k = KINDS.includes(l.k) ? l.k : 'w';
        const x = { id: l.id, m: l.m, n: okStr(l.n, 60) ? l.n : '', k, t: +l.t };
        if (k === 'c') {
          x.min = Math.max(0, +l.min || 0);
          if (+l.km) x.km = +l.km;
          if (+l.lv) x.lv = +l.lv;
          if (+l.cal) x.cal = +l.cal;
          if (okStr(l.lvl, 20)) x.lvl = l.lvl;
        } else {
          x.sets = cleanSets(l.sets, k);
          if (!x.sets) return;
          if (k !== 't') x.u = l.u === 'lb' ? 'lb' : 'kg';
        }
        b.logs.push(x);
      });
    }
    if (o.custom) {
      (Array.isArray(o.custom.sections) ? o.custom.sections : []).forEach(s => {
        if (s && okId(s.id) && okStr(s.name, 30)) b.custom.sections.push({ id: s.id, name: s.name, color: COLORS.includes(s.color) ? s.color : 'steel', custom: true });
      });
      (Array.isArray(o.custom.machines) ? o.custom.machines : []).forEach(m => {
        if (m && okId(m.id) && okId(m.s) && okStr(m.n, 60)) {
          b.custom.machines.push({ id: m.id, s: m.s, n: m.n, e: '', k: KINDS.includes(m.k) ? m.k : 'w', eq: EQ[m.eq] ? m.eq : (m.k === 'w' ? 'mc' : undefined), lv: m.k === 'c' ? 'المستوى' : undefined, custom: true });
        }
      });
    }
    b.hidden = Array.isArray(o.hidden) ? o.hidden.filter(okId) : [];
    if (Array.isArray(o.plans)) {
      o.plans.slice(0, 40).forEach(x => {
        if (!x || !okId(x.id) || !okStr(x.name, 40) || b.plans.some(y => y.id === x.id)) return;
        const items = Array.isArray(x.items) ? [...new Set(x.items.filter(okId))].slice(0, 40) : [];
        b.plans.push({ id: x.id, name: x.name.trim().slice(0, 30), items, t: isFinite(+x.t) ? +x.t : Date.now() });
      });
    }
    if (okStr(o.name, 40)) b.name = o.name.trim().slice(0, 24);
    if (Array.isArray(o.body)) {
      o.body.forEach(x => {
        if (x && isFinite(+x.t) && +x.w > 0 && +x.w < 700) b.body.push({ t: +x.t, w: round2(+x.w), u: x.u === 'lb' ? 'lb' : 'kg' });
      });
      b.body.sort((a, z) => a.t - z.t);
    }
    if (o.prefs) {
      b.prefs.unit = o.prefs.unit === 'lb' ? 'lb' : 'kg';
      b.prefs.lang = o.prefs.lang === 'en' ? 'en' : 'ar';
      Object.entries(o.prefs.mu || {}).forEach(([k, v]) => { if (okId(k)) b.prefs.mu[k] = v === 'lb' ? 'lb' : 'kg'; });
      Object.entries(o.prefs.step || {}).forEach(([k, v]) => { if (okId(k) && +v > 0) b.prefs.step[k] = +v; });
    }
    return b;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* يبدأ فاضي */ }
    return blank();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) {
      toast(tr('ما قدرت أحفظ في الجوال. تأكد إنك مو فاتح الموقع بالتصفح الخفي.', "Couldn't save on this phone. Make sure you're not in private browsing."));
      return false;
    }
  }

  /* ---------- الأجهزة ---------- */
  const EQ = {
    bar: { lbl: ['الوزن مع البار', 'Weight incl. bar'], step: 2.5, def: 20 },
    sm: { lbl: ['الوزن مع البار', 'Weight incl. bar'], step: 2.5, def: 20 },
    ez: { lbl: ['الوزن مع البار', 'Weight incl. bar'], step: 2.5, def: 10 },
    db: { lbl: ['وزن الدمبل الواحد', 'Weight per dumbbell'], step: 2.5, def: 10 },
    mc: { lbl: ['الوزن على الجهاز', 'Machine weight'], step: 5, def: 20 },
    cb: { lbl: ['الوزن على الكيبل', 'Cable weight'], step: 2.5, def: 10 },
    pl: { lbl: ['الأقراص المركّبة', 'Plates loaded'], step: 5, def: 40 }
  };
  const STEPS = { kg: [1, 2.5, 5], lb: [2.5, 5, 10] };
  const PLATES = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };
  const BAR = { kg: 20, lb: 45 };
  const PCOL = {
    kg: { 25: 'red', 20: 'blue', 15: 'yellow', 10: 'green', 5: 'white', 2.5: 'red', 1.25: 'silver' },
    lb: { 45: 'blue', 35: 'yellow', 25: 'green', 10: 'white', 5: 'red', 2.5: 'silver' }
  };
  const PH = {
    kg: { 25: 62, 20: 62, 15: 56, 10: 50, 5: 38, 2.5: 30, 1.25: 26 },
    lb: { 45: 62, 35: 56, 25: 50, 10: 38, 5: 30, 2.5: 26 }
  };
  // خانة الكارديو تنحفظ بالعربي في التسجيل، وتنعرض حسب اللغة
  const LV_EN = { 'السرعة': 'Speed', 'المستوى': 'Level' };
  const lvName = s => (EN ? LV_EN[s] || s : s);

  let S = load();
  const sections = () => D.sections.concat(S.custom.sections);
  const machines = () => D.machines.concat(S.custom.machines);
  const secById = id => sections().find(s => s.id === id);
  const mById = id => machines().find(m => m.id === id);
  const secColor = id => (secById(id) || {}).color || 'steel';
  const secName = s => (s ? (EN && s.en ? s.en : s.name) : '');
  const mName = m => (EN && m.e ? m.e : m.n);
  const eqLbl = m => { const x = (EQ[m.eq] || EQ.mc).lbl; return tr(x[0], x[1]); };
  const inSection = id => machines().filter(m => m.s === id && !S.hidden.includes(m.id));
  const logsOf = mid => S.logs.filter(l => l.m === mid).sort((a, b) => b.t - a.t);
  const lastLog = mid => logsOf(mid)[0] || null;
  const PHOTOS = new Set(D.photos || []);
  const hasPhoto = m => m && PHOTOS.has(m.id);
  function thumb(m, color) {
    return hasPhoto(m)
      ? `<img class="thumb" src="img/${esc(m.id)}-t.webp" alt="" width="60" height="60" loading="lazy" decoding="async">`
      : `<span class="thumb thumb-plate c-${esc(color || secColor(m.s))}" aria-hidden="true"></span>`;
  }
  const frames = (m, alt) => `<span class="demo-frames"><img src="img/${esc(m.id)}-0.webp" alt="${esc(alt)}" width="600" height="450" decoding="async"><img class="f2" src="img/${esc(m.id)}-1.webp" alt="" width="600" height="450" decoding="async"></span>`;
  const unitOf = (m, last) => S.prefs.mu[m.id] || (last && last.u) || S.prefs.unit;

  function stepOf(m, u) {
    const v = S.prefs.step[m.id];
    if (STEPS[u].includes(v)) return v;
    if (u === 'lb') return 5;
    return (EQ[m.eq] || {}).step || 2.5;
  }
  function defW(m, u) {
    const kg = (EQ[m.eq] || EQ.mc).def;
    return u === 'lb' ? Math.round(kg / LB / 5) * 5 : kg;
  }
  function platesFor(total, u) {
    const bar = BAR[u];
    const side = (total - bar) / 2;
    if (side < 0) return { under: true, bar };
    const out = [];
    let rem = Math.round(side * 100);
    for (const p of PLATES[u]) {
      const pc = Math.round(p * 100);
      while (rem >= pc) { out.push(p); rem -= pc; }
    }
    return { bar, out, rem: rem / 100 };
  }

  /* ---------- حسابات التسجيل ---------- */
  const sameSets = sets => sets.every(s => s.w === sets[0].w && s.r === sets[0].r && s.s === sets[0].s);
  function volU(l) { // بوحدة التسجيل نفسه
    if (!l.sets || l.k === 't' || l.k === 'c') return 0;
    return l.sets.reduce((a, s) => a + (+s.w || 0) * (+s.r || 0), 0);
  }
  function summary(l) {
    if (l.k === 'c') {
      const p = [plural(l.min, W.min)];
      if (l.km) p.push(`${fmt(l.km)} ${tr('كم', 'km')}`);
      if (l.lv) p.push(`${lvName(l.lvl || 'المستوى')} ${fmt(l.lv)}`);
      if (l.cal) p.push(`${fmt(l.cal)} ${tr('سعرة', 'cal')}`);
      return p.join(SEP());
    }
    if (l.k === 't') {
      return sameSets(l.sets)
        ? `${plural(l.sets[0].s, W.sec)} × ${plural(l.sets.length, W.set)}`
        : l.sets.map(s => `${fmt(s.s)} ${tr('ث', 's')}`).join(SEP());
    }
    const U = unitName(l.u);
    if (sameSets(l.sets)) {
      const s = l.sets[0];
      const head = +s.w > 0 ? `${fmt(s.w)} ${U} × ` : (l.k === 'bw' ? '' : `0 ${U} × `);
      return `${head}${plural(s.r, W.rep)} × ${plural(l.sets.length, W.set)}`;
    }
    if (l.k === 'bw' && l.sets.every(s => !(+s.w))) return l.sets.map(s => fmt(s.r)).join(SEP()) + ' ' + tr('عدة', 'reps');
    return l.sets.map(s => `${fmt(s.w)} ${U} × ${fmt(s.r)}`).join(SEP());
  }

  /* الاقتراح: زيادة تدريجية (8 إلى 12 عدة) */
  function suggest(m, last) {
    const u = unitOf(m, last);
    if (m.k === 'c') {
      if (!last) return { min: 20, text: tr('سجّل مدة الكارديو بالدقائق، والمسافة والمستوى إذا تطلع لك على شاشة الجهاز.', 'Log your cardio time in minutes, plus distance and level if the machine screen shows them.') };
      return {
        min: (last.min || 0) + 2, lv: last.lv,
        text: tr(`آخر مرة ${plural(last.min, W.min)}. زِد دقيقتين اليوم، أو ارفع ${m.lv || 'الشدة'} درجة.`,
          `Last time: ${plural(last.min, W.min)}. Add 2 minutes today, or raise the ${(m.lv ? lvName(m.lv) : 'intensity').toLowerCase()} one step.`)
      };
    }
    if (m.k === 't') {
      if (!last) return { s: 30, n: 3, text: tr('ابدأ بـ 30 ثانية لكل جلسة، وزِد 5 أو 10 ثواني لما تحسها سهلة.', 'Start with 30 seconds per set, and add 5 or 10 seconds once it feels easy.') };
      const s = Math.max(...last.sets.map(x => +x.s || 0));
      return { s: s + 10, n: last.sets.length, text: tr(`آخر مرة أطول ثبات ${plural(s, W.sec)}. جرّب ${s + 10} ثانية اليوم.`, `Longest hold last time: ${plural(s, W.sec)}. Try ${s + 10} seconds today.`) };
    }
    if (m.k === 'bw') {
      if (!last) return { w: 0, r: 10, n: 3, text: tr('سجّل عداتك وجلساتك. وإذا حطيت وزن إضافي (حزام أو دمبل) اكتبه تحت.', 'Log your reps and sets. If you add extra weight (a belt or a dumbbell), enter it below.') };
      const minR = Math.min(...last.sets.map(x => x.r));
      const n = last.sets.length;
      const w = Math.max(...last.sets.map(x => +x.w || 0));
      if (minR >= 15) return { w, r: minR, n: Math.min(n + 1, 6), text: tr(`كملت ${plural(minR, W.rep)} وفوق بكل جلسة. زِد جلسة، أو حط وزن إضافي بسيط.`, `You did ${plural(minR, W.rep)} or more in every set. Add a set, or a little extra weight.`) };
      return { w, r: minR + 1, n, text: tr(`حاول توصل ${plural(minR + 1, W.rep)} بكل جلسة اليوم.`, `Try to reach ${plural(minR + 1, W.rep)} in every set today.`) };
    }
    if (!last) {
      return { w: defW(m, u), r: 12, n: 3, text: tr('أول مرة تسجل هالجهاز. اختر وزن تقدر تسوي فيه 12 عدة بشكل نظيف، والمرة الجاية أقترح عليك متى تزيد.', "First time on this machine. Pick a weight you can do 12 clean reps with. Next time you'll get a hint on when to go up.") };
    }
    const lu = last.u || 'kg';
    const top = Math.max(...last.sets.map(x => +x.w || 0));
    const minR = Math.min(...last.sets.filter(x => (+x.w || 0) === top).map(x => x.r));
    const n = last.sets.length;
    const LU = unitName(lu);
    const lst = stepOf(m, lu);
    if (minR >= 12) return { w: round2(top + lst), r: 8, n, text: tr(`آخر مرة كملت ${plural(minR, W.rep)} بكل جلسة على ${fmt(top)} ${LU}. جرّب ${fmt(top + lst)} ${LU} اليوم، ولو وصلت 8 عدات فأنت ماشي صح.`, `Last time you did ${plural(minR, W.rep)} in every set at ${fmt(top)} ${LU}. Try ${fmt(top + lst)} ${LU} today. If you reach 8 reps, you're on track.`) };
    if (minR < 6) return { w: top, r: minR + 1, n, text: tr(`آخر مرة كان الوزن ثقيل عليك (${plural(minR, W.rep)}). خلك على ${fmt(top)} ${LU} وحاول توصل ${minR + 1}، أو نزّل إلى ${fmt(Math.max(0, top - lst))}.`, `The weight was heavy last time (${plural(minR, W.rep)}). Stay at ${fmt(top)} ${LU} and aim for ${minR + 1}, or drop to ${fmt(Math.max(0, top - lst))}.`) };
    return { w: top, r: minR + 1, n, text: tr(`خلك على ${fmt(top)} ${LU} وحاول توصل ${plural(minR + 1, W.rep)} بكل جلسة. أول ما توصل 12 بكل الجلسات زِد الوزن.`, `Stay at ${fmt(top)} ${LU} and aim for ${plural(minR + 1, W.rep)} in every set. Once you hit 12 in all sets, add weight.`) };
  }

  /* ---------- الأيقونات ---------- */
  const svg = (p, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${p}</svg>`;
  const I = {
    back: svg('<path d="M9 5l7 7-7 7"/>'),
    chev: svg('<path d="M15 5l-7 7 7 7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
    x: svg('<path d="M7 7l10 10M17 7L7 17"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    cal: svg('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>'),
    up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5s1.2-6.2 3.5-8.5z"/>')
  };

  /* ---------- اللغة: الاتجاه والتواريخ والشريط ---------- */
  function applyLang() {
    EN = S.prefs.lang === 'en';
    const h = document.documentElement;
    h.lang = EN ? 'en' : 'ar';
    h.dir = EN ? 'ltr' : 'rtl';
    document.title = tr('أوزاني | حسبة أوزان النادي', 'Awzani | Gym weight log');
    setLocale();
    const nav = { home: tr('الأقسام', 'Sections'), plan: tr('جدولي', 'My plans'), log: tr('السجل', 'Log'), set: tr('الإعدادات', 'Settings') };
    $$('.tabs a').forEach(a => { const s = $('span', a); if (s) s.textContent = nav[a.dataset.v] || s.textContent; });
    const tabs = $('.tabs');
    if (tabs) tabs.setAttribute('aria-label', tr('التنقل', 'Navigation'));
    $('#sheet').setAttribute('aria-label', tr('نافذة', 'Dialog'));
  }
  function setLang(l) {
    S.prefs.lang = l === 'en' ? 'en' : 'ar';
    save();
    applyLang();
  }
  const langBtn = () => `<button type="button" class="lang-btn" data-act="lang" lang="${EN ? 'ar' : 'en'}" aria-label="${EN ? 'غيّر اللغة إلى العربي' : 'Switch to English'}">${I.globe}<span>${EN ? 'عربي' : 'English'}</span></button>`;

  /* ---------- التنبيه ---------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('on'), 2800);
  }

  /* ---------- التنقل ---------- */
  let curSec = null, curM = null, curPlan = null;
  function setNav(v) {
    $$('.tabs a').forEach(a => {
      if (a.dataset.v === v) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const v = parts[0], id = decodeURIComponent(parts[1] || '');
    curSec = curM = null;
    curPlan = null;
    const sheet = $('#sheet');
    if (sheet && sheet.open) sheet.close();
    window.scrollTo(0, 0);
    document.body.classList.toggle('is-start', !S.name);
    if (!S.name) return viewStart();
    if (v === 's' && secById(id)) { setNav('home'); return viewSection(id); }
    if (v === 'm' && mById(id)) {
      const pl = planById(decodeURIComponent(parts[2] || ''));
      curPlan = pl && pl.items.includes(id) ? pl : null;
      setNav(curPlan ? 'plan' : 'home');
      return viewMachine(id);
    }
    if (v === 'plan' && !id) { setNav('plan'); return viewPlans(); }
    if (v === 'plan' && planById(id)) { setNav('plan'); return viewPlan(id); }
    if (v === 'plan-new') { setNav('plan'); return viewPlanEdit(null, id); }
    if (v === 'plan-edit' && planById(id)) { setNav('plan'); return viewPlanEdit(id); }
    if (v === 'log') { setNav('log'); return viewLog(); }
    if (v === 'set') { setNav('set'); return viewSettings(); }
    setNav('home');
    return viewHome();
  }

  /* ---------- الرئيسية ---------- */
  function todayStats() {
    const t0 = startOfDay(Date.now());
    const ls = S.logs.filter(l => l.t >= t0);
    return {
      ex: new Set(ls.map(l => l.m)).size,
      sets: ls.reduce((a, l) => a + (l.sets ? l.sets.length : 0), 0),
      reps: ls.reduce((a, l) => a + (l.k === 'w' || l.k === 'bw' ? l.sets.reduce((x, s) => x + (+s.r || 0), 0) : 0), 0),
      min: ls.reduce((a, l) => a + (l.k === 'c' ? (+l.min || 0) : 0), 0)
    };
  }

  /* ---------- البداية: الاسم ---------- */
  function viewStart(keep) {
    app.innerHTML = `
      <section class="start">
        <div class="start-lang">${langBtn()}</div>
        <div class="start-board">
          <h1 class="mark led">${tr('أوزاني', 'Awzani')}</h1>
          <p>${tr('حسبة أوزانك في النادي، بدون اشتراك', 'Your gym weights, no subscription')}</p>
        </div>
        <form id="startForm" class="start-form" novalidate>
          <label class="fld"><span>${tr('وش اسمك؟', "What's your name?")}</span>
            <input type="text" name="name" maxlength="24" placeholder="${tr('اكتب اسمك', 'Type your name')}" value="${esc(keep || '')}" autocomplete="given-name" enterkeyhint="go" required>
          </label>
          <button class="go" type="submit"><span>${tr('ابدأ', 'Start')}</span></button>
          <p class="start-note">${tr('اسمك وتمارينك تنحفظ في جوالك بس.', 'Your name and workouts stay on this phone only.')}</p>
        </form>
        <label class="text-btn start-restore">${tr('عندك نسخة احتياطية من جوال ثاني؟ رجّعها', 'Have a backup from another phone? Restore it')}<input type="file" id="imp" accept=".json,application/json" hidden></label>
      </section>`;
    $('#imp').addEventListener('change', importData);
    const f = $('#startForm');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const n = String(new FormData(f).get('name') || '').trim();
      if (!n) { toast(tr('اكتب اسمك عشان نبدأ.', 'Type your name to start.')); $('input', f).focus(); return; }
      S.name = n.slice(0, 24);
      if (!save()) return;
      location.hash = '#/';
      route();
    });
  }

  /* ---------- وزن الجسم ---------- */
  const lastBody = () => S.body[S.body.length - 1] || null;
  function bodySheet() {
    const last = lastBody();
    let u = last ? last.u : S.prefs.unit;
    let w = last ? last.w : (u === 'lb' ? 160 : 75);
    const recent = S.body.slice(-6).reverse();
    openSheet(`
      <h2>${tr('وزن جسمك اليوم', 'Your body weight today')}</h2>
      <div class="bw-row">
        <button type="button" class="stp sm" data-bw="0.5" aria-label="${tr('زِد نص', 'Add 0.5')}">${I.plus}</button>
        <input class="cnt-v" id="bwIn" name="w" type="text" inputmode="decimal" autocomplete="off" value="${fmtIn(w)}" aria-label="${tr('وزن الجسم', 'Body weight')}">
        <button type="button" class="stp sm" data-bw="-0.5" aria-label="${tr('أنقص نص', 'Subtract 0.5')}">${I.minus}</button>
      </div>
      <div class="seg light bw-seg" role="group" aria-label="${tr('الوحدة', 'Unit')}">
        <button type="button" data-bu="kg" aria-pressed="${u === 'kg'}">${tr('كيلو', 'kg')}</button>
        <button type="button" data-bu="lb" aria-pressed="${u === 'lb'}">${tr('رطل', 'lb')}</button>
      </div>
      ${recent.length ? `<h3 class="bw-h">${tr('آخر القياسات', 'Recent weigh-ins')}</h3><ul class="plain bw-list">${recent.map((x, i) => {
        const prev = recent[i + 1];
        const d = prev && prev.u === x.u ? round2(x.w - prev.w) : 0;
        return `<li><span>${dfDay.format(new Date(x.t))}</span><span><b class="nw">${fmt(x.w)}</b> ${unitName(x.u)}${d ? ` <em class="delta">${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}</em>` : ''}</span></li>`;
      }).join('')}</ul>` : ''}`, fd => {
      const v = num(fd.get('w'));
      if (!(v > 20 && v < 700)) { toast(tr('اكتب وزنك صح.', 'Enter a valid weight.')); return false; }
      const t0 = startOfDay(Date.now());
      S.body = S.body.filter(x => x.t < t0);
      S.body.push({ t: Date.now(), w: round2(v), u });
      if (!save()) return false;
      toast(tr(`انحفظ وزنك: ${fmt(v)} ${unitName(u)}.`, `Saved: ${fmt(v)} ${unitName(u)}.`));
      route();
    }, tr('احفظ', 'Save'));
    const d = $('#sheet');
    $('form', d).addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.bw) {
        const inp = $('#bwIn');
        inp.value = fmtIn(Math.max(0, round2(num(inp.value) + +b.dataset.bw)));
      } else if (b.dataset.bu) {
        u = b.dataset.bu;
        $$('[data-bu]', d).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.bu === u)));
      }
    });
  }
  function recentMachines(n) {
    const seen = new Set(), out = [];
    for (const l of S.logs.slice().sort((a, b) => b.t - a.t)) {
      if (seen.has(l.m)) continue;
      seen.add(l.m);
      const m = mById(l.m);
      if (m) out.push(m);
      if (out.length >= n) break;
    }
    return out;
  }
  function plateTile(sec) {
    const ms = inSection(sec.id);
    return `<a class="plate c-${esc(sec.color)}" href="#/s/${esc(sec.id)}">
      <span class="pl-name">${esc(secName(sec))}</span>
      <span class="pl-count">${ms.length ? numWord(ms.length, W.mc) : tr('فاضي', 'Empty')}</span>
    </a>`;
  }
  function mRow(m) {
    const l = lastLog(m.id);
    return `<a class="mrow" href="#/m/${esc(m.id)}">
      ${thumb(m)}
      <span class="mrow-t">
        <b>${esc(mName(m))}</b>
        ${!EN && m.e ? `<small><bdi dir="ltr">${esc(m.e)}</bdi></small>` : ''}
        ${l ? `<span class="mrow-l">${esc(summary(l))}<em>${rel(l.t)}</em></span>` : ''}
      </span>
      ${I.chev}
    </a>`;
  }

  function viewHome() {
    const t = todayStats();
    const recent = recentMachines(6);
    const now = new Date();
    const bw = lastBody();
    const bwToday = bw && daysAgo(bw.t) === 0;
    const cells = [
      `<div><span class="led">${fmt(t.sets)}</span><span>${tr('مجموع الجلسات', 'Total sets')}</span></div>`,
      `<div><span class="led">${fmt(t.reps)}</span><span>${tr('مجموع العدات', 'Total reps')}</span></div>`
    ];
    if (t.min) cells.push(`<div><span class="led">${fmt(t.min)}</span><span>${tr('دقائق الكارديو', 'Cardio minutes')}</span></div>`);
    cells.push(`<button type="button" class="bw-cell" data-act="body" aria-label="${tr('وزن الجسم، اضغط وسجّله', 'Body weight, tap to log it')}">
      <span class="led${bw ? '' : ' dim'}">${bw ? fmt(bw.w) : '—'}</span>
      <span>${tr('وزن الجسم', 'Body weight')}${bw ? ` (${unitName(bw.u)})` : ''}<em>${bw ? (bwToday ? tr('اليوم', 'today') : rel(bw.t)) : tr('اضغط وسجّله', 'Tap to log it')}</em></span>
    </button>`);
    app.innerHTML = `
      <header class="top today-head">
        <div class="head-row"><p class="brand">${tr('أوزاني', 'Awzani')}</p>${langBtn()}</div>
        <p class="hello">${tr('هلا', 'Hi')} ${esc(S.name)}</p>
        <h1 class="day">${dfWeek.format(now)}</h1>
        <p class="date">${dfDate.format(now)}</p>
      </header>
      <section class="board" aria-label="${tr('تمرين اليوم', "Today's workout")}">
        <div class="board-top"><span>${tr('تمارين خلصتها اليوم', 'Exercises done today')}</span></div>
        <div class="board-main"><span class="led led-xl" id="bigEx" data-v="${t.ex}">${t.ex}</span><span class="board-u">${t.ex ? exWord(t.ex) : tr('ما بديت للحين', 'Not started yet')}</span></div>
        <div class="board-cells" style="--n:${cells.length}">${cells.join('')}</div>
      </section>
      <label class="search">${I.search}<input id="q" type="search" placeholder="${tr('ابحث عن جهاز، مثل: تشيست برس', 'Search machines, e.g. chest press')}" autocomplete="off" enterkeyhint="search" aria-label="${tr('ابحث عن جهاز', 'Search machines')}"></label>
      <div id="results" class="mlist" hidden></div>
      <div id="homeBody">
        ${S.plans.length ? `<section><h2 class="h2">${tr('جدولي', 'My plans')}</h2><div class="chips">${S.plans.map(pl => {
          const ms = planMs(pl);
          const dn = ms.filter(m => doneToday(m.id)).length;
          return `<a class="chip plan-chip" href="#/plan/${esc(pl.id)}">${I.cal}<span>${esc(pl.name)}</span>${dn ? `<b class="nw">${dn}/${ms.length}</b>` : ''}</a>`;
        }).join('')}</div></section>` : ''}
        ${recent.length ? `<section><h2 class="h2">${tr('رجعت لها مؤخرًا', 'Used recently')}</h2><div class="chips">${recent.map(m => `<a class="chip" href="#/m/${esc(m.id)}"><span class="dot c-${esc(secColor(m.s))}" aria-hidden="true"></span>${esc(mName(m))}</a>`).join('')}</div></section>` : ''}
        <section>
          <h2 class="h2">${tr('الأقسام', 'Sections')}</h2>
          <div class="plates">
            ${sections().map(plateTile).join('')}
            <button class="plate plate-add" type="button" data-act="add-sec">${I.plus}<span>${tr('قسم جديد', 'New section')}</span></button>
          </div>
        </section>
      </div>`;

    const q = $('#q');
    q.addEventListener('input', () => {
      const v = norm(q.value);
      const res = $('#results'), body = $('#homeBody');
      if (!v) { res.hidden = true; body.hidden = false; return; }
      const hits = machines().filter(m => norm(m.n).includes(v) || (m.e && m.e.toLowerCase().includes(v)));
      res.innerHTML = hits.length ? hits.map(mRow).join('') : `<p class="empty">${tr('ما لقيت جهاز بهالاسم. تقدر تضيفه من داخل القسم حقه.', 'No machine with that name. You can add it inside its section.')}</p>`;
      res.hidden = false;
      body.hidden = true;
    });
  }

  /* ---------- القسم ---------- */
  function viewSection(id) {
    curSec = id;
    const sec = secById(id);
    const ms = inSection(id);
    const used = ms.filter(m => lastLog(m.id)).sort((a, b) => lastLog(b.id).t - lastLog(a.id).t);
    const rest = ms.filter(m => !lastLog(m.id));
    app.innerHTML = `
      <a class="back" href="#/">${I.back}${tr('الأقسام', 'Sections')}</a>
      <header class="shead">
        <span class="mini-plate c-${esc(sec.color)}" aria-hidden="true"></span>
        <div><h1>${esc(secName(sec))}</h1><p>${plural(ms.length, W.mc)}</p></div>
      </header>
      ${used.length ? `<h2 class="h2">${tr('استخدمتها', 'Used')}</h2><div class="mlist">${used.map(mRow).join('')}</div>` : ''}
      ${rest.length ? `<h2 class="h2">${used.length ? tr('باقي الأجهزة', 'Other machines') : tr('اختر الجهاز', 'Pick a machine')}</h2><div class="mlist">${rest.map(mRow).join('')}</div>` : ''}
      ${!ms.length ? `<p class="empty">${tr('القسم فاضي. أضف أول جهاز فيه.', 'This section is empty. Add its first machine.')}</p>` : ''}
      <button class="add-row" type="button" data-act="add-m">${I.plus}<span>${tr('جهازك مو موجود؟ أضفه', 'Machine not listed? Add it')}</span></button>
      ${sec.custom ? `<div class="foot"><button class="text-btn danger" type="button" data-act="del-sec">${tr('احذف القسم', 'Delete section')}</button></div>` : ''}`;
  }

  /* ---------- الجهاز ---------- */
  let F = null;
  function initForm(m, last, sug) {
    const today = last && daysAgo(last.t) === 0;
    F = { mid: m.id, k: m.k, u: unitOf(m, last), detail: false, sets: [] };
    if (m.k === 'c') {
      if (today) Object.assign(F, { min: last.min, km: last.km || '', lv: last.lv || '', cal: last.cal || '' });
      else Object.assign(F, { min: sug.min, km: '', lv: sug.lv || '', cal: '' });
    } else if (m.k === 't') {
      F.s = today ? Math.max(...last.sets.map(x => x.s)) : sug.s;
      F.n = today ? last.sets.length : sug.n;
    } else if (today) {
      const s0 = last.sets[0];
      Object.assign(F, { w: s0.w, r: s0.r, n: last.sets.length });
      if (!sameSets(last.sets)) { F.detail = true; F.sets = last.sets.map(x => ({ w: x.w, r: x.r })); }
    } else {
      Object.assign(F, { w: sug.w, r: sug.r, n: sug.n });
    }
  }
  function currentSets() {
    if (F.k === 't') return Array.from({ length: F.n }, () => ({ s: F.s }));
    if (F.detail) return F.sets.map(s => ({ w: +s.w || 0, r: Math.round(+s.r || 0) }));
    return Array.from({ length: F.n }, () => ({ w: +F.w || 0, r: Math.round(+F.r || 0) }));
  }

  function stepper(f, label, cls) {
    return `<button type="button" class="stp ${cls || ''}" data-f="${f}" data-d="1" aria-label="${tr('زِد', 'Increase')} ${esc(label)}">${I.plus}</button>`;
  }
  function stepperDown(f, label, cls) {
    return `<button type="button" class="stp ${cls || ''}" data-f="${f}" data-d="-1" aria-label="${tr('أنقص', 'Decrease')} ${esc(label)}">${I.minus}</button>`;
  }
  function ledRow(f, label, mode) {
    return `<div class="wrow simple">
      ${stepper(f, label)}
      <input id="${f}" class="led led-in" type="text" inputmode="${mode || 'decimal'}" autocomplete="off" aria-label="${esc(label)}" value="${fmtIn(F[f])}">
      ${stepperDown(f, label)}
    </div>`;
  }
  function counter(f, label, mode) {
    return `<div class="cnt">
      <span class="cnt-l">${esc(label)}</span>
      <div class="cnt-c">
        ${stepper(f, label, 'sm')}
        <input class="cnt-v" id="${f}" type="text" inputmode="${mode || 'numeric'}" autocomplete="off" value="${fmtIn(F[f])}" aria-label="${esc(label)}">
        ${stepperDown(f, label, 'sm')}
      </div>
    </div>`;
  }
  function unitSeg() {
    return `<div class="seg" role="group" aria-label="${tr('الوحدة', 'Unit')}">
      <button type="button" data-u="kg" aria-pressed="${F.u === 'kg'}">${unitName('kg')}</button>
      <button type="button" data-u="lb" aria-pressed="${F.u === 'lb'}">${unitName('lb')}</button>
    </div>`;
  }
  function stepsHTML(m) {
    const cur = stepOf(m, F.u);
    return `<span>${tr('كل ضغطة', 'Each tap')}</span>${STEPS[F.u].map(v => `<button type="button" data-step="${v}" aria-pressed="${v === cur}">${fmt(v)}</button>`).join('')}<span>${unitName(F.u)}</span>`;
  }
  const detailLbl = () => (F.detail
    ? tr('رجّع للطريقة السريعة (كل الجلسات نفس الشي)', 'Back to quick mode (all sets the same)')
    : tr('الجلسات مختلفة عن بعض؟ فصّل كل جلسة', 'Sets not all the same? Enter each set'));
  const saveBtn = () => `<button type="button" class="go" id="save">${I.check}<span>${tr('سجّل', 'Log it')}</span></button>`;

  function weightForm(m) {
    const lbl = (EN ? m.le : m.l) || eqLbl(m);
    return `
      <div class="led-box">
        <div class="led-top"><span>${esc(lbl)}</span>${unitSeg()}</div>
        ${ledRow('w', lbl)}
        <div class="steps simple" id="steps">${stepsHTML(m)}</div>
        <div class="calc" id="calc" aria-live="polite"></div>
      </div>
      ${m.eq === 'bar' ? '<div class="pside simple" id="pside"></div>' : ''}
      <div class="duo simple">${counter('r', tr('العدات', 'Reps'))}${counter('n', tr('الجلسات', 'Sets'))}</div>
      <div class="detail" id="detail" hidden></div>
      <button type="button" class="text-btn" id="detailT">${detailLbl()}</button>
      ${saveBtn()}`;
  }
  function bwForm() {
    return `
      <div class="led-box">
        <div class="led-top"><span>${tr('العدات بكل جلسة', 'Reps per set')}</span></div>
        ${ledRow('r', tr('العدات', 'Reps'), 'numeric')}
        <div class="calc" id="calc" aria-live="polite"></div>
      </div>
      <div class="duo simple">${counter('n', tr('الجلسات', 'Sets'))}${counter('w', tr(`وزن إضافي (${unitName(F.u)})`, `Extra weight (${unitName(F.u)})`), 'decimal')}</div>
      <div class="detail" id="detail" hidden></div>
      <button type="button" class="text-btn" id="detailT">${detailLbl()}</button>
      ${saveBtn()}`;
  }
  function timedForm() {
    return `
      <div class="led-box">
        <div class="led-top"><span>${tr('الثواني بكل جلسة', 'Seconds per set')}</span></div>
        ${ledRow('s', tr('الثواني', 'Seconds'), 'numeric')}
        <div class="calc" id="calc" aria-live="polite"></div>
      </div>
      <div class="duo one">${counter('n', tr('الجلسات', 'Sets'))}</div>
      ${saveBtn()}`;
  }
  function cardioForm(m) {
    const opt = (id, label, mode) => `<label class="fld"><span>${esc(label)}</span><input id="${id}" type="text" inputmode="${mode}" autocomplete="off" placeholder="${tr('اختياري', 'Optional')}" value="${F[id] ? fmtIn(F[id]) : ''}"></label>`;
    return `
      <div class="led-box">
        <div class="led-top"><span>${tr('المدة بالدقائق', 'Time in minutes')}</span></div>
        ${ledRow('min', tr('الدقائق', 'Minutes'), 'numeric')}
      </div>
      <div class="trio">
        ${opt('km', tr('المسافة (كم)', 'Distance (km)'), 'decimal')}
        ${m.lv ? opt('lv', lvName(m.lv), 'decimal') : ''}
        ${opt('cal', tr('السعرات', 'Calories'), 'numeric')}
      </div>
      ${saveBtn()}`;
  }

  function viewMachine(id) {
    curM = id;
    const m = mById(id);
    const sec = secById(m.s);
    const last = lastLog(id);
    const sug = suggest(m, last);
    initForm(m, last, sug);
    const today = last && daysAgo(last.t) === 0;
    const tipText = today ? tr('سجلت هالجهاز اليوم. لو بتسجل جولة ثانية عدّل الأرقام واضغط سجّل.', 'You logged this machine today. For another round, change the numbers and tap Log it.') : sug.text;
    const name = mName(m);
    app.innerHTML = `
      ${curPlan
        ? `<a class="back" href="#/plan/${esc(curPlan.id)}">${I.back}${esc(curPlan.name)}</a>`
        : `<a class="back" href="${sec ? '#/s/' + esc(sec.id) : '#/'}">${I.back}${esc(sec ? secName(sec) : tr('الأقسام', 'Sections'))}</a>`}
      <header class="mhead${hasPhoto(m) ? ' has-photo' : ''}">
        <div class="mhead-t">
          <h1>${esc(name)}</h1>
          ${!EN && m.e ? `<p class="en"><bdi dir="ltr">${esc(m.e)}</bdi></p>` : ''}
        </div>
        ${hasPhoto(m) ? `<button type="button" class="mphoto" data-act="photo" aria-label="${tr('كبّر صورة', 'Enlarge photo of')} ${esc(name)}">${frames(m, tr('صورة ', 'Photo of ') + name)}</button>` : ''}
      </header>
      <div class="tip">
        ${last ? `<p class="tip-last"><span>${tr('آخر مرة،', 'Last time:')} ${rel(last.t)}</span><b>${esc(summary(last))}</b></p>` : ''}
        <p class="tip-sug"><span class="spark" aria-hidden="true"></span>${esc(tipText)}</p>
      </div>
      <section class="rig" id="rig">${m.k === 'c' ? cardioForm(m) : m.k === 't' ? timedForm() : m.k === 'bw' ? bwForm() : weightForm(m)}</section>
      ${curPlan ? '<section class="next-card" id="nextCard" aria-live="polite"></section>' : ''}
      <section class="hist" id="hist"></section>
      <div class="foot">${m.custom
        ? `<button class="text-btn danger" type="button" data-act="del-m">${tr('احذف الجهاز', 'Delete machine')}</button>`
        : `<button class="text-btn" type="button" data-act="hide-m">${tr('ما أستخدمه؟ أخفه من القائمة', "Don't use it? Hide it from the list")}</button>`}</div>`;
    bindForm(m);
    if (F.detail) applyDetail(m);
    updAll(m);
    renderHist(m);
    renderNext(m);
  }

  function cell(v, label, cls) {
    return `<div class="calc-cell ${cls || ''}"><b class="led">${v}</b><span>${esc(label)}</span></div>`;
  }
  const OP_X = '<i aria-hidden="true">×</i>', OP_EQ = '<i aria-hidden="true">=</i>';
  function updCalc() {
    const el = $('#calc');
    if (!el) return;
    const U = unitName(F.u);
    const L = { sets: tr('جلسات', 'sets'), reps: tr('عدات', 'reps'), tot: tr(`${U} المجموع`, `${U} total`) };
    if (F.k === 't') {
      const tot = (F.s || 0) * (F.n || 0);
      const mm = Math.floor(tot / 60), ss = Math.round(tot % 60);
      el.innerHTML = cell(fmt(F.s), tr('ثانية', 'sec')) + OP_X + cell(fmt(F.n), L.sets) + OP_EQ + cell(`${mm}:${String(ss).padStart(2, '0')}`, tr('دقيقة مجموع', 'min total'), 'sum');
      el.setAttribute('aria-label', tr(`المجموع ${mm} دقيقة و ${ss} ثانية`, `Total ${mm} min ${ss} sec`));
      return;
    }
    const sets = currentSets();
    const reps = sets.reduce((a, s) => a + s.r, 0);
    const vol = sets.reduce((a, s) => a + s.w * s.r, 0);
    if (F.detail) {
      el.innerHTML = cell(sets.length, L.sets) + '<i class="gap" aria-hidden="true"></i>' + cell(reps, tr('عدة', 'reps')) + OP_EQ + cell(fmt(vol), L.tot, 'sum');
    } else if (F.k === 'bw' && !(+F.w)) {
      el.innerHTML = cell(fmt(F.r), L.reps) + OP_X + cell(fmt(F.n), L.sets) + OP_EQ + cell(fmt(reps), tr('عدة مجموع', 'reps total'), 'sum');
    } else if (F.k === 'bw') {
      el.innerHTML = cell(fmt(F.r), L.reps) + OP_X + cell(fmt(F.n), L.sets) + OP_X + cell(fmt(F.w), U) + OP_EQ + cell(fmt(vol), L.tot, 'sum');
    } else {
      el.innerHTML = cell(fmt(F.w), U) + OP_X + cell(fmt(F.r), L.reps) + OP_X + cell(fmt(F.n), L.sets) + OP_EQ + cell(fmt(vol), L.tot, 'sum');
    }
  }
  function updPlates() {
    const el = $('#pside');
    if (!el || F.detail) return;
    const U = unitName(F.u);
    const r = platesFor(+F.w || 0, F.u);
    if (r.under) { el.innerHTML = `<p>${tr(`الوزن أقل من البار نفسه (${r.bar} ${U}).`, `That's less than the bar itself (${r.bar} ${U}).`)}</p>`; return; }
    if (!r.out.length && !r.rem) { el.innerHTML = `<p>${tr(`البار لحاله بدون أقراص (${r.bar} ${U}).`, `Just the bar, no plates (${r.bar} ${U}).`)}</p>`; return; }
    el.innerHTML = `<p>${tr(`حط في كل جهة من البار (البار ${r.bar} ${U}):`, `Load on each side of the bar (bar ${r.bar} ${U}):`)}</p>
      <div class="sleeve" aria-label="${tr('الأقراص في كل جهة', 'Plates per side')}: ${r.out.map(fmt).join(' + ')}">
        <span class="collar" aria-hidden="true"></span>
        ${r.out.map(p => `<span class="pchip c-${PCOL[F.u][p]}" style="height:${PH[F.u][p]}px">${fmt(p)}</span>`).join('')}
      </div>
      ${r.rem ? `<p class="warn">${tr(`ما يتركب بالضبط بالأقراص المعتادة، يبقى ${fmt(r.rem * 2)} ${U}.`, `Can't load this exactly with standard plates; ${fmt(r.rem * 2)} ${U} left over.`)}</p>` : ''}`;
  }
  function fitLed() {
    const el = $('#rig .led-in');
    if (!el) return;
    const L = el.value.length;
    el.style.fontSize = L <= 3 ? '' : `calc(clamp(92px, 28vw, 128px) * ${L === 4 ? 0.84 : L === 5 ? 0.72 : 0.6})`;
  }
  function updAll() { updCalc(); updPlates(); fitLed(); }

  function renderDetail() {
    const box = $('#detail');
    if (!box) return;
    box.hidden = !F.detail;
    if (!F.detail) { box.innerHTML = ''; return; }
    const U = unitName(F.u);
    const isBw = F.k === 'bw';
    box.innerHTML = F.sets.map((s, i) => `
      <div class="drow" data-i="${i}">
        <span class="drow-n">${tr('جلسة', 'Set')} ${i + 1}</span>
        <label><input type="text" inputmode="decimal" data-k="w" value="${fmtIn(s.w)}" aria-label="${isBw ? tr('الوزن الإضافي في الجلسة', 'Extra weight, set') : tr('الوزن في الجلسة', 'Weight, set')} ${i + 1}"><small>${U}</small></label>
        <span class="x" aria-hidden="true">×</span>
        <label><input type="text" inputmode="numeric" data-k="r" value="${fmtIn(s.r)}" aria-label="${tr('العدات في الجلسة', 'Reps, set')} ${i + 1}"><small>${tr('عدة', 'reps')}</small></label>
        <button type="button" class="drow-del" data-del="${i}" aria-label="${tr('احذف الجلسة', 'Delete set')} ${i + 1}" ${F.sets.length < 2 ? 'disabled' : ''}>${I.x}</button>
      </div>`).join('') + `<button type="button" class="add-set" id="addSet">${I.plus}<span>${tr('أضف جلسة', 'Add a set')}</span></button>`;
  }
  function applyDetail() {
    $$('#rig .simple').forEach(x => { x.hidden = F.detail; });
    const t = $('#detailT');
    if (t) t.textContent = detailLbl();
    renderDetail();
  }
  function syncInputs() {
    ['w', 'r', 'n', 's', 'min'].forEach(f => { const el = document.getElementById(f); if (el && f in F) el.value = fmtIn(F[f]); });
  }

  function bump(m, f, d) {
    if (f === 'w') F.w = Math.max(0, round2((+F.w || 0) + d * stepOf(m, F.u)));
    else if (f === 'r') F.r = clamp(Math.round(+F.r || 0) + d, 1, 300);
    else if (f === 'n') F.n = clamp(Math.round(+F.n || 0) + d, 1, 30);
    else if (f === 's') F.s = clamp(Math.round(+F.s || 0) + d * 5, 5, 3600);
    else if (f === 'min') F.min = clamp(Math.round(+F.min || 0) + d, 1, 600);
    const el = document.getElementById(f);
    if (el) el.value = fmtIn(F[f]);
    updAll(m);
  }

  function bindForm(m) {
    const rig = $('#rig');
    let rep = null, repT = null;
    const stop = () => { clearTimeout(repT); clearInterval(rep); rep = repT = null; };

    rig.addEventListener('pointerdown', e => {
      const b = e.target.closest('.stp');
      if (!b || e.button > 0) return;
      e.preventDefault();
      stop();
      const f = b.dataset.f, d = +b.dataset.d;
      bump(m, f, d);
      repT = setTimeout(() => { rep = setInterval(() => bump(m, f, d), 85); }, 450);
      const end = () => { stop(); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); b.removeEventListener('pointerleave', end); };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      b.addEventListener('pointerleave', end);
    });

    rig.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.classList.contains('stp')) { if (e.detail === 0) bump(m, b.dataset.f, +b.dataset.d); return; }
      if (b.dataset.u) {
        F.u = b.dataset.u;
        S.prefs.mu[m.id] = F.u;
        save();
        $$('[data-u]', rig).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.u === F.u)));
        const st = $('#steps');
        if (st) st.innerHTML = stepsHTML(m);
        if (F.detail) renderDetail();
        updAll(m);
        renderHist(m);
        return;
      }
      if (b.dataset.step) {
        S.prefs.step[m.id] = +b.dataset.step;
        save();
        $('#steps').innerHTML = stepsHTML(m);
        return;
      }
      if (b.id === 'detailT') {
        F.detail = !F.detail;
        if (F.detail) F.sets = Array.from({ length: F.n }, () => ({ w: F.w, r: F.r }));
        else {
          const s = F.sets[0] || { w: F.w, r: F.r };
          Object.assign(F, { w: s.w, r: s.r, n: Math.max(1, F.sets.length) });
          syncInputs();
        }
        applyDetail(m);
        updAll(m);
        return;
      }
      if (b.id === 'addSet') {
        const lastSet = F.sets[F.sets.length - 1] || { w: F.w, r: F.r };
        F.sets.push({ w: lastSet.w, r: lastSet.r });
        renderDetail();
        updAll(m);
        const ins = $$('#detail .drow input[data-k="w"]');
        if (ins.length) ins[ins.length - 1].focus();
        return;
      }
      if (b.dataset.del != null) {
        F.sets.splice(+b.dataset.del, 1);
        renderDetail();
        updAll(m);
        return;
      }
      if (b.id === 'save') doSave(m);
    });

    rig.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.k) {
        const i = +t.closest('.drow').dataset.i;
        F.sets[i][t.dataset.k] = num(t.value);
      } else if (t.id && t.id in F) {
        F[t.id] = num(t.value);
      }
      updAll(m);
    });
    rig.addEventListener('focusin', e => { if (e.target.matches('input')) e.target.select(); });
  }

  function doSave(m) {
    const log = { id: uid(), m: m.id, n: m.n, k: m.k, t: Date.now() };
    if (m.k === 'c') {
      const min = num(F.min);
      if (!(min > 0)) { toast(tr('اكتب كم دقيقة لعبت.', 'Enter how many minutes you did.')); return; }
      log.min = min;
      if (num(F.km)) log.km = num(F.km);
      if (num(F.lv)) { log.lv = num(F.lv); log.lvl = m.lv || 'المستوى'; }
      if (num(F.cal)) log.cal = num(F.cal);
    } else {
      const sets = currentSets();
      if (!sets.length) { toast(tr('أضف جلسة وحدة على الأقل.', 'Add at least one set.')); return; }
      if (m.k === 't') {
        if (sets.some(s => !(s.s > 0))) { toast(tr('اكتب كم ثانية بكل جلسة.', 'Enter the seconds for each set.')); return; }
      } else if (sets.some(s => !(s.r > 0))) { toast(tr('فيه جلسة عداتها صفر. عدّلها أو احذفها.', 'One set has zero reps. Fix it or delete it.')); return; }
      log.sets = sets;
      if (m.k !== 't') { log.u = F.u; S.prefs.mu[m.id] = F.u; }
    }
    S.logs.push(log);
    if (!save()) { S.logs.pop(); return; }
    const v = volU(log);
    const tail = v > 0 ? tr(` رفعت ${fmt(v)} ${unitName(log.u)} على هالجهاز.`, ` You lifted ${fmt(v)} ${unitName(log.u)} on this machine.`) : '';
    viewMachine(m.id);
    toast(tr('تسجّل.', 'Logged.') + tail);
  }

  function chart(vals, label) {
    const Wd = 320, H = 116, px = 12, pt = 24, pb = 12;
    const mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn;
    const y = v => (sp ? pt + (1 - (v - mn) / sp) * (H - pt - pb) : (pt + H - pb) / 2);
    const x = i => px + i * (Wd - 2 * px) / (vals.length - 1);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const li = vals.length - 1;
    return `<figure class="chart">
      <figcaption>${esc(label)}</figcaption>
      <svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${esc(label)}: ${tr('من', 'from')} ${fmt(vals[0])} ${tr('إلى', 'to')} ${fmt(vals[li])}">
        <line class="base" x1="0" x2="${Wd}" y1="${H - 1}" y2="${H - 1}"/>
        <polyline points="${pts}"/>
        ${vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === li ? 5.5 : 3.5}"${i === li ? ' class="last"' : ''}/>`).join('')}
        <text x="${x(0).toFixed(1)}" y="${(y(vals[0]) - 11).toFixed(1)}" text-anchor="start">${fmt(vals[0])}</text>
        <text x="${x(li).toFixed(1)}" y="${(y(vals[li]) - 11).toFixed(1)}" text-anchor="end" class="hi">${fmt(vals[li])}</text>
      </svg>
      <div class="chart-x"><span>${tr('الأقدم', 'Oldest')}</span><span>${tr('الأحدث', 'Newest')}</span></div>
    </figure>`;
  }

  function renderHist(m) {
    const el = $('#hist');
    if (!el) return;
    const ls = logsOf(m.id);
    let html = `<h2 class="h2">${tr('سجلك على هالجهاز', 'Your history on this machine')}</h2>`;
    if (!ls.length) {
      el.innerHTML = html + `<p class="empty">${tr('أول تسجيل لك يطلع هنا، ومعه رسم يوضح تقدمك مع الوقت.', 'Your first entry shows up here, with a chart of your progress over time.')}</p>`;
      return;
    }
    const chron = ls.slice().reverse();
    const times = tr('مرات التمرين', 'Sessions');
    let stats = [], series = [], label = '';
    if (m.k === 'w') {
      const u = F.u, U = unitName(u);
      const cv = (l, s) => conv(+s.w || 0, l.u || 'kg', u);
      const best = Math.max(...ls.flatMap(l => l.sets.map(s => cv(l, s))));
      const orm = Math.max(0, ...ls.flatMap(l => l.sets.filter(s => s.r > 0 && s.r <= 12).map(s => e1rm(cv(l, s), s.r))));
      stats = [
        [fmt(best), tr(`أعلى وزن (${U})`, `Top weight (${U})`)],
        [orm ? fmt(Math.round(orm * 2) / 2) : '—', tr(`أقصى وزن لعدة وحدة، تقدير (${U})`, `Est. max for 1 rep (${U})`)],
        [ls.length, times]
      ];
      series = chron.map(l => Math.max(...l.sets.map(s => cv(l, s))));
      label = tr(`أعلى وزن كل مرة (${U})`, `Top weight each session (${U})`);
    } else if (m.k === 'bw') {
      stats = [
        [Math.max(...ls.flatMap(l => l.sets.map(s => s.r))), tr('أعلى عدات بجلسة', 'Most reps in a set')],
        [ls[0].sets.reduce((a, s) => a + s.r, 0), tr('مجموع عدات آخر مرة', 'Total reps last time')],
        [ls.length, times]
      ];
      series = chron.map(l => l.sets.reduce((a, s) => a + s.r, 0));
      label = tr('مجموع العدات كل مرة', 'Total reps each session');
    } else if (m.k === 't') {
      stats = [
        [Math.max(...ls.flatMap(l => l.sets.map(s => s.s))), tr('أطول ثبات (ثانية)', 'Longest hold (sec)')],
        [ls[0].sets.length, tr('جلسات آخر مرة', 'Sets last time')],
        [ls.length, times]
      ];
      series = chron.map(l => Math.max(...l.sets.map(s => s.s)));
      label = tr('أطول ثبات كل مرة (ثانية)', 'Longest hold each session (sec)');
    } else {
      const kms = ls.map(l => +l.km || 0);
      stats = [
        [fmt(ls.reduce((a, l) => a + (+l.min || 0), 0)), tr('مجموع الدقائق', 'Total minutes')],
        [fmt(Math.max(...ls.map(l => +l.min || 0))), tr('أطول مدة (دقيقة)', 'Longest session (min)')],
        [Math.max(...kms) ? fmt(Math.max(...kms)) : String(ls.length), Math.max(...kms) ? tr('أبعد مسافة (كم)', 'Farthest distance (km)') : times]
      ];
      series = chron.map(l => +l.min || 0);
      label = tr('الدقائق كل مرة', 'Minutes each session');
    }
    html += `<div class="stats">${stats.map(([v, l]) => `<div class="stat"><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join('')}</div>`;
    if (series.length >= 2) html += chart(series.slice(-12), label);
    html += `<ul class="hlist">${ls.map(l => {
      const v = volU(l);
      const day = dfDay.format(new Date(l.t));
      return `<li>
        <div><b>${esc(summary(l))}</b><small>${day}${v ? `${SEP()}${tr('المجموع', 'total')} ${fmt(v)} ${unitName(l.u)}` : ''}</small></div>
        <button type="button" class="del" data-act="del-log" data-id="${esc(l.id)}" aria-label="${tr('احذف تسجيل', 'Delete entry from')} ${esc(day)}">${I.trash}</button>
      </li>`;
    }).join('')}</ul>`;
    el.innerHTML = html;
  }

  /* ---------- جدولي: أيام ثابتة (يوم البوش...) وتطورها بالأسابيع ---------- */
  const PLAN_SUG = [
    { k: 'push', ar: 'يوم البوش', en: 'Push day', items: ['bench-bar', 'incline-db', 'chest-press', 'shoulder-press-db', 'lateral-db', 'pushdown', 'overhead-tri'] },
    { k: 'pull', ar: 'يوم البول', en: 'Pull day', items: ['lat-pulldown', 'cable-row', 'row-db', 'face-pull', 'rear-delt', 'curl-db', 'hammer'] },
    { k: 'legs', ar: 'يوم الأرجل', en: 'Leg day', items: ['squat-bar', 'leg-press', 'rdl', 'leg-ext', 'leg-curl-seated', 'calf-standing'] },
    { k: 'upper', ar: 'الجزء العلوي', en: 'Upper body', items: ['bench-bar', 'lat-pulldown', 'shoulder-press-db', 'cable-row', 'curl-db', 'pushdown'] },
    { k: 'lower', ar: 'الجزء السفلي', en: 'Lower body', items: ['squat-bar', 'rdl', 'leg-press', 'leg-curl-lying', 'calf-seated', 'cable-crunch'] },
    { k: 'full', ar: 'الجسم كامل', en: 'Full body', items: ['squat-bar', 'bench-bar', 'lat-pulldown', 'shoulder-press-mc', 'leg-curl-seated', 'plank'] }
  ];
  const sugItems = sg => sg.items.filter(id => mById(id) && !S.hidden.includes(id));
  const planById = id => S.plans.find(p => p.id === id);
  const planMs = p => p.items.map(mById).filter(Boolean);
  const doneToday = id => { const t0 = startOfDay(Date.now()); return S.logs.some(l => l.m === id && l.t >= t0); };
  const weekStart = t => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - d.getDay()); return d.getTime(); }; // الأسبوع يبدأ الأحد
  const weekDate = (w0, k) => { const d = new Date(w0); d.setDate(d.getDate() + k * 7); return d; };

  // أفضل رقم بالتسجيل: أعلى وزن، أو أكثر عدات، أو أطول ثبات، أو دقائق الكارديو
  function metricOf(l, u) {
    if (l.k === 'c') return +l.min || 0;
    if (l.k === 't') return Math.max(...l.sets.map(s => +s.s || 0));
    if (l.k === 'bw') return Math.max(...l.sets.map(s => +s.r || 0));
    return Math.round(Math.max(...l.sets.map(s => conv(+s.w || 0, l.u || 'kg', u))) * 10) / 10;
  }
  const metricUnit = (m, u) => (m.k === 'c' ? tr('دقيقة', 'min') : m.k === 't' ? tr('ثانية', 'sec') : m.k === 'bw' ? tr('عدات', 'reps') : unitName(u));

  function planData(p) {
    const ms = planMs(p);
    const ids = new Set(ms.map(m => m.id));
    const ls = S.logs.filter(l => ids.has(l.m));
    const t0 = startOfDay(Date.now());
    const w0 = weekStart(ls.reduce((a, l) => Math.min(a, l.t), p.t));
    const wi = t => Math.round((weekStart(t) - w0) / (7 * 864e5));
    const rows = ms.map(m => {
      const u = unitOf(m, lastLog(m.id));
      const by = new Map();
      ls.forEach(l => { if (l.m === m.id) { const k = wi(l.t); by.set(k, Math.max(by.get(k) || 0, metricOf(l, u))); } });
      const ks = [...by.keys()].sort((a, b) => a - b);
      return { m, u, by, ks, delta: ks.length >= 2 ? round2(by.get(ks[ks.length - 1]) - by.get(ks[0])) : null };
    });
    return {
      ms, rows, w0,
      nowW: wi(Date.now()),
      today: new Set(ls.filter(l => l.t >= t0).map(l => l.m)),
      days: new Set(ls.map(l => dayKey(l.t))).size,
      weeks: new Set(ls.map(l => wi(l.t))).size,
      last: ls.reduce((a, l) => Math.max(a, l.t), 0),
      tracked: rows.filter(r => r.ks.length >= 2).length,
      up: rows.filter(r => r.delta > 0).length
    };
  }
  function planMeta(d) {
    const n = plural(d.ms.length, W.mc);
    return d.last
      ? tr(`${n}، آخر مرة ${rel(d.last)}`, `${n}, last time ${rel(d.last)}`)
      : tr(`${n}، ما بديته للحين`, `${n}, not started yet`);
  }
  const signed = v => (v > 0 ? '+' : '−') + fmt(Math.abs(v));

  function viewPlans() {
    const ps = S.plans;
    app.innerHTML = `
      <header class="top small">
        <h1 class="title">${tr('جدولي', 'My plans')}</h1>
        <p class="tag">${tr('ثبّت أجهزة كل يوم تمرين، مثل يوم البوش، وتابع أوزانك عليها أسبوع بعد أسبوع.', 'Fix the machines for each training day, like push day, and follow your weights on them week by week.')}</p>
      </header>
      ${ps.length ? `<div class="mlist">${ps.map(p => {
        const d = planData(p);
        return `<a class="mrow pcard" href="#/plan/${esc(p.id)}">
          <span class="mrow-t"><b>${esc(p.name)}</b><small>${esc(planMeta(d))}</small>${d.tracked ? `<span class="mrow-l">${tr(`تطورت في ${d.up} من ${plural(d.tracked, W.mc)}`, `Improved on ${d.up} of ${plural(d.tracked, W.mc)}`)}</span>` : ''}</span>
          ${d.today.size ? `<span class="pcard-v"><span class="led">${d.today.size}/${d.ms.length}</span><small>${tr('اليوم', 'today')}</small></span>` : '<span></span>'}
          ${I.chev}
        </a>`;
      }).join('')}</div>
      <a class="add-row" href="#/plan-new">${I.plus}<span>${tr('جدول جديد', 'New plan')}</span></a>`
      : `<p class="empty">${tr('ما عندك جدول للحين. اختر يومك ونقترح لك أجهزته، وتشيل وتضيف براحتك.', "No plans yet. Pick your day to get suggested machines, then remove or add as you like.")}</p>
      <div class="chips sugg">${PLAN_SUG.map(s => `<a class="chip" href="#/plan-new/${s.k}">${tr(s.ar, s.en)}</a>`).join('')}<a class="chip" href="#/plan-new">${tr('أخرى', 'Other')}</a></div>`}`;
  }

  function weekTable(d) {
    const cols = [];
    for (let k = d.nowW; k >= 0 && cols.length < 12; k--) cols.push(k); // الأحدث أول
    const head = cols.map(k => `<th scope="col"${k === d.nowW ? ' class="now"' : ''}>${tr('أسبوع', 'Week')} ${k + 1}<small>${dfShort.format(weekDate(d.w0, k))}</small></th>`).join('');
    const body = d.rows.map(r => {
      const cells = cols.map(k => {
        const now = k === d.nowW ? ' now' : '';
        if (!r.by.has(k)) return `<td class="none${now}">—</td>`;
        const v = r.by.get(k);
        const prev = r.ks.filter(x => x < k).pop();
        const pv = prev == null ? null : r.by.get(prev);
        const cls = pv == null || v === pv ? '' : v > pv ? 'up' : 'down';
        return `<td class="${cls}${now}"><b>${fmt(v)}</b></td>`;
      }).join('');
      const dl = r.delta == null ? '' : r.delta === 0
        ? ` <span>${tr('بدون تغيير', 'no change')}</span>`
        : ` <span class="${r.delta > 0 ? 'up-t' : 'down-t'}">${signed(r.delta)}</span>`;
      return `<tr><th scope="row" class="wk-m"><b>${esc(mName(r.m))}</b><small>${esc(metricUnit(r.m, r.u))}${dl}</small></th>${cells}</tr>`;
    }).join('');
    return `<div class="wk-wrap" tabindex="0" role="region" aria-label="${tr('جدول التطور بالأسابيع', 'Weekly progress table')}">
        <table class="wk"><thead><tr><th scope="col" class="wk-m">${tr('الجهاز', 'Machine')}</th>${head}</tr></thead><tbody>${body}</tbody></table>
      </div>
      <p class="wk-note">${tr('كل خانة فيها أفضل رقم لك بالأسبوع: أعلى وزن، أو أكثر عدات، أو أطول وقت. الأخضر يعني تطورت عن الأسبوع اللي قبله، والرقم تحت اسم الجهاز هو الفرق من أول أسبوع.', 'Each cell is your best for that week: top weight, most reps or longest time. Green means you beat your previous week. The number under each machine is the change since your first week.')}</p>`;
  }

  function viewPlan(id) {
    const p = planById(id);
    const d = planData(p);
    app.innerHTML = `
      <a class="back" href="#/plan">${I.back}${tr('جدولي', 'My plans')}</a>
      <header class="shead plan-head">
        <div><h1>${esc(p.name)}</h1><p>${esc(planMeta(d))}</p></div>
        <a class="btn sm" href="#/plan-edit/${esc(p.id)}">${tr('عدّل', 'Edit')}</a>
      </header>
      <section class="board" aria-label="${tr('ملخص الجدول', 'Plan summary')}">
        <div class="board-top"><span>${tr('خلصت اليوم', 'Done today')}</span></div>
        <div class="board-main"><span class="led led-xl">${d.today.size}</span><span class="board-u">${tr(`من ${plural(d.ms.length, W.mc)}`, `of ${plural(d.ms.length, W.mc)}`)}</span></div>
        <div class="board-cells" style="--n:3">
          <div><span class="led">${d.days}</span><span>${tr('مرات التمرين', 'Sessions')}</span></div>
          <div><span class="led">${d.weeks}</span><span>${tr('أسابيع التمرين', 'Weeks trained')}</span></div>
          <div><span class="led${d.tracked ? '' : ' dim'}">${d.tracked ? `${d.up}/${d.tracked}` : '—'}</span><span>${tr('أجهزة تطورت فيها', 'Machines improved')}</span></div>
        </div>
      </section>
      <h2 class="h2">${tr('الأجهزة بالترتيب', 'Machines in order')}</h2>
      ${d.ms.length ? `<div class="mlist">${d.ms.map((m, i) => {
        const l = lastLog(m.id);
        const done = d.today.has(m.id);
        return `<a class="mrow prow${done ? ' done' : ''}" href="#/m/${esc(m.id)}/${esc(p.id)}">
          <span class="pnum">${i + 1}</span>
          ${thumb(m)}
          <span class="mrow-t"><b>${esc(mName(m))}</b>${l ? `<span class="mrow-l">${esc(summary(l))}<em>${rel(l.t)}</em></span>` : `<small>${tr('ما سجلته للحين', 'Not logged yet')}</small>`}</span>
          ${done ? `<span class="ok" role="img" aria-label="${tr('خلصته اليوم', 'Done today')}">${I.check}</span>` : I.chev}
        </a>`;
      }).join('')}</div>` : `<p class="empty">${tr('الجدول فاضي. اضغط عدّل وأضف أجهزته.', 'This plan is empty. Tap Edit to add machines.')}</p>`}
      <h2 class="h2">${tr('تطور أوزانك بالأسابيع', 'Your progress by week')}</h2>
      ${d.weeks ? weekTable(d) : `<p class="empty">${tr('أول ما تسجل على أجهزة الجدول يطلع هنا أفضل رقم لك كل أسبوع، وتشوف وش زاد.', 'Once you log on this plan, your best for each week shows up here, so you can see what went up.')}</p>`}`;
  }

  function renderNext(m) {
    const el = $('#nextCard');
    if (!el || !curPlan) return;
    const ms = planMs(curPlan);
    const i = ms.findIndex(x => x.id === m.id);
    const nx = ms.slice(i + 1).concat(ms.slice(0, i)).find(x => !doneToday(x.id));
    const doneN = ms.filter(x => doneToday(x.id)).length;
    const head = `<p>${esc(curPlan.name)}: ${tr(`الجهاز ${i + 1} من ${ms.length}، خلصت ${doneN}`, `machine ${i + 1} of ${ms.length}, ${doneN} done`)}</p>`;
    if (nx) {
      el.innerHTML = head + `<a class="btn-next" href="#/m/${esc(nx.id)}/${esc(curPlan.id)}"><span>${tr('التالي', 'Next')}: ${esc(mName(nx))}</span>${I.chev}</a>`;
    } else if (!doneToday(m.id)) {
      el.innerHTML = head + `<p class="next-last">${tr('هذا آخر جهاز باقي في الجدول اليوم.', 'This is the last machine left in the plan today.')}</p>`;
    } else {
      el.innerHTML = head + `<a class="btn-next" href="#/plan/${esc(curPlan.id)}"><span>${tr('خلصت الجدول اليوم. شوف تطورك', 'Plan done for today. See your progress')}</span>${I.chev}</a>`;
    }
  }

  /* تعديل الجدول أو جدول جديد */
  let PE = null;
  function renderPE() {
    const ms = PE.items.map(mById).filter(Boolean);
    $('#peH').textContent = tr(`أجهزة الجدول بالترتيب (${ms.length})`, `Plan machines in order (${ms.length})`);
    $('#peList').innerHTML = ms.length ? ms.map((m, i) => `<li class="mrow perow" data-mid="${esc(m.id)}">
        <span class="pnum">${i + 1}</span>
        <span class="mrow-t"><b>${esc(mName(m))}</b><small>${esc(secName(secById(m.s)))}</small></span>
        <span class="pe-act">
          <button type="button" data-mv="-1" aria-label="${tr('طلّعه فوق', 'Move up')}: ${esc(mName(m))}"${i === 0 ? ' disabled' : ''}>${I.up}</button>
          <button type="button" data-mv="1" aria-label="${tr('نزّله تحت', 'Move down')}: ${esc(mName(m))}"${i === ms.length - 1 ? ' disabled' : ''}>${I.down}</button>
          <button type="button" data-rm="1" aria-label="${tr('شيله', 'Remove')}: ${esc(mName(m))}">${I.x}</button>
        </span>
      </li>`).join('') : `<li class="pe-empty">${tr('ما اخترت أجهزة للحين. اختر من الأقسام تحت.', 'No machines yet. Pick from the sections below.')}</li>`;
    $$('#pePick .pk-row').forEach(b => b.setAttribute('aria-pressed', String(PE.items.includes(b.dataset.mid))));
    $$('#pePick .pk').forEach(d => {
      const n = $$('.pk-row[aria-pressed="true"]', d).length;
      $('summary small', d).textContent = n ? tr(`اخترت ${n}`, `${n} selected`) : '';
    });
    $$('[data-sug]').forEach(b => b.setAttribute('aria-pressed', String(PE.sug != null && b.dataset.sug === PE.sug)));
  }
  function viewPlanEdit(id, sugKey) {
    const p = id ? planById(id) : null;
    const sg = PLAN_SUG.find(s => s.k === sugKey);
    PE = p
      ? { id: p.id, name: p.name, items: planMs(p).map(m => m.id), sug: null, auto: false }
      : { id: null, name: sg ? tr(sg.ar, sg.en) : '', items: sg ? sugItems(sg) : [], sug: sg ? sg.k : null, auto: !!sg };
    const pick = sections().map(s => {
      const ms = machines().filter(m => m.s === s.id && (!S.hidden.includes(m.id) || PE.items.includes(m.id)));
      if (!ms.length) return '';
      return `<details class="pk"><summary><span class="dot c-${esc(s.color)}" aria-hidden="true"></span>${esc(secName(s))}<small></small></summary>${ms.map(m => `<button type="button" class="pk-row" data-mid="${esc(m.id)}" aria-pressed="false">${thumb(m)}<span class="mrow-t"><b>${esc(mName(m))}</b>${!EN && m.e ? `<small><bdi dir="ltr">${esc(m.e)}</bdi></small>` : ''}</span><span class="box" aria-hidden="true">${I.check}</span></button>`).join('')}</details>`;
    }).join('');
    app.innerHTML = `
      <a class="back" href="${p ? '#/plan/' + esc(p.id) : '#/plan'}">${I.back}${esc(p ? p.name : tr('جدولي', 'My plans'))}</a>
      <header class="top small"><h1 class="title">${p ? tr('عدّل الجدول', 'Edit plan') : tr('جدول جديد', 'New plan')}</h1></header>
      <label class="fld"><span>${tr('اسم الجدول', 'Plan name')}</span><input type="text" id="peName" maxlength="30" value="${esc(PE.name)}" placeholder="${tr('مثل: يوم البوش', 'e.g. Push day')}" autocomplete="off"></label>
      ${p ? '' : `<div class="chips sugg" role="group" aria-label="${tr('اقتراحات', 'Suggestions')}">${PLAN_SUG.map(s => `<button type="button" class="chip" data-sug="${s.k}" aria-pressed="false">${tr(s.ar, s.en)}</button>`).join('')}<button type="button" class="chip" data-sug="" aria-pressed="false">${tr('أخرى', 'Other')}</button></div>
      <p class="hint">${tr('اختر يومك ونحط لك أجهزته المعتادة، وبعدها شيل وأضف اللي يناسبك.', 'Pick your day to fill in its usual machines, then remove or add what suits you.')}</p>`}
      <h2 class="h2" id="peH"></h2>
      <ol class="mlist plist" id="peList"></ol>
      <h2 class="h2">${tr('أضف أجهزة', 'Add machines')}</h2>
      <label class="search">${I.search}<input id="peQ" type="search" placeholder="${tr('ابحث عن جهاز', 'Search machines')}" autocomplete="off" enterkeyhint="search" aria-label="${tr('ابحث عن جهاز', 'Search machines')}"></label>
      <div id="pePick">${pick}</div>
      <div class="savebar"><button type="button" class="go" id="peSave">${I.check}<span>${tr('احفظ الجدول', 'Save plan')}</span></button></div>
      ${p ? `<div class="foot"><button class="text-btn danger" type="button" id="peDel">${tr('احذف الجدول', 'Delete plan')}</button></div>` : ''}`;
    renderPE();

    const nameIn = $('#peName');
    nameIn.addEventListener('input', () => { PE.name = nameIn.value; });
    $$('[data-sug]').forEach(b => b.addEventListener('click', () => {
      const s = PLAN_SUG.find(x => x.k === b.dataset.sug);
      if (s) {
        // اختيار يوم ثاني يبدّل الأجهزة، ولو عدّلت عليها يدويًا نتأكد قبل
        if (PE.items.length && !PE.auto && !confirm(tr(`تبدّل الأجهزة اللي اخترتها بأجهزة ${s.ar}؟`, `Replace your picked machines with the ${s.en.toLowerCase()} machines?`))) return;
        PE.name = tr(s.ar, s.en);
        nameIn.value = PE.name;
        PE.items = sugItems(s);
        PE.auto = true;
        PE.sug = s.k;
      } else {
        if (PE.auto) { PE.items = []; PE.auto = false; }
        PE.name = '';
        nameIn.value = '';
        PE.sug = '';
        nameIn.focus();
      }
      renderPE();
    }));
    $('#peList').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const mid = b.closest('li').dataset.mid;
      const i = PE.items.indexOf(mid);
      if (i < 0) return;
      if (b.dataset.mv) {
        const j = i + +b.dataset.mv;
        if (j < 0 || j >= PE.items.length) return;
        [PE.items[i], PE.items[j]] = [PE.items[j], PE.items[i]];
      } else if (b.dataset.rm) {
        PE.items.splice(i, 1);
      }
      PE.auto = false;
      renderPE();
      const again = b.dataset.mv && $(`#peList li[data-mid="${mid}"] button[data-mv="${b.dataset.mv}"]`);
      if (again && !again.disabled) again.focus();
    });
    $('#pePick').addEventListener('click', e => {
      const b = e.target.closest('.pk-row');
      if (!b) return;
      const i = PE.items.indexOf(b.dataset.mid);
      if (i >= 0) PE.items.splice(i, 1); else PE.items.push(b.dataset.mid);
      PE.auto = false;
      renderPE();
    });
    $('#peQ').addEventListener('input', e => {
      const v = norm(e.target.value);
      $$('#pePick .pk').forEach(d => {
        let hits = 0;
        $$('.pk-row', d).forEach(r => {
          const m = mById(r.dataset.mid);
          const ok = !v || norm(m.n).includes(v) || (!!m.e && m.e.toLowerCase().includes(v));
          r.hidden = !ok;
          if (ok) hits++;
        });
        d.hidden = !!v && !hits;
        if (v) d.open = hits > 0;
      });
    });
    $('#peSave').addEventListener('click', () => {
      const name = String(PE.name || '').trim().slice(0, 30);
      const items = PE.items.filter(x => mById(x));
      if (!name) { toast(tr('اكتب اسم الجدول.', 'Type a plan name.')); nameIn.focus(); return; }
      if (!items.length) { toast(tr('اختر جهاز واحد على الأقل.', 'Pick at least one machine.')); return; }
      let pl = PE.id ? planById(PE.id) : null;
      const isNew = !pl;
      const before = pl ? { name: pl.name, items: pl.items } : null;
      if (pl) Object.assign(pl, { name, items });
      else { pl = { id: 'p-' + uid(), name, items, t: Date.now() }; S.plans.push(pl); }
      if (!save()) { if (isNew) S.plans.pop(); else Object.assign(pl, before); return; }
      location.hash = '#/plan/' + pl.id;
      toast(tr('انحفظ الجدول.', 'Plan saved.'));
    });
    if (p) $('#peDel').addEventListener('click', () => {
      if (!confirm(tr(`تحذف جدول «${p.name}»؟ تسجيلاتك تبقى في السجل.`, `Delete the "${p.name}" plan? Your entries stay in the log.`))) return;
      S.plans = S.plans.filter(x => x.id !== p.id);
      save();
      location.hash = '#/plan';
      toast(tr('انحذف الجدول.', 'Plan deleted.'));
    });
  }

  /* ---------- السجل ---------- */
  function viewLog() {
    const ls = S.logs.slice().sort((a, b) => b.t - a.t);
    const now = new Date();
    const sow = startOfDay(Date.now() - now.getDay() * 864e5); // الأسبوع يبدأ الأحد
    const d30 = startOfDay(Date.now() - 29 * 864e5);
    const daysWeek = new Set(ls.filter(l => l.t >= sow).map(l => dayKey(l.t))).size;
    const days30 = new Set(ls.filter(l => l.t >= d30).map(l => dayKey(l.t))).size;
    const groups = [];
    ls.forEach(l => {
      const k = dayKey(l.t);
      let g = groups[groups.length - 1];
      if (!g || g.k !== k) { g = { k, t: l.t, items: [] }; groups.push(g); }
      g.items.push(l);
    });
    app.innerHTML = `
      <header class="top small"><h1 class="title">${tr('السجل', 'Log')}</h1></header>
      <section class="board slim" aria-label="${tr('ملخص الأيام', 'Days summary')}">
        <div class="board-cells">
          <div><span class="led">${daysWeek}</span><span>${tr('أيام تمرين هالأسبوع', 'Training days this week')}</span></div>
          <div><span class="led">${days30}</span><span>${tr('آخر 30 يوم', 'Last 30 days')}</span></div>
          <div><span class="led">${ls.length}</span><span>${tr('كل التسجيلات', 'All entries')}</span></div>
        </div>
      </section>
      ${!ls.length ? `<p class="empty spaced">${tr('ما سجلت شي للحين. أول جهاز تسجله يطلع هنا مرتب حسب اليوم.', 'Nothing logged yet. Every machine you log shows up here, grouped by day.')}</p>` : ''}
      ${groups.map(g => {
        const exN = new Set(g.items.map(l => l.m)).size;
        return `<section class="day">
          <h2 class="day-h"><span>${dfDay.format(new Date(g.t))}${daysAgo(g.t) <= 1 ? ` <em>${rel(g.t)}</em>` : ''}</span><span class="kg">${numWord(exN, W.ex)}</span></h2>
          <div class="mlist">${g.items.map(l => {
            const m = mById(l.m);
            const name = m ? mName(m) : (l.n || tr('جهاز محذوف', 'Deleted machine'));
            const col = m ? secColor(m.s) : 'steel';
            return `<a class="mrow" href="${m ? '#/m/' + esc(m.id) : '#/log'}">
              ${m ? thumb(m) : `<span class="thumb thumb-plate c-${esc(col)}" aria-hidden="true"></span>`}
              <span class="mrow-t"><b>${esc(name)}</b><span class="mrow-l">${esc(summary(l))}</span></span>
              ${I.chev}
            </a>`;
          }).join('')}</div>
        </section>`;
      }).join('')}`;
  }

  /* ---------- الإعدادات ---------- */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installEvt = e;
    const b = $('#install');
    if (b) b.hidden = false;
  });

  function viewSettings() {
    const hidden = S.hidden.map(mById).filter(Boolean);
    const lb = lastBody();
    app.innerHTML = `
      <header class="top small"><h1 class="title">${tr('الإعدادات', 'Settings')}</h1></header>
      <section class="card">
        <h2>${tr('اللغة', 'Language')}</h2>
        <div class="seg light" role="group" aria-label="${tr('اللغة', 'Language')}">
          <button type="button" data-lang="ar" lang="ar" aria-pressed="${!EN}">عربي</button>
          <button type="button" data-lang="en" lang="en" aria-pressed="${EN}">English</button>
        </div>
      </section>
      <section class="card">
        <h2>${tr('اسمك', 'Your name')}</h2>
        <form class="name-row" id="nameForm" novalidate>
          <input type="text" name="name" maxlength="24" value="${esc(S.name)}" aria-label="${tr('اسمك', 'Your name')}" autocomplete="given-name">
          <button type="submit" class="btn">${tr('احفظ', 'Save')}</button>
        </form>
      </section>
      <section class="card">
        <h2>${tr('وزن الجسم', 'Body weight')}</h2>
        <p>${lb ? tr(`آخر قياس ${fmt(lb.w)} ${unitName(lb.u)}، ${rel(lb.t)}.`, `Last weigh-in: ${fmt(lb.w)} ${unitName(lb.u)}, ${rel(lb.t)}.`) : tr('ما سجلت وزنك للحين.', "You haven't logged your weight yet.")}</p>
        <button type="button" class="btn" data-act="body">${tr('سجّل وزنك اليوم', "Log today's weight")}</button>
      </section>
      <section class="card">
        <h2>${tr('الوحدة للأجهزة الجديدة', 'Unit for new machines')}</h2>
        <p>${tr('كل جهاز يحفظ وحدته لحاله، فتقدر تخلي جهاز بالرطل وجهاز بالكيلو.', 'Each machine keeps its own unit, so one can be in pounds and another in kilograms.')}</p>
        <div class="seg light" role="group" aria-label="${tr('الوحدة الافتراضية', 'Default unit')}">
          <button type="button" data-unit="kg" aria-pressed="${S.prefs.unit === 'kg'}">${tr('كيلو (كجم)', 'Kilograms (kg)')}</button>
          <button type="button" data-unit="lb" aria-pressed="${S.prefs.unit === 'lb'}">${tr('رطل (lb)', 'Pounds (lb)')}</button>
        </div>
      </section>
      <section class="card">
        <h2>${tr('بياناتك', 'Your data')}</h2>
        <p>${tr('كل تسجيلاتك محفوظة في هالجوال بس، ما تطلع لأي مكان. نزّل نسخة احتياطية كل فترة، عشان لو غيرت جوالك أو انمسح المتصفح ترجعها.', 'Everything you log stays on this phone and is never sent anywhere. Download a backup now and then, so you can restore it if you change phones or the browser data gets cleared.')}</p>
        <div class="btn-row">
          <button type="button" class="btn" id="exp">${tr('نزّل نسخة احتياطية', 'Download backup')}</button>
          <label class="btn">${tr('استرجع من نسخة', 'Restore from backup')}<input type="file" id="imp" accept=".json,application/json" hidden></label>
          <button type="button" class="btn" id="install" ${installEvt ? '' : 'hidden'}>${tr('ثبّت أوزاني على الجوال', 'Install Awzani on your phone')}</button>
        </div>
        <p class="note">${tr('نصيحة للآيفون: افتح الموقع من سفاري، اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية». يصير مثل التطبيق، ويشتغل حتى لو النت ضعيف في النادي.', 'iPhone tip: open the site in Safari, tap Share, then "Add to Home Screen". It works like an app, even when the gym signal is weak.')}</p>
      </section>
      ${hidden.length ? `<section class="card">
        <h2>${tr('الأجهزة المخفية', 'Hidden machines')}</h2>
        <ul class="plain">${hidden.map(m => `<li><span>${esc(mName(m))}<small>${esc(secName(secById(m.s)))}</small></span><button type="button" class="btn sm" data-act="unhide" data-id="${esc(m.id)}">${tr('رجّعه', 'Show it')}</button></li>`).join('')}</ul>
      </section>` : ''}
      <section class="card">
        <h2>${tr('عن أوزاني', 'About Awzani')}</h2>
        <p>${tr(`${plural(D.machines.length, W.mc)} في ${plural(D.sections.length, W.sc)}، وتقدر تضيف أجهزة وأقسام نادك. الاقتراح يمشي على قاعدة بسيطة: لما توصل 12 عدة بكل الجلسات زِد الوزن، وارجع لـ 8 عدات.`,
          `${plural(D.machines.length, W.mc)} in ${plural(D.sections.length, W.sc)}, and you can add your own gym's machines and sections. The hint follows a simple rule: once you hit 12 reps in every set, add weight and go back to 8 reps.`)}</p>
        <p class="note">${tr('صور التمارين من مجموعة <bdi dir="ltr">free-exercise-db</bdi> المفتوحة، وهي ملكية عامة.', 'Exercise photos come from the open <bdi>free-exercise-db</bdi> collection, in the public domain.')}</p>
        <button type="button" class="text-btn danger" id="wipe">${tr('امسح كل بياناتي', 'Delete all my data')}</button>
      </section>`;

    $$('[data-lang]').forEach(b => b.addEventListener('click', () => {
      if ((b.dataset.lang === 'en') === EN) return;
      setLang(b.dataset.lang);
      route();
    }));
    $$('[data-unit]').forEach(b => b.addEventListener('click', () => {
      S.prefs.unit = b.dataset.unit;
      save();
      $$('[data-unit]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.unit === S.prefs.unit)));
      toast(tr(`الأجهزة الجديدة صارت بال${S.prefs.unit === 'lb' ? 'رطل' : 'كيلو'}.`, `New machines now use ${S.prefs.unit === 'lb' ? 'pounds' : 'kilograms'}.`));
    }));
    $('#nameForm').addEventListener('submit', e => {
      e.preventDefault();
      const n = String(new FormData(e.target).get('name') || '').trim();
      if (!n) { toast(tr('اكتب اسمك.', 'Type your name.')); return; }
      S.name = n.slice(0, 24);
      if (save()) toast(tr(`تمام يا ${S.name}، انحفظ اسمك.`, `Done, ${S.name}. Your name is saved.`));
    });
    $('#exp').addEventListener('click', exportData);
    $('#imp').addEventListener('change', importData);
    $('#install').addEventListener('click', async () => {
      if (!installEvt) return;
      installEvt.prompt();
      await installEvt.userChoice.catch(() => null);
      installEvt = null;
      $('#install').hidden = true;
    });
    $('#wipe').addEventListener('click', () => {
      if (!confirm(tr('أكيد؟ بينمسح كل تسجيلاتك وأجهزتك المضافة من هالجوال، وما ترجع إلا من نسخة احتياطية.', 'Are you sure? This deletes all your entries and added machines from this phone. Only a backup can bring them back.'))) return;
      const lang = S.prefs.lang;
      S = blank();
      S.prefs.lang = lang;
      save();
      toast(tr('انمسحت كل البيانات.', 'All data deleted.'));
      location.hash = '#/';
    });
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `awzani-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(tr('نزلت النسخة. احفظها في مكان آمن.', 'Backup downloaded. Keep it somewhere safe.'));
  }
  function importData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      let inc;
      try { inc = normalize(JSON.parse(rd.result)); } catch (err) { toast(tr('الملف هذا مو نسخة من أوزاني.', "This file isn't an Awzani backup.")); return; }
      const ids = new Set(S.logs.map(l => l.id));
      let added = 0;
      inc.logs.forEach(l => { if (!ids.has(l.id)) { S.logs.push(l); added++; } });
      ['sections', 'machines'].forEach(k => {
        const have = new Set(S.custom[k].map(x => x.id));
        inc.custom[k].forEach(x => { if (!have.has(x.id)) S.custom[k].push(x); });
      });
      inc.hidden.forEach(h => { if (!S.hidden.includes(h)) S.hidden.push(h); });
      const haveP = new Set(S.plans.map(x => x.id));
      inc.plans.forEach(x => { if (!haveP.has(x.id)) S.plans.push(x); });
      if (!S.name && inc.name) S.name = inc.name;
      const haveB = new Set(S.body.map(x => dayKey(x.t)));
      inc.body.forEach(x => { if (!haveB.has(dayKey(x.t))) S.body.push(x); });
      S.body.sort((a, z) => a.t - z.t);
      Object.assign(S.prefs.mu, inc.prefs.mu);
      Object.assign(S.prefs.step, inc.prefs.step);
      if (save()) toast(added ? tr(`رجعت ${plural(added, W.log)}.`, `Restored ${plural(added, W.log)}.`) : tr('كل اللي في النسخة موجود عندك من قبل.', 'Everything in this backup is already here.'));
      route();
    };
    rd.readAsText(file);
  }

  /* ---------- النوافذ (إضافة جهاز / قسم) ---------- */
  $('#sheet').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  function openSheet(inner, onOk, okLabel) {
    const d = $('#sheet');
    d.innerHTML = `<form class="sheet" novalidate>${inner}
      <div class="sheet-act"><button class="go" type="submit">${okLabel ? I.check : I.plus}<span>${okLabel || tr('أضف', 'Add')}</span></button><button class="ghost" type="button" data-close>${tr('إلغاء', 'Cancel')}</button></div>
    </form>`;
    const form = $('form', d);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (onOk(new FormData(form)) !== false) d.close();
    });
    $('[data-close]', d).addEventListener('click', () => d.close());
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    const first = $('input[type=text]', d);
    if (first) setTimeout(() => first.focus(), 60);
  }
  function openPhoto(m) {
    if (!hasPhoto(m)) return;
    const d = $('#sheet');
    const name = mName(m);
    d.innerHTML = `<div class="sheet viewer">
      <h2>${esc(name)}</h2>
      ${frames(m, tr('صورة توضيحية لتمرين ', 'Demo photo of ') + name)}
      <p class="viewer-cap">${tr('الصورتين توضح بداية الحركة ونهايتها.', 'The two photos show the start and the end of the movement.')}</p>
      <button class="ghost wide" type="button" data-close>${tr('إغلاق', 'Close')}</button>
    </div>`;
    $('[data-close]', d).addEventListener('click', () => d.close());
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  const KIND_OPTS = [
    ['w:mc', 'وزن على جهاز', 'Machine weight'], ['w:bar', 'بار وأقراص', 'Barbell and plates'], ['w:db', 'دمبل', 'Dumbbells'], ['w:cb', 'كيبل', 'Cable'],
    ['w:pl', 'جهاز تركّب فيه أقراص', 'Plate-loaded machine'], ['bw', 'وزن الجسم', 'Bodyweight'], ['t', 'وقت بالثواني', 'Time in seconds'], ['c', 'كارديو بالدقائق', 'Cardio in minutes']
  ];
  function addMachineSheet(secId) {
    const sec = secById(secId);
    const def = secId === 'cardio' ? 'c' : 'w:mc';
    openSheet(`
      <h2>${tr(`أضف جهاز في ${esc(secName(sec))}`, `Add a machine to ${esc(secName(sec))}`)}</h2>
      <label class="fld"><span>${tr('اسم الجهاز', 'Machine name')}</span><input type="text" name="n" maxlength="40" placeholder="${tr('مثل: تشيست برس هامر سترنث', 'e.g. Hammer Strength chest press')}" autocomplete="off"></label>
      <fieldset class="fld"><legend>${tr('وش تسجل فيه؟', 'What do you log on it?')}</legend>
        <div class="opts">${KIND_OPTS.map(([v, a, en]) => `<label class="opt"><input type="radio" name="k" value="${v}" ${v === def ? 'checked' : ''}><span>${tr(a, en)}</span></label>`).join('')}</div>
      </fieldset>`, fd => {
      const n = String(fd.get('n') || '').trim();
      if (!n) { toast(tr('اكتب اسم الجهاز.', 'Type the machine name.')); return false; }
      const [k, eq] = String(fd.get('k') || 'w:mc').split(':');
      const m = { id: 'u-' + uid(), s: secId, n: n.slice(0, 40), e: '', k, custom: true };
      if (k === 'w') m.eq = eq || 'mc';
      if (k === 'c') m.lv = 'المستوى';
      S.custom.machines.push(m);
      if (!save()) return false;
      location.hash = '#/m/' + m.id;
      toast(tr('انضاف الجهاز.', 'Machine added.'));
    });
  }
  function addSectionSheet() {
    openSheet(`
      <h2>${tr('قسم جديد', 'New section')}</h2>
      <label class="fld"><span>${tr('اسم القسم', 'Section name')}</span><input type="text" name="n" maxlength="24" placeholder="${tr('مثل: الإطالة، الجسم كامل، السباحة', 'e.g. Stretching, Full body, Swimming')}" autocomplete="off"></label>`, fd => {
      const n = String(fd.get('n') || '').trim();
      if (!n) { toast(tr('اكتب اسم القسم.', 'Type the section name.')); return false; }
      const s = { id: 'u-' + uid(), name: n.slice(0, 24), color: 'steel', custom: true };
      S.custom.sections.push(s);
      if (!save()) return false;
      location.hash = '#/s/' + s.id;
      toast(tr('انضاف القسم. أضف أجهزته.', 'Section added. Now add its machines.'));
    });
  }

  /* ---------- أزرار عامة ---------- */
  app.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'lang') {
      const inp = $('#startForm input');
      const keep = inp ? inp.value : '';
      setLang(EN ? 'ar' : 'en');
      if (!S.name) { viewStart(keep); return; }
      route();
    }
    else if (act === 'add-sec') addSectionSheet();
    else if (act === 'body') bodySheet();
    else if (act === 'photo') openPhoto(mById(curM));
    else if (act === 'add-m') addMachineSheet(curSec);
    else if (act === 'del-log') {
      if (!confirm(tr('تحذف هالتسجيل؟', 'Delete this entry?'))) return;
      S.logs = S.logs.filter(l => l.id !== a.dataset.id);
      save();
      const m = mById(curM);
      if (m) viewMachine(m.id); else route();
      toast(tr('انحذف التسجيل.', 'Entry deleted.'));
    } else if (act === 'hide-m') {
      const m = mById(curM);
      if (!S.hidden.includes(m.id)) S.hidden.push(m.id);
      save();
      location.hash = '#/s/' + m.s;
      toast(tr('انخفى الجهاز. ترجعه من الإعدادات.', 'Machine hidden. You can bring it back in Settings.'));
    } else if (act === 'del-m') {
      const m = mById(curM);
      if (!confirm(tr(`تحذف «${m.n}»؟ تسجيلاته القديمة تبقى في السجل.`, `Delete "${mName(m)}"? Its old entries stay in the log.`))) return;
      S.custom.machines = S.custom.machines.filter(x => x.id !== m.id);
      S.plans.forEach(pl => { pl.items = pl.items.filter(x => x !== m.id); });
      save();
      location.hash = '#/s/' + m.s;
      toast(tr('انحذف الجهاز.', 'Machine deleted.'));
    } else if (act === 'del-sec') {
      const sec = secById(curSec);
      if (!confirm(tr(`تحذف قسم «${sec.name}»؟ الأجهزة اللي أضفتها فيه تنحذف، وتسجيلاتها تبقى في السجل.`, `Delete the "${secName(sec)}" section? Machines you added to it are deleted; their entries stay in the log.`))) return;
      S.custom.sections = S.custom.sections.filter(x => x.id !== sec.id);
      const gone = new Set(S.custom.machines.filter(x => x.s === sec.id).map(x => x.id));
      S.custom.machines = S.custom.machines.filter(x => x.s !== sec.id);
      S.plans.forEach(pl => { pl.items = pl.items.filter(x => !gone.has(x)); });
      save();
      location.hash = '#/';
      toast(tr('انحذف القسم.', 'Section deleted.'));
    } else if (act === 'unhide') {
      S.hidden = S.hidden.filter(h => h !== a.dataset.id);
      save();
      viewSettings();
      toast(tr('رجع الجهاز لقسمه.', 'The machine is back in its section.'));
    }
  });

  window.addEventListener('hashchange', route);
  window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); applyLang(); route(); } });
  applyLang();
  route();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
