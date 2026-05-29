require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");

connectToDB();

const server = app.listen(3000, () => {
  console.log("Server is running on PORT 3000");
});

// Increase timeout for long-running requests (PDF generation)
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 65000; // Keep-alive timeout

// Handle server errors
server.on("clientError", (err, socket) => {
  console.error("Client Error:", err);
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  }
});


console.log("GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY);
console.log(
  "GOOGLE_API_KEY prefix:",
  process.env.GOOGLE_API_KEY?.substring(0, 10)
);