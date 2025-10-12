// Script para probar la API de clientes
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Función para hacer login y obtener token
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@ferreteria.com',
            password: 'admin123'
        });
        
        if (response.data.success) {
            console.log('✅ Login exitoso');
            return response.data.token;
        }
    } catch (error) {
        console.error('❌ Error en login:', error.response?.data || error.message);
        return null;
    }
}

// Función para probar obtener clientes
async function probarObtenerClientes(token) {
    try {
        console.log('\n🔍 Probando obtener lista de clientes...');
        
        const response = await axios.get(`${BASE_URL}/api/clientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.success) {
            console.log(`✅ Se obtuvieron ${response.data.clientes.length} clientes`);
            
            // Mostrar primeros 3 clientes
            response.data.clientes.slice(0, 3).forEach((cliente, i) => {
                const nombre = cliente.razon_social || `${cliente.nombres} ${cliente.apellidos || ''}`;
                console.log(`  ${i + 1}. ${nombre} (${cliente.numero_documento})`);
            });
            
            console.log(`📊 Paginación: Página ${response.data.pagination.page} de ${response.data.pagination.pages}`);
            console.log(`📊 Total: ${response.data.pagination.total} clientes`);
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Error obteniendo clientes:', error.response?.data || error.message);
    }
}

// Función para probar crear cliente
async function probarCrearCliente(token) {
    try {
        console.log('\n➕ Probando crear nuevo cliente...');
        
        const nuevoCliente = {
            codigo_cliente: 'CLI008',
            tipo_cliente: 'Natural',
            tipo_documento: 'CC',
            numero_documento: '99887766',
            nombres: 'Pedro José',
            apellidos: 'Hernández Morales',
            telefono: '3199887766',
            email: 'pedro.hernandez@email.com',
            direccion: 'Calle 25 #18-40',
            ciudad: 'Ibagué',
            departamento: 'Tolima',
            fecha_nacimiento: '1992-06-15'
        };
        
        const response = await axios.post(`${BASE_URL}/api/clientes`, nuevoCliente, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            const cliente = response.data.cliente;
            const nombre = cliente.razon_social || `${cliente.nombres} ${cliente.apellidos || ''}`;
            console.log(`✅ Cliente creado: ${nombre} (ID: ${cliente.id})`);
            return cliente;
        }
        
    } catch (error) {
        console.error('❌ Error creando cliente:', error.response?.data || error.message);
    }
}

// Función para probar buscar clientes
async function probarBuscarClientes(token) {
    try {
        console.log('\n🔍 Probando búsqueda de clientes...');
        
        const response = await axios.get(`${BASE_URL}/api/clientes/buscar?q=Juan`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.success) {
            console.log(`✅ Búsqueda completada: ${response.data.clientes.length} resultados para "Juan"`);
            
            response.data.clientes.forEach((cliente, i) => {
                console.log(`  ${i + 1}. ${cliente.nombre_completo} (${cliente.numero_documento})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en búsqueda:', error.response?.data || error.message);
    }
}

// Función para probar actualizar cliente
async function probarActualizarCliente(token, clienteId) {
    try {
        console.log(`\n📝 Probando actualizar cliente ID: ${clienteId}...`);
        
        const actualizacion = {
            telefono: '3001112233',
            email: 'nuevo.email@email.com',
            direccion: 'Nueva dirección 123'
        };
        
        const response = await axios.put(`${BASE_URL}/api/clientes/${clienteId}`, actualizacion, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            console.log('✅ Cliente actualizado exitosamente');
            console.log(`  Nuevo teléfono: ${response.data.cliente.telefono}`);
            console.log(`  Nuevo email: ${response.data.cliente.email}`);
        }
        
    } catch (error) {
        console.error('❌ Error actualizando cliente:', error.response?.data || error.message);
    }
}

// Función principal para ejecutar todas las pruebas
async function ejecutarPruebas() {
    console.log('🧪 Iniciando pruebas de la API de clientes...');
    console.log('═══════════════════════════════════════════════════');
    
    // 1. Login
    const token = await login();
    if (!token) {
        console.error('❌ No se pudo obtener token. Terminando pruebas.');
        return;
    }
    
    // 2. Obtener clientes
    const listaClientes = await probarObtenerClientes(token);
    
    // 3. Buscar clientes
    await probarBuscarClientes(token);
    
    // 4. Crear cliente
    const nuevoCliente = await probarCrearCliente(token);
    
    // 5. Actualizar cliente (si se creó uno nuevo)
    if (nuevoCliente && nuevoCliente.id) {
        await probarActualizarCliente(token, nuevoCliente.id);
    }
    
    console.log('\n🎉 Pruebas completadas');
    console.log('═══════════════════════════════════════════════════');
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    ejecutarPruebas()
        .then(() => {
            console.log('✅ Script de pruebas finalizado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { ejecutarPruebas };