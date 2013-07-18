module.exports.makePeerConfig = (callback) ->

    {iceServers} = require('config').pcConfig

    cb = (err) -> callback err, iceServers: iceServers

    # RF, let's stick with STUN for now
    # We should try to find a thrustable TURN server or put one in cozy
    return cb()


    # BELOW NOT CALLED
    ##############################################################


    # Skipping TURN Http request for Firefox version <=22.
    # Firefox does not support TURN for version <=22.
    if webrtcDetectedBrowser is 'firefox' and webrtcDetectedVersion <= 22
        return cb()

    # We already have a TURN server configured above
    for iceServer in iceServers when iceServer.url.substr(0, 5) is 'turn:'
        return cb()

    # Not authorized domain. Try with default STUN instead.
    if document.domain.search('localhost') is -1
        return cb()

    # No TURN server. Get one from computeengineondemand.appspot.com.
    turnUrl = 'https://computeengineondemand.appspot.com/turn?username=14039877&key=4080218913';
    xmlhttp = new XMLHttpRequest()
    
    xmlhttp.onreadystatechange = ->
        if xmlhttp.readyState is 4 and xmlhttp.status is 200
            turnServer = JSON.parse(xmlhttp.responseText);
            iceServer = createIceServer(turnServer.uris[0], turnServer.username,
                                          turnServer.password);
          
            iceServers.push iceServer if iceServer isnt null
        
        else
            console.log 'Request for TURN server failed.'

        # If TURN request failed, continue the call with default STUN.
        return cb()

    xmlhttp.open 'GET', turnUrl, true
    xmlhttp.send()