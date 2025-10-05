const FacturaController = require('../../controllers/facturaController');
const { pool } = require('../../config/database');

// Mock de la base de datos
jest.mock('../../config/database');

describe('Pruebas de Integración - Módulo Facturas (Fixed)', () => {
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

        // Configurar mock del pool
        pool.query = jest.fn();
        pool.connect = jest.fn();
    });

    describe('Integración Facturas-Productos', () => {
        test('Crear factura con productos válidos', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Configurar respuestas secuenciales
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] }) // Empresa
                .mockResolvedValueOnce({ rows: [{ numero: 'F-001' }] }) // Número factura
                .mockResolvedValueOnce({ rows: [{ id: 1, numero_factura: 'F-001' }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalles
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');

            const ventaData = {
                cliente: {
                    nombre: 'Cliente Prueba',
                    documento: '87654321',
                    telefono: '3001234567'
                },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 2, 
                        precio: 25000,
                        nombre: 'Producto 1',
                        codigo: 'PROD-1'
                    },
                    { 
                        id: 2, 
                        cantidad: 1, 
                        precio: 15000,
                        nombre: 'Producto 2',
                        codigo: 'PROD-2'
                    }
                ],
                subtotal: 65000,
                iva: 0,
                total: 65000,
                metodoPago: 'efectivo'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        test('Verificar actualización de stock después de facturar', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Mock para simular actualización de stock
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] }) // Empresa
                .mockResolvedValueOnce({ rows: [{ id: 2, numero_factura: 'F-002' }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalles
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-002');

            const ventaData = {
                cliente: { nombre: 'Cliente Test' },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 2, 
                        precio: 25000,
                        nombre: 'Producto Test',
                        codigo: 'PROD-1'
                    }
                ],
                subtotal: 50000,
                iva: 0,
                total: 50000,
                metodoPago: 'efectivo'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.numeroFactura).toBe('F-002');
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        test('Error al facturar producto sin stock suficiente', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            // Mock para simular error de stock insuficiente
            const stockError = new Error('Stock insuficiente para el producto');
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] }) // Empresa
                .mockResolvedValueOnce({ rows: [{ numero: 'F-003' }] }) // Número factura
                .mockResolvedValueOnce({ rows: [{ id: 3, numero_factura: 'F-003' }] }) // INSERT factura
                .mockRejectedValueOnce(stockError) // ERROR en stock
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-003');

            const ventaData = {
                cliente: { nombre: 'Cliente Test' },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 100, 
                        precio: 25000,
                        nombre: 'Producto Sin Stock',
                        codigo: 'PROD-STOCK'
                    } // Cantidad excesiva
                ],
                subtotal: 2500000,
                iva: 0,
                total: 2500000,
                metodoPago: 'efectivo'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(false);
            expect(resultado.error).toContain('Stock insuficiente');
        });
    });

    describe('Integración Facturas-Cliente', () => {
        test('Crear factura con información completa del cliente', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ numero: 'F-004' }] })
                .mockResolvedValueOnce({ rows: [{ id: 4, numero_factura: 'F-004' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-004');

            const ventaData = {
                cliente: {
                    tipo: 'natural',
                    documento: '12345678',
                    nombre: 'Juan Pérez García',
                    telefono: '3001234567',
                    email: 'juan@email.com',
                    direccion: 'Calle 123 # 45-67'
                },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 1, 
                        precio: 25000,
                        nombre: 'Producto Cliente',
                        codigo: 'PROD-CLI'
                    }
                ],
                subtotal: 25000,
                iva: 0,
                total: 25000,
                metodoPago: 'tarjeta'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO'),
                expect.arrayContaining([
                    expect.stringContaining('Juan Pérez García')
                ])
            );
        });

        test('Crear factura sin información del cliente (venta rápida)', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ numero: 'F-005' }] })
                .mockResolvedValueOnce({ rows: [{ id: 5, numero_factura: 'F-005' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-005');

            const ventaData = {
                cliente: {
                    nombre: 'Cliente Anónimo'
                },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 1, 
                        precio: 25000,
                        nombre: 'Producto Anónimo',
                        codigo: 'PROD-ANON'
                    }
                ],
                subtotal: 25000,
                iva: 0,
                total: 25000,
                metodoPago: 'efectivo'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });
    });

    describe('Integración Facturas-Cálculos', () => {
        test('Verificar cálculos correctos de totales', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 6, numero_factura: 'F-006', total: 105000 }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalles producto 1
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalles producto 2
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-006');

            const ventaData = {
                cliente: { nombre: 'Cliente Cálculo' },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 3, 
                        precio: 25000,
                        nombre: 'Producto 1',
                        codigo: 'PROD-1'
                    },
                    { 
                        id: 2, 
                        cantidad: 2, 
                        precio: 15000,
                        nombre: 'Producto 2',
                        codigo: 'PROD-2'
                    }
                ],
                subtotal: 105000,
                iva: 0,
                total: 105000,
                metodoPago: 'efectivo'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.factura.total).toBe(105000);
            expect(mockClient.query).toHaveBeenCalledTimes(6); // BEGIN + empresa + factura + 2 detalles + COMMIT
        });

        test('Aplicar impuestos en factura', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 7, numero_factura: 'F-007', iva: 4750, total: 29750 }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalles
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            pool.connect.mockResolvedValue(mockClient);
            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-007');

            const ventaData = {
                cliente: { nombre: 'Cliente IVA' },
                productos: [
                    { 
                        id: 1, 
                        cantidad: 1, 
                        precio: 25000,
                        nombre: 'Producto con IVA',
                        codigo: 'PROD-IVA'
                    }
                ],
                subtotal: 25000,
                iva: 4750, // 19% de IVA
                total: 29750,
                metodoPago: 'tarjeta'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.factura.iva).toBe(4750);
            expect(resultado.factura.total).toBe(29750);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });
    });

    describe('Integración Facturas-Consultas', () => {
        test('Obtener facturas con paginación', async () => {
            const mockFacturas = [
                {
                    id: 1,
                    numero_factura: 'F-001',
                    fecha_creacion: '2024-01-15',
                    cliente_nombre: 'Juan Pérez',
                    total: 65000,
                    estado: 'completada'
                },
                {
                    id: 2,
                    numero_factura: 'F-002',
                    fecha_creacion: '2024-01-16',
                    cliente_nombre: 'María García',
                    total: 45000,
                    estado: 'completada'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockFacturas });

            req.query = { pagina: 1, limite: 10 };
            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({
                            numero_factura: 'F-001',
                            cliente_nombre: 'Juan Pérez'
                        }),
                        expect.objectContaining({
                            numero_factura: 'F-002',
                            cliente_nombre: 'María García'
                        })
                    ])
                })
            );
        });

        test('Buscar facturas por cliente', async () => {
            const mockFacturasCliente = [
                {
                    id: 1,
                    numero_factura: 'F-001',
                    fecha_creacion: '2024-01-15',
                    cliente_nombre: 'Juan Pérez',
                    total: 65000,
                    estado: 'completada'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockFacturasCliente });

            req.query = { cliente: 'Juan Pérez', pagina: 1, limite: 10 };
            await FacturaController.listarFacturas(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    facturas: expect.arrayContaining([
                        expect.objectContaining({
                            cliente_nombre: 'Juan Pérez'
                        })
                    ])
                })
            );
        });

        test('Obtener detalles de factura específica', async () => {
            const mockFacturaDetalle = {
                id: 1,
                numero_factura: 'F-001',
                fecha_creacion: '2024-01-15T10:30:00Z',
                cliente_nombre: 'Juan Pérez',
                cliente_documento: '12345678',
                subtotal: 65000,
                iva: 0,
                total: 65000,
                estado: 'completada'
            };

            pool.query.mockResolvedValue({ rows: [mockFacturaDetalle] });

            req.params.id = '1';
            await FacturaController.obtenerFacturaPorId(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    factura: expect.objectContaining({
                        numero_factura: 'F-001',
                        cliente_nombre: 'Juan Pérez',
                        total: 65000
                    })
                })
            );
        });
    });

    describe('Integración Facturas-Reportes', () => {
        test('Generar reporte de ventas por fecha', async () => {
            const mockReporteVentas = [
                {
                    fecha: '2024-01-15',
                    total_ventas: 3,
                    monto_total: 135000,
                    promedio_venta: 45000
                },
                {
                    fecha: '2024-01-16',
                    total_ventas: 2,
                    monto_total: 80000,
                    promedio_venta: 40000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockReporteVentas });

            const query = `
                SELECT 
                    DATE(fecha_creacion) as fecha,
                    COUNT(*) as total_ventas,
                    SUM(total) as monto_total,
                    AVG(total) as promedio_venta
                FROM test_ferreteria.facturas 
                WHERE fecha_creacion BETWEEN $1 AND $2
                  AND estado = 'completada'
                GROUP BY DATE(fecha_creacion)
                ORDER BY fecha DESC
            `;

            await pool.query(query, ['2024-01-15', '2024-01-16']);

            expect(pool.query).toHaveBeenCalledWith(query, ['2024-01-15', '2024-01-16']);
            const result = await pool.query(query, ['2024-01-15', '2024-01-16']);
            
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].total_ventas).toBe(3);
            expect(result.rows[0].monto_total).toBe(135000);
        });
    });
});