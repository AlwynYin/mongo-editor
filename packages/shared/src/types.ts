import { ObjectId } from 'mongodb';

export interface MongoDocument {
  _id: ObjectId | string;
  [key: string]: any;
}

export interface MongoCollection {
  name: string;
  count: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MongoConnectionConfig {
  connectionId: string;
  mongoUrl: string;
  databaseName?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DocumentField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'objectId' | 'unknown';
  required?: boolean;
}