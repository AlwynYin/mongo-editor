import express, { Router } from 'express';
import { MongoEditorService } from '../services/mongoEditorService';
import { getMongoClient } from '../mongoConnection';

const collectionsRouter: Router = express.Router();

// List all databases
collectionsRouter.get('/databases', async (req, res) => {
  try {
    const client = getMongoClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        error: 'MongoDB client not initialized' 
      });
    }

    const admin = client.db().admin();
    const result = await admin.listDatabases();
    const databases = result.databases.map(db => db.name);
    
    res.json({ success: true, data: databases });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list databases' 
    });
  }
});

// Test connection to a specific database
collectionsRouter.post('/test-connection', async (req, res) => {
  try {
    const { databaseName } = req.body;
    
    if (!databaseName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Database name is required' 
      });
    }

    const service = MongoEditorService.getInstance();
    const result = await service.testConnection(databaseName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    });
  }
});

// List collections in a database
collectionsRouter.get('/:database', async (req, res) => {
  try {
    const { database } = req.params;
    const service = MongoEditorService.getInstance();
    const result = await service.listCollections(database);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list collections' 
    });
  }
});

// Get collection statistics
collectionsRouter.get('/:database/:collection/stats', async (req, res) => {
  try {
    const { database, collection } = req.params;
    
    const service = MongoEditorService.getInstance();
    const result = await service.getCollectionStats(database, collection);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get collection stats' 
    });
  }
});

// Get collection schema
collectionsRouter.get('/:database/:collection/schema', async (req, res) => {
  try {
    const { database, collection } = req.params;
    
    const service = MongoEditorService.getInstance();
    const result = await service.getCollectionSchema(database, collection);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get collection schema' 
    });
  }
});

// Get documents from a collection
collectionsRouter.get('/:database/:collection', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const { page = '1', limit = '25' } = req.query;
    
    const service = MongoEditorService.getInstance();
    const result = await service.getDocuments(
      database,
      collection, 
      parseInt(page as string), 
      parseInt(limit as string)
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get documents' 
    });
  }
});

// Update a document
collectionsRouter.put('/:database/:collection/:id', async (req, res) => {
  try {
    const { database, collection, id } = req.params;
    const { editorId } = req.query;
    const updateData = req.body;
    
    const service = MongoEditorService.getInstance();
    const result = await service.updateDocument(database, collection, id, updateData);
    
    if (result.success) {
      // Broadcast update via WebSocket
      const wsServer = req.app.locals.wsServer;
      if (wsServer && editorId) {
        wsServer.broadcastDocumentUpdate(
          database,
          collection,
          id,
          result.data,
          editorId as string
        );
      }
      
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update document' 
    });
  }
});

// Delete a document
collectionsRouter.delete('/:database/:collection/:id', async (req, res) => {
  try {
    const { database, collection, id } = req.params;
    const { editorId } = req.query;
    
    const service = MongoEditorService.getInstance();
    const result = await service.deleteDocument(database, collection, id);
    
    if (result.success) {
      // Broadcast delete via WebSocket
      const wsServer = req.app.locals.wsServer;
      if (wsServer && editorId) {
        wsServer.broadcastDocumentDelete(
          database,
          collection,
          id,
          editorId as string
        );
      }
      
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete document' 
    });
  }
});

export { collectionsRouter };