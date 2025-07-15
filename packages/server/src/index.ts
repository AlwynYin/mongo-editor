import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { config } from 'dotenv';
import { collectionsRouter } from './routes/collections';
import { setMongoConnection } from './mongoConnection';
import { EditorWebSocketServer } from './websocket/editorWebSocket';

config();

// Initialize MongoDB connection
setMongoConnection();

const app: Express = express();
const server = http.createServer(app);
const port = process.env.PORT || 4001;

// Initialize WebSocket server
const wsServer = new EditorWebSocketServer();

// Make WebSocket server available to routes
app.locals.wsServer = wsServer;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/collections', collectionsRouter);

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  
  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add WebSocket stats endpoint
app.get('/api/websocket/stats', (req, res) => {
  res.json({
    connections: wsServer.getConnectionCount(),
    rooms: wsServer.getRoomStats()
  });
});

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head);
});

server.listen(port, () => {
  console.log(`🚀 Mongo Editor server running on port ${port}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${port}/editor-ws`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await wsServer.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await wsServer.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;