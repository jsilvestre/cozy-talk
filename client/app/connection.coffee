
makeCandidate = (c) ->
    label:     c.sdpMLineIndex
    id:        c.sdpMid
    candidate: c.candidate

module.exports.init = (config, onRemoteStreamAdded, onRemoteStreamRemoved, localStream, callback) ->

    initSocket (err, initiator, socket) ->

        {pcConstraints, offerConstraints, sdpConstraints} = require 'config'
        logger = require 'logger'

        iceCandidates = []
        iceCandidateReceiving = false

        try
            # Create an RTCPeerConnection via the polyfill (adapter.js).

            pc = new RTCPeerConnection config, pcConstraints
            pc.onaddstream = onRemoteStreamAdded
            pc.onremovestream = onRemoteStreamRemoved
            pc.addStream localStream

            logger.log('Created RTCPeerConnection with:\n' +
                      '  config: \'' + JSON.stringify(config) + '\';\n' +
                      '  constraints: \'' + JSON.stringify(pcConstraints) + '\'.');

            console.log 'HERE', initiator

            pc.onicecandidate = (event) ->
                if event.candidate
                    c = makeCandidate event.candidate

                    if iceCandidateReceiving
                        socket.emit 'candidate', c
                    else
                        iceCandidates.push c
                # else
                #     # we have all candidates


            socket.on 'offer', (offer) ->
                offer.sdp = addStereo offer.sdp
                pc.setRemoteDescription new RTCSessionDescription offer
                pc.createAnswer (answer) ->
                    console.log "ANSWER IS READY"
                    pc.setLocalDescription answer
                    socket.emit 'answer', answer

                    iceCandidateReceiving = true
                    for candidate in iceCandidates
                        socket.emit 'candidate', candidate

                    socket.on 'candidate', (candidate) ->
                        pc.addIceCandidate new RTCIceCandidate
                            sdpMLineIndex: candidate.label
                            candidate:     candidate.candidate

                    callback null, pc

                , null, sdpConstraints

            socket.on 'answer', (answer) ->
                console.log "RECEIVED ANSWER", answer
                pc.setRemoteDescription new RTCSessionDescription answer

                iceCandidateReceiving = true
                for candidate in iceCandidates
                    socket.emit 'candidate', candidate

                socket.on 'candidate', (candidate) ->
                    pc.addIceCandidate new RTCIceCandidate
                        sdpMLineIndex: candidate.label
                        candidate:     candidate.candidate

                callback null, pc


            console.log 'HERE2', initiator


            if initiator
                constraints = mergeConstraints(offerConstraints, sdpConstraints)
                # CAREFUL OPUS ?
                pc.createOffer (offer) ->
                    console.log "OFFER IS READY"
                    pc.setLocalDescription offer
                    socket.emit 'offer', offer
                , null, constraints
            else
                # while msgQueue.length > 0
                #     processSignalingMessage msgQueue.shift()

        catch err
            callback err


initSocket = (callback) ->
    url = window.location.origin
    pathToSocketIO = "#{window.location.pathname.substring(1)}socket.io"
    socket = io.connect url, resource: pathToSocketIO

    socket.on 'initiator', (initiator) ->
        if initiator
            socket.on 'connect', ->
                console.log "FRIEND IS HERE"
                callback null, initiator, socket
        else
            socket.emit 'connect', 'data'
            callback null, initiator, socket

    socket.on 'bye', ->
        pc.close()
