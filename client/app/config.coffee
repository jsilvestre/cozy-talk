mediaConstraints = 
    audio: true, 
    video: mandatory: {}, optional: []

pcConfig = 
    iceServers: [url: "stun:stun.l.google.com:19302"]

pcConstraints = 
    optional: [DtlsSrtpKeyAgreement: true]

offerConstraints = 
    optional: []
    mandatory: {}

sdpConstraints = 
    mandatory:
        OfferToReceiveAudio: true
        OfferToReceiveVideo: true 

module.exports = 
    mediaConstraints : mediaConstraints
    pcConfig         : pcConfig
    pcConstraints    : pcConstraints
    offerConstraints : offerConstraints
    sdpConstraints   : sdpConstraints