const { pool } = require('../config/database');

async function verificarUsuarios() {
    const client = await pool.connect();
    
    try {
        console.log('👤 Verificando usuarios en la base de datos...');
        
        // Verificar si existe la tabla usuarios
        const tablaExiste = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'usuarios'
            );
        `);
        
        if (!tablaExiste.rows[0].exists) {
            console.log('❌ La tabla usuarios no existe');
            return;
        }
        
        console.log('✅ La tabla usuarios existe');
        
        // Contar usuarios
        const conteo = await client.query('SELECT COUNT(*) FROM usuarios');
        console.log(`📊 Total de usuarios: ${conteo.rows[0].count}`);
        
        if (parseInt(conteo.rows[0].count) > 0) {
            // Mostrar algunos usuarios
            const usuarios = await client.query('SELECT id, email, rol_sistema FROM usuarios LIMIT 5');
            console.log('\n👥 Usuarios encontrados:');
            usuarios.rows.forEach((usuario, i) => {
                console.log(`  ${i + 1}. ${usuario.email} (${usuario.rol_sistema}) - ID: ${usuario.id}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error verificando usuarios:', error);
    } finally {
        client.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarUsuarios()
        .then(() => {
            console.log('✅ Verificación completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en la verificación:', error);
            process.exit(1);
        });
}

module.exports = { verificarUsuarios };