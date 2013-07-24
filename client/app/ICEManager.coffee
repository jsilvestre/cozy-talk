module.exports = class ICEManager

    @makeCandidate: (c) ->
        label:     c.sdpMLineIndex
        id:        c.sdpMid
        candidate: c.candidate

    @makePeerConfig: () ->
        return require('config').pcConfig

    constructor: (@pc, @socket) ->
        @iceCandidates = []
        @iceCandidateReceiving = false

    onIceCandidate: (event) =>
         if event.candidate
            c = ICEManager.makeCandidate event.candidate

            if @iceCandidateReceiving
                @socket.emit 'candidate', c
            else
                @iceCandidates.push c

    onRemoteIceCandidate: (candidate) =>
        @pc.addIceCandidate new RTCIceCandidate
            sdpMLineIndex: candidate.label
            candidate:     candidate.candidate

    handleCandidates: ->
        @iceCandidateReceiving = true
        for candidate in @iceCandidates
            @socket.emit 'candidate', candidate

