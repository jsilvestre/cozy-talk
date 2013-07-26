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
            inline = 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890abc\r\nc=IN'
            if offer.sdp.indexOf('a=crypto') == -1
                offer.sdp = offer.sdp.replace(/c=IN/g, inline)
            @pc.setLocalDescription offer
            @socket.emit 'offer', offer
        , null, sdpConstraints

        @socket.on 'answer', @onAnswerReceived

    onAnswerReceived: (answer) =>
        console.log "RECEIVED ANSWER", answer
        @pc.setRemoteDescription new RTCSessionDescription answer
        @iceManager.handleCandidates()