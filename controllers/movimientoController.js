const { pool } = require('../config/database');

class MovimientoController {
    
    // Crear un nuevo movimiento de stock
    static async crearMovimiento(req, res) {
        try {
            const { producto_id, tipo_movimiento, cantidad, motivo, proveedor_id, observaciones } = req.body;
            
            // Validaciones básicas
            if (!producto_id || !tipo_movimiento || !cantidad) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos: producto_id, tipo_movimiento, cantidad'
                });
            }
            
            if (!['entrada', 'salida'].includes(tipo_movimiento)) {
                return res.status(400).json({
                    success: false,
                    message: 'El tipo de movimiento debe ser "entrada" o "salida"'
                });
            }
            
            if (cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }
            
            // Obtener información del producto actual
            const productoResult = await pool.query(
                'SELECT id, nombre, stock_actual FROM productos WHERE id = $1',
                [producto_id]
            );
            
            if (productoResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            const producto = productoResult.rows[0];
            let nuevoStock = producto.stock_actual;
            
            // Calcular nuevo stock según el tipo de movimiento
            if (tipo_movimiento === 'entrada') {
                nuevoStock += parseInt(cantidad);
            } else {
                nuevoStock -= parseInt(cantidad);
                
                // Verificar que no quede stock negativo
                if (nuevoStock < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `No hay suficiente stock. Stock actual: ${producto.stock_actual}, cantidad solicitada: ${cantidad}`
                    });
                }
            }
            
            // Iniciar transacción
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Registrar el movimiento
                const movimientoResult = await client.query(`
                    INSERT INTO movimientos_stock (
                        producto_id, 
                        tipo_movimiento, 
                        cantidad, 
                        stock_anterior, 
                        stock_nuevo, 
                        motivo, 
                        observaciones,
                        fecha_movimiento
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    RETURNING *
                `, [
                    producto_id,
                    tipo_movimiento,
                    cantidad,
                    producto.stock_actual,
                    nuevoStock,
                    motivo || null,
                    // Si existe proveedor_id, agregarlo a las observaciones
                    (proveedor_id || observaciones) ? 
                        (proveedor_id ? `Proveedor ID: ${proveedor_id}${observaciones ? '\n' + observaciones : ''}` : observaciones) : 
                        null
                ]);
                
                // Actualizar el stock del producto
                await client.query(
                    'UPDATE productos SET stock_actual = $1 WHERE id = $2',
                    [nuevoStock, producto_id]
                );
                
                await client.query('COMMIT');
                
                res.status(201).json({
                    success: true,
                    message: `Movimiento de ${tipo_movimiento} registrado exitosamente`,
                    data: {
                        movimiento: movimientoResult.rows[0],
                        producto: producto.nombre,
                        stock_anterior: producto.stock_actual,
                        stock_nuevo: nuevoStock
                    }
                });
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('Error creando movimiento:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    
    // Obtener historial de movimientos
    static async obtenerMovimientos(req, res) {
        try {
            const { producto_id, tipo, limite = 50, pagina = 1 } = req.query;
            
            let query = `
                SELECT 
                    m.*,
                    p.nombre as producto_nombre,
                    p.codigo_producto
                FROM movimientos_stock m
                LEFT JOIN productos p ON m.producto_id = p.id
                WHERE 1=1
            `;
            const queryParams = [];
            let paramCount = 0;
            
            if (producto_id) {
                paramCount++;
                query += ` AND m.producto_id = $${paramCount}`;
                queryParams.push(producto_id);
            }
            
            if (tipo) {
                paramCount++;
                query += ` AND m.tipo_movimiento = $${paramCount}`;
                queryParams.push(tipo);
            }
            
            query += ` ORDER BY m.fecha_movimiento DESC`;
            
            // Paginación
            const offset = (parseInt(pagina) - 1) * parseInt(limite);
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            queryParams.push(parseInt(limite));
            
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            queryParams.push(offset);
            
            const result = await pool.query(query, queryParams);
            
            res.json({
                success: true,
                data: result.rows
            });
            
        } catch (error) {
            console.error('Error obteniendo movimientos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener pedidos recientes (movimientos de entrada del día)
    static async obtenerRecientes(req, res) {
        try {
            const { limite } = req.query;
            const limit = Math.min(Math.max(parseInt(limite || '5', 10) || 5, 1), 100);

            const query = `
                SELECT
                    m.id,
                    m.producto_id,
                    m.tipo_movimiento,
                    m.cantidad,
                    m.fecha_movimiento AS fecha,
                    m.observaciones,
                    p.nombre AS producto_nombre,
                    p.codigo_producto,
                    p.precio_unitario
                FROM movimientos_stock m
                LEFT JOIN productos p ON p.id = m.producto_id
                WHERE m.tipo_movimiento = 'entrada'
                AND m.fecha_movimiento::date = CURRENT_DATE
                ORDER BY m.fecha_movimiento DESC
                LIMIT $1
            `;

            const result = await pool.query(query, [limit]);

            // Formatear datos para el frontend
            const pedidos = result.rows.map(row => ({
                id: row.id,
                descripcion: `Pedido: ${row.producto_nombre} (${row.codigo_producto})`,
                cantidad: row.cantidad,
                producto_nombre: row.producto_nombre,
                codigo_producto: row.codigo_producto,
                precio_unitario: row.precio_unitario,
                total: row.cantidad * (row.precio_unitario || 0),
                fecha: row.fecha,
                estado: 'completado'
            }));

            res.json({
                exito: true,
                pedidos: pedidos
            });

        } catch (error) {
            console.error('Error obteniendo pedidos recientes:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
}

module.exports = MovimientoController;
