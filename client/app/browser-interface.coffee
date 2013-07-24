logger = require 'logger'

if navigator.webkitGetUserMedia
    regex = /Chrom(e|ium)\/([0-9]+)\./
    version = parseInt navigator.userAgent.match(regex)[2]
    logger.status "Browser: Chrome. Detected version: #{version}"
else if navigator.mozGetUserMedia
    regex = /Firefox\/([0-9]+)\./
    version = parseInt navigator.userAgent.match(regex)[1]
    logger.status "Browser: Firefox. Detected version: #{version}"
else if navigator.msGetUserMedia
    logger.status "Browser: IE."
else
    logger.status "Browser: generic interface."


navigator.getUserMedia = navigator.getUserMedia || \
                            navigator.webkitGetUserMedia || \
                            navigator.mozGetUserMedia || \
                            navigator.msGetUserMedia

window.RTCPeerConnection = window.RTCPeerConnection || \
                                   window.mozRTCPeerConnection || \
                                   window.webkitRTCPeerConnection

window.RTCSessionDescription = window.RTCSessionDescription || \
                                   window.mozRTCSessionDescription || \
                                   window.webkitRTCSessionDescription

window.RTCIceCandidate = window.RTCIceCandidate || \
                                   window.mozRTCIceCandidate || \
                                   window.webkitRTCIceCandidate

