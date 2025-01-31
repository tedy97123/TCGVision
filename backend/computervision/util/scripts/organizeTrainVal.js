import fs from 'fs';
import path from 'path';

// Paths
const sourceDir = './organized_images';
const trainDir = './organized_images/train';
const valDir = './organized_images/val';

// Split ratio (80% train, 20% val)
const trainSplit = 0.8;

const organizeTrainVal = () => {
  const classes = fs.readdirSync(sourceDir);

  classes.forEach((className) => {
    const classPath = path.join(sourceDir, className);

    if (fs.lstatSync(classPath).isDirectory()) {
      const files = fs.readdirSync(classPath);
      const totalFiles = files.length;
      const trainCount = Math.floor(totalFiles * trainSplit);

      // Shuffle files for randomness
      const shuffledFiles = files.sort(() => Math.random() - 0.5);

      // Prepare train and val paths
      const trainClassDir = path.join(trainDir, className);
      const valClassDir = path.join(valDir, className);

      // Ensure directories exist
      fs.mkdirSync(trainClassDir, { recursive: true });
      fs.mkdirSync(valClassDir, { recursive: true });

      // Move files to train and val directories
      shuffledFiles.forEach((file, index) => {
        const srcPath = path.join(classPath, file);
        const destPath = index < trainCount ? path.join(trainClassDir, file) : path.join(valClassDir, file);
        fs.renameSync(srcPath, destPath);
      });
    }
  });
};

organizeTrainVal();