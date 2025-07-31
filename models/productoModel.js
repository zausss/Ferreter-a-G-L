const { pool, conectarDB } = require('../config/database');

const probarConexionYTabla = async () => {
    console.log('🔄 Probando conexión a PostgreSQL...');
    
    try {
        // 1. Probar conexión básica
        const conectado = await conectarDB();
        
        if (!conectado) {
            console.log('❌ No se pudo conectar a la base de datos');
            return;
        }

        // 2. Verificar que existe la tabla usuarios_sistema
        console.log('🔍 Verificando tabla usuarios_sistema...');
        const verificarTabla = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'usuarios_sistema'
            );
        `);
        
        if (verificarTabla.rows[0].exists) {
            console.log('✅ La tabla usuarios_sistema existe');
            
            // 3. Contar cuántos registros hay (sin mostrar datos)
            const conteo = await pool.query('SELECT COUNT(*) as total FROM usuarios_sistema');
            console.log(`📊 La tabla tiene ${conteo.rows[0].total} registros`);
            
            // 4. Mostrar estructura de la tabla (solo nombres de columnas)
            const columnas = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'usuarios_sistema'
                ORDER BY ordinal_position;
            `);
            
            console.log('🏗️  Estructura de la tabla:');
            columnas.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type})`);
            });
            
        } else {
            console.log('❌ La tabla usuarios_sistema NO existe');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        // Cerrar conexiones
        await pool.end();
        console.log('🔒 Conexiones cerradas');
    }
};

// Ejecutar la prueba
probarConexionYTabla();