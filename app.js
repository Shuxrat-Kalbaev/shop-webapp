const tg = window.Telegram.WebApp;
tg.expand();

// ── Mahsulotlarni API dan olish ─────────────────────
// (Oddiy versiya: mahsulotlar statik yoki API orqali)
// Hozircha demo mahsulotlar — keyin API bilan almashtirasiz

let products = [];
let cart     = {};

// Demo mahsulotlar (keyinroq backend API ga ulaysiz)
const DEMO_PRODUCTS = [
  { id: 1, name: "Futbolka",     price: 85000,  image: "https://via.placeholder.com/300x300?text=Futbolka" },
  { id: 2, name: "Shim",         price: 150000, image: "https://via.placeholder.com/300x300?text=Shim" },
  { id: 3, name: "Krossovka",    price: 350000, image: "https://via.placeholder.com/300x300?text=Krossovka" },
  { id: 4, name: "Ko'ylak",      price: 120000, image: "https://via.placeholder.com/300x300?text=Koylak" },
];

// ── Sahifani yuklash ────────────────────────────────
window.addEventListener("load", () => {
  products = DEMO_PRODUCTS;
  renderProducts();
});

// ── Mahsulotlarni chiqarish ─────────────────────────
function renderProducts() {
  const grid = document.getElementById("products-grid");
  if (!products.length) {
    grid.innerHTML = "<p class='loading'>📭 Mahsulotlar yo'q</p>";
    return;
  }
  grid.innerHTML = products.map(p => 
    <div class="card">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="price">${p.price.toLocaleString()} so'm</p>
        <button class="btn-add" onclick="addToCart(${p.id})">➕ Qo'shish</button>
      </div>
    </div>
  ).join("");
}

// ── Cart ────────────────────────────────────────────
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  cart[id] = cart[id] ? { ...cart[id], qty: cart[id].qty + 1 } : { ...product, qty: 1 };
  updateCartBadge();
  tg.HapticFeedback?.impactOccurred("light");
}

function updateCartBadge() {
  const total = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-count").textContent = total;
}

function toggleCart() {
  const panel   = document.getElementById("cart-panel");
  const overlay = document.getElementById("overlay");
  panel.classList.toggle("hidden");
  overlay.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) renderCart();
}

function renderCart() {
  const items    = Object.values(cart);
  const container = document.getElementById("cart-items");
  if (!items.length) {
    container.innerHTML = "<p style='text-align:center;color:#888;padding:20px'>Savat bo'sh</p>";
    document.getElementById("total-price").textContent = "0";
    return;
  }
  container.innerHTML = items.map(i => 
    <div class="cart-item">
      <span>${i.name}</span>
      <div class="item-controls">
        <button onclick="changeQty(${i.id}, -1)">−</button>
        <span>${i.qty}</span>
        <button onclick="changeQty(${i.id}, 1)">+</button>
      </div>
      <span>${(i.price * i.qty).toLocaleString()} so'm</span>
    </div>
  ).join("");
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById("total-price").textContent = total.toLocaleString();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  updateCartBadge();
  renderCart();
}

// ── Buyurtma berish ─────────────────────────────────
function placeOrder() {
  const items = Object.values(cart);
  if (!items.length) {
    tg.showAlert("Savat bo'sh!");
    return;
  }
  const total    = items.reduce((s, i) => s + i.price * i.qty, 0);
  const orderData = {
    type:  "order",
    items: items.map(i => ({ name: i.name, qty: i.qty, total: i.price * i.qty })),
    total
  };
  tg.sendData(JSON.stringify(orderData));
  cart = {};
  updateCartBadge();
  toggleCart();
}

// ── Tab almashtirish ────────────────────────────────
function showTab(name) {
  document.getElementById("tab-shop").style.display  = name === "shop" ? "" : "none";
  document.getElementById("tab-size").style.display  = name === "size" ? "" : "none";
  document.querySelectorAll(".tab").forEach((t, i) => {
    t.classList.toggle("active", (i === 0 && name === "shop") || (i === 1 && name === "size"));
  });
}

// ── Size maslahat ───────────────────────────────────
function checkSize() {
  const height = parseInt(document.getElementById("height").value);
  const weight = parseInt(document.getElementById("weight").value);
  if (!height || !weight) {
    tg.showAlert("Bo'y va vazn kiriting!");
    return;
  }
  tg.sendData(JSON.stringify({ type: "size", height, weight }));
}