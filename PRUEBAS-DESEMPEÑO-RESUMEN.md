# 🚀 Pruebas de Desempeño - Ferretería G&L

## 📊 Resumen de Implementación Completada

### ✅ Herramientas Configuradas

1. **Simple Load Test** (Node.js nativo)
   - 📁 `tests/performance/simple-load-test.js`
   - 👥 Simula 20 usuarios concurrentes
   - ⏱️ Duración configurable
   - 📊 Reportes detallados de latencia y throughput

2. **Autocannon Performance Test**  
   - 📁 `tests/performance/performance-test.js`
   - ⚡ Alto rendimiento con herramientas nativas
   - 🎯 Múltiples escenarios de prueba
   - 📈 Métricas avanzadas

3. **Artillery Configuration**
   - 📁 `tests/performance/artillery-config.yml`
   - 🔄 Fases de carga (warm-up, peak, cool-down)
   - 📋 Configuración declarativa YAML
   - 🎲 Datos aleatorios y think times

4. **JMeter Test Plan**
   - 📁 `tests/performance/jmeter-performance-test.jmx`
   - 🖥️ Interfaz gráfica disponible
   - 📊 Reportes visuales completos
   - 🏭 Estándar de la industria

5. **Quick Test** (Demo rápido)
   - 📁 `tests/performance/quick-test.js`
   - ⚡ Validación rápida de endpoints
   - 🔍 Diagnóstico de problemas
   - 📋 Reporte simplificado

## 🎯 Escenarios de Prueba Implementados

### Distribución de Carga Realista:
- **60%** - Consultas de productos (GET)
  - Listado con paginación
  - Búsquedas por texto
  - Productos con stock bajo
  - Estadísticas de inventario

- **25%** - Consultas de facturas (GET)
  - Listado paginado
  - Filtros por fecha
  - Filtros por estado

- **15%** - Creación de ventas (POST)
  - Datos de cliente aleatorios
  - Productos variables
  - Validación de stock

### Configuración de Usuarios:
```
👥 Usuarios concurrentes: 20
⏱️ Duración: 60-120 segundos  
📈 Ramp-up: 30 segundos
🤔 Think time: 0.5-3 segundos
```

## 📋 Scripts NPM Configurados

```json
{
  "test:performance": "node tests/performance/simple-load-test.js",
  "test:performance-advanced": "node tests/performance/performance-test.js", 
  "test:load": "node tests/performance/simple-load-test.js"
}
```

## 🚀 Cómo Ejecutar las Pruebas

### Prerequisitos:
1. **Servidor corriendo**: `npm start` en puerto 3000
2. **Usuario admin creado** con credenciales `admin/admin123`
3. **Base de datos conectada** y funcionando
4. **Dependencias instaladas**: `npm install`

### Opción 1: Prueba Simple (Recomendado)
```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2: Ejecutar prueba
npm run test:performance
```

### Opción 2: Prueba Avanzada con Autocannon
```bash
npm run test:performance-advanced
```

### Opción 3: Prueba Rápida (Diagnóstico)
```bash
node tests/performance/quick-test.js
```

### Opción 4: Artillery (si está instalado)
```bash
artillery run tests/performance/artillery-config.yml
```

### Opción 5: JMeter
```bash
# Línea de comandos
jmeter -n -t tests/performance/jmeter-performance-test.jmx -l results.jtl

# O con interfaz gráfica
jmeter tests/performance/jmeter-performance-test.jmx
```

## 📊 Métricas de Evaluación

### 🎯 Objetivos de Rendimiento:
- **Requests/segundo**: > 50 RPS
- **Latencia P95**: < 1000ms
- **Tasa de éxito**: > 95%
- **Throughput**: Estable sin degradación

### 📈 Clasificación de Resultados:
- **✅ EXCELENTE**: RPS > 100, P95 < 500ms, Éxito > 99%
- **✅ BUENO**: RPS > 50, P95 < 1000ms, Éxito > 95%
- **⚠️ REGULAR**: RPS > 20, P95 < 2000ms, Éxito > 90%
- **❌ MALO**: RPS < 20, P95 > 2000ms, Éxito < 90%

## 🔧 Características Implementadas

### ✅ Autenticación Automática
- Login automático con JWT
- Token management en todas las requests
- Manejo de expiración de tokens

### ✅ Datos Realistas
- Clientes con datos aleatorios
- Productos con cantidades variables
- Simulación de comportamiento real

### ✅ Reportes Completos
- Latencia por percentiles (P50, P95, P99)
- Throughput y requests por segundo
- Análisis por endpoint individual
- Identificación de errores comunes

### ✅ Configuración Flexible
- Número de usuarios ajustable
- Duración personalizable
- Distribución de carga configurable
- Think times aleatorios

### ✅ Manejo Robusto de Errores
- Timeouts configurables
- Retry logic para fallos temporales
- Clasificación de errores por tipo
- Logging detallado

## 🎉 Resultados Esperados

Con 20 usuarios concurrentes, el sistema debería manejar:

### Escenario Optimista:
```
🔢 Total requests: ~2000-3000
✅ Tasa de éxito: 95-99%
⚡ RPS: 30-80 req/seg
⏱️ Latencia P95: 200-800ms
📈 Throughput: 2-10 MB/seg
```

### Cuellos de Botella Potenciales:
1. **Base de datos**: Consultas sin optimizar
2. **Autenticación**: Verificación de tokens
3. **Paginación**: Queries de conteo grandes
4. **Stock**: Actualizaciones concurrentes

## 💡 Próximos Pasos

### Después de ejecutar las pruebas:

1. **Analizar resultados** y identificar bottlenecks
2. **Optimizar consultas** de base de datos
3. **Implementar caché** para consultas frecuentes
4. **Ajustar pool de conexiones** de BD
5. **Re-ejecutar pruebas** para validar mejoras
6. **Establecer monitoreo** continuo

### Optimizaciones Sugeridas:
- Índices en columnas de búsqueda frecuente
- Connection pooling optimizado  
- Caché de resultados para productos
- Paginación mejorada
- Rate limiting para APIs

---

## 🏆 Resumen de Logros

✅ **4 herramientas de testing** implementadas  
✅ **Escenarios realistas** con distribución 60/25/15%  
✅ **20 usuarios concurrentes** simulados  
✅ **Métricas completas** de rendimiento  
✅ **Reportes detallados** con recomendaciones  
✅ **Scripts NPM** configurados  
✅ **Documentación completa** de uso  

**El sistema de pruebas de desempeño está listo para validar la capacidad del sistema bajo carga realista de 20 usuarios concurrentes en endpoints de ventas y facturas.**