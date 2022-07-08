const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', "POST"]
    }
});

io.on('connection', (socket) => {
    console.log("Room: ",socket.handshake.query.roomId);
    const room = socket.handshake.query.roomId;
    console.log(`user ${socket.id} is connected.`)

    if (room) {
        socket.join(room);
        socket.on('message', data => {
            socket.to(room).emit('message:received', data);
            // socket.broadcast.emit('message:received', data)
        })
    } else {
        socket.on('message', data => {
            socket.broadcast.emit('message:received', data)
        })
    }
    
    socket.on('disconnect', () => {
        console.log(`user ${socket.id} left.`)
    })
})

server.listen(3300, () => {
    console.log('Chat server is running on 3300')
})
