import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

/**
 * Example: columns to display relevant Scryfall fields:
 * - Name
 * - Image
 * - Mana Cost
 * - Type Line
 * - Power / Toughness
 * - Rarity
 */
const columns = [
  {
    field: 'name',
    headerName: 'Card Name',
    flex: 1.5,
    minWidth: 160,
  },
  {
    field: 'image',
    headerName: 'Image',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => {
      if (!params.value) return null;
      return (
        <img
          src={params.value}
          alt={params.row.name}
          style={{ width: 60, borderRadius: 4 }}
        />
      );
    },
  },
  {
    field: 'manaCost',
    headerName: 'Mana Cost',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'typeLine',
    headerName: 'Type',
    flex: 1,
    minWidth: 140,
  },
  {
    field: 'powerToughness',
    headerName: 'P/T',
    flex: 0.7,
    minWidth: 80,
    // For rows that have power/toughness, display them as "4/4"
  },
  {
    field: 'rarity',
    headerName: 'Rarity',
    flex: 0.7,
    minWidth: 80,
  },
];

/**
 * Transform Scryfall card objects to DataGrid row objects:
 */
function transformCardData(cardData) {
  return cardData.map((card, index) => {
    // Some card properties might be absent depending on the set, so use fallback or checks
    const { name, image_uris, mana_cost, type_line, power, toughness, rarity } = card.cards.data;
    return {
      id: index,
      name: name,
      image: image_uris?.normal,
      manaCost: mana_cost,
      typeLine: type_line,
      powerToughness: power && toughness ? `${power}/${toughness}` : '',
      rarity: rarity,
    }
  });
}

export default function CardDataGrid({ cardData = [] }) {
  // Convert Scryfall data to rows for MUI DataGrid
  const rows = React.useMemo(() => {
    return transformCardData(cardData);
  }, [cardData]);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Box>
  );
}
