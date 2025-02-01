import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';

const CardDataGrid = ({ cards }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!cards || Object.keys(cards).length === 0) {
    return <Box>No cards available to display.</Box>;
  }

  // Transform the cards object into rows for the DataGrid
  const rows = Object.entries(cards).map(([title, card], index) => ({
    id: index, // Unique row ID
    name: card.name || title,
    manaCost: card.mana_cost || '-',
    type: card.type_line || '-',
    rarity: card.rarity || '-',
    setName: card.set_name || '-',
    price: card.prices?.usd || '-',
    imageUrl: card.image_uris?.normal || '', // Image URL
    scryfallUrl: card.scryfall_uri || '', // Hyperlink to Scryfall
  }));

  // Define columns for the DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Card Name', width: 200 },
    { field: 'manaCost', headerName: 'Mana Cost', width: 150 },
    { field: 'type', headerName: 'Type', width: 200 },
    { field: 'rarity', headerName: 'Rarity', width: 150 },
    { field: 'setName', headerName: 'Set Name', width: 200 },
    { field: 'price', headerName: 'Price (USD)', width: 150 },
  ];

  const handleRowClick = (params) => {
    setSelectedCard(params.row);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ height: 900, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 30]}
        onRowClick={handleRowClick}
      />

      {/* Drawer for displaying card details */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Card Details
          </Typography>
          {selectedCard && (
            <>
              {selectedCard.imageUrl && (
                <Box
                  component="img"
                  src={selectedCard.imageUrl}
                  alt={selectedCard.name}
                  sx={{ width: '100%', mb: 2, borderRadius: 1 }}
                />
              )}
              <Typography>
                <strong>Name:</strong> {selectedCard.name}
              </Typography>
              <Typography>
                <strong>Mana Cost:</strong> {selectedCard.manaCost}
              </Typography>
              <Typography>
                <strong>Type:</strong> {selectedCard.type}
              </Typography>
              <Typography>
                <strong>Rarity:</strong> {selectedCard.rarity}
              </Typography>
              <Typography>
                <strong>Set Name:</strong> {selectedCard.setName}
              </Typography>
              <Typography>
                <strong>Price:</strong> ${selectedCard.price}
              </Typography>
              {selectedCard.scryfallUrl && (
                <Typography>
                  <strong>More Info:</strong>{' '}
                  <a href={selectedCard.scryfallUrl} target="_blank" rel="noopener noreferrer">
                    View on Scryfall
                  </a>
                </Typography>
              )}
            </>
          )}
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setDrawerOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CardDataGrid;
