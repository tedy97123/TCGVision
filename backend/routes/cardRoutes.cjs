/**
 * NOTE: The main differences from your original code:
 * 1. The user/system prompt now explicitly says: "Only return recognized MTG set codes."
 * 2. We include a small list of validSetCodes in the worker, and if the returned set code is not in that list,
 *    we make a Scryfall request WITHOUT the &set= param (like a 'fuzzy' search for the card).
 * 3. Everything else remains consistent with your original logic.
 */

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

    // 1. Detect text in the uploaded image using Google Vision API.
    const [visionResult] = await visionClient.textDetection({
      image: { content: req.file.buffer },
    });

    const textAnnotations = visionResult.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return res.status(404).json({ error: "No text detected in the image." });
    }

    const rawText = textAnnotations[0].description;

    /**
     * 2. Function to call ChatGPT and extract set codes from raw text,
     *    explicitly telling it to only match recognized MTG set codes or card titles.
     */
    const extractSetCodes = async (rawText) => {
      try {
        const chatGPTResponse = await openai.chat.completions.create({
          model: "gpt-4", // Use the correct model name or ID
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that identifies Magic: The Gathering set codes from text. " +
                "Only return recognized set codes that exist in Magic: The Gathering. " +
                "If you see something that is not a valid MTG set code, do not guess. " +
                "You may also return the card title if present."
            },
            {
              role: "user",
              content: `
                The following text was extracted from an image of Magic: The Gathering cards.
                Please identify only the set codes from the text, which are usually found at the bottom left of the card.
                **Do not infer** or create data. Only return what can be directly matched to **existing** Magic: The Gathering set codes or card Title.
                Return the data in this JSON format:
                
                [
                  {"title": "Card Name", "setCode": "SET"},
                  ...
                ]
                
                If no valid set code is found for a particular card, you may leave "setCode" blank or null.
                
                Here is the text:
                ${rawText}
              `
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        });

        return chatGPTResponse;
      } catch (error) {
        console.error("Error in extractSetCodes:", error);
        throw error;
      }
    };

    // 3. Call extractSetCodes to get the ChatGPT response.
    const chatGPTResponse = await extractSetCodes(rawText);

    // 4. Depending on structure, retrieve the content.
    const content = chatGPTResponse.data
      ? chatGPTResponse.data.choices[0]?.message?.content
      : chatGPTResponse.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No content received from ChatGPT API." });
    }

    // After you retrieve the `content` string from ChatGPT, remove extra formatting if needed:
    let cleanedContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    console.log("Cleaned Content:", cleanedContent);

    let cardArray;
    try {
      cardArray = JSON.parse(cleanedContent);
    } catch (err) {
      console.error("Error parsing ChatGPT JSON:", err);
      return res.status(500).json({ error: "Invalid JSON from ChatGPT." });
    }

    // 6. Function to fetch card details using worker threads, passing { title, setCode } to each worker.
    const fetchCardDetails = async (cards) => {
      const promises = cards.map((card) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(__filename, { workerData: card });

          worker.on('message', (data) => resolve({ data }));
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        })
      );
      const results = await Promise.all(promises);

      // Merge all objects into a single object: { "Card Title": {...}, "Another Card": {...} }
      return Object.assign({}, ...results);
    };

    // 7. Execute the worker-based fetch
    const cardDetails = await fetchCardDetails(cardArray);

    // 8. Return the results
    res.json([
      {
        cards: cardDetails,
      },
    ]);
  } catch (error) {
    console.error("Error occurred in /identify-cards:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 9. Worker thread logic to fetch card details from Scryfall.
if (!isMainThread) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  const validSetCodes = [
    'LEA','LEB','2ED','3ED','ARN','ATQ','4ED','ICE','CHR','HML','ALL','MIR','VIS',
    '5ED','POR','WTH','TMP','STH','EXO','P02','UGL','USG','ULG','6ED','PTK','S99',
    'MMQ','BRB','NEM','S00','PCY','INV','PLS','7ED','ODY','TOR','JUD','ONS','LGN',
    '8ED','MRD','DST','5DN','CHK','BOK','SOK','9ED','RAV','GPT','DIS','CSP','TSP',
    'PLC','FUT','10E','LRW','MOR','SHM','EVE','ALA','CON','ARB','M10','ZEN','WWK',
    'ROE','M11','SOM','MBS','NPH','CMD','M12','ISD','DKA','AVR','M13','RTR','GTC',
    'DGM','M14','THS','BNG','JOU','M15','KTK','FRF','DTK','ORI','BFZ','OGW','SOI',
    'EMN','KLD','AER','AKH','HOU','XLN','RIX','DOM','M19','GRN','RNA','WAR','MH1',
    'M20','ELD','THB','IKO','M21','ZNR','KHM','STX','MH2','AFR','MID','VOW','NEO',
    'SNC','DMU','UNF','BRO','ONE','MOM','LTC','WOT' // etc.
  ];

  const { title, setCode } = workerData;
  console.log("Worker data -> title:", title, " setCode:", setCode);
  const titleWithPluses = title.replace(/\s+/g, '+');
  // If setCode is recognized, we include it in the Scryfall request.
  // Otherwise, we omit the set param and just do a fuzzy search by title.
  const isValidSet = setCode && validSetCodes.includes(setCode.toUpperCase());

  const scryfallUrl = isValidSet
    ? `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(titleWithPluses)}&set=${encodeURIComponent(setCode)}`
    : `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(titleWithPluses)}`; // no set param if code not recognized

  const curlCommand = `curl -s "${scryfallUrl}"`;
  console.log("Worker fetching:", curlCommand);

  execPromise(curlCommand)
    .then(({ stdout }) => {
      try {
        const responseData = JSON.parse(stdout);
        // Return the entire response data, keyed by the 'title'
        parentPort.postMessage({ [title]: responseData });
      } catch (err) {
        parentPort.postMessage({ [title]: { error: `Error parsing JSON: ${err.message}` } });
      }
    })
    .catch((error) => {
      parentPort.postMessage({
        [title]: {
          error: `Card not found: ${title}`,
          details: error.message
        }
      });
    });
}

module.exports = router;
