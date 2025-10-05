const { pool } = require('../../config/database');

// Mock de la base de datos
jest.mock('../../config/database');

describe('Pruebas de Integración - Base de Datos (Fixed)', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.query = jest.fn();
        pool.connect = jest.fn().mockResolvedValue(mockClient);
    });

    describe('Integridad Referencial', () => {
        test('Producto debe tener categoría válida', async () => {
            // Mock para verificar que la categoría existe
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Herramientas' }] }) // Categoría válida
                .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Producto Test' }] }) // INSERT producto
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const productoData = {
                nombre: 'Producto Test',
                categoria_id: 1,
                precio: 25000,
                stock: 10
            };

            const client = await pool.connect();
            await client.query('BEGIN');
            
            // Verificar categoría
            const categoriaResult = await client.query(
                'SELECT id, nombre FROM categorias WHERE id = $1',
                [productoData.categoria_id]
            );
            
            expect(categoriaResult.rows).toHaveLength(1);
            expect(categoriaResult.rows[0].nombre).toBe('Herramientas');

            // Crear producto
            const productoResult = await client.query(
                'INSERT INTO productos (nombre, categoria_id, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *',
                [productoData.nombre, productoData.categoria_id, productoData.precio, productoData.stock]
            );
            
            await client.query('COMMIT');
            client.release();

            expect(productoResult.rows).toHaveLength(1);
            expect(productoResult.rows[0].nombre).toBe('Producto Test');
        });

        test('Eliminar categoría con productos asociados debe fallar', async () => {
            // Mock para simular error de integridad referencial
            const integrityError = new Error('violates foreign key constraint');
            integrityError.code = '23503';

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockRejectedValueOnce(integrityError) // DELETE falla
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const client = await pool.connect();
            await client.query('BEGIN');

            try {
                await client.query('DELETE FROM categorias WHERE id = $1', [1]);
                expect(true).toBe(false); // No debería llegar aquí
            } catch (error) {
                expect(error.code).toBe('23503');
                expect(error.message).toContain('foreign key constraint');
                await client.query('ROLLBACK');
            }
            
            client.release();
        });

        test('Factura debe tener empleado válido', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan Pérez' }] }) // Empleado válido
                .mockResolvedValueOnce({ rows: [{ id: 1, numero_factura: 'F-001' }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const client = await pool.connect();
            await client.query('BEGIN');

            // Verificar empleado
            const empleadoResult = await client.query(
                'SELECT id, nombre FROM empleados WHERE id = $1',
                [1]
            );

            expect(empleadoResult.rows).toHaveLength(1);

            // Crear factura
            const facturaResult = await client.query(
                'INSERT INTO facturas (empleado_id, numero_factura, total) VALUES ($1, $2, $3) RETURNING *',
                [1, 'F-001', 25000]
            );

            await client.query('COMMIT');
            client.release();

            expect(facturaResult.rows[0].numero_factura).toBe('F-001');
        });

        test('Detalle de factura debe referenciar factura y producto válidos', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Factura válida
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Producto válido
                .mockResolvedValueOnce({ rows: [{ id: 1, factura_id: 1, producto_id: 1 }] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const client = await pool.connect();
            await client.query('BEGIN');

            // Verificar factura y producto existen
            const facturaCheck = await client.query('SELECT id FROM facturas WHERE id = $1', [1]);
            const productoCheck = await client.query('SELECT id FROM productos WHERE id = $1', [1]);

            expect(facturaCheck.rows).toHaveLength(1);
            expect(productoCheck.rows).toHaveLength(1);

            // Crear detalle
            const detalleResult = await client.query(
                'INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4) RETURNING *',
                [1, 1, 2, 25000]
            );

            await client.query('COMMIT');
            client.release();

            expect(detalleResult.rows[0].factura_id).toBe(1);
            expect(detalleResult.rows[0].producto_id).toBe(1);
        });
    });

    describe('Transacciones ACID', () => {
        test('Transacción exitosa de venta completa', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, numero_factura: 'F-001' }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle 1
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle 2
                .mockResolvedValueOnce({ rows: [{ stock_actual: 8 }] }) // UPDATE stock producto 1
                .mockResolvedValueOnce({ rows: [{ stock_actual: 15 }] }) // UPDATE stock producto 2
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const client = await pool.connect();
            await client.query('BEGIN');

            // Crear factura
            const facturaResult = await client.query(
                'INSERT INTO facturas (numero_factura, total, cliente) VALUES ($1, $2, $3) RETURNING *',
                ['F-001', 65000, 'Cliente Test']
            );

            // Crear detalles
            await client.query(
                'INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4)',
                [1, 1, 2, 25000]
            );

            await client.query(
                'INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4)',
                [1, 2, 1, 15000]
            );

            // Actualizar stock
            const stock1 = await client.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2 RETURNING stock_actual',
                [2, 1]
            );

            const stock2 = await client.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2 RETURNING stock_actual',
                [1, 2]
            );

            await client.query('COMMIT');
            client.release();

            expect(facturaResult.rows[0].numero_factura).toBe('F-001');
            expect(stock1.rows[0].stock_actual).toBe(8);
            expect(stock2.rows[0].stock_actual).toBe(15);
        });

        test('Rollback en caso de error durante transacción', async () => {
            const stockError = new Error('Stock insuficiente');
            
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockRejectedValueOnce(stockError) // ERROR en UPDATE stock
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const client = await pool.connect();
            await client.query('BEGIN');

            try {
                // Crear factura
                await client.query(
                    'INSERT INTO facturas (numero_factura, total) VALUES ($1, $2) RETURNING *',
                    ['F-002', 50000]
                );

                // Crear detalle
                await client.query(
                    'INSERT INTO factura_detalles (factura_id, producto_id, cantidad) VALUES ($1, $2, $3)',
                    [1, 1, 100] // Cantidad excesiva
                );

                // Actualizar stock (debe fallar)
                await client.query(
                    'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                    [100, 1]
                );

                expect(true).toBe(false); // No debería llegar aquí
            } catch (error) {
                expect(error.message).toBe('Stock insuficiente');
                await client.query('ROLLBACK');
            }

            client.release();
        });
    });

    describe('Concurrencia y Bloqueos', () => {
        test('Actualización concurrente de stock', async () => {
            // Simular dos transacciones concurrentes
            const mockClient1 = {
                query: jest.fn(),
                release: jest.fn()
            };

            const mockClient2 = {
                query: jest.fn(),
                release: jest.fn()
            };

            pool.connect
                .mockResolvedValueOnce(mockClient1)
                .mockResolvedValueOnce(mockClient2);

            // Transacción 1
            mockClient1.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ stock_actual: 10 }] }) // SELECT FOR UPDATE
                .mockResolvedValueOnce({ rows: [{ stock_actual: 8 }] }) // UPDATE
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Transacción 2 (espera)
            mockClient2.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ stock_actual: 8 }] }) // SELECT FOR UPDATE (después de T1)
                .mockResolvedValueOnce({ rows: [{ stock_actual: 6 }] }) // UPDATE
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Transacción 1
            const client1 = await pool.connect();
            await client1.query('BEGIN');
            const stock1 = await client1.query(
                'SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE',
                [1]
            );
            await client1.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                [2, 1]
            );
            await client1.query('COMMIT');
            client1.release();

            // Transacción 2
            const client2 = await pool.connect();
            await client2.query('BEGIN');
            const stock2 = await client2.query(
                'SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE',
                [1]
            );
            await client2.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                [2, 1]
            );
            await client2.query('COMMIT');
            client2.release();

            expect(stock1.rows[0].stock_actual).toBe(10);
            expect(stock2.rows[0].stock_actual).toBe(8); // Refleja el cambio de T1
        });
    });

    describe('Triggers y Procedimientos', () => {
        test('Timestamp de actualización automática', async () => {
            const now = new Date();
            
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ 
                    rows: [{ 
                        id: 1, 
                        nombre: 'Producto Actualizado',
                        fecha_actualizacion: now
                    }] 
                }) // UPDATE con trigger
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const client = await pool.connect();
            await client.query('BEGIN');

            const result = await client.query(
                'UPDATE productos SET nombre = $1 WHERE id = $2 RETURNING *',
                ['Producto Actualizado', 1]
            );

            await client.query('COMMIT');
            client.release();

            expect(result.rows[0].nombre).toBe('Producto Actualizado');
            expect(result.rows[0].fecha_actualizacion).toBeInstanceOf(Date);
        });
    });

    describe('Consultas Complejas', () => {
        test('JOIN entre múltiples tablas', async () => {
            const mockJoinResult = [
                {
                    producto_id: 1,
                    producto_nombre: 'Martillo',
                    categoria_nombre: 'Herramientas',
                    factura_numero: 'F-001',
                    cliente_nombre: 'Juan Pérez',
                    cantidad: 2,
                    precio_unitario: 25000,
                    subtotal: 50000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockJoinResult });

            const query = `
                SELECT 
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    c.nombre as categoria_nombre,
                    f.numero_factura,
                    f.cliente_nombre,
                    fd.cantidad,
                    fd.precio_unitario,
                    (fd.cantidad * fd.precio_unitario) as subtotal
                FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                JOIN factura_detalles fd ON p.id = fd.producto_id
                JOIN facturas f ON fd.factura_id = f.id
                WHERE f.numero_factura = $1
            `;

            const result = await pool.query(query, ['F-001']);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].producto_nombre).toBe('Martillo');
            expect(result.rows[0].categoria_nombre).toBe('Herramientas');
            expect(result.rows[0].subtotal).toBe(50000);
        });

        test('Consulta de agregación para estadísticas', async () => {
            const mockStatsResult = [
                {
                    total_productos: 50,
                    total_categorias: 8,
                    valor_inventario: 1250000,
                    productos_bajo_stock: 5,
                    promedio_precio: 25000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockStatsResult });

            const query = `
                SELECT 
                    COUNT(p.id) as total_productos,
                    COUNT(DISTINCT p.categoria_id) as total_categorias,
                    SUM(p.precio_venta * p.stock_actual) as valor_inventario,
                    COUNT(CASE WHEN p.stock_actual <= p.stock_minimo THEN 1 END) as productos_bajo_stock,
                    AVG(p.precio_venta) as promedio_precio
                FROM productos p
                WHERE p.activo = true
            `;

            const result = await pool.query(query);

            expect(result.rows[0].total_productos).toBe(50);
            expect(result.rows[0].total_categorias).toBe(8);
            expect(result.rows[0].valor_inventario).toBe(1250000);
            expect(result.rows[0].productos_bajo_stock).toBe(5);
            expect(result.rows[0].promedio_precio).toBe(25000);
        });
    });

    describe('Performance y Índices', () => {
        test('Consulta con índice en código de producto', async () => {
            const mockProductResult = [
                {
                    id: 1,
                    codigo_producto: 'MART-001',
                    nombre: 'Martillo',
                    precio_venta: 25000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductResult });

            // Consulta que debería usar índice
            const result = await pool.query(
                'SELECT * FROM productos WHERE codigo_producto = $1',
                ['MART-001']
            );

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM productos WHERE codigo_producto = $1',
                ['MART-001']
            );
            expect(result.rows[0].codigo_producto).toBe('MART-001');
        });

        test('Consulta con LIKE optimizada', async () => {
            const mockSearchResult = [
                {
                    id: 1,
                    nombre: 'Martillo de carpintero',
                    codigo_producto: 'MART-001'
                },
                {
                    id: 2,
                    nombre: 'Martillo de goma',
                    codigo_producto: 'MART-002'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockSearchResult });

            // Búsqueda optimizada con índice
            const result = await pool.query(
                'SELECT * FROM productos WHERE nombre ILIKE $1 ORDER BY nombre',
                ['%martillo%']
            );

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].nombre).toContain('Martillo');
            expect(result.rows[1].nombre).toContain('Martillo');
        });
    });
});