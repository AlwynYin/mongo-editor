import React, { useState } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { DatabaseCollectionSelector } from './DatabaseCollectionSelector';
import { CollectionDataGrid } from './CollectionDataGrid';
import { MongoDocument } from '@mongo-editor/shared';

export interface MongoCollectionEditorProps {
  collectionName?: string;
  readonly?: boolean;
  onDocumentChange?: (document: MongoDocument) => void;
  onConnectionError?: (error: Error) => void;
}

export const MongoCollectionEditor: React.FC<MongoCollectionEditorProps> = ({
  collectionName: initialCollectionName,
  readonly = false,
  onDocumentChange,
  onConnectionError
}) => {
  const [collectionName, setCollectionName] = useState(initialCollectionName || '');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success');

  // Grid refresh trigger
  const [gridRefreshKey, setGridRefreshKey] = useState(0);

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
      <Typography variant="h5">
        MongoDB Collection Editor
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ p: 2, mb: 2 }}>
        <DatabaseCollectionSelector
          collectionName={collectionName}
          onCollectionChange={handleCollectionChange}
          onConnectionSuccess={handleConnectionSuccess}
          onConnectionError={handleConnectionError}
          isConnected={isConnected}
        />
      </Box>

      {isConnected && collectionName && (
        <Box sx={{ 
          p: 2, 
          flexGrow: 1, 
          minHeight: 400, 
          height: 'calc(100vh - 350px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CollectionDataGrid
            key={gridRefreshKey}
            collectionName={collectionName}
            readonly={readonly}
            onDocumentChange={onDocumentChange}
            onEditSuccess={(message) => showToast(message, 'success')}
            onEditError={(message) => showToast(message, 'error')}
          />
        </Box>
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