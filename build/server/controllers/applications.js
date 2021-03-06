// Generated by CoffeeScript 1.10.0
var appManager, forwardRequest, getPathForStaticApp, getProxy, lockedpath, logger, send;

appManager = require('../lib/app_manager');

getProxy = require('../lib/proxy').getProxy;

send = require('send');

lockedpath = require('lockedpath');

logger = require('printit')({
  date: false,
  prefix: 'controllers:applications'
});

getPathForStaticApp = function(appName, path, root, callback) {
  logger.info("Starting static app " + appName);
  if (path === '/' || path === '/public/') {
    path += 'index.html';
  }
  return callback(lockedpath(root).join(path));
};

forwardRequest = function(req, res, errTemplate, next) {
  var appName, shouldStart;
  appName = req.params.name;
  shouldStart = -1 === req.url.indexOf('socket.io');
  return appManager.ensureStarted(appName, shouldStart, function(err, result) {
    var error;
    if (!res.connection || res.connection.destroyed) {

    } else if (err != null) {
      error = new Error(err.msg);
      error.status = err.code;
      error.template = errTemplate(err);
      return next(error);
    } else if (result.type === 'static') {
      return getPathForStaticApp(appName, req.url, result.path, function(url) {
        return send(req, url).pipe(res);
      });
    } else {
      return getProxy().web(req, res, {
        target: "http://localhost:" + result.port
      });
    }
  });
};

module.exports.app = function(req, res, next) {
  var appName, errTemplate;
  appName = req.params.name;
  req.url = req.url.substring(("/apps/" + appName).length);
  errTemplate = function(err) {
    return {
      name: err.code === 404 ? 'not_found' : 'error_app'
    };
  };
  return forwardRequest(req, res, errTemplate, next);
};

module.exports.publicApp = function(req, res, next) {
  var appName, errTemplate;
  appName = req.params.name;
  req.url = req.url.substring(("/public/" + appName).length);
  req.url = "/public" + req.url;
  errTemplate = function(err) {
    return {
      name: 'error_public'
    };
  };
  return forwardRequest(req, res, errTemplate, next);
};

module.exports.appWithSlash = function(req, res) {
  return res.redirect(req.url + "/");
};
