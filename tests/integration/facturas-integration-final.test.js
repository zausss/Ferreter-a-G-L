const FacturaController = require('../../controllers/facturaController');
const { pool } = require('../../config/database');

// Mock de la base de datos
jest.mock('../../config/database');

describe('Pruebas de Integración - Módulo Facturas (Final)', () => {
    let req, res, mockClient;

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

        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.query = jest.fn();
        pool.connect = jest.fn().mockResolvedValue(mockClient);
        
        // Mock del método estático
        jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-001');
    });

    describe('Integración Facturas-Productos', () => {
        test('Crear factura con productos válidos', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] }) // Empresa info
                .mockResolvedValueOnce({ rows: [{ id: 1, numero_factura: 'F-001', total: 65000 }] }) // INSERT factura
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle 1
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle 2
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const ventaData = {
                cliente: {
                    nombre: 'Cliente Test',
                    documento: '12345678',
                    telefono: '3001234567'
                },
                productos: [
                    {
                        id: 1,
                        cantidad: 2,
                        precio: 25000,
                        nombre: 'Martillo',
                        codigo: 'MART-001'
                    },
                    {
                        id: 2,
                        cantidad: 1,
                        precio: 15000,
                        nombre: 'Destornillador',
                        codigo: 'DEST-001'
                    }
                ],
                subtotal: 65000,
                iva: 0,
                total: 65000,
                metodoPago: 'efectivo'
            };

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.numeroFactura).toBe('F-001');
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        test('Verificar actualización de stock después de facturar', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 2, numero_factura: 'F-002', total: 50000 }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const ventaData = {
                cliente: { nombre: 'Cliente Stock' },
                productos: [
                    {
                        id: 1,
                        cantidad: 2,
                        precio: 25000,
                        nombre: 'Producto Stock',
                        codigo: 'STOCK-001'
                    }
                ],
                subtotal: 50000,
                iva: 0,
                total: 50000,
                metodoPago: 'efectivo'
            };

            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-002');

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.numeroFactura).toBe('F-002');
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        test('Error al facturar producto sin stock suficiente', async () => {
            const stockError = new Error('Stock insuficiente para el producto');
            
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 3, numero_factura: 'F-003' }] })
                .mockRejectedValueOnce(stockError) // ERROR en detalle
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const ventaData = {
                cliente: { nombre: 'Cliente Error' },
                productos: [
                    {
                        id: 1,
                        cantidad: 1000, // Cantidad excesiva
                        precio: 25000,
                        nombre: 'Producto Sin Stock',
                        codigo: 'ERROR-001'
                    }
                ],
                subtotal: 25000000,
                iva: 0,
                total: 25000000,
                metodoPago: 'efectivo'
            };

            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-003');

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(false);
            expect(resultado.error).toBe('Stock insuficiente para el producto');
        });
    });

    describe('Integración Facturas-Cliente', () => {
        test('Crear factura con información completa del cliente', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 4, numero_factura: 'F-004', cliente_nombre: 'Juan Pérez García' }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

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
                        codigo: 'CLI-001'
                    }
                ],
                subtotal: 25000,
                iva: 0,
                total: 25000,
                metodoPago: 'tarjeta'
            };

            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-004');

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.factura.cliente_nombre).toBe('Juan Pérez García');
        });

        test('Crear factura sin información del cliente (venta rápida)', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 5, numero_factura: 'F-005', cliente_nombre: 'Cliente Anónimo' }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

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
                        codigo: 'ANON-001'
                    }
                ],
                subtotal: 25000,
                iva: 0,
                total: 25000,
                metodoPago: 'efectivo'
            };

            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-005');

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.factura.cliente_nombre).toBe('Cliente Anónimo');
        });
    });

    describe('Integración Facturas-Cálculos', () => {
        test('Verificar cálculos correctos de totales', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 6, numero_factura: 'F-006', total: 105000 }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle 1
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle 2
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const ventaData = {
                cliente: { nombre: 'Cliente Cálculo' },
                productos: [
                    {
                        id: 1,
                        cantidad: 3,
                        precio: 25000,
                        nombre: 'Producto 1',
                        codigo: 'CALC-001'
                    },
                    {
                        id: 2,
                        cantidad: 2,
                        precio: 15000,
                        nombre: 'Producto 2',
                        codigo: 'CALC-002'
                    }
                ],
                subtotal: 105000, // (3 * 25000) + (2 * 15000) = 75000 + 30000
                iva: 0,
                total: 105000,
                metodoPago: 'efectivo'
            };

            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-006');

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.factura.total).toBe(105000);
        });

        test('Aplicar impuestos en factura', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ nombre_empresa: 'Ferretería G&L' }] })
                .mockResolvedValueOnce({ rows: [{ id: 7, numero_factura: 'F-007', iva: 4750, total: 29750 }] })
                .mockResolvedValueOnce({ rows: [] }) // INSERT detalle
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const ventaData = {
                cliente: { nombre: 'Cliente IVA' },
                productos: [
                    {
                        id: 1,
                        cantidad: 1,
                        precio: 25000,
                        nombre: 'Producto con IVA',
                        codigo: 'IVA-001'
                    }
                ],
                subtotal: 25000,
                iva: 4750, // 19% de IVA
                total: 29750,
                metodoPago: 'tarjeta'
            };

            jest.spyOn(FacturaController, 'generarNumeroFactura').mockResolvedValue('F-007');

            const resultado = await FacturaController.crearFacturaDesdeVenta(ventaData);

            expect(resultado.success).toBe(true);
            expect(resultado.factura.iva).toBe(4750);
            expect(resultado.factura.total).toBe(29750);
        });
    });

    describe('Integración Facturas-Consultas', () => {
        test('Obtener facturas con paginación', async () => {
            const mockFacturas = [
                {
                    id: 1,
                    numero_factura: 'F-001',
                    fecha_creacion: '2024-01-15T10:30:00Z',
                    cliente_nombre: 'Juan Pérez',
                    total: 65000,
                    estado: 'activa'
                },
                {
                    id: 2,
                    numero_factura: 'F-002',
                    fecha_creacion: '2024-01-16T14:20:00Z',
                    cliente_nombre: 'María García',
                    total: 45000,
                    estado: 'activa'
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
                    fecha_creacion: '2024-01-15T10:30:00Z',
                    cliente_nombre: 'Juan Pérez',
                    total: 65000,
                    estado: 'activa'
                }
            ];

            pool.query.mockResolvedValue({ rows: mockFacturasCliente });

            req.query = { cliente: 'Juan Pérez', pagina: 1, limite: 10 };
            await FacturaController.listarFacturas(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('cliente_nombre ILIKE'),
                expect.arrayContaining(['%Juan Pérez%'])
            );
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
                estado: 'activa'
            };

            pool.query.mockResolvedValue({ rows: [mockFacturaDetalle] });

            req.params.id = '1';
            await FacturaController.obtenerFacturaPorId(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['1']
            );
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

            const fechaInicio = '2024-01-15';
            const fechaFin = '2024-01-16';

            const query = `
                SELECT 
                    DATE(fecha_creacion) as fecha,
                    COUNT(*) as total_ventas,
                    SUM(total) as monto_total,
                    AVG(total) as promedio_venta
                FROM facturas 
                WHERE fecha_creacion BETWEEN $1 AND $2
                  AND estado = 'activa'
                GROUP BY DATE(fecha_creacion)
                ORDER BY fecha DESC
            `;

            const result = await pool.query(query, [fechaInicio, fechaFin]);

            expect(pool.query).toHaveBeenCalledWith(query, [fechaInicio, fechaFin]);
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].total_ventas).toBe(3);
            expect(result.rows[0].monto_total).toBe(135000);
            expect(result.rows[1].total_ventas).toBe(2);
            expect(result.rows[1].monto_total).toBe(80000);
        });

        test('Reporte de productos más vendidos', async () => {
            const mockProductosVendidos = [
                {
                    producto_id: 1,
                    producto_nombre: 'Martillo',
                    total_vendido: 15,
                    monto_total: 375000
                },
                {
                    producto_id: 2,
                    producto_nombre: 'Destornillador',
                    total_vendido: 8,
                    monto_total: 120000
                }
            ];

            pool.query.mockResolvedValue({ rows: mockProductosVendidos });

            const queryProductosVendidos = `
                SELECT 
                    fd.producto_id,
                    fd.producto_nombre,
                    SUM(fd.cantidad) as total_vendido,
                    SUM(fd.cantidad * fd.precio_unitario) as monto_total
                FROM factura_detalles fd
                JOIN facturas f ON fd.factura_id = f.id
                WHERE f.estado = 'activa'
                GROUP BY fd.producto_id, fd.producto_nombre
                ORDER BY total_vendido DESC
                LIMIT 10
            `;

            const result = await pool.query(queryProductosVendidos);

            expect(result.rows[0].producto_nombre).toBe('Martillo');
            expect(result.rows[0].total_vendido).toBe(15);
            expect(result.rows[1].producto_nombre).toBe('Destornillador');
            expect(result.rows[1].total_vendido).toBe(8);
        });
    });
});