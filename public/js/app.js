// public/js/app.js
// Script global para interacción con backend y funcionalidad del sitio

const api = {
  products: 'https://alecho-pesca.onrender.com/api/products',
  login: 'https://alecho-pesca.onrender.com/api/auth/login',
  logout: 'https://alecho-pesca.onrender.com/api/auth/logout',
  register: 'https://alecho-pesca.onrender.com/api/auth/register',
  me: 'https://alecho-pesca.onrender.com/api/auth/me',
  contact: 'https://alecho-pesca.onrender.com/api/contact',
  cart: 'https://alecho-pesca.onrender.com/api/cart',
  paymentSettings: 'https://alecho-pesca.onrender.com/api/payment/settings',
  mercadopago: 'https://alecho-pesca.onrender.com/api/payment/mercadopago',
};

let currentUser = null;
let paymentSettings = {
  creditSurcharge: 0.05,
  debitSurcharge: 0,
  mercadoPagoFee: 0.03,
  transferFee: 0,
  cashFee: 0,
};
let mercadopagoConfig = {
  publicKey: null,
  configured: false,
};

// Paginación de productos
let productsPage = 1;
let productsTotalPages = 1;
let productsFilters = {};

async function loadCurrentUser() {
  try {
    const res = await fetch(api.me, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    currentUser = data.user || null;
    if (currentUser) {
      localStorage.setItem('userType', currentUser.type);
      localStorage.setItem('isAdmin', currentUser.isAdmin ? 'true' : 'false');
    } else {
      localStorage.removeItem('userType');
      localStorage.removeItem('isAdmin');
    }
  } catch (err) {
    // Ignorar
  } finally {
    updateAuthNav();
  }
}

function getUserType() {
  if (currentUser?.type) return currentUser.type;
  return localStorage.getItem('userType') || 'minorista';
}

async function loadPaymentSettings() {
  try {
    const res = await fetch(api.paymentSettings);
    if (!res.ok) return;
    const settings = await res.json();
    paymentSettings = { ...paymentSettings, ...settings };
  } catch (err) {
    // Ignorar errores, se usan valores por defecto
  }
}

async function loadMercadoPagoConfig() {
  try {
    const res = await fetch(`${api.mercadopago}/config`);
    if (!res.ok) return;
    const config = await res.json();
    mercadopagoConfig = { ...mercadopagoConfig, ...config };
  } catch (err) {
    // Ignorar errores, Mercado Pago no estará disponible
  }
}

function getSurchargeRate(method) {
  const map = {
    credito: paymentSettings.creditSurcharge,
    debito: paymentSettings.debitSurcharge,
    mercado_pago: paymentSettings.mercadoPagoFee,
    transferencia: paymentSettings.transferFee,
    efectivo: paymentSettings.cashFee,
  };
  return typeof map[method] === 'number' ? map[method] : 0;
}

// --- Opiniones --------------------------------------------------
let reviewRotationInterval;
let currentReviewIndex = 0;
let loadedReviews = [];

async function loadReviews() {
  try {
    const res = await fetch('https://alecho-pesca.onrender.com/api/reviews');
    if (!res.ok) return;
    loadedReviews = await res.json();
    currentReviewIndex = 0;
    renderReview();
    if (loadedReviews.length > 1) {
      clearInterval(reviewRotationInterval);
      reviewRotationInterval = setInterval(() => {
        currentReviewIndex = (currentReviewIndex + 1) % loadedReviews.length;
        renderReview();
      }, 8000);
    }
  } catch (err) {
    // Ignorar
  }
}

function renderReview() {
  const container = document.getElementById('review-content');
  if (!container) return;
  if (!loadedReviews || !loadedReviews.length) {
    container.innerHTML = '<p class="text-muted">Sé el primero en dejar una opinión.</p>';
    return;
  }
  const { userName, rating, comment, createdAt } = loadedReviews[currentReviewIndex];
  container.innerHTML = `
    <p class="mb-1"><strong>${userName}</strong> <small class="text-muted">${new Date(createdAt).toLocaleDateString()}</small></p>
    <p class="mb-1">${'★'.repeat(Math.min(5, rating))}${'☆'.repeat(5 - Math.min(5, rating))}</p>
    <p class="mb-0">${comment || '<span class="text-muted">Sin comentario</span>'}</p>
  `;
}

// --- Productos -------------------------------------------------
async function loadProducts(containerId, filters = {}, page = 1) {
  const url = new URL(api.products, window.location.origin);
  const params = new URLSearchParams({ ...filters, page, limit: 12 });
  url.search = params.toString();

  const res = await fetch(url.toString());
  const data = await res.json();
  const container = document.getElementById(containerId);
  const items = Array.isArray(data) ? data : data.items;

  if (!items || !items.length) {
    container.innerHTML =
      '<div class="col-12"><div class="alert alert-info">No se encontraron productos.</div></div>';
    document.getElementById('load-more-products')?.classList.add('d-none');
    return;
  }

  // Si es primera página, limpiar contenido
  if (page === 1) container.innerHTML = '';

  items.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    const isOutOfStock = typeof p.stock === 'number' && p.stock <= 0;
    const userType = getUserType();
    const displayPrice =
      userType === 'mayorista' && typeof p.wholesalePrice === 'number' ? p.wholesalePrice : p.price;

    card.innerHTML = `
      <div class="card h-100">
        <img class="card-img-top" src="${p.image}" alt="${p.name}">
        <div class="card-body">
          <h5 class="card-title"><a href="product.html?id=${p.id}" class="text-decoration-none text-dark">${p.name}</a></h5>
          <p class="card-text">$${displayPrice.toFixed(2)}${userType === 'mayorista' && typeof p.wholesalePrice === 'number' ? ' <small class="text-muted">(mayorista)</small>' : ''}</p>
          <p class="star-rating">${renderStars(p.rating)}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart(${p.id})">
              ${isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
            </button>
            <a href="product.html?id=${p.id}" class="btn btn-outline-secondary">Ver producto</a>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  if (typeof data.total === 'number') {
    productsPage = page;
    productsTotalPages = data.totalPages || Math.ceil(data.total / 12);
    const loadMoreBtn = document.getElementById('load-more-products');
    if (loadMoreBtn) {
      loadMoreBtn.classList.toggle('d-none', productsPage >= productsTotalPages);
    }
  }
}

function loadMoreProducts() {
  if (productsPage >= productsTotalPages) return;
  productsPage += 1;
  loadProducts('products-container', productsFilters, productsPage);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  let html = '';
  for (let i = 0; i < full; i++) html += '★';
  if (rating - full >= 0.5) html += '½';
  return html;
}

// --- Buscador --------------------------------------------------
function applyProductFilters(filters = {}) {
  productsFilters = { ...productsFilters, ...filters };
  productsPage = 1;
  loadProducts('products-container', productsFilters, productsPage);
}

function setupSearch(inputId, containerId) {
  const input = document.getElementById(inputId);
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (containerId) applyProductFilters({ search: q });
  });
}

// --- Carrito ---------------------------------------------------
function getCart() {
  const c = localStorage.getItem('cart');
  return c ? JSON.parse(c) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) existing.quantity++;
  else cart.push({ productId, quantity: 1 });
  saveCart(cart);
  showMessage('✓ Producto añadido al carrito', 'success');
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((i) => i.productId !== productId);
  saveCart(cart);
  renderCart();
  showMessage('✓ Producto eliminado del carrito', 'info');
}

function updateQuantity(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (item) {
    item.quantity = parseInt(qty);
    if (item.quantity < 1) removeFromCart(productId);
    else saveCart(cart);
  }
  renderCart();
}

async function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  if (!container) return;

  container.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    const emptyCart = document.getElementById('empty-cart');
    if (emptyCart) emptyCart.style.display = 'block';
    return;
  }

  const userType = getUserType();

  for (const item of cart) {
    const res = await fetch(`https://alecho-pesca.onrender.com/api/products/${item.productId}`);
    const p = await res.json();
    const unitPrice =
      userType === 'mayorista' && typeof p.wholesalePrice === 'number' ? p.wholesalePrice : p.price;
    total += unitPrice * item.quantity;
    const row = document.createElement('tr');
    const maxQty = p.stock || 999;
    const quantity = Math.min(item.quantity, maxQty);
    if (item.quantity > maxQty) {
      showMessage(`Se ajustó la cantidad de ${p.name} al stock disponible (${maxQty})`, 'warning');
    }

    row.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td>$${unitPrice.toFixed(2)}</td>
      <td>
        <input type="number" class="form-control form-control-sm" style="width:70px;" 
          value="${quantity}" min="1" max="${maxQty}" 
          onchange="updateQuantity(${item.productId}, this.value)">
      </td>
      <td>$${(unitPrice * quantity).toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.productId})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    if (item.quantity > maxQty) {
      item.quantity = maxQty;
      saveCart(cart);
    }

    container.appendChild(row);
  }

  const discountRate = userType === 'mayorista' ? 0.1 : 0;
  const discount = total * discountRate;

  const paymentMethodSelect = document.getElementById('payment-method');
  const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : 'efectivo';
  const surchargeRate = getSurchargeRate(paymentMethod);
  const afterDiscount = total - discount;
  const surcharge = afterDiscount * surchargeRate;
  const finalTotal = afterDiscount + surcharge;

  document.getElementById('cart-total').innerText = finalTotal.toFixed(2);
}

