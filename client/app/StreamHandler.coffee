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
