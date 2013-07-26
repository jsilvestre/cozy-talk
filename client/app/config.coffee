mediaConstraints =
    audio: true,
    video: mandatory: {}, optional: []

pcConfig =
    iceServers: [url: "stun:stun.l.google.com:19302"]

if window.webkitRTCPeerConnection
    pcConstraints =
        optional: [DtlsSrtpKeyAgreement: true]

    sdpConstraints =
        optional: []
        mandatory:
            OfferToReceiveAudio: true
            OfferToReceiveVideo: true
else
    pcConstraints =
        optional: []

    sdpConstraints =
        optional: []
        mandatory:
            OfferToReceiveAudio: true
            OfferToReceiveVideo: true
            MozDontOfferDataChannel: true
module.exports =
    mediaConstraints : mediaConstraints
    pcConfig         : pcConfig
    pcConstraints    : pcConstraints
    sdpConstraints   : sdpConstraints