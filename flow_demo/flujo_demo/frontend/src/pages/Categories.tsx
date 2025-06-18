import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function Categories() {
  const navigate = useNavigate();

  return (
    <Box p={8}>
      <Stack gap={8}>
        <Box>
          <Heading as="h1" size="xl" mb={6}>
            Gestión de Categorías
          </Heading>
          <Text mb={6}>
            Aquí puedes gestionar tus categorías de ingresos y gastos.
          </Text>
          <Button 
            colorScheme="blue" 
            onClick={() => navigate('/dashboard')}
            mb={4}
          >
            Volver al Inicio
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
