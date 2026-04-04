// controllers/contactController.js
// Recibe datos de formularios de contacto

exports.submit = (req, res) => {
  const { name, company, email, phone, message } = req.body;
  console.log('Contacto recibido:', { name, company, email, phone, message });
  // en una app real guardaríamos en DB o enviaríamos email
  res.json({ success: true, message: 'Gracias por contactarnos' });
};
