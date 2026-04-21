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
        <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})">
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
      <button class="btn-detail-add" onclick="addToCart(${p.id}); showPage('home')">
        Savatga qoshish
      </button>
    </div>
  `;
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (cart[id]) cart[id].qty++;
  else cart[id] = { ...p, qty: 1 };
  updateCartBadge();
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function updateCartBadge() {
  const total = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

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
        <div class="cart-item-price">${(i.price * i.qty).toLocaleString()} so'm</div>
        <div class="cart-controls">
          <button onclick="changeQty(${i.id}, -1)">-</button>
          <span class="cart-qty">${i.qty}</span>
          <button onclick="changeQty(${i.id}, 1)">+</button>
          <button class="btn-delete" onclick="removeFromCart(${i.id})">X</button>
        </div>
      </div>
    </div>
  `).join('');

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('total-price').textContent = total.toLocaleString();
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
        <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})">+ Savatga</button>
      </div>
    </div>
  `).join('');
}

function placeOrder() {
  const items = Object.values(cart);
  if (!items.length) {
    tg.showAlert('Savat bosh!');
    return;
  }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  tg.sendData(JSON.stringify({
    type:  'order',
    items: items.map(i => ({ name: i.name, qty: i.qty, total: i.price * i.qty })),
    total
  }));
  cart = {};
  updateCartBadge();
}

loadData();
