const { pool } = require('../config/database');

async function probarCambiarEstado() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Probando cambiar estado de cliente...');
        
        // Obtener un cliente para probar
        const clienteQuery = await client.query('SELECT id, nombres, apellidos, activo FROM clientes LIMIT 1');
        
        if (clienteQuery.rows.length === 0) {
            console.log('❌ No hay clientes para probar');
            return;
        }
        
        const cliente = clienteQuery.rows[0];
        console.log('📋 Cliente original:', cliente);
        
        const nuevoEstado = !cliente.activo; // Cambiar al estado opuesto
        console.log(`🔄 Cambiando estado de ${cliente.activo} a ${nuevoEstado}`);
        
        // Simular el cambio como lo hace el controlador
        const updateQuery = `
            UPDATE clientes 
            SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [nuevoEstado, cliente.id]);
        console.log('✅ Cliente actualizado:', result.rows[0]);
        
        // Mapear como lo haría el controlador
        const clienteActualizado = result.rows[0];
        const clienteMapeado = {
            id: clienteActualizado.id,
            nombres: clienteActualizado.nombres,
            apellidos: clienteActualizado.apellidos,
            estado: clienteActualizado.activo ? 'activo' : 'inactivo',
            activo: clienteActualizado.activo
        };
        
        console.log('🗂️ Cliente mapeado (lo que recibe el frontend):', clienteMapeado);
        
        // Verificar la respuesta JSON que se enviaría
        const respuestaAPI = {
            success: true,
            message: `Cliente ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
            cliente: clienteMapeado
        };
        
        console.log('📡 Respuesta API simulada:', JSON.stringify(respuestaAPI, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    probarCambiarEstado()
        .then(() => {
            console.log('✅ Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en la prueba:', error);
            process.exit(1);
        });
}

module.exports = { probarCambiarEstado };