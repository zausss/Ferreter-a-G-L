const express = require('express');
const router = express.Router();
const FacturaController = require('../controllers/facturaController');
const { verificarToken } = require('../middleware/auth');
const { validarEntrada, asyncHandler } = require('../middleware/validation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// ===== RUTAS DE FACTURAS =====

// Obtener factura por ID
router.get('/:id', validarEntrada.id, asyncHandler(FacturaController.obtenerFacturaPorId));

// Listar facturas con filtros
router.get('/', validarEntrada.paginacion, asyncHandler(FacturaController.listarFacturas));

// Anular factura
router.put('/:id/anular', validarEntrada.id, asyncHandler(FacturaController.anularFactura));

// Imprimir factura
router.get('/:id/imprimir', validarEntrada.id, asyncHandler(FacturaController.imprimirFactura));

// ===== RUTAS DE EMPRESA =====

// Obtener información de empresa
router.get('/empresa/info', asyncHandler(FacturaController.obtenerEmpresa));

// Actualizar información de empresa
router.put('/empresa/info', validarEntrada.empresa, asyncHandler(FacturaController.actualizarEmpresa));

module.exports = router;
