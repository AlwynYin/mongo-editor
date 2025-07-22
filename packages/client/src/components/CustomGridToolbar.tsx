import React from 'react';
import {
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarProps,
} from '@mui/x-data-grid';
import { Button, Box } from '@mui/material';
import { Add as AddIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';

interface CustomGridToolbarProps extends GridToolbarProps {
  onAddRow?: () => void;
  onAddColumn?: () => void;
  readonly?: boolean;
}

export const CustomGridToolbar: React.FC<CustomGridToolbarProps> = ({
  onAddRow,
  onAddColumn,
  readonly = false
}) => {
  return (
    <GridToolbarContainer>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {!readonly && onAddRow && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddRow}
            variant="outlined"
          >
            Add Row
          </Button>
        )}
        {!readonly && onAddColumn && (
          <Button
            size="small"
            startIcon={<ViewColumnIcon />}
            onClick={onAddColumn}
            variant="outlined"
          >
            Add Column
          </Button>
        )}
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </Box>
    </GridToolbarContainer>
  );
};