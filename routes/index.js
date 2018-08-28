var express = require('express');
var router = express.Router();
var login = require('./login').router

/* GET home page. */
router.get('/', login.validarSesion, function(req, res, next) {
  res.set('Cache-Control', 'private, max-age=60')
  res.render('index', {
    datos: `${req.session_itsc.name} | ${req.session_itsc.rol}`
  })
});

module.exports = router;
