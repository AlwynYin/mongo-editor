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
    const updateData = req.body;
    
    const service = MongoEditorService.getInstance();
    const result = await service.updateDocument(database, collection, id, updateData);
    
    if (result.success) {
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

// Create a new document
collectionsRouter.post('/:database/:collection', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const documentData = req.body;
    
    const service = MongoEditorService.getInstance();
    const result = await service.createDocument(database, collection, documentData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create document' 
    });
  }
});

// Delete a document
collectionsRouter.delete('/:database/:collection/:id', async (req, res) => {
  try {
    const { database, collection, id } = req.params;
    
    const service = MongoEditorService.getInstance();
    const result = await service.deleteDocument(database, collection, id);
    
    if (result.success) {
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

// Add field to all documents in collection
collectionsRouter.post('/:database/:collection/fields', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const { fieldName, fieldType, defaultValue } = req.body;
    
    if (!fieldName || !fieldType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Field name and type are required' 
      });
    }
    
    const service = MongoEditorService.getInstance();
    const result = await service.addFieldToCollection(database, collection, fieldName, fieldType, defaultValue);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add field to collection' 
    });
  }
});

// Rename field in all documents in collection
collectionsRouter.put('/:database/:collection/fields/:fieldName', async (req, res) => {
  try {
    const { database, collection, fieldName } = req.params;
    const { newFieldName } = req.body;
    
    if (!newFieldName) {
      return res.status(400).json({ 
        success: false, 
        error: 'New field name is required' 
      });
    }
    
    const service = MongoEditorService.getInstance();
    const result = await service.renameField(database, collection, fieldName, newFieldName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to rename field' 
    });
  }
});

// Remove field from all documents in collection
collectionsRouter.delete('/:database/:collection/fields/:fieldName', async (req, res) => {
  try {
    const { database, collection, fieldName } = req.params;
    const service = MongoEditorService.getInstance();
    const result = await service.removeFieldFromCollection(database, collection, fieldName);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove field from collection'
    });
  }
});

export { collectionsRouter };