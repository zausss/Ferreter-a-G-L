const express = require('express');
const router = express.Router();
const FacturaController = require('../controllers/facturaController');
const { verificarToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// ===== RUTAS DE FACTURAS =====

// Obtener factura por ID
router.get('/:id', FacturaController.obtenerFacturaPorId);

// Listar facturas con filtros
router.get('/', FacturaController.listarFacturas);

// Anular factura
router.put('/:id/anular', FacturaController.anularFactura);

// ===== RUTAS DE EMPRESA =====

// Obtener información de empresa
router.get('/empresa/info', FacturaController.obtenerEmpresa);

// Actualizar información de empresa
router.put('/empresa/info', FacturaController.actualizarEmpresa);

module.exports = router;
