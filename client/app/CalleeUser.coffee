User = require './User'
{sdpConstraints} = require 'config'

module.exports = class CalleeUser extends User

    initialize: ->
        super()

        @socket.emit 'connect', {}
        @initializePeerConnection()

    initializePeerConnection: ->
        super
        @socket.on 'offer', @onOfferReceived

    onOfferReceived: (offer) =>
        console.log "RECEIVED OFFER", offer
        @pc.setRemoteDescription new RTCSessionDescription offer
        @pc.createAnswer (answer) =>
            console.log "SENDING ANSWER"
            @pc.setLocalDescription answer
            @socket.emit 'answer', answer

            @iceManager.handleCandidates()

        , null, sdpConstraints