async function checkout() {
  const cart = getCart();
  if (!cart.length) return alert('El carrito está vacío');

  if (!currentUser) {
    showMessage('Debes iniciar sesión para completar la compra', 'warning');
    window.location.href = '/account.html';
    return;
  }

  const userType = getUserType();
  const paymentMethod = document.getElementById('payment-method')?.value || 'efectivo';
  const res = await fetch(api.cart, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart, userType, paymentMethod }),
  });
  const data = await res.json();
  if (data.success) {
    showMessage('Compra procesada con éxito');
    localStorage.removeItem('cart');

    if (data.redirectUrl) {
      showMessage('Redirigiendo a Mercado Pago...', 'info');
      window.open(data.redirectUrl, '_blank');
      return;
    }

    window.location.reload();
  } else {
    showMessage(data.error || 'Error al procesar el pedido', 'danger');
  }
}

// --- Autenticación -------------------------------------------
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value,
    type: form.type?.value || 'minorista',
  };

  const res = await fetch(api.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 🔥 IMPORTANTE
    body: JSON.stringify(data),
  });

  const resp = await res.json();

  if (resp.success) {
    showMessage('Registro exitoso');

    await loadCurrentUser();

    window.location.href = '/account.html';
  } else {
    showMessage(resp.error, 'danger');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    email: form.email.value,
    password: form.password.value,
  };

  const res = await fetch(api.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 🔥 IMPORTANTE
    body: JSON.stringify(data),
  });

  const resp = await res.json();

  if (resp.success) {
    // 🔥 Guardar inmediatamente en localStorage
    localStorage.setItem('userType', resp.user.type);
    localStorage.setItem('isAdmin', resp.user.isAdmin ? 'true' : 'false');
    
    showMessage('Login correcto');

    // 🔥 CLAVE: recargar usuario desde backend (con sesión)
    await loadCurrentUser();

    const isAdmin = resp.user.isAdmin || localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/account.html';
    }

  } else {
    showMessage(resp.error, 'danger');
  }
}

