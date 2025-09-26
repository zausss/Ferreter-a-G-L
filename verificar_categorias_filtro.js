const { pool } = require('./config/database');

async function verificarCategorias() {
    try {
        console.log('🔍 Verificando categorías en la base de datos...\n');
        
        const query = `
            SELECT 
                id,
                codigo_categoria,
                nombre_categoria,
                descripcion,
                activo,
                fecha_creacion
            FROM categorias 
            WHERE activo = true
            ORDER BY nombre_categoria ASC
        `;
        
        const result = await pool.query(query);
        
        console.log('📊 Categorías activas en la base de datos:');
        console.table(result.rows);
        
        console.log('\n🔄 Estructura que recibirá el frontend:');
        const estructuraFrontend = {
            success: true,
            categorias: result.rows
        };
        console.log(JSON.stringify(estructuraFrontend, null, 2));
        
        console.log(`\n✅ Total de categorías: ${result.rows.length}`);
        
        if (result.rows.length === 0) {
            console.log('❌ No hay categorías activas. Esto puede causar problemas en el filtro.');
        } else {
            console.log('🎯 Categorías que deberían aparecer en el filtro:');
            result.rows.forEach(cat => {
                console.log(`  - ${cat.nombre_categoria} (${cat.codigo_categoria})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

verificarCategorias();
