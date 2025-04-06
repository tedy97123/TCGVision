// src/components/CardInfo.js
import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid2,
  Grid22,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// This component expects that "card" is the entire Scryfall JSON object.
const CardInfo = ({ card }) => {
  if (!card) return null;
  console.log("Scryfall data:", card);

  // Destructure the fields you want to display
  const {
    name,
    image_uris,
    mana_cost,
    type_line,
    oracle_text,
    set_name,
    rarity,
    prices,
    purchase_uris,
    related_uris,
    legalities,
    colors,
    flavor_text,
  } = card;

  // Pick an image (normal or large)
  const cardImage = image_uris?.normal ?? image_uris?.large;
  console.log(card)

  return (
    <Card sx={{  maxWidth:500,  marginTop: 2 }}>
      {/* Card Image (top) */}
      {cardImage ? (
        <CardMedia
          component="img"
          height="350"
          image={cardImage}
          alt={name}
        />
      ) : (
        <div
          style={{
            height: 350,
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No Image Available
          </Typography>
        </div>
      )}

      <CardContent  >
        <Typography variant="h5" component="div" gutterBottom>
          {name || 'Unknown Card'}
        </Typography>

        {/* Accordion #1: General Info */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>General Info</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>Mana Cost:</strong> {mana_cost}
            </Typography>
            <Typography>
              <strong>Type:</strong> {type_line}
            </Typography>
            <Typography>
              <strong>Oracle Text:</strong> {oracle_text}
            </Typography>
            {flavor_text && (
              <Typography>
                <strong>Flavor Text:</strong> {flavor_text}
              </Typography>
            )}
            <Typography>
              <strong>Set:</strong> {set_name}
            </Typography>
            <Typography>
              <strong>Rarity:</strong> {rarity}
            </Typography>
            {colors && colors.length > 0 && (
              <Typography>
                <strong>Colors:</strong> {colors.join(', ')}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Accordion #2: Legalities */}
        {legalities && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Legalities</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2 container spacing={1}>
                {Object.entries(legalities).map(([format, status]) => (
                  <Grid2 item xs={6} md={4} key={format}>
                    <Typography>
                      <strong>{format}:</strong> {status}
                    </Typography>
                  </Grid2>
                ))}
              </Grid2>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Accordion #3: Prices */}
        {prices && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Prices</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid22 container spacing={1}>
                {Object.entries(prices).map(([priceType, value]) => (
                  <Grid22 item xs={6} md={4} key={priceType}>
                    <Typography>
                      <strong>{priceType}:</strong>{' '}
                      {value !== null && value !== '' ? value : '—'}
                    </Typography>
                  </Grid22>
                ))}
              </Grid22>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Accordion #4: Links */}
        {(purchase_uris || related_uris) && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Links</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {purchase_uris && (
                <>
                  <Typography variant="subtitle1">Purchase URIs</Typography>
                  <ul>
                    {Object.entries(purchase_uris).map(([key, url]) => (
                      <li key={key}>
                        <a href={url} target="_blank" rel="noreferrer">
                          {key}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {related_uris && (
                <>
                  <Typography variant="subtitle1">Related URIs</Typography>
                  <ul>
                    {Object.entries(related_uris).map(([key, url]) => (
                      <li key={key}>
                        <a href={url} target="_blank" rel="noreferrer">
                          {key}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default CardInfo;
