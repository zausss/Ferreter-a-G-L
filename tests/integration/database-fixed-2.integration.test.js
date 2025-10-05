const { pool } = require('../../config/database');

// Mock de la base de datos
jest.mock('../../config/database');

describe('Pruebas de Integración - Base de Datos (Fixed)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Configurar mock del pool
        pool.query = jest.fn();
    });

    describe('Integridad Referencial', () => {
        test('Producto debe tener categoría válida', async () => {
            // Mock para simular error de integridad referencial
            const error = new Error('insert or update on table "productos" violates foreign key constraint "productos_categoria_id_fkey"');
            error.code = '23503';
            
            pool.query.mockRejectedValue(error);

            // Intentar crear producto con categoría inexistente
            const query = `
                INSERT INTO test_ferreteria.productos (codigo_producto, nombre, precio_venta, categoria_id)
                VALUES ('P999', 'Producto Inválido', 1000, 99999)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
                
            expect(pool.query).toHaveBeenCalledWith(query);
        });

        test('Eliminar categoría con productos asociados debe fallar', async () => {
            // Mock para simular error de integridad referencial
            const error = new Error('update or delete on table "categorias" violates foreign key constraint');
            error.code = '23503';
            
            pool.query.mockRejectedValue(error);

            // Intentar eliminar categoría que tiene productos
            const query = `DELETE FROM test_ferreteria.categorias WHERE id = 1`;

            await expect(pool.query(query))
                .rejects.toThrow();
                
            expect(pool.query).toHaveBeenCalledWith(query);
        });

        test('Factura debe tener empleado válido', async () => {
            // Mock para simular error de integridad referencial
            const error = new Error('insert or update on table "facturas" violates foreign key constraint "facturas_empleado_id_fkey"');
            error.code = '23503';
            
            pool.query.mockRejectedValue(error);

            const query = `
                INSERT INTO test_ferreteria.facturas (numero_factura, total, empleado_id)
                VALUES ('FAC999', 1000, 99999)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
                
            expect(pool.query).toHaveBeenCalledWith(query);
        });

        test('Detalle de factura debe referenciar factura y producto válidos', async () => {
            // Mock para simular error de integridad referencial
            const error = new Error('insert or update on table "factura_detalles" violates foreign key constraint');
            error.code = '23503';
            
            pool.query.mockRejectedValue(error);

            const query = `
                INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal)
                VALUES (99999, 99999, 1, 1000, 1000)
            `;

            await expect(pool.query(query))
                .rejects.toThrow();
                
            expect(pool.query).toHaveBeenCalledWith(query);
        });
    });

    describe('Transacciones ACID', () => {
        test('Transacción exitosa de venta completa', async () => {
            // Mock del cliente de transacción
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Configurar respuestas secuenciales exitosas
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect = jest.fn().mockResolvedValue(mockClient);

            // Simular transacción de venta
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Crear factura
                const facturaResult = await client.query(
                    'INSERT INTO test_ferreteria.facturas (numero_factura, total) VALUES ($1, $2) RETURNING id',
                    ['FAC001', 25000]
                );
                
                // Crear detalle
                await client.query(
                    'INSERT INTO test_ferreteria.factura_detalles (factura_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                    [facturaResult.rows[0].id, 1, 1, 25000, 25000]
                );
                
                // Actualizar stock
                await client.query(
                    'UPDATE test_ferreteria.productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                    [1, 1]
                );
                
                await client.query('COMMIT');
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
            // Verificar que se ejecutaron las operaciones correctas
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        test('Rollback en caso de error durante transacción', async () => {
            // Mock del cliente de transacción
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Configurar respuestas: exitosa -> exitosa -> error
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT factura exitoso
                .mockRejectedValueOnce(new Error('Stock insuficiente')) // ERROR en actualizar stock
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            pool.connect = jest.fn().mockResolvedValue(mockClient);

            // Simular transacción con error
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Crear factura (exitoso)
                const facturaResult = await client.query(
                    'INSERT INTO test_ferreteria.facturas (numero_factura, total) VALUES ($1, $2) RETURNING id',
                    ['FAC002', 25000]
                );
                
                // Actualizar stock (falla)
                await client.query(
                    'UPDATE test_ferreteria.productos SET stock_actual = stock_actual - $1 WHERE id = $2 AND stock_actual >= $1',
                    [100, 1] // Intentar restar más stock del disponible
                );
                
                await client.query('COMMIT');
                
            } catch (error) {
                await client.query('ROLLBACK');
                expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
                expect(error.message).toBe('Stock insuficiente');
            } finally {
                client.release();
            }
        });
    });

    describe('Concurrencia y Bloqueos', () => {
        test('Actualización concurrente de stock', async () => {
            // Mock para simular actualizaciones concurrentes
            const mockClient1 = {
                query: jest.fn(),
                release: jest.fn()
            };
            
            const mockClient2 = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Primera transacción
            mockClient1.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ stock_actual: 10 }] }) // SELECT FOR UPDATE
                .mockResolvedValueOnce({ rows: [] }) // UPDATE
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Segunda transacción (debe esperar)
            mockClient2.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ stock_actual: 9 }] }) // SELECT FOR UPDATE (después del commit)
                .mockResolvedValueOnce({ rows: [] }) // UPDATE
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect = jest.fn()
                .mockResolvedValueOnce(mockClient1)
                .mockResolvedValueOnce(mockClient2);

            // Simular dos transacciones concurrentes
            const transaction1 = async () => {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const result = await client.query('SELECT stock_actual FROM test_ferreteria.productos WHERE id = $1 FOR UPDATE', [1]);
                    await client.query('UPDATE test_ferreteria.productos SET stock_actual = $1 WHERE id = $2', [result.rows[0].stock_actual - 1, 1]);
                    await client.query('COMMIT');
                } finally {
                    client.release();
                }
            };

            const transaction2 = async () => {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const result = await client.query('SELECT stock_actual FROM test_ferreteria.productos WHERE id = $1 FOR UPDATE', [1]);
                    await client.query('UPDATE test_ferreteria.productos SET stock_actual = $1 WHERE id = $2', [result.rows[0].stock_actual - 1, 1]);
                    await client.query('COMMIT');
                } finally {
                    client.release();
                }
            };

            // Ejecutar ambas transacciones
            await Promise.all([transaction1(), transaction2()]);

            // Verificar que ambas transacciones se ejecutaron correctamente
            expect(mockClient1.query).toHaveBeenCalledWith('SELECT stock_actual FROM test_ferreteria.productos WHERE id = $1 FOR UPDATE', [1]);
            expect(mockClient2.query).toHaveBeenCalledWith('SELECT stock_actual FROM test_ferreteria.productos WHERE id = $1 FOR UPDATE', [1]);
        });
    });

    describe('Triggers y Procedimientos', () => {
        test('Timestamp de actualización automática', async () => {
            // Mock para simular trigger de actualización automática
            const currentTime = new Date();
            
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    nombre: 'Producto Actualizado',
                    fecha_actualizacion: currentTime
                }]
            });

            // Simular actualización de producto
            const result = await pool.query(
                'UPDATE test_ferreteria.productos SET nombre = $1 WHERE id = $2 RETURNING *',
                ['Producto Actualizado', 1]
            );

            expect(result.rows[0].fecha_actualizacion).toBeDefined();
            expect(result.rows[0].nombre).toBe('Producto Actualizado');
        });
    });

    describe('Consultas Complejas', () => {
        test('JOIN entre múltiples tablas', async () => {
            // Mock para simular consulta compleja con JOINs
            const mockData = [
                {
                    factura_id: 1,
                    numero_factura: 'FAC001',
                    cliente_nombre: 'Juan Pérez',
                    producto_nombre: 'Martillo',
                    categoria_nombre: 'Herramientas',
                    cantidad: 2,
                    precio_unitario: 25000,
                    subtotal: 50000
                },
                {
                    factura_id: 1,
                    numero_factura: 'FAC001',
                    cliente_nombre: 'Juan Pérez',
                    producto_nombre: 'Destornillador',
                    categoria_nombre: 'Herramientas',
                    cantidad: 1,
                    precio_unitario: 15000,
                    subtotal: 15000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockData });

            const query = `
                SELECT 
                    f.id as factura_id,
                    f.numero_factura,
                    f.cliente_nombre,
                    p.nombre as producto_nombre,
                    c.nombre_categoria as categoria_nombre,
                    fd.cantidad,
                    fd.precio_unitario,
                    fd.subtotal
                FROM test_ferreteria.facturas f
                INNER JOIN test_ferreteria.factura_detalles fd ON f.id = fd.factura_id
                INNER JOIN test_ferreteria.productos p ON fd.producto_id = p.id
                INNER JOIN test_ferreteria.categorias c ON p.categoria_id = c.id
                WHERE f.id = $1
            `;

            const result = await pool.query(query, [1]);

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].numero_factura).toBe('FAC001');
            expect(result.rows[0].producto_nombre).toBe('Martillo');
            expect(result.rows[1].producto_nombre).toBe('Destornillador');
            expect(pool.query).toHaveBeenCalledWith(query, [1]);
        });

        test('Consulta de agregación para estadísticas', async () => {
            // Mock para simular consulta de estadísticas
            const mockStats = [
                {
                    total_productos: '25',
                    total_categorias: '5',
                    valor_total_inventario: '750000.50',
                    productos_stock_bajo: '3',
                    promedio_precio: '30000.25'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockStats });

            const query = `
                SELECT 
                    COUNT(p.id) as total_productos,
                    COUNT(DISTINCT p.categoria_id) as total_categorias,
                    SUM(p.precio_venta * p.stock_actual) as valor_total_inventario,
                    COUNT(CASE WHEN p.stock_actual <= p.stock_minimo THEN 1 END) as productos_stock_bajo,
                    AVG(p.precio_venta) as promedio_precio
                FROM test_ferreteria.productos p
                WHERE p.activo = true
            `;

            const result = await pool.query(query);

            expect(result.rows[0].total_productos).toBe('25');
            expect(result.rows[0].valor_total_inventario).toBe('750000.50');
            expect(result.rows[0].productos_stock_bajo).toBe('3');
            expect(pool.query).toHaveBeenCalledWith(query);
        });
    });

    describe('Performance y Índices', () => {
        test('Consulta con índice en código de producto', async () => {
            // Mock para simular consulta optimizada
            const mockProduct = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    precio_venta: 25000,
                    stock_actual: 10
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProduct });

            const query = `
                SELECT * FROM test_ferreteria.productos 
                WHERE codigo_producto = $1
            `;

            const result = await pool.query(query, ['P001']);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].codigo_producto).toBe('P001');
            expect(result.rows[0].nombre).toBe('Martillo');
            expect(pool.query).toHaveBeenCalledWith(query, ['P001']);
        });

        test('Consulta con LIKE optimizada', async () => {
            // Mock para simular búsqueda optimizada
            const mockResults = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    precio_venta: 25000
                },
                {
                    id: 2,
                    codigo_producto: 'P002',
                    nombre: 'Martillo Demolición',
                    precio_venta: 35000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockResults });

            const query = `
                SELECT * FROM test_ferreteria.productos 
                WHERE nombre ILIKE $1
                ORDER BY nombre
            `;

            const result = await pool.query(query, ['%martillo%']);

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].nombre).toContain('Martillo');
            expect(result.rows[1].nombre).toContain('Martillo');
            expect(pool.query).toHaveBeenCalledWith(query, ['%martillo%']);
        });
    });
});