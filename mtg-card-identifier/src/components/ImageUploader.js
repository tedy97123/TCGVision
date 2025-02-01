import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
import { identifyMultipleCards } from '../services/cardInfo'; // Import the new service function

const ImageUploader = ({ onCardData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cardImage', event.target.files[0]);

    try {
      const data = await identifyMultipleCards(formData);
      onCardData(data);
    } catch (err) {
      setError('Failed to identify cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box textAlign="center" mt={4}>
      <Button
        variant="contained"
        component="label"
        disabled={loading}
      >
        Upload Image
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileUpload}
        />
      </Button>
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader;
