# 🛠️ GUÍA RÁPIDA - Crear Usuarios desde pgAdmin4

## 📋 Pasos para crear un nuevo usuario:

### 1. 👨‍💼 Crear Empleado (si no existe)
```sql
INSERT INTO empleados (
    cedula, 
    nombre_completo, 
    correo_electronico, 
    telefono, 
    cargo_id,           -- 1=Administrador, 2=Cajero, etc.
    fecha_ingreso, 
    salario, 
    activo
) VALUES (
    '1234567890',
    'Juan Pérez García',
    'juan.perez@ferreteria.com',
    '3001234567',
    2,                  -- ID del cargo (revisar tabla cargos)
    CURRENT_DATE,
    1500000.00,
    true
);
```

### 2. 🔐 Crear Usuario del Sistema
```sql
INSERT INTO usuarios_sistema (
    empleado_id,        -- Usar el ID del empleado creado arriba
    nombre_usuario,
    password_hash,      -- Contraseña en TEXTO PLANO (se encriptará después)
    activo,
    intentos_fallidos,
    fecha_creacion
) VALUES (
    3,                  -- ID del empleado (cambiar por el correcto)
    'juan.perez',
    'micontraseña123',  -- TEXTO PLANO - será encriptada
    true,
    0,
    CURRENT_TIMESTAMP
);
```

### 3. 🔑 Registro Automático
```bash
# Los nuevos usuarios se registran desde la página web
# Las contraseñas se encriptan automáticamente
# No necesitas herramientas adicionales
```

### 4. ✅ Verificar Usuario Creado
```bash
# Los usuarios se pueden ver desde la interfaz web de administración
# O consultando directamente la base de datos en Supabase
```

## 📊 Consultas Útiles:

### Ver todos los cargos disponibles:
```sql
SELECT id, nombre_cargo, rol_sistema, activo 
FROM cargos 
WHERE activo = true;
```

### Ver empleados sin usuario del sistema:
```sql
SELECT e.id, e.nombre_completo, e.correo_electronico, c.nombre_cargo
FROM empleados e
LEFT JOIN usuarios_sistema u ON e.id = u.empleado_id
INNER JOIN cargos c ON e.cargo_id = c.id
WHERE u.id IS NULL AND e.activo = true;
```

### Ver usuarios con información completa:
```sql
SELECT 
    u.id,
    u.nombre_usuario,
    e.nombre_completo,
    e.correo_electronico,
    c.nombre_cargo,
    c.rol_sistema,
    u.ultimo_acceso,
    u.activo
FROM usuarios_sistema u
INNER JOIN empleados e ON u.empleado_id = e.id
INNER JOIN cargos c ON e.cargo_id = c.id
ORDER BY u.id;
```

## 🎯 Ejemplo Completo - Crear Cajero:

```sql
-- 1. Crear empleado
INSERT INTO empleados (cedula, nombre_completo, correo_electronico, telefono, cargo_id, fecha_ingreso, salario, activo)
VALUES ('9876543210', 'María González', 'maria.gonzalez@ferreteria.com', '3009876543', 2, CURRENT_DATE, 1200000.00, true);

-- 2. Obtener el ID del empleado creado
SELECT id FROM empleados WHERE cedula = '9876543210';

-- 3. Crear usuario del sistema (usar el ID obtenido arriba)
INSERT INTO usuarios_sistema (empleado_id, nombre_usuario, password_hash, activo)
VALUES (4, 'maria.gonzalez', 'password123', true);
```

## ⚠️ IMPORTANTE:
- Los usuarios nuevos se registran desde la página web con encriptación automática
- Verificar que el cargo_id existe en la tabla cargos
- Solo roles 'Administrador' y 'Cajero' pueden acceder al sistema
