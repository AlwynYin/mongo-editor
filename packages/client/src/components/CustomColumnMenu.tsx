import React from 'react';
import {
  GridColumnMenu,
  GridColumnMenuProps,
  GridColumnMenuContainer,
  GridColumnMenuFilterItem,
  GridColumnMenuSortItem,
  GridColumnMenuColumnsItem,
  GridColumnMenuHideItem,
} from '@mui/x-data-grid';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface CustomColumnMenuProps extends GridColumnMenuProps {
  onRenameColumn?: (field: string) => void;
  onRemoveColumn?: (field: string) => void;
  readonly?: boolean;
}

export const CustomColumnMenu: React.FC<CustomColumnMenuProps> = (props) => {
  const { onRenameColumn, onRemoveColumn, readonly = false, ...other } = props;
  
  // Don't show rename option for readonly mode or _id field
  const canRename = !readonly && props.colDef.field !== '_id' && onRenameColumn;
  const canRemove = !readonly && props.colDef.field !== '_id' && onRemoveColumn;

  return (
    <GridColumnMenuContainer {...other}>
      <GridColumnMenuSortItem onClick={props.hideMenu} colDef={props.colDef} />
      <GridColumnMenuFilterItem onClick={props.hideMenu} colDef={props.colDef} />
      {/* <GridColumnMenuHideItem onClick={props.hideMenu} colDef={props.colDef} /> */}
      <GridColumnMenuColumnsItem onClick={props.hideMenu} colDef={props.colDef} />
      {canRename && (
        <MenuItem 
          onClick={() => {
            if (onRenameColumn) onRenameColumn(props.colDef.field);
            props.hideMenu?.();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename Column</ListItemText>
        </MenuItem>
      )}
      {canRemove && (
        <MenuItem
          onClick={() => {
            if (onRemoveColumn) onRemoveColumn(props.colDef.field);
            props.hideMenu?.();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove Column</ListItemText>
        </MenuItem>
      )}
    </GridColumnMenuContainer>
  );
};