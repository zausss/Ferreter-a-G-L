# 🔍 ANÁLISIS DETALLADO DE CÓDIGO - Archivo por Archivo

## 📄 **1. app.js - Configuración Principal del Servidor**

### **¿Qué hace este archivo?**
Es el **cerebro** de la aplicación. Configura Express, conecta middleware y define rutas.

### **Código Clave a Estudiar:**
```javascript
// ¿Por qué estas librerías?
const express = require('express');          // Framework web
const path = require('path');                // Manejo de rutas de archivos  
const cookieParser = require('cookie-parser'); // Leer cookies del navegador
const { verificarToken } = require('./middleware/auth'); // Middleware personalizado

// ¿Qué hace esto?
app.use(express.static('public'));           // Servir archivos CSS, JS, imágenes
app.use(express.json());                     // Parsear JSON del frontend
app.use(express.urlencoded({ extended: true })); // Parsear formularios HTML
app.use(cookieParser());                     // Permitir leer cookies

// ¿Por qué este orden es importante?
app.use('/auth', authRoutes);                // Rutas de login (SIN protección)
app.use(verificarToken);                     // DESPUÉS: proteger todo lo demás
```

### **🤔 Preguntas para reflexionar:**
- ¿Qué pasa si cambio el orden del middleware?
- ¿Por qué `/auth` va ANTES de `verificarToken`?
- ¿Qué significa `express.static('public')`?

---

## 📄 **2. models/Usuario.js - Interacción con Base de Datos**

### **¿Qué hace este archivo?**
Se comunica con PostgreSQL para buscar usuarios y verificar contraseñas.

### **Código Clave a Estudiar:**
```javascript
// ¿Por qué estas librerías?
const bcrypt = require('bcrypt');            // Encriptar/verificar contraseñas
const pool = require('../config/database');  // Conexión a PostgreSQL

// ¿Cómo funciona esta consulta SQL?
const query = `
    SELECT 
        u.id, u.nombre_usuario, u.password_hash, u.activo,
        u.intentos_fallidos, u.ultimo_acceso,
        e.nombre_completo, e.correo_electronico,
        c.rol_sistema
    FROM usuarios_sistema u
    INNER JOIN empleados e ON u.empleado_id = e.id  -- ¿Por qué INNER JOIN?
    INNER JOIN cargos c ON e.cargo_id = c.id        -- ¿Qué información obtengo?
    WHERE u.nombre_usuario = $1 AND u.activo = true -- ¿Por qué estos filtros?
`;

// ¿Cómo funciona la verificación de contraseña?
static async verificarPassword(passwordTextoPlano, passwordHash) {
    return await bcrypt.compare(passwordTextoPlano, passwordHash);
    // bcrypt.compare() hace:
    // 1. Toma la contraseña que escribió el usuario
    // 2. La encripta con el mismo "salt" 
    // 3. Compara con el hash guardado en BD
    // 4. Retorna true/false
}
```

### **🤔 Preguntas para reflexionar:**
- ¿Por qué no guardamos contraseñas en texto plano?
- ¿Qué es un INNER JOIN y por qué lo usamos?
- ¿Cómo funciona async/await?

---

## 📄 **3. controllers/authController.js - Lógica de Negocio**

### **¿Qué hace este archivo?**
Procesa el formulario de login, verifica credenciales y genera tokens JWT.

### **Código Clave a Estudiar:**
```javascript
// ¿De dónde vienen estos datos?
const { email_usuario, password } = req.body; // Del formulario HTML

// ¿Cómo funciona esta validación?
if (!email_usuario || !password) {
    return res.status(400).json({
        exito: false,
        mensaje: 'Email y contraseña son requeridos'
    });
}

// ¿Qué información guardamos en el JWT?
const tokenPayload = {
    id: usuario.id,
    nombre_usuario: usuario.nombre_usuario,
    rol: usuario.rol_sistema,
    nombre_completo: usuario.nombre_completo
};

// ¿Cómo generamos el token?
const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: '24h'  // Token expira en 24 horas
});

// ¿Por qué httpOnly: true?
res.cookie('token', token, {
    httpOnly: true,    // JavaScript no puede acceder (seguridad)
    secure: false,     // Para desarrollo (true en producción)
    maxAge: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
});
```

### **🤔 Preguntas para reflexionar:**
- ¿Qué información NO debe ir en un JWT?
- ¿Por qué usamos cookies httpOnly?
- ¿Qué pasa si el token expira?

---

