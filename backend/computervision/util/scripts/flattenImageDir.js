import fs from 'fs-extra';
import path from 'path';

const IMAGES_DIR = path.resolve('C:/Users/mrted/mtg/backend/computervision/util/cleaned_images');

async function flattenDirectory(inputDir) {
  try {
    // Get all files and subdirectories
    const items = await fs.readdir(inputDir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(inputDir, item.name);

      if (item.isDirectory()) {
        // Recursively flatten subdirectories
        console.log(`Processing directory: ${item.name}`);
        await flattenDirectory(itemPath);

        // Remove the empty directory after moving its contents
        await fs.rmdir(itemPath);
        console.log(`Removed empty directory: ${itemPath}`);
      } else if (item.isFile()) {
        // Move file to the root of the images directory
        const newPath = path.join(IMAGES_DIR, item.name);

        // Check for file name conflicts and handle them
        let finalPath = newPath;
        let counter = 1;
        while (await fs.pathExists(finalPath)) {
          const parsedPath = path.parse(newPath);
          finalPath = path.join(
            parsedPath.dir,
            `${parsedPath.name}(${counter})${parsedPath.ext}`
          );
          counter++;
        }

        await fs.move(itemPath, finalPath);
        console.log(`Moved ${itemPath} to ${finalPath}`);
      }
    }

    console.log('Directory flattened successfully!');
  } catch (error) {
    console.error('Error flattening directory:', error);
  }
}

// Run the script
flattenDirectory(IMAGES_DIR);
