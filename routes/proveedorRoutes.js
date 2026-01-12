const express = require('express');
const router = express.Router();
const ProveedorController = require('../controllers/proveedorController');
const { verificarToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Rutas de proveedores
router.get('/', ProveedorController.listarProveedores);
router.get('/:id', ProveedorController.obtenerProveedor);
router.post('/', ProveedorController.crearProveedor);
router.put('/:id', ProveedorController.actualizarProveedor);
router.delete('/:id', ProveedorController.eliminarProveedor);
router.patch('/:id/estado', ProveedorController.cambiarEstado);

module.exports = router;