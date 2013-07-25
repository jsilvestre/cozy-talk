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
        logger.status 'Local video OK.'

        url = window.location.origin
        pathToSocketIO = "#{window.location.pathname.substring(1)}socket.io"
        socket = io.connect url, resource: pathToSocketIO

        socket.on 'initiator', (initiator) ->
            console.log "Got initiator: ", initiator
            if initiator
                logger.status 'Waiting for a friend to connect...'
                user = new CallerUser socket
            else
                logger.status 'Connecting to a friend...'
                user = new CalleeUser socket

            user.stream = stream
            user.initialize()

        $('#mute-microphone').click ->
            console.log "Toggle microphone !"
            for audioTrack in localStreamHandler.stream.getAudioTracks()
                audioTrack.enabled = !audioTrack.enabled

            if audioTrack?.enabled
                buttonLabel = 'Mute mic'
            else
                buttonLabel = 'Unmute mic'
            $('#mute-microphone').text buttonLabel

        $('#hide-camera').click ->
            console.log "Toggle camera !"
            for videoTrack in localStreamHandler.stream.getVideoTracks()
                videoTrack.enabled = !videoTrack.enabled

            if videoTrack?.enabled
                buttonLabel = 'Hide camera'
            else
                buttonLabel = 'Show camera'
            $('#hide-camera').text buttonLabel