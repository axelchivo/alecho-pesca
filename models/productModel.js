// models/productModel.js
// Maneja productos almacenados en data/db.json con control de stock y cambios por admin.

const { readDb, writeDb } = require('./db');

function getProducts() {
  const db = readDb();
  db.products = db.products || [];
  return db.products;
}

function saveProducts(products) {
  const db = readDb();
  db.products = products;
  writeDb(db);
}

function nextId(products) {
  if (!products.length) return 1;
  return Math.max(...products.map((p) => p.id)) + 1;
}

module.exports = {
  getAll: () => getProducts(),
  getById: (id) => getProducts().find((p) => p.id === parseInt(id)),
  filter: ({ category, search }) => {
    return getProducts().filter((p) => {
      const matchCat = category ? p.category === category : true;
      const matchSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
      return matchCat && matchSearch;
    });
  },
  create: ({
    name,
    price,
    wholesalePrice,
    category,
    rating = 0,
    image = '',
    stock = 0,
    description = '',
    images = [],
    videos = [],
  }) => {
    const products = getProducts();
    const newProduct = {
      id: nextId(products),
      name,
      price: parseFloat(price) || 0,
      wholesalePrice:
        typeof wholesalePrice !== 'undefined' && wholesalePrice !== null
          ? parseFloat(wholesalePrice)
          : null,
      category,
      rating: parseFloat(rating) || 0,
      image,
      images: Array.isArray(images) ? images : images ? [images] : [],
      videos: Array.isArray(videos) ? videos : videos ? [videos] : [],
      stock: parseInt(stock) || 0,
      description,
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
  },
  update: (id, updates) => {
    const products = getProducts();
    const product = products.find((p) => p.id === parseInt(id));
    if (!product) return null;
    Object.assign(product, updates);
    saveProducts(products);
    return product;
  },
  remove: (id) => {
    let products = getProducts();
    const initialLength = products.length;
    products = products.filter((p) => p.id !== parseInt(id));
    saveProducts(products);
    return products.length < initialLength;
  },
  adjustStock: (id, delta) => {
    const products = getProducts();
    const product = products.find((p) => p.id === parseInt(id));
    if (!product) return null;
    product.stock = Math.max(0, (product.stock || 0) + delta);
    saveProducts(products);
    return product.stock;
  },
};
