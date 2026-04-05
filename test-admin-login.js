// test-admin-login.js
// Script para probar el login del admin con manejo de cookies

const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');

async function testAdminLogin() {
  console.log('🔍 Probando login del admin con manejo de cookies...');

  // Crear un jar de cookies
  const jar = new CookieJar();

  try {
    // 1. Intentar login
    console.log('1. Enviando petición de login...');
    const loginResponse = await fetch('https://alecho-pesca.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      },
      body: JSON.stringify({
        email: 'admin@alechopesca.com',
        password: 'admin123'
      })
    });

    console.log('Status code:', loginResponse.status);

    // Guardar cookies de la respuesta
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('2. Cookies recibidas:', setCookieHeader);
      // Parsear y guardar cookies
      const cookies = setCookieHeader.split(',');
      for (const cookie of cookies) {
        try {
          await jar.setCookie(cookie, 'https://alecho-pesca.onrender.com');
        } catch (e) {
          console.log('Error parseando cookie:', cookie);
        }
      }
    }

    const loginData = await loginResponse.json();
    console.log('3. Respuesta del login:', JSON.stringify(loginData, null, 2));

    if (loginData.success && loginData.user) {
      console.log('✅ Login exitoso');
      console.log('   - User ID:', loginData.user._id || loginData.user.id);
      console.log('   - Email:', loginData.user.email);
      console.log('   - isAdmin:', loginData.user.isAdmin);

      // Obtener cookies guardadas
      const cookies = await jar.getCookies('https://alecho-pesca.onrender.com');
      console.log('4. Cookies guardadas:', cookies.map(c => `${c.key}=${c.value}`).join('; '));

      // 2. Verificar si la sesión se creó
      console.log('5. Verificando endpoint /me...');

      // Construir header de cookie
      const cookieHeader = cookies.map(c => `${c.key}=${c.value}`).join('; ');

      const meResponse = await fetch('https://alecho-pesca.onrender.com/api/auth/me', {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Node.js Test Script'
        }
      });

      const meData = await meResponse.json();
      console.log('Respuesta /me:', JSON.stringify(meData, null, 2));

      if (meData.user) {
        console.log('✅ Sesión creada correctamente');
        console.log('   - /me isAdmin:', meData.user.isAdmin);
      } else {
        console.log('❌ No hay sesión activa');
      }

    } else {
      console.log('❌ Login fallido');
      console.log('Error:', loginData.error);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

testAdminLogin();