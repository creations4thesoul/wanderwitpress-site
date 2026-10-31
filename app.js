// Wanderwit Press: small, dependency-free interactions.

// sticky header border
const header = document.querySelector('.site-header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

// mobile menu
const menuBtn = document.querySelector('.menu-btn');
const links = document.getElementById('nav-links');
menuBtn.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }
});

// shop: category tabs + search + sort, showing PAGE cards at a time
const PAGE = 24;
const tabs = document.querySelectorAll('.tab');
const grid = document.getElementById('shop-grid');
const products = [...grid.querySelectorAll('.product')];
const featured = products.slice();  // build order: bundles first
const search = document.getElementById('shop-search');
const sort = document.getElementById('shop-sort');
const more = document.getElementById('shop-more');
const count = document.getElementById('shop-count');
const empty = document.getElementById('shop-empty');
const shop = { filter: 'all', query: '', shown: PAGE };

function sorted() {
  const price = (p) => parseFloat(p.dataset.price);
  const by = {
    featured: () => featured,
    newest: () => products.slice().sort((a, b) => b.dataset.n - a.dataset.n),
    low: () => products.slice().sort((a, b) => price(a) - price(b)),
    high: () => products.slice().sort((a, b) => price(b) - price(a)),
  };
  return by[sort.value]();
}

function render() {
  const words = shop.query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = sorted().filter((p) => (shop.filter === 'all' || p.dataset.collection === shop.filter)
    && words.every((w) => p.dataset.words.includes(w)));
  const visible = new Set(matches.slice(0, shop.shown));
  sorted().forEach((p) => { grid.appendChild(p); p.hidden = !visible.has(p); });
  const left = matches.length - visible.size;
  more.hidden = left <= 0;
  more.textContent = `show more (${left} left)`;
  count.textContent = `${matches.length} item${matches.length === 1 ? '' : 's'}`;
  empty.hidden = matches.length > 0;
}

function applyFilter(name) {
  shop.filter = name;
  shop.shown = PAGE;
  tabs.forEach((t) => t.setAttribute('aria-pressed', t.dataset.filter === name));
  render();
}
tabs.forEach((t) => t.addEventListener('click', () => applyFilter(t.dataset.filter)));
document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', () => applyFilter(a.dataset.go)));
search.addEventListener('input', () => { shop.query = search.value; shop.shown = PAGE; render(); });
sort.addEventListener('change', () => { shop.shown = PAGE; render(); });
more.addEventListener('click', () => { shop.shown += PAGE; render(); });
document.getElementById('shop-reset').addEventListener('click', () => { search.value = ''; shop.query = ''; applyFilter('all'); });
render();

// "find your era" quiz: two answers pick one product
const ERAS = window.WANDERWIT_ERAS || {};
const answers = {};
const result = document.querySelector('.result');
const waiting = document.querySelector('.waiting');
function pickEra() {
  const who = answers.who, vibe = answers.vibe;
  if (!who) return null;
  if (who === 'kids') return 'road-trip-kit';
  if (who === 'grandma') return 'memory-lane';
  if (who === 'gift') return 'personalized';
  if (!vibe) return null;
  return { road: 'parks-map', cozy: 'mandala', goals: 'manifest-369', wild: 'parks-journal' }[vibe];
}
document.querySelectorAll('.opt').forEach((btn) => btn.addEventListener('click', () => {
  const q = btn.dataset.q;
  answers[q] = btn.dataset.a;
  document.querySelectorAll(`.opt[data-q="${q}"]`).forEach((b) => b.setAttribute('aria-pressed', b === btn));
  const id = pickEra();
  if (!id || !ERAS[id]) return;
  const era = ERAS[id];
  result.querySelector('img').src = era.img;
  result.querySelector('.era-name').textContent = era.era;
  result.querySelector('h4').textContent = era.title;
  result.querySelector('p').textContent = era.why;
  result.querySelector('a').href = era.url;
  result.classList.remove('show'); void result.offsetWidth; result.classList.add('show');
  waiting.hidden = true;
}));

// reveal on scroll
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// email signup (Kit): submit in place, fall back to a normal post
const signup = document.getElementById('signup');
if (signup) signup.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const msg = signup.querySelector('.signup-msg');
  const btn = signup.querySelector('button');
  btn.disabled = true; msg.textContent = 'sending...';
  try {
    const res = await fetch(signup.action, { method: 'POST', body: new FormData(signup), headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 'failed') throw new Error(data.errors ? data.errors.messages.join(' ') : 'failed');
    if (data.status === 'quarantined' && data.url) { window.location.href = data.url; return; } // Kit's bot check
    signup.classList.add('done');
    msg.textContent = "you're in! check your inbox and tap confirm to get your freebies.";
  } catch (err) {
    btn.disabled = false;
    msg.textContent = 'that didn’t go through. check the email address and try again.';
  }
});

// holiday countdown: shows the phase running now (visitor's local time); phases live in build_site.COUNTDOWN
const cd = document.querySelector('.countdown');
if (cd) {
  const phases = JSON.parse(cd.dataset.phases).map((p) => ({ ...p, s: p.start ? new Date(p.start).getTime() : 0, t: new Date(p.end).getTime() }));
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const now = Date.now();
    const p = phases.find((x) => x.s <= now && x.t > now);
    if (!p) { cd.hidden = true; return; }
    const s = Math.floor((p.t - now) / 1000), d = Math.floor(s / 86400);
    cd.querySelector('.cd-msg').textContent = p.msg;
    cd.querySelector('.cd-time').textContent = (d ? `${d}d ` : '') + `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    const a = cd.querySelector('.cd-link'); a.textContent = p.link; a.href = p.href;
    cd.hidden = false;
  };
  tick(); setInterval(tick, 1000);
}

// spooky sound previews: one plays at a time
let playing = null;
document.querySelectorAll('.sound').forEach((b) => b.addEventListener('click', () => {
  if (playing) { playing.audio.pause(); playing.btn.setAttribute('aria-pressed', 'false'); }
  if (playing && playing.btn === b) { playing = null; return; }
  const audio = new Audio(b.dataset.src);
  audio.addEventListener('ended', () => { b.setAttribute('aria-pressed', 'false'); playing = null; });
  audio.play(); b.setAttribute('aria-pressed', 'true'); playing = { audio, btn: b };
}));
