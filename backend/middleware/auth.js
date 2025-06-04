const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-aqui';

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Generar token JWT
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
    );
}

// Verificar token JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    authenticateToken,
    generateToken,
    verifyToken,
    JWT_SECRET
};
