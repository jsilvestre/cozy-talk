module.exports.init = (callback) ->

    {mediaConstraints} = require 'config'

    onUserMediaSuccess = (stream) ->
        console.log('User has granted access to local media.');
        callback null, stream

    onUserMediaError = (error) ->
        callback error

    #  Call into getUserMedia via the polyfill (adapter.js).
    try
        getUserMedia(mediaConstraints, onUserMediaSuccess,
                   onUserMediaError)
        console.log('Requested access to local media with mediaConstraints:\n',
                  '  \'' + JSON.stringify(mediaConstraints) + '\'')
    catch err
        callback err