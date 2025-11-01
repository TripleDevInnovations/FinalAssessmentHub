import React from 'react';
import { PaletteMode } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Paper
} from '@mui/material';

type Props = {
  toggleColorMode: () => void;
  currentMode: PaletteMode;
};

const languages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
];

const SettingsPage: React.FC<Props> = ({ toggleColorMode, currentMode }) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('settings.settings_text')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {/* Hinweis: Übersetzung key 'settings_note' optional */}
            {t('settings.settings_change_language_note')}
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="language-select-label">Sprache</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={i18n.language || 'de'}
            label="Sprache"
            onChange={(e) => handleLanguageChange(String(e.target.value))}
            size="small"
          >
            {languages.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.appearance')}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">
              {currentMode === 'dark' ? (t('settings.dark_mode')) : (t('settings.light_mode'))}
            </Typography>
            <Button variant="outlined" onClick={toggleColorMode}>
              {t('settings.toggle_theme_button')}
            </Button>
          </Stack>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('settings.note_no_persist')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default SettingsPage;
