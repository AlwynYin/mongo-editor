import React, { useState, useEffect, useMemo } from 'react';
import { DataGrid, GridColDef, GridRowsProp, GridRowModel, GridRowModes, GridRowModesModel, GridEventListener, GridRowEditStopReasons } from '@mui/x-data-grid';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { ApiResponse, PaginatedResult, MongoDocument } from '@mongo-editor/shared';
import { detectFieldType, isFieldEditable, convertFieldValue } from '../utils/fieldTypeDetection';

interface CollectionDataGridProps {
  databaseName: string;
  collectionName: string;
  readonly?: boolean;
  editorId?: string;
  onDocumentChange?: (document: MongoDocument) => void;
  onEditSuccess?: (message: string) => void;
  onEditError?: (message: string) => void;
}

export const CollectionDataGrid: React.FC<CollectionDataGridProps> = ({
  databaseName,
  collectionName,
  readonly = false,
  editorId,
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

  useEffect(() => {
    if (databaseName && collectionName) {
      console.log(`Loading documents - page: ${page + 1}, pageSize: ${pageSize}`);
      loadDocuments();
    }
  }, [databaseName, collectionName, page, pageSize]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString()
      });
      
      const response = await fetch(`/api/collections/${databaseName}/${collectionName}?${params}`);
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
      // Detect field type from first non-null value
      const sampleValue = documents.find(doc => doc[key] != null)?.[key];
      const fieldType = detectFieldType(sampleValue);
      const editable = !readonly && isFieldEditable(key, fieldType);
      
      return {
        field: key,
        headerName: key,
        width: key === '_id' ? 200 : 150,
        flex: key === '_id' ? 0 : 1,
        sortable: false,
        editable,
        type: fieldType === 'number' ? 'number' : 
              fieldType === 'boolean' ? 'boolean' : 'string',
        valueGetter: (value, row) => {
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
        valueFormatter: fieldType === 'date' ? (value) => {
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
  }, [documents]);

  const rows: GridRowsProp = useMemo(() => {
    return documents.map((doc, index) => ({
      id: doc._id || index,
      ...doc
    }));
  }, [documents]);


  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = async (newRow: GridRowModel): Promise<GridRowModel> => {
    try {
      // Remove the 'id' field that DataGrid adds automatically - we only want MongoDB fields
      const { id, ...mongoDocument } = newRow;

      const params = new URLSearchParams();
      if (editorId) {
        params.set('editorId', editorId);
      }

      const response = await fetch(`/api/collections/${databaseName}/${collectionName}/${newRow._id}?${params}`, {
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
        <Typography variant="body2" color="text.secondary">
          {totalCount.toLocaleString()} total documents
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <DataGrid
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
          disableSelectionOnClick
          disableColumnFilter
          disableColumnMenu
          disableDensitySelector
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          sx={{
            height: '100%',
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem'
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: '0.875rem',
              fontWeight: 600
            },
            '& .MuiDataGrid-cell--editable': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
      </Box>
    </Box>
  );
};