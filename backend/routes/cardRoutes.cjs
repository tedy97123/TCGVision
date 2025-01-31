const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const express = require('express');
const multer = require('multer');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const OpenAI = require('openai'); // OpenAI SDK
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const visionClient = new ImageAnnotatorClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OpenAI API Key is not set. Please set OPENAI_API_KEY in your environment variables.");
}

router.post("/identify-cards", upload.single("cardImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const [visionResult] = await visionClient.textDetection({
      image: { content: req.file.buffer },
    });

    const textAnnotations = visionResult.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return res.status(404).json({ error: "No text detected in the image." });
    }

    const rawText = textAnnotations[0].description;

    const extractSetCodes = async (rawText) => {
      const chatGPTResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an assistant that identifies Magic: The Gathering set codes from text."
          },
          {
            role: "user",
            content: `
              The following text was extracted from an image of Magic: The Gathering cards. 
              Please identify only the set codes from the text, which are usually found at the bottom left of the card.
              Do not infer or create data. Only return what can be directly matched to existing Magic: The Gathering set codes.
              Return the data in this JSON format:
            
              {"title": "Card Name", "setCode": "SET"}            
    
              Here is the text:
              ${rawText}
            `,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });
    
      // Extract and return the response
      if (chatGPTResponse.data.choices && chatGPTResponse.data.choices.length > 0) {
        try {
          return JSON.parse(chatGPTResponse.data.choices[0].message.content);
        } catch (error) {
          console.error("Failed to parse GPT response:", error);
          return [];
        }
      }
      return [];
    };
    

    const chatGPTTitles = chatGPTResponse.choices[0]?.message?.content
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .slice(1)
      .map((line) => line.replace(/^\d+\.\s*/, ''));

    const fetchCardDetails = async (cardNames) => {
      const promises = cardNames.map(
        (cardName) =>
          new Promise((resolve, reject) => {
            const worker = new Worker(__filename, { workerData: cardName });

            worker.on('message', (data) => resolve({ [cardName]: data }));
            worker.on('error', reject);
            worker.on('exit', (code) => {
              if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
              }
            });
          })
      );
      const results = await Promise.all(promises);
      return Object.assign({}, ...results); // Merge all results into a single object
    };

    const cardDetails = await fetchCardDetails(chatGPTTitles);

    res.json({
      message: "Here are the extracted card titles:",
      chatGPTTitles,
      cards: cardDetails,
    });
  } catch (error) {
    console.error("Error occurred in /identify-cards:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

if (!isMainThread) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  const formattedName = workerData.replace(/,/g, '');
  console.log(formattedName);

  const scryfallUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(formattedName)}`;
  const curlCommand = `curl -s "${scryfallUrl}"`;

  execPromise(curlCommand)
    .then(({ stdout }) => {
      const responseData = JSON.parse(stdout);
      parentPort.postMessage(responseData);
    })
    .catch((error) => {
      parentPort.postMessage({ error: `Card not found: ${workerData}` });
    });
}

module.exports = router;
