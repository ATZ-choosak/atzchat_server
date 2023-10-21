const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
    },
    maxHttpBufferSize: 25e6
});

app.use(express.json())
app.use(cors());


const roomList = [
    {
        roomName: "พูดคุยทั่วไป",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องเล่นเกมส์",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องเรียน",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องระบาย",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "TOXIC ROOM",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องดับจิต",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องเช่าราคาถูก",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องสอบ",
        maxUser: 10,
        userList: []
    },
    {
        roomName: "ห้องปกครอง",
        maxUser: 10,
        userList: []
    },
];

let userOnline = 0

let username_lst = []

app.get("/", (req, res) => {
    res.send({ message: "ok" })
})

app.get("/userList", (req, res) => {
    const room_name = req.query.room
    res.send({ users: roomList.find(room => room.roomName === room_name).userList })
})

app.get("/userOnline", (req, res) => {
    res.send({ userOnline })
})

app.post("/login", (req, res) => {
    let username = req.body.username.trim()
    let id = req.body.id
    if (username_lst.filter(user => user.username === username).length <= 0) {
        username_lst.push({ username, id })
        res.send({ message: "ok" })
    } else {
        res.send({ message: "no" })
    }
})


io.on("connection", (socket) => {
    console.log("a user connected");

    userOnline++;

    io.emit("userOnline", userOnline)

    socket.on("sendMessage", (data) => {
        io.to(data.room).emit("onMessage", data)
    })

    socket.on("upload", (data => {
        io.to(data.room).emit("onMessageImage", data)
    }))

    socket.on("Audiorecord", (data => {
        io.to(data.room).emit("onMessageAudio", data)
    }))

    socket.on("disconnect", () => {

        username_lst = username_lst.filter(user => user.id !== socket.id)
        userOnline--;
        io.emit("userOnline", userOnline)
    })

    socket.on("ListRoom", () => {
        socket.emit("ListRoom", roomList)
    })

    socket.on("join", (data) => {

        socket.join(data.room)
        roomList.find(e => e.roomName === data.room).userList.push({ username: data.username, id: socket.id })
        socket.emit("joined", true)

        io.to(data.room).emit("clientJoinedRoom", { status: "join", username: data.username })

        io.emit("ListRoom", roomList)

    })

    socket.on("leaveRoom", (data) => {


        for (let i = 0; i < roomList.length; i++) {

            if (roomList[i].roomName === data.room) {

                roomList[i].userList = roomList[i].userList.filter(user => user.id !== socket.id)

            }

        }

        socket.leave(data.room)

        io.emit("ListRoom", roomList)
        io.to(data.room).emit("clientDisconnected", { status: "exit", username: data.username })
    })

    socket.on("disconnecting", () => {

        let exitRoom, userExit

        roomList.forEach(data => {

            if (socket.rooms.has(data.roomName)) {

                exitRoom = data.roomName
                userExit = data.userList.find(e => e.id === socket.id).username
            }
        })

        for (let i = 0; i < roomList.length; i++) {

            if (roomList[i].roomName === exitRoom) {

                roomList[i].userList = roomList[i].userList.filter(user => user.id !== socket.id)

            }

        }

        io.emit("ListRoom", roomList)
        io.to(exitRoom).emit("clientDisconnected", { status: "exit", username: userExit })
    })

});


server.listen(3000, () => {
    console.log("listening on *:3000");
});
