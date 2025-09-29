const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/ventaController');
const { verificarToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Rutas para productos (búsqueda para ventas)
router.get('/productos/buscar', VentaController.buscarProductos);

// Rutas para clientes
router.get('/clientes/buscar/:documento', VentaController.buscarCliente);

// Rutas principales de ventas
router.post('/', VentaController.crearVenta);
router.get('/', VentaController.obtenerVentas);
router.get('/:id', VentaController.obtenerVentaPorId);

// Rutas para reportes
router.get('/reportes/resumen', VentaController.reporteVentas);

module.exports = router;
