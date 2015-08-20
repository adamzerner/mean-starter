var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongoose = require('mongoose');
var userSchema = require('./api/users/user.schema.js');
var User = mongoose.model('User', userSchema);
var bcrypt = require('bcrypt');
var config = require('./config.json');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(function(id, done) {
    User
      .findById(id).exec()
      .then(function(user) {
        done(null, user);
      }, done)
    ;
  });

  // LOCAL
  passport.use(new LocalStrategy(function(username, password, done) {
    User
      .findOne({ 'local.username': username })
      .select('local')
      .exec()
      .then(function(user) {
        if (!user) {
          return done(null, false);
        }
        var validPassword = bcrypt.compareSync(password, user.local.hashedPassword);
        if (!validPassword) {
          return done(null, false);
        }
        else {
          var userCopy = JSON.parse(JSON.stringify(user));
          delete userCopy.local.hashedPassword;
          return done(null, userCopy); // set req.user
        }
      })
      .then(null, function(err) {
        return done(err);
      })
    ;
  }));

  // FACEBOOK
  passport.use(new FacebookStrategy({
    clientID: config.facebookAuth.clientID,
    clientSecret: config.facebookAuth.clientSecret,
    callbackURL: config.facebookAuth.callbackURL
  }, function(token, refreshToken, profile, done) {
    // asynchronous
    process.nextTick(function() {
      User.findOne({ 'facebook.token': token }, function(err, user) {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        }
        else {
          var newUser = new User();
          console.log('facebook profile: ', profile);
          // newUser.facebook.id = profile.id;
          newUser.facebook.token = token;
          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            delete newUser.facebook.token;
            return done(null, newUser);
          });
        }
      });
    });
  }));

  // TWITTER
  passport.use(new TwitterStrategy({
    consumerKey: config.twitterAuth.consumerKey,
    consumerSecret: config.twitterAuth.consumerSecret,
    callbackURL: config.twitterAuth.callbackURL
  }, function(token, tokenSecret, profile, done) {
    process.nextTick(function() {
      User.findOne({ 'twitter.token': token }, function(err, user) {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        }
        else {
          var newUser = new User();
          newUser.twitter = {};
          console.log('twitter profile: ', profile);
          // newUser.twitter.id = profile.id
          newUser.twitter.token = token;
          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            delete newUser.twitter.token;
            return done(null, newUser);
          });
        }
      });
    });
  }));

  // GOOGLE
  passport.use(new GoogleStrategy({
    clientID: config.googleAuth.clientID,
    clientSecret: config.googleAuth.clientSecret,
    callbackURL: config.googleAuth.callbackURL
  }, function(token, refreshToken, profile, done) {
    process.nextTick(function() {
      User.findOne({ 'google.token': token }, function(err, user) {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        }
        else {
          var newUser = new User();
          newUser.google = {};
          console.log('google profile: ', profile);
          // newUser.google.id = profile.id;
          newUser.google.token = token;
          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            delete newUser.google.token;
            return done(null, newUser);
          });
        }
      });
    });
  }));
};
