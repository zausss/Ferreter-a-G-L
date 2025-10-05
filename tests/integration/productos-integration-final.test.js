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
    });

    describe('Integración Productos-Categorías', () => {
        test('Obtener productos con información de categorías', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 10,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                },
                {
                    id: 2,
                    nombre: 'Tornillos',
                    codigo_producto: 'TORN-001',
                    precio_venta: 500,
                    stock_actual: 100,
                    stock_minimo: 10,
                    nombre_categoria: 'Ferretería',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'Martillo',
                            categoria: 'Herramientas'
                        })
                    ])
                })
            );
        });

        test('Filtrar productos por categoría', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 10,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            req.query.categoria = 'Herramientas';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            categoria: 'Herramientas'
                        })
                    ])
                })
            );
        });

        test('Crear producto con categoría válida', async () => {
            const mockProductoCreado = {
                id: 3,
                codigo_producto: 'DEST-001',
                nombre: 'Destornillador',
                precio_venta: 15000,
                stock_actual: 20,
                categoria_id: 1
            };

            Producto.obtenerTodos.mockResolvedValue([]); // No hay productos duplicados
            Producto.crear.mockResolvedValue(mockProductoCreado);

            req.body = {
                codigo: 'DEST-001',
                nombre: 'Destornillador',
                precioVenta: 15000,
                precioCompra: 10000,
                stock: 20,
                categoria: 1
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Producto creado exitosamente',
                    data: expect.objectContaining({
                        nombre: 'Destornillador'
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
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 2,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosStockBajo);

            req.query.estado = 'bajo-stock';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            estado: 'bajo-stock',
                            stock: 2,
                            stockMinimo: 5
                        })
                    ])
                })
            );
        });

        test('Productos activos con stock normal', async () => {
            const mockProductosActivos = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 15,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosActivos);

            req.query.estado = 'activo';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            estado: 'activo',
                            stock: 15
                        })
                    ])
                })
            );
        });
    });

    describe('Integración Productos-Búsqueda', () => {
        test('Buscar productos por nombre', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Martillo de carpintero',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 10,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            req.query.busqueda = 'martillo';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'Martillo de carpintero'
                        })
                    ])
                })
            );
        });

        test('Buscar productos por código', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 10,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            req.query.busqueda = 'MART-001';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            codigo: 'MART-001'
                        })
                    ])
                })
            );
        });

        test('Búsqueda sin resultados', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Martillo',
                    codigo_producto: 'MART-001',
                    precio_venta: 25000,
                    stock_actual: 10,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            req.query.busqueda = 'producto_inexistente';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: [], // Sin productos encontrados
                    pagination: expect.any(Object)
                })
            );
        });
    });

    describe('Integración Productos-Paginación', () => {
        test('Paginación de productos', async () => {
            const mockProductos = Array.from({ length: 25 }, (_, i) => ({
                id: i + 1,
                nombre: `Producto ${i + 1}`,
                codigo_producto: `PROD-${String(i + 1).padStart(3, '0')}`,
                precio_venta: 10000 + (i * 1000),
                stock_actual: 10,
                stock_minimo: 5,
                nombre_categoria: 'General',
                activo: true
            }));

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            req.query = { pagina: 1, limite: 10 };
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'Producto 1'
                        })
                    ]),
                    pagination: expect.objectContaining({
                        paginaActual: 1,
                        totalProductos: 25,
                        totalPaginas: 3,
                        productosPorPagina: 10
                    })
                })
            );
        });

        test('Navegación entre páginas', async () => {
            const mockProductos = Array.from({ length: 25 }, (_, i) => ({
                id: i + 1,
                nombre: `Producto ${i + 1}`,
                codigo_producto: `PROD-${String(i + 1).padStart(3, '0')}`,
                precio_venta: 10000 + (i * 1000),
                stock_actual: 10,
                stock_minimo: 5,
                nombre_categoria: 'General',
                activo: true
            }));

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            req.query = { pagina: 2, limite: 10 };
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'Producto 11' // Primer producto de la página 2
                        })
                    ]),
                    pagination: expect.objectContaining({
                        paginaActual: 2
                    })
                })
            );
        });
    });

    describe('Integración Productos-Validaciones', () => {
        test('Error al crear producto con código duplicado', async () => {
            const mockProductosExistentes = [
                {
                    id: 1,
                    codigo_producto: 'MART-001',
                    nombre: 'Martillo Existente'
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosExistentes);

            req.body = {
                codigo: 'MART-001',
                nombre: 'Martillo Nuevo',
                precioVenta: 25000,
                precioCompra: 15000,
                stock: 10
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'El código del producto ya existe'
                })
            );
        });

        test('Error al crear producto sin datos requeridos', async () => {
            req.body = {
                codigo: '',
                nombre: '',
                precioVenta: 0
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Campos requeridos')
                })
            );
        });

        test('Validación exitosa con datos completos', async () => {
            const mockProductoCreado = {
                id: 1,
                codigo_producto: 'PROD-001',
                nombre: 'Producto Válido'
            };

            Producto.obtenerTodos.mockResolvedValue([]); // No hay duplicados
            Producto.crear.mockResolvedValue(mockProductoCreado);

            req.body = {
                codigo: 'PROD-001',
                nombre: 'Producto Válido',
                precioVenta: 25000,
                precioCompra: 15000,
                stock: 10
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Producto creado exitosamente'
                })
            );
        });
    });

    describe('Operaciones CRUD Básicas', () => {
        test('Obtener todos los productos básico', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Producto Test',
                    codigo_producto: 'TEST-001',
                    precio_venta: 10000,
                    stock_actual: 5,
                    stock_minimo: 2,
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            await ProductoController.obtenerProductos(req, res);

            expect(Producto.obtenerTodos).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Array)
                })
            );
        });

        test('Manejo de errores en obtener productos', async () => {
            const mockError = new Error('Error de base de datos');
            Producto.obtenerTodos.mockRejectedValue(mockError);

            await ProductoController.obtenerProductos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Error interno del servidor'
                })
            );
        });
    });
});