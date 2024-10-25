const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');

// Increase maximum payload size for file uploads
const io = require('socket.io')(http, {
  maxHttpBufferSize: 1e8, // 100 MB
});

// Serve static files from the parent directory (your project folder)
app.use(express.static(path.join(__dirname, '..')));

// Store messages with timestamps and IDs
let messages = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send existing messages to the new client
  messages.forEach((msgData) => {
    socket.emit('chat message', msgData);
  });

  // Handle incoming messages
  socket.on('chat message', (msgData) => {
    // Assign a unique ID to the message
    msgData.id = `${socket.id}_${Date.now()}`;

    // Add serverTime to the message
    msgData.serverTime = Date.now();

    // Store the message
    messages.push(msgData);

    // Broadcast message to other clients
    socket.broadcast.emit('chat message', msgData);

    // Schedule message deletion
    setTimeout(() => {
      // Remove the message from the server
      messages = messages.filter((msg) => msg.id !== msgData.id);

      // Notify clients to remove the message
      io.emit('delete message', msgData);
    }, 60000); // 1 minute
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
