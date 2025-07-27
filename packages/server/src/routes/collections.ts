import express, { Router } from 'express';
import { MongoEditorService } from '../services/mongoEditorService';

const collectionsRouter: Router = express.Router();


// Test connection to the configured database
collectionsRouter.post('/test-connection', async (req, res) => {
  try {
    const service = MongoEditorService.getInstance();
    const result = await service.testConnection();
    
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

// List collections in the configured database
collectionsRouter.get('/', async (req, res) => {
  try {
    const service = MongoEditorService.getInstance();
    const result = await service.listCollections();
    
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
collectionsRouter.get('/:collection/stats', async (req, res) => {
  try {
    const { collection } = req.params;
    
    const service = MongoEditorService.getInstance();
    const result = await service.getCollectionStats(collection);
    
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
collectionsRouter.get('/:collection/schema', async (req, res) => {
  try {
    const { collection } = req.params;
    
    const service = MongoEditorService.getInstance();
    const result = await service.getCollectionSchema(collection);
    
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
collectionsRouter.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { page = '1', limit = '25' } = req.query;
    
    const service = MongoEditorService.getInstance();
    const result = await service.getDocuments(
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
collectionsRouter.put('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const updateData = req.body;
    
    const service = MongoEditorService.getInstance();
    const result = await service.updateDocument(collection, id, updateData);
    
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
collectionsRouter.post('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const documentData = req.body;
    
    const service = MongoEditorService.getInstance();
    const result = await service.createDocument(collection, documentData);
    
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
collectionsRouter.delete('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    
    const service = MongoEditorService.getInstance();
    const result = await service.deleteDocument(collection, id);
    
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
collectionsRouter.post('/:collection/fields', async (req, res) => {
  try {
    const { collection } = req.params;
    const { fieldName, fieldType, defaultValue } = req.body;
    
    if (!fieldName || !fieldType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Field name and type are required' 
      });
    }
    
    const service = MongoEditorService.getInstance();
    const result = await service.addFieldToCollection(collection, fieldName, fieldType, defaultValue);
    
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
collectionsRouter.put('/:collection/fields/:fieldName', async (req, res) => {
  try {
    const { collection, fieldName } = req.params;
    const { newFieldName } = req.body;
    
    if (!newFieldName) {
      return res.status(400).json({ 
        success: false, 
        error: 'New field name is required' 
      });
    }
    
    const service = MongoEditorService.getInstance();
    const result = await service.renameField(collection, fieldName, newFieldName);
    
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
collectionsRouter.delete('/:collection/fields/:fieldName', async (req, res) => {
  try {
    const { collection, fieldName } = req.params;
    const service = MongoEditorService.getInstance();
    const result = await service.removeFieldFromCollection(collection, fieldName);
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