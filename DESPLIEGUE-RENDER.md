# 🚀 Guía de Despliegue en Render.com (GRATIS)

## 🎯 **¿Por qué Render?**
- ✅ **750 horas gratis/mes** (suficiente para 24/7)
- ✅ **No se duerme** como Heroku
- ✅ **SSL automático**
- ✅ **Muy fácil de usar**
- ✅ **Compatible con Node.js**

---

## 📋 **Paso 1: Preparar proyecto**

### Ya tienes todo listo:
- ✅ Base de datos en Supabase
- ✅ Código en GitHub
- ✅ package.json configurado

---

## 🌐 **Paso 2: Crear cuenta en Render**

1. Ir a: https://render.com
2. Clic en "Get Started for Free"
3. Conectar con GitHub
4. Autorizar Render

---

## 🚀 **Paso 3: Crear Web Service**

### 3.1 En Render Dashboard:
1. Clic "New +" → "Web Service"
2. Conectar repositorio: `zausss/Ferreter-a-G-L`
3. Clic "Connect"

### 3.2 Configuración del servicio:
```
Name: ferreteria-jyl
Region: Oregon (US West)
Branch: main
Root Directory: (dejar vacío)
Runtime: Node
Build Command: npm install
Start Command: npm start
```

---

## ⚙️ **Paso 4: Variables de Entorno**

En "Environment Variables" agregar:

```bash
# Base de Datos Supabase
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.zleuzjtbfmjbtawpqsqy
DB_PASSWORD=Guitarra01

# Servidor
PORT=10000
NODE_ENV=production

# Autenticación (USAR CLAVES SEGURAS)
JWT_SECRET=995ed8af928528c96d80cf05204aab754d267af0a0f738929a2bf327f0c5ad273b9503305ff8293a5339eece52ccd49a6bc1dec971f7c24bae6b694dd8e73e2c

SESSION_SECRET=2b3513493fcdd9b2135f600bf5bd1743a713838e28748b9de19204d0ac3c840a83b198be57f051c3124c5f44451ff39421ac69848a53414765530524a8ac1eb7
```

⚠️ **IMPORTANTE**: PORT=10000 (Render usa este puerto)

---

## 🔧 **Paso 5: Auto Deploy**

### Configurar en "Settings":
- ✅ **Auto-Deploy**: Yes
- ✅ **Branch**: main
- ✅ **Build & deploy on every push**: Yes

---

## 🎉 **Paso 6: ¡Desplegar!**

1. Clic "Create Web Service"
2. Render automáticamente:
   - Clona tu repositorio
   - Ejecuta `npm install`
   - Ejecuta `npm start`
   - Te asigna URL pública

### URL de ejemplo:
```
https://ferreteria-jyl.onrender.com
```

---

## ⚡ **Ventajas de Render vs otras opciones:**

| Característica | Render | Vercel | Heroku | Railway |
|---------------|--------|---------|---------|----------|
| **Horas gratis** | 750/mes | Ilimitado | 550/mes | $5 crédito |
| **Se duerme?** | No | No | Sí (30min) | No |
| **Node.js** | ✅ Completo | ✅ Serverless | ✅ Completo | ✅ Completo |
| **Base de datos** | PostgreSQL gratis | Externa | PostgreSQL | Externa |
| **SSL** | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto |
| **Dominio personalizado** | ✅ Gratis | ✅ Gratis | ❌ Pago | ✅ Gratis |

---

## 🆓 **Límites del plan gratuito Render:**

- ✅ **750 horas/mes** = 31 días completos
- ✅ **500 MB RAM**
- ✅ **0.1 CPU**
- ✅ **Perfecto** para proyectos pequeños/medianos
- ✅ **SSL automático**
- ✅ **Actualizaciones automáticas**

---

## 🔄 **Alternativas si Render no funciona:**

### **Opción A: Vercel** 
```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel --prod
```

### **Opción B: Netlify Functions**
- Para frontend + API serverless
- Completamente gratis
- Muy rápido

### **Opción C: Heroku**
- Usar Heroku CLI
- Configurar Procfile
- Desplegar con git

---

## 🎯 **Recomendación final:**

**Empezar con Render.com** - Es la opción más similar a Railway pero gratuita.

Si necesitas más recursos después, puedes migrar a Railway u otros servicios de pago.

---

## 📞 **¿Necesitas ayuda?**

1. Empezar con Render
2. Si no funciona → Probar Vercel
3. Si necesitas más → Considerar Railway/Heroku paid

**¡Tu proyecto estará en línea en 10 minutos!** 🚀
