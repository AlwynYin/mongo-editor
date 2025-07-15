import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ApiResponse } from '@mongo-editor/shared';

interface ConnectionConfigProps {
  databaseName: string;
  onDatabaseNameChange: (dbName: string) => void;
  onConnectionSuccess: () => void;
  onConnectionError: (error: string) => void;
}

export const ConnectionConfig: React.FC<ConnectionConfigProps> = ({
  databaseName,
  onDatabaseNameChange,
  onConnectionSuccess,
  onConnectionError
}) => {
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);

  // Load available databases on component mount
  useEffect(() => {
    loadAvailableDatabases();
  }, []);

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

  const testConnection = async () => {
    if (!databaseName.trim()) {
      onConnectionError('Database name is required');
      return;
    }

    setTesting(true);
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
        setStatusMessage('Connection successful!');
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
      setTesting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !testing) {
      testConnection();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        MongoDB Database Connection
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          {availableDatabases.length > 0 ? (
            <FormControl fullWidth size="small">
              <InputLabel>Database</InputLabel>
              <Select
                value={databaseName}
                onChange={(e) => onDatabaseNameChange(e.target.value)}
                label="Database"
              >
                {availableDatabases.map(db => (
                  <MenuItem key={db} value={db}>{db}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              label="Database Name"
              value={databaseName}
              onChange={(e) => onDatabaseNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter database name"
              variant="outlined"
              size="small"
              disabled={loadingDatabases}
            />
          )}
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Button
            variant="contained"
            onClick={testConnection}
            disabled={testing || !databaseName.trim()}
            fullWidth
            size="medium"
          >
            {testing ? <CircularProgress size={20} /> : 'Connect'}
          </Button>
        </Grid>

        <Grid item xs={12} md={3}>
          <Button
            variant="outlined"
            onClick={loadAvailableDatabases}
            disabled={loadingDatabases}
            fullWidth
            size="medium"
          >
            {loadingDatabases ? <CircularProgress size={20} /> : 'Refresh DBs'}
          </Button>
        </Grid>
      </Grid>

      {connectionStatus !== 'idle' && (
        <Box mt={2}>
          <Alert severity={connectionStatus === 'success' ? 'success' : 'error'}>
            {statusMessage}
          </Alert>
        </Box>
      )}

      <Box mt={1}>
        <Typography variant="caption" color="text.secondary">
          Select a database to connect.
        </Typography>
      </Box>
    </Box>
  );
};