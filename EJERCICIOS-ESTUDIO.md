# 🎯 EJERCICIOS Y PREGUNTAS DE ESTUDIO
## Para Entender Completamente el Sistema

---

## 📝 **CUESTIONARIO DE COMPRENSIÓN**

### **🏗️ Arquitectura General**

1. **¿Qué es MVC y por qué lo usamos?**
   - Explica con tus palabras qué hace cada capa
   - ¿Qué pasaría si mezcláramos todo en un solo archivo?

2. **¿Por qué separamos frontend y backend?**
   - ¿Qué ventajas tiene esta separación?
   - ¿Cómo se comunican entre sí?

3. **¿Qué es middleware y por qué es importante?**
   - Da 3 ejemplos de middleware en nuestro sistema
   - ¿Qué pasa si cambiamos el orden del middleware?

### **🔐 Seguridad**

4. **¿Por qué no guardamos contraseñas en texto plano?**
   - ¿Cómo funciona bcrypt?
   - ¿Qué es un "salt" y para qué sirve?

5. **¿Qué es JWT y cuáles son sus ventajas?**
   - ¿Qué información guardamos en el token?
   - ¿Qué información NO deberíamos guardar?

6. **¿Por qué usamos cookies httpOnly?**
   - ¿Qué ataques previene?
   - ¿Qué diferencia hay con localStorage?

### **📊 Base de Datos**

7. **¿Por qué relacionamos usuarios con empleados?**
   - ¿Qué información obtenemos de cada tabla?
   - ¿Qué es un INNER JOIN?

8. **¿Cómo funciona el sistema de roles?**
   - ¿Dónde se define qué puede hacer cada rol?
   - ¿Cómo agregamos un nuevo rol?

9. **¿Qué es un Pool de conexiones?**
   - ¿Por qué no crear una conexión nueva cada vez?
   - ¿Qué configuraciones son importantes?

---

## 🛠️ **EJERCICIOS PRÁCTICOS**

### **Ejercicio 1: Rastrear el Flujo de Login** ⭐
**Objetivo**: Entender cómo viaja una petición por todo el sistema

**Instrucciones**:
1. Abre todos los archivos relacionados con login
2. Simula que el usuario escribe "daniel" y "3218" en el formulario
3. Traza paso a paso por todos los archivos:
   - ¿Dónde se capturan los datos?
   - ¿Qué archivo los recibe primero?
   - ¿Cómo llegan a la base de datos?
   - ¿Dónde se verifica la contraseña?
   - ¿Cómo se genera el token?
   - ¿Dónde se guarda la cookie?
   - ¿Cómo regresa la respuesta al usuario?

**Resultado Esperado**: Un diagrama o lista detallada del flujo completo.

### **Ejercicio 2: Modificar Mensajes de Error** ⭐
**Objetivo**: Entender cómo funcionan las respuestas del servidor

**Instrucciones**:
1. Ve a `controllers/authController.js`
2. Cambia el mensaje "Credenciales incorrectas" por "Usuario o contraseña incorrecta"
3. Guarda y prueba haciendo login con datos incorrectos
4. ¿Dónde aparece el nuevo mensaje?
5. Cambia también el mensaje de "Usuario no encontrado"

**Resultado Esperado**: Comprenderás cómo el backend comunica errores al frontend.

### **Ejercicio 3: Agregar console.log para Debug** ⭐⭐
**Objetivo**: Aprender a hacer debugging

**Instrucciones**:
1. Agrega `console.log()` en estos puntos:
   ```javascript
   // En authController.js
   console.log('Datos recibidos:', req.body);
   console.log('Usuario encontrado:', usuario);
   console.log('Token generado:', token);
   
   // En middleware/auth.js
   console.log('Token recibido:', token);
   console.log('Usuario decodificado:', decoded);
   ```
2. Haz login y observa los logs en la terminal
3. ¿Qué información ves en cada paso?

**Resultado Esperado**: Podrás ver exactamente qué datos se procesan en cada paso.

### **Ejercicio 4: Crear un Nuevo Rol** ⭐⭐⭐
**Objetivo**: Entender el sistema de permisos

**Instrucciones**:
1. Ve a la base de datos y agrega un nuevo cargo:
   ```sql
   INSERT INTO cargos (nombre_cargo, rol_sistema, activo)
   VALUES ('Vendedor', 'Vendedor', true);
   ```
2. Crea un empleado con este cargo
3. Crea un usuario para ese empleado
4. En `middleware/auth.js`, agrega:
   ```javascript
   function soloVendedores(req, res, next) {
       if (req.usuario.rol !== 'Vendedor') {
           return res.status(403).json({
               mensaje: 'Solo vendedores pueden acceder'
           });
       }
       next();
   }
   ```