async function handleLogout() {
  try {
    await fetch(api.logout, { method: 'POST', credentials: 'include' });
  } catch (err) {
    // Ignorar errores de logout
  }
  localStorage.removeItem('userType');
  localStorage.removeItem('isAdmin');
  currentUser = null;
  showMessage('Sesión cerrada', 'info');
  window.location.href = '/';
}

function updateAuthNav() {
  const navList = document.querySelector('.navbar-nav');
  if (!navList) return;

  let logoutItem = document.getElementById('nav-logout');
  if (!logoutItem) {
    logoutItem = document.createElement('li');
    logoutItem.id = 'nav-logout';
    logoutItem.className = 'nav-item';
    logoutItem.innerHTML =
      '<a class="nav-link" href="#" onclick="handleLogout(); return false;"><i class="fas fa-sign-out-alt"></i> Salir</a>';
    navList.appendChild(logoutItem);
  }

  const ordersLink = document.querySelector('a[href="orders.html"]');
  if (currentUser && currentUser.isAdmin) {
    if (ordersLink) ordersLink.closest('li')?.classList.add('d-none');
  } else {
    if (ordersLink) ordersLink.closest('li')?.classList.remove('d-none');
  }

  if (currentUser) {
    logoutItem.classList.remove('d-none');
  } else {
    logoutItem.classList.add('d-none');
  }
}

// --- Contacto -------------------------------------------------
async function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    company: form.company.value,
    email: form.email.value,
    phone: form.phone.value,
    message: form.message.value,
  };
  const res = await fetch(api.contact, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const resp = await res.json();
  if (resp.success) showMessage(resp.message);
  else showMessage('Error enviando el formulario', 'danger');
}

// --- Utilidades ------------------------------------------------
function showMessage(text, type = 'success') {
  const div = document.createElement('div');
  div.className = `alert alert-${type} alert-fixed`;
  div.innerHTML = text;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Exporta funciones para uso en HTML
window.loadProducts = loadProducts;
window.setupSearch = setupSearch;
window.addToCart = addToCart;
window.renderCart = renderCart;
window.checkout = checkout;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleContact = handleContact;
window.handleLogout = handleLogout;
window.loadPaymentSettings = loadPaymentSettings;
window.loadMercadoPagoConfig = loadMercadoPagoConfig;
window.loadMoreProducts = loadMoreProducts;
window.updateQuantity = updateQuantity;

// Intentar cargar el usuario actual para ajustar la UI (login/logout)
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentUser();
  // Cargar opiniones solo en páginas que tienen el contenedor de reseñas
  if (document.getElementById('review-content')) {
    loadReviews();
  }
});
