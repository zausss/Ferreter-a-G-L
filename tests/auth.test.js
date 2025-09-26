const request = require('supertest');
const app = require('../app');

describe('Pruebas de login', () => {
  test('Login exitoso con usuario y contraseña válidos', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: 'Daniel', password: '3218' });
    expect(res.statusCode).toBe(302); // Espera redirección
    expect(res.headers.location).toBe('/dashboard'); // Opcional: verifica la ruta de redirección
  });

  test('Login fallido con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: 'Daniel', password: 'incorrecta' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('mensaje');
  });

  test('Login fallido con campos vacíos', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: '', password: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('mensaje');
  });
});
