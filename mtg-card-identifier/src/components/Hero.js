import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CardDataGrid from './CardDataGrid'; 
import { identifyMultipleCards } from '../services/cardInfo';

const StyledBox = styled('div')(({ theme }) => ({
  alignSelf: 'center',
  width: '100%',
  height: 400,
  marginTop: theme.spacing(8),
  borderRadius: (theme.vars || theme).shape.borderRadius,
  outline: '6px solid',
  outlineColor: 'hsla(220, 25%, 80%, 0.2)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.grey[200],
  boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
  backgroundSize: 'cover',
  [theme.breakpoints.up('sm')]: {
    marginTop: theme.spacing(10),
    height: 700,
  },
  ...theme.applyStyles('dark', {
    boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
    outlineColor: 'hsla(220, 20%, 42%, 0.1)',
    borderColor: (theme.vars || theme).palette.grey[700],
  }),
}));

export default function Hero() {
  // NEW: Add state to store card data, loading, and errors
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [cards, setCards] = React.useState([]); // <--- This is where we store the returned card objects

  const handleFileUpload = async (event) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('cardImage', event.target.files[0]);

    try {
      console.log("Calling backend for card identification...");
      const data = await identifyMultipleCards(formData);
      console.log("Data returned from backend:", data);

      // Assuming `data` is an array of card objects from Scryfall
      setCards(data);
    } catch (err) {
      setError('Failed to identify cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        backgroundRepeat: 'no-repeat',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)',
        ...theme.applyStyles('dark', {
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 39.40%, 47.30%), transparent)',
        }),
      })}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 14, sm: 20 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Stack
          spacing={2}
          useFlexGap
          sx={{ alignItems: 'center', width: { xs: '100%', sm: '70%' } }}
        >
          <Typography
            variant="h1"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              fontSize: 'clamp(3rem, 10vw, 3.5rem)',
            }}
          >
            TCG&nbsp;
            <Typography
              component="span"
              variant="h1"
              sx={(theme) => ({
                fontSize: 'inherit',
                color: 'primary.main',
                ...theme.applyStyles('dark', {
                  color: 'primary.light',
                }),
              })}
            >
              Vision
            </Typography>
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              width: { sm: '100%', md: '80%' },
            }}
          >
            Explore our card search using Google Vision and the Scryfall API!
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: '100%', sm: '350px' } }}
          >
            <InputLabel htmlFor="upload-file" sx={visuallyHidden}>
              Upload Card Image
            </InputLabel>
            <Button
              variant="contained"
              color="primary"
              component="label"
              size="small"
              disabled={loading}
              sx={{ minWidth: 'fit-content', marginX: 8 }}
            >
              Upload
              <input
                id="upload-file"
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ minWidth: 'fit-content', marginX: 2 }}
            >
              Export to CSV
            </Button>
            {loading && <CircularProgress sx={{ mt: 2 }} />}
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Stack>
        </Stack>
        {/* 
          This StyledBox remains the same 
          We pass the newly fetched "cards" to our <CardDataGrid> 
        */}
        <StyledBox>
          <CardDataGrid cardData={cards} />
        </StyledBox>
      </Container>
    </Box>
  );
}
