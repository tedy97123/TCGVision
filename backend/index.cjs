// backend/index.js

require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cardRoutes = require('./routes/cardRoutes.cjs');
const logger = require('./logger.cjs');
// Initialize Express app
const app = express();
app.use(cors());

// Set up logging with morgan and winston
app.use(morgan('combined'));

// Apply rate limiting to all API routes
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 130, // Limit each IP to 30 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute.',
});
app.use('/api', limiter);

// Use Routes
app.use('/api', cardRoutes);

// Swagger Setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MTG Card Identifier API',
      version: '1.0.0',
      description: 'API for identifying MTG cards from images.',
    },
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
