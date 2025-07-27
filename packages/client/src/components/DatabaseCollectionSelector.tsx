import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip
} from '@mui/material';
import { ApiResponse } from '@mongo-editor/shared';

interface DatabaseCollectionSelectorProps {
  collectionName: string;
  onCollectionChange: (collectionName: string) => void;
  onConnectionSuccess: () => void;
  onConnectionError: (error: string) => void;
  isConnected: boolean;
}

export const DatabaseCollectionSelector: React.FC<DatabaseCollectionSelectorProps> = ({
  collectionName,
  onCollectionChange,
  onConnectionSuccess,
  onConnectionError,
  isConnected
}) => {
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // const [statusMessage, setStatusMessage] = useState<string>('');

  // Auto-connect on component mount
  useEffect(() => {
    if (!isConnected) {
      testConnection();
    }
  }, []);

  // Load collections when database is connected
  useEffect(() => {
    if (isConnected) {
      loadCollections();
    }
  }, [isConnected]);


  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const response = await fetch('/api/collections/');
      const result: ApiResponse<string[]> = await response.json();
      
      if (result.success && result.data) {
        setAvailableCollections(result.data);
      } else {
        setAvailableCollections([]);
        console.error('Failed to load collections:', result.error);
      }
    } catch (error) {
      setAvailableCollections([]);
      console.error('Failed to load collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const testConnection = async () => {
    setConnecting(true);
    setConnectionStatus('idle');
    
    try {
      const response = await fetch('/api/collections/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setConnectionStatus('success');
        // setStatusMessage('Connected successfully!');
        onConnectionSuccess();
      } else {
        setConnectionStatus('error');
        // setStatusMessage(result.error || 'Connection failed');
        onConnectionError(result.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      // setStatusMessage(errorMessage);
      onConnectionError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };


  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Collection Selection
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        {/* Collection Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Collection</InputLabel>
            <Select
              value={collectionName}
              onChange={(e) => onCollectionChange(e.target.value)}
              label="Collection"
              disabled={!isConnected || loadingCollections}
            >
              {availableCollections.map(collection => (
                <MenuItem key={collection} value={collection}>{collection}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status & Actions */}
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={1}>
            {connecting && <CircularProgress size={20} />}
            
            {/*{isConnected && (*/}
            {/*  <Chip */}
            {/*    label={`Connected to ${FIXED_DATABASE_NAME}`}*/}
            {/*    color="success" */}
            {/*    size="small"*/}
            {/*    variant="outlined"*/}
            {/*  />*/}
            {/*)}*/}
            
            {connectionStatus === 'error' && (
              <Chip 
                label="Connection Error" 
                color="error" 
                size="small"
                variant="outlined"
              />
            )}

            <Button
              variant="outlined"
              onClick={loadCollections}
              disabled={loadingCollections || !isConnected}
              size="small"
            >
              {loadingCollections ? <CircularProgress size={16} /> : 'Refresh'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/*/!* Status Message *!/*/}
      {/*{connectionStatus !== 'idle' && statusMessage && (*/}
      {/*  <Box mt={2}>*/}
      {/*    <Alert severity={connectionStatus === 'success' ? 'success' : 'error'}>*/}
      {/*      {statusMessage}*/}
      {/*    </Alert>*/}
      {/*  </Box>*/}
      {/*)}*/}

      {/* Loading Collections */}
      {loadingCollections && (
        <Box mt={2} display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading collections...
          </Typography>
        </Box>
      )}

      {/* Helper Text */}
      <Box mt={1}>
        <Typography variant="caption" color="text.secondary">
          {!isConnected ? `Connecting to database` :
           !collectionName ? 'Select a collection to begin editing' :
           'Ready to edit documents'}
        </Typography>
      </Box>
    </Box>
  );
};