const WebSocket = require('ws');

const socket = new WebSocket("ws://localhost:8000/ws/query");

socket.on('message', (data) => {
    console.log("Message from server:", data.toString());
});

socket.on('open', () => {
    console.log("Connected to WebSocket server");
    socket.send("what is 2+3 and 6*7 and who is the president of Sri Lanka?");
});

socket.on('error', (error) => {
    console.log("WebSocket error:", error);
});

socket.on('close', () => {
    console.log("WebSocket connection closed");
});
