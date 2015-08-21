var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var userSchema = require('./user.schema.js');
var User = mongoose.model('User', userSchema);
var Auth = require('../auth/auth.service.js');
var bcrypt = require('bcrypt');

function forwardError(res) {
  return function errorForwarder(err) {
    res.status(500).send(err);
  }
}

router.get('/', function(req, res) {
  User
    .find({}).exec()
    .then(function(users) {
      res.status(200).json(users);
    }, forwardError)
  ;
});

router.get('/:id', function(req, res) {
  User
    .findById(req.params.id).exec()
    .then(function(user) {
      if (!user) {
        return res.status(404).end();
      }
      return res.status(200).json(user);
    }, forwardError)
  ;
});

router.post('/', function(req, res) {
  if (req.body.local.role) {
    return res.status(403).send("Can't manually set the role of a user.");
  }

  // set admin: going with this approach for the time being. makes it easier to test.
  if (req.body.local.username === 'admin') {
    req.body.local.role = 'admin';
  }
  else {
    req.body.local.role = 'user';
  }

  // hash password
  if (req.body.local.password) {
    req.body.local.hashedPassword = bcrypt.hashSync(req.body.local.password, 8);
    delete req.body.local.password;
  }
  else {
    return res.status(400).send('A password is required.');
  }

  User
    .find({ 'local.username': req.body.local.username }, function(checkUniquenessError, docs) {
      if (checkUniquenessError) {
        return res.status(500).send(checkUniquenessError);
      }
      if (docs.length > 0) {
        return res.status(409).send('Username already exists.');
      }
      User
        .create(req.body)
        .then(function(user) {
          req.login(user, function(loginErr) {
            if (loginErr) {
              return res.status(500).send('Problem logging in after signup.');
            }
            var userCopy = JSON.parse(JSON.stringify(user));
            delete userCopy.local.hashedPassword;
            return res.status(201).json(userCopy);
          });
        })
        .then(null, function(err) {
          var usernameNotPresent;
          var usernameError = !!(err && err.errors && err.errors['local.username']);
          if (usernameError) {
            usernameNotPresent = err.errors['local.username'].message === 'Local auth requires a username.';
          }
          if (usernameError && usernameNotPresent) {
            return res.status(400).send('A username is required.');
          }
          return res.status(500).send(err);
        })
      ;
    })
  ;
});

router.put('/:id', Auth.isAuthorized, function(req, res) {
  if (req.body.local.role) {
    return res.status(403).send("Can't manually set the role of a user.");
  }

  // set admin: going with this approach for the time being. makes it easier to test.
  if (req.body.local.username === 'admin') {
    req.body.local.role = 'admin';
  }
  else {
    req.body.local.role = 'user';
  }

  if (req.body.local.password) {
    req.body.local.hashedPassword = bcrypt.hashSync(req.body.local.password, 8);
    delete req.body.local.password;
  }

  User
    .find({ 'local.username': req.body.local.username }, function(checkUniquenessError, docs) {
      if (checkUniquenessError) {
        return res.status(500).send(checkUniquenessError);
      }
      if (docs.length === 1 && docs[0]._id.toString() !== req.params.id) {
        return res.status(409).send('Username already exists.');
      }
      User
        .findByIdAndUpdate(req.params.id, req.body, { new: true }).exec() // new sends back updated user
        .then(function(user) {
          if (!user) {
            return res.status(404).end()
          }
          return res.status(201).json(user);
        }, forwardError)
      ;
    })
  ;
});

router.delete('/:id', Auth.isAuthorized, function(req, res) {
  User
    .findByIdAndRemove(req.params.id).exec()
    .then(function(user) {
      if (!user) {
        return res.status(404).end();
      }
      if (req.user._id.toString() === req.params.id) {
        req.logout();
      }
      return res.status(204).end();
    }, forwardError)
  ;
});

module.exports = router;
