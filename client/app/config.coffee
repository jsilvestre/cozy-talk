mediaConstraints =
    audio: true,
    video: mandatory: {}, optional: []

if window.mozRTCPeerConnection
    pcConfig =
        iceServers: [url: "stun:23.21.150.121"]
    pcConstraints =
        optional: []
else
    pcConfig =
        iceServers: [url: "stun:stun.l.google.com:19302"]
    pcConstraints =
            optional: [DtlsSrtpKeyAgreement: true]


sdpConstraints =
    optional: []
    mandatory:
        OfferToReceiveAudio: true
        OfferToReceiveVideo: true

module.exports =
    mediaConstraints : mediaConstraints
    pcConfig         : pcConfig
    pcConstraints    : pcConstraints
    sdpConstraints   : sdpConstraints