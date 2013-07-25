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


navigator.getUserMedia = navigator.getUserMedia or
                         navigator.webkitGetUserMedia or
                         navigator.mozGetUserMedia or
                         navigator.msGetUserMedia

window.RTCPeerConnection = window.mozRTCPeerConnection or
                           window.RTCPeerConnection or
                           window.webkitRTCPeerConnection

window.RTCSessionDescription = window.mozRTCSessionDescription or
                               window.RTCSessionDescription or
                               window.webkitRTCSessionDescription

window.RTCIceCandidate = window.mozRTCIceCandidate or
                         window.RTCIceCandidate or
                         window.webkitRTCIceCandidate

