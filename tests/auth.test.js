const request = require('supertest');
const app = require('../app');
const Usuario = require('../models/Usuario');

// Mock del modelo Usuario
jest.mock('../models/Usuario');

describe('Pruebas de login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Login exitoso con usuario y contraseña válidos', async () => {
    // Mock de usuario válido
    const mockUsuario = {
      id: 1,
      empleado_id: 1,
      nombre_usuario: 'Daniel',
      nombre_completo: 'Daniel Admin',
      correo_electronico: 'daniel@test.com',
      password_hash: '$2b$10$hashedpassword',
      rol_sistema: 'administrador',
      nombre_cargo: 'Administrador',
      intentos_fallidos: 0,
      bloqueado_hasta: null
    };

    Usuario.buscarParaLogin.mockResolvedValue(mockUsuario);
    Usuario.estaBloquado.mockReturnValue(false);
    Usuario.tieneAccesoAlSistema.mockReturnValue(true);
    Usuario.verificarPassword.mockResolvedValue(true);
    Usuario.actualizarUltimoAcceso.mockResolvedValue();

    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: 'Daniel', password: '3218' });
    
    expect(res.statusCode).toBe(302); // Espera redirección
    expect(res.headers.location).toBe('/dashboard');
  });

  test('Login fallido con credenciales incorrectas', async () => {
    Usuario.buscarParaLogin.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: 'Daniel', password: 'incorrecta' });
    
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body.mensaje).toBe('Credenciales incorrectas');
  });

  test('Login fallido con campos vacíos', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: '', password: '' });
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body.mensaje).toBe('Email/usuario y contraseña son requeridos');
  });
});
