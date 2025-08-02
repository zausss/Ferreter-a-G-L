# 📚 DOCUMENTACIÓN COMPLETA - Sistema de Autenticación
## Proyecto de Graduación - Ferretería G&L

---

## 🎯 **¿QUÉ SE IMPLEMENTÓ?**

Se creó un **sistema completo de autenticación** con:
- ✅ Login seguro con JWT
- ✅ Protección de rutas 
- ✅ Encriptación de contraseñas
- ✅ Control de acceso por roles
- ✅ Sesiones persistentes
- ✅ Middleware de seguridad

---

## 📁 **ESTRUCTURA DE ARCHIVOS CREADOS/MODIFICADOS**

```
📂 Ferreter-a-G-L/
├── 📄 app.js                           (MODIFICADO - Configuración principal)
├── 📄 package.json                     (MODIFICADO - Dependencias)
├── 📄 .env                             (Configuración sensible)
├── 📄 .gitignore                       (Protección de archivos)
│
├── 📂 config/
│   ├── 📄 config.js                    (Configuración centralizada)
│   └── 📄 database.js                  (Conexión a PostgreSQL)
│
├── 📂 models/
│   └── 📄 Usuario.js                   (NUEVO - Modelo de datos)
│
├── 📂 controllers/
│   └── 📄 authController.js            (NUEVO - Lógica de negocio)
│
├── 📂 middleware/
│   └── 📄 auth.js                      (NUEVO - Middleware de seguridad)
│
├── 📂 routes/
│   └── 📄 auth.js                      (NUEVO - Rutas de autenticación)
│
├── 📂 utils/
│   ├── 📄 database-tools.js            (NUEVO - Herramientas de BD)
│   ├── 📄 verificar-usuario.js         (Herramienta de verificación)
│   └── 📄 verificar-cargo.js           (Herramienta de verificación)
│
├── 📂 views/
│   ├── 📄 login.html                   (MODIFICADO - Formulario corregido)
│   ├── 📄 menu.html                    (Página principal protegida) 
│   └── 📄 categorias.html              (Página protegida)
│
└── 📄 GUIA-CREAR-USUARIOS.md           (NUEVO - Documentación)
```

---

## 🧠 **CONCEPTOS CLAVE A ESTUDIAR**

### 1. **🏗️ Arquitectura MVC (Modelo-Vista-Controlador)**
```
📊 Model (models/) ←→ 🎮 Controller (controllers/) ←→ 👁️ View (views/)
                            ↕️
                        🛡️ Middleware (middleware/)
                            ↕️
                        🚦 Routes (routes/)
```

### 2. **🔐 Autenticación vs Autorización**
- **Autenticación**: ¿Quién eres? (Login)
- **Autorización**: ¿Qué puedes hacer? (Roles/Permisos)

### 3. **🎫 JWT (JSON Web Tokens)**
- Token que contiene información del usuario
- Se envía en cada petición para verificar identidad
- Expira automáticamente (24h)

### 4. **🛡️ Middleware**
- Funciones que se ejecutan ANTES de llegar al controlador
- Verifican permisos, tokens, etc.
- Pueden bloquear o permitir el acceso

---

## 📖 **GUÍA DE ESTUDIO POR ARCHIVOS**

### **🔥 EMPEZAR POR AQUÍ: app.js**
```javascript
// ¿Qué hace este archivo?
// 1. Configurar Express
// 2. Conectar middleware
// 3. Definir rutas principales
// 4. Iniciar servidor

// ESTUDIAR:
- express.static() - ¿Para qué sirve?
- cookieParser() - ¿Por qué necesario?
- verificarToken - ¿Cómo protege rutas?
```

### **🗄️ SEGUNDO: models/Usuario.js**
```javascript
// ¿Qué hace este archivo?
// 1. Interactuar con PostgreSQL
// 2. Buscar usuarios en BD
// 3. Verificar contraseñas
// 4. Manejar intentos fallidos

// ESTUDIAR:
- bcrypt.compare() - ¿Cómo funciona?
- pool.query() - ¿Cómo hacer consultas SQL?
- async/await - ¿Por qué es necesario?
```

### **🎮 TERCERO: controllers/authController.js**
```javascript
// ¿Qué hace este archivo?
// 1. Procesar formulario de login
// 2. Validar credenciales
// 3. Generar tokens JWT
// 4. Manejar errores

// ESTUDIAR:
- req.body - ¿De dónde vienen los datos?
- jwt.sign() - ¿Cómo crear tokens?
- res.cookie() - ¿Cómo guardar en navegador?
```

