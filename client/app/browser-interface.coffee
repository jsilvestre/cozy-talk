module.exports.getUserMedia = (constraints, success, error) ->

    navigator.getUserMedia = navigator.getUserMedia || \
                            navigator.webkitGetUserMedia || \
                            navigator.mozGetUserMedia || \
                            navigator.msGetUserMedia

    if navigator.webkitGetUserMedia
        regex = /Chrom(e|ium)\/([0-9]+)\./
        version = parseInt navigator.userAgent.match(regex)[2]
        console.log "Browser: Chrome. Detected version: #{version}"
    else if navigator.mozGetUserMedia
        regex = /Firefox\/([0-9]+)\./
        version = parseInt navigator.userAgent.match(regex)[1]
        console.log "Browser: Firefox. Detected version: #{version}"
    else if navigator.msGetUserMedia
        console.log "Browser: IE."
    else
        console.log "Browser: generic interface."

    return navigator.getUserMedia constraints, success, error

  module.exports.RTCPeerConnection = RTCPeerConnection || mozRTCPeerConnection || webkitRTCPeerConnection