import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { MongoDocument } from '@mongo-editor/shared';
import { FieldType, convertFieldValue, getFieldTypeFromSchema } from '../utils/fieldTypeDetection';

interface AddRowModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (document: Partial<MongoDocument>) => void;
  existingDocuments: MongoDocument[];
  schema?: Record<string, string>;
}

export const AddRowModal: React.FC<AddRowModalProps> = ({
  open,
  onClose,
  onSubmit,
  existingDocuments,
  schema
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Get all unique field names from existing documents and schema
  const allFields = React.useMemo(() => {
    const fieldSet = new Set<string>();
    
    // Add fields from schema
    if (schema) {
      Object.keys(schema).forEach(field => fieldSet.add(field));
    }
    // console.log("schema");
    // console.log(schema);
    
    // Add fields from existing documents
    existingDocuments.forEach(doc => {
      Object.keys(doc).forEach(field => {
        if (field !== 'id') { // Skip DataGrid's auto-generated id
          fieldSet.add(field);
        }
      });
    });
    
    // Remove _id as it's auto-generated
    fieldSet.delete('_id');
    
    return Array.from(fieldSet).sort();
  }, [existingDocuments, schema]);
  // console.log("allFields");
  // console.log(allFields);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const initialData: Record<string, string> = {};
      allFields.forEach(field => {
        const fieldType = getFieldTypeFromSchema(field, existingDocuments, schema);
        // Set default values based on field type
        switch (fieldType) {
          case 'number':
            initialData[field] = '0';
            break;
          case 'boolean':
            initialData[field] = 'false';
            break;
          case 'date':
            initialData[field] = new Date().toISOString().split('T')[0];
            break;
          default:
            initialData[field] = '';
        }
      });
      setFormData(initialData);
    }
  }, [open, allFields, existingDocuments, schema]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBooleanChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked.toString()
    }));
  };

  const handleSubmit = () => {
    const document: Partial<MongoDocument> = {};
    
    // Convert form data to appropriate types
    Object.entries(formData).forEach(([field, value]) => {
      const fieldType = getFieldTypeFromSchema(field, existingDocuments, schema);
      if (value !== '' && value !== null) {
        document[field] = convertFieldValue(value, fieldType);
      }
    });

    onSubmit(document);
    onClose();
  };

  const renderFieldInput = (field: string) => {
    const fieldType = getFieldTypeFromSchema(field, existingDocuments, schema);
    const value = formData[field] || '';

    switch (fieldType) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value === 'true'}
                onChange={(e) => handleBooleanChange(field, e.target.checked)}
              />
            }
            label={field}
            key={field}
          />
        );

      case 'number':
        return (
          <TextField
            key={field}
            label={field}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            fullWidth
            margin="normal"
          />
        );

      case 'date':
        return (
          <TextField
            key={field}
            label={field}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        );

      default: // string, objectId, unknown
        return (
          <TextField
            key={field}
            label={field}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            fullWidth
            margin="normal"
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Document</DialogTitle>
      <DialogContent>
        {allFields.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary" gutterBottom>
              No fields available for this collection.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please add columns to the collection first using the "Add Column" button in the toolbar.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {allFields.map(field => renderFieldInput(field))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={allFields.length === 0}
        >
          Add Document
        </Button>
      </DialogActions>
    </Dialog>
  );
};