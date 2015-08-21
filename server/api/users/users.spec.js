var mongoose = require('mongoose');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');
var userSchema = require('./user.schema.js');
var User = mongoose.model('User', userSchema);
var agent = request.agent(app);
var invalidId = 'aaaaaaaaaaaaaaaaaaaaaaaa';

describe('Users API (role: user)', function() {
  var id, user1, user2;

  user1 = { // logged in
    local: {
      username: 'a',
      password: 'password'
    }
  };
  user2 = {
    local: {
      username: 'b',
      role: 'user',
      hashedPassword: 'fkjldsafsdafkasdkjfadjksf'
    }
  };

  beforeEach(function(done) {
    User.remove({}).exec(function() {
      User.create(user2, function() {
        agent
          .post('/users')
          .send(user1)
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

  after(function(done) { // clear database after tests finished
    User.remove({}).exec(done);
  });

  describe('GET /users', function() {
    it('When existing', function(done) {
      agent
        .get('/users')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var users = JSON.parse(res.text);
          assert.equal(users.length, 2);
          assert(users[0].local);
          assert.equal(users[0].local.username, user2.local.username);
          assert.equal(users[0].local.role, user2.local.role);
          assert(!users[0].local.hashedPassword);
          assert.equal(users[1]._id, id);
          assert(users[1].local);
          assert.equal(users[1].local.username, user1.local.username);
          assert.equal(users[1].local.role, 'user');
          assert(!users[1].local.hashedPassword);
          return done();
        })
      ;
    });
    it('When empty', function(done) {
      User.remove({}).exec(function() {
        agent
          .get('/users')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            var result = JSON.parse(res.text);
            assert.deepEqual(result, []);
            return done();
          })
        ;
      });
    });
  });


  describe('GET /users/:id', function() {
    it('Valid id', function(done) {
      agent
        .get('/users/'+id)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert.equal(result._id, id);
          assert(result.local);
          assert.equal(result.local.username, user1.local.username);
          assert.equal(result.local.role, 'user');
          assert(!result.local.hashedPassword);
          return done();
        })
      ;
    });

    it('Invalid id', function(done) {
      agent
        .get('/users/'+invalidId)
        .expect(404, done)
      ;
    });
  });

  describe('POST /users', function() {
    it('Valid', function(done) {
      agent
        .post('/users')
        .send({
          local: {
            username: 'c',
            password: 'password'
          }
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert(result._id);
          assert(result.local);
          assert.equal(result.local.username, 'c');
          assert.equal(result.local.role, 'user');
          assert(!result.local.hashedPassword);
          return done();
        })
      ;
    });
    it('Validates required username', function(done) {
      agent
        .post('/users')
        .send({
          local: {
            password: 'password'
          }
        })
        .expect(400)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          assert.equal(res.text, 'A username is required.');
          return done();
        })
      ;
    });
    it('Validates required password', function(done) {
      agent
        .post('/users')
        .send({
          local: {
            username: 'c'
          }
        })
        .expect(400)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          assert.equal(res.text, 'A password is required.');
          return done();
        })
      ;
    });
    it('Validates unique username', function(done) {
      agent
        .post('/users')
        .send({
          local: {
            username: 'a',
            password: 'password'
          }
        })
        .expect(409)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          assert.equal(res.text, 'Username already exists.');
          return done();
        })
      ;
    });
    it('Only adds fields in the schema', function(done) {
      agent
        .post('/users')
        .send({
          local: {
            username: 'c',
            password: 'password',
            foo: 'bar'
          }
        })
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert.equal(result.local.username, 'c');
          assert(!result.local.foo);
          return done();
        })
      ;
    });
    it("Can't manually set a users role", function(done) {
      agent
        .post('/users')
        .send({
          local: {
            username: 'c',
            password: 'password',
            role: 'admin'
          }
        })
        .expect(403)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          assert.equal(res.text, "Can't manually set the role of a user.");
          return done();
        })
      ;
    });
  });

  describe('PUT /users/:id', function() {
    it('Authorized: updates username', function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'updated',
            password: 'password'
          }
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert.equal(result._id, id);
          assert(result.local);
          assert.equal(result.local.username, 'updated');
          assert.equal(result.local.role, 'user');
          assert(!result.local.hashedPassword);
          return done();
        })
      ;
    });
    it('Authorized: updates password', function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'a',
            password: 'updated'
          }
        })
        .expect(201, done)
      ;
    });
    it('Authorized: validates unique username', function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'b',
            password: 'password'
          }
        })
        .expect(409)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          assert.equal(res.text, 'Username already exists.');
          return done();
        })
      ;
    });
    it('Authorized: only adds fields in the schema', function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'c',
            password: 'password',
            foo: 'bar'
          }
        })
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert.equal(result.local.username, 'c');
          assert(!result.local.foo);
          return done();
        })
      ;
    });
    it("Authorized: can't update role", function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'a',
            password: 'password',
            role: 'admin'
          }
        })
        .expect(403)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          assert.equal(res.text, "Can't manually set the role of a user.");
          return done();
        })
      ;
    });
    it('Unauthorized', function(done) {
      agent
        .put('/users/'+invalidId)
        .send({
          local: {
            username: 'updated'
          }
        })
        .expect(401, done)
      ;
    });
  });

  describe('DELETE /users/:id', function() {
    it('Authorized', function(done) {
      agent
        .del('/users/'+id)
        .expect(204, done)
      ;
    });
    it('Unauthorized', function(done) {
      agent
        .del('/users/'+invalidId)
        .expect(401, done)
      ;
    });
  });

});

describe('Users API (role: admin)', function() {
  var id, user;

  user = {
    local: {
      username: 'admin',
      password: 'password'
    }
  };

  beforeEach(function(done) {
    User.remove({}).exec(function() {
      agent
        .post('/users')
        .send(user)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          id = result._id;
          return done();
        });
    });
  });

  after(function(done) {
    User.remove({}).exec(done);
  });

  describe('GET /users/:id', function() {
    it('Valid id', function(done) {
      agent
        .get('/users/'+id)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert.equal(result._id, id);
          assert(result.local);
          assert.equal(result.local.username, user.local.username);
          assert.equal(result.local.role, 'admin');
          assert(!result.local.hashedPassword);
          return done();
        })
      ;
    });

    it('Invalid id', function(done) {
      agent
        .get('/users/'+invalidId)
        .expect(404, done)
      ;
    });
  });

  describe('PUT /users/:id', function() {
    it('Valid: updates username', function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'updated'
          }
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var result = JSON.parse(res.text);
          assert.equal(result._id, id);
          assert(result.local);
          assert.equal(result.local.username, 'updated');
          // not sure if I want to update admin or not
          assert(!result.local.hashedPassword);
          return done();
        })
      ;
    });
    it('Valid: updates password', function(done) {
      agent
        .put('/users/'+id)
        .send({
          local: {
            username: 'a',
            password: 'updated'
          }
        })
        .expect(201, done)
      ;
    });
    it('Invalid id', function(done) {
      agent
        .put('/users/'+invalidId)
        .send({
          local: {
            username: 'updated'
          }
        })
        .expect(404, done)
      ;
    });
  });

  describe('DELETE /users/:id', function() {
    it('Valid id', function(done) {
      agent
        .del('/users/'+id)
        .expect(204, done)
      ;
    });
    it('Invalid id', function(done) {
      agent
        .del('/users/'+invalidId)
        .expect(404, done)
      ;
    });
  });

});
