# 🏪 Ferretería J&L - Sistema de Gestión Integral

Sistema web completo para la gestión de productos, ventas, inventario y facturación para ferreterías medianas.

## 🚀 Tecnologías

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Base de Datos**: PostgreSQL 12+
- **Autenticación**: JWT + bcrypt
- **Arquitectura**: MVC (Modelo-Vista-Controlador)
- **Seguridad**: Helmet.js, express-rate-limit, SQL injection prevention

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Sistema seguro con JWT tokens
- Control de acceso por roles (Administrador/Cajero)
- Middleware de protección de rutas
- Contraseñas encriptadas con bcrypt
- Sesiones persistentes con localStorage

### 📦 Gestión de Productos
- CRUD completo de productos
- Gestión de categorías
- Control de stock automático
- Búsqueda avanzada y filtros
- Códigos de producto únicos
- Cálculo automático de márgenes

### 💰 Sistema de Ventas
- Proceso de venta completo
- Carrito de compras dinámico
- Cálculo automático de IVA (19%)
- Múltiples métodos de pago
- Formateo en pesos colombianos
- Control de inventario en tiempo real

### 📄 Gestión de Facturas
- Generación automática de facturas
- Numeración secuencial
- Estados de factura (activa, anulada)
- Filtros avanzados (estado, fecha, cliente)
- Anulación de facturas con razón
- Configuración de datos de empresa

### � Características Técnicas
- Interfaz responsive y moderna
- Event listeners (no onclick handlers)
- Sistema de alertas personalizado
- Rate limiting para seguridad
- Content Security Policy (CSP)
- Manejo robusto de errores

## 📋 Requisitos del Sistema

- **Node.js**: v14 o superior
- **PostgreSQL**: v12 o superior
- **npm**: v6 o superior
- **Navegador**: Chrome, Firefox, Safari (versiones recientes)

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/zausss/Ferreter-a-G-L.git
cd Ferreter-a-G-L
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ferreteria_gl
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=3000
NODE_ENV=development
```

### 4. Configurar Base de Datos

1. **Crear base de datos en PostgreSQL:**
```sql
CREATE DATABASE ferreteria_gl;
```

2. **Ejecutar scripts de tablas:**
```bash
# Usar el script simplificado
psql -U tu_usuario -d ferreteria_gl -f database/crear-tablas-facturas-simple.sql
```

3. **Crear usuario administrador:**
```sql
-- Crear empleado
INSERT INTO empleados (cedula, nombre_completo, correo_electronico, cargo_id, activo) 
VALUES ('12345678', 'Administrador', 'admin@ferreteria.com', 1, true);

-- Crear usuario
INSERT INTO usuarios (empleado_id, nombre_usuario, contrasena_hash) 
VALUES (1, 'admin', '$2b$10$hashedpassword');
```

### 5. Ejecutar el Proyecto

```bash
npm start
```

Visitar: [http://localhost:3000](http://localhost:3000)

## 👤 Credenciales de Prueba

- **Usuario**: Daniel
- **Contraseña**: 3218
- **Rol**: Administrador

## 📁 Estructura del Proyecto

```
ferreter-a-gl/
├── app.js                 # Servidor principal
├── package.json           # Dependencias y scripts
├── .env                   # Variables de entorno
├── config/
│   ├── config.js         # Configuración general
│   └── database.js       # Conexión PostgreSQL
├── controllers/          # Lógica de negocio
│   ├── authController.js
│   ├── productoController.js
│   ├── ventaController.js
│   └── facturaController.js
├── middleware/
│   ├── auth.js           # Autenticación JWT
│   ├── validation.js     # Validaciones y seguridad
│   └── errorHandler.js   # Manejo de errores
├── routes/               # Rutas de la API
├── models/               # Modelos de datos
├── public/
│   ├── css/             # Estilos
│   ├── js/              # JavaScript frontend
│   └── img/             # Imágenes
├── views/               # Páginas HTML
└── database/            # Scripts SQL
```

## 🔧 Funcionalidades Implementadas

### Módulos Principales

1. **Autenticación y Usuarios**
   - Login/logout seguro
   - Control de roles
   - Sesiones persistentes

2. **Gestión de Productos**
   - CRUD completo
   - Categorías
   - Control de stock
   - Búsqueda avanzada

3. **Sistema de Ventas**
   - Carrito dinámico
   - Cálculo de IVA
   - Múltiples métodos de pago
   - Actualización de inventario

4. **Facturación**
   - Generación automática
   - Estados de factura
   - Filtros avanzados
   - Anulación controlada

## 🛡️ Seguridad Implementada

- **Autenticación**: JWT tokens seguros
- **Autorización**: Control de acceso por roles
- **Rate Limiting**: Protección contra ataques
- **CSP**: Content Security Policy
- **Validación**: Sanitización de inputs
- **SQL Injection**: Consultas parametrizadas
- **Contraseñas**: Encriptación con bcrypt

## 🚀 Despliegue

### Render.com (Recomendado)

1. **Conectar repositorio** en Render.com
2. **Configurar variables de entorno** en el dashboard
3. **Configurar base de datos** PostgreSQL
4. **Deploy automático** desde main branch

Ver `render.yaml` para configuración completa.

### Variables de Entorno para Producción

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=super_secret_key_production
```

## 🧪 Testing

El proyecto incluye pruebas completas:

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas específicas
npm run test:unit        # Pruebas unitarias
npm run test:integration # Pruebas de integración
npm run test:security    # Pruebas de seguridad
npm run test:performance # Pruebas de rendimiento
```

## 📚 Guías Rápidas

### Crear Nuevo Usuario

```sql
-- 1. Crear empleado
INSERT INTO empleados (cedula, nombre_completo, correo_electronico, cargo_id) 
VALUES ('123456789', 'Nombre Completo', 'email@test.com', 2);

-- 2. Crear usuario (contraseña: "password123")
INSERT INTO usuarios (empleado_id, nombre_usuario, contrasena_hash) 
VALUES (LASTVAL(), 'usuario', '$2b$10$...');
```

### Configurar Empresa

1. Ir a **Facturas** → **Configurar Empresa**
2. Llenar datos de la empresa
3. Los datos aparecerán en todas las facturas

### Procesar una Venta

1. Ir a **Ventas**
2. Buscar y agregar productos al carrito
3. Completar datos del cliente
4. Seleccionar método de pago
5. **Procesar Venta** → Se genera factura automáticamente

## 🔧 Mantenimiento

### Backup de Base de Datos

```bash
pg_dump -U usuario -h localhost ferreteria_gl > backup.sql
```

### Restaurar Base de Datos

```bash
psql -U usuario -h localhost ferreteria_gl < backup.sql
```

### Logs del Sistema

Los logs se guardan en la consola. Para producción:

```bash
pm2 start app.js --name ferreteria-gl --log-file logs/app.log
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Desarrollador

**Daniel** - Desarrollo completo del sistema
- GitHub: [@zausss](https://github.com/zausss)
- Proyecto: [Ferreter-a-G-L](https://github.com/zausss/Ferreter-a-G-L)

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

## 🔧 Administración
```bash
# Iniciar servidor
npm start

# Iniciar en modo desarrollo
npm run dev
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


## 📄 Licencia
MIT License

## 👨‍💻 Autor
Daniel Esteban Vargas Garcia  
LEUDIVIA TANGARIFE BELTRAN -Proyecto de Graduación