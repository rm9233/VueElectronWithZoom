
/**
 * Module dependencies.
 */

var jade = require('../index');

jade.renderFile('testing/index.jade', { pretty: true, debug: true, compileDebug: false }, function(err, str){
  if (err) throw err;
  console.log(str);
});