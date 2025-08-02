const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Usuario = require('../models/Usuario');

// Middleware para verificar JWT
const verificarToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            // Si es una petición AJAX, responder con JSON
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({
                    autenticado: false,
                    mensaje: 'Token no encontrado',
                    redirectTo: '/auth/login'
                });
            }
            
            // Si es petición normal, redirigir
            return res.redirect('/auth/login');
        }

        // Verificar y decodificar token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Buscar usuario actualizado en BD
        const usuario = await Usuario.buscarPorId(decoded.id);
        
        if (!usuario) {
            // Token válido pero usuario no existe o inactivo
            res.clearCookie('token');
            
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({
                    autenticado: false,
                    mensaje: 'Usuario no válido',
                    redirectTo: '/auth/login'
                });
            }
            
            return res.redirect('/auth/login');
        }

        // Agregar información del usuario al request
        req.usuario = {
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            nombre_completo: usuario.nombre_completo,
            email: usuario.correo_electronico,
            rol_sistema: usuario.rol_sistema
        };

        next();

    } catch (error) {
        console.error('Error verificando token:', error);
        
        // Token inválido o expirado
        res.clearCookie('token');
        
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({
                autenticado: false,
                mensaje: 'Sesión expirada',
                redirectTo: '/auth/login'
            });
        }

        res.redirect('/auth/login');
    }
};

// Middleware para verificar rol de administrador
const soloAdministradores = (req, res, next) => {
    if (req.usuario.rol_sistema !== 'Administrador') {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(403).json({
                mensaje: 'Acceso denegado: Solo administradores'
            });
        }
        
        return res.status(403).send('Acceso denegado: Solo administradores');
    }
    
    next();
};

// Middleware para administradores y cajeros
const administradoresYCajeros = (req, res, next) => {
    const rolesPermitidos = ['Administrador', 'Cajero'];
    
    if (!rolesPermitidos.includes(req.usuario.rol_sistema)) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(403).json({
                mensaje: 'Acceso denegado: Permisos insuficientes'
            });
        }
        
        return res.status(403).send('Acceso denegado: Permisos insuficientes');
    }
    
    next();
};

// Middleware para redirigir usuarios autenticados
const redirigirSiAutenticado = (req, res, next) => {
    const token = req.cookies.token;
    
    if (token) {
        try {
            jwt.verify(token, config.jwt.secret);
            return res.redirect('/dashboard');
        } catch (error) {
            // Token inválido, limpiar y continuar
            res.clearCookie('token');
        }
    }
    
    next();
};

module.exports = {
    verificarToken,
    soloAdministradores,
    administradoresYCajeros,
    redirigirSiAutenticado
};
