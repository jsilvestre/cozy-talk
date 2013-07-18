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
        logger.log('Created RTCPeerConnnection with:\n' + '  config: \'' + JSON.stringify(config) + '\';\n' + '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');
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
  var ICEServers, connection, localStream, localstream, logger, mediaConstraints, miniVideo, offerConstraints, onLocalStreamReady, onRemoteStreamAdded, onRemoteStreamRemoved, pc, pcConfig, pcConstraints, remoteStream, remoteVideo, sdpConstraints, xmlhttp, _ref;

  _ref = require('config'), mediaConstraints = _ref.mediaConstraints, pcConfig = _ref.pcConfig, pcConstraints = _ref.pcConstraints, offerConstraints = _ref.offerConstraints, sdpConstraints = _ref.sdpConstraints;

  xmlhttp = remoteVideo = remoteStream = miniVideo = localStream = pc = null;

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

  $(function() {
    remoteVideo = document.getElementById('remoteVideo');
    miniVideo = document.getElementById('miniVideo');
    return localstream.init(function(err, stream) {
      if (err) {
        return logger.handle(err, 'local');
      }
      onLocalStreamReady(stream);
      return ICEServers.makePeerConfig(function(err, config) {
        if (err) {
          return alert(err);
        }
        return connection.init(config, onRemoteStreamAdded, onRemoteStreamRemoved, stream, function(err, peer) {
          if (err) {
            return logger.handle(err, 'peer');
          }
          return console.log("HERE");
        });
      });
    });
  });
  
});
window.require.register("localstream", function(exports, require, module) {
  module.exports.init = function(callback) {
    var err, mediaConstraints, onUserMediaError, onUserMediaSuccess;

    mediaConstraints = require('config').mediaConstraints;
    onUserMediaSuccess = function(stream) {
      console.log('User has granted access to local media.');
      return callback(null, stream);
    };
    onUserMediaError = function(error) {
      return callback(error);
    };
    try {
      getUserMedia(mediaConstraints, onUserMediaSuccess, onUserMediaError);
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
