---
layout: post
category : tutorial
tags : tutorial, development
title: "How to: create a simple webrtc app"
author: Romain Foucault & Joseph Silvestre
description: "This tutorial whalk you through the creation of a structured webrtc application."
---

So we were looking for good and clear webrtc tutorial but we add trouble finding something both simple and clear.

Code samples use requires, coffeescript’s class and some Backbone, but should be pretty straight forward. Feel free to ask in the comments or on #cozycloud if you have question.

First Stepm :  Normalize All the Browsers !
============================================

Nothing fancy here, we just reassign vendor-prefixed name to cannonical name.
{% highlight coffee %}
navigator.getUserMedia = navigator.getUserMedia or
                         navigator.webkitGetUserMedia or
                         navigator.mozGetUserMedia or
                         navigator.msGetUserMedia

window.RTCPeerConnection = window.RTCPeerConnection or
                           window.mozRTCPeerConnection or
                           window.webkitRTCPeerConnection

window.RTCSessionDescription = window.RTCSessionDescription or
                               window.mozRTCSessionDescription or
                               window.webkitRTCSessionDescription

window.RTCIceCandidate = window.RTCIceCandidate or
                         window.mozRTCIceCandidate or
                         window.webkitRTCIceCandidate
{% endhighlight %}

Second Step : Get the user’s local media stream.
=================================================

We create a index.html with

{% highlight html %}
<video id="localVideo" autoplay="autoplay" muted="true"></video>
{% endhighlight %}

and a Backone view to manage it :

{% highlight coffee %}
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


    detachMediaStream: ->
        # @TODO

    setLocalStream: ->
        {mediaConstraints} = require 'config'


        try
            onUserMediaSuccess = (stream) =>
                console.log('User has granted access to local media.');
                @attachMediaStream stream
                @trigger 'localstreamready', stream

            onUserMediaError = (error) =>
                console.log "ERROR HERE"
                @trigger 'error', error

            navigator.getUserMedia mediaConstraints, onUserMediaSuccess, onUserMediaError
            console.log('Requested access to local media with mediaConstraints:\n',
                      '  \'' + JSON.stringify(mediaConstraints) + '\'')
        catch err
            @trigger err
{% endhighlight %}

Then we instanciate this view, and pass it the localVideo el

{% highlight coffee %}
localStreamHandler = new StreamHandler
                            el: '#localVideo'
localStreamHandler.setLocalStream()
{% endhighlight %}

And voilà, we made a mirror.

Third Step : Make a server
============================

WebRTC allows peer to peer stream, however we need a server to pass around some piece of informations : We will use express and socket.io, d

{% highlight json %}
{
  "name": "cozy-talk",
  "version": "0.0.1",
  "description": "A cozy application to talk to your friends.",
  "main": "server.coffee",
  "dependencies": {
    "express": "~3.1.0",
    "socket.io": "~0.9.16"
  },
  "scripts": {
    "start": "coffee server.coffee"
  },
  "repository": "https://github.com/mycozycloud/cozy-contacts",
  "author": "Romain M. Foucault",
  "readmeFilename": "README.md",
  "cozy-permissions": {
    "Contact": {
      "description": "Creates and edits your contacts."
    },
    "CozyInstance": {
      "description": "Read language setting"
    }
  }
}
{% endhighlight %}

{% highlight coffee %}
#!/usr/bin/env coffee
http = require 'http'
path = require 'path'
fs = require 'fs'
express = require 'express'
app = express()


# Static files

staticServer = express.static __dirname + '/client/public',
    maxAge: 86400000

app.use '/', staticServer
app.use staticServer

# Logger for non static-files

app.use express.logger 'dev'
app.use express.errorHandler
    dumpExceptions: true
    showStack: true

server = require('http').createServer(app)

io = require('socket.io').listen(server)
io.set 'log level', 1


initiator = true

