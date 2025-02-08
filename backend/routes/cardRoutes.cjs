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

    // Detect text in the uploaded image using Google Vision API.
    const [visionResult] = await visionClient.textDetection({
      image: { content: req.file.buffer },
    });

    const textAnnotations = visionResult.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return res.status(404).json({ error: "No text detected in the image." });
    }

    const rawText = textAnnotations[0].description;
    console.log("Raw Text:", rawText);

    /**
     * Function to call ChatGPT and extract set codes from raw text.
     */
    const extractSetCodes = async (rawText) => {
      try {
        const chatGPTResponse = await openai.chat.completions.create({
          model: "gpt-4o", // Ensure this is the correct model name; adjust if necessary.
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
                Do not infer or create data. Only return what can be directly matched to existing Magic: The Gathering set codes or card Title.
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

        // Log the full API response for debugging purposes.
        console.log("ChatGPT API response:", chatGPTResponse);
        return chatGPTResponse;
      } catch (error) {
        console.error("Error in extractSetCodes:", error);
        throw error;
      }
    };

    // Call extractSetCodes to get the ChatGPT response.
    const chatGPTResponse = await extractSetCodes(rawText);

    // Depending on the structure of the response, adjust property access.
    // Here, we check if the response is nested under a `data` property.
    const content = chatGPTResponse.data 
      ? chatGPTResponse.data.choices[0]?.message?.content 
      : chatGPTResponse.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No content received from ChatGPT API." });
    }

    // Process the content to extract card titles.
    // (This assumes that ChatGPT returns multiple lines, with the first line being a header.
    //  Adjust the parsing logic if the output format differs.)
    const chatGPTTitles = content
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .slice(1) // Remove the header line, if present.
      .map((line) => line.replace(/^\d+\.\s*/, ''));

    console.log("Extracted Titles:", chatGPTTitles);

    // Function to fetch card details using worker threads.
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
      return Object.assign({}, ...results); // Merge all results into a single object.
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

// Worker thread logic to fetch card details from Scryfall.
if (!isMainThread) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  const formattedName = workerData.replace(/,/g, '');
  console.log("Worker processing:", formattedName);

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
