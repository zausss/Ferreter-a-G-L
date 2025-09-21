const { pool } = require('../config/database');

class Producto {
    
    // Obtener todos los productos
    static async obtenerTodos() {
        try {
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
                ORDER BY p.nombre;
            `;
            
            const resultado = await pool.query(query);
            return resultado.rows;
            
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            throw error;
        }
    }
    
    // Buscar producto por ID
    static async buscarPorId(id) {
        try {
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
                    p.categoria_id,
                    p.activo,
                    c.nombre_categoria
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.id = $1;
            `;
            
            const resultado = await pool.query(query, [id]);
            return resultado.rows[0] || null;
            
        } catch (error) {
            console.error('Error buscando producto por ID:', error);
            throw error;
        }
    }
    
    // Buscar productos por categoría
    static async buscarPorCategoria(categoriaId) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.codigo_producto,
                    p.nombre,
                    p.descripcion,
                    p.precio_venta,
                    p.stock_actual,
                    c.nombre_categoria
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.categoria_id = $1 AND p.activo = true
                ORDER BY p.nombre;
            `;
            
            const resultado = await pool.query(query, [categoriaId]);
            return resultado.rows;
            
        } catch (error) {
            console.error('Error buscando productos por categoría:', error);
            throw error;
        }
    }
    
    // Crear nuevo producto
    static async crear(datosProducto) {
        try {
            const {
                codigo_producto,
                nombre,
                descripcion,
                precio_venta,
                precio_compra,
                margen_ganancia,
                stock_actual,
                stock_minimo,
                ubicacion_bodega,
                peso,
                dimensiones,
                categoria_id
            } = datosProducto;
            
            const query = `
                INSERT INTO productos (
                    codigo_producto, nombre, descripcion, 
                    precio_venta, precio_compra, margen_ganancia,
                    stock_actual, stock_minimo, ubicacion_bodega,
                    peso, dimensiones, categoria_id, activo, fecha_creacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, CURRENT_TIMESTAMP)
                RETURNING id, codigo_producto, nombre;
            `;
            
            const valores = [
                codigo_producto, nombre, descripcion,
                precio_venta, precio_compra, margen_ganancia,
                stock_actual, stock_minimo, ubicacion_bodega,
                peso, dimensiones, categoria_id
            ];
            
            const resultado = await pool.query(query, valores);
            return resultado.rows[0];
            
        } catch (error) {
            console.error('Error creando producto:', error);
            throw error;
        }
    }
    
    // Actualizar producto
    static async actualizar(id, datosProducto) {
        try {
            const {
                nombre,
                descripcion,
                precio_venta,
                precio_compra,
                margen_ganancia,
                stock_actual,
                stock_minimo,
                ubicacion_bodega,
                peso,
                dimensiones,
                categoria_id
            } = datosProducto;
            
            const query = `
                UPDATE productos 
                SET nombre = $1, descripcion = $2, precio_venta = $3,
                    precio_compra = $4, margen_ganancia = $5, stock_actual = $6, 
                    stock_minimo = $7, ubicacion_bodega = $8, peso = $9,
                    dimensiones = $10, categoria_id = $11, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $12 AND activo = true
                RETURNING id, nombre;
            `;
            
            const valores = [
                nombre, descripcion, precio_venta,
                precio_compra, margen_ganancia, stock_actual, 
                stock_minimo, ubicacion_bodega, peso,
                dimensiones, categoria_id, id
            ];
            
            const resultado = await pool.query(query, valores);
            return resultado.rows[0] || null;
            
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    }
    
    // Eliminar producto (soft delete)
    static async eliminar(id) {
        try {
            const query = `
                UPDATE productos 
                SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, nombre;
            `;
            
            const resultado = await pool.query(query, [id]);
            return resultado.rows[0] || null;
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }
    
    // Buscar productos con stock bajo
    static async stockBajo() {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.codigo_producto,
                    p.nombre,
                    p.stock_actual,
                    p.stock_minimo,
                    c.nombre_categoria
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.stock_actual <= p.stock_minimo 
                AND p.activo = true
                ORDER BY p.stock_actual ASC;
            `;
            
            const resultado = await pool.query(query);
            return resultado.rows;
            
        } catch (error) {
            console.error('Error obteniendo productos con stock bajo:', error);
            throw error;
        }
    }

    // Obtener estadísticas de productos para el dashboard
    static async obtenerEstadisticas() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_productos,
                    COUNT(*) FILTER (WHERE stock_actual > 0) as productos_con_stock,
                    COUNT(*) FILTER (WHERE stock_actual <= stock_minimo) as productos_stock_bajo,
                    SUM(stock_actual * precio_venta) as valor_total_inventario
                FROM productos 
                WHERE activo = true;
            `;
            
            const resultado = await pool.query(query);
            return resultado.rows[0];
            
        } catch (error) {
            console.error('Error obteniendo estadísticas de productos:', error);
            throw error;
        }
    }
}

module.exports = Producto;