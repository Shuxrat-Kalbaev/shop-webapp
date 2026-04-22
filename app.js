const tg = window.Telegram?.WebApp || {
  expand: () => {},
  sendData: (d) => { console.log('sendData:', d); },
  showAlert: (m) => { alert(m); },
  HapticFeedback: null
};
tg.expand();

let products   = [];
let cart       = {};
let favorites  = {};
let currentCat = 'all';
let prevPage   = 'home';

const DATA_URL = 'https://shuxrat-kalbaev.github.io/shop-webapp/data.json';
const SIZES    = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function loadData() {
  fetch(DATA_URL + '?t=' + Date.now())
    .then(r => r.json())
    .then(data => {
      products = data.products || [];
      renderProducts(products);
      renderReviews(data.reviews || []);
    })
    .catch(() => {
      document.getElementById('products-grid').innerHTML =
        "<p class='empty-msg'>Mahsulotlar yuklanmadi.</p>";
    });
}

function showPage(name) {
  prevPage = document.querySelector('.page:not(.hidden)')?.id?.replace('page-', '') || 'home';
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + name).classList.remove('hidden');
  if (name === 'cart')      renderCart();
  if (name === 'favorites') renderFavorites();
}

function goBack() {
  showPage(prevPage);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('hidden');
  document.getElementById('overlay').classList.toggle('hidden');
}

function filterCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.cat-link').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.cat-link[data-cat="' + cat + '"]').forEach(t => t.classList.add('active'));
  const query = document.getElementById('search-input').value.toLowerCase();
  applyFilter(cat, query);
  showPage('home');
}

function searchProducts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  applyFilter(currentCat, query);
}

function applyFilter(cat, query) {
  let filtered = products;
  if (cat !== 'all') filtered = filtered.filter(p => p.cat === cat);
  if (query) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(query) || (p.desc || '').toLowerCase().includes(query)
  );
  renderProducts(filtered);
}

function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  if (!list || !list.length) {
    grid.innerHTML = "<p class='empty-msg'>Mahsulot topilmadi</p>";
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Rasm'"/>
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFav(${p.id})">
          ${favorites[p.id] ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc || ''}</div>
        <div class="card-price">${Number(p.price).toLocaleString()} so'm</div>
        <button class="btn-add" onclick="event.stopPropagation(); showDetail(${p.id})">
          + Savatga
        </button>
      </div>
    </div>
  `).join('');
}

function renderReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;
  if (!reviews || !reviews.length) {
    container.innerHTML = "<p style='color:#aaa;font-size:.85rem;padding:10px'>Hali sharhlar yoq</p>";
    return;
  }
  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-name">${r.name}</div>
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div class="review-text">"${r.text}"</div>
    </div>
  `).join('');
}

// ── DETAIL sahifa (razmer tanlash) ──────────────────
function showDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  prevPage = 'home';
  document.querySelectorAll('.page').forEach(x => x.classList.add('hidden'));
  document.getElementById('page-detail').classList.remove('hidden');
  document.getElementById('detail-title').textContent = p.name;
  document.getElementById('detail-content').innerHTML = `
    <img class="detail-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x300/1a1a2e/c9a84c?text=Rasm'"/>
    <div class="detail-body">
      <div class="detail-name">${p.name}</div>
      <div class="detail-cat">Kategoriya: ${p.cat || ''}</div>
      <div class="detail-desc">${p.desc || ''}</div>
      <div class="detail-price">${Number(p.price).toLocaleString()} so'm</div>

      <div class="size-section">
        <div class="size-title">Razmer tanlang:</div>
        <div class="size-options">
          ${SIZES.map(s => `
            <button class="size-btn" onclick="selectSize(this, '${s}')">${s}</button>
          `).join('')}
        </div>
        <div id="size-error" class="size-error hidden">Iltimos razmer tanlang!</div>
      </div>

      <button class="btn-detail-add" onclick="addToCartWithSize(${p.id})">
        + Savatga qoshish
      </button>
    </div>
  `;
}

