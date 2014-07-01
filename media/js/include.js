(function () {
//   // Force HTTPS.
//   if ((!window.location.port || window.location.port === '80') &&
//     location.protocol !== 'https:') {
//   window.location.protocol = 'https:';
//   }

var utils = {
  escape: function (string) {
    if (!string) {
      return string;
    }
    return string.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/'/g, '&#39;')
                 .replace(/"/g, '&#34;');
  }
};

// TODO: Add logout screen.
var loginForm = document.querySelector('.login-form');
var loginErrors = document.querySelector('.login-errors');
var gameScreen = document.querySelector('.game-screen');

function show(el) {
  el.classList.remove('hidden');
}

function hide(el) {
  el.classList.add('hidden');
}

function toggle(el) {
  el.classList.toggle('hidden');
}

function reset(el) {
  el.innerHTML = '';
}

function showLoginError(msg) {
  reset(loginErrors);
  show(loginErrors);
  loginErrors.innerHTML = msg;
}

var thisScript = document.currentScript || document.getElementById('server-js');
var settings = {
  host: thisScript.dataset.host,
  uri: '/'
};

var socket;

function connect() {
  return new Promise(function (resolve, reject) {
    // Connect to WebSocket server.
    var host = settings.host || window.location.origin;
    console.log('[websocket] Attempting to connect to server:', host);
    socket = io.connect(host, {
      transports: ['websocket']
    });

    socket.on('connect', function () {
      resolve();
      console.log('[websocket] Client successfully connected to server:', socket.io.uri);
    });
  });
}

var usernameField = document.querySelector('input[name=username]');
var user;

function User(data) {
  this.data = data;
  this.username = this.get('username');
}

User.prototype = {
  get: function (key) {
    return this.data[key];
  },
  set: function (key, val) {
    return this.data[key] = val;
  }
};

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();

  usernameField.blur();

  user = new User({
    username: usernameField.value
  });

  socket.emit('authenticate');
});

gameScreen.addEventListener('click', function (e) {
  e.preventDefault();

  socket.emit('startPlaying');
});

// TODO: Handle reconnections gracefully without resolving the `connect`
// promise over and over.

connect().then(function () {
  console.log('Galaxy ready!');
  // TODO: Add iframe pieces.
  // window.top.postMessage('loaded', origin);
  toggle(loginForm);

  socket.on('joined', function () {
    toggle(loginForm);
    toggle(gameScreen);
    console.log('[websocket] User <' + user.username + '> successfully signed in');
  });

  socket.on('notification', function (msg) {
    console.log('[websocket] Notification from server:', msg);
  });

  socket.on('usernameExists', function (msg) {
    showLoginError(utils.escape(msg.msg) + ' Try <b>' + utils.escape(msg.proposedName) + '</b>.');
  });

}, function (e) {
  console.error(e);
  console.log('[websocket] Client failed to connect to server:', socket.io.uri);
}).catch(console.error.bind(console));

})();
