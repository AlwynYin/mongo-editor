import { DocumentField } from '@mongo-editor/shared';
import { FieldType, convertFieldValue } from './fieldTypeDetection';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  convertedValue?: any;
}

/**
 * Validate a single field value
 */
export function validateField(
  fieldName: string,
  value: string,
  field: DocumentField
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check required fields
  if (field.required && (!value || value.trim() === '')) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`
    });
    return { isValid: false, errors };
  }
  
  // If value is empty and not required, it's valid
  if (!value || value.trim() === '') {
    return { isValid: true, errors: [], convertedValue: null };
  }
  
  // Type-specific validation
  const typeValidation = validateFieldType(value, field.type);
  if (!typeValidation.isValid) {
    errors.push({
      field: fieldName,
      message: typeValidation.message || `Invalid ${field.type} value`
    });
    return { isValid: false, errors };
  }
  
  // Convert value if validation passed
  const convertedValue = convertFieldValue(value, field.type);
  
  return {
    isValid: true,
    errors: [],
    convertedValue
  };
}

/**
 * Validate field type specific rules
 */
function validateFieldType(value: string, type: FieldType): { isValid: boolean; message?: string } {
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      if (isNaN(num)) {
        return { isValid: false, message: 'Must be a valid number' };
      }
      return { isValid: true };
      
    case 'boolean':
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];
      if (!validBooleans.includes(value.toLowerCase())) {
        return { isValid: false, message: 'Must be true, false, yes, or no' };
      }
      return { isValid: true };
      
    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { isValid: false, message: 'Must be a valid date' };
      }
      return { isValid: true };
      
    case 'objectId':
      if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        return { isValid: false, message: 'Must be a valid ObjectId (24 characters)' };
      }
      return { isValid: true };
      
    case 'string':
      // Strings are generally always valid
      return { isValid: true };
      
    case 'unknown':
      return { isValid: false, message: 'Unknown field type cannot be edited' };
      
    default:
      return { isValid: false, message: 'Unsupported field type' };
  }
}

/**
 * Validate entire document form data
 */
export function validateDocument(
  formData: Record<string, string>,
  fields: DocumentField[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const convertedData: Record<string, any> = {};
  
  fields.forEach(field => {
    const value = formData[field.name] || '';
    const validation = validateField(field.name, value, field);
    
    if (!validation.isValid) {
      errors.push(...validation.errors);
    } else {
      convertedData[field.name] = validation.convertedValue;
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    convertedValue: convertedData
  };
}

/**
 * Get user-friendly error message for field
 */
export function getFieldErrorMessage(fieldName: string, type: FieldType): string {
  switch (type) {
    case 'number':
      return `${fieldName} must be a valid number`;
    case 'boolean':
      return `${fieldName} must be true or false`;
    case 'date':
      return `${fieldName} must be a valid date`;
    case 'objectId':
      return `${fieldName} must be a valid ObjectId`;
    case 'string':
      return `${fieldName} must be text`;
    default:
      return `${fieldName} has an invalid value`;
  }
}

/**
 * Check if form has any changes from original
 */
export function hasFormChanges(
  formData: Record<string, string>,
  originalData: Record<string, any>,
  fields: DocumentField[]
): boolean {
  return fields.some(field => {
    const formValue = formData[field.name] || '';
    const originalValue = originalData[field.name];
    
    // Convert original value to string for comparison
    const originalAsString = originalValue === null || originalValue === undefined 
      ? '' 
      : String(originalValue);
    
    return formValue !== originalAsString;
  });
}