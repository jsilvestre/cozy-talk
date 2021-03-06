User = require './User'
{sdpConstraints} = require 'config'
logger = require 'logger'

module.exports = class CallerUser extends User

    initialize: ->
        super()

        @socket.on 'connect', =>
            @socket.removeListener 'answer', @onAnswerReceived
            @socket.removeListener 'candidate', @onAnswerReceived
            logger.status 'A friend has joined the conversation, connecting...'
            @initializePeerConnection()

    initializePeerConnection: ->

        super()

        @pc.createOffer (offer) =>
            console.log "OFFER IS READY"
            @pc.setLocalDescription offer
            @socket.emit 'offer', offer
        , null, sdpConstraints

        @socket.on 'answer', @onAnswerReceived

    onAnswerReceived: (answer) =>
        console.log "RECEIVED ANSWER", answer
        @pc.setRemoteDescription new RTCSessionDescription answer
        @iceManager.handleCandidates()