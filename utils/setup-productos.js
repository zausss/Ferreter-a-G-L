const { pool, conectarDB } = require('../config/database');

const verificarCategorias = async () => {
    try {
        console.log('🔍 Verificando categorías existentes...');
        
        // Conectar a la base de datos
        await conectarDB();
        
        // Ver categorías existentes
        const categorias = await pool.query('SELECT id, nombre_categoria FROM categorias ORDER BY id');
        
        console.log('\n📋 Categorías existentes:');
        categorias.rows.forEach(cat => {
            console.log(`   ID: ${cat.id} - Nombre: ${cat.nombre_categoria}`);
        });
        
        // Si no hay suficientes categorías, crearlas
        if (categorias.rows.length < 4) {
            console.log('\n🔧 Creando categorías faltantes...');
            
            const categoriasNecesarias = [
                { nombre: 'Herramientas', descripcion: 'Herramientas manuales y eléctricas' },
                { nombre: 'Materiales', descripcion: 'Materiales de construcción' },
                { nombre: 'Electricidad', descripcion: 'Productos eléctricos' },
                { nombre: 'Plomería', descripcion: 'Accesorios de plomería' }
            ];
            
            for (const categoria of categoriasNecesarias) {
                const existe = categorias.rows.some(cat => 
                    cat.nombre_categoria.toLowerCase() === categoria.nombre.toLowerCase()
                );
                
                if (!existe) {
                    await pool.query(`
                        INSERT INTO categorias (nombre_categoria, descripcion, activo) 
                        VALUES ($1, $2, true)
                    `, [categoria.nombre, categoria.descripcion]);
                    console.log(`✅ Categoría "${categoria.nombre}" creada`);
                }
            }
        }
        
        // Mostrar categorías actualizadas
        const categoriasActualizadas = await pool.query('SELECT id, nombre_categoria FROM categorias ORDER BY id');
        console.log('\n📋 Categorías finales:');
        categoriasActualizadas.rows.forEach(cat => {
            console.log(`   ID: ${cat.id} - Nombre: ${cat.nombre_categoria}`);
        });
        
        // Ahora agregar productos usando los IDs correctos
        console.log('\n💡 Agregando productos de ejemplo...');
        await agregarProductos(categoriasActualizadas.rows);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

const agregarProductos = async (categorias) => {
    try {
        // Verificar si ya hay productos
        const count = await pool.query('SELECT COUNT(*) FROM productos');
        if (count.rows[0].count > 0) {
            console.log('⚠️  Ya existen productos en la base de datos');
            return;
        }
        
        // Mapear categorías por nombre
        const categoriasMap = {};
        categorias.forEach(cat => {
            categoriasMap[cat.nombre_categoria.toLowerCase()] = cat.id;
        });
        
        const productos = [
            {
                codigo: 'FER001',
                nombre: 'Martillo de Garra 16oz',
                descripcion: 'Martillo de acero con mango de fibra de vidrio',
                precio_venta: 15.99,
                precio_compra: 11.19,
                stock: 25,
                stock_min: 5,
                categoria: 'herramientas'
            },
            {
                codigo: 'FER002',
                nombre: 'Destornillador Phillips #2',
                descripcion: 'Destornillador Phillips punta magnética',
                precio_venta: 5.50,
                precio_compra: 3.85,
                stock: 50,
                stock_min: 10,
                categoria: 'herramientas'
            },
            {
                codigo: 'MAT001',
                nombre: 'Cemento Portland 50kg',
                descripcion: 'Cemento de alta resistencia',
                precio_venta: 8.75,
                precio_compra: 6.13,
                stock: 10,
                stock_min: 15,
                categoria: 'materiales'
            }
        ];
        
        for (const producto of productos) {
            let categoria_id = categoriasMap[producto.categoria];
            
            // Si no encuentra la categoría exacta, usar la primera disponible
            if (!categoria_id) {
                categoria_id = categorias[0].id;
            }
            
            await pool.query(`
                INSERT INTO productos (
                    codigo_producto, nombre, descripcion, precio_venta, precio_compra, 
                    stock_actual, stock_minimo, categoria_id, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                ON CONFLICT (codigo_producto) DO NOTHING
            `, [
                producto.codigo,
                producto.nombre,
                producto.descripcion,
                producto.precio_venta,
                producto.precio_compra,
                producto.stock,
                producto.stock_min,
                categoria_id
            ]);
            
            console.log(`✅ Producto "${producto.nombre}" agregado`);
        }
        
        const totalProductos = await pool.query('SELECT COUNT(*) FROM productos');
        console.log(`\n📊 Total de productos: ${totalProductos.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error agregando productos:', error);
        throw error;
    }
};

// Ejecutar
if (require.main === module) {
    verificarCategorias();
}

module.exports = { verificarCategorias };
