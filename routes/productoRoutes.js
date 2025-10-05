const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/productoController');
const { verificarToken } = require('../middleware/auth');
const { validarEntrada } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Rutas para productos
router.get('/estadisticas', asyncHandler(ProductoController.obtenerEstadisticas));
router.get('/', validarEntrada.paginacion, asyncHandler(ProductoController.obtenerProductos));
router.get('/stock-bajo', asyncHandler(ProductoController.obtenerStockBajo));
router.get('/:id', validarEntrada.id, asyncHandler(ProductoController.obtenerProductoPorId));
router.post('/', validarEntrada.producto, asyncHandler(ProductoController.crearProducto));
router.put('/:id', validarEntrada.id, validarEntrada.producto, asyncHandler(ProductoController.actualizarProducto));
router.delete('/:id', validarEntrada.id, asyncHandler(ProductoController.eliminarProducto));

module.exports = router;
