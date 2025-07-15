interface EditorWebSocketMessage {
  type: string;
  editorId?: string;
  database?: string;
  collection?: string;
  documentId?: string;
  document?: any;
  otherEditors?: string[];
  timestamp?: number;
}

export class EditorWebSocketService {
  private ws: WebSocket | null = null;
  private editorId: string;
  private database: string;
  private currentCollection: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(database: string) {
    this.editorId = this.generateEditorId();
    this.database = database;
  }

  private generateEditorId(): string {
    // Generate a unique editor ID
    return `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // For development, connect directly to the backend server port
        const isProduction = process.env.NODE_ENV === 'production';
        const wsHost = isProduction ? window.location.host : 'localhost:4001';
        const wsUrl = `${protocol}//${wsHost}/editor-ws?editorId=${this.editorId}&database=${this.database}`;
        
        console.log(`📡 Connecting to WebSocket: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.clearReconnectTimer();
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log(`📡 WebSocket disconnected: ${event.code} ${event.reason}`);
          this.scheduleReconnect();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: EditorWebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Invalid WebSocket message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  joinCollection(collection: string): void {
    if (this.currentCollection === collection) return;
    
    console.log(`📝 Joining collection: ${collection}`);
    this.currentCollection = collection;
    this.send({
      type: 'JOIN_COLLECTION',
      collection
    });
  }

  leaveCollection(): void {
    if (!this.currentCollection) return;
    
    console.log(`📝 Leaving collection: ${this.currentCollection}`);
    this.send({
      type: 'LEAVE_COLLECTION',
      collection: this.currentCollection
    });
    
    this.currentCollection = null;
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        editorId: this.editorId,
        timestamp: Date.now()
      }));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  private handleMessage(message: EditorWebSocketMessage): void {
    console.log('📨 WebSocket message:', message.type, message);
    
    // Dispatch events for React components to listen to
    window.dispatchEvent(new CustomEvent('editor-ws-message', { 
      detail: { ...message, selfEditorId: this.editorId }
    }));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.clearReconnectTimer();
    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect(): void {
    console.log('📡 Disconnecting WebSocket');
    this.clearReconnectTimer();
    
    if (this.currentCollection) {
      this.leaveCollection();
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Get current state
  getEditorId(): string {
    return this.editorId;
  }

  getCurrentCollection(): string | null {
    return this.currentCollection;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}