const { pool, conectarDB } = require('../config/database');

const verificarUsuario = async () => {
    try {
        await conectarDB();
        
        // Verificar tu usuario Daniel
        const query = `
            SELECT 
                u.id,
                u.empleado_id,
                u.nombre_usuario,
                u.activo,
                LEFT(u.password_hash, 30) as password_preview
            FROM usuarios_sistema u
            WHERE u.nombre_usuario = 'Daniel'
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            console.log('👤 Usuario encontrado:');
            console.log(`   ID: ${usuario.id}`);
            console.log(`   Nombre: ${usuario.nombre_usuario}`);
            console.log(`   Empleado ID: ${usuario.empleado_id}`);
            console.log(`   Activo: ${usuario.activo}`);
            console.log(`   Password Hash: ${usuario.password_preview}...`);
            
            // Intentar buscar el empleado relacionado
            if (usuario.empleado_id) {
                const queryEmpleado = `
                    SELECT * FROM empleados WHERE id = $1
                `;
                
                try {
                    const resultEmpleado = await pool.query(queryEmpleado, [usuario.empleado_id]);
                    if (resultEmpleado.rows.length > 0) {
                        console.log('👨‍💼 Empleado relacionado encontrado:', resultEmpleado.rows[0]);
                    } else {
                        console.log('❌ No se encontró empleado con ID:', usuario.empleado_id);
                    }
                } catch (error) {
                    console.log('❌ Error buscando empleado (tal vez no existe la tabla empleados):', error.message);
                }
            } else {
                console.log('⚠️  Usuario no tiene empleado_id asignado');
            }
        } else {
            console.log('❌ Usuario Daniel no encontrado');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verificarUsuario();
