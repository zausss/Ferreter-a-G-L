const { pool } = require('../config/database');

async function probarObtenerCliente() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Probando obtener cliente específico...');
        
        // Obtener el primer cliente para probar
        const primerosClientes = await client.query('SELECT id FROM clientes LIMIT 1');
        
        if (primerosClientes.rows.length === 0) {
            console.log('❌ No hay clientes para probar');
            return;
        }
        
        const clienteId = primerosClientes.rows[0].id;
        console.log(`📋 Probando con cliente ID: ${clienteId}`);
        
        // Simular la consulta del controlador
        const query = `SELECT * FROM clientes WHERE id = $1`;
        const result = await client.query(query, [clienteId]);
        
        if (result.rows.length === 0) {
            console.log('❌ Cliente no encontrado');
            return;
        }
        
        const cliente = result.rows[0];
        console.log('✅ Cliente encontrado:', cliente);
        
        // Mostrar el mapeo que haría el controlador
        const clienteMapeado = {
            id: cliente.id,
            codigo_cliente: cliente.codigo_cliente,
            tipo_cliente: cliente.tipo_cliente,
            tipo_documento: cliente.tipo_documento,
            numero_documento: cliente.numero_documento,
            nombre: cliente.nombres,
            apellido: cliente.apellidos,
            razon_social: cliente.razon_social,
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion,
            ciudad: cliente.ciudad,
            departamento: cliente.departamento,
            fecha_nacimiento: cliente.fecha_nacimiento,
            estado: cliente.activo ? 'activo' : 'inactivo',
            activo: cliente.activo,
            fecha_creacion: cliente.fecha_creacion,
            fecha_actualizacion: cliente.fecha_actualizacion
        };
        
        console.log('🗂️ Cliente mapeado (lo que recibe el frontend):', clienteMapeado);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    probarObtenerCliente()
        .then(() => {
            console.log('✅ Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en la prueba:', error);
            process.exit(1);
        });
}

module.exports = { probarObtenerCliente };