import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from 'dotenv';
import { collectionsRouter } from './routes/collections';
import { setMongoConnection } from './mongoConnection';

config();

// Initialize MongoDB connection
setMongoConnection();

const app: Express = express();
const port = process.env.PORT || 4001;

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


app.listen(port, () => {
  console.log(`🚀 Mongo Editor server running on port ${port}`);
  console.log(`📡 MongoDB Collection Editor ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;