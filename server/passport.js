var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
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
      .findOne({ username: username })
      .select('username auth.hashedPassword')
      .exec()
      .then(function(user) {
        if (!user) {
          return done(null, false);
        }
        var validPassword = bcrypt.compareSync(password, user.auth.hashedPassword);
        if (!validPassword) {
          return done(null, false);
        }
        else {
          return done(null, user);
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
      // find the user in the database based on their facebook id
      User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (user) {
          return done(null, user); // user found, return that user
        }
        else {
          // if there is no user found with that facebook id, create them
          var newUser = new User();

          newUser.facebook.id    = profile.id; // set the users facebook id
          newUser.facebook.token = token; // we will save the token that facebook provides to the user
          newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
          newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            return done(null, newUser);
          });
        }
      });
    });
  }));
}