function selectSize(btn, size) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('size-error').classList.add('hidden');
}

function addToCartWithSize(id) {
  const selectedBtn = document.querySelector('.size-btn.selected');
  if (!selectedBtn) {
    document.getElementById('size-error').classList.remove('hidden');
    return;
  }
  const size = selectedBtn.textContent;
  const p = products.find(x => x.id === id);
  if (!p) return;

  const cartKey = id + '_' + size;
  if (cart[cartKey]) cart[cartKey].qty++;
  else cart[cartKey] = { ...p, qty: 1, size: size, cartKey: cartKey };

  updateCartBadge();
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  showPage('home');
}

function updateCartBadge() {
  const total = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

// ── SAVAT ───────────────────────────────────────────
function renderCart() {
  const items     = Object.values(cart);
  const container = document.getElementById('cart-items');
  const footer    = document.getElementById('cart-footer');

  if (!items.length) {
    container.innerHTML = "<p class='empty-msg' style='padding:40px'>Savat bosh</p>";
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  container.innerHTML = items.map(i => `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}" onerror="this.src='https://via.placeholder.com/80x80/1a1a2e/c9a84c?text=?'"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-size">Razmer: <b>${i.size}</b></div>
        <div class="cart-item-price">${(i.price * i.qty).toLocaleString()} so'm</div>
        <div class="cart-controls">
          <button onclick="changeQty('${i.cartKey}', -1)">-</button>
          <span class="cart-qty">${i.qty}</span>
          <button onclick="changeQty('${i.cartKey}', 1)">+</button>
          <button class="btn-delete" onclick="removeFromCart('${i.cartKey}')">X</button>
        </div>
      </div>
    </div>
  `).join('');

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('total-price').textContent = total.toLocaleString();
}

function changeQty(cartKey, delta) {
  if (!cart[cartKey]) return;
  cart[cartKey].qty += delta;
  if (cart[cartKey].qty <= 0) delete cart[cartKey];
  updateCartBadge();
  renderCart();
}

function removeFromCart(cartKey) {
  delete cart[cartKey];
  updateCartBadge();
  renderCart();
}

// ── BUYURTMA BERISH (manzil bilan) ──────────────────
function placeOrder() {
  const items = Object.values(cart);
  if (!items.length) {
    tg.showAlert('Savat bosh!');
    return;
  }

  const addressInput = document.getElementById('address-input');
  const address = addressInput ? addressInput.value.trim() : '';
  if (!address) {
    tg.showAlert('Iltimos yetkazib berish manzilini kiriting!');
    if (addressInput) addressInput.focus();
    return;
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  tg.sendData(JSON.stringify({
    type:    'order',
    items:   items.map(i => ({ name: i.name, size: i.size, qty: i.qty, total: i.price * i.qty })),
    total:   total,
    address: address
  }));
  cart = {};
  updateCartBadge();
}

// ── SEVIMLILAR ──────────────────────────────────────
function toggleFav(id) {
  if (favorites[id]) delete favorites[id];
  else favorites[id] = products.find(x => x.id === id);
  const query = document.getElementById('search-input').value.toLowerCase();
  applyFilter(currentCat, query);
}

function renderFavorites() {
  const grid  = document.getElementById('favorites-grid');
  const items = Object.values(favorites);
  if (!items.length) {
    grid.innerHTML = "<p class='empty-msg'>Sevimlilar yoq</p>";
    return;
  }
  grid.innerHTML = items.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      <div class="card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFav(${p.id}); renderFavorites()">❤️</button>
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-price">${Number(p.price).toLocaleString()} so'm</div>
        <button class="btn-add" onclick="event.stopPropagation(); showDetail(${p.id})">+ Savatga</button>
      </div>
    </div>
  `).join('');
}

loadData();
