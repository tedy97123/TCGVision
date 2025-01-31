const fs = require('fs').promises;
const path = require('path');
const { ImageAnnotatorClient } = require('@google-cloud/vision');

const client = new ImageAnnotatorClient();

async function categorizeImages(inputDir, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });

  const files = await fs.readdir(inputDir);
  for (const file of files) {
    if (!file.toLowerCase().match(/\.(jpg|jpeg|png)$/)) continue;

    const filePath = path.join(inputDir, file);
    const [result] = await client.textDetection(filePath);
    const text = result.textAnnotations?.[0]?.description?.toLowerCase() || 'unknown';

    let category = 'Unknown';
    const cardTypes = ['creature', 'land', 'artifact', 'planeswalker', 'sorcery', 'instant', 'enchantment'];
    for (const type of cardTypes) {
      if (text.includes(type)) {
        category = type.charAt(0).toUpperCase() + type.slice(1);
        break;
      }
    }

    const categoryPath = path.join(outputDir, category);
    await fs.mkdir(categoryPath, { recursive: true });

    const destPath = path.join(categoryPath, file);
    await fs.rename(filePath, destPath);

    console.log(`Categorized ${file} as ${category}`);
  }
}

(async () => {
  const inputDir = './images';
  const outputDir = './categorized_dataset';

  try {
    await categorizeImages(inputDir, outputDir);
  } catch (err) {
    console.error('Error categorizing images:', err);
  }
})();
