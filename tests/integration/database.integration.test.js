const { pool } = require('../../config/database');
const IntegrationTestSetup = require('./setup');

describe('Pruebas de Integración - Base de Datos', () => {
    beforeAll(async () => {
        await IntegrationTestSetup.setupDatabase();
    });

    afterAll(async () => {
        await IntegrationTestSetup.teardownDatabase();
    });

    beforeEach(async () => {
        await IntegrationTestSetup.cleanupDatabase();
        await IntegrationTestSetup.insertTestData();
    });

    describe('Integridad Referencial', () => {
        test('Producto debe tener categoría válida', async () => {
            // Intentar crear producto con categoría inexistente
            const query = `
                INSERT INTO test_ferreteria.productos (codigo_producto, nombre, precio_venta, categoria_id)
                VALUES ('P999', 'Producto Inválido', 1000, 99999)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
        });

        test('Eliminar categoría con productos asociados debe fallar', async () => {
            // Intentar eliminar categoría que tiene productos
            const query = `DELETE FROM test_ferreteria.categorias WHERE id = 1`;

            await expect(pool.query(query))
                .rejects.toThrow();
        });

        test('Factura debe tener empleado válido', async () => {
            const query = `
                INSERT INTO test_ferreteria.facturas (numero_factura, total, empleado_id)
                VALUES ('FAC999', 1000, 99999)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
        });

        test('Detalle de factura debe referenciar factura y producto válidos', async () => {
            const query = `
                INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                VALUES (99999, 99999, 1, 1000, 1000)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
        });
    });

    describe('Transacciones ACID', () => {
        test('Transacción exitosa de venta completa', async () => {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Crear factura
                const facturaQuery = `
                    INSERT INTO test_ferreteria.facturas (numero_factura, cliente_nombre, total, empleado_id)
                    VALUES ('TRANS001', 'Cliente Transaccional', 25000, 1)
                    RETURNING id
                `;
                const facturaResult = await client.query(facturaQuery);
                const facturaId = facturaResult.rows[0].id;

                // 2. Obtener producto y su stock actual
                const stockQuery = `
                    SELECT id, stock_actual FROM test_ferreteria.productos 
                    WHERE codigo_producto = 'P001'
                `;
                const stockResult = await client.query(stockQuery);
                const producto = stockResult.rows[0];
                const stockInicial = producto.stock_actual;

                // 3. Crear detalle de factura
                const detalleQuery = `
                    INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES ($1, $2, 1, 25000, 25000)
                `;
                await client.query(detalleQuery, [facturaId, producto.id]);

                // 4. Actualizar stock del producto
                const updateStockQuery = `
                    UPDATE test_ferreteria.productos 
                    SET stock_actual = stock_actual - 1 
                    WHERE id = $1
                `;
                await client.query(updateStockQuery, [producto.id]);

                await client.query('COMMIT');

                // Verificar que todo se guardó correctamente
                const verificarFactura = await pool.query(
                    'SELECT * FROM test_ferreteria.facturas WHERE id = $1',
                    [facturaId]
                );
                const verificarStock = await pool.query(
                    'SELECT stock_actual FROM test_ferreteria.productos WHERE id = $1',
                    [producto.id]
                );

                expect(verificarFactura.rows).toHaveLength(1);
                expect(verificarStock.rows[0].stock_actual).toBe(stockInicial - 1);

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        });

        test('Rollback en caso de error durante transacción', async () => {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Crear factura
                const facturaQuery = `
                    INSERT INTO test_ferreteria.facturas (numero_factura, cliente_nombre, total, empleado_id)
                    VALUES ('ROLLBACK001', 'Cliente Rollback', 25000, 1)
                    RETURNING id
                `;
                const facturaResult = await client.query(facturaQuery);
                const facturaId = facturaResult.rows[0].id;

                // 2. Obtener stock inicial
                const stockQuery = `
                    SELECT id, stock_actual FROM test_ferreteria.productos 
                    WHERE codigo_producto = 'P001'
                `;
                const stockResult = await client.query(stockQuery);
                const producto = stockResult.rows[0];
                const stockInicial = producto.stock_actual;

                // 3. Intentar operación inválida (esto debe fallar)
                const operacionInvalida = `
                    INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES ($1, 99999, 1, 25000, 25000)
                `; // producto_id 99999 no existe

                await expect(client.query(operacionInvalida, [facturaId]))
                    .rejects.toThrow();

                await client.query('ROLLBACK');

                // Verificar que no se guardó nada
                const verificarFactura = await pool.query(
                    'SELECT * FROM test_ferreteria.facturas WHERE numero_factura = $1',
                    ['ROLLBACK001']
                );
                const verificarStock = await pool.query(
                    'SELECT stock_actual FROM test_ferreteria.productos WHERE id = $1',
                    [producto.id]
                );

                expect(verificarFactura.rows).toHaveLength(0);
                expect(verificarStock.rows[0].stock_actual).toBe(stockInicial);

            } catch (error) {
                await client.query('ROLLBACK');
                // Error esperado
            } finally {
                client.release();
            }
        });
    });

    describe('Concurrencia y Bloqueos', () => {
        test('Actualización concurrente de stock', async () => {
            // Simular dos transacciones concurrentes actualizando el mismo producto
            const client1 = await pool.connect();
            const client2 = await pool.connect();

            try {
                // Obtener stock inicial
                const stockInicial = await pool.query(
                    'SELECT stock_actual FROM test_ferreteria.productos WHERE codigo_producto = $1',
                    ['P001']
                );
                const stockOriginal = stockInicial.rows[0].stock_actual;

                // Transacción 1: Reducir stock en 2
                await client1.query('BEGIN');
                await client1.query(`
                    UPDATE test_ferreteria.productos 
                    SET stock_actual = stock_actual - 2 
                    WHERE codigo_producto = 'P001'
                `);

                // Transacción 2: Reducir stock en 3 (debe esperar)
                await client2.query('BEGIN');
                await client2.query(`
                    UPDATE test_ferreteria.productos 
                    SET stock_actual = stock_actual - 3 
                    WHERE codigo_producto = 'P001'
                `);

                // Confirmar ambas transacciones
                await client1.query('COMMIT');
                await client2.query('COMMIT');

                // Verificar resultado final
                const stockFinal = await pool.query(
                    'SELECT stock_actual FROM test_ferreteria.productos WHERE codigo_producto = $1',
                    ['P001']
                );

                expect(stockFinal.rows[0].stock_actual).toBe(stockOriginal - 5);

            } finally {
                await client1.query('ROLLBACK').catch(() => {});
                await client2.query('ROLLBACK').catch(() => {});
                client1.release();
                client2.release();
            }
        });
    });

    describe('Triggers y Procedimientos', () => {
        test('Timestamp de actualización automática', async () => {
            // Obtener producto y su timestamp inicial
            const inicial = await pool.query(
                'SELECT fecha_actualizacion FROM test_ferreteria.productos WHERE codigo_producto = $1',
                ['P001']
            );
            const timestampInicial = inicial.rows[0].fecha_actualizacion;

            // Esperar un poco para asegurar diferencia en timestamp
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Actualizar producto
            await pool.query(`
                UPDATE test_ferreteria.productos 
                SET precio_venta = precio_venta + 1000 
                WHERE codigo_producto = 'P001'
            `);

            // Verificar que el timestamp se actualizó
            const final = await pool.query(
                'SELECT fecha_actualizacion FROM test_ferreteria.productos WHERE codigo_producto = $1',
                ['P001']
            );
            const timestampFinal = final.rows[0].fecha_actualizacion;

            expect(new Date(timestampFinal)).toBeInstanceOf(Date);
            expect(timestampFinal).not.toBe(timestampInicial);
        });
    });

    describe('Consultas Complejas', () => {
        test('JOIN entre múltiples tablas', async () => {
            // Crear una factura completa para probar el JOIN
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // Crear factura
                const facturaResult = await client.query(`
                    INSERT INTO test_ferreteria.facturas (numero_factura, cliente_nombre, total, empleado_id)
                    VALUES ('JOIN001', 'Cliente JOIN', 50000, 1)
                    RETURNING id
                `);
                const facturaId = facturaResult.rows[0].id;

                // Agregar detalles con diferentes productos
                await client.query(`
                    INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES 
                        ($1, 1, 2, 25000, 50000),
                        ($1, 2, 10, 500, 5000)
                `, [facturaId]);

                await client.query('COMMIT');

                // Consulta compleja con JOIN
                const consulta = `
                    SELECT 
                        f.numero_factura,
                        f.cliente_nombre,
                        f.total as total_factura,
                        p.nombre as producto_nombre,
                        c.nombre_categoria,
                        fd.cantidad,
                        fd.precio_unitario,
                        fd.subtotal,
                        e.nombre_completo as empleado_nombre
                    FROM test_ferreteria.facturas f
                    JOIN test_ferreteria.factura_detalles fd ON f.id = fd.factura_id
                    JOIN test_ferreteria.productos p ON fd.producto_id = p.id
                    JOIN test_ferreteria.categorias c ON p.categoria_id = c.id
                    JOIN test_ferreteria.empleados e ON f.empleado_id = e.id
                    WHERE f.numero_factura = 'JOIN001'
                    ORDER BY fd.id
                `;

                const resultado = await pool.query(consulta);

                expect(resultado.rows).toHaveLength(2);
                expect(resultado.rows[0].numero_factura).toBe('JOIN001');
                expect(resultado.rows[0].cliente_nombre).toBe('Cliente JOIN');
                expect(resultado.rows[0].producto_nombre).toBeDefined();
                expect(resultado.rows[0].nombre_categoria).toBeDefined();
                expect(resultado.rows[0].empleado_nombre).toBe('Usuario Prueba');

            } finally {
                await client.query('ROLLBACK').catch(() => {});
                client.release();
            }
        });

        test('Consulta de agregación para estadísticas', async () => {
            // Crear varias facturas para probar agregaciones
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // Crear facturas de prueba
                for (let i = 1; i <= 3; i++) {
                    const facturaResult = await client.query(`
                        INSERT INTO test_ferreteria.facturas (numero_factura, total, empleado_id)
                        VALUES ($1, $2, 1)
                        RETURNING id
                    `, [`EST${i.toString().padStart(3, '0')}`, i * 10000]);

                    const facturaId = facturaResult.rows[0].id;

                    await client.query(`
                        INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                        VALUES ($1, 1, $2, 25000, $3)
                    `, [facturaId, i, i * 25000]);
                }

                await client.query('COMMIT');

                // Consulta de estadísticas
                const estadisticas = await pool.query(`
                    SELECT 
                        COUNT(f.id) as total_facturas,
                        SUM(f.total) as total_ventas,
                        AVG(f.total) as promedio_venta,
                        MAX(f.total) as venta_maxima,
                        MIN(f.total) as venta_minima,
                        SUM(fd.cantidad) as total_productos_vendidos
                    FROM test_ferreteria.facturas f
                    LEFT JOIN test_ferreteria.factura_detalles fd ON f.id = fd.factura_id
                    WHERE f.numero_factura LIKE 'EST%'
                `);

                const stats = estadisticas.rows[0];
                expect(parseInt(stats.total_facturas)).toBe(3);
                expect(parseFloat(stats.total_ventas)).toBe(60000);
                expect(parseFloat(stats.promedio_venta)).toBe(20000);
                expect(parseInt(stats.total_productos_vendidos)).toBe(6); // 1+2+3

            } finally {
                await client.query('ROLLBACK').catch(() => {});
                client.release();
            }
        });
    });

    describe('Performance y Índices', () => {
        test('Consulta con índice en código de producto', async () => {
            const startTime = Date.now();

            const resultado = await pool.query(`
                SELECT * FROM test_ferreteria.productos 
                WHERE codigo_producto = 'P001'
            `);

            const endTime = Date.now();
            const tiempoEjecucion = endTime - startTime;

            expect(resultado.rows).toHaveLength(1);
            expect(tiempoEjecucion).toBeLessThan(100); // Debe ser rápido con índice
        });

        test('Consulta con LIKE optimizada', async () => {
            const resultado = await pool.query(`
                SELECT * FROM test_ferreteria.productos 
                WHERE nombre ILIKE '%martillo%'
            `);

            expect(resultado.rows.length).toBeGreaterThan(0);
            expect(resultado.rows[0].nombre.toLowerCase()).toContain('martillo');
        });
    });
});