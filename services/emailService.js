const nodemailer = require('nodemailer');

const host = process.env.EMAIL_HOST;
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || `Alecho Pesca <${user || 'no-reply@alechopesca.com'}>`;

let transporter;
if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function isConfigured() {
  return Boolean(transporter);
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('Email SMTP no configurado. Mensaje de prueba:');
    console.log('Para:', to);
    console.log('Asunto:', subject);
    console.log('Texto:', text);
    console.log('HTML:', html);
    return;
  }

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

async function sendVerificationEmail(email, token) {
  const appUrl = process.env.APP_URL || 'https://alecho-pesca.onrender.com';
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;
  const subject = 'Verifica tu email en Alecho Pesca';
  const text = `Hola,

Gracias por registrarte en Alecho Pesca. Por favor verifica tu correo con este enlace:
${verifyUrl}

Si no solicitaste este registro, ignora este mensaje.`;
  const html = `
    <p>Hola,</p>
    <p>Gracias por registrarte en <strong>Alecho Pesca</strong>.</p>
    <p>Haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>Si no solicitaste este registro, ignora este mensaje.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

module.exports = {
  sendVerificationEmail,
  isConfigured,
};