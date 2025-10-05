const FacturaController = require('../../controllers/facturaController');
const ProductoController = require('../../controllers/productoController');
const Producto = require('../../models/productoModel');
const { pool } = require('../../config/database');

// Mock de los modelos y dependencias
jest.mock('../../models/productoModel');
jest.mock('../../config/database');

describe('Pruebas de Integración Mock - Facturas y Productos (Fixed)', () => {
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

        // Configurar mock del pool con cliente completo
        const mockClient = {
            query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
            release: jest.fn()
        };

        pool.connect = jest.fn().mockResolvedValue(mockClient);
        pool.query = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
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

            // Mock del cliente de conexión específico
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Configurar respuestas secuenciales
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] }) // Empresa info
                .mockResolvedValueOnce({ rows: [{ numero: 'F-001' }] }) // Generar número
                .mockResolvedValueOnce({ rows: [{ id: 1, numero_factura: 'F-001' }] }) // Crear factura
                .mockResolvedValueOnce({ rows: [] }) // Insertar productos
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect.mockResolvedValue(mockClient);

            // Mock del método generarNumeroFactura
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');

            const resultado = await FacturaController.crearFacturaDesdeVenta(mockVentaData);

            // Verificar que se creó la factura correctamente
            expect(resultado).toBeDefined();
            expect(resultado.success).toBeTruthy();
            expect(mockClient.release).toHaveBeenCalled();
        });

        test('Obtener factura por ID funciona correctamente', async () => {
            const facturaId = 1;
            const mockFactura = {
                id: 1,
                numero_factura: 'F-001',
                cliente_nombre: 'Juan Pérez',
                total: 65000,
                estado: 'completada'
            };

            pool.query.mockResolvedValue({ rows: [mockFactura] });

            req.params = { id: facturaId };
            await FacturaController.obtenerFacturaPorId(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    factura: expect.objectContaining({
                        id: 1,
                        numero_factura: 'F-001'
                    })
                })
            );
        });

        test('Anular factura funciona correctamente', async () => {
            const facturaId = 1;
            const mockFactura = {
                id: 1,
                numero_factura: 'F-001',
                estado: 'completada'
            };

            // Mock del cliente de conexión
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockFactura] }) // Buscar factura
                .mockResolvedValueOnce({ rows: [] }) // Actualizar estado
                .mockResolvedValueOnce({ rows: [] }) // COMMIT
                .mockResolvedValueOnce({ rows: [{ ...mockFactura, estado: 'anulada' }] }); // Factura actualizada

            pool.connect.mockResolvedValue(mockClient);

            req.params = { id: facturaId };
            await FacturaController.anularFactura(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('anulada')
                })
            );
        });
    });

    describe('Integración Consulta Facturas-Productos (Mock)', () => {
        test('Listar facturas con paginación funciona correctamente', async () => {
            const mockFacturas = [
                { id: 1, numero_factura: 'F-001', cliente_nombre: 'Juan Pérez', total: 65000 },
                { id: 2, numero_factura: 'F-002', cliente_nombre: 'María García', total: 45000 }
            ];

            pool.query.mockResolvedValue({ rows: mockFacturas });

            req.query = { pagina: 1, limite: 10 };
            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({ numero_factura: 'F-001' }),
                        expect.objectContaining({ numero_factura: 'F-002' })
                    ])
                })
            );
        });

        test('Filtrar facturas por fechas en listarFacturas', async () => {
            const mockFacturas = [
                { id: 1, numero_factura: 'F-001', fecha_creacion: '2024-01-15', total: 65000 }
            ];

            pool.query.mockResolvedValue({ rows: mockFacturas });

            req.query = {
                fechaInicio: '2024-01-01',
                fechaFin: '2024-01-31',
                pagina: 1,
                limite: 10
            };

            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({ numero_factura: 'F-001' })
                    ])
                })
            );
        });
    });

    describe('Integración Configuración Empresa (Mock)', () => {
        test('Obtener información de empresa funciona correctamente', async () => {
            const mockEmpresa = {
                nombre_empresa: 'Ferretería G&L',
                nit: '123456789',
                direccion: 'Calle 123',
                telefono: '3001234567'
            };

            pool.query.mockResolvedValue({ rows: [mockEmpresa] });

            await FacturaController.obtenerEmpresa(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    empresa: expect.objectContaining({
                        nombre_empresa: 'Ferretería G&L',
                        nit: '123456789'
                    })
                })
            );
        });

        test('Actualizar información de empresa funciona correctamente', async () => {
            const mockEmpresaActualizada = {
                nombre_empresa: 'Ferretería G&L Actualizada',
                nit: '987654321',
                direccion: 'Nueva Dirección',
                telefono: '3009876543'
            };

            pool.query.mockResolvedValue({ rows: [mockEmpresaActualizada] });

            req.body = {
                nombre_empresa: 'Ferretería G&L Actualizada',
                nit: '987654321',
                direccion: 'Nueva Dirección',
                telefono: '3009876543'
            };

            await FacturaController.actualizarEmpresa(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('actualizada')
                })
            );
        });
    });

    describe('Flujos de Comunicación Factura-Producto (Mock)', () => {
        test('Flujo: Obtener producto -> Crear factura -> Listar facturas', async () => {
            // Paso 1: Obtener producto
            const mockProducto = {
                id: 1,
                codigo_producto: 'P001',
                nombre: 'Martillo',
                precio_venta: 25000,
                stock_actual: 10
            };

            Producto.buscarPorId.mockResolvedValue(mockProducto);

            // Paso 2: Crear factura (mock simplificado)
            const mockVentaData = {
                cliente: { nombre: 'Cliente Test' },
                productos: [{ id: 1, cantidad: 2, precioUnitario: 25000 }],
                total: 50000
            };

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
                release: jest.fn()
            };

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');

            const facturaCreada = await FacturaController.crearFacturaDesdeVenta(mockVentaData);

            // Paso 3: Listar facturas
            const mockFacturas = [
                { id: 1, numero_factura: 'F-001', total: 50000 }
            ];

            pool.query.mockResolvedValue({ rows: mockFacturas });

            req.query = { pagina: 1, limite: 10 };
            await FacturaController.listarFacturas(req, res);

            // Verificaciones
            expect(facturaCreada).toBeDefined();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({ numero_factura: 'F-001' })
                    ])
                })
            );
        });

        test('Flujo: Crear factura -> Obtener detalles -> Anular factura', async () => {
            // Paso 1: Crear factura
            const mockVentaData = {
                cliente: { nombre: 'Cliente Test 2' },
                productos: [{ id: 1, cantidad: 1, precioUnitario: 30000 }],
                total: 30000
            };

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{ id: 2 }] }),
                release: jest.fn()
            };

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-002');

            const facturaCreada = await FacturaController.crearFacturaDesdeVenta(mockVentaData);

            // Paso 2: Obtener detalles de factura
            const mockFacturaDetalle = {
                id: 2,
                numero_factura: 'F-002',
                cliente_nombre: 'Cliente Test 2',
                total: 30000,
                estado: 'completada'
            };

            pool.query.mockResolvedValue({ rows: [mockFacturaDetalle] });

            req.params = { id: 2 };
            await FacturaController.obtenerFacturaPorId(req, res);

            // Paso 3: Anular factura
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockFacturaDetalle] }) // Buscar factura
                .mockResolvedValueOnce({ rows: [] }) // Actualizar estado
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const resAnular = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };

            await FacturaController.anularFactura(req, resAnular);

            // Verificaciones
            expect(facturaCreada).toBeDefined();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    factura: expect.objectContaining({ numero_factura: 'F-002' })
                })
            );
            expect(resAnular.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            );
        });
    });
});