### **🛡️ CUARTO: middleware/auth.js**
```javascript
// ¿Qué hace este archivo?
// 1. Verificar que el usuario esté logueado
// 2. Comprobar roles y permisos
// 3. Renovar información del usuario
// 4. Redirigir si no autorizado

// ESTUDIAR:
- req.cookies - ¿Cómo leer cookies?
- jwt.verify() - ¿Cómo validar tokens?
- next() - ¿Qué significa continuar?
```

### **🚦 QUINTO: routes/auth.js**
```javascript
// ¿Qué hace este archivo?
// 1. Definir URLs del sistema
// 2. Conectar URLs con controladores
// 3. Aplicar middleware específico

// ESTUDIAR:
- router.get() vs router.post()
- Orden de middleware
- Rutas públicas vs protegidas
```

---

## 💡 **PREGUNTAS PARA REFLEXIONAR MIENTRAS ESTUDIAS**

### **🔍 Sobre Seguridad:**
1. ¿Por qué no guardamos contraseñas en texto plano?
2. ¿Qué pasa si alguien roba el token JWT?
3. ¿Por qué usamos cookies httpOnly?

### **🏗️ Sobre Arquitectura:**
1. ¿Por qué separamos Model, Controller y Routes?
2. ¿Qué ventajas tiene el middleware?
3. ¿Cómo se comunican las diferentes partes?

### **📊 Sobre Base de Datos:**
1. ¿Por qué relacionamos usuarios con empleados?
2. ¿Qué ventaja tiene el sistema de roles?
3. ¿Cómo funciona el sistema de intentos fallidos?

---

## 🛠️ **EJERCICIOS PRÁCTICOS PARA ENTENDER**

### **Ejercicio 1: Rastrear una petición**
Sigue el flujo completo desde que el usuario hace click en "Login":
```
1. login.html (formulario) 
   → 2. POST /auth/login (ruta)
   → 3. authController.procesarLogin() (controlador)
   → 4. Usuario.buscarParaLogin() (modelo)
   → 5. PostgreSQL (base de datos)
   → 6. Respuesta y redirección
```

### **Ejercicio 2: Entender el middleware**
¿Qué pasa cuando visitas `/categorias.html`?
```
1. GET /categorias.html
   → 2. verificarToken (middleware)
   → 3. ¿Tiene token? ¿Es válido? ¿Usuario activo?
   → 4. Si OK: continúa, si NO: redirige a login
```

### **Ejercicio 3: Estudiar el JWT**
1. Decodifica un token JWT en https://jwt.io
2. ¿Qué información contiene?
3. ¿Por qué no podemos falsificarlo?

---

## 📝 **TÉRMINOS TÉCNICOS A DOMINAR**

| Término | Significado | ¿Dónde se usa? |
|---------|-------------|----------------|
| **bcrypt** | Librería para encriptar contraseñas | Usuario.js |
| **JWT** | Token de autenticación | authController.js |
| **Middleware** | Función intermedia en Express | auth.js |
| **Pool** | Grupo de conexiones a BD | database.js |
| **async/await** | Manejo de código asíncrono | Todos los archivos |
| **cookie** | Pequeño archivo en navegador | authController.js |
| **CRUD** | Create, Read, Update, Delete | Usuario.js |
| **MVC** | Modelo-Vista-Controlador | Toda la app |

---

## 🎯 **ORDEN SUGERIDO DE ESTUDIO**

### **Semana 1: Fundamentos**
- [ ] Leer app.js línea por línea
- [ ] Entender configuración de Express
- [ ] Estudiar conexión a PostgreSQL

### **Semana 2: Autenticación**
- [ ] Analizar models/Usuario.js
- [ ] Comprender bcrypt y hashing
- [ ] Estudiar JWT y cookies

### **Semana 3: Flujo Completo**
- [ ] Seguir flujo de login completo
- [ ] Entender middleware de protección
- [ ] Analizar manejo de errores

### **Semana 4: Arquitectura**
- [ ] Comprender patrón MVC
- [ ] Estudiar separación de responsabilidades
- [ ] Analizar escalabilidad del sistema

---

## 📚 **RECURSOS ADICIONALES PARA ESTUDIAR**

### **📖 Documentación Oficial:**
- [Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [node-postgres](https://node-postgres.com/)

### **🎥 Conceptos a buscar en YouTube:**
- "JWT Authentication Node.js"
- "Express Middleware Tutorial"
- "bcrypt password hashing"
- "MVC Architecture Explained"

---

## ✅ **TU PROYECTO ESTÁ COMPLETO CON:**

1. ✅ **Sistema de login profesional**
2. ✅ **Protección de rutas**
3. ✅ **Manejo seguro de contraseñas**
4. ✅ **Control de acceso por roles**
5. ✅ **Arquitectura escalable MVC**
6. ✅ **Herramientas de administración**
7. ✅ **Documentación completa**

---



**📞 Cualquier duda sobre el código, ¡pregunta!**
