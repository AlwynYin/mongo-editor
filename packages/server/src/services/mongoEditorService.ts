import { Db, Collection, ObjectId } from 'mongodb';
import { getMongoClient } from '../mongoConnection';
import { MongoDocument, ApiResponse, PaginatedResult } from '@mongo-editor/shared';

export class MongoEditorService {
  constructor(private databaseName: string) {}

  private getDB(): Db {
    const client = getMongoClient();
    if (!client) {
      throw new Error('MongoDB client not initialized. Call setMongoConnection() first.');
    }
    return client.db(this.databaseName);
  }

  async listCollections(): Promise<ApiResponse<string[]>> {
    try {
      const collections = await this.getDB().listCollections().toArray();
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
    collectionName: string, 
    page = 1, 
    limit = 25
  ): Promise<ApiResponse<PaginatedResult<MongoDocument>>> {
    try {
      const collection = this.getDB().collection(collectionName);
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

  async getCollectionStats(collectionName: string): Promise<ApiResponse<{
    estimatedCount: number;
    exactCount?: number;
    avgDocumentSize?: number;
    totalSize?: number;
    indexSizes?: Record<string, number>;
  }>> {
    try {
      const collection = this.getDB().collection(collectionName);
      
      // Get collection statistics using MongoDB's stats command
      const stats = await this.getDB().command({ collStats: collectionName });
      
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
        const collection = this.getDB().collection(collectionName);
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

  async updateDocument(
    collectionName: string, 
    documentId: string, 
    updateData: any
  ): Promise<ApiResponse<MongoDocument>> {
    try {
      const collection = this.getDB().collection(collectionName);
      
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
    collectionName: string, 
    documentId: string
  ): Promise<ApiResponse<void>> {
    try {
      const collection = this.getDB().collection(collectionName);
      
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

  async testConnection(): Promise<ApiResponse<{ status: string; database: string }>> {
    try {
      // Try to get database stats to test connection
      const admin = this.getDB().admin();
      await admin.ping();
      
      return { 
        success: true, 
        data: { 
          status: 'connected', 
          database: this.databaseName 
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