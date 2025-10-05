# 📊 Plantilla de Resultados - Pruebas de Desempeño

## 🎯 Configuración de Prueba
- **Fecha**: [Fecha]
- **Usuarios concurrentes**: 20
- **Duración**: 60-120 segundos
- **Herramienta utilizada**: [Simple Load Test / Autocannon / Artillery / JMeter]
- **Servidor**: http://localhost:3000
- **Hardware**: [Especificar CPU, RAM, OS]

## 📈 Resultados Principales

### Estadísticas Generales
```
🔢 Total de requests: [número]
✅ Requests exitosos: [número]
❌ Requests fallidos: [número]
📈 Tasa de éxito: [porcentaje]%
⚡ Requests por segundo: [número]
⏱️  Tiempo de respuesta promedio: [número]ms
```

### Latencia
```
⏱️  Tiempo mínimo: [número]ms
⏱️  Tiempo máximo: [número]ms
📊 Percentil 50: [número]ms
📊 Percentil 95: [número]ms
📊 Percentil 99: [número]ms
```

### Throughput
```
📈 Throughput promedio: [número] MB/seg
🔁 Conexiones reutilizadas: [porcentaje]%
🔄 Timeouts: [número]
```

## 🎯 Análisis por Endpoint

### GET /api/productos (60% del tráfico)
```
📊 Requests totales: [número]
✅ Tasa de éxito: [porcentaje]%
⏱️  Latencia promedio: [número]ms
⚡ RPS promedio: [número]
```

### GET /api/facturas (25% del tráfico)
```
📊 Requests totales: [número]
✅ Tasa de éxito: [porcentaje]%
⏱️  Latencia promedio: [número]ms
⚡ RPS promedio: [número]
```

### POST /api/ventas (15% del tráfico)
```
📊 Requests totales: [número]
✅ Tasa de éxito: [porcentaje]%
⏱️  Latencia promedio: [número]ms
⚡ RPS promedio: [número]
```

## 🎨 Clasificación de Rendimiento

### [✅/⚠️/❌] Evaluación General: [EXCELENTE/BUENO/REGULAR/MALO]

#### Justificación:
- **RPS**: [evaluación] - [justificación]
- **Latencia P95**: [evaluación] - [justificación]
- **Tasa de éxito**: [evaluación] - [justificación]

## 🐛 Errores Identificados

### Top 5 Errores:
1. `[cantidad]x - [descripción del error]`
2. `[cantidad]x - [descripción del error]`
3. `[cantidad]x - [descripción del error]`
4. `[cantidad]x - [descripción del error]`
5. `[cantidad]x - [descripción del error]`

### Análisis de Errores:
- **Errores de autenticación (401)**: [análisis]
- **Errores de servidor (500)**: [análisis]
- **Timeouts**: [análisis]
- **Errores de conexión**: [análisis]

## 🔧 Recomendaciones de Optimización

### Inmediatas (Alta Prioridad):
- [ ] [Recomendación específica]
- [ ] [Recomendación específica]
- [ ] [Recomendación específica]

### Mediano Plazo:
- [ ] [Recomendación específica]
- [ ] [Recomendación específica]

### Largo Plazo:
- [ ] [Recomendación específica]

## 📊 Comparación con Pruebas Anteriores

| Métrica | Prueba Anterior | Prueba Actual | Cambio |
|---------|----------------|---------------|--------|
| RPS | [valor] | [valor] | [+/-]% |
| P95 Latencia | [valor]ms | [valor]ms | [+/-]% |
| Tasa de éxito | [valor]% | [valor]% | [+/-]% |
| Throughput | [valor] MB/s | [valor] MB/s | [+/-]% |

## 🎯 Conclusiones

### Fortalezas Identificadas:
- [Fortaleza 1]
- [Fortaleza 2]
- [Fortaleza 3]

### Áreas de Mejora:
- [Área 1]
- [Área 2]
- [Área 3]

### Siguientes Pasos:
1. [Acción específica con responsable y fecha]
2. [Acción específica con responsable y fecha]
3. [Acción específica con responsable y fecha]

---

## 📝 Notas Técnicas

### Configuración del Sistema:
- **Base de datos**: [PostgreSQL/Supabase]
- **Node.js version**: [versión]
- **Memoria disponible**: [cantidad]
- **CPU**: [especificación]
- **Conexiones de BD**: [pool size]

### Observaciones:
- [Observación relevante durante la prueba]
- [Comportamiento anómalo detectado]
- [Patrones identificados]

### Archivos de Log:
- `performance_results.jtl` (si usando JMeter)
- `server.log` (logs del servidor durante la prueba)
- `db.log` (logs de base de datos)

---

**Elaborado por**: [Nombre]  
**Fecha**: [Fecha]  
**Revisado por**: [Nombre]