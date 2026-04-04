# Alecho Pesca

Proyecto de ejemplo: tienda de artículos de pesca "Alecho Pesca" con frontend moderno y backend en Node.js + Express.

## Estructura

```
/fishing-store
 ├── /data
 │   ├── db.json (persistencia de datos)
 │   └── sessions.sqlite (sesiones)
 ├── /public
 │   ├── index.html
 │   ├── products.html
 │   ├── contact.html
 │   ├── account.html
 │   ├── cart.html
 │   ├── orders.html
 │   ├── admin.html
 │   ├── css/
 │   │   └── style.css
 │   ├── js/
 │   │   └── app.js
 │   └── images/ (vacío, se usan placeholders)
 ├── /routes
 │   ├── products.js
 │   ├── auth.js
 │   ├── contact.js
 │   ├── cart.js
 │   ├── orders.js
 │   ├── admin.js
 │   └── payment.js
 ├── /controllers
 │   ├── productController.js
 │   ├── authController.js
 │   ├── contactController.js
 │   ├── cartController.js
 │   ├── orderController.js
 │   ├── adminController.js
 │   └── paymentController.js
 ├── /models
 │   ├── productModel.js
 │   └── userModel.js
 ├── server.js
 ├── package.json
 └── README.md
```

## Características

- Diseño responsive con Bootstrap
- Navbar global con logo Alecho Pesca, buscador, carrito y acceso a la sección “Cuenta” (perfil y configuración)
- Páginas de inicio, catálogo, contacto, carrito, pedidos, cuenta y panel de administración
- Página de cuenta con perfil editable (nombre, ubicación, contraseña) y acceso directo al panel de administración para admins
- Carrito de compras guardado en `localStorage` (interfaz cliente)
- Autenticación con sesiones persistentes (SQLite) y contraseñas hasheadas con bcrypt
- Roles de usuario (minorista/mayorista) con descuentos automáticos
- Administración de productos (stock, imágenes y categorías)
- Pagos simulados con múltiples métodos y recargos configurables
- Persistencia de datos en `data/db.json` (productos, usuarios, pedidos, configuraciones)
- Filtros y paginación real en el catálogo
- Mensajes de éxito/error y animaciones suaves mediante Bootstrap

## Ejecución en local

1. Asegúrate de tener instalado Node.js (>=14).
2. Abre una terminal en `fishing-store`.
3. Ejecuta:
   ```bash
   npm install
   npm run init-admin  # Crear usuario administrador
   npm start # o npm run dev si utilizas nodemon
   ```
4. Abre tu navegador en https://alecho-pesca.onrender.com

### Usuario Administrador

Para acceder al panel de administración, usa estas credenciales:

- **Email**: admin@alechopesca.com
- **Contraseña**: admin123

Si necesitas recrear el usuario administrador, ejecuta:

```bash
npm run init-admin
```

Los archivos HTML se sirven de forma estática; las llamadas a la API usan los endpoints definidos en `server.js`.

> Nota: por defecto los datos se guardan en `data/db.json` y las sesiones en `data/sessions.sqlite`. Si quieres usar una "base de datos real" puedes ejecutar con `DB_TYPE=sqlite` para que almacene usuarios, productos y pedidos en `data/db.sqlite`.
>
> Para habilitar Mercado Pago real, define `MERCADOPAGO_ACCESS_TOKEN` o ingrésalo desde el panel de administrador.

## Mejoras ya implementadas ✅

- ✅ Persistencia local con `data/db.json` (y opcional `data/db.sqlite` con `DB_TYPE=sqlite`) y sesiones guardadas en `data/sessions.sqlite`
- ✅ Rutas protegidas para realizar checkout (requiere iniciar sesión)
- ✅ Contraseñas hasheadas (bcrypt) y sesiones persistentes
- ✅ Paginación real y filtros en el catálogo
- ✅ Panel de administración con gestión de productos, stock e impuestos de pago
- ✅ Integración con PostgreSQL para persistencia "real"
- ✅ Integración (opcional) con Mercado Pago para pago real (requiere token)

## Configuración de PostgreSQL

Para usar PostgreSQL como base de datos principal:

1. **Instalar PostgreSQL**: Descarga e instala PostgreSQL desde https://www.postgresql.org/

2. **Crear base de datos**:
   ```sql
   CREATE DATABASE alecho_pesca;
   CREATE USER postgres WITH PASSWORD 'tu-contraseña';
   GRANT ALL PRIVILEGES ON DATABASE alecho_pesca TO postgres;
   ```

3. **Configurar variables de entorno**:
   - Copia `.env.example` a `.env`
   - Modifica las variables de PostgreSQL:
     ```
     DB_TYPE=postgresql
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=alecho_pesca
     DB_USER=postgres
     DB_PASSWORD=tu-contraseña-postgres
     ```
   - Asegúrate de tener MongoDB o un URI válido para sesiones si usas `connect-mongo`:
     ```
     MONGO_URL=mongodb://127.0.0.1:27017/alecho_pesca_sessions
     ```

4. **Migrar datos existentes** (opcional):
   ```bash
   npm run db:migrate
   ```

5. **Sincronizar base de datos** (crea tablas automáticamente):
   ```bash
   npm run db:sync
   ```

> **Nota**: Si no configuras PostgreSQL, la aplicación seguirá usando JSON por defecto (`DB_TYPE=json`).

## Configuración de Mercado Pago

Para habilitar pagos reales con Mercado Pago:

1. **Crear cuenta en Mercado Pago**:
   - Ve a https://www.mercadopago.com.ar/developers
   - Crea una aplicación y obtén tus credenciales

2. **Configurar credenciales**:
   ```bash
   # En tu archivo .env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   MERCADOPAGO_PUBLIC_KEY=APP_USR-...
   ```

3. **Configurar webhooks** (opcional):
   - En tu panel de Mercado Pago, configura la URL del webhook:
   - `https://tu-dominio.com/api/payment/webhook`
   - Esto permite actualizar automáticamente el estado de los pagos

### Métodos de Pago Soportados

La integración incluye soporte completo para:

- **Tarjetas de Crédito**: Visa, Mastercard, American Express, etc.
- **Tarjetas de Débito**: Todos los bancos adheridos
- **Cuenta Digital**: Mercado Pago, Mercado Crédito
- **Transferencias Bancarias**: Desde cualquier banco
- **Efectivo**: Pago en tienda física

### Características Avanzadas

- ✅ **Cuotas**: Hasta 12 cuotas configurables
- ✅ **Webhooks**: Actualización automática de estados
- ✅ **Reembolsos**: Gestión de reembolsos desde el admin
- ✅ **Múltiples Bancos**: Soporte para todos los bancos argentinos
- ✅ **Validación**: Verificación de datos de tarjetas
- ✅ **Seguridad**: Encriptación PCI compliant

## Próximos pasos (opcional)

- ✅ Integrar MongoDB / PostgreSQL para persistencia "real"
- ✅ Conectar un gateway de pago real (Mercado Pago, Stripe, etc.)
- Migrar UI a un framework (React/Vue) con componentes reutilizables

---

¡Listo para empezar a pescar ventas con Alecho Pesca! 🎣
