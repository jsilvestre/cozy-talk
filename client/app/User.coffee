{pcConstraints, offerConstraints, sdpConstraints} = require 'config'
logger = require 'logger'

StreamHandler = require './StreamHandler'
ICEManager    = require './ICEManager'

module.exports = class User extends Backbone.Events

    pc: null
    socket: null
    stream: null

    constructor: (@socket) ->

    initialize: () ->
        @initializeSocket()

    initializeSocket: ->
        @socket.on 'bye', =>
            @pc.close()

    initializePeerConnection: ->
        config = ICEManager.makePeerConfig()
        @pc = new RTCPeerConnection config, pcConstraints
        @iceManager = new ICEManager @pc, @socket

        @pc.onaddstream    = @onRemoteStreamAdded
        @pc.onremovestream = @onRemoteStreamRemoved

        @pc.addStream @stream

        logger.log('Created RTCPeerConnection with:\n' +
          '  config: \'' + JSON.stringify(@config) + '\';\n' +
          '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.')

        @pc.onicecandidate = @iceManager.onIceCandidate
        @socket.on 'candidate', @iceManager.onRemoteIceCandidate


    onRemoteStreamAdded: (event) ->
        console.log "Remote stream added."
        $('body').addClass 'connected'
        logger.status 'Connected.'
        @remoteStreamHandler = new StreamHandler
                                    el: '#remoteVideo'
        @remoteStreamHandler.attachMediaStream event.stream


    onRemoteStreamRemoved: (event) ->
        console.log "Remote stream removed."
        @remoteStreamHandler.detachMediaStream()