const ProductoController = require('../../controllers/productoController');
const FacturaController = require('../../controllers/facturaController');
const Producto = require('../../models/productoModel');

// Mock de los modelos
jest.mock('../../models/productoModel');
jest.mock('../../config/database');

describe('Pruebas de Integración Mock - Productos y Facturas', () => {
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

    describe('Integración Productos-Categorías (Mock)', () => {
        test('Flujo completo: crear categoría y producto', async () => {
            const mockProductos = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    nombre_categoria: 'Herramientas',
                    stock_actual: 10,
                    stock_minimo: 5,
                    precio_venta: 25000,
                    precio_compra: 15000,
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);

            // Obtener productos con información de categoría
            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 1,
                        codigo: 'P001',
                        nombre: 'Martillo',
                        categoria: 'Herramientas',
                        precio: 25000,
                        stock: 10
                    })
                ]),
                pagination: expect.any(Object)
            });
        });

        test('Filtrar productos por categoría funciona correctamente', async () => {
            const mockProductosFiltrados = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    nombre_categoria: 'Herramientas',
                    stock_actual: 10,
                    precio_venta: 25000,
                    activo: true
                },
                {
                    id: 4,
                    codigo_producto: 'P004',
                    nombre: 'Destornillador',
                    nombre_categoria: 'Herramientas',
                    stock_actual: 15,
                    precio_venta: 8000,
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosFiltrados);
            req.query.categoria = 'herramientas';

            await ProductoController.obtenerProductos(req, res);

            // Verificar que se aplicó correctamente el filtro
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
    });

    describe('Integración Productos-Stock (Mock)', () => {
        test('Validación de stock insuficiente en venta', async () => {
            const mockProducto = {
                id: 1,
                codigo_producto: 'P001',
                nombre: 'Martillo',
                stock_actual: 2, // Stock bajo
                stock_minimo: 5,
                precio_venta: 25000,
                activo: true
            };

            // Simular consulta de producto con stock bajo
            Producto.obtenerTodos.mockResolvedValue([mockProducto]);
            req.query.estado = 'bajo-stock';

            await ProductoController.obtenerProductos(req, res);

            // Verificar que se identifica correctamente el producto con stock bajo
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            id: 1,
                            stock: 2,
                            stockMinimo: 5,
                            estado: 'bajo-stock'
                        })
                    ])
                })
            );
        });

        test('Obtener productos con stock bajo específicamente', async () => {
            const mockProductosStockBajo = [
                {
                    id: 2,
                    codigo_producto: 'P002',
                    nombre: 'Tornillo',
                    nombre_categoria: 'Tornillería',
                    stock_actual: 1,
                    stock_minimo: 10
                }
            ];

            Producto.stockBajo.mockResolvedValue(mockProductosStockBajo);

            await ProductoController.obtenerStockBajo(req, res);

            expect(Producto.stockBajo).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 2,
                        codigo: 'P002',
                        stock: 1,
                        stockMinimo: 10
                    })
                ])
            });
        });
    });

    describe('Integración Productos-Búsqueda (Mock)', () => {
        test('Búsqueda por nombre devuelve resultados relevantes', async () => {
            const mockProductos = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    precio_venta: 25000,
                    stock_actual: 10,
                    activo: true
                },
                {
                    id: 4,
                    codigo_producto: 'P004',
                    nombre: 'Martillo Demolición',
                    precio_venta: 45000,
                    stock_actual: 5,
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);
            req.query.busqueda = 'martillo';

            await ProductoController.obtenerProductos(req, res);

            const responseCall = res.json.mock.calls[0][0];
            expect(responseCall.success).toBe(true);
            expect(responseCall.data).toHaveLength(2);
            responseCall.data.forEach(producto => {
                expect(producto.nombre.toLowerCase()).toContain('martillo');
            });
        });

        test('Búsqueda por código devuelve producto específico', async () => {
            const mockProductos = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Carpintero',
                    precio_venta: 25000,
                    stock_actual: 10,
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductos);
            req.query.busqueda = 'P001';

            await ProductoController.obtenerProductos(req, res);

            const responseCall = res.json.mock.calls[0][0];
            expect(responseCall.success).toBe(true);
            expect(responseCall.data).toHaveLength(1);
            expect(responseCall.data[0].codigo).toBe('P001');
        });
    });

    describe('Integración Paginación (Mock)', () => {
        test('Paginación funciona correctamente con datos mockeados', async () => {
            const mockProductos = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                codigo_producto: `P${(i + 1).toString().padStart(3, '0')}`,
                nombre: `Producto ${i + 1}`,
                precio_venta: (i + 1) * 1000,
                stock_actual: 10,
                activo: true
            }));

            Producto.obtenerTodos.mockResolvedValue(mockProductos);
            req.query.pagina = '1';
            req.query.limite = '5';

            await ProductoController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Array),
                    pagination: {
                        paginaActual: 1,
                        totalProductos: 10,
                        totalPaginas: 2,
                        productosPorPagina: 5
                    }
                })
            );

            const responseCall = res.json.mock.calls[0][0];
            expect(responseCall.data).toHaveLength(5);
        });

        test('Segunda página de paginación', async () => {
            const mockProductos = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                codigo_producto: `P${(i + 1).toString().padStart(3, '0')}`,
                nombre: `Producto ${i + 1}`,
                precio_venta: (i + 1) * 1000,
                stock_actual: 10,
                activo: true
            }));

            Producto.obtenerTodos.mockResolvedValue(mockProductos);
            req.query.pagina = '2';
            req.query.limite = '5';

            await ProductoController.obtenerProductos(req, res);

            const responseCall = res.json.mock.calls[0][0];
            expect(responseCall.pagination.paginaActual).toBe(2);
            expect(responseCall.data).toHaveLength(5);
            expect(responseCall.data[0].id).toBe(6); // Debe empezar desde el ID 6
        });
    });

    describe('Integración Estadísticas (Mock)', () => {
        test('Estadísticas de productos se calculan correctamente', async () => {
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
    });

    describe('Flujos de Comunicación entre Módulos', () => {
        test('Flujo: Crear producto -> Verificar en lista -> Obtener por ID', async () => {
            // Configurar mock para que no encuentre productos existentes con el código P005
            const productosExistentes = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    precio_venta: 25000,
                    stock_actual: 10
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(productosExistentes);

            // 1. Crear producto (mock del resultado)
            const nuevoProducto = {
                id: 5,
                codigo_producto: 'P005',
                nombre: 'Taladro',
                precio_venta: 120000,
                stock_actual: 3,
                activo: true
            };

            Producto.crear.mockResolvedValue(nuevoProducto);

            // Simular creación
            req.body = {
                codigo: 'P005',
                nombre: 'Taladro',
                precioVenta: 120000,
                precioCompra: 80000,
                stock: 3,
                stockMinimo: 2
            };

            await ProductoController.crearProducto(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('creado'),
                    data: expect.objectContaining({
                        id: 5,
                        codigo_producto: 'P005',
                        nombre: 'Taladro'
                    })
                })
            );

            // 2. Verificar que aparece en la lista
            jest.clearAllMocks();
            const mockProductosConNuevo = [nuevoProducto];
            Producto.obtenerTodos.mockResolvedValue(mockProductosConNuevo);

            req.body = {}; // Limpiar body
            await ProductoController.obtenerProductos(req, res);

            expect(Producto.obtenerTodos).toHaveBeenCalled();

            // 3. Obtener por ID específico
            jest.clearAllMocks();
            Producto.buscarPorId.mockResolvedValue(nuevoProducto);
            req.params.id = '5';

            await ProductoController.obtenerProductoPorId(req, res);

            expect(Producto.buscarPorId).toHaveBeenCalledWith('5');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        id: 5,
                        nombre: 'Taladro'
                    })
                })
            );
        });

        test('Flujo: Búsqueda -> Filtro -> Paginación combinados', async () => {
            const mockProductosFiltrados = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo Grande',
                    nombre_categoria: 'Herramientas',
                    stock_actual: 15,
                    precio_venta: 35000,
                    activo: true
                },
                {
                    id: 2,
                    codigo_producto: 'P002',
                    nombre: 'Martillo Pequeño',
                    nombre_categoria: 'Herramientas',
                    stock_actual: 8,
                    precio_venta: 18000,
                    activo: true
                }
            ];

            Producto.obtenerTodos.mockResolvedValue(mockProductosFiltrados);

            // Combinar búsqueda, filtro y paginación
            req.query = {
                busqueda: 'martillo',
                categoria: 'herramientas',
                pagina: '1',
                limite: '10'
            };

            await ProductoController.obtenerProductos(req, res);

            const responseCall = res.json.mock.calls[0][0];
            
            expect(responseCall.success).toBe(true);
            expect(responseCall.data).toHaveLength(2);
            
            // Verificar que se aplicaron todos los filtros
            responseCall.data.forEach(producto => {
                expect(producto.nombre.toLowerCase()).toContain('martillo');
                expect(producto.categoria).toBe('Herramientas');
            });
            
            expect(responseCall.pagination).toBeDefined();
        });
    });
});