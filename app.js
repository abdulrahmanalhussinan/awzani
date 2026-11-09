/* أوزاني — تسجيل أوزان النادي بدون اشتراك. كل البيانات في localStorage على جهاز المستخدم. */
(() => {
  'use strict';

  const D = window.AWZ_DATA;
  const KEY = 'awzani.v1';
  const LB = 0.45359237;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');

  /* ---------- أدوات صغيرة ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const round2 = n => Math.round(n * 100) / 100;
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const fmt = n => nf.format(round2(+n || 0));
  const fmtIn = n => String(round2(+n || 0));
  const unitName = u => (u === 'lb' ? 'رطل' : 'كجم');
  const conv = (w, from, to) => (from === to ? w : to === 'kg' ? w * LB : w / LB);
  const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30));
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
  const W = {
    set: ['جلسة وحدة', 'جلستين', 'جلسات', 'جلسة'],
    rep: ['عدة وحدة', 'عدتين', 'عدات', 'عدة'],
    mc: ['جهاز واحد', 'جهازين', 'أجهزة', 'جهاز'],
    min: ['دقيقة وحدة', 'دقيقتين', 'دقائق', 'دقيقة'],
    sec: ['ثانية وحدة', 'ثانيتين', 'ثواني', 'ثانية'],
    day: ['يوم واحد', 'يومين', 'أيام', 'يوم'],
    log: ['تسجيل واحد', 'تسجيلين', 'تسجيلات', 'تسجيل'],
    ex: ['تمرين واحد', 'تمرينين', 'تمارين', 'تمرين']
  };
  // الكلمة بدون الرقم: 1 تمرين، 2 تمرينين، 3-10 تمارين، 11+ تمرين
  const exWord = n => (n === 2 ? 'تمرينين' : n >= 3 && n <= 10 ? 'تمارين' : 'تمرين');
  function plural(n, f) {
    n = round2(+n || 0);
    if (n === 1) return f[0];
    if (n === 2) return f[1];
    if (n >= 3 && n <= 10 && Number.isInteger(n)) return `${n} ${f[2]}`;
    return `${fmt(n)} ${f[3]}`;
  }

  // رقم بخط الساعة + الكلمة بالخط العادي (1 و2 تبقى كلمات)
  function numWord(n, f) {
    const t = plural(n, f);
    const m = t.match(/^([\d,.]+) (.+)$/);
    return m ? `<b class="nw">${m[1]}</b> ${m[2]}` : t;
  }

  /* ---------- التواريخ ---------- */
  const LOC = 'ar-SA-u-ca-gregory-nu-latn';
  const dfDay = new Intl.DateTimeFormat(LOC, { weekday: 'long', day: 'numeric', month: 'long' });
  const dfDate = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'long', year: 'numeric' });
  const dfWeek = new Intl.DateTimeFormat(LOC, { weekday: 'long' });
  const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const daysAgo = t => Math.round((startOfDay(Date.now()) - startOfDay(t)) / 864e5);
  const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function rel(t) {
    const n = daysAgo(t);
    if (n <= 0) return 'اليوم';
    if (n === 1) return 'أمس';
    if (n === 2) return 'قبل يومين';
    if (n <= 10) return `قبل ${n} أيام`;
    if (n <= 30) return `قبل ${n} يوم`;
    return dfDate.format(new Date(t));
  }

  /* ---------- التخزين ---------- */
  const COLORS = ['red', 'blue', 'yellow', 'green', 'white', 'silver', 'black', 'steel'];
  const KINDS = ['w', 'bw', 't', 'c'];
  const okId = id => typeof id === 'string' && /^[\w-]{1,48}$/.test(id);
  const okStr = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;

  function blank() {
    return { v: 1, name: '', body: [], logs: [], custom: { sections: [], machines: [] }, hidden: [], prefs: { unit: 'kg', mu: {}, step: {} } };
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
    if (okStr(o.name, 40)) b.name = o.name.trim().slice(0, 24);
    if (Array.isArray(o.body)) {
      o.body.forEach(x => {
        if (x && isFinite(+x.t) && +x.w > 0 && +x.w < 700) b.body.push({ t: +x.t, w: round2(+x.w), u: x.u === 'lb' ? 'lb' : 'kg' });
      });
      b.body.sort((a, z) => a.t - z.t);
    }
    if (o.prefs) {
      b.prefs.unit = o.prefs.unit === 'lb' ? 'lb' : 'kg';
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
      toast('ما قدرت أحفظ في الجوال. تأكد إنك مو فاتح الموقع بالتصفح الخفي.');
      return false;
    }
  }

  /* ---------- الأجهزة ---------- */
  const EQ = {
    bar: { lbl: 'الوزن مع البار', step: 2.5, def: 20 },
    sm: { lbl: 'الوزن مع البار', step: 2.5, def: 20 },
    ez: { lbl: 'الوزن مع البار', step: 2.5, def: 10 },
    db: { lbl: 'وزن الدمبل الواحد', step: 2.5, def: 10 },
    mc: { lbl: 'الوزن على الجهاز', step: 5, def: 20 },
    cb: { lbl: 'الوزن على الكيبل', step: 2.5, def: 10 },
    pl: { lbl: 'الأقراص المركّبة', step: 5, def: 40 }
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

  let S = load();
  const sections = () => D.sections.concat(S.custom.sections);
  const machines = () => D.machines.concat(S.custom.machines);
  const secById = id => sections().find(s => s.id === id);
  const mById = id => machines().find(m => m.id === id);
  const secColor = id => (secById(id) || {}).color || 'steel';
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
      if (l.km) p.push(`${fmt(l.km)} كم`);
      if (l.lv) p.push(`${l.lvl || 'المستوى'} ${fmt(l.lv)}`);
      if (l.cal) p.push(`${fmt(l.cal)} سعرة`);
      return p.join('، ');
    }
    if (l.k === 't') {
      return sameSets(l.sets)
        ? `${plural(l.sets[0].s, W.sec)} × ${plural(l.sets.length, W.set)}`
        : l.sets.map(s => `${fmt(s.s)} ث`).join('، ');
    }
    const U = unitName(l.u);
    if (sameSets(l.sets)) {
      const s = l.sets[0];
      const head = +s.w > 0 ? `${fmt(s.w)} ${U} × ` : (l.k === 'bw' ? '' : `0 ${U} × `);
      return `${head}${plural(s.r, W.rep)} × ${plural(l.sets.length, W.set)}`;
    }
    if (l.k === 'bw' && l.sets.every(s => !(+s.w))) return l.sets.map(s => fmt(s.r)).join('، ') + ' عدة';
    return l.sets.map(s => `${fmt(s.w)} ${U} × ${fmt(s.r)}`).join('، ');
  }

  /* الاقتراح: زيادة تدريجية (8 إلى 12 عدة) */
  function suggest(m, last) {
    const u = unitOf(m, last);
    const U = unitName(u);
    const st = stepOf(m, u);
    if (m.k === 'c') {
      if (!last) return { min: 20, text: 'سجّل مدة الكارديو بالدقائق، والمسافة والمستوى إذا تطلع لك على شاشة الجهاز.' };
      return { min: (last.min || 0) + 2, lv: last.lv, text: `آخر مرة ${plural(last.min, W.min)}. زِد دقيقتين اليوم، أو ارفع ${m.lv || 'الشدة'} درجة.` };
    }
    if (m.k === 't') {
      if (!last) return { s: 30, n: 3, text: 'ابدأ بـ 30 ثانية لكل جلسة، وزِد 5 أو 10 ثواني لما تحسها سهلة.' };
      const s = Math.max(...last.sets.map(x => +x.s || 0));
      return { s: s + 10, n: last.sets.length, text: `آخر مرة أطول ثبات ${plural(s, W.sec)}. جرّب ${s + 10} ثانية اليوم.` };
    }
    if (m.k === 'bw') {
      if (!last) return { w: 0, r: 10, n: 3, text: 'سجّل عداتك وجلساتك. وإذا حطيت وزن إضافي (حزام أو دمبل) اكتبه تحت.' };
      const minR = Math.min(...last.sets.map(x => x.r));
      const n = last.sets.length;
      const w = Math.max(...last.sets.map(x => +x.w || 0));
      if (minR >= 15) return { w, r: minR, n: Math.min(n + 1, 6), text: `كملت ${plural(minR, W.rep)} وفوق بكل جلسة. زِد جلسة، أو حط وزن إضافي بسيط.` };
      return { w, r: minR + 1, n, text: `حاول توصل ${plural(minR + 1, W.rep)} بكل جلسة اليوم.` };
    }
    if (!last) {
      return { w: defW(m, u), r: 12, n: 3, text: 'أول مرة تسجل هالجهاز. اختر وزن تقدر تسوي فيه 12 عدة بشكل نظيف، والمرة الجاية أقترح عليك متى تزيد.' };
    }
    const lu = last.u || 'kg';
    const top = Math.max(...last.sets.map(x => +x.w || 0));
    const minR = Math.min(...last.sets.filter(x => (+x.w || 0) === top).map(x => x.r));
    const n = last.sets.length;
    const LU = unitName(lu);
    const lst = stepOf(m, lu);
    if (minR >= 12) return { w: round2(top + lst), r: 8, n, text: `آخر مرة كملت ${plural(minR, W.rep)} بكل جلسة على ${fmt(top)} ${LU}. جرّب ${fmt(top + lst)} ${LU} اليوم، ولو وصلت 8 عدات فأنت ماشي صح.` };
    if (minR < 6) return { w: top, r: minR + 1, n, text: `آخر مرة كان الوزن ثقيل عليك (${plural(minR, W.rep)}). خلك على ${fmt(top)} ${LU} وحاول توصل ${minR + 1}، أو نزّل إلى ${fmt(Math.max(0, top - lst))}.` };
    void st; void U;
    return { w: top, r: minR + 1, n, text: `خلك على ${fmt(top)} ${LU} وحاول توصل ${plural(minR + 1, W.rep)} بكل جلسة. أول ما توصل 12 بكل الجلسات زِد الوزن.` };
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
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>')
  };

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
  let curSec = null, curM = null;
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
    const sheet = $('#sheet');
    if (sheet && sheet.open) sheet.close();
    window.scrollTo(0, 0);
    document.body.classList.toggle('is-start', !S.name);
    if (!S.name) return viewStart();
    if (v === 's' && secById(id)) { setNav('home'); return viewSection(id); }
    if (v === 'm' && mById(id)) { setNav('home'); return viewMachine(id); }
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
  function viewStart() {
    app.innerHTML = `
      <section class="start">
        <div class="start-board">
          <h1 class="mark led">أوزاني</h1>
          <p>حسبة أوزانك في النادي، بدون اشتراك</p>
        </div>
        <form id="startForm" class="start-form" novalidate>
          <label class="fld"><span>وش اسمك؟</span>
            <input type="text" name="name" maxlength="24" placeholder="اكتب اسمك" autocomplete="given-name" enterkeyhint="go" required>
          </label>
          <button class="go" type="submit"><span>ابدأ</span></button>
          <p class="start-note">اسمك وتمارينك تنحفظ في جوالك بس.</p>
        </form>
        <label class="text-btn start-restore">عندك نسخة احتياطية من جوال ثاني؟ رجّعها<input type="file" id="imp" accept=".json,application/json" hidden></label>
      </section>`;
    $('#imp').addEventListener('change', importData);
    const f = $('#startForm');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const n = String(new FormData(f).get('name') || '').trim();
      if (!n) { toast('اكتب اسمك عشان نبدأ.'); $('input', f).focus(); return; }
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
      <h2>وزن جسمك اليوم</h2>
      <div class="bw-row">
        <button type="button" class="stp sm" data-bw="0.5" aria-label="زِد نص">${I.plus}</button>
        <input class="cnt-v" id="bwIn" name="w" type="text" inputmode="decimal" autocomplete="off" value="${fmtIn(w)}" aria-label="وزن الجسم">
        <button type="button" class="stp sm" data-bw="-0.5" aria-label="أنقص نص">${I.minus}</button>
      </div>
      <div class="seg light bw-seg" role="group" aria-label="الوحدة">
        <button type="button" data-bu="kg" aria-pressed="${u === 'kg'}">كيلو</button>
        <button type="button" data-bu="lb" aria-pressed="${u === 'lb'}">رطل</button>
      </div>
      ${recent.length ? `<h3 class="bw-h">آخر القياسات</h3><ul class="plain bw-list">${recent.map((x, i) => {
        const prev = recent[i + 1];
        const d = prev && prev.u === x.u ? round2(x.w - prev.w) : 0;
        return `<li><span>${dfDay.format(new Date(x.t))}</span><span><b class="nw">${fmt(x.w)}</b> ${unitName(x.u)}${d ? ` <em class="delta">${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}</em>` : ''}</span></li>`;
      }).join('')}</ul>` : ''}`, fd => {
      const v = num(fd.get('w'));
      if (!(v > 20 && v < 700)) { toast('اكتب وزنك صح.'); return false; }
      const t0 = startOfDay(Date.now());
      S.body = S.body.filter(x => x.t < t0);
      S.body.push({ t: Date.now(), w: round2(v), u });
      if (!save()) return false;
      toast(`انحفظ وزنك: ${fmt(v)} ${unitName(u)}.`);
      route();
    }, 'احفظ');
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
      <span class="pl-name">${esc(sec.name)}</span>
      <span class="pl-count">${ms.length ? numWord(ms.length, W.mc) : 'فاضي'}</span>
    </a>`;
  }
  function mRow(m) {
    const l = lastLog(m.id);
    return `<a class="mrow" href="#/m/${esc(m.id)}">
      ${thumb(m)}
      <span class="mrow-t">
        <b>${esc(m.n)}</b>
        ${m.e ? `<small><bdi dir="ltr">${esc(m.e)}</bdi></small>` : ''}
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
      `<div><span class="led">${fmt(t.sets)}</span><span>مجموع الجلسات</span></div>`,
      `<div><span class="led">${fmt(t.reps)}</span><span>مجموع العدات</span></div>`
    ];
    if (t.min) cells.push(`<div><span class="led">${fmt(t.min)}</span><span>دقائق الكارديو</span></div>`);
    cells.push(`<button type="button" class="bw-cell" data-act="body" aria-label="وزن الجسم، اضغط وسجّله">
      <span class="led${bw ? '' : ' dim'}">${bw ? fmt(bw.w) : '—'}</span>
      <span>وزن الجسم${bw ? ` (${unitName(bw.u)})` : ''}<em>${bw ? (bwToday ? 'اليوم' : rel(bw.t)) : 'اضغط وسجّله'}</em></span>
    </button>`);
    app.innerHTML = `
      <header class="top today-head">
        <p class="brand">أوزاني</p>
        <p class="hello">هلا ${esc(S.name)}</p>
        <h1 class="day">${dfWeek.format(now)}</h1>
        <p class="date">${dfDate.format(now)}</p>
      </header>
      <section class="board" aria-label="تمرين اليوم">
        <div class="board-top"><span>تمارين خلصتها اليوم</span></div>
        <div class="board-main"><span class="led led-xl" id="bigEx" data-v="${t.ex}">${t.ex}</span><span class="board-u">${t.ex ? exWord(t.ex) : 'ما بديت للحين'}</span></div>
        <div class="board-cells" style="--n:${cells.length}">${cells.join('')}</div>
      </section>
      <label class="search">${I.search}<input id="q" type="search" placeholder="ابحث عن جهاز، مثل: تشيست برس" autocomplete="off" enterkeyhint="search" aria-label="ابحث عن جهاز"></label>
      <div id="results" class="mlist" hidden></div>
      <div id="homeBody">
        ${recent.length ? `<section><h2 class="h2">رجعت لها مؤخرًا</h2><div class="chips">${recent.map(m => `<a class="chip" href="#/m/${esc(m.id)}"><span class="dot c-${esc(secColor(m.s))}" aria-hidden="true"></span>${esc(m.n)}</a>`).join('')}</div></section>` : ''}
        <section>
          <h2 class="h2">الأقسام</h2>
          <div class="plates">
            ${sections().map(plateTile).join('')}
            <button class="plate plate-add" type="button" data-act="add-sec">${I.plus}<span>قسم جديد</span></button>
          </div>
        </section>
      </div>`;

    const q = $('#q');
    q.addEventListener('input', () => {
      const v = norm(q.value);
      const res = $('#results'), body = $('#homeBody');
      if (!v) { res.hidden = true; body.hidden = false; return; }
      const hits = machines().filter(m => norm(m.n).includes(v) || (m.e && m.e.toLowerCase().includes(v)));
      res.innerHTML = hits.length ? hits.map(mRow).join('') : '<p class="empty">ما لقيت جهاز بهالاسم. تقدر تضيفه من داخل القسم حقه.</p>';
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
      <a class="back" href="#/">${I.back}الأقسام</a>
      <header class="shead">
        <span class="mini-plate c-${esc(sec.color)}" aria-hidden="true"></span>
        <div><h1>${esc(sec.name)}</h1><p>${plural(ms.length, W.mc)}</p></div>
      </header>
      ${used.length ? `<h2 class="h2">استخدمتها</h2><div class="mlist">${used.map(mRow).join('')}</div>` : ''}
      ${rest.length ? `<h2 class="h2">${used.length ? 'باقي الأجهزة' : 'اختر الجهاز'}</h2><div class="mlist">${rest.map(mRow).join('')}</div>` : ''}
      ${!ms.length ? '<p class="empty">القسم فاضي. أضف أول جهاز فيه.</p>' : ''}
      <button class="add-row" type="button" data-act="add-m">${I.plus}<span>جهازك مو موجود؟ أضفه</span></button>
      ${sec.custom ? '<div class="foot"><button class="text-btn danger" type="button" data-act="del-sec">احذف القسم</button></div>' : ''}`;
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
    return `<button type="button" class="stp ${cls || ''}" data-f="${f}" data-d="1" aria-label="زِد ${esc(label)}">${I.plus}</button>`;
  }
  function stepperDown(f, label, cls) {
    return `<button type="button" class="stp ${cls || ''}" data-f="${f}" data-d="-1" aria-label="أنقص ${esc(label)}">${I.minus}</button>`;
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
    return `<div class="seg" role="group" aria-label="الوحدة">
      <button type="button" data-u="kg" aria-pressed="${F.u === 'kg'}">كجم</button>
      <button type="button" data-u="lb" aria-pressed="${F.u === 'lb'}">رطل</button>
    </div>`;
  }
  function stepsHTML(m) {
    const cur = stepOf(m, F.u);
    return `<span>كل ضغطة</span>${STEPS[F.u].map(v => `<button type="button" data-step="${v}" aria-pressed="${v === cur}">${fmt(v)}</button>`).join('')}<span>${unitName(F.u)}</span>`;
  }

  function weightForm(m) {
    const lbl = m.l || (EQ[m.eq] || EQ.mc).lbl;
    return `
      <div class="led-box">
        <div class="led-top"><span>${esc(lbl)}</span>${unitSeg()}</div>
        ${ledRow('w', lbl)}
        <div class="steps simple" id="steps">${stepsHTML(m)}</div>
        <div class="calc" id="calc" aria-live="polite"></div>
      </div>
      ${m.eq === 'bar' ? '<div class="pside simple" id="pside"></div>' : ''}
      <div class="duo simple">${counter('r', 'العدات')}${counter('n', 'الجلسات')}</div>
      <div class="detail" id="detail" hidden></div>
      <button type="button" class="text-btn" id="detailT">الجلسات مختلفة عن بعض؟ فصّل كل جلسة</button>
      <button type="button" class="go" id="save">${I.check}<span>سجّل</span></button>`;
  }
  function bwForm() {
    return `
      <div class="led-box">
        <div class="led-top"><span>العدات بكل جلسة</span></div>
        ${ledRow('r', 'العدات', 'numeric')}
        <div class="calc" id="calc" aria-live="polite"></div>
      </div>
      <div class="duo simple">${counter('n', 'الجلسات')}${counter('w', `وزن إضافي (${unitName(F.u)})`, 'decimal')}</div>
      <div class="detail" id="detail" hidden></div>
      <button type="button" class="text-btn" id="detailT">الجلسات مختلفة عن بعض؟ فصّل كل جلسة</button>
      <button type="button" class="go" id="save">${I.check}<span>سجّل</span></button>`;
  }
  function timedForm() {
    return `
      <div class="led-box">
        <div class="led-top"><span>الثواني بكل جلسة</span></div>
        ${ledRow('s', 'الثواني', 'numeric')}
        <div class="calc" id="calc" aria-live="polite"></div>
      </div>
      <div class="duo one">${counter('n', 'الجلسات')}</div>
      <button type="button" class="go" id="save">${I.check}<span>سجّل</span></button>`;
  }
  function cardioForm(m) {
    const opt = (id, label, mode) => `<label class="fld"><span>${esc(label)}</span><input id="${id}" type="text" inputmode="${mode}" autocomplete="off" placeholder="اختياري" value="${F[id] ? fmtIn(F[id]) : ''}"></label>`;
    return `
      <div class="led-box">
        <div class="led-top"><span>المدة بالدقائق</span></div>
        ${ledRow('min', 'الدقائق', 'numeric')}
      </div>
      <div class="trio">
        ${opt('km', 'المسافة (كم)', 'decimal')}
        ${m.lv ? opt('lv', m.lv, 'decimal') : ''}
        ${opt('cal', 'السعرات', 'numeric')}
      </div>
      <button type="button" class="go" id="save">${I.check}<span>سجّل</span></button>`;
  }

  function viewMachine(id) {
    curM = id;
    const m = mById(id);
    const sec = secById(m.s);
    const last = lastLog(id);
    const sug = suggest(m, last);
    initForm(m, last, sug);
    const today = last && daysAgo(last.t) === 0;
    const tipText = today ? 'سجلت هالجهاز اليوم. لو بتسجل جولة ثانية عدّل الأرقام واضغط سجّل.' : sug.text;
    app.innerHTML = `
      <a class="back" href="${sec ? '#/s/' + esc(sec.id) : '#/'}">${I.back}${esc(sec ? sec.name : 'الأقسام')}</a>
      <header class="mhead${hasPhoto(m) ? ' has-photo' : ''}">
        <div class="mhead-t">
          <h1>${esc(m.n)}</h1>
          ${m.e ? `<p class="en"><bdi dir="ltr">${esc(m.e)}</bdi></p>` : ''}
        </div>
        ${hasPhoto(m) ? `<button type="button" class="mphoto" data-act="photo" aria-label="كبّر صورة ${esc(m.n)}">${frames(m, 'صورة ' + m.n)}</button>` : ''}
      </header>
      <div class="tip">
        ${last ? `<p class="tip-last"><span>آخر مرة، ${rel(last.t)}</span><b>${esc(summary(last))}</b></p>` : ''}
        <p class="tip-sug"><span class="spark" aria-hidden="true"></span>${esc(tipText)}</p>
      </div>
      <section class="rig" id="rig">${m.k === 'c' ? cardioForm(m) : m.k === 't' ? timedForm() : m.k === 'bw' ? bwForm() : weightForm(m)}</section>
      <section class="hist" id="hist"></section>
      <div class="foot">${m.custom
        ? '<button class="text-btn danger" type="button" data-act="del-m">احذف الجهاز</button>'
        : '<button class="text-btn" type="button" data-act="hide-m">ما أستخدمه؟ أخفه من القائمة</button>'}</div>`;
    bindForm(m);
    if (F.detail) applyDetail(m);
    updAll(m);
    renderHist(m);
  }

  function cell(v, label, cls) {
    return `<div class="calc-cell ${cls || ''}"><b class="led">${v}</b><span>${esc(label)}</span></div>`;
  }
  const OP_X = '<i aria-hidden="true">×</i>', OP_EQ = '<i aria-hidden="true">=</i>';
  function updCalc() {
    const el = $('#calc');
    if (!el) return;
    const U = unitName(F.u);
    if (F.k === 't') {
      const tot = (F.s || 0) * (F.n || 0);
      const mm = Math.floor(tot / 60), ss = Math.round(tot % 60);
      el.innerHTML = cell(fmt(F.s), 'ثانية') + OP_X + cell(fmt(F.n), 'جلسات') + OP_EQ + cell(`${mm}:${String(ss).padStart(2, '0')}`, 'دقيقة مجموع', 'sum');
      el.setAttribute('aria-label', `المجموع ${mm} دقيقة و ${ss} ثانية`);
      return;
    }
    const sets = currentSets();
    const reps = sets.reduce((a, s) => a + s.r, 0);
    const vol = sets.reduce((a, s) => a + s.w * s.r, 0);
    if (F.detail) {
      el.innerHTML = cell(sets.length, 'جلسات') + '<i class="gap" aria-hidden="true"></i>' + cell(reps, 'عدة') + OP_EQ + cell(fmt(vol), `${U} المجموع`, 'sum');
    } else if (F.k === 'bw' && !(+F.w)) {
      el.innerHTML = cell(fmt(F.r), 'عدات') + OP_X + cell(fmt(F.n), 'جلسات') + OP_EQ + cell(fmt(reps), 'عدة مجموع', 'sum');
    } else if (F.k === 'bw') {
      el.innerHTML = cell(fmt(F.r), 'عدات') + OP_X + cell(fmt(F.n), 'جلسات') + OP_X + cell(fmt(F.w), U) + OP_EQ + cell(fmt(vol), `${U} المجموع`, 'sum');
    } else {
      el.innerHTML = cell(fmt(F.w), U) + OP_X + cell(fmt(F.r), 'عدات') + OP_X + cell(fmt(F.n), 'جلسات') + OP_EQ + cell(fmt(vol), `${U} المجموع`, 'sum');
    }
  }
  function updPlates() {
    const el = $('#pside');
    if (!el || F.detail) return;
    const U = unitName(F.u);
    const r = platesFor(+F.w || 0, F.u);
    if (r.under) { el.innerHTML = `<p>الوزن أقل من البار نفسه (${r.bar} ${U}).</p>`; return; }
    if (!r.out.length && !r.rem) { el.innerHTML = `<p>البار لحاله بدون أقراص (${r.bar} ${U}).</p>`; return; }
    el.innerHTML = `<p>حط في كل جهة من البار (البار ${r.bar} ${U}):</p>
      <div class="sleeve" aria-label="الأقراص في كل جهة: ${r.out.map(fmt).join(' + ')}">
        <span class="collar" aria-hidden="true"></span>
        ${r.out.map(p => `<span class="pchip c-${PCOL[F.u][p]}" style="height:${PH[F.u][p]}px">${fmt(p)}</span>`).join('')}
      </div>
      ${r.rem ? `<p class="warn">ما يتركب بالضبط بالأقراص المعتادة، يبقى ${fmt(r.rem * 2)} ${U}.</p>` : ''}`;
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
        <span class="drow-n">جلسة ${i + 1}</span>
        <label><input type="text" inputmode="decimal" data-k="w" value="${fmtIn(s.w)}" aria-label="${isBw ? 'الوزن الإضافي' : 'الوزن'} في الجلسة ${i + 1}"><small>${U}</small></label>
        <span class="x" aria-hidden="true">×</span>
        <label><input type="text" inputmode="numeric" data-k="r" value="${fmtIn(s.r)}" aria-label="العدات في الجلسة ${i + 1}"><small>عدة</small></label>
        <button type="button" class="drow-del" data-del="${i}" aria-label="احذف الجلسة ${i + 1}" ${F.sets.length < 2 ? 'disabled' : ''}>${I.x}</button>
      </div>`).join('') + `<button type="button" class="add-set" id="addSet">${I.plus}<span>أضف جلسة</span></button>`;
  }
  function applyDetail() {
    $$('#rig .simple').forEach(x => { x.hidden = F.detail; });
    const t = $('#detailT');
    if (t) t.textContent = F.detail ? 'رجّع للطريقة السريعة (كل الجلسات نفس الشي)' : 'الجلسات مختلفة عن بعض؟ فصّل كل جلسة';
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
      if (!(min > 0)) { toast('اكتب كم دقيقة لعبت.'); return; }
      log.min = min;
      if (num(F.km)) log.km = num(F.km);
      if (num(F.lv)) { log.lv = num(F.lv); log.lvl = m.lv || 'المستوى'; }
      if (num(F.cal)) log.cal = num(F.cal);
    } else {
      const sets = currentSets();
      if (!sets.length) { toast('أضف جلسة وحدة على الأقل.'); return; }
      if (m.k === 't') {
        if (sets.some(s => !(s.s > 0))) { toast('اكتب كم ثانية بكل جلسة.'); return; }
      } else if (sets.some(s => !(s.r > 0))) { toast('فيه جلسة عداتها صفر. عدّلها أو احذفها.'); return; }
      log.sets = sets;
      if (m.k !== 't') { log.u = F.u; S.prefs.mu[m.id] = F.u; }
    }
    S.logs.push(log);
    if (!save()) { S.logs.pop(); return; }
    const v = volU(log);
    const tail = v > 0 ? ` رفعت ${fmt(v)} ${unitName(log.u)} على هالجهاز.` : '';
    viewMachine(m.id);
    toast(`تسجّل.${tail}`);
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
      <svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${esc(label)}: من ${fmt(vals[0])} إلى ${fmt(vals[li])}">
        <line class="base" x1="0" x2="${Wd}" y1="${H - 1}" y2="${H - 1}"/>
        <polyline points="${pts}"/>
        ${vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === li ? 5.5 : 3.5}"${i === li ? ' class="last"' : ''}/>`).join('')}
        <text x="${x(0).toFixed(1)}" y="${(y(vals[0]) - 11).toFixed(1)}" text-anchor="start">${fmt(vals[0])}</text>
        <text x="${x(li).toFixed(1)}" y="${(y(vals[li]) - 11).toFixed(1)}" text-anchor="end" class="hi">${fmt(vals[li])}</text>
      </svg>
      <div class="chart-x"><span>الأقدم</span><span>الأحدث</span></div>
    </figure>`;
  }

  function renderHist(m) {
    const el = $('#hist');
    if (!el) return;
    const ls = logsOf(m.id);
    let html = '<h2 class="h2">سجلك على هالجهاز</h2>';
    if (!ls.length) {
      el.innerHTML = html + '<p class="empty">أول تسجيل لك يطلع هنا، ومعه رسم يوضح تقدمك مع الوقت.</p>';
      return;
    }
    const chron = ls.slice().reverse();
    let stats = [], series = [], label = '';
    if (m.k === 'w') {
      const u = F.u, U = unitName(u);
      const cv = (l, s) => conv(+s.w || 0, l.u || 'kg', u);
      const best = Math.max(...ls.flatMap(l => l.sets.map(s => cv(l, s))));
      const orm = Math.max(0, ...ls.flatMap(l => l.sets.filter(s => s.r > 0 && s.r <= 12).map(s => e1rm(cv(l, s), s.r))));
      stats = [
        [fmt(best), `أعلى وزن (${U})`],
        [orm ? fmt(Math.round(orm * 2) / 2) : '—', `أقصى وزن لعدة وحدة، تقدير (${U})`],
        [ls.length, 'مرات التمرين']
      ];
      series = chron.map(l => Math.max(...l.sets.map(s => cv(l, s))));
      label = `أعلى وزن كل مرة (${U})`;
    } else if (m.k === 'bw') {
      stats = [
        [Math.max(...ls.flatMap(l => l.sets.map(s => s.r))), 'أعلى عدات بجلسة'],
        [ls[0].sets.reduce((a, s) => a + s.r, 0), 'مجموع عدات آخر مرة'],
        [ls.length, 'مرات التمرين']
      ];
      series = chron.map(l => l.sets.reduce((a, s) => a + s.r, 0));
      label = 'مجموع العدات كل مرة';
    } else if (m.k === 't') {
      stats = [
        [Math.max(...ls.flatMap(l => l.sets.map(s => s.s))), 'أطول ثبات (ثانية)'],
        [ls[0].sets.length, 'جلسات آخر مرة'],
        [ls.length, 'مرات التمرين']
      ];
      series = chron.map(l => Math.max(...l.sets.map(s => s.s)));
      label = 'أطول ثبات كل مرة (ثانية)';
    } else {
      const kms = ls.map(l => +l.km || 0);
      stats = [
        [fmt(ls.reduce((a, l) => a + (+l.min || 0), 0)), 'مجموع الدقائق'],
        [fmt(Math.max(...ls.map(l => +l.min || 0))), 'أطول مدة (دقيقة)'],
        [Math.max(...kms) ? fmt(Math.max(...kms)) : String(ls.length), Math.max(...kms) ? 'أبعد مسافة (كم)' : 'مرات التمرين']
      ];
      series = chron.map(l => +l.min || 0);
      label = 'الدقائق كل مرة';
    }
    html += `<div class="stats">${stats.map(([v, l]) => `<div class="stat"><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join('')}</div>`;
    if (series.length >= 2) html += chart(series.slice(-12), label);
    html += `<ul class="hlist">${ls.map(l => {
      const v = volU(l);
      return `<li>
        <div><b>${esc(summary(l))}</b><small>${dfDay.format(new Date(l.t))}${v ? `، المجموع ${fmt(v)} ${unitName(l.u)}` : ''}</small></div>
        <button type="button" class="del" data-act="del-log" data-id="${esc(l.id)}" aria-label="احذف تسجيل ${esc(dfDay.format(new Date(l.t)))}">${I.trash}</button>
      </li>`;
    }).join('')}</ul>`;
    el.innerHTML = html;
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
      <header class="top small"><h1 class="title">السجل</h1></header>
      <section class="board slim" aria-label="ملخص الأيام">
        <div class="board-cells">
          <div><span class="led">${daysWeek}</span><span>أيام تمرين هالأسبوع</span></div>
          <div><span class="led">${days30}</span><span>آخر 30 يوم</span></div>
          <div><span class="led">${ls.length}</span><span>كل التسجيلات</span></div>
        </div>
      </section>
      ${!ls.length ? '<p class="empty spaced">ما سجلت شي للحين. أول جهاز تسجله يطلع هنا مرتب حسب اليوم.</p>' : ''}
      ${groups.map(g => {
        const exN = new Set(g.items.map(l => l.m)).size;
        return `<section class="day">
          <h2 class="day-h"><span>${dfDay.format(new Date(g.t))}${daysAgo(g.t) <= 1 ? ` <em>${rel(g.t)}</em>` : ''}</span><span class="kg">${numWord(exN, W.ex)}</span></h2>
          <div class="mlist">${g.items.map(l => {
            const m = mById(l.m);
            const name = m ? m.n : (l.n || 'جهاز محذوف');
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
    app.innerHTML = `
      <header class="top small"><h1 class="title">الإعدادات</h1></header>
      <section class="card">
        <h2>اسمك</h2>
        <form class="name-row" id="nameForm" novalidate>
          <input type="text" name="name" maxlength="24" value="${esc(S.name)}" aria-label="اسمك" autocomplete="given-name">
          <button type="submit" class="btn">احفظ</button>
        </form>
      </section>
      <section class="card">
        <h2>وزن الجسم</h2>
        <p>${lastBody() ? `آخر قياس ${fmt(lastBody().w)} ${unitName(lastBody().u)}، ${rel(lastBody().t)}.` : 'ما سجلت وزنك للحين.'}</p>
        <button type="button" class="btn" data-act="body">سجّل وزنك اليوم</button>
      </section>
      <section class="card">
        <h2>الوحدة للأجهزة الجديدة</h2>
        <p>كل جهاز يحفظ وحدته لحاله، فتقدر تخلي جهاز بالرطل وجهاز بالكيلو.</p>
        <div class="seg light" role="group" aria-label="الوحدة الافتراضية">
          <button type="button" data-unit="kg" aria-pressed="${S.prefs.unit === 'kg'}">كيلو (كجم)</button>
          <button type="button" data-unit="lb" aria-pressed="${S.prefs.unit === 'lb'}">رطل (lb)</button>
        </div>
      </section>
      <section class="card">
        <h2>بياناتك</h2>
        <p>كل تسجيلاتك محفوظة في هالجوال بس، ما تطلع لأي مكان. نزّل نسخة احتياطية كل فترة، عشان لو غيرت جوالك أو انمسح المتصفح ترجعها.</p>
        <div class="btn-row">
          <button type="button" class="btn" id="exp">نزّل نسخة احتياطية</button>
          <label class="btn">استرجع من نسخة<input type="file" id="imp" accept=".json,application/json" hidden></label>
          <button type="button" class="btn" id="install" ${installEvt ? '' : 'hidden'}>ثبّت أوزاني على الجوال</button>
        </div>
        <p class="note">نصيحة للآيفون: افتح الموقع من سفاري، اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية». يصير مثل التطبيق، ويشتغل حتى لو النت ضعيف في النادي.</p>
      </section>
      ${hidden.length ? `<section class="card">
        <h2>الأجهزة المخفية</h2>
        <ul class="plain">${hidden.map(m => `<li><span>${esc(m.n)}<small>${esc((secById(m.s) || {}).name || '')}</small></span><button type="button" class="btn sm" data-act="unhide" data-id="${esc(m.id)}">رجّعه</button></li>`).join('')}</ul>
      </section>` : ''}
      <section class="card">
        <h2>عن أوزاني</h2>
        <p>${plural(D.machines.length, W.mc)} في ${plural(D.sections.length, ['قسم واحد', 'قسمين', 'أقسام', 'قسم'])}، وتقدر تضيف أجهزة وأقسام نادك. الاقتراح يمشي على قاعدة بسيطة: لما توصل 12 عدة بكل الجلسات زِد الوزن، وارجع لـ 8 عدات.</p>
        <p class="note">صور التمارين من مجموعة <bdi dir="ltr">free-exercise-db</bdi> المفتوحة، وهي ملكية عامة.</p>
        <button type="button" class="text-btn danger" id="wipe">امسح كل بياناتي</button>
      </section>`;

    $$('[data-unit]').forEach(b => b.addEventListener('click', () => {
      S.prefs.unit = b.dataset.unit;
      save();
      $$('[data-unit]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.unit === S.prefs.unit)));
      toast(`الأجهزة الجديدة صارت بال${S.prefs.unit === 'lb' ? 'رطل' : 'كيلو'}.`);
    }));
    $('#nameForm').addEventListener('submit', e => {
      e.preventDefault();
      const n = String(new FormData(e.target).get('name') || '').trim();
      if (!n) { toast('اكتب اسمك.'); return; }
      S.name = n.slice(0, 24);
      if (save()) toast(`تمام يا ${S.name}، انحفظ اسمك.`);
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
      if (!confirm('أكيد؟ بينمسح كل تسجيلاتك وأجهزتك المضافة من هالجوال، وما ترجع إلا من نسخة احتياطية.')) return;
      S = blank();
      save();
      toast('انمسحت كل البيانات.');
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
    toast('نزلت النسخة. احفظها في مكان آمن.');
  }
  function importData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      let inc;
      try { inc = normalize(JSON.parse(rd.result)); } catch (err) { toast('الملف هذا مو نسخة من أوزاني.'); return; }
      const ids = new Set(S.logs.map(l => l.id));
      let added = 0;
      inc.logs.forEach(l => { if (!ids.has(l.id)) { S.logs.push(l); added++; } });
      ['sections', 'machines'].forEach(k => {
        const have = new Set(S.custom[k].map(x => x.id));
        inc.custom[k].forEach(x => { if (!have.has(x.id)) S.custom[k].push(x); });
      });
      inc.hidden.forEach(h => { if (!S.hidden.includes(h)) S.hidden.push(h); });
      if (!S.name && inc.name) S.name = inc.name;
      const haveB = new Set(S.body.map(x => dayKey(x.t)));
      inc.body.forEach(x => { if (!haveB.has(dayKey(x.t))) S.body.push(x); });
      S.body.sort((a, z) => a.t - z.t);
      Object.assign(S.prefs.mu, inc.prefs.mu);
      Object.assign(S.prefs.step, inc.prefs.step);
      if (save()) toast(added ? `رجعت ${plural(added, W.log)}.` : 'كل اللي في النسخة موجود عندك من قبل.');
      route();
    };
    rd.readAsText(file);
  }

  /* ---------- النوافذ (إضافة جهاز / قسم) ---------- */
  $('#sheet').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  function openSheet(inner, onOk, okLabel) {
    const d = $('#sheet');
    d.innerHTML = `<form class="sheet" novalidate>${inner}
      <div class="sheet-act"><button class="go" type="submit">${okLabel ? I.check : I.plus}<span>${okLabel || 'أضف'}</span></button><button class="ghost" type="button" data-close>إلغاء</button></div>
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
    d.innerHTML = `<div class="sheet viewer">
      <h2>${esc(m.n)}</h2>
      ${frames(m, 'صورة توضيحية لتمرين ' + m.n)}
      <p class="viewer-cap">الصورتين توضح بداية الحركة ونهايتها.</p>
      <button class="ghost wide" type="button" data-close>إغلاق</button>
    </div>`;
    $('[data-close]', d).addEventListener('click', () => d.close());
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  const KIND_OPTS = [
    ['w:mc', 'وزن على جهاز'], ['w:bar', 'بار وأقراص'], ['w:db', 'دمبل'], ['w:cb', 'كيبل'],
    ['w:pl', 'جهاز تركّب فيه أقراص'], ['bw', 'وزن الجسم'], ['t', 'وقت بالثواني'], ['c', 'كارديو بالدقائق']
  ];
  function addMachineSheet(secId) {
    const sec = secById(secId);
    const def = secId === 'cardio' ? 'c' : 'w:mc';
    openSheet(`
      <h2>أضف جهاز في ${esc(sec.name)}</h2>
      <label class="fld"><span>اسم الجهاز</span><input type="text" name="n" maxlength="40" placeholder="مثل: تشيست برس هامر سترنث" autocomplete="off"></label>
      <fieldset class="fld"><legend>وش تسجل فيه؟</legend>
        <div class="opts">${KIND_OPTS.map(([v, l]) => `<label class="opt"><input type="radio" name="k" value="${v}" ${v === def ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      </fieldset>`, fd => {
      const n = String(fd.get('n') || '').trim();
      if (!n) { toast('اكتب اسم الجهاز.'); return false; }
      const [k, eq] = String(fd.get('k') || 'w:mc').split(':');
      const m = { id: 'u-' + uid(), s: secId, n: n.slice(0, 40), e: '', k, custom: true };
      if (k === 'w') m.eq = eq || 'mc';
      if (k === 'c') m.lv = 'المستوى';
      S.custom.machines.push(m);
      if (!save()) return false;
      location.hash = '#/m/' + m.id;
      toast('انضاف الجهاز.');
    });
  }
  function addSectionSheet() {
    openSheet(`
      <h2>قسم جديد</h2>
      <label class="fld"><span>اسم القسم</span><input type="text" name="n" maxlength="24" placeholder="مثل: الإطالة، الجسم كامل، السباحة" autocomplete="off"></label>`, fd => {
      const n = String(fd.get('n') || '').trim();
      if (!n) { toast('اكتب اسم القسم.'); return false; }
      const s = { id: 'u-' + uid(), name: n.slice(0, 24), color: 'steel', custom: true };
      S.custom.sections.push(s);
      if (!save()) return false;
      location.hash = '#/s/' + s.id;
      toast('انضاف القسم. أضف أجهزته.');
    });
  }

  /* ---------- أزرار عامة ---------- */
  app.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'add-sec') addSectionSheet();
    else if (act === 'body') bodySheet();
    else if (act === 'photo') openPhoto(mById(curM));
    else if (act === 'add-m') addMachineSheet(curSec);
    else if (act === 'del-log') {
      if (!confirm('تحذف هالتسجيل؟')) return;
      S.logs = S.logs.filter(l => l.id !== a.dataset.id);
      save();
      const m = mById(curM);
      if (m) viewMachine(m.id); else route();
      toast('انحذف التسجيل.');
    } else if (act === 'hide-m') {
      const m = mById(curM);
      if (!S.hidden.includes(m.id)) S.hidden.push(m.id);
      save();
      location.hash = '#/s/' + m.s;
      toast('انخفى الجهاز. ترجعه من الإعدادات.');
    } else if (act === 'del-m') {
      const m = mById(curM);
      if (!confirm(`تحذف «${m.n}»؟ تسجيلاته القديمة تبقى في السجل.`)) return;
      S.custom.machines = S.custom.machines.filter(x => x.id !== m.id);
      save();
      location.hash = '#/s/' + m.s;
      toast('انحذف الجهاز.');
    } else if (act === 'del-sec') {
      const sec = secById(curSec);
      if (!confirm(`تحذف قسم «${sec.name}»؟ الأجهزة اللي أضفتها فيه تنحذف، وتسجيلاتها تبقى في السجل.`)) return;
      S.custom.sections = S.custom.sections.filter(x => x.id !== sec.id);
      S.custom.machines = S.custom.machines.filter(x => x.s !== sec.id);
      save();
      location.hash = '#/';
      toast('انحذف القسم.');
    } else if (act === 'unhide') {
      S.hidden = S.hidden.filter(h => h !== a.dataset.id);
      save();
      viewSettings();
      toast('رجع الجهاز لقسمه.');
    }
  });

  window.addEventListener('hashchange', route);
  window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); route(); } });
  route();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
