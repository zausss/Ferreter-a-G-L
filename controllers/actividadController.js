const { pool } = require('../config/database');

class ActividadController {
    // Devuelve actividades recientes (prioriza "hoy") para el dashboard
    // Formato esperado por frontend (menu.js):
    // { exito: true, actividades: [{ descripcion, fecha, estado }] }
    static async obtenerRecientes(req, res) {
        try {
            const { limite } = req.query;
            const limit = Math.min(Math.max(parseInt(limite || '20', 10) || 20, 1), 100);

            // 1) Ventas del día
            const ventasQuery = `
                SELECT
                    v.fecha_venta AS fecha,
                    'completado'::text AS estado,
                    'Venta procesada'::text AS tipo
                FROM ventas v
                WHERE v.fecha_venta::date = CURRENT_DATE
                ORDER BY v.fecha_venta DESC
                LIMIT $1
            `;

            // 2) Movimientos stock recientes (hoy)
            const movimientosQuery = `
                SELECT
                    m.fecha_movimiento AS fecha,
                    'completado'::text AS estado,
                    CASE
                        WHEN m.tipo_movimiento = 'entrada' THEN 'Entrada de inventario'
                        ELSE 'Salida de inventario'
                    END AS tipo,
                    p.nombre AS producto_nombre,
                    m.cantidad AS cantidad
                FROM movimientos_stock m
                LEFT JOIN productos p ON p.id = m.producto_id
                WHERE m.fecha_movimiento::date = CURRENT_DATE
                ORDER BY m.fecha_movimiento DESC
                LIMIT $1
            `;

            // 3) Productos creados hoy
            const productosCreadosQuery = `
                SELECT
                    p.fecha_creacion AS fecha,
                    'completado'::text AS estado,
                    p.nombre AS producto_nombre,
                    p.codigo_producto AS codigo
                FROM productos p
                WHERE p.fecha_creacion::date = CURRENT_DATE
                ORDER BY p.fecha_creacion DESC
                LIMIT $1
            `;

            const [ventasResult, movResult, productosResult] = await Promise.all([
                pool.query(ventasQuery, [limit]),
                pool.query(movimientosQuery, [limit]),
                pool.query(productosCreadosQuery, [limit])
            ]);

            const actividades = [];

            ventasResult.rows.forEach(r => {
                actividades.push({
                    descripcion: r.tipo,
                    fecha: r.fecha,
                    estado: r.estado
                });
            });

            movResult.rows.forEach(r => {
                const nombre = r.producto_nombre ? `: ${r.producto_nombre}` : '';
                const cant = r.cantidad != null ? ` (${r.cantidad})` : '';
                actividades.push({
                    descripcion: `${r.tipo}${nombre}${cant}`,
                    fecha: r.fecha,
                    estado: r.estado
                });
            });

            productosResult.rows.forEach(r => {
                const nombre = r.producto_nombre ? r.producto_nombre : '—';
                const codigo = r.codigo ? ` (${r.codigo})` : '';
                actividades.push({
                    descripcion: `Producto agregado: ${nombre}${codigo}`,
                    fecha: r.fecha,
                    estado: r.estado
                });
            });

            // Ordenar por fecha desc y limitar
            actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

            res.json({
                exito: true,
                actividades: actividades.slice(0, limit)
            });
        } catch (error) {
            console.error('Error obteniendo actividades recientes:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ActividadController;
