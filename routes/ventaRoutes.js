const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/ventaController');
const { verificarToken } = require('../middleware/auth');
const { validarEntrada } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Rutas para productos (búsqueda para ventas)
router.get('/productos/buscar', asyncHandler(VentaController.buscarProductos));

// Rutas para clientes
router.get('/clientes/buscar/:documento', asyncHandler(VentaController.buscarCliente));

// Rutas principales de ventas
router.post('/', validarEntrada.venta, asyncHandler(VentaController.crearVenta));
router.get('/', validarEntrada.paginacion, asyncHandler(VentaController.obtenerVentas));
router.get('/:id', validarEntrada.id, asyncHandler(VentaController.obtenerVentaPorId));

// Rutas para reportes
router.get('/reportes/resumen', VentaController.reporteVentas);

module.exports = router;
