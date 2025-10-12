const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool(config.database);

async function verificarEstadosClientes() {
    try {
        console.log('🔍 Verificando estados de clientes en la base de datos...\n');
        
        const result = await pool.query(`
            SELECT id, nombres, apellidos, activo,
                   CASE WHEN activo THEN 'activo' ELSE 'inactivo' END as estado_mapeado
            FROM clientes 
            ORDER BY id
        `);
        
        console.log('📊 Clientes en la base de datos:');
        result.rows.forEach(cliente => {
            const icono = cliente.activo ? '🟢' : '🔴';
            console.log(`  ${icono} ID: ${cliente.id} | ${cliente.nombres} ${cliente.apellidos} | activo: ${cliente.activo} | estado_mapeado: "${cliente.estado_mapeado}"`);
        });
        
        const activos = result.rows.filter(c => c.activo).length;
        const inactivos = result.rows.filter(c => !c.activo).length;
        
        console.log(`\n📈 Resumen:`);
        console.log(`   - Total: ${result.rows.length}`);
        console.log(`   - Activos: ${activos}`);
        console.log(`   - Inactivos: ${inactivos}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstadosClientes();