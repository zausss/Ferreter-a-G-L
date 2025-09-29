# 📄 GUÍA RÁPIDA - GESTIÓN DE FACTURAS

## 🎯 ACCESO AL SISTEMA

### **🖱️ A través del Menú Lateral:**
En cualquier página del sistema, en el menú vertical izquierdo:

```
📊 Ventas (+)
   ├── Nueva Venta
   ├── 📄 Gestión de Facturas  ← ¡AQUÍ!
   └── Resumen Ventas
```

### **🌐 URL Directa:**
- **Gestión de Facturas:** http://localhost:3000/facturas.html
- **Nueva Venta:** http://localhost:3000/venta.html

## 🏢 CONFIGURAR INFORMACIÓN DE EMPRESA

### **Método 1: Interfaz Web (Recomendado)**
1. Ve a **Gestión de Facturas**
2. Clic en "🏢 Configurar Empresa"
3. Llena todos los campos:
   - Nombre de la Empresa
   - NIT/RUT
   - Dirección
   - Teléfono
   - Email
   - Ciudad
   - Eslogan
4. Clic en "💾 Guardar Cambios"

### **Método 2: Edición Manual en HTML**
**Archivo:** `/views/venta.html` (líneas 268-273)
```html
<h2>FERRETERÍA J&L</h2>                    <!-- Cambiar nombre -->
<p>NIT: 123.456.789-0</p>                  <!-- Cambiar NIT -->
<p>Dirección: Calle Principal #123</p>     <!-- Cambiar dirección -->
<p>Teléfono: (123) 456-7890</p>           <!-- Cambiar teléfono -->
<p>Email: info@ferreteriagl.com</p>       <!-- Cambiar email -->
```

## 📋 FUNCIONALIDADES DISPONIBLES

### **✅ En Gestión de Facturas:**
- 🔍 **Buscar facturas** por número, cliente, fecha, estado
- 👁️ **Ver detalles** completos de cualquier factura
- 🖨️ **Imprimir facturas** individuales
- ❌ **Anular facturas** con registro de motivo
- 📊 **Paginar** resultados (20 facturas por página)
- 🏢 **Configurar empresa** (datos que aparecen en facturas)

### **⚡ Automático al hacer ventas:**
- 📄 **Se crea factura automáticamente** con cada venta
- 🔄 **Se actualiza inventario** automáticamente
- 💾 **Se guarda en base de datos** completa

## 📊 ESTADOS DE FACTURAS

| Estado | Color | Descripción |
|--------|-------|-------------|
| 🟢 **Activa** | Verde | Factura válida y vigente |
| 🔵 **Pagada** | Azul | Factura cobrada |
| 🟡 **Pendiente** | Amarillo | Pendiente de pago |
| 🔴 **Anulada** | Rojo | Factura cancelada |

## 🔧 ACCIONES DISPONIBLES

### **En cada factura puedes:**
- 👁️ **Ver** - Muestra todos los detalles y productos
- 🖨️ **Imprimir** - Abre ventana de impresión
- ❌ **Anular** - Solo facturas activas, requiere motivo

## 🎯 FLUJO RECOMENDADO

```
1. Configurar Empresa 🏢
   ↓
2. Hacer Venta Normal 💰
   ↓
3. Factura se Crea Automáticamente 📄
   ↓
4. Gestionar desde "Gestión de Facturas" 📋
```

## 🗄️ TABLAS DE BASE DE DATOS

El sistema creó estas 5 tablas automáticamente:
- **empresa_info** - Información de tu empresa
- **facturas** - Facturas principales
- **factura_detalles** - Productos de cada factura
- **facturas_historial** - Auditoría de cambios
- **configuracion_numeracion** - Control de numeración

## 💡 CONSEJOS

1. **Siempre configura la empresa primero** antes de generar facturas
2. **No elimines facturas** - mejor anúlalas para conservar auditoría
3. **Usa filtros** para encontrar facturas específicas rápidamente
4. **Las facturas se numeran automáticamente** con formato: FAC-YYYYMMDD-####

## 🚨 IMPORTANTE

- ✅ **Las facturas se conservan indefinidamente**
- ✅ **Cada cambio queda registrado en auditoría**
- ✅ **La numeración es automática y consecutiva**
- ✅ **El sistema funciona completamente sin internet** (excepto base de datos)
