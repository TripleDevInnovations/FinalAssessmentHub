import React, { useState } from "react";
import { Box, Link, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

const InformationPage: React.FC = () => {
  const repoUrl = "https://github.com/TripleDevInnovations/FinalAssessmentHub";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(repoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // Nach 1.5 Sekunden zurücksetzen
    } catch (err) {
      console.error("Fehler beim Kopieren:", err);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Link
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
        variant="h5"
      >
        {repoUrl}
      </Link>
      <Tooltip title={copied ? "Kopiert!" : "Link kopieren"}>
        <IconButton onClick={handleCopy} size="small" color={copied ? "success" : "default"}>
          {copied ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default InformationPage;
