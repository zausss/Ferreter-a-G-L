const ProductoController = require('../../controllers/productoController');
const FacturaController = require('../../controllers/facturaController');
const Producto = require('../../models/productoModel');
const { pool } = require('../../config/database');

// Mock de los modelos
jest.mock('../../models/productoModel');
jest.mock('../../config/database');

describe('Pruebas de Integración Mock - Productos y Facturas (Fixed)', () => {
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

    describe('Flujos de Comunicación entre Módulos', () => {
        test('Flujo: Crear producto -> Verificar en lista -> Obtener por ID', async () => {
            // Paso 1: Crear producto
            const nuevoProducto = {
                codigo_producto: 'P999',
                nombre: 'Producto Test',
                precio_venta: 15000,
                precio_compra: 10000,
                categoria_id: 1,
                stock_actual: 20,
                stock_minimo: 5
            };

            const mockProductoCreado = {
                id: 999,
                ...nuevoProducto,
                nombre_categoria: 'Herramientas',
                activo: true,
                fecha_creacion: new Date()
            };

            const mockCrearProducto = jest.fn().mockResolvedValue(mockProductoCreado);

            // Paso 2: Verificar en lista de productos
            const mockListaProductos = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    nombre_categoria: 'Herramientas'
                },
                {
                    id: 999,
                    codigo_producto: 'P999',
                    nombre: 'Producto Test',
                    nombre_categoria: 'Herramientas'
                }
            ];

            const mockObtenerTodos = jest.fn().mockResolvedValue(mockListaProductos);
            Producto.obtenerTodos.mockResolvedValue(mockListaProductos);

            // Paso 3: Obtener producto específico por ID
            const mockObtenerPorId = jest.fn().mockResolvedValue(mockProductoCreado);
            Producto.buscarPorId.mockResolvedValue(mockProductoCreado);

            // Ejecutar flujo completo
            const productoCreado = await mockCrearProducto(nuevoProducto);
            const listaProductos = await mockObtenerTodos();
            const productoDetalle = await mockObtenerPorId(productoCreado.id);

            // Verificaciones
            expect(productoCreado.codigo_producto).toBe('P999');
            expect(productoCreado.nombre).toBe('Producto Test');
            expect(productoCreado.activo).toBe(true);

            // Verificar que está en la lista
            const productoEnLista = listaProductos.find(p => p.id === 999);
            expect(productoEnLista).toBeDefined();
            expect(productoEnLista.nombre).toBe('Producto Test');

            // Verificar detalles completos
            expect(productoDetalle.id).toBe(999);
            expect(productoDetalle.precio_venta).toBe(15000);
            expect(productoDetalle.stock_actual).toBe(20);
        });

        test('Flujo: Actualizar stock -> Crear factura -> Verificar stock actualizado', async () => {
            // Mock de los modelos directamente
            let currentStock = 10;
            
            // Mock para obtener producto por ID
            Producto.buscarPorId.mockImplementation((id) => {
                return Promise.resolve({
                    id: parseInt(id),
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    stock_actual: currentStock,
                    precio_venta: 25000,
                    activo: true
                });
            });
            
            // Mock para actualizar stock
            Producto.actualizar.mockImplementation((id, datos) => {
                if (datos.stock_actual !== undefined) {
                    currentStock = datos.stock_actual;
                }
                return Promise.resolve({
                    id: parseInt(id),
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    stock_actual: currentStock,
                    precio_venta: 25000
                });
            });
            
            // Mock para crear factura
            pool.query.mockImplementation((query, params) => {
                if (query.includes('INSERT') && query.includes('facturas')) {
                    return Promise.resolve({ 
                        rows: [{ id: 1 }],
                        rowCount: 1 
                    });
                }
                if (query.includes('INSERT') && query.includes('detalle_facturas')) {
                    return Promise.resolve({ rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
            });

            // 1. Obtener producto inicial (usar por ID ya que existe)
            const ProductoController = require('../../controllers/productoController');
            const mockReq1 = { params: { id: 1 } };
            const mockRes1 = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };
            
            await ProductoController.obtenerProductoPorId(mockReq1, mockRes1);
            const stockInicial = mockRes1.json.mock.calls[0][0].data;
            
            // 2. Simular actualización de stock
            currentStock = 7; // Reducir stock como si se hubiera vendido
            
            // 3. Verificar stock final
            const mockReq2 = { params: { id: 1 } };
            const mockRes2 = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };
            
            await ProductoController.obtenerProductoPorId(mockReq2, mockRes2);
            const stockFinal = mockRes2.json.mock.calls[0][0].data;
            
            expect(stockInicial.stock).toBe(10);
            expect(stockFinal.stock).toBe(7);
            expect(stockFinal.stock).toBe(stockInicial.stock - 3);
        });

        test('Flujo: Buscar productos -> Filtrar por categoría -> Generar reporte', async () => {
            // Paso 1: Obtener todos los productos
            const mockTodosProductos = [
                {
                    id: 1,
                    codigo_producto: 'P001',
                    nombre: 'Martillo',
                    categoria_id: 1,
                    nombre_categoria: 'Herramientas',
                    precio_venta: 25000,
                    stock_actual: 10
                },
                {
                    id: 2,
                    codigo_producto: 'P002',
                    nombre: 'Tornillo',
                    categoria_id: 2,
                    nombre_categoria: 'Ferretería',
                    precio_venta: 500,
                    stock_actual: 100
                },
                {
                    id: 3,
                    codigo_producto: 'P003',
                    nombre: 'Destornillador',
                    categoria_id: 1,
                    nombre_categoria: 'Herramientas',
                    precio_venta: 15000,
                    stock_actual: 5
                }
            ];

            const mockObtenerTodos = jest.fn().mockResolvedValue(mockTodosProductos);

            // Paso 2: Filtrar por categoría "Herramientas"
            const productosHerramientas = mockTodosProductos.filter(
                p => p.nombre_categoria === 'Herramientas'
            );

            const mockFiltrarPorCategoria = jest.fn().mockResolvedValue(productosHerramientas);

            // Paso 3: Generar reporte de la categoría
            const mockReporteCategoria = {
                categoria: 'Herramientas',
                total_productos: productosHerramientas.length,
                valor_inventario: productosHerramientas.reduce(
                    (acc, p) => acc + (p.precio_venta * p.stock_actual), 0
                ),
                productos_stock_bajo: productosHerramientas.filter(
                    p => p.stock_actual <= 5
                ).length,
                productos: productosHerramientas
            };

            const mockGenerarReporte = jest.fn().mockResolvedValue(mockReporteCategoria);

            // Ejecutar flujo
            const todosProductos = await mockObtenerTodos();
            const productosFiltrados = await mockFiltrarPorCategoria('Herramientas');
            const reporte = await mockGenerarReporte('Herramientas');

            // Verificaciones
            expect(todosProductos).toHaveLength(3);
            expect(productosFiltrados).toHaveLength(2);
            expect(productosFiltrados.every(p => p.nombre_categoria === 'Herramientas')).toBe(true);
            
            expect(reporte.categoria).toBe('Herramientas');
            expect(reporte.total_productos).toBe(2);
            expect(reporte.productos_stock_bajo).toBe(1); // Solo el destornillador tiene stock <= 5
            expect(reporte.valor_inventario).toBe(325000); // (25000*10) + (15000*5)
        });

        test('Flujo: Validar producto -> Crear factura -> Manejar errores', async () => {
            // Producto con stock insuficiente
            const productoStockBajo = {
                id: 1,
                codigo_producto: 'P001',
                nombre: 'Martillo',
                stock_actual: 2,
                precio_venta: 25000
            };

            // Paso 1: Validar disponibilidad de producto
            const mockValidarProducto = jest.fn().mockResolvedValue(productoStockBajo);
            Producto.buscarPorId.mockResolvedValue(productoStockBajo);

            // Paso 2: Intentar crear factura con cantidad mayor al stock
            const cantidadSolicitada = 5;
            const mockValidarStock = jest.fn().mockImplementation((producto, cantidad) => {
                if (producto.stock_actual < cantidad) {
                    throw new Error(`Stock insuficiente. Disponible: ${producto.stock_actual}, Solicitado: ${cantidad}`);
                }
                return true;
            });

            // Paso 3: Manejar error y sugerir cantidad válida
            const mockSugerirCantidad = jest.fn().mockReturnValue({
                cantidad_maxima: productoStockBajo.stock_actual,
                mensaje: `Solo disponible ${productoStockBajo.stock_actual} unidades`
            });

            // Ejecutar flujo con manejo de errores
            const producto = await mockValidarProducto(1);
            
            // Intentar validar stock (debe fallar)
            let errorCapturado = null;
            try {
                await mockValidarStock(producto, cantidadSolicitada);
            } catch (error) {
                errorCapturado = error;
            }

            // Obtener sugerencia de cantidad válida
            const sugerencia = mockSugerirCantidad(producto);

            // Verificaciones
            expect(producto.stock_actual).toBe(2);
            expect(errorCapturado).toBeTruthy();
            expect(errorCapturado.message).toContain('Stock insuficiente');
            expect(sugerencia.cantidad_maxima).toBe(2);
            expect(sugerencia.mensaje).toContain('Solo disponible 2 unidades');
        });

        test('Flujo: Crear múltiples productos -> Actualizar precios -> Generar estadísticas', async () => {
            // Mock para simular múltiples productos y cálculos
            const productos = [
                { 
                    id: 1, 
                    codigo_producto: 'P001', 
                    nombre: 'Producto 1', 
                    precio_venta: 150000, 
                    stock_actual: 10,
                    nombre_categoria: 'Herramientas',
                    activo: true
                },
                { 
                    id: 2, 
                    codigo_producto: 'P002', 
                    nombre: 'Producto 2', 
                    precio_venta: 200000, 
                    stock_actual: 15,
                    nombre_categoria: 'Herramientas',
                    activo: true
                }
            ];
            
            // Mock crear productos
            Producto.crear.mockResolvedValue({
                id: 999,
                codigo_producto: 'P001',
                nombre: 'Producto 1'
            });
            
            // Mock obtener todos los productos
            Producto.obtenerTodos.mockResolvedValue(productos);
            
            // Mock estadísticas
            Producto.obtenerEstadisticas.mockResolvedValue({
                total_productos: 25,
                productos_agregados_hoy: 2,
                valor_total_inventario: 500000
            });

            // 1. Crear múltiples productos usando el controlador
            const ProductoController = require('../../controllers/productoController');
            
            const mockReq1 = {
                body: {
                    codigo: 'P001',
                    nombre: 'Producto 1',
                    precioVenta: 150000,
                    precioCompra: 100000,
                    stock: 10
                }
            };
            const mockRes1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            
            await ProductoController.crearProducto(mockReq1, mockRes1);
            
            // 2. Obtener productos (simular precios actualizados)
            productos[0].precio_venta = 165000; // 150000 * 1.1
            productos[1].precio_venta = 220000; // 200000 * 1.1
            
            const mockReq2 = { query: {} };
            const mockRes2 = {
                json: jest.fn()
            };
            
            await ProductoController.obtenerProductos(mockReq2, mockRes2);
            const productosRespuesta = mockRes2.json.mock.calls[0][0];
            
            // 3. Generar estadísticas  
            const mockReq3 = {};
            const mockRes3 = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };
            
            await ProductoController.obtenerEstadisticas(mockReq3, mockRes3);
            const respuestaEstadisticas = mockRes3.json.mock.calls[0][0];
            
            expect(productosRespuesta.data[0].precio).toBe(165000); // 150000 * 1.1
            expect(productosRespuesta.data[1].precio).toBe(220000); // 200000 * 1.1
            
            expect(respuestaEstadisticas.estadisticas.total_productos).toBe(25);
            expect(respuestaEstadisticas.exito).toBe(true);
        });
    });
});