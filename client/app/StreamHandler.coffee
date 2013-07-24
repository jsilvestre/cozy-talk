module.exports = class StreamHandler extends Backbone.View

    tagName: 'video'

    stream: null

    attachMediaStream: (stream) ->
        @stream = stream

        if typeof(@el.srcObject) isnt "undefined"
            @el.srcObject = @stream
        else if typeof(@el.mozSrcObject) isnt "undefined"
            @el.mozSrcObject = @stream
        else if typeof(@el.src) isnt "undefined"
            @el.src = URL.createObjectURL @stream
        else
            console.log "StreamHandler > Error attaching the stream."

        #@el.play() # useless ?


    detachMediaStream: ->
        # @TODO

    setLocalStream: ->
        {mediaConstraints} = require 'config'


        try
            onUserMediaSuccess = (stream) =>
                console.log('User has granted access to local media.');
                @attachMediaStream stream
                @trigger 'localstreamready', stream

            onUserMediaError = (error) =>
                console.log "ERROR HERE"
                @trigger 'error', error

            navigator.getUserMedia mediaConstraints, onUserMediaSuccess, onUserMediaError
            console.log('Requested access to local media with mediaConstraints:\n',
                      '  \'' + JSON.stringify(mediaConstraints) + '\'')
        catch err
            @trigger err