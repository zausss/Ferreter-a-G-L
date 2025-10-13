const { pool } = require('../config/database');

async function crearTablaClientes() {
    const client = await pool.connect();
    
    try {
        console.log('📋 Creando tabla de clientes...');
        
        // Crear tabla de clientes
        const crearTablaSQL = `
            CREATE TABLE IF NOT EXISTS clientes (
                id SERIAL PRIMARY KEY,
                tipo_documento VARCHAR(5) DEFAULT 'CC' CHECK (tipo_documento IN ('CC', 'CE', 'NIT', 'PAS', 'TI')),
                numero_documento VARCHAR(20) NOT NULL UNIQUE,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100),
                telefono VARCHAR(20),
                email VARCHAR(150),
                direccion VARCHAR(200),
                ciudad VARCHAR(100),
                fecha_nacimiento DATE,
                estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'eliminado')),
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await client.query(crearTablaSQL);
        console.log('✅ Tabla clientes creada exitosamente');
        
        // Crear índices
        console.log('📊 Creando índices...');
        
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_clientes_numero_documento ON clientes(numero_documento);',
            'CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);',
            'CREATE INDEX IF NOT EXISTS idx_clientes_apellido ON clientes(apellido);',
            'CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);',
            'CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);'
        ];
        
        for (const indice of indices) {
            await client.query(indice);
        }
        
        console.log('✅ Índices creados exitosamente');
        
        // Insertar datos de ejemplo
        console.log('👥 Insertando clientes de ejemplo...');
        
        const clientesEjemplo = `
            INSERT INTO clientes (
                tipo_documento, numero_documento, nombre, apellido, 
                telefono, email, direccion, ciudad, fecha_nacimiento
            ) VALUES 
            (
                'CC', '12345678', 'Juan Carlos', 'Pérez García',
                '3001234567', 'juan.perez@email.com', 'Calle 123 #45-67', 'Bogotá', '1985-03-15'
            ),
            (
                'CC', '87654321', 'María Fernanda', 'González López',
                '3109876543', 'maria.gonzalez@email.com', 'Carrera 10 #20-30', 'Medellín', '1990-07-22'
            ),
            (
                'CE', '98765432', 'Carlos Alberto', 'Rodríguez Silva',
                '3157894561', 'carlos.rodriguez@email.com', 'Avenida 50 #15-25', 'Cali', '1988-11-10'
            ),
            (
                'NIT', '900123456', 'Empresa XYZ', 'S.A.S.',
                '6017894561', 'contacto@empresaxyz.com', 'Zona Industrial Km 5', 'Barranquilla', NULL
            ),
            (
                'CC', '11223344', 'Ana Sofía', 'Martínez Torres',
                '3201122334', 'ana.martinez@email.com', 'Calle 5 #8-12', 'Cartagena', '1995-04-18'
            ) ON CONFLICT (numero_documento) DO NOTHING;
        `;
        
        const result = await client.query(clientesEjemplo);
        console.log('✅ Clientes de ejemplo insertados');
        
        // Verificar datos
        const verificacion = await client.query('SELECT COUNT(*) FROM clientes');
        console.log(`📊 Total de clientes en la base de datos: ${verificacion.rows[0].count}`);
        
        console.log('🎉 ¡Tabla de clientes configurada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error creando tabla de clientes:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    crearTablaClientes()
        .then(() => {
            console.log('✅ Script completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en el script:', error);
            process.exit(1);
        });
}

module.exports = { crearTablaClientes };