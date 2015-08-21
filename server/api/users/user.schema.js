var Schema = require('mongoose').Schema;

var userSchema = new Schema({
  local: {
    username: String,
    role: { type: String, enum: ['user', 'admin']},
    hashedPassword: { type: String, select: false }
  },

  facebook: {
    id: String,
    token: { type: String, select: false }
  },

  twitter: {
    id: String,
    token: { type: String, select: false }
  },

  google: {
    id: String,
    token: { type: String, select: false }
  }
});

userSchema.pre('validate', function(next) {
  var local = this.local;
  var facebook = this.facebook;
  var twitter = this.twitter;
  var google = this.google;
  var usingLocal = local.username || local.role || local.hashedPassword;
  var usingFacebook = facebook.id || facebook.token;
  var usingTwitter = twitter.id || twitter.token;
  var usingGoogle = google.id || google.token;

  if (!usingLocal && !usingFacebook && !usingTwitter && !usingGoogle) {
    // TODO not sure what path to use for this.invalidate
    next('A user needs be authenticated with at least one strategy.');
  }

  // LOCAL
  if (usingLocal && !local.username) {
    this.invalidate('local.username', 'Local auth requires a username.');
    next('Local auth requires a username.');
  }
  if (usingLocal && !local.role) {
    this.invalidate('local.role', 'Local auth requires a role.');
    next('Local auth requires a role.');
  }
  if (usingLocal && !local.hashedPassword) {
    this.invalidate('local.hashedPassword', 'Local auth requires a hashedPassword.');
    next('Local auth requires a hashedPassword.');
  }

  // FACEBOOK
  if (usingFacebook && !facebook.id) {
    this.invalidate('facebook.id', 'Facebook auth requires an id.');
    next('Facebook auth requires an id.');
  }
  if (usingFacebook && !facebook.token) {
    this.invalidate('facebook.token', 'Facebook auth requires a token.');
    next('Facebook auth requires a token.');
  }

  // TWITTER
  if (usingTwitter && !twitter.id) {
    this.invalidate('twitter.id', 'Twitter auth requires an id.');
    next('Twitter auth requires an id.');
  }
  if (usingTwitter && !twitter.token) {
    this.invalidate('twitter.token', 'Twitter auth requires a token.');
    next('Twitter auth requires a token.');
  }

  // GOOGLE
  if (usingGoogle && !google.id) {
    this.invalidate('google.id', 'Google auth requires an id.');
    next('Google auth requires an id.');
  }
  if (usingGoogle && !google.token) {
    this.invalidate('google.token', 'Google auth requires a token.');
    next('Google auth requires a token.');
  }

  // call next() if all validations pass
  next();
});

module.exports = userSchema;
