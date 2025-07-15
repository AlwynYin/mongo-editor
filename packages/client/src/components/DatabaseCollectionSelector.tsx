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
  databaseName: string;
  collectionName: string;
  onDatabaseNameChange: (dbName: string) => void;
  onCollectionChange: (collectionName: string) => void;
  onConnectionSuccess: () => void;
  onConnectionError: (error: string) => void;
  isConnected: boolean;
}

export const DatabaseCollectionSelector: React.FC<DatabaseCollectionSelectorProps> = ({
  databaseName,
  collectionName,
  onDatabaseNameChange,
  onCollectionChange,
  onConnectionSuccess,
  onConnectionError,
  isConnected
}) => {
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Load available databases on component mount
  useEffect(() => {
    loadAvailableDatabases();
  }, []);

  // Auto-connect when database is selected
  useEffect(() => {
    if (databaseName && !isConnected) {
      testConnection();
    }
  }, [databaseName]);

  // Load collections when database is connected
  useEffect(() => {
    if (isConnected && databaseName) {
      loadCollections();
    }
  }, [isConnected, databaseName]);

  const loadAvailableDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await fetch('/api/collections/databases');
      const result: ApiResponse<string[]> = await response.json();
      
      if (result.success) {
        setAvailableDatabases(result.data || []);
      } else {
        console.error('Failed to load databases:', result.error);
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const response = await fetch(`/api/collections/${databaseName}`);
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
    if (!databaseName.trim()) {
      onConnectionError('Database name is required');
      return;
    }

    setConnecting(true);
    setConnectionStatus('idle');
    
    try {
      const response = await fetch('/api/collections/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseName: databaseName.trim()
        }),
      });

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setConnectionStatus('success');
        setStatusMessage('Connected successfully!');
        onConnectionSuccess();
      } else {
        setConnectionStatus('error');
        setStatusMessage(result.error || 'Connection failed');
        onConnectionError(result.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setStatusMessage(errorMessage);
      onConnectionError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDatabaseChange = (dbName: string) => {
    onDatabaseNameChange(dbName);
    onCollectionChange(''); // Clear collection when database changes
    setConnectionStatus('idle');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Database & Collection Selection
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        {/* Database Selection */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Database</InputLabel>
            <Select
              value={databaseName}
              onChange={(e) => handleDatabaseChange(e.target.value)}
              label="Database"
              disabled={loadingDatabases}
            >
              {availableDatabases.map(db => (
                <MenuItem key={db} value={db}>{db}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Collection Selection */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Collection</InputLabel>
            <Select
              value={collectionName}
              onChange={(e) => onCollectionChange(e.target.value)}
              label="Collection"
              disabled={!isConnected || loadingCollections || !databaseName}
            >
              {availableCollections.map(collection => (
                <MenuItem key={collection} value={collection}>{collection}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status & Actions */}
        {/* <Grid item xs={12} md={4}>
          <Box display="flex" alignItems="center" gap={1}>
            {connecting && <CircularProgress size={20} />}
            
            {isConnected && (
              <Chip 
                label="Connected" 
                color="success" 
                size="small"
                variant="outlined"
              />
            )}
            
            {connectionStatus === 'error' && (
              <Chip 
                label="Error" 
                color="error" 
                size="small"
                variant="outlined"
              />
            )}

            <Button
              variant="outlined"
              onClick={loadAvailableDatabases}
              disabled={loadingDatabases}
              size="small"
            >
              {loadingDatabases ? <CircularProgress size={16} /> : 'Refresh'}
            </Button>
          </Box>
        </Grid> */}
      </Grid>

      {/* Status Message */}
      {connectionStatus !== 'idle' && statusMessage && (
        <Box mt={2}>
          <Alert severity={connectionStatus === 'success' ? 'success' : 'error'}>
            {statusMessage}
          </Alert>
        </Box>
      )}

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
          {!databaseName ? 'Select a database to connect automatically' : 
           !isConnected ? 'Connecting to database...' :
           !collectionName ? 'Select a collection to begin editing' :
           'Ready to edit documents'}
        </Typography>
      </Box>
    </Box>
  );
};