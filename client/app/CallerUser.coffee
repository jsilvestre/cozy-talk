User = require './User'
{offerConstraints, sdpConstraints} = require 'config'
module.exports = class CallerUser extends User

    initialize: ->
        super()

        @socket.on 'connect', =>
            $('#footer').prepend('<li>A friend has connected.</li>')
            @initializePeerConnection()

    initializePeerConnection: ->

        super()

        constraints = mergeConstraints(offerConstraints, sdpConstraints)

        # CAREFUL OPUS ?
        @pc.createOffer (offer) =>
            console.log "OFFER IS READY"
            @pc.setLocalDescription offer
            @socket.emit 'offer', offer
        , null, constraints