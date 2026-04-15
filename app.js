document.addEventListener('DOMContentLoaded', function() {
  products = DEMO;
  renderProducts(products);
});

const tg = window.Telegram.WebApp;
tg.expand();

function initApp() {
  products = DEMO;
  renderProducts(products);
}

// ── STATE ───────────────────────────────────────────
let products  = [];
let cart      = {};
let favorites = {};
let currentCat = 'all';
let prevPage   = 'home';

// ── DEMO MAHSULOTLAR (keyinroq backenddan olasiz) ──
const DEMO = [
  { id:1, name:"Klassik ko'ylak", desc:"Sifatli paxta, oq rang, ofis uslubi", price:120000, cat:"koylak", image:"https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Koylak" },
  { id:2, name:"Slim fit shim",   desc:"Zamonaviy kesim, qora rang", price:180000, cat:"shim",   image:"https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Shim" },
  { id:3, name:"Qishki kurtka",   desc:"Issiq, suv o'tkazmaydigan", price:450000, cat:"kurtka", image:"https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Kurtka" },
  { id:4, name:"Sport to'plam",   desc:"Trening uchun qulay, yengil", price:220000, cat:"sport",  image:"https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Sport" },
  { id:5, name:"Kamar",           desc:"Haqiqiy teri, bronza toqa", price:85000,  cat:"aksessuar", image:"https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Kamar" },
  { id:6, name:"Polo ko'ylak",    desc:"Yoz uchun, nafas oladigan mato", price:95000, cat:"koylak", image:"https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Polo" },
];

const FREE_DELIVERY_THRESHOLD = 500000;

// ── INIT ────────────────────────────────────────────
window.addEventListener('load', () => {
  products = DEMO;
  renderProducts(products);
});

// Telegram WebApp uchun qo'shimcha
document.addEventListener('DOMContentLoaded', () => {
  if (!products.length) {
    products = DEMO;
    renderProducts(products);
  }
});

// ── SAHIFA ALMASHTIRISH ─────────────────────────────
function showPage(name) {
  prevPage = document.querySelector('.page:not(.hidden)')?.id?.replace('page-','') || 'home';
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + name).classList.remove('hidden');
  if (name === 'cart')      renderCart();
  if (name === 'favorites') renderFavorites();
}

function goBack() { showPage(prevPage); }

// ── SIDEBAR ─────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('hidden');
  document.getElementById('overlay').classList.toggle('hidden');
}

// ── KATEGORIYA FILTRI ───────────────────────────────
function filterCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.cat-link').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.cat-link=[data-cat="${cat}"]').forEach(t => t.classList.add('active'));
  const query = document.getElementById('search-input').value.toLowerCase();
  applyFilter(cat, query);
  showPage('home');
}

// ── QIDIRUV ─────────────────────────────────────────
function searchProducts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  applyFilter(currentCat, query);
}

function applyFilter(cat, query) {
  let filtered = products;
  if (cat !== 'all') filtered = filtered.filter(p => p.cat === cat);
  if (query)         filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query));
  renderProducts(filtered);
}

// ── MAHSULOTLARNI CHIQARISH ─────────────────────────
function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  if (!list.length) {
    grid.innerHTML = "<p class='empty-msg'>📭 Mahsulot topilmadi</p>";
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFav(${p.id})">
          ${favorites[p.id] ? '❤️' : '🤍'}
        </button></div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc}</div>
        <div class="card-price">${p.price.toLocaleString()} so'm</div>
        <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})">
          + Savatga
        </button>
      </div>
    </div>`
  ).join('');
}

// ── MAHSULOT DETAIL ─────────────────────────────────
function showDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  prevPage = 'home';
  document.querySelectorAll('.page').forEach(x => x.classList.add('hidden'));
  document.getElementById('page-detail').classList.remove('hidden');
  document.getElementById('detail-title').textContent = p.name;
  document.getElementById('detail-content').innerHTML = `
  <img class="detail-img" src="${p.image}" alt="${p.name}"/>
    <div class="detail-body">
      <div class="detail-name">${p.name}</div>
      <div class="detail-desc">${p.desc}</div>
      <div class="detail-price">${p.price.toLocaleString()} so'm</div>
      <button class="btn-detail-add" onclick="addToCart(${p.id}); showPage('home')">
        🛒 Savatga qo'shish
      </button>
    </div>`
}

// ── SAVAT ───────────────────────────────────────────
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (cart[id]) cart[id].qty++;
  else cart[id] = { ...p, qty: 1 };
  updateCartBadge();
  tg.HapticFeedback?.impactOccurred('light');
}

function updateCartBadge() {
  const total = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function renderCart() {
  const items = Object.values(cart);
  const container = document.getElementById('cart-items');
  const footer    = document.getElementById('cart-footer');
  const freeMsg   = document.getElementById('free-delivery-msg');

  if (!items.length) {
    container.innerHTML = "<p class='empty-msg' style='padding:40px;text-align:center;color:#aaa'>🛒 Savat bo'sh</p>";
    footer.style.display = 'none';
    freeMsg.classList.add('hidden');
    return;
  }

  footer.style.display = 'block';
  container.innerHTML = items.map(i => 
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">${(i.price * i.qty).toLocaleString()} so'm</div>
        <div class="cart-controls">
          <button onclick="changeQty(${i.id}, -1)">−</button>
          <span class="cart-qty">${i.qty}</span>
          <button onclick="changeQty(${i.id}, 1)">+</button>
          <button class="btn-delete" onclick="removeFromCart(${i.id})">🗑</button>
        </div>
      </div>
    </div>
  ).join('');

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('total-price').textContent = total.toLocaleString();

  const remaining = FREE_DELIVERY_THRESHOLD - total;
  if (remaining > 0) {
    freeMsg.classList.remove('hidden');
    freeMsg.textContent = `Bepul yetkazib berish uchun yana ${remaining.toLocaleString()} so'm xarid qiling!`
  } else {
    freeMsg.classList.remove('hidden');
    freeMsg.textContent = '✅ Bepul yetkazib berish!';
    freeMsg.style.background = '#e8f5e9';
    freeMsg.style.borderColor = '#27ae60';
    freeMsg.style.color = '#1a6b2a';
  }
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  updateCartBadge();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  updateCartBadge();
  renderCart();
}

// ── SEVIMLILAR ──────────────────────────────────────
function toggleFav(id) {
  if (favorites[id]) delete favorites[id];
  else favorites[id] = products.find(x => x.id === id);
  renderProducts(currentCat === 'all' ? products : products.filter(p => p.cat === currentCat));
}

function renderFavorites() {
  const grid  = document.getElementById('favorites-grid');
  const items = Object.values(favorites);
  if (!items.length) {
    grid.innerHTML = "<p class='empty-msg'>🤍 Sevimlilar yo'q</p>";
    return;
  }
  grid.innerHTML = items.map(p => 
    `
    <div class="card" onclick="showDetail(${p.id})">
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFav(${p.id}); renderFavorites()">❤️</button>
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-price">${p.price.toLocaleString()} so'm</div>
        <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})">+ Savatga</button>
      </div>
    </div>`
  ).join('');
}

// ── BUYURTMA BERISH ─────────────────────────────────
function placeOrder() {
  const items = Object.values(cart);
  if (!items.length) { tg.showAlert('Savat bo\'sh!'); return; }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  tg.sendData(JSON.stringify({
    type:  'order',
    items: items.map(i => ({ name: i.name, qty: i.qty, total: i.price * i.qty })),
    total
  }));
  cart = {};
  updateCartBadge();
}
