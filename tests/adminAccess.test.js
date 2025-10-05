const request = require('supertest');
const app = require('../app');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Mock del modelo Usuario
jest.mock('../models/Usuario');

describe('Pruebas de acceso a funciones de administrador', () => {
  let tokenCajero;

  beforeAll(async () => {
    // Mock de usuario cajero
    const mockCajero = {
      id: 2,
      empleado_id: 2,
      nombre_usuario: 'Marcela',
      nombre_completo: 'Marcela Cajera',
      correo_electronico: 'marcela@test.com',
      password_hash: '$2b$10$hashedpassword',
      rol_sistema: 'cajero',
      nombre_cargo: 'Cajero',
      intentos_fallidos: 0,
      bloqueado_hasta: null
    };

    Usuario.buscarParaLogin.mockResolvedValue(mockCajero);
    Usuario.estaBloquado.mockReturnValue(false);
    Usuario.tieneAccesoAlSistema.mockReturnValue(true);
    Usuario.verificarPassword.mockResolvedValue(true);
    Usuario.actualizarUltimoAcceso.mockResolvedValue();

    // Crear token para cajero
    const tokenPayload = {
      id: mockCajero.id,
      empleado_id: mockCajero.empleado_id,
      nombre_usuario: mockCajero.nombre_usuario,
      nombre_completo: mockCajero.nombre_completo,
      email: mockCajero.correo_electronico,
      rol: mockCajero.rol_sistema,
      cargo: mockCajero.nombre_cargo
    };

    tokenCajero = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: '1h' });
  });

  test('Acceso denegado a ruta solo admin con usuario cajero', async () => {
    // Mock para verificación de token
    Usuario.buscarPorId.mockResolvedValue({
      id: 2,
      rol_sistema: 'cajero'
    });

    const res = await request(app)
      .post('/api/categorias')
      .set('Cookie', [`token=${tokenCajero}`])
      .set('Accept', 'application/json')
      .send({ nombre: 'NuevaCategoria' });
    
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('mensaje');
  });
});
