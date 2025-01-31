// train.cjs

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// Directories
const trainDir = 'C:/Users/mrted/mtg/backend/computervision/util/scripts/organized_images/train';
const valDir = 'C:/Users/mrted/mtg/backend/computervision/util/scripts/organized_images/val';

// Function to load images from a directory
const loadImages = (directory, labelIndex, imageSize) => {
  const images = [];
  const labels = [];
  const labelDirs = fs.readdirSync(directory);

  labelDirs.forEach((label, index) => {
    const labelPath = path.join(directory, label);
    const files = fs.readdirSync(labelPath);

    files.forEach((file) => {
      const imagePath = path.join(labelPath, file);
      const buffer = fs.readFileSync(imagePath);
      const tensor = tf.node.decodeImage(buffer)
        .resizeNearestNeighbor([imageSize, imageSize])
        .div(tf.scalar(255.0))
        .expandDims(0);

      images.push(tensor);
      labels.push(labelIndex(index));
    });
  });

  return { images: tf.concat(images), labels: tf.oneHot(labels, labelDirs.length) };
};

// Load train and validation data
const imageSize = 224;
const trainData = loadImages(trainDir, (index) => index, imageSize);
const valData = loadImages(valDir, (index) => index, imageSize);

// Function to load model, train, and save
const loadModelAndTrain = async () => {
  // Load pre-trained MobileNetV2 and freeze layers
  const baseModel = await tf.loadLayersModel(
    'http://localhost:3000/mtg_card_identifier/model.json'
  );
  baseModel.trainable = false;

  // Add custom layers
  const model = tf.sequential();
  model.add(tf.layers.inputLayer({ inputShape: [imageSize, imageSize, 3] }));
  model.add(baseModel);
  model.add(tf.layers.globalAveragePooling2d());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: trainData.labels.shape[1], activation: 'softmax' }));

  // Compile the model
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  // Train the model
  await model.fit(trainData.images, trainData.labels, {
    validationData: [valData.images, valData.labels],
    epochs: 10,
    batchSize: 32,
  });

  // Save the model
  await model.save('file://./mtg_card_identifier');
};

// Execute the training function
loadModelAndTrain().catch(console.error);
