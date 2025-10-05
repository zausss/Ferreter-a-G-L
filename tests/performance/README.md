# Guía de Pruebas de Desempeño - Ferretería G&L

## 🎯 Objetivo
Simular 20 usuarios concurrentes realizando operaciones en endpoints de ventas y facturas para evaluar el rendimiento del sistema.

## 🛠️ Herramientas Disponibles

### 1. Node.js Simple Load Test (Recomendado para inicio)
- ✅ **Fácil de usar**: Solo requiere Node.js
- ✅ **Integrado**: Usa las mismas dependencias del proyecto
- ✅ **Reportes detallados**: Estadísticas completas de rendimiento

### 2. Autocannon (Performance Test Avanzado)
- ✅ **Alto rendimiento**: Herramienta nativa Node.js
- ✅ **Flexible**: Múltiples escenarios de prueba
- ✅ **Rápido**: Ideal para pruebas continuas

### 3. Artillery (Configuración YAML)
- ✅ **Declarativo**: Configuración en YAML
- ✅ **Fases de carga**: Warm-up, peak, cool-down
- ✅ **Escenarios realistas**: Distribución de tráfico por porcentajes

### 4. JMeter (GUI y línea de comandos)
- ✅ **Interfaz gráfica**: Fácil configuración visual
- ✅ **Reportes visuales**: Gráficos y tablas detalladas
- ✅ **Estándar industria**: Ampliamente usado en testing

## 🚀 Instalación y Configuración

### Instalar dependencias para Node.js tests:
```bash
npm install --save-dev autocannon axios
```

### Instalar Artillery (opcional):
```bash
npm install -g artillery
```

### Instalar JMeter:
1. Descargar desde: https://jmeter.apache.org/download_jmeter.cgi
2. Extraer y ejecutar: `bin/jmeter.sh` (Linux/Mac) o `bin/jmeter.bat` (Windows)

## 📋 Ejecución de Pruebas

### 1. Prueba Simple con Node.js (Recomendado)
```bash
# Asegúrate de que el servidor esté corriendo en puerto 3000
npm start

# En otra terminal, ejecutar:
node tests/performance/simple-load-test.js
```

### 2. Prueba con Autocannon
```bash
# Ejecutar prueba avanzada
node tests/performance/performance-test.js
```

### 3. Prueba con Artillery
```bash
# Ejecutar con Artillery
artillery run tests/performance/artillery-config.yml
```

### 4. Prueba con JMeter
```bash
# Línea de comandos
jmeter -n -t tests/performance/jmeter-performance-test.jmx -l results.jtl

# O abrir la GUI
jmeter
# Luego File > Open > jmeter-performance-test.jmx
```

## 📊 Escenarios de Prueba

### Distribución de Carga:
- **60%** - Consultas de productos (GET /api/productos)
  - Paginación: `?pagina=1&limite=10`
  - Búsqueda: `?busqueda=martillo`
  - Stock bajo: `/stock-bajo`
  - Estadísticas: `/estadisticas`

- **25%** - Consultas de facturas (GET /api/facturas)
  - Listado con paginación
  - Filtros por fecha
  - Filtros por estado

- **15%** - Creación de ventas (POST /api/ventas)
  - Datos de cliente aleatorios
  - Productos con cantidades variables
  - Diferentes métodos de pago

### Configuración de Usuarios:
- **Usuarios concurrentes**: 20
- **Duración**: 60-120 segundos
- **Ramp-up**: 30 segundos (usuarios se agregan gradualmente)
- **Think time**: 0.5-3 segundos entre requests

## 📈 Métricas a Evaluar

### Rendimiento:
- **Requests por segundo (RPS)**: Meta > 50 req/s
- **Latencia promedio**: Meta < 500ms
- **Percentil 95**: Meta < 1000ms
- **Percentil 99**: Meta < 2000ms

### Confiabilidad:
- **Tasa de éxito**: Meta > 95%
- **Errores HTTP**: Minimizar 4xx y 5xx
- **Timeouts**: Meta < 1%

### Recursos:
- **Throughput**: MB/s transferidos
- **Conexiones**: Reutilización de conexiones
- **Memoria**: Uso estable sin leaks

## 🎯 Resultados Esperados

### ✅ Rendimiento EXCELENTE:
- RPS > 100
- P95 < 500ms
- Tasa éxito > 99%

### ✅ Rendimiento BUENO:
- RPS > 50
- P95 < 1000ms
- Tasa éxito > 95%

### ⚠️ Rendimiento REGULAR:
- RPS > 20
- P95 < 2000ms
- Tasa éxito > 90%

### ❌ Rendimiento BAJO:
- RPS < 20
- P95 > 2000ms
- Tasa éxito < 90%

## 🔧 Optimizaciones Sugeridas

### Base de Datos:
- Índices en columnas de búsqueda frecuente
- Connection pooling optimizado
- Query optimization

### Aplicación:
- Caché de consultas frecuentes
- Paginación eficiente
- Validaciones optimizadas

### Infraestructura:
- Load balancing si es necesario
- CDN para assets estáticos
- Monitoring y alertas

## 📝 Interpretación de Resultados

### Análisis de Latencia:
- **< 100ms**: Excelente experiencia de usuario
- **100-500ms**: Buena experiencia
- **500-1000ms**: Aceptable para operaciones complejas
- **> 1000ms**: Requiere optimización

### Análisis de Throughput:
- **> 100 RPS**: Sistema escalable
- **50-100 RPS**: Bueno para aplicación mediana
- **20-50 RPS**: Suficiente para uso pequeño/mediano
- **< 20 RPS**: Requiere optimización

### Análisis de Errores:
- **0-1%**: Sistema muy estable
- **1-5%**: Aceptable, revisar logs
- **5-10%**: Problemas intermitentes
- **> 10%**: Problemas serios, requiere corrección

## 🚨 Troubleshooting

### Errores Comunes:
1. **ECONNREFUSED**: Servidor no está corriendo
2. **401 Unauthorized**: Token de auth expirado/inválido
3. **500 Internal Server Error**: Error en base de datos o lógica
4. **Timeout**: Respuestas muy lentas, optimizar queries

### Soluciones:
1. Verificar que `npm start` esté corriendo
2. Verificar credenciales en scripts de prueba
3. Revisar logs del servidor y base de datos
4. Aumentar timeouts o optimizar consultas

## 📋 Checklist Pre-Prueba

- [ ] Servidor corriendo en puerto 3000
- [ ] Base de datos conectada y funcionando
- [ ] Usuario admin creado con credenciales correctas
- [ ] Datos de prueba suficientes en la BD
- [ ] Dependencias instaladas (`npm install`)
- [ ] Puertos disponibles y sin firewall bloqueando

## 🎉 Próximos Pasos

Después de ejecutar las pruebas:

1. **Analizar resultados** y identificar cuellos de botella
2. **Optimizar** consultas y código basado en métricas
3. **Re-ejecutar pruebas** para validar mejoras
4. **Documentar** hallazgos y optimizaciones realizadas
5. **Establecer monitoreo** continuo en producción