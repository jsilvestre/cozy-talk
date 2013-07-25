module.exports.log = () ->
	console.log.apply console, arguments

module.exports.status = (txt) ->
    $('#log').text txt

module.exports.handle = (err, type) ->
    msgs =
        'local' : 'Failed to get access to local media. Error code was '
        'peer' : 'Failed to create PeerConnection, exception: '

    console.log 'error', type, err
    alert (msgs[type] or 'Error : ') + (err.message or err.code or err)