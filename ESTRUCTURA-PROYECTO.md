# 📁 Estructura del Proyecto - Ferretería G&L

## 📋 **Organización de Archivos**

### 🗂️ **Carpetas Principales**

```
📦 Ferreter-a-G-L/
├── 🔧 config/           # Configuración de BD y aplicación
├── 🎮 controllers/      # Lógica de negocio (authController, ventaController, etc.)
├── 🗄️ database/         # Scripts SQL para estructura de BD
├── 🛡️ middleware/       # Autenticación y validaciones
├── 📊 models/           # Modelos de datos (Usuario, Producto)
├── 🌐 public/           # Recursos frontend
│   ├── 📄 css/         # Estilos (ventas.css, style.css, etc.)
│   ├── 🖼️ img/          # Imágenes y logos
│   └── ⚡ js/          # JavaScript frontend
├── 🚀 routes/           # Rutas de API (/auth, /ventas, /productos)
├── 🔧 scripts/          # Utilidades de desarrollo organizadas
│   ├── 🗄️ database/    # Scripts de BD (crear clientes, insertar datos)
│   ├── 🧪 testing/     # Scripts de pruebas de API
│   └── 💻 development/ # Herramientas de desarrollo
├── 🔍 sql/             # Consultas SQL adicionales
├── 🧪 tests/           # Tests automatizados (Jest)
│   ├── controllers/    # Tests de controladores
│   ├── integration/    # Tests de integración
│   ├── models/         # Tests de modelos
│   ├── performance/    # Tests de rendimiento
│   └── security/       # Tests de seguridad
├── 🔧 utils/           # Utilidades generales
└── 🎨 views/           # Templates HTML
```

### ✅ **Archivos Eliminados en Limpieza**

- `debug-filtros.html` (archivo de debug)
- `test-estado.html` (archivo de testing temporal)
- `test-funcionalidades-ventas.html` (archivo de testing temporal)
- `models/Usuario-new.js` (duplicado)
- `database/crear-tablas-facturas-simple.sql` (versión simplificada)
- **Tests duplicados**: Todos los archivos `-fixed`, `-fixed-2`, `-final`, `-mock`

### 🎯 **Archivos Principales por Funcionalidad**

#### 🛒 **Sistema de Ventas**
- `views/venta.html` - Interfaz principal
- `public/js/ventas.js` - Lógica frontend
- `public/css/ventas.css` - Estilos específicos
- `controllers/ventaController.js` - API backend
- `routes/ventaRoutes.js` - Rutas de ventas

#### 👥 **Gestión de Clientes**
- `views/clientes.html` - Interfaz de clientes
- `public/js/clientes.js` - Funcionalidad frontend
- `public/css/clientes.css` - Estilos de clientes
- `controllers/clienteController.js` - API de clientes
- `routes/clienteRoutes.js` - Rutas de clientes

#### 📦 **Inventario**
- `views/productos.html` - Gestión de productos
- `controllers/productoController.js` - Lógica de productos
- `models/productoModel.js` - Modelo de datos

#### 🔐 **Autenticación**
- `views/login.html` - Página de login
- `controllers/authController.js` - Lógica de autenticación
- `models/Usuario.js` - Modelo de usuario
- `middleware/auth.js` - Middleware de autenticación

### 📝 **Notas Importantes**

1. **Proyecto listo para producción**: Eliminados archivos de debug y testing temporal
2. **Estructura organizada**: Scripts agrupados por categoría
3. **Tests limpios**: Solo versiones estables de tests
4. **Sin duplicados**: Archivos únicos y necesarios
5. **Documentación actualizada**: Esta estructura refleja el estado actual

### 🚀 **Para el Desarrollo Futuro**

- **Nuevos features**: Agregar en carpetas correspondientes
- **Tests**: Usar solo los archivos base (sin sufijos)
- **Scripts**: Organizarlos en las subcarpetas apropiadas
- **Assets**: Mantener la estructura de `public/`

---
*Última actualización: 13 de octubre de 2025*
*Estado: Proyecto limpio y organizado* ✅