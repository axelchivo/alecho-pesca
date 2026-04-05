const fetch = require('node-fetch');

async function testAdminLogin() {
  console.log('🔍 Probando login de administrador...\n');

  try {
    // 1. Hacer login
    console.log('1. Intentando login...');
    const loginResponse = await fetch('https://alecho-pesca.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@alechopesca.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.log('❌ Login falló');
      return;
    }

    // 2. Verificar que la respuesta incluye la URL con parámetros
    console.log('\n2. Verificando respuesta de login...');
    if (loginData.redirectUrl && loginData.redirectUrl.includes('authenticated=true')) {
      console.log('✅ Login exitoso - URL con parámetros generada correctamente');
      console.log('Redirect URL:', loginData.redirectUrl);
    } else {
      console.log('❌ Login exitoso pero URL no contiene parámetros de autenticación');
    }

    // 3. Verificar endpoint /me
    console.log('\n3. Verificando endpoint /me...');
    const meResponse = await fetch('https://alecho-pesca.onrender.com/api/auth/me', {
      credentials: 'include'
    });
    const meData = await meResponse.json();
    console.log('Me response:', meData);

    if (meResponse.ok && meData.user && meData.user.isAdmin) {
      console.log('✅ Usuario admin verificado correctamente');
    } else {
      console.log('❌ Verificación de admin falló');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testAdminLogin();