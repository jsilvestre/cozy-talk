{RTCPeerConnection} = require('browser-interface')
{pcConstraints, offerConstraints, sdpConstraints} = require 'config'
logger = require 'logger'

StreamHandler = require './StreamHandler'

makeCandidate = (c) ->
    label:     c.sdpMLineIndex
    id:        c.sdpMid
    candidate: c.candidate

module.exports = class User extends Backbone.Events

    pc: null
    socket: null

    constructor: (@socket, @config) ->
        @iceCandidates = []
        @iceCandidateReceiving = false

    initialize: () ->
        @initializeSocket()

    initializeSocket: ->
        @socket.on 'bye', =>
            @pc.close()

    initializePeerConnection: ->
        @pc = new RTCPeerConnection @config, pcConstraints
        @pc.onaddstream = @onRemoteStreamAdded
        @pc.onremovestream = @onRemoteStreamRemoved

        @pc.addStream @streamHandler.stream

        logger.log('Created RTCPeerConnection with:\n' +
          '  config: \'' + JSON.stringify(@config) + '\';\n' +
          '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.')

        @pc.onicecandidate = (event) =>
            if event.candidate
                c = makeCandidate event.candidate

                if @iceCandidateReceiving
                    @socket.emit 'candidate', c
                else
                    @iceCandidates.push c
        @socket.on 'offer', (offer) =>
            offer.sdp = addStereo offer.sdp
            @pc.setRemoteDescription new RTCSessionDescription offer
            @pc.createAnswer (answer) =>
                console.log "ANSWER IS READY"
                @pc.setLocalDescription answer
                @socket.emit 'answer', answer

                @iceCandidateReceiving = true
                for candidate in @iceCandidates
                    @socket.emit 'candidate', candidate

                @socket.on 'candidate', (candidate) =>
                    @pc.addIceCandidate new RTCIceCandidate
                        sdpMLineIndex: candidate.label
                        candidate:     candidate.candidate

                , null, sdpConstraints

        @socket.on 'answer', (answer) =>
            console.log "RECEIVED ANSWER", answer
            @pc.setRemoteDescription new RTCSessionDescription answer

            @iceCandidateReceiving = true
            for candidate in @iceCandidates
                @socket.emit 'candidate', candidate

            @socket.on 'candidate', (candidate) =>
                @pc.addIceCandidate new RTCIceCandidate
                    sdpMLineIndex: candidate.label
                    candidate:     candidate.candidate

    onRemoteStreamAdded: (event) ->
        console.log "Remote stream added."
        remoteStreamHandler = new StreamHandler
                                    el: '#remoteVideo'
        remoteStreamHandler.attachMediaStream event.stream


    onRemoteStreamRemoved: (event) ->
        console.log "Remote stream removed."