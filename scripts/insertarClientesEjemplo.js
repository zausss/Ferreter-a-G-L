const { pool } = require('../config/database');

async function insertarClientesEjemplo() {
    const client = await pool.connect();
    
    try {
        console.log('👥 Insertando clientes de ejemplo...');
        
        const clientesEjemplo = [
            {
                codigo_cliente: 'CLI001',
                tipo_cliente: 'Natural',
                tipo_documento: 'CC',
                numero_documento: '12345678',
                nombres: 'Juan Carlos',
                apellidos: 'Pérez García',
                telefono: '3001234567',
                email: 'juan.perez@email.com',
                direccion: 'Calle 123 #45-67',
                ciudad: 'Bogotá',
                departamento: 'Cundinamarca',
                fecha_nacimiento: '1985-03-15'
            },
            {
                codigo_cliente: 'CLI002',
                tipo_cliente: 'Natural',
                tipo_documento: 'CC',
                numero_documento: '87654321',
                nombres: 'María Fernanda',
                apellidos: 'González López',
                telefono: '3109876543',
                email: 'maria.gonzalez@email.com',
                direccion: 'Carrera 10 #20-30',
                ciudad: 'Medellín',
                departamento: 'Antioquia',
                fecha_nacimiento: '1990-07-22'
            },
            {
                codigo_cliente: 'CLI003',
                tipo_cliente: 'Natural',
                tipo_documento: 'CE',
                numero_documento: '98765432',
                nombres: 'Carlos Alberto',
                apellidos: 'Rodríguez Silva',
                telefono: '3157894561',
                email: 'carlos.rodriguez@email.com',
                direccion: 'Avenida 50 #15-25',
                ciudad: 'Cali',
                departamento: 'Valle del Cauca',
                fecha_nacimiento: '1988-11-10'
            },
            {
                codigo_cliente: 'CLI004',
                tipo_cliente: 'Jurídica',
                tipo_documento: 'NIT',
                numero_documento: '900123456',
                razon_social: 'Empresa XYZ S.A.S.',
                telefono: '6017894561',
                email: 'contacto@empresaxyz.com',
                direccion: 'Zona Industrial Km 5',
                ciudad: 'Barranquilla',
                departamento: 'Atlántico'
            },
            {
                codigo_cliente: 'CLI005',
                tipo_cliente: 'Natural',
                tipo_documento: 'CC',
                numero_documento: '11223344',
                nombres: 'Ana Sofía',
                apellidos: 'Martínez Torres',
                telefono: '3201122334',
                email: 'ana.martinez@email.com',
                direccion: 'Calle 5 #8-12',
                ciudad: 'Cartagena',
                departamento: 'Bolívar',
                fecha_nacimiento: '1995-04-18'
            },
            {
                codigo_cliente: 'CLI006',
                tipo_cliente: 'Natural',
                tipo_documento: 'CC',
                numero_documento: '55667788',
                nombres: 'Luis Fernando',
                apellidos: 'Ramírez Vargas',
                telefono: '3145566778',
                email: 'luis.ramirez@email.com',
                direccion: 'Transversal 15 #30-45',
                ciudad: 'Bucaramanga',
                departamento: 'Santander',
                fecha_nacimiento: '1987-09-12'
            },
            {
                codigo_cliente: 'CLI007',
                tipo_cliente: 'Jurídica',
                tipo_documento: 'NIT',
                numero_documento: '800987654',
                razon_social: 'Constructora Los Andes Ltda.',
                telefono: '6023334455',
                email: 'gerencia@constructoralosandes.com',
                direccion: 'Calle 80 #100-25',
                ciudad: 'Pereira',
                departamento: 'Risaralda'
            }
        ];
        
        for (const cliente of clientesEjemplo) {
            try {
                const query = `
                    INSERT INTO clientes (
                        codigo_cliente, tipo_cliente, tipo_documento, numero_documento,
                        nombres, apellidos, razon_social, telefono, email, direccion,
                        ciudad, departamento, fecha_nacimiento, activo
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (numero_documento) DO NOTHING
                    RETURNING id, numero_documento, nombres, apellidos, razon_social
                `;
                
                const values = [
                    cliente.codigo_cliente,
                    cliente.tipo_cliente,
                    cliente.tipo_documento,
                    cliente.numero_documento,
                    cliente.nombres || null,
                    cliente.apellidos || null,
                    cliente.razon_social || null,
                    cliente.telefono,
                    cliente.email,
                    cliente.direccion,
                    cliente.ciudad,
                    cliente.departamento,
                    cliente.fecha_nacimiento || null,
                    true
                ];
                
                const result = await client.query(query, values);
                
                if (result.rows.length > 0) {
                    const insertado = result.rows[0];
                    const nombre = insertado.razon_social || `${insertado.nombres} ${insertado.apellidos || ''}`;
                    console.log(`  ✅ Cliente insertado: ${nombre} (${insertado.numero_documento})`);
                } else {
                    console.log(`  ⚠️  Cliente ya existe: ${cliente.numero_documento}`);
                }
                
            } catch (error) {
                console.error(`  ❌ Error insertando cliente ${cliente.numero_documento}:`, error.message);
            }
        }
        
        // Verificar total de clientes
        const conteo = await client.query('SELECT COUNT(*) FROM clientes WHERE activo = true');
        console.log(`\n📊 Total de clientes activos: ${conteo.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error insertando clientes:', error);
    } finally {
        client.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    insertarClientesEjemplo()
        .then(() => {
            console.log('✅ Script completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en el script:', error);
            process.exit(1);
        });
}

module.exports = { insertarClientesEjemplo };