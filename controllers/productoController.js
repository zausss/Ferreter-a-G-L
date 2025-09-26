const Producto = require('../models/productoModel');

class ProductoController {
    
    // Obtener todos los productos con filtros
    static async obtenerProductos(req, res) {
        try {
            const { busqueda, categoria, estado, pagina = 1, limite = 10 } = req.query;
            
            let productos = await Producto.obtenerTodos();
            
            // Aplicar filtros
            if (busqueda) {
                const busquedaLower = busqueda.toLowerCase();
                productos = productos.filter(producto => 
                    producto.nombre.toLowerCase().includes(busquedaLower) ||
                    producto.codigo_producto.toLowerCase().includes(busquedaLower)
                );
            }
            
            if (categoria) {
                productos = productos.filter(producto => 
                    producto.nombre_categoria && 
                    producto.nombre_categoria.toLowerCase() === categoria.toLowerCase()
                );
            }
            
            if (estado) {
                if (estado === 'bajo-stock') {
                    productos = productos.filter(producto => 
                        producto.stock_actual <= producto.stock_minimo
                    );
                } else if (estado === 'activo') {
                    productos = productos.filter(producto => 
                        producto.activo && producto.stock_actual > producto.stock_minimo
                    );
                } else if (estado === 'inactivo') {
                    productos = productos.filter(producto => !producto.activo);
                }
            }
            
            // Paginación
            const inicio = (parseInt(pagina) - 1) * parseInt(limite);
            const fin = inicio + parseInt(limite);
            const productosPaginados = productos.slice(inicio, fin);
            
            // Transformar datos para el frontend
            const productosTransformados = productosPaginados.map(producto => ({
                id: producto.id,
                codigo: producto.codigo_producto,
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                categoria: producto.nombre_categoria || 'Sin categoría',
                precio: parseFloat(producto.precio_venta),
                precioCompra: parseFloat(producto.precio_compra || 0),
                stock: producto.stock_actual,
                stockMinimo: producto.stock_minimo,
                ubicacion: producto.ubicacion_bodega,
                peso: producto.peso ? parseFloat(producto.peso) : null,
                dimensiones: producto.dimensiones,
                estado: producto.activo ? 
                    (producto.stock_actual <= producto.stock_minimo ? 'bajo-stock' : 'activo') : 
                    'inactivo'
            }));
            
            res.json({
                success: true,
                data: productosTransformados,
                pagination: {
                    paginaActual: parseInt(pagina),
                    totalProductos: productos.length,
                    totalPaginas: Math.ceil(productos.length / parseInt(limite)),
                    productosPorPagina: parseInt(limite)
                }
            });
            
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
        // Crear nuevo producto
    static async crearProducto(req, res) {
        try {
            const { 
                codigo, nombre, descripcion, categoria, 
                precioVenta, precioCompra, stock, stockMinimo,
                ubicacionBodega, peso, dimensiones
            } = req.body;
            
            // Validaciones
            if (!codigo || !nombre || !precioVenta || !precioCompra || stock === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos: código, nombre, precio de venta, precio de compra y stock'
                });
            }
            
            // Verificar si el código ya existe
            const productos = await Producto.obtenerTodos();
            const codigoExiste = productos.some(p => 
                p.codigo_producto.toLowerCase() === codigo.toLowerCase()
            );
            
            if (codigoExiste) {
                return res.status(400).json({
                    success: false,
                    message: 'El código del producto ya existe'
                });
            }
            
            // Obtener ID de categoría
            let categoria_id = 1;
            if (categoria) {
                const categoriasMap = {
                    'herramientas manuales': 1,
                    'herramientas eléctricas': 2,
                    'pintura': 5,
                    'ferreteria': 6
                };
                categoria_id = categoriasMap[categoria.toLowerCase()] || 1;
            }
            
            // Calcular margen de ganancia
            const margenGanancia = precioCompra > 0 ? 
                ((precioVenta - precioCompra) / precioCompra) * 100 : 0;
            
            const datosProducto = {
                codigo_producto: codigo,
                nombre: nombre,
                descripcion: descripcion || '',
                precio_venta: parseFloat(precioVenta),
                precio_compra: parseFloat(precioCompra),
                margen_ganancia: margenGanancia,
                stock_actual: parseInt(stock),
                stock_minimo: parseInt(stockMinimo) || 5,
                ubicacion_bodega: ubicacionBodega || null,
                peso: peso ? parseFloat(peso) : null,
                dimensiones: dimensiones || null,
                categoria_id: categoria_id
            };
            
            const nuevoProducto = await Producto.crear(datosProducto);
            
            res.status(201).json({
                success: true,
                message: 'Producto creado exitosamente',
                data: nuevoProducto
            });
            
        } catch (error) {
            console.error('Error creando producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    // Actualizar producto
    static async actualizarProducto(req, res) {
        try {
            const { id } = req.params;
            const { 
                nombre, descripcion, categoria, 
                precioVenta, precioCompra, stock, stockMinimo,
                ubicacionBodega, peso, dimensiones
            } = req.body;
            
            // Validaciones
            if (!nombre || !precioVenta || !precioCompra || stock === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos: nombre, precio de venta, precio de compra y stock'
                });
            }
            
            // Obtener ID de categoría
            let categoria_id = 1;
            if (categoria) {
                const categoriasMap = {
                    'herramientas manuales': 1,
                    'herramientas eléctricas': 2,
                    'pintura': 5,
                    'ferreteria': 6
                };
                categoria_id = categoriasMap[categoria.toLowerCase()] || 1;
            }
            
            // Calcular margen de ganancia
            const margenGanancia = precioCompra > 0 ? 
                ((precioVenta - precioCompra) / precioCompra) * 100 : 0;
            
            const datosProducto = {
                nombre: nombre,
                descripcion: descripcion || '',
                precio_venta: parseFloat(precioVenta),
                precio_compra: parseFloat(precioCompra),
                margen_ganancia: margenGanancia,
                stock_actual: parseInt(stock),
                stock_minimo: parseInt(stockMinimo) || 5,
                ubicacion_bodega: ubicacionBodega || null,
                peso: peso ? parseFloat(peso) : null,
                dimensiones: dimensiones || null,
                categoria_id: categoria_id
            };
            
            const productoActualizado = await Producto.actualizar(id, datosProducto);
            
            if (!productoActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Producto actualizado exitosamente',
                data: productoActualizado
            });
            
        } catch (error) {
            console.error('Error actualizando producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    // Eliminar producto
    static async eliminarProducto(req, res) {
        try {
            const { id } = req.params;
            
            const productoEliminado = await Producto.eliminar(id);
            
            if (!productoEliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Producto eliminado exitosamente',
                data: productoEliminado
            });
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    // Obtener producto por ID
    static async obtenerProductoPorId(req, res) {
        try {
            const { id } = req.params;
            
            const producto = await Producto.buscarPorId(id);
            
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            // Transformar datos para el frontend
            const productoTransformado = {
                id: producto.id,
                codigo: producto.codigo_producto,
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                categoria: producto.nombre_categoria || 'Sin categoría',
                precio: parseFloat(producto.precio_venta),
                precioCompra: parseFloat(producto.precio_compra || 0),
                stock: producto.stock_actual,
                stockMinimo: producto.stock_minimo,
                ubicacion: producto.ubicacion_bodega,
                peso: producto.peso ? parseFloat(producto.peso) : null,
                dimensiones: producto.dimensiones,
                estado: producto.activo ? 
                    (producto.stock_actual <= producto.stock_minimo ? 'bajo-stock' : 'activo') : 
                    'inactivo'
            };
            
            res.json({
                success: true,
                data: productoTransformado
            });
            
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    // Obtener productos con stock bajo
    static async obtenerStockBajo(req, res) {
        try {
            const productos = await Producto.stockBajo();
            
            const productosTransformados = productos.map(producto => ({
                id: producto.id,
                codigo: producto.codigo_producto,
                nombre: producto.nombre,
                categoria: producto.nombre_categoria || 'Sin categoría',
                stock: producto.stock_actual,
                stockMinimo: producto.stock_minimo
            }));
            
            res.json({
                success: true,
                data: productosTransformados
            });
            
        } catch (error) {
            console.error('Error obteniendo productos con stock bajo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Obtener estadísticas de productos para el dashboard
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await Producto.obtenerEstadisticas();
            
            res.json({
                exito: true,
                estadisticas: {
                    total_productos: parseInt(estadisticas.total_productos) || 0,
                    productos_con_stock: parseInt(estadisticas.productos_con_stock) || 0,
                    productos_stock_bajo: parseInt(estadisticas.productos_stock_bajo) || 0,
                    valor_total_inventario: parseFloat(estadisticas.valor_total_inventario) || 0
                }
            });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas de productos:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ProductoController;
