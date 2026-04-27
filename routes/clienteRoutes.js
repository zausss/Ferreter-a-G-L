const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { verificarToken, soloAdministradores } = require('../middleware/auth');
const { validarCliente, validarActualizacionCliente } = require('../middleware/validation');

// 📋 RUTAS DE CONSULTA (requieren autenticación)

// Listar todos los clientes con filtros y paginación
router.get('/', verificarToken, ClienteController.listarClientes);

// Buscar clientes (para autocompletar)
router.get('/buscar', verificarToken, ClienteController.buscarClientes);

// Estadísticas para dashboard
router.get('/estadisticas', verificarToken, ClienteController.obtenerEstadisticas);

// Obtener cliente específico por ID
router.get('/:id', verificarToken, ClienteController.obtenerCliente);

// ➕ RUTAS DE CREACIÓN (requieren autenticación)

// Crear nuevo cliente
router.post('/', verificarToken, validarCliente, ClienteController.crearCliente);

// 📝 RUTAS DE ACTUALIZACIÓN (requieren autenticación)

// Actualizar cliente completo
router.put('/:id', verificarToken, validarActualizacionCliente, ClienteController.actualizarCliente);

// Cambiar solo el estado del cliente
router.patch('/:id/estado', verificarToken, ClienteController.cambiarEstadoCliente);

// 🗑️ RUTAS DE ELIMINACIÓN (requieren permisos de administrador)

// Eliminar cliente (soft delete)
router.delete('/:id', verificarToken, soloAdministradores, ClienteController.eliminarCliente);

module.exports = router;