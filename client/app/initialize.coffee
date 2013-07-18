
{mediaConstraints, pcConfig, pcConstraints, 
    offerConstraints, sdpConstraints} = require 'config'

# WILL BREAK
xmlhttp = remoteVideo = remoteStream = miniVideo = localStream = pc = null

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

$ ->
    

    remoteVideo = document.getElementById 'remoteVideo'
    miniVideo   = document.getElementById 'miniVideo'
    
    # resetStatus();
    # maybeRequestTurn();

    localstream.init (err, stream) ->
        return logger.handle err, 'local' if err

        onLocalStreamReady stream

        ICEServers.makePeerConfig (err, config) ->
            return alert err if err

            connection.init config, onRemoteStreamAdded, onRemoteStreamRemoved, stream, (err, peer) ->
                return logger.handle err, 'peer' if err

                console.log "HERE"
