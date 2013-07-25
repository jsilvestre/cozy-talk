logger        = require 'logger'
StreamHandler = require './StreamHandler'
CallerUser    = require './CallerUser'
CalleeUser    = require './CalleeUser'

$ ->
    # normalize prefixed methods
    require 'browser-interface'

    localStreamHandler = new StreamHandler
                            el: '#localVideo'

    logger.status 'Initializing the application...'

    localStreamHandler.setLocalStream()
    localStreamHandler.on 'error', (err) ->
        logger.status 'This will not work if you dont share your webcam'

    localStreamHandler.on 'localstreamready', (stream) ->
        logger.status 'Local video OK'

        url = window.location.origin
        pathToSocketIO = "#{window.location.pathname.substring(1)}socket.io"
        socket = io.connect url, resource: pathToSocketIO

        socket.on 'initiator', (initiator) ->

            if initiator
                logger.status 'Waiting for a friend to connect...'
                user = new CallerUser socket
            else
                logger.status 'Connecting to a friend...'
                user = new CalleeUser socket

            user.stream = stream
            user.initialize()

