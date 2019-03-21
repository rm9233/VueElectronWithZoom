var $ = require('../lib/index')
  , assert = require('assert')

$.import('Foundation');

assert.ok($.NSObject.methods().length > 0);
