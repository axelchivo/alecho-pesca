// utils/sanitize.js
// Pequeñas utilidades para sanitizar datos antes de guardarlos o enviarlos.

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  // Eliminar etiquetas HTML básicas y escapar el resto
  return escapeHtml(trimmed.replace(/<\/?\w+[^>]*>/g, ''));
}

module.exports = {
  escapeHtml,
  sanitizeString,
};
