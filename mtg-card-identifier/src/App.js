import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import ImageUploader from './components/ImageUploader';
// import CardDataGrid2 from './components/CardDataGrid2'; // Import the DataGrid2 component
import MarketingPage from './components/MarketingPage';
import './App.css';

const App = () => {
  return (
    // <Container maxWidth="lg" sx={{ mt: 4 }}>
    //   <Typography variant="h3" align="center" gutterBottom>
    //     MTG Scans 
    //   </Typography>
    //   <Typography variant="subtitle1" align="center" gutterBottom>
    //     Upload card images to identify your cards!
    //   </Typography>

    //   {/* ImageUploader handles file upload and sets card data */}
    //   <ImageUploader onCardData={setCardData} />
    //   <br></br>
    //   {/* Show DataGrid2 if card data exists */}
    //   {cardData?.cards && (
    //     <CardDataGrid2 cards={cardData.cards} />
    //   )}
    // </Container>
    <>
      <MarketingPage />
    </>
  );
};

export default App;
