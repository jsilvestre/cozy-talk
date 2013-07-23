User = require './User'

module.exports = class CalleeUser extends User

    initialize: ->
        super()

        @socket.emit 'connect', {}
        @initializePeerConnection()