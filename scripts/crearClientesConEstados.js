const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool(config.database);

async function crearClientesConDiferentesEstados() {
    try {
        console.log('🔄 Creando clientes con diferentes estados...');

        // Primero, obtener los clientes existentes
        const clientesResult = await pool.query('SELECT id, nombres, apellidos, activo FROM clientes ORDER BY id LIMIT 4');
        const clientes = clientesResult.rows;
        
        console.log('📋 Clientes encontrados:');
        clientes.forEach(cliente => {
            console.log(`  - ID: ${cliente.id}, Nombre: ${cliente.nombres} ${cliente.apellidos}, Estado actual: ${cliente.activo ? 'Activo' : 'Inactivo'}`);
        });

        if (clientes.length >= 2) {
            // Cambiar el primer cliente a inactivo
            await pool.query('UPDATE clientes SET activo = false WHERE id = $1', [clientes[0].id]);
            console.log(`✅ Cliente ${clientes[0].nombres} ${clientes[0].apellidos} cambiado a INACTIVO`);

            // Si hay más de 2 clientes, cambiar el segundo también a inactivo
            if (clientes.length >= 3) {
                await pool.query('UPDATE clientes SET activo = false WHERE id = $1', [clientes[1].id]);
                console.log(`✅ Cliente ${clientes[1].nombres} ${clientes[1].apellidos} cambiado a INACTIVO`);
            }
        }

        // Verificar los cambios
        console.log('\n📊 Estado final de los clientes:');
        const verificacion = await pool.query('SELECT id, nombres, apellidos, activo FROM clientes ORDER BY id');
        verificacion.rows.forEach(cliente => {
            console.log(`  - ${cliente.nombres} ${cliente.apellidos}: ${cliente.activo ? '🟢 ACTIVO' : '🔴 INACTIVO'}`);
        });

        console.log('\n✅ Cambios completados. Ahora puedes probar los filtros:');
        console.log('   - Todos: Debería mostrar todos los clientes');
        console.log('   - Activo: Debería mostrar solo los clientes activos');
        console.log('   - Inactivo: Debería mostrar solo los clientes inactivos');
        console.log('   - Suspendido: Debería mostrar los mismos que inactivo');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

crearClientesConDiferentesEstados();