io.sockets.on 'connection', (socket) ->

    console.log "ONE CLIENT CONNECTED", initiator
    socket.emit 'initiator', initiator
    initiator = false

    ['connect', 'offer', 'candidate', 'answer', 'bye'].forEach (type) ->
        socket.on type, (data) ->
            console.log 'broadcasting', type
            socket.broadcast.emit type, data

    socket.on 'disconnect', ->
        console.log "ONE CIENT DISCONNECTED"
        initiator = true if io.sockets.clients().length is 1

# Start Server

port = process.env.PORT or 9250
host = process.env.HOST or "127.0.0.1"

server.listen port, host, ->
    console.log "Server listening on %s:%d within %s environment",
        host, port, app.get('env')
{% endhighlight %}

Basically, we just broadcast all received messages to all other peers. The only interesting part is the initiator variable : first client to connect receive an initiator = true message whereas the second client will get an initiator = false.


Ok, we are all set, let’s get started on actual RPC


Fourth Step : Handling ICE
============================

A RTC Connection rely on the ICE Framework (RFC 5245) to connect the two browser despite any NAT that could appears between the two. This inlvolves two concepts : ICE Servers and ICE Candidate.

An ICE Candidate is an option to access your browser : for instance, your browser right now can be accessible via 192.168.0.21:12345 (LAN) or 89.125.192.5:12345 (Internet). Candidates need to be exchanged between the two clients.

There is two types of ICE Servers :
STUN allows your browser to discover its own IP adress and open port
TURN creates a tunnel between your browser and a public IP adress

ICE Servers allows to make more ICE Candidates, and the more ICE Candidates you have, the more likely you are that one of them will establish a connection.

ICE Candidates needs to be exchanged one by one as they arrive slowly and not all at once. This can be a problem as we want to wait for the offer/answer cycle to be finished before exchanging them. So we create a simple Class to queue them while we do the offer/answer and then flush them.

{% highlight coffee %}
module.exports = class ICEManager

    @makeCandidate: (c) ->
        label:     c.sdpMLineIndex
        id:        c.sdpMid
        candidate: c.candidate

    @makePeerConfig: () ->
        return require('config').pcConfig

    constructor: (@pc, @socket) ->
        @iceCandidates = []
        @iceCandidateReceiving = false

    onIceCandidate: (event) =>
         if event.candidate
            c = ICEManager.makeCandidate event.candidate

            if @iceCandidateReceiving
                @socket.emit 'candidate', c
            else
                @iceCandidates.push c

    onRemoteIceCandidate: (candidate) =>
        @pc.addIceCandidate new RTCIceCandidate
            sdpMLineIndex: candidate.label
            candidate:     candidate.candidate

    handleCandidates: ->
        @iceCandidateReceiving = true
        for candidate in @iceCandidates
            @socket.emit 'candidate', candidate


{% endhighlight %}


Fifth Step : The RTCPeerConnection
===================================


{% highlight coffee %}
[initialize Peer Connection]
we call RTCPeer Connection with arguments :
config : the ice servers
Constraints : this should solve some problem with FF - Chrome connection.

We instanciate the IceManager
We attach onaddstream and onremovestream : basically just show the video.

We add the local stream

We delegate icecandidates to the icemanager

Now we need different course of action depending of if the user is initiator or not.

{% endhighlight %}


For the Caller
---------------
We wait for the ‘connect’ message, indicating the peer as joined the signaling channel, then we start the connection.
Once the peer connection is ready, we have it create an offer and send it to the peer
We then wait for the answer and set it as remote.
Finally, we flush the iceManager

For the Callee
---------------
We emit the expected ‘connect’ message, prepare the connection, then wait for the offer.
Once we receive the offer we set it  as remote, create an answer and send it the peer.
Finally we flush the iceManager.


Bootstrapping
==============

{% highlight coffee %}
    localStreamHandler.on 'localstreamready', (stream) ->
        logger.status 'Local video OK'

        url = window.location.origin
        pathToSocketIO = "#{window.location.pathname.substring(1)}socket.io"
        socket = io.connect url, resource: pathToSocketIO

        socket.on 'initiator', (initiator) ->

            if initiator
                user = new CallerUser socket
            else
                user = new CalleeUser socket

            user.stream = stream
            user.initialize()
{% endhighlight %}

