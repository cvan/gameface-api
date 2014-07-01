var _ = require('lodash');
var Promise = require('es6-promise').Promise;

var db = require('../db');


var utils = {};
utils.now = function() {
  // Returns a UNIX timestamp.
  return Math.floor((new Date()).getTime() / 1000);
};

const MAX_LEADERBOARD_INCR = 10;
// const TIME_UPDATE_PLAYTIME = 1000 * 60 * 5;  // 5 minutes
const TIME_UPDATE_PLAYTIME = 1000 * 60 * .25;  // 5 minutes


// This manages user state for a single connection.
function User(data) {
  this.authenticated = false;
  this.data = data;
  this.username = data.username;  // TODO: We should have an ID.
  this.id = data.username;
  this.dataChannel = data.dataChannel;  // Redis session.
}


User.prototype = {
  get: function (key) {
    return this.data[key];
  },
  set: function (key, val) {
    return this.data[key] = val;
  },
  update: function (data) {
    return _.merge(this.data);
  },
  authenticate: function () {
    var self = this;

    self.dataChannel.sismember('authenticated', userData.id).then(function (resp) {
      if (resp) {
        console.warn('User is already authenticated');
      }
    });

    self.dataChannel.sismember('users', self.get('username')).then(function (data) {
      console.log('sismember?', data);
      self.dataChannel.incrby('users', 1).then();

      self.update({
        'username': userData.username,
        'id': userData.id,
        'email': userData.email,
        'full': userData
      });

      self.dataChannel.sadd('authenticated', self.get('id'));
    });

    return self.authenticated = true;
  },
  startPlaying: function (game) {
    // TODO: Use the game's `id` instead of `name`.
    if (!this.authenticated) {
      return;
    }

    var timeNow = utils.now();
    var currentlyPlaying = this.get('currentlyPlaying');
    if (currentlyPlaying) {
      clearInterval(this.get('playTimer'));

      var startedPlaying = this.get('startedPlaying');
      this.incrPlaytime(currentlyPlaying, timeNow - startedPlaying);
    }

    // TODO: Validate that game is valid.
    // And validate that user can play/has paid for game.
    this.set('startedPlaying', timeNow);

    // TODO: Use setter and getter for this.
    this.set('currentlyPlaying', game);

    // `currentlyPlaying` is a hashtable of all the games people are
    // currently playing, for example:
    //
    //   {<userID 1>: <gameID 9>,
    //    <userID 3>: <gameID 2>}
    //
    this.dataChannel.hset('currentlyPlaying', this.get('id'), game);

    // Add the userID to this game's set of all historical players.
    this.dataChannel.sadd('gamePlayed:' + game, this.get('id'));

    // Add the userID to this user's set of active historical games played.
    this.dataChannel.sadd('userPlayed:' + this.get('id'), game);

    // Add the userID to this game's set of active players.
    this.dataChannel.sadd('gamePlaying:' + game, this.get('id'));

    // Use a timer to update every few minutes so the data doesn't get stale.
    var self = this;
    this.set('playTimer', setInterval(function () {
      self.incrPlaytime(game, TIME_UPDATE_PLAYTIME);
      self.set('startedPlaying', utils.now());
    }, TIME_UPDATE_PLAYTIME));
  },
  endPlaying: function (game) {
    if (!this.authenticated) {
      return;
    }

    var currentlyPlaying = this.get('currentlyPlaying');
    if (!currentlyPlaying) {
      return;
    }

    this.incrPlaytime(currentlyPlaying, utils.now() - this.get('startedPlaying'));
    this.dataChannel.hdel('currentlyPlaying', this.get('id'));
    this.dataChannel.srem('gamePlaying:' + currentlyPlaying, this.get('id'));

    // Clean up the playtime updater.
    clearInterval(this.get('playTimer'));

    this.set('currentlyPlaying', false);
  },
  incrPlaytime: function (game, amount) {
    if (!this.authenticated || !amount) {
      return;
    }

    this.dataChannel.hincrby(
      'playtime:' + this.get('currentlyPlaying'),
      this.get('id'),
      amount || 0
    );
  }
};

module.exports.User = User;
