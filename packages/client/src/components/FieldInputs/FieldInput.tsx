import React from 'react';
import { TextField, FormControlLabel, Checkbox, Chip } from '@mui/material';
import { DocumentField } from '@mongo-editor/shared';
import { isFieldEditable, getFieldTypeLabel } from '../../utils/fieldTypeDetection';

interface FieldInputProps {
  field: DocumentField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const FieldInput: React.FC<FieldInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false
}) => {
  const editable = isFieldEditable(field.name, field.type);
  const hasError = !!error;

  if (field.type === 'boolean') {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            disabled={!editable || disabled}
          />
        }
        label={field.name}
      />
    );
  }

  return (
    <TextField
      fullWidth
      label={field.name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={hasError}
      helperText={error}
      disabled={!editable || disabled}
      required={field.required}
      type={getInputType(field.type)}
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

function getInputType(fieldType: string): string {
  switch (fieldType) {
    case 'number': return 'number';
    case 'date': return 'date';
    case 'email': return 'email';
    default: return 'text';
  }
}