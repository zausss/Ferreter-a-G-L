# 🚀 Guía de Despliegue en Railway

## 📋 **Requisitos previos:**
- ✅ Base de datos configurada en Supabase
- ✅ Proyecto funcionando localmente
- ✅ Cuenta de GitHub (gratis)
- ✅ Cuenta de Railway (gratis)

---

## 🔧 **Paso 1: Preparar repositorio**

### 1.1 Verificar que el código esté actualizado:
```bash
git add .
git commit -m "Preparar para despliegue en Railway"
git push origin main
```

### 1.2 Verificar que .env NO está en el repositorio:
- ✅ Debe estar en .gitignore
- ✅ Configuración sensible se configura en Railway

---

## 🌐 **Paso 2: Configurar Railway**

### 2.1 Registrarse en Railway:
1. Ir a: https://railway.app
2. Hacer clic en "Start a New Project"
3. Conectar con GitHub
4. Autorizar Railway

### 2.2 Crear nuevo proyecto:
1. Click "Deploy from GitHub repo"
2. Seleccionar: `zausss/Ferreter-a-G-L`
3. Click "Deploy Now"

---

## ⚙️ **Paso 3: Configurar Variables de Entorno**

En Railway Dashboard → Settings → Variables:

```bash
# Base de Datos Supabase
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.zleuzjtbfmjbtawpqsqy
DB_PASSWORD=Guitarra01

# Servidor
PORT=$PORT
NODE_ENV=production

# Autenticación (CAMBIAR por valores seguros)
JWT_SECRET=tu_clave_jwt_super_secreta_produccion
JWT_EXPIRES_IN=24h

# Sesiones (CAMBIAR por valor seguro)
SESSION_SECRET=tu_clave_session_super_secreta_produccion
```

⚠️ **IMPORTANTE**: Cambiar JWT_SECRET y SESSION_SECRET por valores seguros

---

## 🔒 **Paso 4: Generar claves seguras**

### Usar Node.js para generar claves:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### O usar herramientas online:
- https://generate-secret.vercel.app/64
- https://randomkeygen.com/

---

## 🚀 **Paso 5: Desplegar**

1. **Railway detecta automáticamente** tu proyecto Node.js
2. **Lee package.json** y ejecuta `npm install`
3. **Ejecuta** `npm start` automáticamente
4. **Asigna una URL** pública automáticamente

### URL de ejemplo:
```
https://ferreteria-jyl-production.up.railway.app
```

---

## ✅ **Paso 6: Verificar despliegue**

### 6.1 Revisar logs:
- En Railway Dashboard → Deployments
- Ver logs de construcción y ejecución

### 6.2 Probar la aplicación:
- Acceder a la URL asignada
- Probar login/registro
- Verificar que la base de datos funciona

---

## 🔧 **Configuraciones adicionales**

### Si necesitas dominio personalizado:
1. Railway Settings → Domains
2. Agregar tu dominio
3. Configurar DNS

### Para actualizaciones automáticas:
- Cada push a `main` despliega automáticamente
- No necesitas hacer nada manual

---

## 🆓 **Límites del plan gratuito Railway:**

- ✅ **$5 USD/mes** de créditos gratis
- ✅ **Suficiente** para proyectos pequeños/medianos
- ✅ **Escalamiento automático**
- ✅ **SSL automático**
- ✅ **Dominio gratis**

---

## 🎯 **Resumen:**

1. **Subir código** a GitHub ✅
2. **Conectar Railway** con GitHub ✅
3. **Configurar variables** de entorno ✅
4. **¡Listo!** Tu app está en línea 🎉

### **Tu aplicación estará disponible 24/7 en internet**
