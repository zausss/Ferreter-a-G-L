const request = require('supertest');
const app = require('../../app');
const IntegrationTestSetup = require('./setup');

describe('Pruebas de Integración - Módulo Facturas', () => {
    beforeAll(async () => {
        await IntegrationTestSetup.setupDatabase();
    });

    afterAll(async () => {
        await IntegrationTestSetup.teardownDatabase();
    });

    beforeEach(async () => {
        await IntegrationTestSetup.cleanupDatabase();
        await IntegrationTestSetup.insertTestData();
    });

    describe('Integración Facturas-Productos', () => {
        test('Crear factura con productos válidos', async () => {
            // Obtener productos disponibles
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);

            const productos = productosRes.body.data;
            const producto1 = productos.find(p => p.codigo === 'P001');
            const producto2 = productos.find(p => p.codigo === 'P002');

            const nuevaFactura = {
                cliente: {
                    nombre: 'Cliente Prueba',
                    cedula: '87654321',
                    telefono: '3001234567'
                },
                productos: [
                    {
                        producto_id: producto1.id,
                        cantidad: 2,
                        precio_unitario: producto1.precio
                    },
                    {
                        producto_id: producto2.id,
                        cantidad: 5,
                        precio_unitario: producto2.precio
                    }
                ],
                metodo_pago: 'Efectivo',
                observaciones: 'Venta de prueba'
            };

            const res = await request(app)
                .post('/api/facturas')
                .send(nuevaFactura)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.factura).toBeDefined();
            expect(res.body.factura.numero_factura).toBeDefined();
            expect(res.body.factura.total).toBe(
                (producto1.precio * 2) + (producto2.precio * 5)
            );
        });

        test('Verificar actualización de stock después de facturar', async () => {
            // Obtener stock inicial
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);

            const producto = productosRes.body.data.find(p => p.codigo === 'P001');
            const stockInicial = producto.stock;
            const cantidadVendida = 1;

            // Crear factura
            const nuevaFactura = {
                cliente: {
                    nombre: 'Cliente Stock',
                    cedula: '11111111'
                },
                productos: [
                    {
                        producto_id: producto.id,
                        cantidad: cantidadVendida,
                        precio_unitario: producto.precio
                    }
                ],
                metodo_pago: 'Efectivo'
            };

            await request(app)
                .post('/api/facturas')
                .send(nuevaFactura)
                .expect(201);

            // Verificar stock actualizado
            const stockRes = await request(app)
                .get(`/api/productos/${producto.id}`)
                .expect(200);

            expect(stockRes.body.data.stock).toBe(stockInicial - cantidadVendida);
        });

        test('Error al facturar producto sin stock suficiente', async () => {
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);

            const producto = productosRes.body.data.find(p => p.stock > 0);
            const cantidadExcesiva = producto.stock + 10;

            const facturaInvalida = {
                cliente: {
                    nombre: 'Cliente Sin Stock',
                    cedula: '22222222'
                },
                productos: [
                    {
                        producto_id: producto.id,
                        cantidad: cantidadExcesiva,
                        precio_unitario: producto.precio
                    }
                ],
                metodo_pago: 'Efectivo'
            };

            const res = await request(app)
                .post('/api/facturas')
                .send(facturaInvalida)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('stock');
        });
    });

    describe('Integración Facturas-Cliente', () => {
        test('Crear factura con información completa del cliente', async () => {
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            const facturaCompleta = {
                cliente: {
                    nombre: 'Juan Pérez González',
                    cedula: '12345678901',
                    telefono: '3001234567',
                    email: 'juan@email.com'
                },
                productos: [
                    {
                        producto_id: producto.id,
                        cantidad: 1,
                        precio_unitario: producto.precio
                    }
                ],
                metodo_pago: 'Tarjeta',
                observaciones: 'Cliente frecuente'
            };

            const res = await request(app)
                .post('/api/facturas')
                .send(facturaCompleta)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.factura.cliente_nombre).toBe('Juan Pérez González');
            expect(res.body.factura.cliente_cedula).toBe('12345678901');
        });

        test('Crear factura sin información del cliente (venta rápida)', async () => {
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            const ventaRapida = {
                productos: [
                    {
                        producto_id: producto.id,
                        cantidad: 1,
                        precio_unitario: producto.precio
                    }
                ],
                metodo_pago: 'Efectivo'
            };

            const res = await request(app)
                .post('/api/facturas')
                .send(ventaRapida)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.factura.cliente_nombre).toBeNull();
        });
    });

    describe('Integración Facturas-Cálculos', () => {
        test('Verificar cálculos correctos de totales', async () => {
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);

            const productos = productosRes.body.data.slice(0, 3);
            const facturaCalculos = {
                cliente: {
                    nombre: 'Cliente Cálculos',
                    cedula: '33333333'
                },
                productos: productos.map((producto, index) => ({
                    producto_id: producto.id,
                    cantidad: index + 1,
                    precio_unitario: producto.precio
                })),
                descuento: 5000,
                metodo_pago: 'Efectivo'
            };

            const res = await request(app)
                .post('/api/facturas')
                .send(facturaCalculos)
                .expect(201);

            // Calcular total esperado
            let subtotalEsperado = 0;
            productos.forEach((producto, index) => {
                subtotalEsperado += producto.precio * (index + 1);
            });

            const totalEsperado = subtotalEsperado - 5000; // Descuento

            expect(res.body.factura.subtotal).toBe(subtotalEsperado);
            expect(res.body.factura.descuento).toBe(5000);
            expect(res.body.factura.total).toBe(totalEsperado);
        });

        test('Aplicar impuestos en factura', async () => {
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            const facturaConImpuestos = {
                cliente: {
                    nombre: 'Cliente Impuestos',
                    cedula: '44444444'
                },
                productos: [
                    {
                        producto_id: producto.id,
                        cantidad: 1,
                        precio_unitario: producto.precio
                    }
                ],
                aplicar_impuestos: true,
                porcentaje_impuesto: 19,
                metodo_pago: 'Tarjeta'
            };

            const res = await request(app)
                .post('/api/facturas')
                .send(facturaConImpuestos)
                .expect(201);

            const subtotal = producto.precio;
            const impuestosEsperados = Math.round(subtotal * 0.19);
            const totalEsperado = subtotal + impuestosEsperados;

            expect(res.body.factura.subtotal).toBe(subtotal);
            expect(res.body.factura.impuestos).toBe(impuestosEsperados);
            expect(res.body.factura.total).toBe(totalEsperado);
        });
    });

    describe('Integración Facturas-Consultas', () => {
        test('Obtener facturas con paginación', async () => {
            // Crear varias facturas primero
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            // Crear 3 facturas
            for (let i = 1; i <= 3; i++) {
                await request(app)
                    .post('/api/facturas')
                    .send({
                        cliente: {
                            nombre: `Cliente ${i}`,
                            cedula: `1111111${i}`
                        },
                        productos: [
                            {
                                producto_id: producto.id,
                                cantidad: 1,
                                precio_unitario: producto.precio
                            }
                        ],
                        metodo_pago: 'Efectivo'
                    })
                    .expect(201);
            }

            // Obtener facturas con paginación
            const res = await request(app)
                .get('/api/facturas?pagina=1&limite=2')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.facturas).toBeInstanceOf(Array);
            expect(res.body.facturas.length).toBeLessThanOrEqual(2);
        });

        test('Buscar facturas por cliente', async () => {
            // Crear factura con cliente específico
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            await request(app)
                .post('/api/facturas')
                .send({
                    cliente: {
                        nombre: 'María García Específica',
                        cedula: '55555555'
                    },
                    productos: [
                        {
                            producto_id: producto.id,
                            cantidad: 1,
                            precio_unitario: producto.precio
                        }
                    ],
                    metodo_pago: 'Efectivo'
                })
                .expect(201);

            // Buscar por nombre del cliente
            const res = await request(app)
                .get('/api/facturas?busqueda=María García')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.facturas.length).toBeGreaterThan(0);
            expect(res.body.facturas[0].cliente_nombre).toContain('María García');
        });

        test('Obtener detalles de factura específica', async () => {
            // Crear factura
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            const facturaRes = await request(app)
                .post('/api/facturas')
                .send({
                    cliente: {
                        nombre: 'Cliente Detalle',
                        cedula: '66666666'
                    },
                    productos: [
                        {
                            producto_id: producto.id,
                            cantidad: 2,
                            precio_unitario: producto.precio
                        }
                    ],
                    metodo_pago: 'Efectivo'
                })
                .expect(201);

            const facturaId = facturaRes.body.factura.id;

            // Obtener detalles
            const detalleRes = await request(app)
                .get(`/api/facturas/${facturaId}`)
                .expect(200);

            expect(detalleRes.body.success).toBe(true);
            expect(detalleRes.body.factura).toBeDefined();
            expect(detalleRes.body.factura.detalles).toBeInstanceOf(Array);
            expect(detalleRes.body.factura.detalles.length).toBe(1);
            expect(detalleRes.body.factura.detalles[0].cantidad).toBe(2);
        });
    });

    describe('Integración Facturas-Reportes', () => {
        test('Generar reporte de ventas por fecha', async () => {
            // Crear algunas facturas
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);
            const producto = productosRes.body.data[0];

            await request(app)
                .post('/api/facturas')
                .send({
                    productos: [
                        {
                            producto_id: producto.id,
                            cantidad: 1,
                            precio_unitario: producto.precio
                        }
                    ],
                    metodo_pago: 'Efectivo'
                })
                .expect(201);

            const fechaHoy = new Date().toISOString().split('T')[0];

            const res = await request(app)
                .get(`/api/facturas/reporte/ventas?fecha_inicio=${fechaHoy}&fecha_fin=${fechaHoy}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.reporte).toBeDefined();
            expect(res.body.reporte.total_ventas).toBeGreaterThan(0);
            expect(res.body.reporte.cantidad_facturas).toBeGreaterThan(0);
        });
    });
});