# 🚀 DESPLIEGUE RÁPIDO - Opciones Gratuitas

## 🎯 **OPCIÓN 1: RENDER.COM (RECOMENDADO)**

### **Pasos súper rápidos:**
1. **Ir a:** https://render.com
2. **Registrarse** con GitHub
3. **New + → Web Service**
4. **Conectar:** `zausss/Ferreter-a-G-L`
5. **Configurar:**
   - Build Command: `npm install`
   - Start Command: `npm start`
6. **Variables de entorno:**
   ```
   DB_HOST=aws-1-us-east-2.pooler.supabase.com
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres.zleuzjtbfmjbtawpqsqy
   DB_PASSWORD=Guitarra01
   PORT=10000
   NODE_ENV=production
   JWT_SECRET=995ed8af928528c96d80cf05204aab754d267af0a0f738929a2bf327f0c5ad273b9503305ff8293a5339eece52ccd49a6bc1dec971f7c24bae6b694dd8e73e2c
   SESSION_SECRET=2b3513493fcdd9b2135f600bf5bd1743a713838e28748b9de19204d0ac3c840a83b198be57f051c3124c5f44451ff39421ac69848a53414765530524a8ac1eb7
   ```
7. **Create Web Service**

**✅ Listo! Tu app estará en línea en 5-10 minutos**

---

## 🎯 **OPCIÓN 2: VERCEL**

### **Si Render no funciona:**
1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Desde tu proyecto:**
   ```bash
   vercel
   ```

3. **Seguir wizard:**
   - Deploy → Yes
   - Project name → ferreteria-jyl
   - Framework → Other
   - Build Command → npm install
   - Output Directory → ./
   - Development Command → npm run dev

4. **Configurar variables en dashboard**

---

## 🎯 **OPCIÓN 3: NETLIFY**

1. **Ir a:** https://netlify.com
2. **New site from Git**
3. **Connect GitHub**
4. **Deploy settings:**
   - Build command: `npm install && npm run build`
   - Publish directory: `./`

---

## 📊 **COMPARACIÓN RÁPIDA:**

| Servicio | Tiempo setup | Facilidad | Recomendación |
|----------|--------------|-----------|---------------|
| **Render** | 5 min | ⭐⭐⭐⭐⭐ | 🏆 MEJOR |
| **Vercel** | 3 min | ⭐⭐⭐⭐ | 🥈 Muy bueno |
| **Netlify** | 4 min | ⭐⭐⭐ | 🥉 Bueno |

---

## 🚀 **¿Cuál prefieres probar primero?**

**Mi recomendación: Render.com** - Es el más similar a Railway y muy confiable.
