var mongoose = require('mongoose');
var assert = require('assert');
var Auth = require('./auth.service.js');
var app = require('../app.js');
var request = require('supertest');
var async = require('async');
var UserSchema = require('../api/users/user.schema.js').UserSchema;
var User = mongoose.model('User', UserSchema);
var LocalSchema = require('../api/users/user.schema.js').LocalSchema;
var Local = mongoose.model('Local', LocalSchema);
var agent = request.agent(app);

// // doesn't work. req.user is undefined.
// app.get('/testHasRole', Auth.hasRole('admin'), function(req, res) {
// //  THIS GETS HIT
// //  When I remove the Auth.hasRole('admin') middleware, logs out 'testHasRole success', showing that the route indeed gets hit
//   console.log('testHasRole success outside of it() block');
//   res.status(200).send('success');
// });

var user2id = '000000000000000000000000';
var testUsers = [{
  username: 'a',
  password: 'password'
}, {
  username: 'admin',
  password: 'password'
}, null];

testUsers.forEach(function(loggedInUser) {
  var describeStr;
  if (loggedInUser && loggedInUser.username === 'a') {
    describeStr = 'Auth Service (role: user)';
  }
  else if (loggedInUser && loggedInUser.username === 'admin') {
    describeStr = 'Auth Service (role: admin)';
  }
  else {
    describeStr = 'Auth Service (not logged in)';
  }

  describe(describeStr, function() {
    var id, user2;

    var local2 = new Local({
      username: 'b',
      role: 'user',
      hashedPassword: 'sdfjdkslfssdfkjldsfljs'
    });

    beforeEach(function(done) {
      // 1. clear Local and Users
      // 2. create user 2
      // 3. create user 1
      // 4. log user 1 in
      Local.remove({}).exec(function() {
        User.remove({}).exec(function(){
          Local.create(local2, function(err, createdLocal2) {
            User.create({ _id: user2id, local: createdLocal2 }, function(err, createdUser2) {
              user2 = createdUser2;

              if (!loggedInUser) {
                return done();
              }

              agent
                .post('/users')
                .send(loggedInUser)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  var result = JSON.parse(res.text);
                  id = result._id;
                  return done();
                })
              ;

            });
          });
        });
      });
    });

    after(function(done) { // clear database after tests finished
      Local.remove({}).exec(function() {
        User.remove({}).exec(done);
      });
    });

    it('#isLoggedIn', function(done) {
      if (loggedInUser) {
        agent
          .get('/current-user')
          .expect(200, done)
        ;
      }
      else {
        agent
          .get('/current-user')
          .expect(401)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            var response = JSON.parse(res.text);
            assert.equal(response.error, 'Unauthorized');
            return done();
          })
        ;
      }
    });

    it('#isAuthorized', function(done) {
      if (loggedInUser && loggedInUser.username === 'admin') {
        agent
          .del('/users/' + user2id)
          .expect(204, done)
        ;
      }
      else if (loggedInUser && loggedInUser.username === 'a') {
        async.series([
          function(callback) {
            agent
              .del('/users/' + user2id)
              .expect(401, callback)
            ;
          }, function(callback) {
            agent
              .del('/users/' + id)
              .expect(204, callback)
            ;
          }
        ], done);
      }
      else if (!loggedInUser) {
        agent
          .del('/users/' + user2id)
          .expect(401, done)
        ;
      }
    });

    it('#hasRole', function(done) {
      // THIS WORKS - req.user is what it's supposed to be.
      // agent
      //   .get('/current-user')
      //   .expect(200)
      //   .end(function(err, res) {
      //     console.log('res.text: ', res.text);
      //     return done();
      //   })
      // ;

      app.get('/testHasRole', Auth.hasRole('admin'), function(req, res) {
        // This never gits hit, and neither does the Auth.hasRole middleware
        // So I guess I can't define routes here
        console.log('testHasRole success inside of it() block');
        res.status(200).send('success');
      });

      if (loggedInUser && loggedInUser.username === 'admin') {
        agent
          .get('/testHasRole')
          .expect(200, done)
        ;
      }
      else {
        agent
          .get('/testHasRole')
          .expect(401, done)
        ;
      }
    });
  });
});
