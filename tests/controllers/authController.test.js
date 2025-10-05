const AuthController = require('../../controllers/authController');
const Usuario = require('../../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

// Mock del modelo Usuario
jest.mock('../../models/Usuario');
jest.mock('jsonwebtoken');

describe('AuthController - Pruebas Unitarias', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object
    req = {
      body: {},
      cookies: {},
      xhr: false,
      headers: {}
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      sendFile: jest.fn().mockReturnThis()
    };
  });

  describe('procesarLogin', () => {
    test('Login exitoso con credenciales válidas', async () => {
      // Arrange
      req.body = { email_usuario: 'Daniel', password: '3218' };
      
      const mockUsuario = {
        id: 1,
        empleado_id: 1,
        nombre_usuario: 'Daniel',
        nombre_completo: 'Daniel Administrador',
        correo_electronico: 'daniel@test.com',
        rol_sistema: 'Administrador',
        nombre_cargo: 'Administrador',
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        password_hash: 'hashedpassword'
      };

      Usuario.buscarParaLogin.mockResolvedValue(mockUsuario);
      Usuario.estaBloquado.mockReturnValue(false);
      Usuario.tieneAccesoAlSistema.mockReturnValue(true);
      Usuario.verificarPassword.mockResolvedValue(true);
      Usuario.actualizarUltimoAcceso.mockResolvedValue();
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await AuthController.procesarLogin(req, res);

      // Assert
      expect(Usuario.buscarParaLogin).toHaveBeenCalledWith('Daniel');
      expect(Usuario.verificarPassword).toHaveBeenCalledWith('3218', 'hashedpassword');
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });

    test('Login fallido con credenciales incorrectas', async () => {
      // Arrange
      req.body = { email_usuario: 'Daniel', password: 'incorrecta' };
      req.headers = { accept: 'application/json' };
      
      const mockUsuario = {
        id: 1,
        password_hash: 'hashedpassword',
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        rol_sistema: 'Administrador'
      };

      Usuario.buscarParaLogin.mockResolvedValue(mockUsuario);
      Usuario.estaBloquado.mockReturnValue(false);
      Usuario.tieneAccesoAlSistema.mockReturnValue(true);
      Usuario.verificarPassword.mockResolvedValue(false);
      Usuario.incrementarIntentosFallidos.mockResolvedValue();

      // Act
      await AuthController.procesarLogin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        exito: false,
        mensaje: 'Credenciales incorrectas'
      });
    });

    test('Login fallido con campos vacíos', async () => {
      // Arrange
      req.body = { email_usuario: '', password: '' };
      req.headers = { accept: 'application/json' };

      // Act
      await AuthController.procesarLogin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        exito: false,
        mensaje: 'Email/usuario y contraseña son requeridos'
      });
    });

    test('Login fallido con usuario no encontrado', async () => {
      // Arrange
      req.body = { email_usuario: 'noexiste', password: 'password' };
      req.headers = { accept: 'application/json' };

      Usuario.buscarParaLogin.mockResolvedValue(null);

      // Act
      await AuthController.procesarLogin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        exito: false,
        mensaje: 'Credenciales incorrectas'
      });
    });

    test('Login fallido con usuario bloqueado', async () => {
      // Arrange
      req.body = { email_usuario: 'Daniel', password: '3218' };
      req.headers = { accept: 'application/json' };
      
      const mockUsuario = {
        id: 1,
        intentos_fallidos: 5,
        bloqueado_hasta: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos en el futuro
        rol_sistema: 'Administrador'
      };

      Usuario.buscarParaLogin.mockResolvedValue(mockUsuario);
      Usuario.estaBloquado.mockReturnValue(true);

      // Act
      await AuthController.procesarLogin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: expect.stringContaining('Usuario bloqueado hasta')
        })
      );
    });

    test('Login fallido con rol sin acceso al sistema', async () => {
      // Arrange
      req.body = { email_usuario: 'empleado', password: 'password' };
      req.headers = { accept: 'application/json' };
      
      const mockUsuario = {
        id: 1,
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        rol_sistema: 'Empleado'
      };

      Usuario.buscarParaLogin.mockResolvedValue(mockUsuario);
      Usuario.estaBloquado.mockReturnValue(false);
      Usuario.tieneAccesoAlSistema.mockReturnValue(false);

      // Act
      await AuthController.procesarLogin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        exito: false,
        mensaje: 'Su cargo no tiene permisos para acceder al sistema'
      });
    });
  });

  describe('logout', () => {
    test('Logout exitoso con redirección', () => {
      // Act
      AuthController.logout(req, res);

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });

    test('Logout exitoso con respuesta JSON', () => {
      // Arrange
      req.xhr = true;

      // Act
      AuthController.logout(req, res);

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Sesión cerrada exitosamente',
        redirectTo: '/login'
      });
    });
  });

  describe('verificarEstado', () => {
    test('Usuario autenticado', async () => {
      // Arrange
      req.usuario = {
        nombre_completo: 'Daniel Administrador',
        rol_sistema: 'Administrador',
        nombre_cargo: 'Administrador'
      };

      // Act
      await AuthController.verificarEstado(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        autenticado: true,
        usuario: {
          nombre_completo: 'Daniel Administrador',
          rol: 'Administrador',
          cargo: 'Administrador'
        }
      });
    });

    test('Usuario no autenticado', async () => {
      // Arrange
      req.usuario = null;

      // Act
      await AuthController.verificarEstado(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        autenticado: false
      });
    });
  });

  describe('mostrarLogin', () => {
    test('Mostrar página de login cuando no hay token', () => {
      // Act
      AuthController.mostrarLogin(req, res);

      // Assert
      expect(res.sendFile).toHaveBeenCalled();
    });

    test('Redirigir al dashboard cuando ya hay token', () => {
      // Arrange
      req.cookies.token = 'valid-token';

      // Act
      AuthController.mostrarLogin(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('mostrarRegistro', () => {
    test('Mostrar página de registro cuando no hay token', () => {
      // Act
      AuthController.mostrarRegistro(req, res);

      // Assert
      expect(res.sendFile).toHaveBeenCalled();
    });

    test('Redirigir al dashboard cuando ya hay token', () => {
      // Arrange
      req.cookies.token = 'valid-token';

      // Act
      AuthController.mostrarRegistro(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });
});