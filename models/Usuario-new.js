const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class Usuario {
    
    // Buscar usuario por email o nombre de usuario para login
    static async buscarParaLogin(emailOUsuario) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.nombre_usuario,
                    u.password_hash,
                    u.intentos_fallidos,
                    u.bloqueado_hasta,
                    u.ultimo_acceso,
                    u.activo as usuario_activo,
                    e.id as empleado_id,
                    e.nombre_completo,
                    e.correo_electronico,
                    e.activo as empleado_activo,
                    c.nombre_cargo,
                    c.rol_sistema
                FROM usuarios_sistema u
                INNER JOIN empleados e ON u.empleado_id = e.id
                INNER JOIN cargos c ON e.cargo_id = c.id
                WHERE (e.correo_electronico = $1 OR u.nombre_usuario = $1)
                AND u.activo = true 
                AND e.activo = true
            `;
            
            const result = await pool.query(query, [emailOUsuario]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando usuario para login:', error);
            throw error;
        }
    }

    // Verificar contraseña
    static async verificarPassword(passwordTexto, passwordHash) {
        try {
            return await bcrypt.compare(passwordTexto, passwordHash);
        } catch (error) {
            console.error('Error verificando contraseña:', error);
            throw error;
        }
    }

    // Verificar si el usuario está bloqueado
    static estaBloquado(usuario) {
        if (!usuario.bloqueado_hasta) return false;
        
        const ahora = new Date();
        const bloqueoHasta = new Date(usuario.bloqueado_hasta);
        
        return ahora < bloqueoHasta;
    }

    // Validar rol para acceso al sistema
    static tieneAccesoAlSistema(rolSistema) {
        const rolesPermitidos = ['Administrador', 'Cajero'];
        return rolesPermitidos.includes(rolSistema);
    }

    // Actualizar último acceso exitoso
    static async actualizarUltimoAcceso(usuarioId) {
        try {
            const query = `
                UPDATE usuarios_sistema 
                SET ultimo_acceso = CURRENT_TIMESTAMP,
                    intentos_fallidos = 0,
                    bloqueado_hasta = NULL
                WHERE id = $1
            `;
            
            await pool.query(query, [usuarioId]);
        } catch (error) {
            console.error('Error actualizando último acceso:', error);
            throw error;
        }
    }

    // Incrementar intentos fallidos
    static async incrementarIntentosFallidos(usuarioId) {
        try {
            const query = `
                UPDATE usuarios_sistema 
                SET intentos_fallidos = intentos_fallidos + 1,
                    bloqueado_hasta = CASE 
                        WHEN intentos_fallidos + 1 >= 5 
                        THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
                        ELSE bloqueado_hasta
                    END
                WHERE id = $1
                RETURNING intentos_fallidos, bloqueado_hasta
            `;
            
            const result = await pool.query(query, [usuarioId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error incrementando intentos fallidos:', error);
            throw error;
        }
    }

    // Buscar usuario por ID (para middleware)
    static async buscarPorId(usuarioId) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.nombre_usuario,
                    u.activo as usuario_activo,
                    e.nombre_completo,
                    e.correo_electronico,
                    c.rol_sistema
                FROM usuarios_sistema u
                INNER JOIN empleados e ON u.empleado_id = e.id
                INNER JOIN cargos c ON e.cargo_id = c.id
                WHERE u.id = $1 AND u.activo = true AND e.activo = true
            `;
            
            const result = await pool.query(query, [usuarioId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando usuario por ID:', error);
            throw error;
        }
    }

    // Buscar empleado por cédula
    static async buscarEmpleadoPorCedula(cedula) {
        try {
            const query = `
                SELECT id, cedula_identidad, nombre_completo, correo_electronico 
                FROM empleados 
                WHERE cedula_identidad = $1
            `;
            
            const result = await pool.query(query, [cedula]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando empleado por cédula:', error);
            throw error;
        }
    }

    // Buscar por correo electrónico
    static async buscarPorCorreo(correo) {
        try {
            const query = `
                SELECT id, correo_electronico 
                FROM empleados 
                WHERE correo_electronico = $1
            `;
            
            const result = await pool.query(query, [correo]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando por correo:', error);
            throw error;
        }
    }

    // Buscar por nombre de usuario
    static async buscarPorNombreUsuario(nombreUsuario) {
        try {
            const query = `
                SELECT id, nombre_usuario 
                FROM usuarios_sistema 
                WHERE nombre_usuario = $1
            `;
            
            const result = await pool.query(query, [nombreUsuario]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando por nombre de usuario:', error);
            throw error;
        }
    }

    // Crear empleado completo (empleado + usuario del sistema)
    static async crearEmpleadoCompleto(datos) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // 1. Crear registro en empleados
            const queryEmpleado = `
                INSERT INTO empleados (
                    cedula_identidad,
                    nombre_completo,
                    telefono,
                    correo_electronico,
                    direccion,
                    cargo_id,
                    fecha_ingreso,
                    salario,
                    activo,
                    fecha_creacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
                RETURNING id
            `;

            const resultEmpleado = await client.query(queryEmpleado, [
                datos.cedula,
                datos.nombre_completo,
                datos.telefono,
                datos.correo_electronico,
                datos.direccion,
                datos.cargo_id,
                datos.fecha_ingreso,
                datos.salario
            ]);

            const empleadoId = resultEmpleado.rows[0].id;

            // 2. Hash de la contraseña
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(datos.password, saltRounds);

            // 3. Crear usuario del sistema
            const queryUsuario = `
                INSERT INTO usuarios_sistema (
                    empleado_id,
                    nombre_usuario,
                    password_hash,
                    activo,
                    fecha_creacion,
                    intentos_fallidos,
                    ultimo_acceso
                ) VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, 0, NULL)
                RETURNING id
            `;

            const resultUsuario = await client.query(queryUsuario, [
                empleadoId,
                datos.nombre_usuario,
                passwordHash
            ]);

            await client.query('COMMIT');

            console.log(`Empleado creado exitosamente: ID ${empleadoId}, Usuario ID ${resultUsuario.rows[0].id}`);
            return empleadoId;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creando empleado completo:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Usuario;
