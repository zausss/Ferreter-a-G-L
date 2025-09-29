const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/ventaController');
const { verificarToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Rutas para productos (búsqueda para ventas)
router.get('/ventas/productos/buscar', VentaController.buscarProductos);

// Rutas para clientes
router.get('/ventas/clientes/buscar/:documento', VentaController.buscarCliente);

// Rutas principales de ventas
router.post('/ventas', VentaController.crearVenta);
router.get('/ventas', VentaController.obtenerVentas);
router.get('/ventas/:id', VentaController.obtenerVentaPorId);

// Rutas para reportes
router.get('/ventas/reportes/resumen', VentaController.reporteVentas);

module.exports = router;
