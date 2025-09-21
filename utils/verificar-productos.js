const { pool, conectarDB } = require('../config/database');

const verificarTablas = async () => {
    try {
        console.log('🔍 Verificando estructura de la base de datos...');
        
        // Conectar a la base de datos
        await conectarDB();
        
        // Verificar tabla categorias
        const categorias = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'categorias'
            );
        `);
        
        if (categorias.rows[0].exists) {
            console.log('✅ Tabla categorias existe');
        } else {
            console.log('❌ Tabla categorias no existe');
        }
        
        // Verificar tabla productos
        const productos = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'productos'
            );
        `);
        
        if (productos.rows[0].exists) {
            console.log('✅ Tabla productos existe');
            
            // Mostrar estructura de la tabla productos
            const estructura = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'productos'
                ORDER BY ordinal_position;
            `);
            
            console.log('\n📋 Estructura de la tabla productos:');
            estructura.rows.forEach(col => {
                console.log(`   ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
            });
            
        } else {
            console.log('❌ Tabla productos no existe - Creando...');
            await crearTablaProductos();
        }
        
        // Contar productos existentes
        if (productos.rows[0].exists) {
            const count = await pool.query('SELECT COUNT(*) FROM productos');
            console.log(`\n📊 Total de productos en la base de datos: ${count.rows[0].count}`);
            
            if (count.rows[0].count == 0) {
                console.log('💡 Agregando productos de ejemplo...');
                await agregarProductosEjemplo();
            }
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error verificando tablas:', error);
        process.exit(1);
    }
};

const crearTablaProductos = async () => {
    try {
        await pool.query(`
            CREATE TABLE productos (
                id SERIAL PRIMARY KEY,
                codigo_producto VARCHAR(50) UNIQUE NOT NULL,
                nombre VARCHAR(200) NOT NULL,
                descripcion TEXT,
                precio_venta DECIMAL(10,2) NOT NULL,
                precio_compra DECIMAL(10,2),
                stock_actual INTEGER NOT NULL DEFAULT 0,
                stock_minimo INTEGER NOT NULL DEFAULT 5,
                categoria_id INTEGER REFERENCES categorias(id),
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla productos creada exitosamente');
    } catch (error) {
        console.error('❌ Error creando tabla productos:', error);
        throw error;
    }
};

const agregarProductosEjemplo = async () => {
    try {
        // Primero verificar si existen categorías
        const categorias = await pool.query('SELECT id, nombre_categoria FROM categorias LIMIT 5');
        
        if (categorias.rows.length === 0) {
            console.log('⚠️  No hay categorías. Creando categorías de ejemplo...');
            await pool.query(`
                INSERT INTO categorias (nombre_categoria, descripcion, activo) VALUES
                ('Herramientas', 'Herramientas manuales y eléctricas', true),
                ('Materiales', 'Materiales de construcción', true),
                ('Electricidad', 'Productos eléctricos', true),
                ('Plomería', 'Accesorios de plomería', true)
                ON CONFLICT DO NOTHING;
            `);
        }
        
        // Agregar productos de ejemplo
        await pool.query(`
            INSERT INTO productos (
                codigo_producto, nombre, descripcion, precio_venta, precio_compra, 
                stock_actual, stock_minimo, categoria_id, activo
            ) VALUES
            ('FER001', 'Martillo de Garra 16oz', 'Martillo de acero con mango de fibra de vidrio', 15.99, 11.19, 25, 5, 1, true),
            ('FER002', 'Destornillador Phillips #2', 'Destornillador Phillips punta magnética', 5.50, 3.85, 50, 10, 1, true),
            ('MAT001', 'Cemento Portland 50kg', 'Cemento de alta resistencia', 8.75, 6.13, 10, 15, 2, true),
            ('ELE001', 'Cable AWG 12', 'Cable eléctrico AWG 12 por metro', 2.30, 1.61, 100, 20, 3, true),
            ('PLO001', 'Tubo PVC 4 pulgadas', 'Tubo PVC para drenaje 4 pulgadas', 12.50, 8.75, 8, 10, 4, true)
            ON CONFLICT (codigo_producto) DO NOTHING;
        `);
        
        console.log('✅ Productos de ejemplo agregados');
        
    } catch (error) {
        console.error('❌ Error agregando productos de ejemplo:', error);
        throw error;
    }
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    verificarTablas();
}

module.exports = { verificarTablas, crearTablaProductos, agregarProductosEjemplo };
