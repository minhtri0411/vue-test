const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const _ = require('lodash');
const app = express();

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', "POST"]
    }
});

io.use((socket, next) => {
    const sessionId = socket.handshake.auth.sessionId;
    if (sessionId) {
        // find existing session
        const session = sessionStore.findSession(sessionId);
        if (session) {
            socket.sessionId = sessionId;
            socket.userId = session.userId;
            socket.userName = session.userName;
            return next();
        }
    }

    const userName = socket.handshake.auth.userName;
    if (!userName) {
      return next(new Error("invalid user"));
    }

    // create new session
    socket.sessionId = randomId();
    socket.userId = randomId();
    socket.userName = userName;
    next();
});

io.on("connection", (socket) => {
    sessionStore.saveSession(socket.sessionId, {
        userId: socket.userId,
        userName: socket.userName,
        connected: true,
    });

    socket.emit("session", {
        sessionId: socket.sessionId,
        userId: socket.userId,
        userName: socket.userName
    });

    // join the "userId" room
    socket.join(socket.userId);

    // fetch existing users
    const users = [];
    console.table(sessionStore.findAllSessions())
    sessionStore.findAllSessions().forEach((session) => {
        users.push({
            userId: session.userId,
            userName: session.userName,
            connected: session.connected,
        });
    });
    socket.emit("users", users);

    // notify existing users
    socket.broadcast.emit("user connected", {
        userId: socket.userId,
        userName: socket.userName,
        connected: true,
    });

    socket.on("message:private", ({ content, to }) => {
        console.log('to', to);
        console.log('room', socket.userId);
        socket.to(to).to(socket.userId).emit("message:private", {
            content,
            from: socket.userId,
            to,
        });
    });

    // notify users upon disconnection
    socket.on("disconnect", async () => {
        const matchingSockets = await io.in(socket.userId).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
        // notify other users
        socket.broadcast.emit("user disconnected", socket.userId);
        // update the connection status of the session
        sessionStore.saveSession(socket.sessionId, {
            userId: socket.userId,
            userName: socket.userName,
            connected: false,
        });
        }
    });
});

server.listen(3300, () => {
    console.log('Chat server is running on 3300')
})
