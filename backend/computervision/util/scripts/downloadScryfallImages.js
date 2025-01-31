const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Basic land names. Include "Wastes" if you want colorless basic land too
const BASIC_LAND_NAMES = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes']);

/**
 * Step 1: Fetch the Scryfall "default_cards" bulk data
 */
async function downloadBulkData() {
  const bulkListResp = await axios.get('https://api.scryfall.com/bulk-data');
  const bulkDataArray = bulkListResp.data.data;  // array of bulk data objects

  // Find the "default_cards" entry
  const defaultCardsObj = bulkDataArray.find((entry) => entry.type === 'default_cards');

  if (!defaultCardsObj) {
    throw new Error('Could not find "default_cards" in Scryfall bulk data.');
  }

  console.log('Downloading default_cards JSON from:', defaultCardsObj.download_uri);
  const cardsResp = await axios.get(defaultCardsObj.download_uri);
  return cardsResp.data; // This is an array of all card objects
}

/**
 * Helper to sanitize filenames/folder names
 */
function sanitizeFilename(str) {
  return str.replace(/[^\w\-]+/g, '_');
}

/**
 * Step 2: Download images with rules:
 * - For non-basic cards, download every printing.
 * - For basic lands, only 1 printing per (name+set).
 */
async function downloadImages(allCards, outputDir) {
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Keep track of basic land "name+set" combos we've already downloaded
  const downloadedLandSetCombos = new Set();

  let downloadCount = 0;

  for (const card of allCards) {
    // 1) Determine if we should skip multiple prints for this card
    const isBasicLand = BASIC_LAND_NAMES.has(card.name);

    // If it's a basic land, only allow one printing from each set
    if (isBasicLand) {
      const comboKey = `${card.name}_${card.set}`.toLowerCase();
      if (downloadedLandSetCombos.has(comboKey)) {
        // Already got a basic land from this name+set, skip
        continue;
      }
    }

    // 2) Figure out the image URL (normal, or card_faces)
    let imageUrl = card.image_uris?.normal || null;
    if (!imageUrl && card.card_faces) {
      for (const face of card.card_faces) {
        if (face.image_uris?.normal) {
          imageUrl = face.image_uris.normal;
          break;
        }
      }
    }
    // If still no URL, skip
    if (!imageUrl) {
      // Some tokens/emblems/etc. won't have normal images
      console.log(`No normal image for: ${card.name} [${card.set}]`);
      continue;
    }

    // 3) Create a folder for the card name => ./images/<CardName>/
    const cardFolder = path.join(outputDir, sanitizeFilename(card.name));
    if (!fs.existsSync(cardFolder)) {
      fs.mkdirSync(cardFolder, { recursive: true });
    }

    // 4) Build a unique filename => "<set>_<cardID>.jpg"
    const fileName = `${sanitizeFilename(card.set)}_${card.id}.jpg`;
    const filePath = path.join(cardFolder, fileName);

    // If already downloaded this exact card ID, skip
    if (fs.existsSync(filePath)) {
      continue;
    }

    // 5) Download and save
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, response.data);
      downloadCount++;

      // Mark basic land combos after successful download
      if (isBasicLand) {
        const comboKey = `${card.name}_${card.set}`.toLowerCase();
        downloadedLandSetCombos.add(comboKey);
      }

      // Log progress every 100 downloads
      if (downloadCount % 100 === 0) {
        console.log(`Downloaded ${downloadCount} images so far...`);
      }
    } catch (err) {
      console.error(`Error downloading ${imageUrl} => ${err.message}`);
    }
  }

  console.log(`\nFinished downloading images. Total downloaded = ${downloadCount}.\n`);
}

// -- Main Execution --
(async () => {
  try {
    const allCards = await downloadBulkData();
    await downloadImages(allCards, './images');
  } catch (err) {
    console.error('An error occurred:', err);
  }
})();