## 📄 **4. middleware/auth.js - Seguridad y Protección**

### **¿Qué hace este archivo?**
Verifica que el usuario esté logueado antes de acceder a páginas protegidas.

### **Código Clave a Estudiar:**
```javascript
// ¿De dónde viene el token?
const token = req.cookies.token; // De la cookie que enviamos en login

// ¿Qué pasa si no hay token?
if (!token) {
    return res.redirect('/login.html?error=no_autorizado');
}

try {
    // ¿Cómo verificamos que el token es válido?
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ¿Qué guardamos en req.usuario?
    req.usuario = decoded; // Información del usuario para usar después
    
    next(); // Continuar al siguiente middleware/controlador
    
} catch (error) {
    // Token inválido o expirado
    res.clearCookie('token'); // Limpiar cookie inválida
    return res.redirect('/login.html?error=sesion_expirada');
}
```

### **Middleware de Roles:**
```javascript
// ¿Cómo controlamos acceso por roles?
function soloAdministradores(req, res, next) {
    if (req.usuario.rol !== 'Administrador') {
        return res.status(403).json({
            exito: false,
            mensaje: 'Acceso denegado. Solo administradores.'
        });
    }
    next();
}
```

### **🤔 Preguntas para reflexionar:**
- ¿Por qué verificamos el token en cada petición?
- ¿Qué significa `next()` en middleware?
- ¿Cómo funciona el control de roles?

---

## 📄 **5. config/database.js - Conexión a PostgreSQL**

### **¿Qué hace este archivo?**
Configura la conexión a la base de datos PostgreSQL.

### **Código Clave a Estudiar:**
```javascript
// ¿Por qué Pool en lugar de conexión simple?
const pool = new Pool({
    // Pool = grupo de conexiones reutilizables
    // Más eficiente que crear/cerrar conexión cada vez
    user: process.env.DB_USER,     // Usuario de PostgreSQL
    host: process.env.DB_HOST,     // Servidor (localhost)
    database: process.env.DB_NAME, // Nombre de la BD
    password: process.env.DB_PASSWORD, // Contraseña
    port: process.env.DB_PORT,     // Puerto (5432)
    max: 10,                       // Máximo 10 conexiones simultáneas
    idleTimeoutMillis: 30000,      // Cerrar conexión inactiva después 30s
});

// ¿Cómo funciona una consulta?
pool.query('SELECT * FROM usuarios', (err, result) => {
    // result.rows = array con los datos
    // err = error si algo sale mal
});
```

### **🤔 Preguntas para reflexionar:**
- ¿Por qué usar variables de entorno (.env)?
- ¿Qué ventajas tiene un Pool de conexiones?
- ¿Qué pasa si la BD no está disponible?

---

## 📄 **6. utils/database-tools.js - Herramientas de Administración**

### **¿Qué hace este archivo?**
Proporciona comandos para administrar usuarios (encriptar contraseñas, verificar datos).

### **Código Clave a Estudiar:**
```javascript
// ¿Cómo encriptamos contraseñas existentes?
async function encriptarContrasenas() {
    // 1. Buscar usuarios con contraseñas sin encriptar
    const usuarios = await pool.query(
        'SELECT id, password_hash FROM usuarios_sistema WHERE LENGTH(password_hash) < 50'
    );
    
    // 2. Encriptar cada contraseña
    for (const usuario of usuarios.rows) {
        const hashEncriptado = await bcrypt.hash(usuario.password_hash, 10);
        // bcrypt.hash(contraseña, saltRounds)
        // saltRounds = 10 es un buen balance seguridad/velocidad
        
        // 3. Actualizar en base de datos
        await pool.query(
            'UPDATE usuarios_sistema SET password_hash = $1 WHERE id = $2',
            [hashEncriptado, usuario.id]
        );
    }
}

// ¿Cómo usar desde terminal?
if (require.main === module) {
    // Solo se ejecuta si llaman directamente este archivo
    const comando = process.argv[2]; // Tercer argumento de terminal
    
    switch (comando) {
        case 'encriptar':
            encriptarContrasenas();
            break;
        case 'usuarios':
            verificarTodosLosUsuarios();
            break;
        default:
            mostrarAyuda();
    }
}
```

### **🤔 Preguntas para reflexionar:**
- ¿Por qué saltRounds = 10?
- ¿Cómo funciona process.argv?
- ¿Qué ventajas tienen las herramientas CLI?

---

## 📄 **7. views/login.html - Frontend del Sistema**

