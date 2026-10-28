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
