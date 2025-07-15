import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';

interface EditorConnection {
  ws: WebSocket;
  editorId: string;
  database: string;
  currentCollection?: string;
}

interface CollectionRoom {
  database: string;
  collection: string;
  editors: Set<string>;
}

interface EditorMessage {
  type: 'JOIN_COLLECTION' | 'LEAVE_COLLECTION' | 'DOCUMENT_UPDATE' | 'DOCUMENT_DELETE';
  editorId: string;
  database?: string;
  collection?: string;
  documentId?: string;
  document?: any;
  timestamp?: number;
}

export class EditorWebSocketServer {
  private wss: WebSocketServer;
  private connections = new Map<string, EditorConnection>();
  private rooms = new Map<string, CollectionRoom>(); // key: "database:collection"

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupHandlers();
  }

  handleUpgrade(request: IncomingMessage, socket: any, head: any): void {
    // Only handle /editor-ws paths
    if (!request.url?.startsWith('/editor-ws')) {
      socket.destroy();
      return;
    }

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  private setupHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      try {
        const url = new URL(request.url!, 'http://localhost');
        const editorId = url.searchParams.get('editorId');
        const database = url.searchParams.get('database');

        if (!editorId || !database) {
          ws.close(4000, 'Missing editorId or database');
          return;
        }

        const connection: EditorConnection = {
          ws,
          editorId,
          database
        };

        this.connections.set(editorId, connection);
        console.log(`📝 Editor ${editorId.slice(0, 8)} connected to database ${database}`);

        this.setupConnectionHandlers(connection);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(4000, 'Invalid connection parameters');
      }
    });
  }

  private setupConnectionHandlers(connection: EditorConnection): void {
    connection.ws.on('message', (data: Buffer) => {
      try {
        const message: EditorMessage = JSON.parse(data.toString());
        this.handleMessage(connection, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    connection.ws.on('close', () => {
      this.handleDisconnect(connection);
    });

    connection.ws.on('error', (error) => {
      console.error(`WebSocket error for editor ${connection.editorId}:`, error);
    });

    // Send welcome message
    this.sendToConnection(connection, {
      type: 'CONNECTION_ESTABLISHED',
      editorId: connection.editorId,
      database: connection.database,
      timestamp: Date.now()
    });
  }

  private handleMessage(connection: EditorConnection, message: EditorMessage): void {
    switch (message.type) {
      case 'JOIN_COLLECTION':
        if (message.collection) {
          this.joinCollection(connection, message.collection);
        }
        break;
      case 'LEAVE_COLLECTION':
        if (message.collection) {
          this.leaveCollection(connection, message.collection);
        }
        break;
      // Document update/delete messages are handled via API routes
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private joinCollection(connection: EditorConnection, collection: string): void {
    // Leave previous collection if any
    if (connection.currentCollection) {
      this.leaveCollection(connection, connection.currentCollection);
    }

    const roomKey = `${connection.database}:${collection}`;
    
    if (!this.rooms.has(roomKey)) {
      this.rooms.set(roomKey, {
        database: connection.database,
        collection,
        editors: new Set()
      });
    }

    const room = this.rooms.get(roomKey)!;
    room.editors.add(connection.editorId);
    connection.currentCollection = collection;

    // Notify editor about other editors in the room
    const otherEditors = Array.from(room.editors).filter(id => id !== connection.editorId);
    this.sendToConnection(connection, {
      type: 'ROOM_JOINED',
      collection,
      otherEditors,
      timestamp: Date.now()
    });

    // Notify other editors about new editor
    this.broadcastToRoom(roomKey, {
      type: 'EDITOR_JOINED',
      editorId: connection.editorId,
      collection,
      timestamp: Date.now()
    }, connection.editorId);

    console.log(`📝 Editor ${connection.editorId.slice(0, 8)} joined ${roomKey} (${room.editors.size} editors)`);
  }

  private leaveCollection(connection: EditorConnection, collection: string): void {
    const roomKey = `${connection.database}:${collection}`;
    const room = this.rooms.get(roomKey);

    if (room) {
      room.editors.delete(connection.editorId);
      
      // Notify other editors
      this.broadcastToRoom(roomKey, {
        type: 'EDITOR_LEFT',
        editorId: connection.editorId,
        collection,
        timestamp: Date.now()
      }, connection.editorId);

      // Clean up empty room
      if (room.editors.size === 0) {
        this.rooms.delete(roomKey);
        console.log(`🗑️ Removed empty room ${roomKey}`);
      }
    }

    connection.currentCollection = undefined;
  }

  private handleDisconnect(connection: EditorConnection): void {
    if (connection.currentCollection) {
      this.leaveCollection(connection, connection.currentCollection);
    }
    
    this.connections.delete(connection.editorId);
    console.log(`📝 Editor ${connection.editorId.slice(0, 8)} disconnected`);
  }

  private sendToConnection(connection: EditorConnection, message: any): void {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }

  private broadcastToRoom(roomKey: string, message: any, excludeEditorId?: string): void {
    const room = this.rooms.get(roomKey);
    if (!room) return;

    room.editors.forEach(editorId => {
      if (editorId !== excludeEditorId) {
        const connection = this.connections.get(editorId);
        if (connection?.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify(message));
        }
      }
    });
  }

  // Called from API routes to broadcast document changes
  public broadcastDocumentUpdate(database: string, collection: string, documentId: string, document: any, editorId: string): void {
    const roomKey = `${database}:${collection}`;
    this.broadcastToRoom(roomKey, {
      type: 'DOCUMENT_UPDATED',
      editorId,
      database,
      collection,
      documentId,
      document,
      timestamp: Date.now()
    }, editorId);
  }

  public broadcastDocumentDelete(database: string, collection: string, documentId: string, editorId: string): void {
    const roomKey = `${database}:${collection}`;
    this.broadcastToRoom(roomKey, {
      type: 'DOCUMENT_DELETED',
      editorId,
      database,
      collection,
      documentId,
      timestamp: Date.now()
    }, editorId);
  }

  // Get room statistics
  public getRoomStats(): { roomKey: string; editorCount: number }[] {
    return Array.from(this.rooms.entries()).map(([roomKey, room]) => ({
      roomKey,
      editorCount: room.editors.size
    }));
  }

  // Get connection count
  public getConnectionCount(): number {
    return this.connections.size;
  }

  // Graceful shutdown
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}