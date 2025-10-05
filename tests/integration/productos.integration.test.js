const request = require('supertest');
const app = require('../../app');
const IntegrationTestSetup = require('./setup');

describe('Pruebas de Integración - Módulo Productos', () => {
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

    describe('Integración Productos-Categorías', () => {
        test('Obtener productos con información de categorías', async () => {
            const res = await request(app)
                .get('/api/productos')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            
            // Verificar que los productos incluyen información de categoría
            const producto = res.body.data.find(p => p.codigo === 'P001');
            expect(producto).toBeDefined();
            expect(producto.nombre).toBe('Martillo Carpintero');
            expect(producto.categoria).toBe('Herramientas');
            expect(producto.precio).toBe(25000);
            expect(producto.stock).toBe(10);
        });

        test('Filtrar productos por categoría', async () => {
            const res = await request(app)
                .get('/api/productos?categoria=herramientas')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            
            // Todos los productos deben ser de la categoría herramientas
            res.body.data.forEach(producto => {
                expect(producto.categoria.toLowerCase()).toBe('herramientas');
            });
        });

        test('Crear producto con categoría válida', async () => {
            const nuevoProducto = {
                codigo: 'P005',
                nombre: 'Taladro Eléctrico',
                descripcion: 'Taladro eléctrico 500W',
                precioVenta: 120000,
                precioCompra: 80000,
                stock: 3,
                stockMinimo: 2,
                categoria: 1 // ID de categoría Herramientas
            };

            const res = await request(app)
                .post('/api/productos')
                .send(nuevoProducto)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('creado exitosamente');
            expect(res.body.data).toBeDefined();
        });
    });

    describe('Integración Productos-Stock', () => {
        test('Obtener productos con stock bajo', async () => {
            const res = await request(app)
                .get('/api/productos/stock-bajo')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            
            // Verificar que solo incluye productos con stock <= stock_minimo
            res.body.data.forEach(producto => {
                expect(producto.stock).toBeLessThanOrEqual(producto.stockMinimo);
            });
        });

        test('Actualizar stock de producto', async () => {
            // Primero obtener un producto
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);

            const producto = productosRes.body.data[0];
            const nuevoStock = producto.stock + 10;

            // Actualizar el stock
            const updateRes = await request(app)
                .put(`/api/productos/${producto.id}`)
                .send({
                    nombre: producto.nombre,
                    stock: nuevoStock
                })
                .expect(200);

            expect(updateRes.body.success).toBe(true);
            
            // Verificar que el stock se actualizó
            const verificarRes = await request(app)
                .get(`/api/productos/${producto.id}`)
                .expect(200);

            expect(verificarRes.body.data.stock).toBe(nuevoStock);
        });
    });

    describe('Integración Productos-Búsqueda', () => {
        test('Buscar productos por nombre', async () => {
            const res = await request(app)
                .get('/api/productos?busqueda=martillo')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
            
            // Verificar que los resultados contienen el término de búsqueda
            res.body.data.forEach(producto => {
                expect(producto.nombre.toLowerCase()).toContain('martillo');
            });
        });

        test('Buscar productos por código', async () => {
            const res = await request(app)
                .get('/api/productos?busqueda=P001')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].codigo).toBe('P001');
        });

        test('Búsqueda sin resultados', async () => {
            const res = await request(app)
                .get('/api/productos?busqueda=productoInexistente')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(0);
        });
    });

    describe('Integración Productos-Paginación', () => {
        test('Paginación de productos', async () => {
            const res = await request(app)
                .get('/api/productos?pagina=1&limite=2')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.paginaActual).toBe(1);
            expect(res.body.pagination.productosPorPagina).toBe(2);
        });

        test('Navegación entre páginas', async () => {
            // Página 1
            const pagina1 = await request(app)
                .get('/api/productos?pagina=1&limite=2')
                .expect(200);

            // Página 2
            const pagina2 = await request(app)
                .get('/api/productos?pagina=2&limite=2')
                .expect(200);

            expect(pagina1.body.data).not.toEqual(pagina2.body.data);
            expect(pagina1.body.pagination.paginaActual).toBe(1);
            expect(pagina2.body.pagination.paginaActual).toBe(2);
        });
    });

    describe('Integración Productos-Validaciones', () => {
        test('Error al crear producto con código duplicado', async () => {
            const productoDuplicado = {
                codigo: 'P001', // Código que ya existe
                nombre: 'Producto Duplicado',
                precioVenta: 10000,
                precioCompra: 5000,
                stock: 5
            };

            const res = await request(app)
                .post('/api/productos')
                .send(productoDuplicado)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('código');
        });

        test('Error al crear producto sin datos requeridos', async () => {
            const productoIncompleto = {
                nombre: 'Producto Incompleto'
                // Faltan campos requeridos
            };

            const res = await request(app)
                .post('/api/productos')
                .send(productoIncompleto)
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('requeridos');
        });

        test('Error al actualizar producto inexistente', async () => {
            const res = await request(app)
                .put('/api/productos/99999')
                .send({
                    nombre: 'Producto Actualizado',
                    precioVenta: 15000
                })
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('no encontrado');
        });
    });

    describe('Integración Productos-Estadísticas', () => {
        test('Obtener estadísticas de productos', async () => {
            const res = await request(app)
                .get('/api/productos/estadisticas')
                .expect(200);

            expect(res.body.exito).toBe(true);
            expect(res.body.estadisticas).toBeDefined();
            expect(res.body.estadisticas.total_productos).toBeGreaterThan(0);
            expect(res.body.estadisticas.productos_con_stock).toBeDefined();
            expect(res.body.estadisticas.productos_stock_bajo).toBeDefined();
            expect(res.body.estadisticas.valor_total_inventario).toBeDefined();
        });

        test('Consistencia de estadísticas con datos reales', async () => {
            // Obtener productos
            const productosRes = await request(app)
                .get('/api/productos')
                .expect(200);

            // Obtener estadísticas
            const estadisticasRes = await request(app)
                .get('/api/productos/estadisticas')
                .expect(200);

            const totalProductos = productosRes.body.data.length;
            const estadisticas = estadisticasRes.body.estadisticas;

            expect(estadisticas.total_productos).toBe(totalProductos);
        });
    });
});