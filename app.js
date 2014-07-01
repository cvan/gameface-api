var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);  // TODO: Serve on HTTPS.
var uuid = require('node-uuid');
var _ = require('lodash');

var db = require('./db');
var Room = require('./lib/room');
var User = require('./lib/user').User;
var settings = require('./settings_local');


if (settings.DEBUG) {
  app.use(express.logger('dev'));
}

app.use(express.static(__dirname + '/media'));


// CORS support
app.all('*', function (req, res, next) {
  if (!req.get('Origin')) {
    return next();
  }
  // Use '*' here to accept any origin.
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS, PATCH, POST, PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  }
  next();
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/client.html');
});


var users = {};
var rooms = {};
var clients = [];

var people = {};
var rooms = {};
var sockets = [];
var chatHistory = {};

var usernames = {};


io.sockets.on('connection', function (socket) {
  console.log('connection');

  var clientData = {};
  var user = {};

  socket.on('authenticate', function (username) {
    username = username || '';
    var ownerRoomID = inRoomID = null;

    if (username.toLowerCase() in usernames) {
      // That username is already taken, so propose a different username.
      var randomNumber = Math.floor(Math.random() * 1001);
      var proposedName = username + randomNumber;
      while (proposedName.toLowerCase() in people) {
        proposedName = username + randomNumber;
      }

      console.log('Username <' + username + '> already exists');

      socket.emit('usernameExists',  {
        msg: 'That username already exists; please pick another one.',
        proposedName: proposedName
      });
    } else {
      clientData = db.redis();

      user = new User({
        dataChannel: clientData,
        username: username,
        owns: ownerRoomID,
        inroom: inRoomID
      });

      usernames[socket.id] = user;

      usernames[username.toLowerCase()] = socket.id;

      socket.emit('notification', 'You have connected to the server.');
      socket.emit('joined');

      var sizePeople = Object.keys(people).length;
      var sizeRooms = Object.keys(rooms).length;

      io.sockets.emit('notification', username + ' is online.');
      io.sockets.emit('update-people', {people: usernames, count: sizePeople});

      socket.emit('roomList', {rooms: rooms, count: sizeRooms});

      user.authenticate();
    }
  });

  socket.on('startPlaying', function () {
    console.log('startPlaying');
    user.startPlaying();
  });

  socket.on('disconnect', function () {
    console.log('disconnect');
    if (user.finish) {
      user.finish();
    }
    if (clientData.end) {
      clientData.end();
    }
  });
});

var port = process.env.PORT || settings.PORT || 7000;

var server = http.listen(port, function (url) {
  var address = server.address();
  console.log('WebSocket server listening at ws://%s:%s',
              address.address, address.port);
});
