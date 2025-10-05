const ProductoController = require('../../controllers/productoController');
const Producto = require('../../models/productoModel');

// Mock de los modelos
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
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    descripcion: 'Martillo de carpintero 16oz',
                    precio_venta: 25000,
                    precio_compra: 15000,
                    stock_actual: 10,
                    stock_minimo: 5,
                    nombre_categoria: 'Herramientas',
                    activo: true
                },
                {
                    id: 2,
                    codigo_producto: 'P002',
                    nombre: 'Destornillador Plano',
                    descripcion: 'Destornillador plano 6mm',
                    precio_venta: 8000,
                    precio_compra: 5000,
                    stock_actual: 15,
                    stock_minimo: 10,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        codigo: 'P001',
                        nombre: 'Martillo Carpintero',
                        categoria: 'Herramientas',
                        precio: 25000,
                        stock: 10
                    }),
                    expect.objectContaining({
                        codigo: 'P002',
                        nombre: 'Destornillador Plano',
                        categoria: 'Herramientas'
                    })
                ]),
                pagination: expect.any(Object)
            });
        });

        test('Filtrar productos por categoría', async () => {
            const mockProductosHerramientas = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    precio_venta: 25000,
                    stock_actual: 10,
                    nombre_categoria: 'Herramientas',
                    activo: true
                },
                {
                    id: 2,
                    codigo_producto: 'P002',
                    nombre: 'Destornillador Plano',
                    precio_venta: 8000,
                    stock_actual: 15,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosHerramientas);

            req.query.categoria = 'herramientas';
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
                codigo_producto: 'P003',
                nombre: 'Llave Inglesa',
                precio_venta: 15000,
                precio_compra: 10000,
                stock_actual: 5,
                categoria_id: 1
            };

            // Mock para verificar que no existe el código
            Producto.obtenerTodos.mockResolvedValue([]);
            Producto.crear.mockResolvedValue(mockProductoCreado);

            req.body = {
                codigo: 'P003',
                nombre: 'Llave Inglesa',
                precioVenta: 15000,
                precioCompra: 10000,
                stock: 5,
                categoria: 1
            };

            await ProductoController.crearProducto(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('creado'),
                    data: expect.objectContaining({
                        codigo_producto: 'P003',
                        nombre: 'Llave Inglesa'
                    })
                })
            );
        });
    });

    describe('Integración Productos-Stock', () => {
        test('Actualizar stock de producto', async () => {
            const mockProducto = {
                id: 1,
                codigo_producto: 'P001',
                nombre: 'Martillo Carpintero',
                stock_actual: 15,
                precio_venta: 25000
            };

            Producto.actualizar.mockResolvedValue(mockProducto);

            req.params.id = '1';
            req.body = {
                nombre: 'Martillo Carpintero',
                precioVenta: 25000,
                precioCompra: 15000,
                stock: 15 // Stock actualizado
            };

            await ProductoController.actualizarProducto(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('actualizado'),
                    data: expect.objectContaining({
                        stock_actual: 15
                    })
                })
            );
        });

        test('Obtener productos con stock bajo', async () => {
            const mockProductosStockBajo = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    stock_actual: 3,
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
                            estado: 'bajo-stock'
                        })
                    ])
                })
            );
        });
    });

    describe('Integración Productos-Búsqueda', () => {
        test('Buscar productos por nombre', async () => {
            const mockProductosBusqueda = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    precio_venta: 25000,
                    stock_actual: 10,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosBusqueda);

            req.query.busqueda = 'martillo';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: expect.stringMatching(/martillo/i)
                        })
                    ])
                })
            );
        });

        test('Buscar productos por código', async () => {
            const mockProductoPorCodigo = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    precio_venta: 25000,
                    stock_actual: 10,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductoPorCodigo);

            req.query.busqueda = 'P001';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            codigo: 'P001'
                        })
                    ])
                })
            );
        });

        test('Búsqueda sin resultados', async () => {
            Producto.obtenerTodos.mockResolvedValue([]);

            req.query.busqueda = 'producto-inexistente';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: [],
                    pagination: expect.objectContaining({
                        totalProductos: 0
                    })
                })
            );
        });
    });

    describe('Integración Productos-Paginación', () => {
        test('Paginación de productos', async () => {
            const mockProductosPaginados = Array.from({ length: 25 }, (_, i) => ({
                id: i + 1,
                codigo_producto: `P${String(i + 1).padStart(3, '0')}`,
                nombre: `Producto ${i + 1}`,
                precio_venta: 10000 + (i * 1000),
                stock_actual: 10,
                nombre_categoria: 'Herramientas',
                activo: true
            }));

            Producto.obtenerTodos.mockResolvedValue(mockProductosPaginados);

            req.query.pagina = '1';
            req.query.limite = '10';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            codigo: 'P001'
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
            const mockProductosPaginados = Array.from({ length: 25 }, (_, i) => ({
                id: i + 1,
                codigo_producto: `P${String(i + 1).padStart(3, '0')}`,
                nombre: `Producto ${i + 1}`,
                precio_venta: 10000 + (i * 1000),
                stock_actual: 10,
                nombre_categoria: 'Herramientas',
                activo: true
            }));

            Producto.obtenerTodos.mockResolvedValue(mockProductosPaginados);

            req.query.pagina = '2';
            req.query.limite = '10';
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    pagination: expect.objectContaining({
                        paginaActual: 2,
                        totalPaginas: 3
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
                    codigo_producto: 'P001',
                    nombre: 'Producto Existente'
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosExistentes);

            req.body = {
                codigo: 'P001', // Código duplicado
                nombre: 'Nuevo Producto',
                precioVenta: 15000,
                precioCompra: 10000,
                stock: 5
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('código del producto ya existe')
                })
            );
        });

        test('Error al crear producto sin datos requeridos', async () => {
            req.body = {
                // Faltan campos requeridos
                nombre: 'Producto Incompleto'
            };

            await ProductoController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('requeridos')
                })
            );
        });

        test('Error al actualizar producto inexistente', async () => {
            Producto.actualizar.mockResolvedValue(null); // Producto no encontrado

            req.params.id = '999';
            req.body = {
                nombre: 'Producto Actualizado',
                precioVenta: 20000,
                precioCompra: 15000,
                stock: 10
            };

            await ProductoController.actualizarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('no encontrado')
                })
            );
        });
    });

    describe('Integración Productos-Estadísticas', () => {
        test('Obtener estadísticas de productos', async () => {
            const mockEstadisticas = {
                total_productos: '25',
                productos_con_stock: '20',
                productos_stock_bajo: '3',
                valor_total_inventario: '750000.50'
            };

            Producto.obtenerEstadisticas.mockResolvedValue(mockEstadisticas);

            await ProductoController.obtenerEstadisticas(req, res);

            expect(res.json).toHaveBeenCalledWith({
                exito: true,
                estadisticas: {
                    total_productos: 25,
                    productos_con_stock: 20,
                    productos_stock_bajo: 3,
                    valor_total_inventario: 750000.50
                }
            });
        });

        test('Consistencia de estadísticas con datos reales', async () => {
            const mockProductos = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    stock_actual: 10,
                    stock_minimo: 5,
                    precio_venta: 25000,
                    activo: true
                },
                {
                    id: 2,
                    codigo_producto: 'P002',
                    stock_actual: 3, // Stock bajo
                    stock_minimo: 5,
                    precio_venta: 15000,
                    activo: true
                }
            ];

            const mockEstadisticas = {
                total_productos: '2',
                productos_con_stock: '2',
                productos_stock_bajo: '1',
                valor_total_inventario: '295000' // (10*25000) + (3*15000)
            };

            Producto.obtenerTodos.mockResolvedValue(mockProductos);
            Producto.obtenerEstadisticas.mockResolvedValue(mockEstadisticas);

            // Obtener productos y estadísticas
            await ProductoController.obtenerProductos(req, res);
            await ProductoController.obtenerEstadisticas(req, res);

            // Verificar consistencia
            expect(res.json).toHaveBeenCalledWith({
                exito: true,
                estadisticas: {
                    total_productos: 2,
                    productos_con_stock: 2,
                    productos_stock_bajo: 1,
                    valor_total_inventario: 295000
                }
            });
        });
    });
});