var EventEmitter = require('events').EventEmitter,
    irc = require('irc'),
    common = require('./common'),
    async = common.async,
    await = common.await,
    Log = common.Log,
    sprintf = common.sprintf,
    Promise = common.Promise;

function Bot(username, oauthToken) {
  var emitter = new EventEmitter();
  emitter.setMaxListeners(0);

  var client = new irc.Client('irc.twitch.tv', username, {
    port: 6667,
    showErrors: true,
    password: 'oauth:' + oauthToken.replace(/^oauth:/i, ''),
    userName: username,
    realName: username,
    autoConnect: false,
    showErrors: true,
    stripColors: true,
    secure: false
  });

  client.on('error', function(message) {
    Log.error(sprintf('IRC error: %s', message));
  });

  Log.info('Connecting to Twitch IRC servers.');
  var connect = new Promise(function(resolve, reject) {
    client.connect(5, async(function() {
      Log.info('Connected to Twitch IRC servers.');
      resolve();
    }));
  });

  client.on('message#', async(function(user, channel, message) {
    user = user.trim().toLowerCase();
    if (user == 'jtv') {
      return;
    }

    channel = channel.substr(1).trim().toLowerCase();

    emitter.emit('message', channel, user, message, say(channel), unsafeSay(channel));
  }));

  client.on('join', async(function(channel, user) {
    user = user.trim().toLowerCase();
    if (user == 'jtv') {
      return;
    }

    channel = channel.substr(1).trim().toLowerCase();

    emitter.emit('join', channel, user, say(channel), unsafeSay(channel));
  }));

  client.on('part', async(function(channel, user) {
    user = user.trim().toLowerCase();
    if (user == 'jtv') {
      return;
    }

    channel = channel.substr(1).trim().toLowerCase();

    emitter.emit('part', channel, user, say(channel), unsafeSay(channel));
  }));

  this.join = function(channel) {
    connect.then(function() {
      Log.info(sprintf('Joining #%s.', channel));

      client.join(sprintf('#%s', channel), function() {
        Log.info(sprintf('Joined #%s.', channel));
        emitter.emit('channel', channel, say(channel), unsafeSay(channel));
      });
    });

    return this;
  };

  var say = function(channel) {
    return function(format) {
      if (arguments.length === 1) {
        // No sprintf formatting, escape the escape character.
        format = format.replace('%', '%%');
      }

      var message = sprintf.apply(null, arguments).trim();
      if (message[0] == '.' || message[0] == '/' || message[0] == '!') {
        return;
      }

      client.say(sprintf('#%s', channel), message);
    };
  };

  var unsafeSay = function(channel) {
    return function() {
      client.say(sprintf('#%s', channel), sprintf.apply(null, arguments));
    };
  };

  this.plugin = function(plugin) {
    if (plugin instanceof Array) {
      for (var i = 0; i < plugin.length; ++i) {
        this.plugin(plugin[i]);
      }
    } else {
      plugin.load(emitter);
    }

    return this;
  };
};

module.exports = Bot;
