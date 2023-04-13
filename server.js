const express = require("express");
const http = require("http");
const app = express();
const path = require('path')

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a catch-all route that serves the index.html file
app.get('*',(req,res) => {
  res.sendFile(__dirname + "/public/index.html")
})

const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};

const socketToRoom = {};

io.on("connection", (socket) => {
  socket.on("join room", (roomID) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 2) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
      console.log(users);
      console.log(users[roomID]);
    }
    socketToRoom[socket.id] = roomID;
    console.log("dsd" + socketToRoom);
    console.log("sfsfsdf" + socketToRoom[socket.id]);
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
      socket.broadcast.emit("user left", socket.id);
    }
  });
});

server.listen(process.env.PORT || 8000, () =>
  console.log("server is running on port 8000")
);
