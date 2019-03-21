var $ = require('../lib/index');
var assert = require('assert');

$.import('Foundation');

assert.ok(!$.NSObject('respondsToSelector', 'test'));
assert.ok($.NSObject('respondsToSelector', 'alloc'));
