import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import { MongoDocument, DocumentField } from '@mongo-editor/shared';
import { 
  createFormFields, 
  valueToString, 
  isFieldEditable,
  getFieldTypeLabel
} from '../utils/fieldTypeDetection';
import { validateDocument, hasFormChanges } from '../utils/validation';

interface DocumentEditModalProps {
  document: MongoDocument | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedDoc: MongoDocument) => Promise<void>;
  collectionName: string;
}

export const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  document,
  open,
  onClose,
  onSave,
  collectionName
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Create field definitions from document
  const fields: DocumentField[] = useMemo(() => {
    return document ? createFormFields(document) : [];
  }, [document]);

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      const initialData: Record<string, string> = {};
      fields.forEach(field => {
        const value = document[field.name];
        initialData[field.name] = valueToString(value, field.type);
      });
      setFormData(initialData);
      setValidationErrors({});
      setError(null);
    }
  }, [document, fields]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!document) return;

    // Validate form data
    const validation = validateDocument(formData, fields);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setValidationErrors(errorMap);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create updated document with converted values
      const updatedDoc = {
        ...document,
        ...validation.convertedValue
      };

      await onSave(updatedDoc);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValidationErrors({});
    setError(null);
    onClose();
  };

  const hasChanges = useMemo(() => {
    return document ? hasFormChanges(formData, document, fields) : false;
  }, [formData, document, fields]);

  const renderFieldInput = (field: DocumentField) => {
    const value = formData[field.name] || '';
    const hasError = !!validationErrors[field.name];
    const editable = isFieldEditable(field.name, field.type);

    if (field.type === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={value === 'true'}
              onChange={(e) => handleFieldChange(field.name, e.target.checked ? 'true' : 'false')}
              disabled={!editable || loading}
            />
          }
          label={field.name}
        />
      );
    }

    return (
      <TextField
        key={field.name}
        fullWidth
        label={field.name}
        value={value}
        onChange={(e) => handleFieldChange(field.name, e.target.value)}
        error={hasError}
        helperText={validationErrors[field.name]}
        disabled={!editable || loading}
        required={field.required}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        size="small"
        InputProps={{
          readOnly: !editable,
          endAdornment: (
            <Chip
              label={getFieldTypeLabel(field.type)}
              size="small"
              variant="outlined"
              color={editable ? 'default' : 'secondary'}
            />
          )
        }}
      />
    );
  };

  if (!document) return null;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">
          Edit Document in {collectionName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Document ID: {document._id}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {fields.map(field => (
            <Box key={field.name}>
              {renderFieldInput(field)}
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !hasChanges}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};