5. Crea una ruta protegida solo para vendedores

**Resultado Esperado**: Un nuevo rol funcional en el sistema.

### **Ejercicio 5: Página de Perfil de Usuario** ⭐⭐⭐
**Objetivo**: Crear nueva funcionalidad usando lo aprendido

**Instrucciones**:
1. Crea `views/perfil.html` que muestre:
   - Nombre completo del usuario
   - Email
   - Rol
   - Último acceso
2. Crea la ruta GET `/perfil` en `routes/auth.js`
3. Crea controlador que envíe datos del usuario
4. Protege la ruta con middleware
5. Agrega enlace en `menu.html`

**Resultado Esperado**: Una página funcional de perfil de usuario.

---

## 🔍 **EXPERIMENTOS DE COMPRENSIÓN**

### **Experimento 1: ¿Qué pasa si...?**
Prueba estos cambios y observa qué sucede:

1. **Comenta la línea `app.use(verificarToken)`**
   - ¿Puedes acceder a páginas sin login?
   - ¿Por qué?

2. **Cambia la expiración del JWT a '1m' (1 minuto)**
   - ¿Qué pasa después de 1 minuto?
   - ¿Cómo se comporta el sistema?

3. **Elimina `httpOnly: true` de la cookie**
   - ¿Puedes ver la cookie en el navegador?
   - ¿Cuáles son las implicaciones de seguridad?

4. **Cambia el orden de rutas: pon `verificarToken` ANTES de `/auth`**
   - ¿Qué error obtienes?
   - ¿Por qué sucede esto?

### **Experimento 2: Debugging con Breakpoints**
Si usas VS Code:

1. Pon breakpoints en:
   - `authController.procesarLogin()` línea donde se busca el usuario
   - `middleware/auth.js` línea donde se verifica el token
   - `Usuario.buscarParaLogin()` línea de la consulta SQL

2. Usa el debugger para ver:
   - ¿Qué valores tienen las variables?
   - ¿En qué orden se ejecutan las funciones?
   - ¿Dónde se podría optimizar el código?

---

## 📊 **DIAGRAMAS PARA DIBUJAR**

### **Diagrama 1: Arquitectura del Sistema**
Dibuja cómo se conectan:
- Frontend (HTML/JS)
- Routes (Express)
- Controllers
- Models  
- Database (PostgreSQL)
- Middleware

### **Diagrama 2: Flujo de Autenticación**
Dibuja el proceso completo desde:
- Usuario escribe credenciales
- Hasta que ve el menú principal

### **Diagrama 3: Base de Datos**
Dibuja las relaciones entre:
- usuarios_sistema
- empleados
- cargos

---

## 🎯 **PREGUNTAS PARA ENTREVISTA TÉCNICA**

Si presentas este proyecto, prepárate para estas preguntas:

1. **"¿Por qué elegiste JWT en lugar de sesiones?"**
2. **"¿Cómo prevendrías ataques de fuerza bruta?"**
3. **"¿Qué harías si necesitas agregar autenticación de dos factores?"**
4. **"¿Cómo escalarías este sistema para miles de usuarios?"**
5. **"¿Qué mejoras de seguridad implementarías?"**
6. **"¿Cómo manejarías la renovación automática de tokens?"**
7. **"¿Qué patrones de diseño identificas en el código?"**

---

## 💡 **PROYECTOS DE EXTENSIÓN**

Una vez que domines el código actual, puedes agregar:

### **Nivel Básico** ⭐
- Recordar contraseña (reset password)
- Página de configuración de perfil
- Logs de acceso (auditoría)

### **Nivel Intermedio** ⭐⭐
- Autenticación de dos factores (2FA)
- Renovación automática de tokens
- API REST para móviles

### **Nivel Avanzado** ⭐⭐⭐
- OAuth con Google/Microsoft
- Rate limiting (límite de peticiones)
- Microservicios

---

## 📚 **RECURSOS ADICIONALES PARA PROFUNDIZAR**

### **Videos Recomendados:**
- "JWT Authentication Complete Tutorial" 
- "Node.js Security Best Practices"
- "PostgreSQL Relationships Explained"
- "Express.js Middleware Deep Dive"

### **Documentación a Leer:**
- [JWT.io - Introduction](https://jwt.io/introduction)
- [bcrypt - How it works](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### **Herramientas para Practicar:**
- [Postman](https://www.postman.com/) - Probar APIs
- [JWT Debugger](https://jwt.io/) - Decodificar tokens
- [pgAdmin](https://www.pgadmin.org/) - Gestión PostgreSQL

---

**🎓 Con estos ejercicios tendrás un dominio completo del sistema de autenticación.**

**💪 ¡A estudiar y experimentar! Cada error es una oportunidad de aprender.**
