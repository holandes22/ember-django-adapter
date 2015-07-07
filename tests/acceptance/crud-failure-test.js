import Ember from 'ember';
import {
  module,
  test,
} from 'qunit';
import Pretender from 'pretender';
import startApp from 'dummy/tests/helpers/start-app';

var application;
var store;
var server;


module('Acceptance: CRUD Failure', {
  beforeEach: function() {
    application = startApp();

    store = application.__container__.lookup('store:main');

    server = new Pretender(function() {

      // Permission denied error
      this.get('/test-api/posts/1/', function(request) {
        return [401, {'Content-Type': 'application/json'}, JSON.stringify({detail: 'Authentication credentials were not provided.'})];
      });

      // Server error
      this.get('/test-api/posts/2/', function(request) {
        // This is the default error page for Django when DEBUG is set to False.
        return [500, {'Content-Type': 'application/json'}, JSON.stringify({detail: 'Something bad'})];
      });

      // Create field errors
      this.post('/test-api/posts/', function(request) {
        return [400, {'Content-Type': 'application/json'}, JSON.stringify({
          post_title: ['This field is required.'],
          body: ['This field is required.']
        })];
      });

      // Update field errors
      this.get('/test-api/posts/3/', function(request) {
        return [200, {'Content-Type': 'application/json'}, JSON.stringify({
          id: 3,
          post_title: 'post title 3',
          body: 'post body 3',
          comments: []
        })];
      });
      this.put('/test-api/posts/3/', function(request) {
        return [400, {'Content-Type': 'application/json'}, JSON.stringify({
          post_title: ['Ensure this value has at most 50 characters (it has 53).'],
          body: ['This field is required.']
        })];
      });
    });
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
    server.shutdown();
  }
});

test('Permission denied error', function(assert) {
  assert.expect(4);

  return Ember.run(function() {

    return store.findRecord('post', 1).then({}, function(response) {
      const error = response.errors[0];

      assert.ok(error);
      assert.equal(error.status, 401);
      assert.equal(error.details, 'Authentication credentials were not provided.');
      assert.equal(response.message, 'Unauthorized');
    });
  });
});

test('Server error', function(assert) {
  assert.expect(4);

  return Ember.run(function() {

    return store.findRecord('post', 2).then({}, function(response) {
      const error = response.errors[0];

      assert.ok(response);
      assert.equal(error.status, 500);
      assert.equal(error.details, 'Something bad');
      assert.equal(response.message, 'Internal Server Error');
    });
  });
});

test('Create field errors', function(assert) {
  assert.expect(6);

  return Ember.run(function() {

    var post = store.createRecord('post', {
      postTitle: '',
      body: ''
    });

    return post.save().then({}, function(response) {
      const details = response.errors[0].details;
      assert.ok(response);
      assert.ok(response.errors);

      // Test camelCase field.
      assert.equal(details.postTitle.length, 1);
      assert.equal(details.postTitle[0], 'This field is required.');

      // Test non-camelCase field.
      assert.equal(details.body.length, 1);
      assert.equal(details.body[0], 'This field is required.');
    });
  });
});

test('Update field errors', function(assert) {
  assert.expect(9);

  return Ember.run(function() {

    return store.findRecord('post', 3).then(function(post) {

      assert.ok(post);
      assert.equal(post.get('isDirty'), false);
      post.set('postTitle', 'Lorem ipsum dolor sit amet, consectetur adipiscing el');
      post.set('body', '');
      assert.equal(post.get('isDirty'), true);

      post.save().then({}, function(response) {
        const details = response.errors[0].details;

        assert.ok(response);
        assert.ok(response.errors);

        // Test camelCase field.
        assert.equal(details.postTitle.length, 1);
        assert.equal(details.postTitle[0], 'Ensure this value has at most 50 characters (it has 53).');

        // Test non-camelCase field.
        assert.equal(details.body.length, 1);
        assert.equal(details.body[0], 'This field is required.');
      });
    });
  });
});
