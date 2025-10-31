import React from "react";
import { Card, CardActionArea, CardContent, Avatar, Box, Typography } from "@mui/material";
import { Entry } from "../types";

interface Props {
  entry: Entry;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const EntryListItem = ({ entry, isSelected, onSelect }: EntryListItemProps) => {
  const initials = entry.name
    .split(' ')
    .map((s) => s[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderColor: isSelected ? 'primary.main' : 'transparent',
        boxShadow: isSelected ? 3 : 0,
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      <CardActionArea onClick={() => onSelect(entry.id)}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.500' }}>
            {initials}
          </Avatar>
          <Typography noWrap fontWeight={isSelected ? 600 : 500}>
            {entry.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default React.memo(EntryListItem);
