const pool = require('../../config/database').pool;

// Mock completo del módulo de base de datos
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn()
    }
}));

describe('Pruebas de Integración Mock - Base de Datos', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock del cliente de conexión
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
            rollback: jest.fn()
        };
        
        pool.connect.mockResolvedValue(mockClient);
    });

    describe('Integridad Referencial (Mock)', () => {
        test('No se puede eliminar categoría con productos asociados', async () => {
            // Simular que hay productos asociados a la categoría
            pool.query.mockResolvedValueOnce({ 
                rows: [{ count: '5' }] // 5 productos asociados
            });

            const categoriaId = 1;
            
            // Simular consulta de verificación
            const queryVerificacion = 'SELECT COUNT(*) FROM productos WHERE categoria_id = $1';
            
            const resultado = await pool.query(queryVerificacion, [categoriaId]);
            
            expect(resultado.rows[0].count).toBe('5');
            expect(pool.query).toHaveBeenCalledWith(queryVerificacion, [categoriaId]);
        });

        test('Eliminación en cascada funciona correctamente', async () => {
            // Mock de transacción para eliminación en cascada
            pool.connect.mockResolvedValue(mockClient);

            // Configurar mocks para operaciones en orden
            mockClient.query
                .mockResolvedValueOnce({ rowCount: 3 }) // Eliminar productos
                .mockResolvedValueOnce({ rowCount: 1 }); // Eliminar categoría

            // Simular eliminación en cascada
            const resultado = await mockClient.query('DELETE FROM productos WHERE categoria_id = $1', [1]);
            expect(resultado.rowCount).toBe(3);

            const resultadoCategoria = await mockClient.query('DELETE FROM categorias WHERE id = $1', [1]);
            expect(resultadoCategoria.rowCount).toBe(1);

            expect(mockClient.query).toHaveBeenCalledTimes(2);
        });

        test('Clave foránea previene inserción de producto con categoría inexistente', async () => {
            // Simular error de clave foránea
            const errorClaveForanea = new Error('violates foreign key constraint');
            errorClaveForanea.code = '23503';

            pool.query.mockRejectedValue(errorClaveForanea);

            try {
                await pool.query(
                    'INSERT INTO productos (codigo, nombre, categoria_id) VALUES ($1, $2, $3)',
                    ['P001', 'Producto Test', 999] // Categoría inexistente
                );
            } catch (error) {
                expect(error.code).toBe('23503');
                expect(error.message).toContain('violates foreign key constraint');
            }
        });
    });

    describe('Transacciones ACID (Mock)', () => {
        test('Transacción exitosa se confirma correctamente', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT cliente
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Simular transacción completa
            await mockClient.query('BEGIN');
            
            const cliente = await mockClient.query(
                'INSERT INTO clientes (nombre, identificacion) VALUES ($1, $2) RETURNING id',
                ['Juan Pérez', '12345678']
            );
            
            const factura = await mockClient.query(
                'INSERT INTO facturas (cliente_id, total) VALUES ($1, $2) RETURNING id',
                [cliente.rows[0].id, 50000]
            );
            
            await mockClient.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                [2, 1]
            );
            
            await mockClient.query('COMMIT');

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.query).toHaveBeenCalledTimes(5);
        });

        test('Rollback en caso de error durante transacción', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT cliente OK
                .mockRejectedValueOnce(new Error('Error de base de datos')) // INSERT factura FALLA
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            try {
                await mockClient.query('BEGIN');
                
                await mockClient.query(
                    'INSERT INTO clientes (nombre, identificacion) VALUES ($1, $2) RETURNING id',
                    ['Juan Pérez', '12345678']
                );
                
                // Esta operación falla
                await mockClient.query(
                    'INSERT INTO facturas (cliente_id, total) VALUES ($1, $2) RETURNING id',
                    [1, 50000]
                );
                
            } catch (error) {
                await mockClient.query('ROLLBACK');
                expect(error.message).toBe('Error de base de datos');
            }

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });

        test('Transacciones concurrentes se manejan correctamente', async () => {
            // Simular dos transacciones concurrentes
            const mockClient1 = { ...mockClient };
            const mockClient2 = { ...mockClient };

            pool.connect
                .mockResolvedValueOnce(mockClient1)
                .mockResolvedValueOnce(mockClient2);

            // Transacción 1
            mockClient1.query = jest.fn()
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ stock_actual: 10 }] }) // SELECT stock
                .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Transacción 2
            mockClient2.query = jest.fn()
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ stock_actual: 8 }] }) // SELECT stock (después de T1)
                .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Ejecutar transacciones "concurrentes"
            const transaccion1 = async () => {
                const client = await pool.connect();
                await client.query('BEGIN');
                const stock = await client.query('SELECT stock_actual FROM productos WHERE id = $1', [1]);
                await client.query('UPDATE productos SET stock_actual = $1 WHERE id = $2', [stock.rows[0].stock_actual - 2, 1]);
                await client.query('COMMIT');
                return stock.rows[0].stock_actual;
            };

            const transaccion2 = async () => {
                const client = await pool.connect();
                await client.query('BEGIN');
                const stock = await client.query('SELECT stock_actual FROM productos WHERE id = $1', [1]);
                await client.query('UPDATE productos SET stock_actual = $1 WHERE id = $2', [stock.rows[0].stock_actual - 3, 1]);
                await client.query('COMMIT');
                return stock.rows[0].stock_actual;
            };

            const [stock1, stock2] = await Promise.all([transaccion1(), transaccion2()]);

            expect(stock1).toBe(10);
            expect(stock2).toBe(8);
            expect(mockClient1.query).toHaveBeenCalledTimes(4);
            expect(mockClient2.query).toHaveBeenCalledTimes(4);
        });
    });

    describe('Consultas Complejas (Mock)', () => {
        test('JOIN entre múltiples tablas funciona correctamente', async () => {
            const mockResultadoJoin = [
                {
                    producto_id: 1,
                    producto_nombre: 'Martillo',
                    categoria_nombre: 'Herramientas',
                    stock_actual: 10,
                    total_vendido: 25,
                    ingresos_totales: 625000
                },
                {
                    producto_id: 2,
                    producto_nombre: 'Tornillo',
                    categoria_nombre: 'Tornillería',
                    stock_actual: 50,
                    total_vendido: 100,
                    ingresos_totales: 150000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockResultadoJoin });

            const queryCompleja = `
                SELECT 
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    c.nombre as categoria_nombre,
                    p.stock_actual,
                    COALESCE(SUM(fp.cantidad), 0) as total_vendido,
                    COALESCE(SUM(fp.cantidad * fp.precio_unitario), 0) as ingresos_totales
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                LEFT JOIN factura_productos fp ON p.id = fp.producto_id
                LEFT JOIN facturas f ON fp.factura_id = f.id
                WHERE f.fecha >= $1 AND f.fecha <= $2
                GROUP BY p.id, p.nombre, c.nombre, p.stock_actual
                ORDER BY ingresos_totales DESC
            `;

            const resultado = await pool.query(queryCompleja, ['2024-01-01', '2024-01-31']);

            expect(resultado.rows).toHaveLength(2);
            expect(resultado.rows[0]).toMatchObject({
                producto_nombre: 'Martillo',
                categoria_nombre: 'Herramientas',
                total_vendido: 25,
                ingresos_totales: 625000
            });
        });

        test('Subconsulta para productos más vendidos', async () => {
            const mockProductosMasVendidos = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    total_vendido: 50,
                    ranking: 1
                },
                {
                    id: 2,
                    nombre: 'Destornillador',
                    total_vendido: 35,
                    ranking: 2
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductosMasVendidos });

            const querySubconsulta = `
                SELECT 
                    p.id,
                    p.nombre,
                    ventas.total_vendido,
                    RANK() OVER (ORDER BY ventas.total_vendido DESC) as ranking
                FROM productos p
                INNER JOIN (
                    SELECT 
                        producto_id,
                        SUM(cantidad) as total_vendido
                    FROM factura_productos fp
                    INNER JOIN facturas f ON fp.factura_id = f.id
                    WHERE f.fecha >= $1
                    GROUP BY producto_id
                    HAVING SUM(cantidad) > $2
                ) ventas ON p.id = ventas.producto_id
                ORDER BY ventas.total_vendido DESC
                LIMIT $3
            `;

            const resultado = await pool.query(querySubconsulta, ['2024-01-01', 10, 5]);

            expect(resultado.rows[0].ranking).toBe(1);
            expect(resultado.rows[0].total_vendido).toBe(50);
            expect(pool.query).toHaveBeenCalledWith(querySubconsulta, ['2024-01-01', 10, 5]);
        });

        test('Agregaciones y funciones de ventana', async () => {
            const mockEstadisticasVentas = [
                {
                    mes: '2024-01',
                    total_ventas: 1500000,
                    numero_facturas: 45,
                    venta_promedio: 33333.33,
                    acumulado_anual: 1500000,
                    crecimiento_mensual: null
                },
                {
                    mes: '2024-02',
                    total_ventas: 1800000,
                    numero_facturas: 52,
                    venta_promedio: 34615.38,
                    acumulado_anual: 3300000,
                    crecimiento_mensual: 20.00
                }
            ];

            pool.query.mockResolvedValue({ rows: mockEstadisticasVentas });

            const queryVentana = `
                SELECT 
                    DATE_TRUNC('month', fecha) as mes,
                    SUM(total) as total_ventas,
                    COUNT(*) as numero_facturas,
                    AVG(total) as venta_promedio,
                    SUM(SUM(total)) OVER (ORDER BY DATE_TRUNC('month', fecha)) as acumulado_anual,
                    ROUND(
                        ((SUM(total) - LAG(SUM(total)) OVER (ORDER BY DATE_TRUNC('month', fecha))) 
                        / LAG(SUM(total)) OVER (ORDER BY DATE_TRUNC('month', fecha))) * 100, 2
                    ) as crecimiento_mensual
                FROM facturas
                WHERE fecha >= $1 AND fecha <= $2
                GROUP BY DATE_TRUNC('month', fecha)
                ORDER BY mes
            `;

            const resultado = await pool.query(queryVentana, ['2024-01-01', '2024-12-31']);

            expect(resultado.rows[1].crecimiento_mensual).toBe(20.00);
            expect(resultado.rows[1].acumulado_anual).toBe(3300000);
        });
    });

    describe('Gestión de Conexiones (Mock)', () => {
        test('Pool de conexiones maneja múltiples solicitudes', async () => {
            const mockClients = [
                { 
                    query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }), 
                    release: jest.fn() 
                },
                { 
                    query: jest.fn().mockResolvedValue({ rows: [{ id: 2 }] }), 
                    release: jest.fn() 
                },
                { 
                    query: jest.fn().mockResolvedValue({ rows: [{ id: 3 }] }), 
                    release: jest.fn() 
                }
            ];

            // Configurar el pool para devolver diferentes clientes
            pool.connect
                .mockResolvedValueOnce(mockClients[0])
                .mockResolvedValueOnce(mockClients[1])
                .mockResolvedValueOnce(mockClients[2]);

            // Simular múltiples operaciones concurrentes
            const operacion1 = async () => {
                const client = await pool.connect();
                const result = await client.query('SELECT * FROM productos WHERE id = $1', [1]);
                client.release();
                return result;
            };

            const operacion2 = async () => {
                const client = await pool.connect();
                const result = await client.query('SELECT * FROM productos WHERE id = $1', [2]);
                client.release();
                return result;
            };

            const operacion3 = async () => {
                const client = await pool.connect();
                const result = await client.query('SELECT * FROM productos WHERE id = $1', [3]);
                client.release();
                return result;
            };

            const resultados = await Promise.all([operacion1(), operacion2(), operacion3()]);

            expect(resultados).toHaveLength(3);
            expect(resultados[0].rows[0].id).toBe(1);
            expect(resultados[1].rows[0].id).toBe(2);
            expect(resultados[2].rows[0].id).toBe(3);
            
            // Verificar que se liberaron las conexiones
            expect(mockClients[0].release).toHaveBeenCalled();
            expect(mockClients[1].release).toHaveBeenCalled();
            expect(mockClients[2].release).toHaveBeenCalled();
        });

        test('Manejo de errores de conexión', async () => {
            const errorConexion = new Error('Connection refused');
            pool.connect.mockRejectedValue(errorConexion);

            try {
                const client = await pool.connect();
                await client.query('SELECT 1');
            } catch (error) {
                expect(error.message).toBe('Connection refused');
            }

            expect(pool.connect).toHaveBeenCalled();
        });

        test('Timeout de conexión se maneja correctamente', async () => {
            const timeoutError = new Error('Connection timeout');
            timeoutError.code = 'ETIMEDOUT';

            pool.connect.mockRejectedValue(timeoutError);

            try {
                const client = await pool.connect();
            } catch (error) {
                expect(error.code).toBe('ETIMEDOUT');
                expect(error.message).toBe('Connection timeout');
            }
        });
    });

    describe('Validaciones de Integridad de Datos (Mock)', () => {
        test('Constraint de CHECK previene valores inválidos', async () => {
            const errorCheck = new Error('violates check constraint');
            errorCheck.code = '23514';

            pool.query.mockRejectedValue(errorCheck);

            try {
                await pool.query(
                    'INSERT INTO productos (codigo, nombre, precio_venta, stock_actual, stock_minimo) VALUES ($1, $2, $3, $4, $5)',
                    ['P001', 'Producto Test', -1000, 10, 5] // Precio negativo
                );
            } catch (error) {
                expect(error.code).toBe('23514');
                expect(error.message).toContain('violates check constraint');
            }
        });

        test('Constraint UNIQUE previene duplicados', async () => {
            const errorUnique = new Error('duplicate key value violates unique constraint');
            errorUnique.code = '23505';

            pool.query.mockRejectedValue(errorUnique);

            try {
                await pool.query(
                    'INSERT INTO productos (codigo, nombre) VALUES ($1, $2)',
                    ['P001', 'Producto Duplicado'] // Código ya existe
                );
            } catch (error) {
                expect(error.code).toBe('23505');
                expect(error.message).toContain('duplicate key value');
            }
        });

        test('NOT NULL constraint funciona correctamente', async () => {
            const errorNotNull = new Error('null value in column violates not-null constraint');
            errorNotNull.code = '23502';

            pool.query.mockRejectedValue(errorNotNull);

            try {
                await pool.query(
                    'INSERT INTO productos (codigo, nombre, precio_venta) VALUES ($1, $2, $3)',
                    [null, 'Producto Test', 1000] // Código nulo
                );
            } catch (error) {
                expect(error.code).toBe('23502');
                expect(error.message).toContain('not-null constraint');
            }
        });
    });
});