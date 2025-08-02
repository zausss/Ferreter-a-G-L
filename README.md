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
- ✅ Herramientas de administración

## 📄 Licencia
MIT License

## 👨‍💻 Autor
Daniel Esteban Vargas Garcia - Proyecto de Graduación
