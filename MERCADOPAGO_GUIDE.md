# Guía de Integración Mercado Pago - Alecho Pesca

## Resumen

Esta guía explica cómo configurar y usar la integración completa de Mercado Pago en la tienda Alecho Pesca, incluyendo soporte para tarjetas de crédito, débito y cuentas bancarias de múltiples bancos.

## Configuración Inicial

### 1. Crear Aplicación en Mercado Pago

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crea una cuenta de desarrollador
3. Crea una nueva aplicación:
   - **Nombre**: Alecho Pesca
   - **Tipo**: Online payments
   - **Modo**: Sandbox (para pruebas) / Production (para producción)

### 2. Obtener Credenciales

Después de crear la aplicación, obtén:

- **Access Token**: Para operaciones del backend
- **Public Key**: Para el SDK del frontend

### 3. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env`:

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 4. Configurar Webhooks (Recomendado)

En tu panel de Mercado Pago:

1. Ve a "Webhooks" en tu aplicación
2. Crea un nuevo webhook:
   - **URL**: `https://tu-dominio.com/api/payment/webhook`
   - **Eventos**: `payment` (todos los eventos de pago)

## Métodos de Pago Soportados

### Tarjetas de Crédito
- **Visa**
- **Mastercard**
- **American Express**
- **Naranja**
- **Cabal**
- **Diners Club**

### Tarjetas de Débito
- Todas las tarjetas de débito de bancos adheridos
- **Red Link**
- **Banelco**
- **Visa Débito**
- **Mastercard Débito**

### Cuentas Bancarias
- **Transferencias**: Desde cualquier banco
- **Mercado Pago**: Cuenta digital
- **Mercado Crédito**: Crédito instantáneo

### Otros Métodos
- **Efectivo**: Pago en puntos de venta
- **Rapipago**
- **Pago Fácil**

## Funcionalidades Implementadas

### ✅ Creación de Preferencias de Pago
- Items detallados con precios
- URLs de retorno configurables
- Información del comprador
- Referencia externa para tracking

### ✅ Webhooks y Actualización de Estados
- Recepción automática de notificaciones
- Actualización de estados de orden
- Mapeo de estados de Mercado Pago

### ✅ Gestión de Pagos (Admin)
- Consulta de información de pagos
- Cancelación de pagos
- Reembolsos parciales/completos

### ✅ Configuración Avanzada
- Cuotas (hasta 12)
- Métodos de pago excluidos/incluidos
- Validación de montos
- Categorización de productos

## Estados de Pago

| Estado Mercado Pago | Estado Orden | Descripción |
|-------------------|-------------|-------------|
| `pending` | `pending` | Pago iniciado, esperando confirmación |
| `approved` | `paid` | Pago aprobado |
| `in_process` | `pending` | Pago en proceso de validación |
| `rejected` | `cancelled` | Pago rechazado |
| `cancelled` | `cancelled` | Pago cancelado |
| `refunded` | `cancelled` | Pago reembolsado |
| `charged_back` | `cancelled` | Contracargo |

## Testing en Modo Sandbox

### Tarjetas de Prueba

**Aprobadas:**
- Visa: `4509 9535 6623 3704`
- Mastercard: `5031 4332 1540 6351`

**Rechazadas:**
- Visa: `4000 0000 0000 0002`

**Otros códigos:**
- `1234` (cualquier fecha futura)

### Cuentas de Prueba
- **Usuario**: `test_user_12345678@testuser.com`
- **Contraseña**: `qatest1234`

## Endpoints de la API

### Frontend
- `GET /api/payment/mercadopago/config` - Configuración pública

### Backend (Admin)
- `GET /api/payment/payment/:id` - Información de pago
- `POST /api/payment/webhook` - Webhook de Mercado Pago

## Manejo de Errores

### Errores Comunes

1. **Token Inválido**
   - Verificar credenciales en Mercado Pago
   - Asegurar que la aplicación esté en modo correcto (sandbox/production)

2. **Webhook No Recibe**
   - Verificar URL del webhook
   - Asegurar que el servidor sea accesible desde internet
   - Revisar logs del servidor

3. **Pago No Se Actualiza**
   - Verificar configuración de webhook
   - Revisar logs de webhook
   - Verificar ID de orden en referencia externa

### Logs y Debugging

Los logs importantes se muestran en:
- Consola del servidor Node.js
- Panel de desarrollador de Mercado Pago
- Logs de webhook en `/api/payment/webhook`

## Seguridad

### Medidas Implementadas
- ✅ Tokens almacenados de forma segura
- ✅ Validación de webhooks con firma
- ✅ Encriptación PCI compliant
- ✅ No almacenamiento de datos sensibles de tarjetas

### Recomendaciones Adicionales
- Usar HTTPS en producción
- Rotar tokens periódicamente
- Monitorear logs de seguridad
- Configurar alertas de fraude

## Producción

### Checklist Pre-Lanzamiento

- [ ] Credenciales de producción configuradas
- [ ] Webhook configurado con URL de producción
- [ ] Testing exhaustivo con tarjetas reales
- [ ] Configuración de cuotas y métodos de pago
- [ ] Monitoreo de logs activado
- [ ] Contacto de soporte de Mercado Pago

### Monitoreo

- Panel de Mercado Pago para métricas
- Logs de aplicación para debugging
- Alertas de errores de pago
- Reportes de conversión

## Soporte

- **Documentación Mercado Pago**: https://www.mercadopago.com.ar/developers
- **Comunidad**: https://www.mercadopago.com.ar/developers/community
- **Soporte**: https://www.mercadopago.com.ar/ayuda

## Actualizaciones

Esta integración se mantiene actualizada con las últimas APIs de Mercado Pago. Para actualizaciones, revisar:

- Changelog de Mercado Pago
- Actualizaciones del SDK de Node.js
- Cambios en la documentación oficial