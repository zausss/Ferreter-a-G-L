const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/productoController');
const { verificarToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Rutas para productos
router.get('/', ProductoController.obtenerProductos);
router.get('/stock-bajo', ProductoController.obtenerStockBajo);
router.get('/:id', ProductoController.obtenerProductoPorId);
router.post('/', ProductoController.crearProducto);
router.put('/:id', ProductoController.actualizarProducto);
router.delete('/:id', ProductoController.eliminarProducto);

module.exports = router;
