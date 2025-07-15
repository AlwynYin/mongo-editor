import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Alert, Snackbar, Chip } from '@mui/material';
import { DatabaseCollectionSelector } from './DatabaseCollectionSelector';
import { CollectionDataGrid } from './CollectionDataGrid';
import { MongoDocument, ApiResponse } from '@mongo-editor/shared';
import { EditorWebSocketService } from '../services/websocketService';

export interface MongoCollectionEditorProps {
  databaseName?: string;
  collectionName?: string;
  readonly?: boolean;
  onDocumentChange?: (document: MongoDocument) => void;
  onConnectionError?: (error: Error) => void;
}

export const MongoCollectionEditor: React.FC<MongoCollectionEditorProps> = ({
  databaseName: initialDatabaseName,
  collectionName: initialCollectionName,
  readonly = false,
  onDocumentChange,
  onConnectionError
}) => {
  const [databaseName, setDatabaseName] = useState(initialDatabaseName || '');
  const [collectionName, setCollectionName] = useState(initialCollectionName || '');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket state
  const wsService = useRef<EditorWebSocketService | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectedEditors, setConnectedEditors] = useState<string[]>([]);

  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success');

  // Grid refresh trigger
  const [gridRefreshKey, setGridRefreshKey] = useState(0);

  // Initialize WebSocket when database is connected
  useEffect(() => {
    if (isConnected && databaseName) {
      initializeWebSocket();
    } else {
      cleanupWebSocket();
    }

    return () => cleanupWebSocket();
  }, [isConnected, databaseName]);

  // Join collection room when collection changes
  useEffect(() => {
    if (wsService.current && collectionName) {
      wsService.current.joinCollection(collectionName);
    }
  }, [collectionName]);

  const initializeWebSocket = async () => {
    try {
      cleanupWebSocket();
      
      wsService.current = new EditorWebSocketService(databaseName);
      await wsService.current.connect();
      setWsConnected(true);

      // Set up message handling
      const handleWebSocketMessage = (event: CustomEvent) => {
        const message = event.detail;
        handleWebSocketEvent(message);
      };

      window.addEventListener('editor-ws-message', handleWebSocketMessage as EventListener);
      
      // Store cleanup function
      wsService.current.cleanup = () => {
        window.removeEventListener('editor-ws-message', handleWebSocketMessage as EventListener);
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setWsConnected(false);
      showToast('Real-time collaboration unavailable', 'info');
    }
  };

  const cleanupWebSocket = () => {
    if (wsService.current) {
      wsService.current.cleanup?.();
      wsService.current.disconnect();
      wsService.current = null;
    }
    setWsConnected(false);
    setConnectedEditors([]);
  };

  const handleWebSocketEvent = (message: any) => {
    switch (message.type) {
      case 'CONNECTION_ESTABLISHED':
        console.log('WebSocket connection established');
        break;
        
      case 'ROOM_JOINED':
        if (message.collection === collectionName) {
          setConnectedEditors(message.otherEditors || []);
        }
        break;
        
      case 'EDITOR_JOINED':
        if (message.collection === collectionName) {
          setConnectedEditors(prev => [...prev, message.editorId]);
          showToast(`Editor ${message.editorId.slice(0, 8)} joined`, 'info');
        }
        break;
        
      case 'EDITOR_LEFT':
        if (message.collection === collectionName) {
          setConnectedEditors(prev => prev.filter(id => id !== message.editorId));
          showToast(`Editor ${message.editorId.slice(0, 8)} left`, 'info');
        }
        break;
        
      case 'DOCUMENT_UPDATED':
        if (message.collection === collectionName && message.editorId !== message.selfEditorId) {
          setGridRefreshKey(prev => prev + 1);
          showToast(`Document updated by ${message.editorId.slice(0, 8)}`, 'info');
        }
        break;
        
      case 'DOCUMENT_DELETED':
        if (message.collection === collectionName && message.editorId !== message.selfEditorId) {
          setGridRefreshKey(prev => prev + 1);
          showToast(`Document deleted by ${message.editorId.slice(0, 8)}`, 'info');
        }
        break;
    }
  };

  const handleConnectionSuccess = () => {
    setIsConnected(true);
    setError(null);
  };

  const handleConnectionError = (error: string) => {
    setIsConnected(false);
    setError(error);
    onConnectionError?.(new Error(error));
  };

  const handleCollectionChange = (newCollectionName: string) => {
    setCollectionName(newCollectionName);
  };

  const showToast = (message: string, severity: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleToastClose = () => {
    setToastOpen(false);
  };


  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          MongoDB Collection Editor
        </Typography>
        
        {/* <Box display="flex" gap={1}>
          <Chip
            label={wsConnected ? '🟢 Live' : '🔴 Offline'}
            color={wsConnected ? 'success' : 'default'}
            size="small"
          />
          {connectedEditors.length > 0 && (
            <Chip
              label={`${connectedEditors.length} other editor${connectedEditors.length !== 1 ? 's' : ''}`}
              color="info"
              size="small"
            />
          )}
        </Box> */}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <DatabaseCollectionSelector
          databaseName={databaseName}
          collectionName={collectionName}
          onDatabaseNameChange={setDatabaseName}
          onCollectionChange={handleCollectionChange}
          onConnectionSuccess={handleConnectionSuccess}
          onConnectionError={handleConnectionError}
          isConnected={isConnected}
        />
      </Paper>

      {isConnected && databaseName && collectionName && (
        <Paper sx={{ 
          p: 2, 
          flexGrow: 1, 
          minHeight: 400, 
          height: 'calc(100vh - 350px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CollectionDataGrid
            key={gridRefreshKey}
            databaseName={databaseName}
            collectionName={collectionName}
            readonly={readonly}
            editorId={wsService.current?.getEditorId()}
            connectedEditors={connectedEditors}
            onDocumentChange={onDocumentChange}
            onEditSuccess={(message) => showToast(message, 'success')}
            onEditError={(message) => showToast(message, 'error')}
          />
        </Paper>
      )}


      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toastSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};