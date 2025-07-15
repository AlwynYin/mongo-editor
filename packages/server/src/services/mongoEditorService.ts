import { Db, Collection, ObjectId } from 'mongodb';
import { getMongoClient } from '../mongoConnection';
import { MongoDocument, ApiResponse, PaginatedResult } from '@mongo-editor/shared';

export class MongoEditorService {
  private static instance: MongoEditorService;

  private constructor() {}

  public static getInstance(): MongoEditorService {
    if (!MongoEditorService.instance) {
      MongoEditorService.instance = new MongoEditorService();
    }
    return MongoEditorService.instance;
  }

  private getDB(databaseName: string): Db {
    const client = getMongoClient();
    if (!client) {
      throw new Error('MongoDB client not initialized. Call setMongoConnection() first.');
    }
    return client.db(databaseName);
  }

  async listCollections(databaseName: string): Promise<ApiResponse<string[]>> {
    try {
      const collections = await this.getDB(databaseName).listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      return { success: true, data: collectionNames };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list collections' 
      };
    }
  }

  async getDocuments(
    databaseName: string,
    collectionName: string, 
    page = 1, 
    limit = 25
  ): Promise<ApiResponse<PaginatedResult<MongoDocument>>> {
    try {
      const collection = this.getDB(databaseName).collection(collectionName);
      const skip = (page - 1) * limit;
      
      const [documents, total] = await Promise.all([
        collection.find({}).skip(skip).limit(limit).toArray(),
        collection.countDocuments({})
      ]);

      return {
        success: true,
        data: {
          data: documents,
          total,
          page,
          limit,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get documents' 
      };
    }
  }

  async getCollectionStats(databaseName: string, collectionName: string): Promise<ApiResponse<{
    estimatedCount: number;
    exactCount?: number;
    avgDocumentSize?: number;
    totalSize?: number;
    indexSizes?: Record<string, number>;
  }>> {
    try {
      const collection = this.getDB(databaseName).collection(collectionName);
      
      // Get collection statistics using MongoDB's stats command
      const stats = await this.getDB(databaseName).command({ collStats: collectionName });
      
      // Get estimated document count (fast operation)
      const estimatedCount = await collection.estimatedDocumentCount();
      
      return {
        success: true,
        data: {
          estimatedCount,
          exactCount: stats.count, // From collStats
          avgDocumentSize: stats.avgObjSize,
          totalSize: stats.size,
          indexSizes: stats.indexSizes
        }
      };
    } catch (error) {
      // If collStats fails, fall back to basic estimation
      try {
        const collection = this.getDB(databaseName).collection(collectionName);
        const estimatedCount = await collection.estimatedDocumentCount();
        
        return {
          success: true,
          data: {
            estimatedCount
          }
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get collection stats'
        };
      }
    }
  }

  async getCollectionSchema(databaseName: string, collectionName: string): Promise<ApiResponse<{
    jsonSchema?: any;
    validator?: any;
    inferredSchema?: Record<string, string>;
  }>> {
    try {
      const db = this.getDB(databaseName);
      
      // First try to get the actual MongoDB schema/validator
      const collections = await db.listCollections({ name: collectionName }).toArray();
      const collection = collections[0];
      
      let jsonSchema = null;
      let validator = null;
      
      if (collection && 'options' in collection && collection.options) {
        validator = collection.options.validator;
        if (validator && validator.$jsonSchema) {
          jsonSchema = validator.$jsonSchema;
        }
      }
      
      // If no schema exists, infer schema from sample documents
      let inferredSchema: Record<string, string> = {};
      if (!jsonSchema) {
        const sampleDocs = await db.collection(collectionName)
          .find({})
          .limit(100) // Sample first 100 documents
          .toArray();
        
        if (sampleDocs.length > 0) {
          const fieldTypes: Record<string, Set<string>> = {};
          
          // Analyze field types across sample documents
          sampleDocs.forEach(doc => {
            Object.entries(doc).forEach(([field, value]) => {
              if (!fieldTypes[field]) {
                fieldTypes[field] = new Set();
              }
              fieldTypes[field].add(this.inferFieldType(value));
            });
          });
          
          // Determine most common type for each field
          Object.entries(fieldTypes).forEach(([field, types]) => {
            const typeArray = Array.from(types).filter(t => t !== 'null');
            if (typeArray.length === 1) {
              inferredSchema[field] = typeArray[0];
            } else if (typeArray.length > 1) {
              // If multiple types, prefer in order: string, number, boolean, date, objectId
              const priority = ['string', 'number', 'boolean', 'date', 'objectId'];
              const priorityType = priority.find(p => typeArray.includes(p));
              inferredSchema[field] = priorityType || typeArray[0];
            } else {
              // All values are null, default to string
              inferredSchema[field] = 'string';
            }
          });
        }
      }
      
      return {
        success: true,
        data: {
          jsonSchema,
          validator,
          inferredSchema
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get collection schema'
      };
    }
  }

  private inferFieldType(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    // Check for ObjectId (MongoDB ObjectId pattern)
    if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
      return 'objectId';
    }
    
    // Check for Date
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return 'date';
    }
    
    // Check for Boolean
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    // Check for Number
    if (typeof value === 'number' && !isNaN(value)) {
      return 'number';
    }
    
    // Check for String
    if (typeof value === 'string') {
      return 'string';
    }
    
    // Arrays and objects
    if (Array.isArray(value)) {
      return 'array';
    }
    
    if (typeof value === 'object') {
      return 'object';
    }
    
    return 'unknown';
  }

  async updateDocument(
    databaseName: string,
    collectionName: string, 
    documentId: string, 
    updateData: any
  ): Promise<ApiResponse<MongoDocument>> {
    try {
      const collection = this.getDB(databaseName).collection(collectionName);
      
      // Remove _id from updates to avoid conflict
      const { _id, ...updates } = updateData;
      
      // Validate document ID
      if (!ObjectId.isValid(documentId)) {
        return { success: false, error: 'Invalid document ID' };
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(documentId) },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return { success: false, error: 'Document not found' };
      }

      // Get the updated document
      const updatedDoc = await collection.findOne({ _id: new ObjectId(documentId) });
      
      if (!updatedDoc) {
        return { success: false, error: 'Failed to retrieve updated document' };
      }

      return { success: true, data: updatedDoc };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update document' 
      };
    }
  }

  async deleteDocument(
    databaseName: string,
    collectionName: string, 
    documentId: string
  ): Promise<ApiResponse<void>> {
    try {
      const collection = this.getDB(databaseName).collection(collectionName);
      
      // Validate document ID
      if (!ObjectId.isValid(documentId)) {
        return { success: false, error: 'Invalid document ID' };
      }

      const result = await collection.deleteOne({ _id: new ObjectId(documentId) });
      
      if (result.deletedCount === 0) {
        return { success: false, error: 'Document not found' };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete document' 
      };
    }
  }

  async testConnection(databaseName: string): Promise<ApiResponse<{ status: string; database: string }>> {
    try {
      // Try to get database stats to test connection
      const admin = this.getDB(databaseName).admin();
      await admin.ping();
      
      return { 
        success: true, 
        data: { 
          status: 'connected', 
          database: databaseName 
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }
}