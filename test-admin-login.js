// test-admin-login.js
// Script para probar el login del admin con manejo de cookies

const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');

async function testSession() {
  console.log('🔍 Probando sesiones básicas...');

  // Crear un jar de cookies
  const jar = new CookieJar();

  try {
    // 1. Crear sesión de test
    console.log('1. Creando sesión de test...');
    const testResponse = await fetch('https://alecho-pesca.onrender.com/api/test-session', {
      headers: {
        'User-Agent': 'Node.js Test Script'
      }
    });

    console.log('Status code:', testResponse.status);

    // Imprimir headers
    console.log('Headers de respuesta:');
    for (const [key, value] of testResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Guardar cookies
    const setCookieHeader = testResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('✅ Cookies recibidas:', setCookieHeader);
      const cookies = setCookieHeader.split(',');
      for (const cookie of cookies) {
        try {
          await jar.setCookie(cookie, 'https://alecho-pesca.onrender.com');
        } catch (e) {
          console.log('Error parseando cookie:', cookie);
        }
      }
    } else {
      console.log('❌ No hay cookies set-cookie');
    }

    const testData = await testResponse.json();
    console.log('Respuesta test-session:', JSON.stringify(testData, null, 2));

    if (setCookieHeader) {
      // 2. Leer sesión
      console.log('2. Leyendo sesión...');
      const cookies = await jar.getCookies('https://alecho-pesca.onrender.com');
      const cookieHeader = cookies.map(c => `${c.key}=${c.value}`).join('; ');

      const readResponse = await fetch('https://alecho-pesca.onrender.com/api/test-session-read', {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Node.js Test Script'
        }
      });

      const readData = await readResponse.json();
      console.log('Respuesta test-session-read:', JSON.stringify(readData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

async function testAdminLogin() {
  console.log('\n🔍 Probando login del admin...');

  // Crear un jar de cookies
  const jar = new CookieJar();

  try {
    // Intentar login
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

    // Imprimir headers
    console.log('Headers de respuesta:');
    for (const [key, value] of loginResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const loginData = await loginResponse.json();
    console.log('Respuesta login:', JSON.stringify(loginData, null, 2));

  } catch (error) {
    console.error('❌ Error en login:', error.message);
  }
}

// Ejecutar tests
async function runTests() {
  await testSession();
  await testAdminLogin();
}

runTests();