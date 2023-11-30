import { Server } from "socket.io";

const io = new Server(3000, {
  cors: {
    origin: "*",
  },
});

let users = [];
let chatrooms = [];

io.on("connection", async (socket) => {
  const { username, socketId, roomId } = socket.handshake.query;
  const me = { username, socketId: socket.id, roomId };

  users.push(me);

  const notConnectedUsers = users.filter((u) => {
    if (u.username != me.username) {
      if (u.roomId == "") {
        return u;
      }
    }
  });
  const anotherUser =
    notConnectedUsers[Math.floor(Math.random() * notConnectedUsers.length)];

  if (anotherUser) {
    const room = `room_${anotherUser.username}_${me.username}`;
    anotherUser.roomId = room;
    me.roomId = room;
    users = users.map((u) => {
      if (u.username == me.username || u.username == anotherUser.username) {
        return { ...u, roomId: room };
      }
    });
    chatrooms.push({ firstUser: anotherUser, secondUser: me });
  }

  console.log(users);
  console.log(chatrooms);

  await socket.on("send-chat-message", ({ sender, message }) => {
    console.log(`${sender}: ${message}`);
    let curChatroom = chatrooms.find((r) => {
      if (
        r.firstUser.socketId == socket.id ||
        r.secondUser.socketId == socket.id
      ) {
        return r;
      }
    });

    console.log(curChatroom?.firstUser.roomId);
    let recipient = {};

    if (curChatroom) {
      if (curChatroom.firstUser.socketId == socket.id) {
        recipient = curChatroom.secondUser;
      } else if (curChatroom.secondUser.socketId == socket.id) {
        recipient = curChatroom.firstUser;
      } else {
        recipient = {};
      }
    }
    console.log(recipient);
    socket.to(recipient.socketId).emit("chat-message", { sender, message });
  });

  await socket.on("disconnect", async () => {
    socket.emit("user-disconnected", me);
    users = users.filter((u) => u.socketId != socket.id);
  });
});
