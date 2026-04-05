// public/js/admin.js
// Lógica del panel administrativo (productos, usuarios, reseñas y subida de archivos)

let adminProducts = [];
let editingProductId = null;
let currentImages = [];

function renderImagePreview() {
  const preview = document.getElementById('image-preview');
  if (!preview) return;
  preview.innerHTML = '';
  currentImages.forEach((src, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'position-relative';
    wrapper.style.width = '80px';
    wrapper.style.height = '80px';

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Imagen ${idx + 1}`;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.className = 'rounded border';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-sm btn-danger position-absolute top-0 end-0';
    remove.style.transform = 'translate(30%, -30%)';
    remove.innerHTML = '<i class="fas fa-times"></i>';
    remove.addEventListener('click', () => {
      currentImages.splice(idx, 1);
      updateImagesField();
      renderImagePreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(remove);
    preview.appendChild(wrapper);
  });
}

function updateImagesField() {
  const imagesField = document.querySelector('textarea[name="images"]');
  if (!imagesField) return;
  imagesField.value = currentImages.join('\n');
}

function getEl(id) {
  return document.getElementById(id);
}

function setUploadFeedback(id, message, type = 'danger') {
  const el = getEl(id);
  if (!el) return;
  el.textContent = message;
  el.className = `form-text text-${type} mt-1`;
}

function setUploadProgress(id, percent) {
  const container = getEl(id);
  if (!container) return;
  const bar = container.querySelector('.progress-bar');
  if (!bar) return;
  bar.style.width = `${percent}%`;
  bar.textContent = percent ? `${percent}%` : '';
  container.style.display = percent ? 'block' : 'none';
}

function clearUploadFeedback(feedbackId, progressId) {
  setUploadFeedback(feedbackId, '');
  setUploadProgress(progressId, 0);
}

function uploadFiles(url, files, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append('files', file));

    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const percent = Math.round((e.loaded / e.total) * 100);
      onProgress(percent);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (err) {
          reject(new Error('Respuesta invalida del servidor'));
        }
      } else {
        let errMsg = xhr.statusText;
        try {
          const json = JSON.parse(xhr.responseText);
          errMsg = json.error || errMsg;
        } catch (e) {
          // ignore
        }
        reject(new Error(errMsg || 'Error en la subida'));
      }
    };

    xhr.onerror = () => reject(new Error('Error de red durante la subida'));
    xhr.send(fd);
  });
}

function setupDragAndDrop(dropZoneId, fileInputId, onFilesDropped) {
  const dropZone = getEl(dropZoneId);
  const fileInput = getEl(fileInputId);
  if (!dropZone || !fileInput) return;

  const onDragOver = (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-drop-active');
  };
  const onDragLeave = () => {
    dropZone.classList.remove('drag-drop-active');
  };
  const onDrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-drop-active');
    const files = e.dataTransfer.files;
    if (!files || !files.length) return;
    fileInput.files = files;
    onFilesDropped(files);
  };

  dropZone.addEventListener('dragover', onDragOver);
  dropZone.addEventListener('dragenter', onDragOver);
  dropZone.addEventListener('dragleave', onDragLeave);
  dropZone.addEventListener('drop', onDrop);
}

async function handleUpload({
  fileInput,
  uploadBtn,
  feedbackId,
  progressId,
  allowedTypes,
  maxSize,
  onSuccess,
}) {
  clearUploadFeedback(feedbackId, progressId);

  if (!fileInput.files.length) {
    setUploadFeedback(feedbackId, 'Selecciona al menos un archivo para subir', 'warning');
    return;
  }

  if (!validateFiles(fileInput.files, allowedTypes, maxSize, feedbackId)) return;

  uploadBtn.disabled = true;
  fileInput.disabled = true;
  setUploadFeedback(feedbackId, 'Subiendo...', 'secondary');

  try {
    const data = await uploadFiles('https://alecho-pesca.onrender.com/api/admin/upload-media', fileInput.files, (percent) =>
      setUploadProgress(progressId, percent)
    );
    await onSuccess(data);
    setUploadFeedback(feedbackId, 'Subida completada', 'success');
  } catch (err) {
    setUploadFeedback(feedbackId, err.message || 'Error en la subida', 'danger');
  } finally {
    uploadBtn.disabled = false;
    fileInput.disabled = false;
    setTimeout(() => clearUploadFeedback(feedbackId, progressId), 3000);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function validateFiles(files, allowedTypes, maxSize, label) {
  const invalid = [];
  Array.from(files).forEach((file) => {
    if (!allowedTypes.some((type) => file.type === type || file.type.startsWith(type))) {
      invalid.push(`${file.name} (tipo no válido)`);
      return;
    }
    if (file.size > maxSize) {
      invalid.push(`${file.name} (${formatBytes(file.size)} > ${formatBytes(maxSize)})`);
    }
  });
  if (invalid.length) {
    showMessage(`Archivos inválidos para ${label}: ${invalid.join(', ')}`, 'danger');
    return false;
  }
  return true;
}

function buildCategoryOptions(products) {
  const select = document.getElementById('admin-category-filter');
  if (!select) return;
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  select.innerHTML =
    '<option value="">Todas</option>' +
    categories.map((c) => `<option value="${c}">${c}</option>`).join('');
}

function getSelectedProductIds() {
  return Array.from(document.querySelectorAll('.product-select:checked')).map((cb) =>
    parseInt(cb.dataset.id, 10)
  );
}

async function applyBulkUpdates() {
  const ids = getSelectedProductIds();
  if (!ids.length) return showMessage('Selecciona al menos un producto', 'warning');

  const stock = document.getElementById('bulk-stock').value;
  const price = document.getElementById('bulk-price').value;
  const wholesalePct = document.getElementById('bulk-wholesale').value;

  const updates = {};
  if (stock) updates.stock = parseInt(stock, 10);
  if (price) updates.price = parseFloat(price);
  if (wholesalePct) {
    const pct = parseFloat(wholesalePct);
    if (!isNaN(pct)) updates.wholesalePercent = pct;
  }

  if (!Object.keys(updates).length)
    return showMessage('Ingresa al menos un valor para aplicar', 'warning');

  for (const id of ids) {
    const product = adminProducts.find((p) => p.id === id);
    if (!product) continue;

    const payload = {};
    if (typeof updates.stock !== 'undefined') payload.stock = updates.stock;
    if (typeof updates.price !== 'undefined') payload.price = updates.price;
    if (typeof updates.wholesalePercent !== 'undefined') {
      payload.wholesalePrice =
        +(payload.price || product.price) * (1 - updates.wholesalePercent / 100);
    }

    await fetch(`https://alecho-pesca.onrender.com/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  showMessage('Actualización masiva aplicada');
  await refreshProducts();
}

function renderProductRow(product) {
  const imageUrl = product.image || (product.images && product.images[0]) || '';
  return `
        <tr>
          <td><input class="product-select" type="checkbox" data-id="${product.id}"></td>
          <td>${product.id}</td>
          <td class="align-middle">
            <img src="${imageUrl}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'" />
          </td>
          <td><a href="product.html?id=${product.id}" target="_blank">${product.name}</a></td>
          <td>${product.stock ?? 0}</td>
          <td>$${product.price.toFixed(2)}</td>
          <td>$${typeof product.wholesalePrice === 'number' ? product.wholesalePrice.toFixed(2) : '-'}</td>
          <td>${product.category}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-2" onclick="editProduct(${product.id})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">Eliminar</button>
          </td>
        </tr>
      `;
}

async function refreshProducts() {
  const res = await fetch('https://alecho-pesca.onrender.com/api/admin/products', { credentials: 'include' });
  const products = await res.json();
  adminProducts = products;

  buildCategoryOptions(products);

  const filterCategory = document.getElementById('admin-category-filter')?.value || '';
  const searchTerm = document.getElementById('admin-product-search')?.value.toLowerCase() || '';

  const filtered = products.filter((p) => {
    const matchCat = filterCategory ? p.category === filterCategory : true;
    const matchSearch = searchTerm ? p.name.toLowerCase().includes(searchTerm) : true;
    return matchCat && matchSearch;
  });

  const tbody = document.getElementById('admin-products');
  tbody.innerHTML = filtered.map(renderProductRow).join('');

  // Seleccionar todo
  const selectAll = document.getElementById('select-all-products');
  if (selectAll) {
    selectAll.checked = false;
    selectAll.addEventListener('change', () => {
      document
        .querySelectorAll('.product-select')
        .forEach((cb) => (cb.checked = selectAll.checked));
    });
  }
}

async function refreshUsers() {
  const res = await fetch('https://alecho-pesca.onrender.com/api/admin/users', { credentials: 'include' });
  const users = await res.json();
  const tbody = document.getElementById('admin-users');
  tbody.innerHTML = '';

  users.forEach((user) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            <select class="form-select form-select-sm" id="user-type-${user.id}">
              <option value="minorista" ${user.type === 'minorista' ? 'selected' : ''}>Minorista</option>
              <option value="mayorista" ${user.type === 'mayorista' ? 'selected' : ''}>Mayorista</option>
            </select>
          </td>
          <td>${user.isAdmin ? '<span class="badge bg-warning text-dark">Sí</span>' : 'No'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-2" onclick="updateUserType(${user.id})">Guardar</button>
            <button class="btn btn-sm btn-outline-secondary me-2" onclick="resetUserPassword(${user.id})">Reset clave</button>
            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Eliminar</button>
          </td>
        `;
    tbody.appendChild(tr);
  });
}

function renderReviewRow(review) {
  const product = adminProducts.find((p) => p.id === review.productId);
  const productName = product ? product.name : `#${review.productId}`;
  return `
        <tr>
          <td>${review.id}</td>
          <td><a href="product.html?id=${review.productId}" target="_blank">${productName}</a></td>
          <td>${review.userName}</td>
          <td>${'★'.repeat(Math.min(5, review.rating))}${'☆'.repeat(5 - Math.min(5, review.rating))}</td>
          <td>${review.comment || ''}</td>
          <td>${new Date(review.createdAt).toLocaleDateString()}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-danger" onclick="deleteReview(${review.id})">Eliminar</button>
          </td>
        </tr>
      `;
}

async function refreshReviews() {
  const res = await fetch('https://alecho-pesca.onrender.com/api/admin/reviews', { credentials: 'include' });
  const reviews = await res.json();
  const tbody = document.getElementById('admin-reviews');
  tbody.innerHTML = reviews.map(renderReviewRow).join('');
}

async function deleteReview(reviewId) {
  if (!confirm('¿Eliminar esta reseña?')) return;
  if (!confirm('¿Estás seguro? La reseña se eliminará permanentemente.')) return;
  const res = await fetch(`https://alecho-pesca.onrender.com/api/admin/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' });
  if (res.ok) {
    showMessage('Reseña eliminada');
    await refreshReviews();
  } else {
    const err = await res.json();
    showMessage(err.error || 'Error eliminando reseña', 'danger');
  }
}

async function updateUserType(userId) {
  const select = document.getElementById(`user-type-${userId}`);
  if (!select) return;
  const type = select.value;
  const res = await fetch(`https://alecho-pesca.onrender.com/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
    credentials: 'include'
  });
  if (res.ok) {
    showMessage('Tipo de usuario actualizado');
    await refreshUsers();
  } else {
    const err = await res.json();
    showMessage(err.error || 'Error actualizando usuario', 'danger');
  }
}

async function resetUserPassword(userId) {
  if (!confirm('¿Restablecer la contraseña a "admin123" para este usuario?')) return;
  const res = await fetch(`https://alecho-pesca.onrender.com/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
    credentials: 'include'
  });
  if (res.ok) {
    showMessage('Contraseña restablecida a admin123');
  } else {
    const err = await res.json();
    showMessage(err.error || 'Error restableciendo contraseña', 'danger');
  }
}

async function deleteUser(userId) {
  if (!confirm('¿Eliminar usuario? Esto no se puede deshacer.')) return;
  if (!confirm('¿Estás seguro? Esta acción eliminará al usuario permanentemente.')) return;
  const res = await fetch(`https://alecho-pesca.onrender.com/api/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (res.ok) {
    showMessage('Usuario eliminado');
    await refreshUsers();
  } else {
    const err = await res.json();
    showMessage(err.error || 'Error eliminando usuario', 'danger');
  }
}

async function ensureAdmin() {
  // Primero verificar localStorage (más rápido y confiable)
  const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true';

  if (isAdminFromStorage) {
    // Mostrar el contenido administrativo
    document.getElementById('admin-alert').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    return true;
  }

  // Si no está en localStorage, verificar con el servidor
  try {
    const res = await fetch('https://alecho-pesca.onrender.com/api/auth/me', {
      credentials: 'include'
    });
    const data = await res.json();
    if (!data.user || !data.user.isAdmin) {
      document.getElementById('admin-content').style.display = 'none';
      const alert = document.getElementById('admin-alert');
      alert.style.display = 'block';
      alert.textContent = 'Acceso denegado. Debes iniciar sesión como administrador.';
      return false;
    }

    // Actualizar localStorage con la info del servidor
    localStorage.setItem('isAdmin', data.user.isAdmin ? 'true' : 'false');

    // Mostrar el contenido administrativo
    document.getElementById('admin-alert').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    return true;
  } catch (error) {
    document.getElementById('admin-content').style.display = 'none';
    const alert = document.getElementById('admin-alert');
    alert.style.display = 'block';
    alert.textContent = 'Error al verificar permisos de administrador.';
    return false;
  }
}

async function initAdmin() {
  if (!(await ensureAdmin())) return;
  await loadPaymentSettings();
  await refreshProducts();
  await refreshUsers();
  await refreshReviews();

  const bulkBtn = document.getElementById('bulk-apply');
  if (bulkBtn) bulkBtn.addEventListener('click', applyBulkUpdates);

  const categoryFilter = document.getElementById('admin-category-filter');
  if (categoryFilter) categoryFilter.addEventListener('change', refreshProducts);

  const productSearch = document.getElementById('admin-product-search');
  if (productSearch) productSearch.addEventListener('input', refreshProducts);

  const paymentForm = document.getElementById('payment-settings-form');
  paymentForm.creditSurcharge.value = paymentSettings.creditSurcharge;
  paymentForm.debitSurcharge.value = paymentSettings.debitSurcharge;
  paymentForm.mercadoPagoFee.value = paymentSettings.mercadoPagoFee;
  paymentForm.transferFee.value = paymentSettings.transferFee;
  paymentForm.cashFee.value = paymentSettings.cashFee;

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(paymentForm);
    const payload = {
      creditSurcharge: parseFloat(formData.get('creditSurcharge') || 0) / 100,
      debitSurcharge: parseFloat(formData.get('debitSurcharge') || 0) / 100,
      mercadoPagoFee: parseFloat(formData.get('mercadoPagoFee') || 0) / 100,
      transferFee: parseFloat(formData.get('transferFee') || 0) / 100,
      cashFee: parseFloat(formData.get('cashFee') || 0) / 100,
    };
    const token = formData.get('mercadopagoAccessToken');
    if (token) {
      payload.mercadopagoAccessToken = token;
    }
    const publicKey = formData.get('mercadopagoPublicKey');
    if (publicKey) {
      payload.mercadopagoPublicKey = publicKey;
    }
    await fetch('https://alecho-pesca.onrender.com/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    await loadPaymentSettings();
    showMessage('Configuración de pagos actualizada');
  });

  const uploadImagesBtn = document.getElementById('upload-image-btn');
  const imageFileInput = document.getElementById('product-image-file');
  const imageFeedbackId = 'image-upload-feedback';
  const imageProgressId = 'image-upload-progress';
  const imageAllowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const imageMaxSize = 5 * 1024 * 1024; // 5MB

  const handleImageUpload = async (files) => {
    if (!files.length) return;
    imageFileInput.files = files;
    await handleUpload({
      fileInput: imageFileInput,
      uploadBtn: uploadImagesBtn,
      feedbackId: imageFeedbackId,
      progressId: imageProgressId,
      allowedTypes: imageAllowedTypes,
      maxSize: imageMaxSize,
      onSuccess: async (data) => {
        currentImages.push(...data.urls);
        updateImagesField();
        renderImagePreview();
        if (!document.querySelector('input[name="image"]').value) {
          document.querySelector('input[name="image"]').value = data.urls[0];
        }
      },
    });
  };

  if (uploadImagesBtn) {
    uploadImagesBtn.addEventListener('click', async () => {
      await handleImageUpload(imageFileInput.files);
    });

    setupDragAndDrop('image-drop-zone', 'product-image-file', handleImageUpload);
  }

  const uploadVideosBtn = document.getElementById('upload-video-btn');
  const videoFileInput = document.getElementById('product-video-file');
  const videoFeedbackId = 'video-upload-feedback';
  const videoProgressId = 'video-upload-progress';
  const videoAllowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const videoMaxSize = 20 * 1024 * 1024; // 20MB

  const handleVideoUpload = async (files) => {
    if (!files.length) return;
    videoFileInput.files = files;
    await handleUpload({
      fileInput: videoFileInput,
      uploadBtn: uploadVideosBtn,
      feedbackId: videoFeedbackId,
      progressId: videoProgressId,
      allowedTypes: videoAllowedTypes,
      maxSize: videoMaxSize,
      onSuccess: async (data) => {
        const videoField = document.querySelector('textarea[name="videos"]');
        const existing = (videoField.value || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        videoField.value = [...existing, ...data.urls].join('\n');
      },
    });
  };

  if (uploadVideosBtn) {
    uploadVideosBtn.addEventListener('click', async () => {
      await handleVideoUpload(videoFileInput.files);
    });

    setupDragAndDrop('video-drop-zone', 'product-video-file', handleVideoUpload);
  }

  const productForm = document.getElementById('product-form');
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const parseList = (str) =>
      (str || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    currentImages = parseList(formData.get('images'));
    const payload = {
      name: formData.get('name'),
      category: formData.get('category'),
      price: parseFloat(formData.get('price')),
      wholesalePrice: formData.get('wholesalePrice')
        ? parseFloat(formData.get('wholesalePrice'))
        : null,
      stock: parseInt(formData.get('stock'), 10),
      rating: parseFloat(formData.get('rating')) || 0,
      image: formData.get('image'),
      description: formData.get('description'),
      images: currentImages,
      videos: parseList(formData.get('videos')),
    };

    const isEditing = !!editingProductId;
    const url = isEditing ? `https://alecho-pesca.onrender.com/api/admin/products/${editingProductId}` : 'https://alecho-pesca.onrender.com/api/admin/products';
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json();
      return showMessage(err.error || 'Error al guardar producto', 'danger');
    }
    showMessage(isEditing ? 'Producto actualizado' : 'Producto guardado');
    if (isEditing) {
      editingProductId = null;
      productForm.querySelector('button[type="submit"]').textContent = 'Guardar producto';
    }
    productForm.reset();
    currentImages = [];
    renderImagePreview();
    await refreshProducts();
  });
}

async function editProduct(id) {
  const res = await fetch(`https://alecho-pesca.onrender.com/api/admin/products/${id}`, { credentials: 'include' });
  if (!res.ok) return showMessage('Producto no encontrado', 'danger');
  const product = await res.json();
  const form = document.getElementById('product-form');
  form.name.value = product.name;
  form.category.value = product.category;
  form.price.value = product.price;
  form.wholesalePrice.value = product.wholesalePrice || '';
  form.stock.value = product.stock;
  form.rating.value = product.rating;
  form.image.value = product.image;
  form.description.value = product.description || '';
  currentImages = product.images || [];
  form.images.value = currentImages.join('\n');
  renderImagePreview();
  form.videos.value = (product.videos || []).join('\n');

  const saveButton = form.querySelector('button[type="submit"]');
  saveButton.textContent = 'Actualizar producto';
  editingProductId = id;
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  await fetch(`https://alecho-pesca.onrender.com/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' });
  showMessage('Producto eliminado');
  await refreshProducts();
}

window.deleteReview = deleteReview;
window.updateUserType = updateUserType;
window.resetUserPassword = resetUserPassword;
window.deleteUser = deleteUser;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUser();
  await initAdmin();
});
