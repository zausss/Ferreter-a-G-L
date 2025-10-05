const FacturaController = require('../../controllers/facturaController');
const ProductoController = require('../../controllers/productoController');
const Producto = require('../../models/productoModel');

// Mock de los modelos y dependencias
jest.mock('../../models/productoModel');
jest.mock('../../config/database');

describe('Pruebas de Integración Mock - Facturas y Productos', () => {
    let req, res, mockPool;

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

        // Mock del pool de conexiones
        mockPool = {
            query: jest.fn(),
            connect: jest.fn().mockResolvedValue({
                query: jest.fn(),
                release: jest.fn(),
                rollback: jest.fn()
            })
        };

        require('../../config/database').pool = mockPool;
    });

    describe('Integración Factura-Productos (Mock)', () => {
        test('Crear factura desde venta funciona correctamente', async () => {
            const mockVentaData = {
                cliente: {
                    tipo: 'natural',
                    documento: '12345678',
                    nombre: 'Juan Pérez',
                    telefono: '3001234567'
                },
                productos: [
                    { id: 1, cantidad: 2, precioUnitario: 25000 },
                    { id: 2, cantidad: 1, precioUnitario: 15000 }
                ],
                subtotal: 65000,
                iva: 0,
                total: 65000,
                metodoPago: 'efectivo',
                montoRecibido: 70000,
                cambio: 5000
            };

            // Mock del cliente de conexión
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockPool.connect.mockResolvedValue(mockClient);

            // Mock de las consultas
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] }) // Empresa info
                .mockResolvedValueOnce({ rows: [{ numero: 'F-001' }] }) // Generar número
                .mockResolvedValueOnce({ rows: [{ id: 1, numero_factura: 'F-001' }] }) // Crear factura
                .mockResolvedValueOnce({ rows: [] }) // Insertar productos
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            // Mock del método generarNumeroFactura
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');

            const resultado = await FacturaController.crearFacturaDesdeVenta(mockVentaData);

            // Verificar que se creó la factura
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(FacturaController.generarNumeroFactura).toHaveBeenCalled();
            expect(resultado).toBeDefined();
        });

        test('Obtener factura por ID funciona correctamente', async () => {
            const mockFacturaData = {
                id: 1,
                numero_factura: 'F-001',
                fecha: '2024-01-15',
                cliente_nombre: 'Juan Pérez',
                total: 65000,
                estado: 'activa'
            };

            const mockDetallesFactura = [
                {
                    producto_nombre: 'Martillo',
                    cantidad: 2,
                    precio_unitario: 25000,
                    subtotal: 50000
                },
                {
                    producto_nombre: 'Tornillo',
                    cantidad: 10,
                    precio_unitario: 1500,
                    subtotal: 15000
                }
            ];

            // Mock del pool de conexiones
            mockPool.query
                .mockResolvedValueOnce({ rows: [mockFacturaData] }) // Obtener factura
                .mockResolvedValueOnce({ rows: mockDetallesFactura }); // Obtener productos

            req.params.id = '1';
            await FacturaController.obtenerFacturaPorId(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    factura: expect.objectContaining({
                        id: 1,
                        numero: 'F-001',
                        productos: expect.arrayContaining([
                            expect.objectContaining({
                                nombre: 'Martillo',
                                cantidad: 2
                            })
                        ])
                    })
                })
            );
        });

        test('Anular factura funciona correctamente', async () => {
            const mockFactura = {
                id: 1,
                numero_factura: 'F-001',
                estado: 'activa'
            };

            // Mock de la transacción
            const mockClient = {
                query: jest.fn(),
                release: jest.fn(),
                rollback: jest.fn()
            };

            mockPool.connect.mockResolvedValue(mockClient);

            // Mock de las consultas
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockFactura] }) // Verificar factura
                .mockResolvedValueOnce({ rows: [] }) // Actualizar estado
                .mockResolvedValueOnce({ rows: [] }) // Restaurar stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            req.params.id = '1';
            req.body = { motivo: 'Error en la venta' };

            await FacturaController.anularFactura(req, res);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    mensaje: expect.stringContaining('anulada')
                })
            );
        });
    });

    describe('Integración Consulta Facturas-Productos (Mock)', () => {
        test('Listar facturas con paginación funciona correctamente', async () => {
            const mockFacturas = [
                {
                    id: 1,
                    numero_factura: 'F-001',
                    fecha: '2024-01-15',
                    cliente_nombre: 'Juan Pérez',
                    total: 65000,
                    estado: 'activa'
                },
                {
                    id: 2,
                    numero_factura: 'F-002',
                    fecha: '2024-01-16',
                    cliente_nombre: 'María García',
                    total: 45000,
                    estado: 'activa'
                }
            ];

            const mockTotal = [{ count: '25' }];

            // Mock consultas
            mockPool.query
                .mockResolvedValueOnce({ rows: mockFacturas }) // Obtener facturas
                .mockResolvedValueOnce({ rows: mockTotal }); // Contar total

            req.query = {
                pagina: '1',
                limite: '10'
            };

            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({
                            numero: 'F-001',
                            clienteNombre: 'Juan Pérez'
                        }),
                        expect.objectContaining({
                            numero: 'F-002',
                            clienteNombre: 'María García'
                        })
                    ]),
                    paginacion: expect.objectContaining({
                        totalFacturas: 25,
                        paginaActual: 1
                    })
                })
            );
        });

        test('Filtrar facturas por fechas en listarFacturas', async () => {
            const mockFacturasFiltradas = [
                {
                    id: 1,
                    numero_factura: 'F-001',
                    fecha: '2024-01-15',
                    cliente_nombre: 'Juan Pérez',
                    total: 65000,
                    estado: 'activa'
                },
                {
                    id: 2,
                    numero_factura: 'F-002',
                    fecha: '2024-01-16',
                    cliente_nombre: 'María García',
                    total: 45000,
                    estado: 'activa'
                }
            ];

            const mockTotal = [{ count: '2' }];

            mockPool.query
                .mockResolvedValueOnce({ rows: mockFacturasFiltradas })
                .mockResolvedValueOnce({ rows: mockTotal });

            req.query = {
                fechaInicio: '2024-01-15',
                fechaFin: '2024-01-16',
                pagina: '1',
                limite: '10'
            };

            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({
                            numero: 'F-001',
                            fecha: '2024-01-15'
                        }),
                        expect.objectContaining({
                            numero: 'F-002',
                            fecha: '2024-01-16'
                        })
                    ])
                })
            );
        });
    });

    describe('Integración Configuración Empresa (Mock)', () => {
        test('Obtener información de empresa funciona correctamente', async () => {
            const mockEmpresaInfo = [
                {
                    id: 1,
                    nombre_empresa: 'Ferretería G&L',
                    nit: '900.123.456-7',
                    direccion: 'Calle Principal #123',
                    telefono: '(57) 555-0123',
                    email: 'ventas@ferreteriagl.com'
                }
            ];

            mockPool.query.mockResolvedValue({ rows: mockEmpresaInfo });

            await FacturaController.obtenerEmpresa(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    empresa: expect.objectContaining({
                        nombre: 'Ferretería G&L',
                        nit: '900.123.456-7',
                        direccion: 'Calle Principal #123'
                    })
                })
            );
        });

        test('Actualizar información de empresa funciona correctamente', async () => {
            const mockEmpresaActualizada = {
                id: 1,
                nombre_empresa: 'Ferretería G&L Actualizada',
                nit: '900.123.456-7',
                direccion: 'Nueva Dirección #456'
            };

            mockPool.query.mockResolvedValue({ rows: [mockEmpresaActualizada] });

            req.body = {
                nombre: 'Ferretería G&L Actualizada',
                nit: '900.123.456-7',
                direccion: 'Nueva Dirección #456',
                telefono: '(57) 555-0124',
                email: 'info@ferreteriagl.com'
            };

            await FacturaController.actualizarEmpresa(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    mensaje: expect.stringContaining('actualizada'),
                    empresa: expect.objectContaining({
                        nombre: 'Ferretería G&L Actualizada'
                    })
                })
            );
        });
    });

    describe('Flujos de Comunicación Factura-Producto (Mock)', () => {
        test('Flujo: Obtener producto -> Crear factura -> Listar facturas', async () => {
            // 1. Verificar que el producto existe
            const mockProducto = {
                id: 1,
                codigo_producto: 'P001',
                nombre: 'Martillo',
                stock_actual: 10,
                precio_venta: 25000
            };

            Producto.buscarPorId.mockResolvedValue(mockProducto);

            req.params.id = '1';
            await ProductoController.obtenerProductoPorId(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        id: 1,
                        nombre: 'Martillo'
                    })
                })
            );

            // 2. Crear factura con ese producto
            jest.clearAllMocks();
            
            const mockVentaData = {
                cliente: {
                    tipo: 'natural',
                    documento: '12345678',
                    nombre: 'Juan Pérez',
                    telefono: '3001234567'
                },
                productos: [{ id: 1, cantidad: 2, precioUnitario: 25000 }],
                subtotal: 50000,
                iva: 0,
                total: 50000,
                metodoPago: 'efectivo',
                montoRecibido: 50000,
                cambio: 0
            };

            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockPool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');

            const facturaResult = await FacturaController.crearFacturaDesdeVenta(mockVentaData);

            // 3. Listar facturas para verificar que se creó
            jest.clearAllMocks();
            
            const mockFacturas = [
                {
                    id: 1,
                    numero_factura: 'F-001',
                    fecha: '2024-01-15',
                    cliente_nombre: 'Juan Pérez',
                    total: 50000,
                    estado: 'activa'
                }
            ];

            mockPool.query
                .mockResolvedValueOnce({ rows: mockFacturas })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] });

            req.query = { pagina: '1', limite: '10' };
            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({
                            numero: 'F-001',
                            clienteNombre: 'Juan Pérez'
                        })
                    ])
                })
            );
        });

        test('Flujo: Crear factura -> Obtener detalles -> Anular factura', async () => {
            // 1. Crear factura
            const mockVentaData = {
                cliente: {
                    tipo: 'natural',
                    documento: '12345678',
                    nombre: 'Juan Pérez'
                },
                subtotal: 25000,
                iva: 0,
                total: 25000,
                metodoPago: 'efectivo',
                montoRecibido: 25000,
                cambio: 0
            };

            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockPool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');

            await FacturaController.crearFacturaDesdeVenta(mockVentaData);

            // 2. Obtener detalles de la factura
            jest.clearAllMocks();
            
            const mockFacturaDetalle = {
                id: 1,
                numero_factura: 'F-001',
                fecha: '2024-01-15',
                cliente_nombre: 'Juan Pérez',
                total: 25000,
                estado: 'activa'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [mockFacturaDetalle] })
                .mockResolvedValueOnce({ rows: [] });

            req.params.id = '1';
            await FacturaController.obtenerFacturaPorId(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    factura: expect.objectContaining({
                        numero: 'F-001',
                        estado: 'activa'
                    })
                })
            );

            // 3. Anular la factura
            jest.clearAllMocks();
            
            mockPool.connect.mockResolvedValue(mockClient);
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockFacturaDetalle] }) // Verificar factura
                .mockResolvedValueOnce({ rows: [] }) // Actualizar estado
                .mockResolvedValueOnce({ rows: [] }) // Restaurar stock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            req.body = { motivo: 'Error en venta' };
            await FacturaController.anularFactura(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    exito: true,
                    mensaje: expect.stringContaining('anulada')
                })
            );
        });
    });
});