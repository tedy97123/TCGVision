// src/api.js
import axios from 'axios';

// Single-card identification
export async function identifySingleCard(formData) {
  // `formData` should contain the file data to upload (the same logic from your handleSubmit).
  const response = await axios.post(
    'http://localhost:5000/api/identify-card',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  // Return the entire response or just `response.data`
  return response.data;
}

// Multiple-cards identification (if you had such an endpoint)
export async function identifyMultipleCards(formData) {
  const response = await axios.post(
    'http://localhost:5000/api/identify-cards', // or "/identify-multiple-cards"
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
}
