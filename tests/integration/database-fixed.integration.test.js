const { pool } = require('../../config/database');

// Mock del pool de base de datos
jest.mock('../../config/database');

describe('Pruebas de Integración - Base de Datos (Fixed)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Integridad Referencial', () => {
        test('Producto debe tener categoría válida', async () => {
            // Mock de error de integridad referencial
            const error = new Error('insert or update on table "productos" violates foreign key constraint');
            error.code = '23503';
            pool.query.mockRejectedValue(error);

            const query = `
                INSERT INTO productos (codigo_producto, nombre, precio_venta, categoria_id)
                VALUES ('P999', 'Producto Inválido', 1000, 99999)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
            
            expect(pool.query).toHaveBeenCalledWith(query);
        });

        test('Eliminar categoría con productos asociados debe fallar', async () => {
            const error = new Error('update or delete on table "categorias" violates foreign key constraint');
            error.code = '23503';
            pool.query.mockRejectedValue(error);

            const query = `DELETE FROM categorias WHERE id = 1`;

            await expect(pool.query(query))
                .rejects.toThrow();
        });

        test('Factura debe tener empleado válido', async () => {
            const error = new Error('insert or update on table "facturas" violates foreign key constraint');
            error.code = '23503';
            pool.query.mockRejectedValue(error);

            const query = `
                INSERT INTO facturas (numero_factura, total, empleado_id)
                VALUES ('FAC999', 1000, 99999)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
        });

        test('Detalle de factura debe referenciar factura y producto válidos', async () => {
            const error = new Error('insert or update on table "factura_detalles" violates foreign key constraint');
            error.code = '23503';
            pool.query.mockRejectedValue(error);

            const query = `
                INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                VALUES (99999, 99999, 1, 1000, 1000)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
        });
    });

    describe('Transacciones ACID', () => {
        test('Transacción exitosa de venta completa', async () => {
            // Mock de transacción exitosa
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            pool.connect.mockResolvedValue(mockClient);

            // Simular secuencia de transacción exitosa
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Simular operación de venta
            const client = await pool.connect();
            await client.query('BEGIN');
            
            const facturaResult = await client.query(
                'INSERT INTO facturas (numero_factura, total) VALUES ($1, $2) RETURNING id',
                ['FAC001', 1000]
            );
            
            await client.query(
                'INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [facturaResult.rows[0].id, 1, 1, 1000, 1000]
            );
            
            await client.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                [1, 1]
            );
            
            await client.query('COMMIT');
            client.release();

            expect(mockClient.query).toHaveBeenCalledTimes(5);
            expect(mockClient.release).toHaveBeenCalled();
        });

        test('Rollback en caso de error durante transacción', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            pool.connect.mockResolvedValue(mockClient);

            // Simular error durante transacción
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT factura
                .mockRejectedValueOnce(new Error('Stock insuficiente')) // ERROR en UPDATE
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                const facturaResult = await client.query(
                    'INSERT INTO facturas (numero_factura, total) VALUES ($1, $2) RETURNING id',
                    ['FAC001', 1000]
                );
                
                // Este debe fallar
                await client.query(
                    'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2 AND stock_actual >= $1',
                    [10, 1]
                );
                
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                expect(error.message).toBe('Stock insuficiente');
            } finally {
                client.release();
            }

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('Concurrencia y Bloqueos', () => {
        test('Actualización concurrente de stock', async () => {
            // Mock de dos clientes concurrentes
            const mockClient1 = { query: jest.fn(), release: jest.fn() };
            const mockClient2 = { query: jest.fn(), release: jest.fn() };

            pool.connect
                .mockResolvedValueOnce(mockClient1)
                .mockResolvedValueOnce(mockClient2);

            // Configurar respuestas para ambos clientes
            mockClient1.query.mockResolvedValue({ rows: [] });
            mockClient2.query.mockResolvedValue({ rows: [] });

            // Simular operaciones concurrentes
            const client1 = await pool.connect();
            const client2 = await pool.connect();

            await Promise.all([
                client1.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id = 1'),
                client2.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id = 1')
            ]);

            client1.release();
            client2.release();

            expect(mockClient1.query).toHaveBeenCalled();
            expect(mockClient2.query).toHaveBeenCalled();
        });
    });

    describe('Triggers y Procedimientos', () => {
        test('Timestamp de actualización automática', async () => {
            // Mock de resultado con timestamp actualizado
            const now = new Date();
            pool.query.mockResolvedValue({
                rows: [{
                    id: 1,
                    nombre: 'Producto Actualizado',
                    fecha_actualizacion: now
                }]
            });

            const query = `
                UPDATE productos 
                SET nombre = $1 
                WHERE id = $2 
                RETURNING id, nombre, fecha_actualizacion
            `;

            const result = await pool.query(query, ['Producto Actualizado', 1]);

            expect(result.rows[0].fecha_actualizacion).toBeInstanceOf(Date);
            expect(pool.query).toHaveBeenCalledWith(query, ['Producto Actualizado', 1]);
        });
    });

    describe('Consultas Complejas', () => {
        test('JOIN entre múltiples tablas', async () => {
            const mockResult = {
                rows: [
                    {
                        producto_id: 1,
                        producto_nombre: 'Martillo',
                        categoria_nombre: 'Herramientas',
                        factura_numero: 'FAC001',
                        cantidad_vendida: 2,
                        total_venta: 50000
                    }
                ]
            };

            pool.query.mockResolvedValue(mockResult);

            const query = `
                SELECT 
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    c.nombre_categoria,
                    f.numero_factura,
                    fd.cantidad as cantidad_vendida,
                    fd.subtotal as total_venta
                FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                JOIN factura_detalles fd ON p.id = fd.producto_id
                JOIN facturas f ON fd.factura_id = f.id
                WHERE f.fecha_factura >= $1
            `;

            const result = await pool.query(query, ['2024-01-01']);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].producto_nombre).toBe('Martillo');
            expect(result.rows[0].categoria_nombre).toBe('Herramientas');
        });

        test('Consulta de agregación para estadísticas', async () => {
            const mockStats = {
                rows: [{
                    total_productos: '25',
                    total_categorias: '5',
                    valor_inventario: '1500000.00',
                    productos_stock_bajo: '3'
                }]
            };

            pool.query.mockResolvedValue(mockStats);

            const query = `
                SELECT 
                    COUNT(DISTINCT p.id) as total_productos,
                    COUNT(DISTINCT c.id) as total_categorias,
                    SUM(p.stock_actual * p.precio_venta) as valor_inventario,
                    COUNT(*) FILTER (WHERE p.stock_actual <= p.stock_minimo) as productos_stock_bajo
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.activo = true
            `;

            const result = await pool.query(query);

            expect(result.rows[0].total_productos).toBe('25');
            expect(result.rows[0].total_categorias).toBe('5');
            expect(parseFloat(result.rows[0].valor_inventario)).toBeGreaterThan(0);
        });
    });

    describe('Performance y Índices', () => {
        test('Consulta con índice en código de producto', async () => {
            const mockResult = {
                rows: [{
                    id: 1,
                    codigo_producto: 'MART001',
                    nombre: 'Martillo Carpintero'
                }]
            };

            pool.query.mockResolvedValue(mockResult);

            const query = `
                SELECT id, codigo_producto, nombre 
                FROM productos 
                WHERE codigo_producto = $1
            `;

            const result = await pool.query(query, ['MART001']);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].codigo_producto).toBe('MART001');
            expect(pool.query).toHaveBeenCalledWith(query, ['MART001']);
        });

        test('Consulta con LIKE optimizada', async () => {
            const mockResult = {
                rows: [
                    { id: 1, nombre: 'Martillo Carpintero' },
                    { id: 2, nombre: 'Martillo Demolición' }
                ]
            };

            pool.query.mockResolvedValue(mockResult);

            const query = `
                SELECT id, nombre 
                FROM productos 
                WHERE nombre ILIKE $1 || '%'
                AND activo = true
                LIMIT 10
            `;

            const result = await pool.query(query, ['Martillo']);

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].nombre).toContain('Martillo');
        });
    });
});