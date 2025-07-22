import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { FieldType } from '../utils/fieldTypeDetection';

interface AddColumnModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fieldName: string, fieldType: FieldType, defaultValue: string) => void;
  existingFields: string[];
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  open,
  onClose,
  onSubmit,
  existingFields
}) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('string');
  const [defaultValue, setDefaultValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    
    // Validate field name
    if (!fieldName.trim()) {
      setError('Field name is required');
      return;
    }
    
    if (existingFields.includes(fieldName.trim())) {
      setError('Field name already exists');
      return;
    }
    
    // Validate field name format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName.trim())) {
      setError('Field name must start with a letter or underscore and contain only letters, numbers, and underscores');
      return;
    }
    
    onSubmit(fieldName.trim(), fieldType, defaultValue);
    handleClose();
  };

  const handleClose = () => {
    setFieldName('');
    setFieldType('string');
    setDefaultValue('');
    setError('');
    onClose();
  };

  const getDefaultValueForType = (type: FieldType): string => {
    switch (type) {
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'date':
        return new Date().toISOString().split('T')[0];
      default:
        return '';
    }
  };

  const handleTypeChange = (newType: FieldType) => {
    setFieldType(newType);
    setDefaultValue(getDefaultValueForType(newType));
  };

  const renderDefaultValueInput = () => {
    switch (fieldType) {
      case 'number':
        return (
          <TextField
            label="Default Value"
            type="number"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            fullWidth
            margin="normal"
          />
        );

      case 'boolean':
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>Default Value</InputLabel>
            <Select
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              label="Default Value"
            >
              <MenuItem value="false">False</MenuItem>
              <MenuItem value="true">True</MenuItem>
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            label="Default Value"
            type="date"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        );

      default: // string
        return (
          <TextField
            label="Default Value"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Enter default text value"
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Column</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Field Name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            fullWidth
            error={!!error}
            helperText={error || 'Use letters, numbers, and underscores only'}
            autoFocus
          />
          
          <FormControl fullWidth>
            <InputLabel>Field Type</InputLabel>
            <Select
              value={fieldType}
              onChange={(e) => handleTypeChange(e.target.value as FieldType)}
              label="Field Type"
            >
              <MenuItem value="string">Text (String)</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="boolean">Boolean (True/False)</MenuItem>
              <MenuItem value="date">Date</MenuItem>
            </Select>
          </FormControl>

          {renderDefaultValueInput()}
          
          <Typography variant="caption" color="text.secondary">
            This field will be added to all existing documents with the default value.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!fieldName.trim()}
        >
          Add Column
        </Button>
      </DialogActions>
    </Dialog>
  );
};