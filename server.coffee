#!/usr/bin/env coffee
http = require 'http'
path = require 'path'
fs = require 'fs'
express = require 'express'
app = express()


# Static files

staticServer = express.static __dirname + '/client/public', 
    maxAge: 86400000

app.use '/public', staticServer
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

    ['connect', 'candidate', 'offer', 'answer', 'bye'].forEach (type) ->
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