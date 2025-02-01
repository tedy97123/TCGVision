import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import ImageUploader from './components/ImageUploader';
import CardDataGrid from './components/CardDataGrid'; // Import the DataGrid component
import './App.css';

const App = () => {
  const [cardData, setCardData] = useState(null);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        MTG Scans 
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom>
        Upload card images to identify your cards!
      </Typography>

      {/* ImageUploader handles file upload and sets card data */}
      <ImageUploader onCardData={setCardData} />
      <br></br>
      {/* Show DataGrid if card data exists */}
      {cardData?.cards && (
        <CardDataGrid cards={cardData.cards} />
      )}
    </Container>
  );
};

export default App;
