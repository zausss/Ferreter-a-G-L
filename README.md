# 🔧 Ferretería J&L - Sistema de Gestión

Sistema web completo para gestionar productos, ventas e inventario en ferretería mediana.

## 🚀 Tecnologías
- **Backend**: Node.js + Express.js
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT + bcrypt
- **Arquitectura**: MVC (Modelo-Vista-Controlador)

## ✨ Características
- 🔐 Sistema de autenticación seguro con JWT
- 👥 Control de acceso por roles (Administrador/Cajero)
- 🛡️ Middleware de protección de rutas
- 🗄️ Base de datos relacional con PostgreSQL
- 📱 Interfaz responsive
- 🚪 Cerrar sesión con confirmación
- 🔑 Gestión de contraseñas encriptadas

## 📋 Requisitos
- Node.js v14 o superior
- PostgreSQL 12 o superior
- npm o yarn

## 🛠️ Instalación

1. **Clonar repositorio**
```bash
git clone https://github.com/zausss/Ferreter-a-G-L.git
cd Ferreter-a-G-L
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

4. **Configurar base de datos**
- Crear base de datos `ferreteria_J&L` en PostgreSQL
- Ejecutar scripts SQL para crear tablas
- Ver `GUIA-CREAR-USUARIOS.md` para crear usuarios

## 🚀 Ejecutar el proyecto
```bash
npm start
# o
node app.js
```

Visitar: `http://localhost:3000`

## 👤 Credenciales de Prueba
- **Usuario**: Daniel
- **Contraseña**: 3218
- **Rol**: Administrador

## 📁 Estructura del Proyecto
```
📂 Ferreter-a-G-L/
├── 📂 config/          # Configuración (DB, JWT)
├── 📂 controllers/     # Lógica de negocio
├── 📂 middleware/      # Middleware de seguridad
├── 📂 models/          # Modelos de datos
├── 📂 public/          # Archivos estáticos (CSS/JS)
├── 📂 routes/          # Rutas de la aplicación
├── 📂 utils/           # Herramientas auxiliares
├── 📂 views/           # Vistas HTML
└── 📄 app.js           # Archivo principal
```

## 🔧 Herramientas de Administración
```bash
# Encriptar contraseñas de usuarios
node utils/database-tools.js encriptar

# Ver todos los usuarios
node utils/database-tools.js usuarios

# Ayuda
node utils/database-tools.js
```

## 📚 Documentación
- `DOCUMENTACION-COMPLETA.md` - Documentación técnica detallada
- `GUIA-CREAR-USUARIOS.md` - Cómo crear usuarios en el sistema

## 🎓 Proyecto de Graduación
Este proyecto implementa:
- ✅ Arquitectura MVC profesional
- ✅ Autenticación y autorización segura
- ✅ Base de datos relacional normalizada
- ✅ Interface de usuario moderna
- ✅ Código limpio y documentado

## 🧪 Matriz de Casos de Prueba

| Caso | Requisito Funcional | Descripción | Entrada | Resultado Esperado | Responsable | Estado |
|------|---------------------|-------------|---------|--------------------|-------------|--------|
| CP01 | RF-01 | Login con usuario/email y contraseña válidos | Usuario/email y contraseña correctos | Acceso concedido, redirección al dashboard | [Tu Nombre] | Pendiente |
| CP02 | RF-02 | Login con credenciales incorrectas | Usuario/email o contraseña incorrectos | Mensaje de error, acceso denegado | [Tu Nombre] | Pendiente |
| CP03 | RF-03 | Login con campos vacíos | Usuario/email o contraseña vacíos | Mensaje de error, acceso denegado | [Tu Nombre] | Pendiente |
| CP04 | RF-04 | Listar categorías autenticado | Token JWT válido | Lista de categorías mostrada | [Tu Nombre] | Pendiente |
| CP05 | RF-05 | Crear nueva categoría (admin) | Nombre válido, usuario admin | Categoría creada correctamente | [Tu Nombre] | Pendiente |
| CP06 | RF-06 | Crear categoría con nombre vacío o repetido | Nombre vacío o ya existente | Mensaje de error, no se crea categoría | [Tu Nombre] | Pendiente |
| CP07 | RF-07 | Editar nombre de categoría (admin) | Nombre nuevo válido, usuario admin | Categoría editada correctamente | [Tu Nombre] | Pendiente |
| CP08 | RF-08 | Editar categoría sin permisos | Usuario sin rol admin | Mensaje de error, edición denegada | [Tu Nombre] | Pendiente |
| CP09 | RF-09 | Eliminar (soft delete) categoría (admin) | Usuario admin, categoría existente | Categoría eliminada lógicamente | [Tu Nombre] | Pendiente |
| CP10 | RF-10 | Eliminar categoría sin permisos | Usuario sin rol admin | Mensaje de error, eliminación denegada | [Tu Nombre] | Pendiente |
| CP11 | RF-11 | Buscar categorías por nombre | Nombre de categoría existente/parcial | Lista de coincidencias mostrada | [Tu Nombre] | Pendiente |
| CP12 | RF-12 | Acceso a rutas protegidas sin token | Sin token o token inválido | Acceso denegado, mensaje de autenticación | [Tu Nombre] | Pendiente |
| CP13 | RF-13 | Acceso a funciones admin sin rol | Usuario autenticado sin rol admin | Acceso denegado, mensaje de autorización | [Tu Nombre] | Pendiente |
| CP14 | RF-14 | Token expirado o inválido | Token expirado o alterado | Mensaje de error de token inválido/expirado | [Tu Nombre] | Pendiente |
- ✅ Herramientas de administración

## 📄 Licencia
MIT License

## 👨‍💻 Autor
Daniel Esteban Vargas Garcia  
LEUDIVIA TANGARIFE BELTRAN -Proyecto de Graduación