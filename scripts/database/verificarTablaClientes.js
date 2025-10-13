const { pool } = require('../config/database');

async function verificarTablaClientes() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Verificando estructura de la tabla clientes...');
        
        // Verificar si la tabla existe
        const tablaExiste = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'clientes'
            );
        `);
        
        if (!tablaExiste.rows[0].exists) {
            console.log('❌ La tabla clientes no existe');
            return;
        }
        
        console.log('✅ La tabla clientes existe');
        
        // Obtener estructura de la tabla
        const columnas = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'clientes' 
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📋 Estructura actual de la tabla clientes:');
        console.log('════════════════════════════════════════════════════════');
        
        columnas.rows.forEach(col => {
            const longitud = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type}${longitud.padEnd(8)} | ${nullable}${defaultVal}`);
        });
        
        // Contar registros
        const conteo = await client.query('SELECT COUNT(*) FROM clientes');
        console.log(`\n📊 Total de registros: ${conteo.rows[0].count}`);
        
        // Mostrar algunos registros de ejemplo
        if (parseInt(conteo.rows[0].count) > 0) {
            const muestra = await client.query('SELECT * FROM clientes LIMIT 3');
            console.log('\n👥 Muestra de registros:');
            console.log('════════════════════════════════════════════════════════');
            muestra.rows.forEach((cliente, i) => {
                console.log(`${i + 1}. ID: ${cliente.id}`);
                Object.keys(cliente).forEach(key => {
                    if (key !== 'id') {
                        console.log(`   ${key}: ${cliente[key]}`);
                    }
                });
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error verificando tabla:', error);
    } finally {
        client.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarTablaClientes()
        .then(() => {
            console.log('✅ Verificación completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en la verificación:', error);
            process.exit(1);
        });
}

module.exports = { verificarTablaClientes };