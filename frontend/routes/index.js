var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Buzón Electrónico TEJA' });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login - Buzón Electrónico TEJA' });
});

/* GET reset password page */
router.get('/reset-password', function(req, res, next) {
  res.render('reset-password', { title: 'Restablecer Contraseña - Buzón Electrónico TEJA' });
});

module.exports = router;
