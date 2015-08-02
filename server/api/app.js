var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var passport = require('passport');
var passportLocal = require('passport-local');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var app = express();

mongoose.connect('mongodb://localhost/mean-starter');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Problem connecting to database.'));
db.once('open' onDbConnect);

function onDbConnect() {
  console.log('Database connection established...');
  // basic middleware
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(expressSession({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
  }));

  // routes
  app.use('/users', require('./users/routes.js'));

  // listening on port 3001 for the API server
  app.listen(3001, function() {
    console.log('API server listening on port 3001...');
  });
}
