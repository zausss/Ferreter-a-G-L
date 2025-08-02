const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require('../config/config');

class AuthController {
    
    // Mostrar página de login
    static mostrarLogin(req, res) {
        // Si ya está autenticado, redirigir al dashboard
        if (req.cookies.token) {
            return res.redirect('/dashboard');
        }
        
        res.sendFile(path.join(__dirname, '../views/login.html'));
    }

    // Procesar login
    static async procesarLogin(req, res) {
        try {
            const { email_usuario, password } = req.body;

            // Validar datos requeridos
            if (!email_usuario || !password) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Email/usuario y contraseña son requeridos'
                });
            }

            // Buscar usuario
            const usuario = await Usuario.buscarParaLogin(email_usuario);
            
            if (!usuario) {
                return res.status(401).json({
                    exito: false,
                    mensaje: 'Credenciales incorrectas'
                });
            }

            // Verificar si está bloqueado
            if (Usuario.estaBloquado(usuario)) {
                const tiempoBloqueo = new Date(usuario.bloqueado_hasta);
                return res.status(423).json({
                    exito: false,
                    mensaje: `Usuario bloqueado hasta ${tiempoBloqueo.toLocaleString('es-ES')} por múltiples intentos fallidos`
                });
            }

            // Verificar rol de acceso
            if (!Usuario.tieneAccesoAlSistema(usuario.rol_sistema)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'Su cargo no tiene permisos para acceder al sistema'
                });
            }

            // Verificar contraseña
            const passwordValido = await Usuario.verificarPassword(password, usuario.password_hash);
            
            if (!passwordValido) {
                // Incrementar intentos fallidos
                await Usuario.incrementarIntentosFallidos(usuario.id);
                
                return res.status(401).json({
                    exito: false,
                    mensaje: 'Credenciales incorrectas'
                });
            }

            // Login exitoso - actualizar último acceso
            await Usuario.actualizarUltimoAcceso(usuario.id);

            // Generar token JWT
            const tokenPayload = {
                id: usuario.id,
                empleado_id: usuario.empleado_id,
                nombre_usuario: usuario.nombre_usuario,
                nombre_completo: usuario.nombre_completo,
                email: usuario.correo_electronico,
                rol: usuario.rol_sistema,
                cargo: usuario.nombre_cargo
            };

            const token = jwt.sign(
                tokenPayload,
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            // Establecer cookie segura
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 1000, // 60 segundos
                sameSite: 'strict'
            });

            // Respuesta de éxito
            // Si es petición AJAX, responder con JSON
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.json({
                    exito: true,
                    mensaje: 'Login exitoso',
                    usuario: {
                        nombre_completo: usuario.nombre_completo,
                        rol: usuario.rol_sistema,
                        cargo: usuario.nombre_cargo
                    },
                    redirectTo: '/dashboard'
                });
            }
            
            // Si es formulario HTML, redirigir directamente
            res.redirect('/dashboard');

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }

    // Logout
    static logout(req, res) {
        try {
            // Limpiar cookie
            res.clearCookie('token');
            
            // Si es petición AJAX
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.json({
                    exito: true,
                    mensaje: 'Sesión cerrada exitosamente',
                    redirectTo: '/login'
                });
            }
            
            // Si es petición normal, redirigir
            res.redirect('/login');
            
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error cerrando sesión'
            });
        }
    }

    // Verificar estado de autenticación
    static async verificarEstado(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    autenticado: false
                });
            }

            res.json({
                autenticado: true,
                usuario: {
                    nombre_completo: req.usuario.nombre_completo,
                    rol: req.usuario.rol_sistema,
                    cargo: req.usuario.nombre_cargo
                }
            });

        } catch (error) {
            console.error('Error verificando estado:', error);
            res.status(500).json({
                autenticado: false,
                error: 'Error interno'
            });
        }
    }
}

module.exports = AuthController;
