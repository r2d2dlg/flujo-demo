import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ProjectUnitsManager from '../../components/ProjectUnitsManager';

const theme = createTheme();

const ProjectUnitsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <Container>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          ID de proyecto no válido
        </Box>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth={false} sx={{ py: 2, backgroundColor: '#fff', minHeight: '100vh' }}>
        <ProjectUnitsManager projectId={projectId} />
      </Container>
    </ThemeProvider>
  );
};

export default ProjectUnitsPage; 