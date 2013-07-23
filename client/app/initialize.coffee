
{mediaConstraints, pcConfig, pcConstraints,
    offerConstraints, sdpConstraints} = require 'config'

# WILL BREAK
xmlhttp = remoteVideo = remoteStream = miniVideo = localStream = pc = null

localStreamHandler = null

onLocalStreamReady = (stream) ->
    attachMediaStream miniVideo, stream

onRemoteStreamAdded = (event) ->
    console.log('Remote stream added.')
    attachMediaStream remoteVideo, event.stream
    remoteStream = event.stream
    # waitForRemoteVideo()

onRemoteStreamRemoved = (event) ->
    console.log('Remote stream removed.')

logger = require 'logger'
localstream = require 'localstream'
connection  = require 'connection'
ICEServers  = require 'ice_servers'

StreamHandler = require './StreamHandler'
CallerUser = require './CallerUser'
CalleeUser = require './CalleeUser'

$ ->
    localStreamHandler = new StreamHandler
                            el: '#localVideo'

    $('#footer').prepend '<li>Initializing the application...</li>'

    localstream.init (err, stream) ->
        return logger.handle err, 'local' if err

        localStreamHandler.attachMediaStream stream
        $('#footer').prepend '<li>Local video OK</li>'

        ICEServers.makePeerConfig (err, config) ->
            return alert err if err

            user = null
            url = window.location.origin
            pathToSocketIO = "#{window.location.pathname.substring(1)}socket.io"
            socket = io.connect url, resource: pathToSocketIO

            socket.on 'initiator', (initiator) ->

                if initiator
                    user = new CallerUser socket, config
                else
                    user = new CalleeUser socket, config

                user.streamHandler = localStreamHandler
                user.initialize()

