import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Typography,
  Box,
  SelectChangeEvent
} from '@mui/material';
import { ApiResponse, MongoCollection } from '@mongo-editor/shared';

interface CollectionSelectorProps {
  databaseName: string;
  selectedCollection: string;
  onCollectionChange: (collectionName: string) => void;
}

export const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  databaseName,
  selectedCollection,
  onCollectionChange
}) => {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (databaseName) {
      loadCollections();
    }
  }, [databaseName]);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/collections/${databaseName}`);
      const result: ApiResponse<string[]> = await response.json();
      
      if (result.success && result.data) {
        setCollections(result.data);
      } else {
        setError(result.error || 'Failed to load collections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionChange = (event: SelectChangeEvent) => {
    onCollectionChange(event.target.value);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={20} />
        <Typography>Loading collections...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading collections: {error}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Collection
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Collection</InputLabel>
        <Select
          value={selectedCollection}
          label="Collection"
          onChange={handleCollectionChange}
        >
          {collections.map((collection) => (
            <MenuItem key={collection} value={collection}>
              {collection}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};