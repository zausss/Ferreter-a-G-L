const { pool } = require('./config/database');

async function probarDatosProductos() {
    try {
        console.log('🔍 Verificando estructura de datos de productos...\n');
        
        // Obtener productos como lo hace el backend
        const query = `
            SELECT 
                p.id,
                p.codigo_producto,
                p.nombre,
                p.descripcion,
                p.precio_venta,
                p.precio_compra,
                p.margen_ganancia,
                p.stock_actual,
                p.stock_minimo,
                p.ubicacion_bodega,
                p.peso,
                p.dimensiones,
                p.activo,
                c.nombre_categoria,
                p.fecha_creacion
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = true
            ORDER BY p.nombre
            LIMIT 3;
        `;
        
        const resultado = await pool.query(query);
        
        console.log('📊 Productos desde base de datos:');
        console.table(resultado.rows);
        
        // Simular transformación del controlador
        const productosTransformados = resultado.rows.map(producto => ({
            id: producto.id,
            codigo: producto.codigo_producto,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            categoria: producto.nombre_categoria || 'Sin categoría',
            precio: parseFloat(producto.precio_venta),
            precioCompra: parseFloat(producto.precio_compra || 0),
            stock: producto.stock_actual,
            stockMinimo: producto.stock_minimo,
            ubicacion: producto.ubicacion_bodega,
            peso: producto.peso ? parseFloat(producto.peso) : null,
            dimensiones: producto.dimensiones,
            estado: producto.activo ? 
                (producto.stock_actual <= producto.stock_minimo ? 'bajo-stock' : 'activo') : 
                'inactivo'
        }));
        
        console.log('\n🔄 Productos transformados (como los recibe el frontend):');
        console.table(productosTransformados);
        
        console.log('\n🔍 Análisis para filtros:');
        productosTransformados.forEach(p => {
            console.log(`${p.nombre}:`);
            console.log(`  - Stock: ${p.stock}, Stock Mínimo: ${p.stockMinimo}`);
            console.log(`  - Categoría: "${p.categoria}"`);
            console.log(`  - ¿Stock bajo?: ${p.stock <= p.stockMinimo ? 'SÍ' : 'NO'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

probarDatosProductos();