### **¿Qué hace este archivo?**
Presenta el formulario de login al usuario.

### **Código Clave a Estudiar:**
```html
<!-- ¿Por qué estos atributos en el form? -->
<form action="/auth/login" method="POST" id="loginForm">
    <!-- action: ¿A dónde enviar datos? -->
    <!-- method: GET vs POST, ¿cuál usar para login? -->
    
    <!-- ¿Por qué estos nombres específicos? -->
    <input type="email" name="email_usuario" required>
    <!-- name="email_usuario" debe coincidir con req.body.email_usuario -->
    
    <input type="password" name="password" required>
    <!-- name="password" debe coincidir con req.body.password -->
    
    <button type="submit">Iniciar Sesión</button>
</form>

<script>
// ¿Cómo manejamos la respuesta del servidor?
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // No recargar página
    
    const formData = new FormData(this);
    const response = await fetch('/auth/login', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    
    if (result.exito) {
        window.location.href = '/menu.html'; // Redirigir si éxito
    } else {
        // Mostrar error al usuario
        alert(result.mensaje);
    }
});
</script>
```

### **🤔 Preguntas para reflexionar:**
- ¿Por qué usar method="POST" para login?
- ¿Qué es preventDefault() y por qué lo uso?
- ¿Cómo se comunica frontend con backend?

---

## 🎯 **FLUJO COMPLETO DE UNA PETICIÓN**

### **Ejemplo: Usuario hace login**

1. **Frontend (login.html):**
   ```javascript
   // Usuario llena formulario y da click "Iniciar Sesión"
   fetch('/auth/login', {
       method: 'POST',
       body: { email_usuario: 'daniel', password: '3218' }
   })
   ```

2. **Rutas (routes/auth.js):**
   ```javascript
   // Express recibe la petición POST /auth/login
   router.post('/login', authController.procesarLogin);
   ```

3. **Controlador (controllers/authController.js):**
   ```javascript
   // Extraer datos del formulario
   const { email_usuario, password } = req.body;
   
   // Buscar usuario en base de datos
   const usuario = await Usuario.buscarParaLogin(email_usuario);
   ```

4. **Modelo (models/Usuario.js):**
   ```javascript
   // Consulta SQL a PostgreSQL
   const query = 'SELECT * FROM usuarios_sistema WHERE nombre_usuario = $1';
   const result = await pool.query(query, [email_usuario]);
   ```

5. **Base de Datos (PostgreSQL):**
   ```sql
   -- Ejecuta consulta y retorna datos del usuario
   SELECT u.id, u.password_hash, e.nombre_completo, c.rol_sistema
   FROM usuarios_sistema u...
   ```

6. **Verificación (models/Usuario.js):**
   ```javascript
   // Verificar contraseña con bcrypt
   const esValida = await bcrypt.compare(password, usuario.password_hash);
   ```

7. **Generar Token (controllers/authController.js):**
   ```javascript
   // Crear JWT con información del usuario
   const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, secret);
   res.cookie('token', token);
   ```

8. **Respuesta al Frontend:**
   ```javascript
   // Enviar respuesta JSON
   res.json({ exito: true, mensaje: 'Login exitoso' });
   ```

9. **Redirección (login.html):**
   ```javascript
   // JavaScript redirige a página principal
   window.location.href = '/menu.html';
   ```

---

## 💡 **CONSEJOS PARA ESTUDIAR EL CÓDIGO**

### **📝 Técnica de Estudio:**
1. **Lee archivo completo** una vez sin preocuparte por entender todo
2. **Identifica funciones principales** de cada archivo  
3. **Busca patrones repetidos** (async/await, try/catch, etc.)
4. **Haz preguntas** sobre cada línea que no entiendas
5. **Dibuja diagramas** del flujo de datos

### **🔧 Experimentos Prácticos:**
1. **Cambiar mensajes de error** y ver qué pasa
2. **Agregar console.log()** para ver valores de variables
3. **Comentar líneas** para ver qué se rompe
4. **Crear usuarios de prueba** con roles diferentes

### **📚 Conceptos a Investigar:**
- **Promises y async/await**: ¿Por qué son necesarios?
- **Middleware pattern**: ¿Cómo funciona en Express?
- **JWT vs Sessions**: ¿Cuáles son las diferencias?
- **SQL Injection**: ¿Cómo lo prevenimos con $1, $2?
- **CORS**: ¿Qué es y cuándo lo necesitamos?

---

**🎓 ¡Con esta guía puedes estudiar cada parte del sistema paso a paso!**
