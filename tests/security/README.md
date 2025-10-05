# Pruebas de Seguridad - Ferretería G&L

## 📋 Descripción

Este directorio contiene un conjunto completo de pruebas de seguridad diseñadas para evaluar la resistencia de la aplicación contra ataques comunes de seguridad web.

## 🛡️ Tipos de Pruebas Implementadas

### 1. Pruebas Generales de Seguridad (`security-tests.js`)
- **SQL Injection**: 15+ payloads diferentes
- **Validación JWT**: Tokens inválidos, expirados, malformados
- **Headers de Seguridad**: X-Frame-Options, CSP, HSTS, etc.
- **Rutas Protegidas**: Verificación de autenticación

### 2. Pruebas Avanzadas SQL Injection (`sql-injection-advanced.js`)
- **Time-Based**: Detección de inyecciones basadas en tiempo
- **Union-Based**: Extracción de datos mediante UNION
- **Blind SQL**: Inyecciones ciegas con análisis de respuestas
- **Error-Based**: Aprovechamiento de mensajes de error

### 3. Pruebas Especializadas JWT (`jwt-security-tests.js`)
- **Bypass de Autenticación**: 10+ métodos de bypass
- **Tokens Maliciosos**: Algoritmo 'none', escalación de privilegios
- **Algoritmos Débiles**: Claves débiles, estructuras malformadas
- **Timing Attacks**: Análisis de tiempos de respuesta

## 🚀 Uso

### Instalación de Dependencias
```bash
npm install axios jsonwebtoken
```

### Ejecutar Todas las Pruebas
```bash
# Pruebas generales de seguridad
node tests/security/security-tests.js

# Pruebas avanzadas de SQL Injection
node tests/security/sql-injection-advanced.js

# Pruebas especializadas de JWT
node tests/security/jwt-security-tests.js
```

### Scripts NPM
Agregar al `package.json`:
```json
{
  "scripts": {
    "test:security": "node tests/security/security-tests.js",
    "test:security-sql": "node tests/security/sql-injection-advanced.js",
    "test:security-jwt": "node tests/security/jwt-security-tests.js",
    "test:security-all": "npm run test:security && npm run test:security-sql && npm run test:security-jwt"
  }
}
```

## 📊 Tipos de Vulnerabilidades Detectadas

### SQL Injection
- ✅ Inyecciones básicas (`' OR '1'='1`)
- ✅ Comandos destructivos (`DROP TABLE`)
- ✅ Extracción de datos (`UNION SELECT`)
- ✅ Inyecciones ciegas (Blind)
- ✅ Inyecciones basadas en tiempo
- ✅ Inyecciones basadas en errores

### JWT Security
- ✅ Tokens sin firma (algoritmo 'none')
- ✅ Tokens expirados
- ✅ Escalación de privilegios
- ✅ Bypass de autenticación
- ✅ Algoritmos débiles
- ✅ Timing attacks

### Headers de Seguridad
- ✅ X-Frame-Options (Clickjacking)
- ✅ X-Content-Type-Options (MIME sniffing)
- ✅ X-XSS-Protection
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy
- ✅ Referrer-Policy

## 🎯 Endpoints Probados

### Rutas de Autenticación
- `POST /auth/login`
- `POST /auth/registro`
- `GET /auth/verificar`

### API Endpoints
- `GET /api/productos`
- `GET /api/categorias`
- `GET /api/ventas`
- `GET /api/facturas`

### Rutas Protegidas
- `GET /dashboard`
- `GET /productos.html`
- `GET /categorias.html`
- `GET /facturas.html`

## 📈 Interpretación de Resultados

### Códigos de Estado Esperados
- **401/403**: ✅ Bueno - Rechaza acceso no autorizado
- **200**: ❌ Malo - Permite acceso sin autorización
- **302/301**: ⚠️ Precaución - Verificar destino de redirección

### Métricas de Seguridad
- **>95%**: 🟢 Sistema muy seguro
- **85-95%**: 🟡 Sistema seguro con mejoras menores
- **70-85%**: 🟠 Sistema requiere mejoras
- **<70%**: 🔴 Sistema crítico - atención inmediata

## 🔧 Configuración

### Variables de Entorno
```bash
BASE_URL=http://localhost:3000
JWT_SECRET=clave secreta_jwt
```

### Personalización
Editar los archivos para:
- Agregar nuevos payloads
- Modificar endpoints a probar
- Ajustar timeouts y umbrales
- Personalizar reportes

## 🚨 Payloads Utilizados

### SQL Injection Básicos
```sql
' OR '1'='1
' OR 1=1--
' UNION SELECT * FROM usuarios--
'; DROP TABLE productos; --
admin'--
```

### SQL Injection Avanzados
```sql
' OR (SELECT COUNT(*) FROM usuarios WHERE SLEEP(5))--
' UNION SELECT username,password FROM usuarios--
' AND ASCII(SUBSTRING((SELECT password FROM usuarios LIMIT 1),1,1))>64--
```

### JWT Bypass Attempts
```
Bearer 
Bearer null
Bearer undefined
Authorization: token (sin Bearer)
Multiple tokens
Tokens en cookies
```

## 📝 Reportes Generados

### Información Incluida
- **Total de pruebas ejecutadas**
- **Número de vulnerabilidades encontradas**
- **Tasa de seguridad (porcentaje)**
- **Detalles de cada vulnerabilidad**
- **Recomendaciones de seguridad**
- **Análisis por tipo de ataque**

### Formato de Salida
- Console output con colores
- Categorización por severidad
- Métricas detalladas
- Recomendaciones específicas

## 🛠️ Troubleshooting

### Problemas Comunes
1. **Error de conexión**: Verificar que el servidor esté ejecutándose
2. **Timeouts**: Ajustar valores en los archivos de configuración
3. **Dependencias**: Ejecutar `npm install axios jsonwebtoken`

### Debug Mode
Agregar logs adicionales modificando las funciones de test según necesidad.

## 🔒 Consideraciones de Seguridad

⚠️ **IMPORTANTE**: 
- Estas pruebas están diseñadas para testing ético
- Solo ejecutar en sistemas propios o con autorización
- Los payloads pueden ser detectados por WAF/IDS
- Usar únicamente en entornos de desarrollo/testing

## 📚 Referencias

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Headers](https://securityheaders.com/)