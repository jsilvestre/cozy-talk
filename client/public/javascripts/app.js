(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.brunch = true;
})();

window.require.register("CalleeUser", function(exports, require, module) {
  var CalleeUser, User, sdpConstraints, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  User = require('./User');

  sdpConstraints = require('config').sdpConstraints;

  module.exports = CalleeUser = (function(_super) {
    __extends(CalleeUser, _super);

    function CalleeUser() {
      this.onOfferReceived = __bind(this.onOfferReceived, this);
      _ref = CalleeUser.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CalleeUser.prototype.initialize = function() {
      CalleeUser.__super__.initialize.call(this);
      this.socket.emit('connect', {});
      return this.initializePeerConnection();
    };

    CalleeUser.prototype.initializePeerConnection = function() {
      CalleeUser.__super__.initializePeerConnection.apply(this, arguments);
      return this.socket.on('offer', this.onOfferReceived);
    };

    CalleeUser.prototype.onOfferReceived = function(offer) {
      var _this = this;
      console.log("RECEIVED OFFER", offer);
      this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      return this.pc.createAnswer(function(answer) {
        console.log("SENDING ANSWER");
        _this.pc.setLocalDescription(answer);
        _this.socket.emit('answer', answer);
        return _this.iceManager.handleCandidates();
      }, null, sdpConstraints);
    };

    return CalleeUser;

  })(User);
  
});
window.require.register("CallerUser", function(exports, require, module) {
  var CallerUser, User, logger, sdpConstraints, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  User = require('./User');

  sdpConstraints = require('config').sdpConstraints;

  logger = require('logger');

  module.exports = CallerUser = (function(_super) {
    __extends(CallerUser, _super);

    function CallerUser() {
      this.onAnswerReceived = __bind(this.onAnswerReceived, this);
      _ref = CallerUser.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CallerUser.prototype.initialize = function() {
      var _this = this;
      CallerUser.__super__.initialize.call(this);
      return this.socket.on('connect', function() {
        _this.socket.removeListener('answer', _this.onAnswerReceived);
        _this.socket.removeListener('candidate', _this.onAnswerReceived);
        logger.status('A friend has joined the conversation, connecting...');
        return _this.initializePeerConnection();
      });
    };

    CallerUser.prototype.initializePeerConnection = function() {
      var _this = this;
      CallerUser.__super__.initializePeerConnection.call(this);
      this.pc.createOffer(function(offer) {
        console.log("OFFER IS READY");
        _this.pc.setLocalDescription(offer);
        return _this.socket.emit('offer', offer);
      }, null, sdpConstraints);
      return this.socket.on('answer', this.onAnswerReceived);
    };

    CallerUser.prototype.onAnswerReceived = function(answer) {
      console.log("RECEIVED ANSWER", answer);
      this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      return this.iceManager.handleCandidates();
    };

    return CallerUser;

  })(User);
  
});
window.require.register("ICEManager", function(exports, require, module) {
  var ICEManager,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = ICEManager = (function() {
    ICEManager.makeCandidate = function(c) {
      return {
        label: c.sdpMLineIndex,
        id: c.sdpMid,
        candidate: c.candidate
      };
    };

    ICEManager.makePeerConfig = function() {
      return require('config').pcConfig;
    };

    function ICEManager(pc, socket) {
      this.pc = pc;
      this.socket = socket;
      this.onRemoteIceCandidate = __bind(this.onRemoteIceCandidate, this);
      this.onIceCandidate = __bind(this.onIceCandidate, this);
      this.iceCandidates = [];
      this.iceCandidateReceiving = false;
    }

    ICEManager.prototype.onIceCandidate = function(event) {
      var c;
      if (event.candidate) {
        c = ICEManager.makeCandidate(event.candidate);
        if (this.iceCandidateReceiving) {
          return this.socket.emit('candidate', c);
        } else {
          return this.iceCandidates.push(c);
        }
      }
    };

    ICEManager.prototype.onRemoteIceCandidate = function(candidate) {
      return this.pc.addIceCandidate(new RTCIceCandidate({
        sdpMLineIndex: candidate.label,
        candidate: candidate.candidate
      }));
    };

    ICEManager.prototype.handleCandidates = function() {
      var candidate, _i, _len, _ref, _results;
      this.iceCandidateReceiving = true;
      _ref = this.iceCandidates;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        candidate = _ref[_i];
        _results.push(this.socket.emit('candidate', candidate));
      }
      return _results;
    };

    return ICEManager;

  })();
  
});
window.require.register("StreamHandler", function(exports, require, module) {
  var StreamHandler, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = StreamHandler = (function(_super) {
    __extends(StreamHandler, _super);

    function StreamHandler() {
      _ref = StreamHandler.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    StreamHandler.prototype.tagName = 'video';

    StreamHandler.prototype.stream = null;

    StreamHandler.prototype.attachMediaStream = function(stream) {
      this.stream = stream;
      if (typeof this.el.srcObject !== "undefined") {
        return this.el.srcObject = this.stream;
      } else if (typeof this.el.mozSrcObject !== "undefined") {
        return this.el.mozSrcObject = this.stream;
      } else if (typeof this.el.src !== "undefined") {
        return this.el.src = URL.createObjectURL(this.stream);
      } else {
        return console.log("StreamHandler > Error attaching the stream.");
      }
    };

    StreamHandler.prototype.detachMediaStream = function() {};

    StreamHandler.prototype.setLocalStream = function() {
      var err, mediaConstraints, onUserMediaError, onUserMediaSuccess,
        _this = this;
      mediaConstraints = require('config').mediaConstraints;
      try {
        onUserMediaSuccess = function(stream) {
          console.log('User has granted access to local media.');
          _this.attachMediaStream(stream);
          return _this.trigger('localstreamready', stream);
        };
        onUserMediaError = function(error) {
          console.log("ERROR HERE");
          return _this.trigger('error', error);
        };
        navigator.getUserMedia(mediaConstraints, onUserMediaSuccess, onUserMediaError);
        return console.log('Requested access to local media with mediaConstraints:\n', '  \'' + JSON.stringify(mediaConstraints) + '\'');
      } catch (_error) {
        err = _error;
        return this.trigger(err);
      }
    };

    return StreamHandler;

  })(Backbone.View);
  
});
window.require.register("User", function(exports, require, module) {
  var ICEManager, StreamHandler, User, logger, offerConstraints, pcConstraints, sdpConstraints, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('config'), pcConstraints = _ref.pcConstraints, offerConstraints = _ref.offerConstraints, sdpConstraints = _ref.sdpConstraints;

  logger = require('logger');

  StreamHandler = require('./StreamHandler');

  ICEManager = require('./ICEManager');

  module.exports = User = (function(_super) {
    __extends(User, _super);

    User.prototype.pc = null;

    User.prototype.socket = null;

    User.prototype.stream = null;

    function User(socket) {
      this.socket = socket;
    }

    User.prototype.initialize = function() {
      return this.initializeSocket();
    };

    User.prototype.initializeSocket = function() {
      var _this = this;
      return this.socket.on('bye', function() {
        return _this.pc.close();
      });
    };

    User.prototype.initializePeerConnection = function() {
      var config;
      config = ICEManager.makePeerConfig();
      this.pc = new RTCPeerConnection(config, pcConstraints);
      this.iceManager = new ICEManager(this.pc, this.socket);
      this.pc.onaddstream = this.onRemoteStreamAdded;
      this.pc.onremovestream = this.onRemoteStreamRemoved;
      this.pc.addStream(this.stream);
      logger.log('Created RTCPeerConnection with:\n' + '  config: \'' + JSON.stringify(this.config) + '\';\n' + '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');
      this.pc.onicecandidate = this.iceManager.onIceCandidate;
      return this.socket.on('candidate', this.iceManager.onRemoteIceCandidate);
    };

    User.prototype.onRemoteStreamAdded = function(event) {
      console.log("Remote stream added.");
      $('body').addClass('connected');
      logger.status('Connected.');
      this.remoteStreamHandler = new StreamHandler({
        el: '#remoteVideo'
      });
      return this.remoteStreamHandler.attachMediaStream(event.stream);
    };

    User.prototype.onRemoteStreamRemoved = function(event) {
      console.log("Remote stream removed.");
      return this.remoteStreamHandler.detachMediaStream();
    };

    return User;

  })(Backbone.Events);
  
});
window.require.register("browser-interface", function(exports, require, module) {
  var logger, regex, version;

  logger = require('logger');

  if (navigator.webkitGetUserMedia) {
    regex = /Chrom(e|ium)\/([0-9]+)\./;
    version = parseInt(navigator.userAgent.match(regex)[2]);
    logger.status("Browser: Chrome. Detected version: " + version);
  } else if (navigator.mozGetUserMedia) {
    regex = /Firefox\/([0-9]+)\./;
    version = parseInt(navigator.userAgent.match(regex)[1]);
    logger.status("Browser: Firefox. Detected version: " + version);
  } else if (navigator.msGetUserMedia) {
    logger.status("Browser: IE.");
  } else {
    logger.status("Browser: generic interface.");
  }

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  window.RTCPeerConnection = window.mozRTCPeerConnection || window.RTCPeerConnection || window.webkitRTCPeerConnection;

  window.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription || window.webkitRTCSessionDescription;

  window.RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate || window.webkitRTCIceCandidate;
  
});
window.require.register("config", function(exports, require, module) {
  var mediaConstraints, pcConfig, pcConstraints, sdpConstraints;

  mediaConstraints = {
    audio: true,
    video: {
      mandatory: {},
      optional: []
    }
  };

  pcConfig = {
    iceServers: [
      {
        url: "stun:stun.l.google.com:19302"
      }
    ]
  };

  pcConstraints = {
    optional: [
      {
        DtlsSrtpKeyAgreement: true
      }
    ]
  };

  sdpConstraints = {
    optional: [],
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
  };

  module.exports = {
    mediaConstraints: mediaConstraints,
    pcConfig: pcConfig,
    pcConstraints: pcConstraints,
    sdpConstraints: sdpConstraints
  };
  
});
window.require.register("initialize", function(exports, require, module) {
  var CalleeUser, CallerUser, StreamHandler, logger;

  logger = require('logger');

  StreamHandler = require('./StreamHandler');

  CallerUser = require('./CallerUser');

  CalleeUser = require('./CalleeUser');

  $(function() {
    var localStreamHandler;
    require('browser-interface');
    localStreamHandler = new StreamHandler({
      el: '#localVideo'
    });
    logger.status('Initializing the application...');
    localStreamHandler.setLocalStream();
    localStreamHandler.on('error', function(err) {
      return logger.status('This will not work if you dont share your webcam');
    });
    return localStreamHandler.on('localstreamready', function(stream) {
      var pathToSocketIO, socket, url;
      logger.status('Local video OK.');
      url = window.location.origin;
      pathToSocketIO = "" + (window.location.pathname.substring(1)) + "socket.io";
      socket = io.connect(url, {
        resource: pathToSocketIO
      });
      socket.on('initiator', function(initiator) {
        var user;
        console.log("Got initiator: ", initiator);
        if (initiator) {
          logger.status('Waiting for a friend to connect...');
          user = new CallerUser(socket);
        } else {
          logger.status('Connecting to a friend...');
          user = new CalleeUser(socket);
        }
        user.stream = stream;
        return user.initialize();
      });
      $('#mute-microphone').click(function() {
        var audioTrack, buttonLabel, _i, _len, _ref;
        console.log("Toggle microphone !");
        _ref = localStreamHandler.stream.getAudioTracks();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          audioTrack = _ref[_i];
          audioTrack.enabled = !audioTrack.enabled;
        }
        if (audioTrack != null ? audioTrack.enabled : void 0) {
          buttonLabel = 'Mute mic';
        } else {
          buttonLabel = 'Unmute mic';
        }
        return $('#mute-microphone').text(buttonLabel);
      });
      return $('#hide-camera').click(function() {
        var buttonLabel, videoTrack, _i, _len, _ref;
        console.log("Toggle camera !");
        _ref = localStreamHandler.stream.getVideoTracks();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          videoTrack = _ref[_i];
          videoTrack.enabled = !videoTrack.enabled;
        }
        if (videoTrack != null ? videoTrack.enabled : void 0) {
          buttonLabel = 'Hide camera';
        } else {
          buttonLabel = 'Show camera';
        }
        return $('#hide-camera').text(buttonLabel);
      });
    });
  });
  
});
window.require.register("logger", function(exports, require, module) {
  module.exports.log = function() {
    return console.log.apply(console, arguments);
  };

  module.exports.status = function(txt) {
    return $('#log').text(txt);
  };

  module.exports.handle = function(err, type) {
    var msgs;
    msgs = {
      'local': 'Failed to get access to local media. Error code was ',
      'peer': 'Failed to create PeerConnection, exception: '
    };
    console.log('error', type, err);
    return alert((msgs[type] || 'Error : ') + (err.message || err.code || err));
  };
  
});
