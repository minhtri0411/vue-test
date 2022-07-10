const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const _ = require('lodash');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', "POST"]
    }
});

// Mockup users
const users = ([
    {
        userId: '111',
        userName: "Kenny Jung",
        roleName: 'Liner Planner'
    },
    {
        userId: '222',
        userName: "Jason Lim",
        roleName: 'Terminal Planner'
    },
    {
        userId: '333',
        userName: "Tom Phillip",
        roleName: 'Ship\'s Captain'
    },
    {
        userId: '444',
        userName: "IU",
        roleName: 'Port Agent'
    }
]);
// io.on('connection', (socket) => {
//     console.log(`user ${socket.id} is connected.`)

//     if (room) {
//         socket.join(room);
//         socket.on('message', data => {
//             socket.to(room).emit('message:received', data);
//             // socket.broadcast.emit('message:received', data)
//         })
//     } else {
//         socket.on('message', data => {
//             socket.broadcast.emit('message:received', data)
//         })
//     }
    
//     socket.on('disconnect', () => {
//         console.log(`user ${socket.id} left.`)
//     })
// })

io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("invalid user"));
    }
    socket.userId = userId;
    next();
});

io.on("connection", (socket) => {
    let usersConnected = [];
    for (let [socketId, socket] of io.of("/").sockets) {
        const user = users.find(item => {
            return item.userId === socket.userId;
        })
        usersConnected.push({socketId, ...user});
    }
    usersConnected = _.uniqBy(usersConnected, 'userId');
    console.log(usersConnected);
    socket.emit("users:connected", usersConnected);

    socket.on("message:private", ({ content, to }) => {
        socket.to(to).emit("message:private", {
          content,
          from: socket.id,
        });
    });

    socket.on('disconnect', () => {
        _.remove(usersConnected, {
            socketId: socket.id
        });

        socket.emit("users:connected", usersConnected);
        console.log(`user ${socket.id} left.`)
    })
});

server.listen(3300, () => {
    console.log('Chat server is running on 3300')
})
