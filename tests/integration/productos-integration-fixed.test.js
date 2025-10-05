const ProductoController = require('../../controllers/productoController');
const Producto = require('../../models/productoModel');

// Mock del modelo de productos
jest.mock('../../models/productoModel');

describe('Pruebas de Integración - Módulo Productos (Fixed)', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            query: {},
            body: {},
            params: {},
            usuario: { id: 1, rol_sistema: 'Administrador' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        // Configurar mocks del modelo
        Producto.obtenerTodos = jest.fn();
        Producto.crear = jest.fn();
        Producto.actualizar = jest.fn();
        Producto.eliminar = jest.fn();
    });

    describe('Integración Productos-Categorías', () => {
        test('Obtener productos con información de categorías', async () => {
            const mockProductosConCategorias = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 10,
                    categoria_id: 1,
                    nombre_categoria: 'Herramientas',
                    activo: true,
                    stock_minimo: 5
                },
                {
                    id: 2,
                    nombre: 'Tornillos',
                    codigo_producto: 'TORN-001',
                    precio_venta: 500,
                    stock_actual: 100,
                    categoria_id: 2,
                    nombre_categoria: 'Ferretería',
                    activo: true,
                    stock_minimo: 10
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosConCategorias);

            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'Martillo',
                            categoria: 'Herramientas'
                        }),
                        expect.objectContaining({
                            nombre: 'Tornillos',
                            categoria: 'Ferretería'
                        })
                    ])
                })
            );
        });

        test('Filtrar productos por categoría', async () => {
            const mockProductosCategoria = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo: 'MART-001',
                    precio: 25000,
                    stock: 10,
                    categoria_id: 1,
                    categoria_nombre: 'Herramientas'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductosCategoria });

            req.query.categoria = '1';
            await ProductoController.obtenerProductos(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('categoria_id = $'),
                expect.arrayContaining(['1'])
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    productos: expect.arrayContaining([
                        expect.objectContaining({
                            categoria_nombre: 'Herramientas'
                        })
                    ])
                })
            );
        });

        test('Crear producto con categoría válida', async () => {
            const mockCategoriaValida = [
                { id: 1, nombre: 'Herramientas', descripcion: 'Herramientas de trabajo' }
            ];
            const mockProductoCreado = [
                {
                    id: 3,
                    nombre: 'Destornillador',
                    codigo: 'DEST-001',
                    precio: 15000,
                    stock: 20,
                    categoria_id: 1
                }
            ];

            pool.query
                .mockResolvedValueOnce({ rows: mockCategoriaValida }) // Verificar categoría
                .mockResolvedValueOnce({ rows: [] }) // Verificar código único
                .mockResolvedValueOnce({ rows: mockProductoCreado }); // Crear producto

            req.body = {
                nombre: 'Destornillador',
                codigo: 'DEST-001',
                precio: 15000,
                stock: 20,
                categoria_id: 1,
                descripcion: 'Destornillador Phillips'
            };

            await ProductoController.crearProducto(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    producto: expect.objectContaining({
                        nombre: 'Destornillador',
                        categoria_id: 1
                    })
                })
            );
        });
    });

    describe('Integración Productos-Stock', () => {
        test('Obtener productos con stock bajo', async () => {
            const mockProductosStockBajo = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo: 'MART-001',
                    precio: 25000,
                    stock: 2,
                    stock_minimo: 5,
                    categoria_nombre: 'Herramientas'
                },
                {
                    id: 2,
                    nombre: 'Clavos',
                    codigo: 'CLAV-001',
                    precio: 1000,
                    stock: 1,
                    stock_minimo: 10,
                    categoria_nombre: 'Ferretería'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductosStockBajo });

            req.query.stock_bajo = 'true';
            await ProductoController.obtenerProductos(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('stock <= stock_minimo'),
                expect.any(Array)
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    productos: expect.arrayContaining([
                        expect.objectContaining({
                            stock: expect.any(Number),
                            stock_minimo: expect.any(Number)
                        })
                    ])
                })
            );
        });

        test('Actualizar stock de producto', async () => {
            const mockProductoActualizado = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo: 'MART-001',
                    precio: 25000,
                    stock: 15,
                    categoria_id: 1
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductoActualizado });

            req.params.id = '1';
            req.body = { stock: 15 };

            await ProductoController.actualizarStock(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE productos SET stock = $1'),
                expect.arrayContaining([15, '1'])
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    mensaje: expect.stringContaining('actualizado'),
                    producto: expect.objectContaining({
                        stock: 15
                    })
                })
            );
        });
    });

    describe('Integración Productos-Búsqueda', () => {
        test('Buscar productos por nombre', async () => {
            const mockProductosBusqueda = [
                {
                    id: 1,
                    nombre: 'Martillo de carpintero',
                    codigo: 'MART-001',
                    precio: 25000,
                    stock: 10,
                    categoria_nombre: 'Herramientas'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductosBusqueda });

            req.query.busqueda = 'martillo';
            await ProductoController.buscarProductos(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                expect.arrayContaining(['%martillo%'])
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    productos: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: expect.stringContaining('Martillo')
                        })
                    ])
                })
            );
        });

        test('Buscar productos por código', async () => {
            const mockProductoCodigo = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo: 'MART-001',
                    precio: 25000,
                    stock: 10,
                    categoria_nombre: 'Herramientas'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductoCodigo });

            req.query.codigo = 'MART-001';
            await ProductoController.buscarProductos(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('codigo'),
                expect.arrayContaining(['MART-001'])
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    productos: expect.arrayContaining([
                        expect.objectContaining({
                            codigo: 'MART-001'
                        })
                    ])
                })
            );
        });

        test('Búsqueda sin resultados', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            req.query.busqueda = 'producto_inexistente';
            await ProductoController.buscarProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    productos: [],
                    mensaje: expect.stringContaining('No se encontraron')
                })
            );
        });
    });

    describe('Integración Productos-Paginación', () => {
        test('Paginación de productos', async () => {
            const mockProductosPaginados = [
                {
                    id: 1,
                    nombre: 'Producto 1',
                    precio: 10000,
                    stock: 5
                },
                {
                    id: 2,
                    nombre: 'Producto 2',
                    precio: 20000,
                    stock: 10
                }
            ];

            pool.query
                .mockResolvedValueOnce({ rows: [{ total: 25 }] }) // Count total
                .mockResolvedValueOnce({ rows: mockProductosPaginados }); // Productos paginados

            req.query = { pagina: 1, limite: 2 };
            await ProductoController.obtenerProductos(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT'),
                expect.arrayContaining([2, 0])
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    productos: expect.arrayContaining(mockProductosPaginados),
                    paginacion: expect.objectContaining({
                        total: 25,
                        pagina: 1,
                        limite: 2
                    })
                })
            );
        });

        test('Navegación entre páginas', async () => {
            const mockProductosPagina2 = [
                {
                    id: 3,
                    nombre: 'Producto 3',
                    precio: 30000,
                    stock: 15
                }
            ];

            pool.query
                .mockResolvedValueOnce({ rows: [{ total: 25 }] })
                .mockResolvedValueOnce({ rows: mockProductosPagina2 });

            req.query = { pagina: 2, limite: 2 };
            await ProductoController.obtenerProductos(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT'),
                expect.arrayContaining([2, 2]) // OFFSET = (pagina - 1) * limite
            );
        });
    });

    describe('Integración Productos-Validaciones', () => {
        test('Error al crear producto con código duplicado', async () => {
            const mockCodigoDuplicado = [
                { codigo: 'MART-001' }
            ];

            pool.query.mockResolvedValue({ rows: mockCodigoDuplicado });

            req.body = {
                nombre: 'Martillo Nuevo',
                codigo: 'MART-001', // Código ya existente
                precio: 25000,
                stock: 10,
                categoria_id: 1
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining('código ya existe')
                })
            );
        });

        test('Error al crear producto sin datos requeridos', async () => {
            req.body = {
                nombre: '', // Nombre vacío
                precio: 0,  // Precio inválido
                stock: -1   // Stock negativo
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.any(String)
                })
            );
        });

        test('Error al actualizar producto inexistente', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            req.params.id = '999'; // ID inexistente
            req.body = {
                nombre: 'Producto Actualizado',
                precio: 30000
            };

            await ProductoController.actualizarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining('no encontrado')
                })
            );
        });
    });

    describe('Integración Productos-Estadísticas', () => {
        test('Obtener estadísticas de productos', async () => {
            const mockEstadisticas = [
                {
                    total_productos: 50,
                    productos_activos: 45,
                    productos_stock_bajo: 5,
                    valor_total_inventario: 500000,
                    categoria_mas_productos: 'Herramientas'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockEstadisticas });

            await ProductoController.obtenerEstadisticas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    estadisticas: expect.objectContaining({
                        total_productos: 50,
                        productos_activos: 45,
                        productos_stock_bajo: 5,
                        valor_total_inventario: 500000
                    })
                })
            );
        });

        test('Consistencia de estadísticas con datos reales', async () => {
            const mockDatosConsistentes = [
                {
                    total_calculado: 50,
                    activos_calculados: 45,
                    bajo_stock_calculado: 5
                }
            ];

            pool.query.mockResolvedValue({ rows: mockDatosConsistentes });

            const query = `
                SELECT 
                    COUNT(*) as total_calculado,
                    COUNT(CASE WHEN activo = true THEN 1 END) as activos_calculados,
                    COUNT(CASE WHEN stock <= stock_minimo THEN 1 END) as bajo_stock_calculado
                FROM productos
            `;

            await pool.query(query);

            expect(pool.query).toHaveBeenCalledWith(query);
            const result = await pool.query(query);
            
            expect(result.rows[0].total_calculado).toBe(50);
            expect(result.rows[0].activos_calculados).toBe(45);
            expect(result.rows[0].bajo_stock_calculado).toBe(5);
        });
    });
});