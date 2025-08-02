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
}

module.exports = Usuario;
