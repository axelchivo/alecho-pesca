// services/productService.js
// Servicio de lógica de negocio para productos

const productModel = require('../models/productModel');

class ProductService {
  // Validar datos de producto
  validateProductData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('El nombre del producto es requerido');
      }
    }

    if (!isUpdate || data.price !== undefined) {
      if (data.price === undefined || isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0) {
        errors.push('El precio debe ser un número positivo');
      }
    }

    if (!isUpdate || data.category !== undefined) {
      if (
        !data.category ||
        typeof data.category !== 'string' ||
        data.category.trim().length === 0
      ) {
        errors.push('La categoría es requerida');
      }
    }

    if (data.stock !== undefined && (isNaN(parseInt(data.stock)) || parseInt(data.stock) < 0)) {
      errors.push('El stock debe ser un número entero no negativo');
    }

    return errors;
  }

  // Crear producto con validación
  createProduct(data) {
    const errors = this.validateProductData(data);
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    return productModel.create({
      ...data,
      price: parseFloat(data.price),
      stock: data.stock ? parseInt(data.stock) : 0,
      rating: data.rating ? parseFloat(data.rating) : 0,
    });
  }

  // Actualizar producto con validación
  updateProduct(id, data) {
    const errors = this.validateProductData(data, true);
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    const updateData = { ...data };
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.rating !== undefined) updateData.rating = parseFloat(data.rating);

    const product = productModel.update(id, updateData);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return product;
  }

  // Eliminar producto
  deleteProduct(id) {
    const success = productModel.remove(id);
    if (!success) {
      throw new Error('Producto no encontrado');
    }
    return true;
  }

  // Buscar productos con filtros
  searchProducts({ category, search, limit, offset } = {}) {
    let products = productModel.getAll();

    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    // Paginación
    const total = products.length;
    if (offset) products = products.slice(offset);
    if (limit) products = products.slice(0, limit);

    return { products, total };
  }

  // Obtener estadísticas de productos
  getProductStats() {
    const products = productModel.getAll();
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const averagePrice =
      totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;
    const categories = [...new Set(products.map((p) => p.category))];

    return {
      totalProducts,
      totalStock,
      averagePrice: Math.round(averagePrice * 100) / 100,
      categories: categories.length,
    };
  }
}

module.exports = new ProductService();
