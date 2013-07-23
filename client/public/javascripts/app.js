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
  var CalleeUser, User, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  User = require('./User');

  module.exports = CalleeUser = (function(_super) {
    __extends(CalleeUser, _super);

    function CalleeUser() {
      _ref = CalleeUser.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CalleeUser.prototype.initialize = function() {
      CalleeUser.__super__.initialize.call(this);
      this.socket.emit('connect', {});
      return this.initializePeerConnection();
    };

    return CalleeUser;

  })(User);
  
});
window.require.register("CallerUser", function(exports, require, module) {
  var CallerUser, User, offerConstraints, sdpConstraints, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  User = require('./User');

  _ref = require('config'), offerConstraints = _ref.offerConstraints, sdpConstraints = _ref.sdpConstraints;

  module.exports = CallerUser = (function(_super) {
    __extends(CallerUser, _super);

    function CallerUser() {
      _ref1 = CallerUser.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    CallerUser.prototype.initialize = function() {
      var _this = this;
      CallerUser.__super__.initialize.call(this);
      return this.socket.on('connect', function() {
        $('#footer').prepend('<li>A friend has connected.</li>');
        return _this.initializePeerConnection();
      });
    };

    CallerUser.prototype.initializePeerConnection = function() {
      var constraints,
        _this = this;
      CallerUser.__super__.initializePeerConnection.call(this);
      constraints = mergeConstraints(offerConstraints, sdpConstraints);
      return this.pc.createOffer(function(offer) {
        console.log("OFFER IS READY");
        _this.pc.setLocalDescription(offer);
        return _this.socket.emit('offer', offer);
      }, null, constraints);
    };

    return CallerUser;

  })(User);
  
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

    return StreamHandler;

  })(Backbone.View);
  
});
window.require.register("User", function(exports, require, module) {
  var RTCPeerConnection, StreamHandler, User, logger, makeCandidate, offerConstraints, pcConstraints, sdpConstraints, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RTCPeerConnection = require('browser-interface').RTCPeerConnection;

  _ref = require('config'), pcConstraints = _ref.pcConstraints, offerConstraints = _ref.offerConstraints, sdpConstraints = _ref.sdpConstraints;

  logger = require('logger');

  StreamHandler = require('./StreamHandler');

  makeCandidate = function(c) {
    return {
      label: c.sdpMLineIndex,
      id: c.sdpMid,
      candidate: c.candidate
    };
  };

  module.exports = User = (function(_super) {
    __extends(User, _super);

    User.prototype.pc = null;

    User.prototype.socket = null;

    function User(socket, config) {
      this.socket = socket;
      this.config = config;
      this.iceCandidates = [];
      this.iceCandidateReceiving = false;
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
      var _this = this;
      this.pc = new RTCPeerConnection(this.config, pcConstraints);
      this.pc.onaddstream = this.onRemoteStreamAdded;
      this.pc.onremovestream = this.onRemoteStreamRemoved;
      this.pc.addStream(this.streamHandler.stream);
      logger.log('Created RTCPeerConnection with:\n' + '  config: \'' + JSON.stringify(this.config) + '\';\n' + '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');
      this.pc.onicecandidate = function(event) {
        var c;
        if (event.candidate) {
          c = makeCandidate(event.candidate);
          if (_this.iceCandidateReceiving) {
            return _this.socket.emit('candidate', c);
          } else {
            return _this.iceCandidates.push(c);
          }
        }
      };
      this.socket.on('offer', function(offer) {
        offer.sdp = addStereo(offer.sdp);
        _this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        return _this.pc.createAnswer(function(answer) {
          var candidate, _i, _len, _ref1;
          console.log("ANSWER IS READY");
          _this.pc.setLocalDescription(answer);
          _this.socket.emit('answer', answer);
          _this.iceCandidateReceiving = true;
          _ref1 = _this.iceCandidates;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            candidate = _ref1[_i];
            _this.socket.emit('candidate', candidate);
          }
          return _this.socket.on('candidate', function(candidate) {
            return _this.pc.addIceCandidate(new RTCIceCandidate({
              sdpMLineIndex: candidate.label,
              candidate: candidate.candidate
            }));
          }, null, sdpConstraints);
        });
      });
      return this.socket.on('answer', function(answer) {
        var candidate, _i, _len, _ref1;
        console.log("RECEIVED ANSWER", answer);
        _this.pc.setRemoteDescription(new RTCSessionDescription(answer));
        _this.iceCandidateReceiving = true;
        _ref1 = _this.iceCandidates;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          candidate = _ref1[_i];
          _this.socket.emit('candidate', candidate);
        }
        return _this.socket.on('candidate', function(candidate) {
          return _this.pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: candidate.label,
            candidate: candidate.candidate
          }));
        });
      });
    };

    User.prototype.onRemoteStreamAdded = function(event) {
      var remoteStreamHandler;
      console.log("Remote stream added.");
      remoteStreamHandler = new StreamHandler({
        el: '#remoteVideo'
      });
      return remoteStreamHandler.attachMediaStream(event.stream);
    };

    User.prototype.onRemoteStreamRemoved = function(event) {
      return console.log("Remote stream removed.");
    };

    return User;

  })(Backbone.Events);
  
});
window.require.register("browser-interface", function(exports, require, module) {
  module.exports.getUserMedia = function(constraints, success, error) {
    var regex, version;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.webkitGetUserMedia) {
      regex = /Chrom(e|ium)\/([0-9]+)\./;
      version = parseInt(navigator.userAgent.match(regex)[2]);
      console.log("Browser: Chrome. Detected version: " + version);
    } else if (navigator.mozGetUserMedia) {
      regex = /Firefox\/([0-9]+)\./;
      version = parseInt(navigator.userAgent.match(regex)[1]);
      console.log("Browser: Firefox. Detected version: " + version);
    } else if (navigator.msGetUserMedia) {
      console.log("Browser: IE.");
    } else {
      console.log("Browser: generic interface.");
    }
    return navigator.getUserMedia(constraints, success, error);
  };

  module.exports.RTCPeerConnection = RTCPeerConnection || mozRTCPeerConnection || webkitRTCPeerConnection;
  
});
window.require.register("config", function(exports, require, module) {
  var mediaConstraints, offerConstraints, pcConfig, pcConstraints, sdpConstraints;

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

  offerConstraints = {
    optional: [],
    mandatory: {}
  };

  sdpConstraints = {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
  };

  module.exports = {
    mediaConstraints: mediaConstraints,
    pcConfig: pcConfig,
    pcConstraints: pcConstraints,
    offerConstraints: offerConstraints,
    sdpConstraints: sdpConstraints
  };
  
});
window.require.register("connection", function(exports, require, module) {
  var initSocket, makeCandidate;

  makeCandidate = function(c) {
    return {
      label: c.sdpMLineIndex,
      id: c.sdpMid,
      candidate: c.candidate
    };
  };

  module.exports.init = function(config, onRemoteStreamAdded, onRemoteStreamRemoved, localStream, callback) {
    return initSocket(function(err, initiator, socket) {
      var constraints, iceCandidateReceiving, iceCandidates, logger, offerConstraints, pc, pcConstraints, sdpConstraints, _ref;
      _ref = require('config'), pcConstraints = _ref.pcConstraints, offerConstraints = _ref.offerConstraints, sdpConstraints = _ref.sdpConstraints;
      logger = require('logger');
      iceCandidates = [];
      iceCandidateReceiving = false;
      try {
        pc = new RTCPeerConnection(config, pcConstraints);
        pc.onaddstream = onRemoteStreamAdded;
        pc.onremovestream = onRemoteStreamRemoved;
        pc.addStream(localStream);
        logger.log('Created RTCPeerConnection with:\n' + '  config: \'' + JSON.stringify(config) + '\';\n' + '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');
        console.log('HERE', initiator);
        pc.onicecandidate = function(event) {
          var c;
          if (event.candidate) {
            c = makeCandidate(event.candidate);
            if (iceCandidateReceiving) {
              return socket.emit('candidate', c);
            } else {
              return iceCandidates.push(c);
            }
          }
        };
        socket.on('offer', function(offer) {
          offer.sdp = addStereo(offer.sdp);
          pc.setRemoteDescription(new RTCSessionDescription(offer));
          return pc.createAnswer(function(answer) {
            var candidate, _i, _len;
            console.log("ANSWER IS READY");
            pc.setLocalDescription(answer);
            socket.emit('answer', answer);
            iceCandidateReceiving = true;
            for (_i = 0, _len = iceCandidates.length; _i < _len; _i++) {
              candidate = iceCandidates[_i];
              socket.emit('candidate', candidate);
            }
            socket.on('candidate', function(candidate) {
              return pc.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: candidate.label,
                candidate: candidate.candidate
              }));
            });
            return callback(null, pc);
          }, null, sdpConstraints);
        });
        socket.on('answer', function(answer) {
          var candidate, _i, _len;
          console.log("RECEIVED ANSWER", answer);
          pc.setRemoteDescription(new RTCSessionDescription(answer));
          iceCandidateReceiving = true;
          for (_i = 0, _len = iceCandidates.length; _i < _len; _i++) {
            candidate = iceCandidates[_i];
            socket.emit('candidate', candidate);
          }
          socket.on('candidate', function(candidate) {
            return pc.addIceCandidate(new RTCIceCandidate({
              sdpMLineIndex: candidate.label,
              candidate: candidate.candidate
            }));
          });
          return callback(null, pc);
        });
        console.log('HERE2', initiator);
        if (initiator) {
          constraints = mergeConstraints(offerConstraints, sdpConstraints);
          return pc.createOffer(function(offer) {
            console.log("OFFER IS READY");
            pc.setLocalDescription(offer);
            return socket.emit('offer', offer);
          }, null, constraints);
        } else {

        }
      } catch (_error) {
        err = _error;
        return callback(err);
      }
    });
  };

  initSocket = function(callback) {
    var pathToSocketIO, socket, url;
    url = window.location.origin;
    pathToSocketIO = "" + (window.location.pathname.substring(1)) + "socket.io";
    socket = io.connect(url, {
      resource: pathToSocketIO
    });
    socket.on('initiator', function(initiator) {
      if (initiator) {
        return socket.on('connect', function() {
          console.log("FRIEND IS HERE");
          return callback(null, initiator, socket);
        });
      } else {
        socket.emit('connect', 'data');
        return callback(null, initiator, socket);
      }
    });
    return socket.on('bye', function() {
      return pc.close();
    });
  };
  
});
window.require.register("ice_servers", function(exports, require, module) {
  module.exports.makePeerConfig = function(callback) {
    var cb, iceServer, iceServers, turnUrl, xmlhttp, _i, _len;
    iceServers = require('config').pcConfig.iceServers;
    cb = function(err) {
      return callback(err, {
        iceServers: iceServers
      });
    };
    return cb();
    if (webrtcDetectedBrowser === 'firefox' && webrtcDetectedVersion <= 22) {
      return cb();
    }
    for (_i = 0, _len = iceServers.length; _i < _len; _i++) {
      iceServer = iceServers[_i];
      if (iceServer.url.substr(0, 5) === 'turn:') {
        return cb();
      }
    }
    if (document.domain.search('localhost') === -1) {
      return cb();
    }
    turnUrl = 'https://computeengineondemand.appspot.com/turn?username=14039877&key=4080218913';
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      var turnServer;
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        turnServer = JSON.parse(xmlhttp.responseText);
        iceServer = createIceServer(turnServer.uris[0], turnServer.username, turnServer.password);
        if (iceServer !== null) {
          iceServers.push(iceServer);
        }
      } else {
        console.log('Request for TURN server failed.');
      }
      return cb();
    };
    xmlhttp.open('GET', turnUrl, true);
    return xmlhttp.send();
  };
  
});
window.require.register("initialize", function(exports, require, module) {
  var CalleeUser, CallerUser, ICEServers, StreamHandler, connection, localStream, localStreamHandler, localstream, logger, mediaConstraints, miniVideo, offerConstraints, onLocalStreamReady, onRemoteStreamAdded, onRemoteStreamRemoved, pc, pcConfig, pcConstraints, remoteStream, remoteVideo, sdpConstraints, xmlhttp, _ref;

  _ref = require('config'), mediaConstraints = _ref.mediaConstraints, pcConfig = _ref.pcConfig, pcConstraints = _ref.pcConstraints, offerConstraints = _ref.offerConstraints, sdpConstraints = _ref.sdpConstraints;

  xmlhttp = remoteVideo = remoteStream = miniVideo = localStream = pc = null;

  localStreamHandler = null;

  onLocalStreamReady = function(stream) {
    return attachMediaStream(miniVideo, stream);
  };

  onRemoteStreamAdded = function(event) {
    console.log('Remote stream added.');
    attachMediaStream(remoteVideo, event.stream);
    return remoteStream = event.stream;
  };

  onRemoteStreamRemoved = function(event) {
    return console.log('Remote stream removed.');
  };

  logger = require('logger');

  localstream = require('localstream');

  connection = require('connection');

  ICEServers = require('ice_servers');

  StreamHandler = require('./StreamHandler');

  CallerUser = require('./CallerUser');

  CalleeUser = require('./CalleeUser');

  $(function() {
    remoteVideo = document.getElementById('remoteVideo');
    localStreamHandler = new StreamHandler({
      el: '#localVideo'
    });
    $('#footer').prepend('<li>Initializing the application...</li>');
    return localstream.init(function(err, stream) {
      if (err) {
        return logger.handle(err, 'local');
      }
      localStreamHandler.attachMediaStream(stream);
      $('#footer').prepend('<li>Local video OK</li>');
      return ICEServers.makePeerConfig(function(err, config) {
        var pathToSocketIO, socket, url, user;
        if (err) {
          return alert(err);
        }
        user = null;
        url = window.location.origin;
        pathToSocketIO = "" + (window.location.pathname.substring(1)) + "socket.io";
        socket = io.connect(url, {
          resource: pathToSocketIO
        });
        return socket.on('initiator', function(initiator) {
          if (initiator) {
            user = new CallerUser(socket, config);
          } else {
            user = new CalleeUser(socket, config);
          }
          user.streamHandler = localStreamHandler;
          return user.initialize();
        });
      });
    });
  });
  
});
window.require.register("localstream", function(exports, require, module) {
  module.exports.init = function(callback) {
    var err, getMedia, mediaConstraints, onUserMediaError, onUserMediaSuccess;
    mediaConstraints = require('config').mediaConstraints;
    getMedia = require('browser-interface').getUserMedia;
    onUserMediaSuccess = function(stream) {
      console.log('User has granted access to local media.');
      return callback(null, stream);
    };
    onUserMediaError = function(error) {
      return callback(error);
    };
    try {
      getMedia(mediaConstraints, onUserMediaSuccess, onUserMediaError);
      return console.log('Requested access to local media with mediaConstraints:\n', '  \'' + JSON.stringify(mediaConstraints) + '\'');
    } catch (_error) {
      err = _error;
      return callback(err);
    }
  };
  
});
window.require.register("logger", function(exports, require, module) {
  module.exports.log = function() {
    return console.log.apply(console, arguments);
  };

  module.exports.status = function(txt) {
    return $('#footer').text(txt);
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
