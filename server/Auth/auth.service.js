function authShouldBeSkipped() { // skip auth when in test env
  var mochaUrl = '/usr/local/lib/node_modules/mocha/bin/_mocha';
  if (process.argv[2].indexOf('server/Auth') > -1) {
    return false; // avoid skipping when Auth is being explicitly tested
  }
  return (process.argv[1] === mochaUrl || process.argv[2] === 'mocha');
}

function hasRole (roles) {
  // accept a string or an array of strings
  if (typeof roles === 'string') {
    roles = [roles];
  }
  else if (!(roles instanceof 'array')) {
    throw new ReferenceError('Argument must be a string or an array of strings');
  }

  return function (req, res, next) {
    console.log('hits hasRole');

    if (authShouldBeSkipped()) {
      console.log('auth skipped');
      return next();
    }

    console.log('req.user: ', req.user);

    if (!req.user || !req.user.local || roles.indexOf(req.user.local.role) === -1) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    return next();
  }
}

function isAuthorized(req, res, next) {
  if (authShouldBeSkipped()) {
    return next();
  }

  var isAuthorized = req.user &&
    (
      (req.user.local && req.user.local.role === 'admin') ||
      req.params.id === req.user._id.toString()
    )
  ;

  if (isAuthorized) {
    return next();
  }

  return res.status(401).send({ error: 'Unauthorized' });
}

function isLoggedIn(req, res, next) {
  if (authShouldBeSkipped()) {
    return next();
  }
  if (req.user) {
    return next();
  }
  return res.status(401).send({ error: 'Unauthorized' });
}

exports.hasRole = hasRole;
exports.isAuthorized = isAuthorized;
exports.isLoggedIn = isLoggedIn;
