import React from "react";
import { ListItem, ListItemButton, ListItemText, ListItemAvatar, Avatar } from "@mui/material";
import { Entry } from "../types";

interface Props {
  entry: Entry;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const EntryListItem = ({ entry, isSelected, onSelect }: Props) => {
  const initials = entry.name
    .split(' ')
    .map((s) => s[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isSelected}
        onClick={() => onSelect(entry.id)}
        sx={{
          borderRadius: 2,
          m: 1,
          '&.Mui-selected': {
            backgroundColor: 'action.selected',
            fontWeight: 'bold',
          }
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.500', color: 'white' }}>
            {initials}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={entry.name} primaryTypographyProps={{ noWrap: true }} />
      </ListItemButton>
    </ListItem>
  );
};

export default React.memo(EntryListItem);
