import React, { useState, useEffect } from 'react';
import {
  Box,
  Link,
  IconButton,
  Tooltip,
  Typography,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';

const InformationPage: React.FC = () => {
  const { t } = useTranslation();
  const repoUrl = 'https://github.com/TripleDevInnovations/FinalAssessmentHub';
  const [copied, setCopied] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI
        .getAppVersion()
        .then((version) => setAppVersion(version))
        .catch(() => setAppVersion(t('about.loading')));
    }
  }, [t]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(repoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silently fail or add error handling if needed
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 700,
        margin: '40px auto',
        px: 3,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('about.title')}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('about.version')}
            </Typography>
            <Typography color="text.secondary">
              {appVersion || t('about.loading')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('about.madeBy')}
            </Typography>
            <Typography color="text.secondary">
              Janek Hans Georg Heese <br/>
              Benno Kubsch <br/>
              Moritz Atmanspacher</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('about.productOwner')}
            </Typography>
            <Typography color="text.secondary">David Schmorrde</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('about.projectInfo')}
            </Typography>
            <Typography
              color="text.secondary"
              component="div"
              sx={{ whiteSpace: 'pre-line' }}
              dangerouslySetInnerHTML={{ __html: t('about.projectDescription', {school: "Berufliches Schulzentrum für Elektrotechnik Dresden", teacher: "Frau Riester"}) }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('about.githubRepo')}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Link
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ wordBreak: 'break-all' }}
              >
                {repoUrl}
              </Link>
              <Tooltip title={copied ? t('about.copied') : t('about.copyLink')}>
                <IconButton
                  onClick={handleCopy}
                  size="small"
                  color={copied ? 'success' : 'default'}
                  aria-label="Copy GitHub repository link"
                >
                  {copied ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default InformationPage;