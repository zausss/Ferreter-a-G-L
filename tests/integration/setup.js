const { pool } = require('../../config/database');

// Configuración para pruebas de integración
class IntegrationTestSetup {
    static async setupDatabase() {
        // Crear esquema de pruebas si no existe
        await pool.query(`
            CREATE SCHEMA IF NOT EXISTS test_ferreteria;
        `);
        
        // Usar esquema de pruebas
        await pool.query(`SET search_path TO test_ferreteria, public;`);
        
        // Crear tablas necesarias para las pruebas
        await this.createTestTables();
        await this.insertTestData();
    }
    
    static async createTestTables() {
        // Crear tabla de categorías de prueba
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_ferreteria.categorias (
                id SERIAL PRIMARY KEY,
                nombre_categoria VARCHAR(100) NOT NULL,
                codigo_categoria VARCHAR(20) UNIQUE NOT NULL,
                descripcion TEXT,
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Crear tabla de productos de prueba
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_ferreteria.productos (
                id SERIAL PRIMARY KEY,
                codigo_producto VARCHAR(50) UNIQUE NOT NULL,
                nombre VARCHAR(200) NOT NULL,
                descripcion TEXT,
                precio_venta DECIMAL(10,2) NOT NULL,
                precio_compra DECIMAL(10,2) DEFAULT 0,
                margen_ganancia DECIMAL(5,2) DEFAULT 0,
                stock_actual INTEGER DEFAULT 0,
                stock_minimo INTEGER DEFAULT 0,
                categoria_id INTEGER REFERENCES test_ferreteria.categorias(id),
                ubicacion_bodega VARCHAR(50),
                peso DECIMAL(8,3),
                dimensiones VARCHAR(100),
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Crear tabla de empleados de prueba
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_ferreteria.empleados (
                id SERIAL PRIMARY KEY,
                cedula VARCHAR(20) UNIQUE NOT NULL,
                nombre_completo VARCHAR(200) NOT NULL,
                telefono VARCHAR(20),
                correo_electronico VARCHAR(100),
                direccion TEXT,
                cargo_id INTEGER DEFAULT 1,
                fecha_ingreso DATE DEFAULT CURRENT_DATE,
                activo BOOLEAN DEFAULT true
            );
        `);
        
        // Crear tabla de facturas de prueba
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_ferreteria.facturas (
                id SERIAL PRIMARY KEY,
                numero_factura VARCHAR(50) UNIQUE NOT NULL,
                fecha_factura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cliente_nombre VARCHAR(200),
                cliente_cedula VARCHAR(20),
                cliente_telefono VARCHAR(20),
                subtotal DECIMAL(12,2) DEFAULT 0,
                impuestos DECIMAL(12,2) DEFAULT 0,
                descuento DECIMAL(12,2) DEFAULT 0,
                total DECIMAL(12,2) NOT NULL,
                metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
                estado VARCHAR(20) DEFAULT 'Completada',
                empleado_id INTEGER REFERENCES test_ferreteria.empleados(id),
                observaciones TEXT
            );
        `);
        
        // Crear tabla de detalles de factura de prueba
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_ferreteria.factura_detalles (
                id SERIAL PRIMARY KEY,
                factura_id INTEGER REFERENCES test_ferreteria.facturas(id) ON DELETE CASCADE,
                producto_id INTEGER REFERENCES test_ferreteria.productos(id),
                cantidad INTEGER NOT NULL,
                precio_unitario DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(12,2) NOT NULL
            );
        `);
    }
    
    static async insertTestData() {
        // Insertar categorías de prueba
        await pool.query(`
            INSERT INTO test_ferreteria.categorias (nombre_categoria, codigo_categoria, descripcion)
            VALUES 
                ('Herramientas', 'HER001', 'Herramientas manuales y eléctricas'),
                ('Tornillería', 'TOR001', 'Tornillos, tuercas y arandelas'),
                ('Pinturas', 'PIN001', 'Pinturas y materiales para pintura')
            ON CONFLICT (codigo_categoria) DO NOTHING;
        `);
        
        // Insertar productos de prueba
        await pool.query(`
            INSERT INTO test_ferreteria.productos (codigo_producto, nombre, descripcion, precio_venta, precio_compra, stock_actual, stock_minimo, categoria_id)
            VALUES 
                ('P001', 'Martillo Carpintero', 'Martillo de carpintero 16oz', 25000, 15000, 10, 5, 1),
                ('P002', 'Tornillo 3/4', 'Tornillo cabeza plana 3/4 pulgada', 500, 300, 100, 20, 2),
                ('P003', 'Pintura Blanca', 'Pintura látex blanca 1 galón', 45000, 30000, 5, 3, 3),
                ('P004', 'Destornillador Phillips', 'Destornillador Phillips mediano', 8000, 5000, 15, 5, 1)
            ON CONFLICT (codigo_producto) DO NOTHING;
        `);
        
        // Insertar empleado de prueba
        await pool.query(`
            INSERT INTO test_ferreteria.empleados (cedula, nombre_completo, correo_electronico, cargo_id)
            VALUES 
                ('12345678', 'Usuario Prueba', 'prueba@test.com', 1)
            ON CONFLICT (cedula) DO NOTHING;
        `);
    }
    
    static async cleanupDatabase() {
        // Limpiar datos de prueba
        await pool.query(`DELETE FROM test_ferreteria.factura_detalles;`);
        await pool.query(`DELETE FROM test_ferreteria.facturas;`);
        await pool.query(`DELETE FROM test_ferreteria.productos;`);
        await pool.query(`DELETE FROM test_ferreteria.categorias;`);
        await pool.query(`DELETE FROM test_ferreteria.empleados;`);
    }
    
    static async teardownDatabase() {
        // Eliminar esquema de pruebas
        await pool.query(`DROP SCHEMA IF EXISTS test_ferreteria CASCADE;`);
    }
}

module.exports = IntegrationTestSetup;