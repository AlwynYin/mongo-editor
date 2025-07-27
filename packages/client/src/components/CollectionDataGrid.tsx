import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataGrid, GridColDef, GridRowsProp, GridRowModel, GridRowModesModel, GridEventListener, GridRowEditStopReasons, useGridApiRef } from '@mui/x-data-grid';
import { Box, Typography, Alert } from '@mui/material';
import { ApiResponse, PaginatedResult, MongoDocument } from '@mongo-editor/shared';
import { isFieldEditable, convertFieldValue, getFieldTypeFromSchema, FieldType } from '../utils/fieldTypeDetection';
import { CustomGridToolbar } from './CustomGridToolbar';
import { AddRowModal } from './AddRowModal';
import { AddColumnModal } from './AddColumnModal';
import { EditableColumnHeader } from './EditableColumnHeader';
import { CustomColumnMenu } from './CustomColumnMenu';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

interface CollectionDataGridProps {
  collectionName: string;
  readonly?: boolean;
  onDocumentChange?: (document: MongoDocument) => void;
  onEditSuccess?: (message: string) => void;
  onEditError?: (message: string) => void;
}

export const CollectionDataGrid: React.FC<CollectionDataGridProps> = ({
  collectionName,
  readonly = false,
  onDocumentChange,
  onEditSuccess,
  onEditError
}) => {
  const [documents, setDocuments] = useState<MongoDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [schema, setSchema] = useState<Record<string, string> | null>(null);
  const [addRowModalOpen, setAddRowModalOpen] = useState(false);
  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [editingColumnField, setEditingColumnField] = useState<string | null>(null);
  const [removeColumnField, setRemoveColumnField] = useState<string | null>(null);
  const [removingColumn, setRemovingColumn] = useState(false);
  const [rowSelectionModel, setRowSelectionModel] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingRows, setDeletingRows] = useState(false);
  
  const apiRef = useGridApiRef();

  useEffect(() => {
    if (collectionName) {
      console.log(`Loading documents - page: ${page + 1}, pageSize: ${pageSize}`);
      loadDocuments();
    }
  }, [collectionName, page, pageSize]);

  // Load schema when collection changes
  useEffect(() => {
    if (collectionName) {
      loadSchema();
    }
  }, [collectionName]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString()
      });
      
      const response = await fetch(`/api/collections/${collectionName}?${params}`);
      const result: ApiResponse<PaginatedResult<MongoDocument>> = await response.json();
      
      if (result.success && result.data) {
        setDocuments(result.data.data);
        setTotalCount(result.data.total);
      } else {
        setError(result.error || 'Failed to load documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionName}/schema`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // console.log('Schema API response:', result.data);
        let schemaToUse: Record<string, string> | null = null;
        
        // Prefer JSON Schema if it exists, fallback to inferred schema
        if (result.data.jsonSchema) {
          // console.log('Using JSON Schema:', result.data.jsonSchema);
          // Extract fields from JSON Schema
          schemaToUse = extractFieldsFromJsonSchema(result.data.jsonSchema);
        } else if (result.data.inferredSchema) {
          // console.log('Using inferred schema:', result.data.inferredSchema);
          // Use inferred schema as fallback
          schemaToUse = result.data.inferredSchema;
        }
        
        setSchema(schemaToUse);
        // console.log('CollectionDataGrid loaded schema:', schemaToUse);
      }
    } catch (error) {
      console.warn('Failed to load schema:', error);
      // Don't set error state, just continue without schema
    }
  };

  const columns: GridColDef[] = useMemo(() => {
    if (documents.length === 0) return [];

    const allKeys = new Set<string>();
    documents.forEach(doc => {
      Object.keys(doc).forEach(key => {
        // Skip the 'id' field that we add for DataGrid - only show MongoDB fields
        if (key !== 'id') {
          allKeys.add(key);
        }
      });
    });

    return Array.from(allKeys).map(key => {
      // Use schema-based type detection with fallback to sample value
      const fieldType = getFieldTypeFromSchema(key, documents, schema || undefined);
      const editable = !readonly && isFieldEditable(key, fieldType);
      
      return {
        field: key,
        headerName: key,
        sortable: false,
        editable,
        type: fieldType === 'number' ? 'number' : 
              fieldType === 'boolean' ? 'boolean' : 'string',
        renderHeader: () => (
          <EditableColumnHeader
            field={key}
            headerName={key}
            isEditing={editingColumnField === key}
            onRename={handleRenameColumn}
            onCancelEdit={handleCancelRenameColumn}
          />
        ),
        width: 150,
        valueGetter: (_, row) => {
          const val = row[key];
          if (val === null) return null;
          if (val === undefined) return '';
          
          // Handle date fields specially
          if (fieldType === 'date') {
            if (val instanceof Date) {
              return val;
            }
            if (typeof val === 'string') {
              const date = new Date(val);
              return isNaN(date.getTime()) ? val : date;
            }
            return val;
          }
          
          if (typeof val === 'object') {
            if (val instanceof Date) {
              return val;
            }
            return JSON.stringify(val);
          }
          return String(val);
        },
        valueFormatter: fieldType === 'date' ? (value: any) => {
          if (!value) return '';
          if (value instanceof Date) {
            return value.toLocaleDateString();
          }
          if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? value : date.toLocaleDateString();
          }
          return String(value);
        } : undefined,
        valueSetter: (value, row) => {
          if (!editable) return row;
          
          // Convert the value to the appropriate type
          const convertedValue = convertFieldValue(String(value), fieldType);
          return { ...row, [key]: convertedValue };
        }
      } as GridColDef;
    });
  }, [documents, schema, readonly, editingColumnField]);

  const rows: GridRowsProp = useMemo(() => {
    return documents.map((doc, index) => ({
      id: doc._id || index,
      ...doc
    }));
  }, [documents]);


  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      return;
    }
  };

  const processRowUpdate = async (newRow: GridRowModel): Promise<GridRowModel> => {
    try {
      // Remove the 'id' field that DataGrid adds automatically - we only want MongoDB fields
      const { id, ...mongoDocument } = newRow;

      const params = new URLSearchParams();

      const response = await fetch(`/api/collections/${collectionName}/${newRow._id}?${params}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mongoDocument),
      });

      const result: ApiResponse<MongoDocument> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document');
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc._id === newRow._id ? { ...newRow } as MongoDocument : doc
      ));

      // Notify callbacks
      onDocumentChange?.(newRow as MongoDocument);
      onEditSuccess?.('Document updated successfully!');

      return newRow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document';
      onEditError?.(errorMessage);
      throw error;
    }
  };

  const handleProcessRowUpdateError = (error: Error) => {
    onEditError?.(error.message);
  };

  const extractFieldsFromJsonSchema = (jsonSchema: any): Record<string, string> => {
    const fields: Record<string, string> = {};
    
    // Handle both wrapped ($jsonSchema) and unwrapped formats
    let schemaProperties;
    if (jsonSchema && jsonSchema.$jsonSchema && jsonSchema.$jsonSchema.properties) {
      // Wrapped format: { $jsonSchema: { properties: {...} } }
      schemaProperties = jsonSchema.$jsonSchema.properties;
    } else if (jsonSchema && jsonSchema.properties) {
      // Unwrapped format: { properties: {...} }
      schemaProperties = jsonSchema.properties;
    }
    
    if (schemaProperties) {
      Object.entries(schemaProperties).forEach(([field, definition]: [string, any]) => {
        // Convert back from JSON Schema to our field types
        if (definition.bsonType) {
          const bsonType = Array.isArray(definition.bsonType) ? definition.bsonType[0] : definition.bsonType;
          switch (bsonType) {
            case 'string':
              fields[field] = 'string';
              break;
            case 'int':
            case 'long':
            case 'double':
              fields[field] = 'number';
              break;
            case 'bool':
              fields[field] = 'boolean';
              break;
            case 'date':
              fields[field] = 'date';
              break;
            case 'objectId':
              fields[field] = 'objectId';
              break;
            case 'array':
              fields[field] = 'array';
              break;
            case 'object':
              fields[field] = 'object';
              break;
            default:
              fields[field] = 'string'; // Default fallback
          }
        } else {
          fields[field] = 'string'; // Default fallback
        }
      });
    }
    
    // console.log('extractFieldsFromJsonSchema result:', fields);
    return fields;
  };

  const handleAddRow = async (newDocument: Partial<MongoDocument>) => {
    try {
      const response = await fetch(`/api/collections/${collectionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDocument),
      });

      const result: ApiResponse<MongoDocument> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create document');
      }

      // Reload documents from server to ensure proper grid refresh
      await loadDocuments();
      
      // Notify callbacks
      onDocumentChange?.(result.data!);
      onEditSuccess?.('Document created successfully!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
      onEditError?.(errorMessage);
    }
  };

  const handleAddColumn = async (fieldName: string, fieldType: FieldType, defaultValue: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionName}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldName,
          fieldType,
          defaultValue: defaultValue || undefined
        }),
      });

      const result: ApiResponse<{ modifiedCount: number }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add column');
      }

      // Refresh the data and schema
      await loadSchema();
      await loadDocuments();
      
      onEditSuccess?.(`Column "${fieldName}" added successfully! ${result.data?.modifiedCount || 0} documents updated.`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add column';
      onEditError?.(errorMessage);
    }
  };

  const handleStartRenameColumn = (field: string) => {
    setEditingColumnField(field);
  };

  const handleCancelRenameColumn = () => {
    setEditingColumnField(null);
  };

  const handleRenameColumn = async (oldFieldName: string, newFieldName: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionName}/fields/${oldFieldName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newFieldName
        }),
      });

      const result: ApiResponse<{ modifiedCount: number }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to rename column');
      }

      // Refresh the data and schema
      await loadSchema();
      await loadDocuments();
      
      onEditSuccess?.(`Column renamed from "${oldFieldName}" to "${newFieldName}" successfully! ${result.data?.modifiedCount || 0} documents updated.`);
      
      setEditingColumnField(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename column';
      onEditError?.(errorMessage);
      setEditingColumnField(null);
    }
  };

  const handleRemoveColumn = (field: string) => {
    setRemoveColumnField(field);
  };

  const confirmRemoveColumn = async () => {
    if (!removeColumnField) return;
    setRemovingColumn(true);
    try {
      const response = await fetch(`/api/collections/${collectionName}/fields/${removeColumnField}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove column');
      }
      await loadSchema();
      await loadDocuments();
      onEditSuccess?.(`Column "${removeColumnField}" removed successfully! ${(result.data?.modifiedCount ?? result.modifiedCount) || 0} documents updated.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove column';
      onEditError?.(errorMessage);
    } finally {
      setRemovingColumn(false);
      setRemoveColumnField(null);
    }
  };

  const cancelRemoveColumn = () => {
    setRemoveColumnField(null);
  };

  const handleDeleteRows = () => {
    if (rowSelectionModel.length > 0) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleCancelDeleteRows = () => {
    setDeleteConfirmOpen(false);
  };

  const confirmDeleteRows = async () => {
    if (rowSelectionModel.length === 0) return;

    setDeletingRows(true);
    setDeleteConfirmOpen(false);

    try {
      const deletePromises = rowSelectionModel.map(async (rowId) => {
        const response = await fetch(`/api/collections/${collectionName}/${rowId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to delete document');
        }

        return response.json();
      });

      await Promise.all(deletePromises);

      // Reload documents to ensure consistency
      await loadDocuments();
      
      // Clear selection
      setRowSelectionModel([]);
      
      const deletedCount = rowSelectionModel.length;
      onEditSuccess?.(`Successfully deleted ${deletedCount} row${deletedCount > 1 ? 's' : ''}!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete rows';
      onEditError?.(errorMessage);
      // Reload documents in case some deletions succeeded
      await loadDocuments();
    } finally {
      setDeletingRows(false);
    }
  };

  // Get all existing field names for validation
  const existingFields = useMemo(() => {
    const fieldSet = new Set<string>();
    
    if (schema) {
      Object.keys(schema).forEach(field => fieldSet.add(field));
    }
    
    documents.forEach(doc => {
      Object.keys(doc).forEach(field => {
        if (field !== 'id') {
          fieldSet.add(field);
        }
      });
    });
    
    return Array.from(fieldSet);
  }, [documents, schema]);

  if (error) {
    return (
      <Alert severity="error">
        Error loading documents: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Collection: {collectionName}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            {totalCount.toLocaleString()} total documents
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <DataGrid
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={totalCount}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            console.log('Pagination changed:', model);
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection={!readonly}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          slots={{
            toolbar: CustomGridToolbar,
            columnMenu: (props) => (
              <CustomColumnMenu
                {...props}
                onRenameColumn={handleStartRenameColumn}
                onRemoveColumn={handleRemoveColumn}
                readonly={readonly}
              />
            ),
          }}
          slotProps={{
            toolbar: {
              onAddRow: () => setAddRowModalOpen(true),
              onAddColumn: () => setAddColumnModalOpen(true),
              onDeleteRows: handleDeleteRows,
              selectedRowCount: rowSelectionModel.length,
              deletingRows: deletingRows,
              readonly: readonly
            } as any
          }}
          // disableRowSelectionOnClick
          // disableColumnFilter
          // disableDensitySelector
          initialState={{
            columns: {
              columnVisibilityModel: {
                _id: false,
              },
            },
          }}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          sx={{
            height: '100%',
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: '0.875rem',
              fontWeight: 600
            },
            '& .MuiDataGrid-cell--editable': {
              backgroundColor: 'transparent'
            }
          }}
        />
      </Box>

      <AddRowModal
        open={addRowModalOpen}
        onClose={() => setAddRowModalOpen(false)}
        onSubmit={handleAddRow}
        existingDocuments={documents}
        schema={schema || undefined}
      />

      <AddColumnModal
        open={addColumnModalOpen}
        onClose={() => setAddColumnModalOpen(false)}
        onSubmit={handleAddColumn}
        existingFields={existingFields}
      />

      <Dialog open={!!removeColumnField} onClose={cancelRemoveColumn}>
        <DialogTitle>Remove Column</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the column "{removeColumnField}" from all documents? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRemoveColumn} disabled={removingColumn}>Cancel</Button>
          <Button onClick={confirmRemoveColumn} color="error" disabled={removingColumn} autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleCancelDeleteRows}>
        <DialogTitle>Delete Rows</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {rowSelectionModel.length} row{rowSelectionModel.length > 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteRows} disabled={deletingRows}>Cancel</Button>
          <Button onClick={confirmDeleteRows} color="error" disabled={deletingRows} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};