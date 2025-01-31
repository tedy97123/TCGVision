import 'dotenv/config'; // Load .env file
import fsExtra from 'fs-extra';
const { ensureDir, readdir, move } = fsExtra;
import { join, extname } from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize Google Cloud Vision client
const client = new ImageAnnotatorClient({
  keyFilename: process.env.KEY_FILENAME || 'C:/Users/mrted/mtg/backend/credentials/mtg-card-identifier-447917-90603de43e93.json',
});

// Directories
const inputDir = process.env.INPUT_DIR || 'C:/Users/mrted/mtg/backend/computervision/util/cleaned_images';
const outputDir = process.env.OUTPUT_DIR || './organized_images';
const missedScansDir = process.env.MISSED_SCANS_DIR || './missed_scans'; // Directory for low-confidence scans

 // Magic: The Gathering card types and subtypes
 const magicTypes = {
  Artifact: [
    'Clue',          // Tokens created by Investigate
    'Contraption',   // Unstable mechanic artifacts
    'Equipment',     // Artifacts that attach to creatures
    'Food',          // Tokens for life gain
    'Treasure',      // Tokens that generate mana
    'Vehicle',       // Crewable artifacts that become creatures
    'Fortification', // Artifacts that attach to lands
    'Gold',          // Artifact tokens for mana
    'Shard',         // Artifact tokens
    'Powerstone',    // Artifact tokens that provide mana
    'Blood',         // Artifact tokens for card filtering
    'Thopter',       // Artifact creature tokens
    'Servo',         // Small artifact creature tokens
    'Mirror',        // Reflective artifacts
    'Construct',     // Artifact creatures
    'Keyrune',       // Mana-generating artifacts that can become creatures
    'Medallion',     // Artifacts that reduce mana costs
    'Relic',         // Artifacts with graveyard interaction
    'Spellbomb',     // Artifacts with sacrificial effects
    'Talisman',      // Artifacts that provide mana and damage
    'Obelisk',       // Mana-providing artifacts
    'Golem',         // Artifact creatures
    'Monument',      // Artifacts with static bonuses or effects
    'Banner',        // Mana-producing artifacts with additional effects
  ],
  Creature: [
    'Advisor', 'Ally', 'Angel', 'Anteater', 'Antelope', 'Ape', 'Archer', 'Archon', 'Army',
    'Artificer', 'Assassin', 'Assembly-Worker', 'Atog', 'Aurochs', 'Avatar', 'Azra',
    'Badger', 'Barbarian', 'Basilisk', 'Bat', 'Bear', 'Beast', 'Beeble', 'Berserker',
    'Bird', 'Blinkmoth', 'Boar', 'Bringer', 'Brushwagg', 'Camarid', 'Camel', 'Caribou',
    'Carrier', 'Cat', 'Centaur', 'Cephalid', 'Chimera', 'Citizen', 'Cleric', 'Cockatrice',
    'Construct', 'Coward', 'Crab', 'Crocodile', 'Cyclops', 'Dauthi', 'Demon', 'Deserter',
    'Devil', 'Dinosaur', 'Djinn', 'Dog', 'Dragon', 'Drake', 'Dreadnought', 'Drone',
    'Druid', 'Dryad', 'Dwarf', 'Efreet', 'Egg', 'Elder', 'Eldrazi', 'Elemental',
    'Elephant', 'Elf', 'Elk', 'Eye', 'Faerie', 'Ferret', 'Fish', 'Flagbearer', 'Fox',
    'Frog', 'Fungus', 'Gargoyle', 'Germ', 'Giant', 'Gnome', 'Goat', 'Goblin', 'God',
    'Golem', 'Gorgon', 'Graveborn', 'Gremlin', 'Griffin', 'Hag', 'Harpy', 'Hellion',
    'Hippo', 'Hippogriff', 'Homarid', 'Homunculus', 'Horror', 'Horse', 'Human',
    'Hydra', 'Hyena', 'Illusion', 'Imp', 'Incarnation', 'Inkling', 'Insect', 'Jackal',
    'Jellyfish', 'Juggernaut', 'Kavu', 'Kirin', 'Kithkin', 'Knight', 'Kobold',
    'Kor', 'Kraken', 'Lamia', 'Lammasu', 'Leech', 'Leviathan', 'Lhurgoyf', 'Licid',
    'Lizard', 'Manticore', 'Masticore', 'Mercenary', 'Merfolk', 'Metathran',
    'Minion', 'Minotaur', 'Mole', 'Monger', 'Mongoose', 'Monk', 'Monkey', 'Moonfolk',
    'Mutant', 'Myr', 'Mystic', 'Naga', 'Nautilus', 'Nephilim', 'Nightmare', 'Nightstalker',
    'Ninja', 'Noble', 'Noggle', 'Nomad', 'Nymph', 'Octopus', 'Ogre', 'Ooze', 'Orc',
    'Orgg', 'Otter', 'Ouphe', 'Ox', 'Oyster', 'Pangolin', 'Peasant', 'Pegasus',
    'Penguin', 'Pest', 'Phelddagrif', 'Phoenix', 'Phyrexian', 'Pilot', 'Pincher', 'Pirate',
    'Plant', 'Praetor', 'Prism', 'Processor', 'Rabbit', 'Raccoon', 'Ranger', 'Rat',
    'Rebel', 'Reflection', 'Rhino', 'Rigger', 'Rogue', 'Salamander', 'Samurai', 'Sand',
    'Saproling', 'Satyr', 'Scarecrow', 'Scion', 'Scout', 'Sculpture', 'Serf', 'Serpent',
    'Servant', 'Shade', 'Shaman', 'Shapeshifter', 'Shark', 'Sheep', 'Siren', 'Skeleton',
    'Slith', 'Sliver', 'Slug', 'Snake', 'Soldier', 'Soltari', 'Spawn', 'Specter',
    'Spellshaper', 'Sphinx', 'Spider', 'Spike', 'Spirit', 'Splinter', 'Sponge', 'Squid',
    'Squirrel', 'Starfish', 'Surrakar', 'Survivor', 'Tetravite', 'Thalakos', 'Thopter',
    'Thrull', 'Treefolk', 'Trilobite', 'Troll', 'Turtle', 'Unicorn', 'Vampire',
    'Vedalken', 'Viashino', 'Volver', 'Wall', 'Warlock', 'Warrior', 'Weird', 'Werewolf',
    'Whale', 'Wizard', 'Wolf', 'Wolverine', 'Wombat', 'Worm', 'Wraith', 'Wurm',
    'Yeti', 'Zombie', 'Zubera', 'Goblin Warrior' // Include specific creature types like combinations
  ],
  Enchantment: [
    'Aura',          // Enchantments that attach to other permanents
    'Curse',         // Enchantments that usually target opponents
    'Saga',          // Enchantments with chapter-based abilities
    'Shrine',        // Enchantments that interact with other Shrines
    'Cartouche',     // Auras with a thematic Egyptian flavor
    'Rune',          // Enchantments that provide bonuses and attach to artifacts or creatures
    'Class',         // Enchantments that represent classes from D&D
    'Constellation', // Enchantments with effects when other enchantments enter the battlefield
    'Seal',          // Enchantments with one-time effects
    'Glyph',         // Enchantments that typically modify creatures or combat
    'Monument',      // Enchantments that provide ongoing effects or bonuses
    'Retreat',       // Enchantments associated with landfall mechanics
    'Ascension',     // Enchantments with cumulative effects
    'Oath',          // Enchantments tied to iconic characters
    'Song',          // Enchantments with recurring abilities
    'Trial',         // A subtype of enchantments associated with challenges
    'God',           // Specific enchantments that are creatures when devotion is met
    'Legendary Enchantment', // Specific subtype for legendary enchantments
    'World Enchantment', // Older MTG cards that specify global enchantments
    'Enchantment Creature', // Add this new type
    'Enchant Land', // Add this new type

  ],
  
  Land: [
    'Forest', 'Island', 'Mountain', 'Plains', 'Swamp', 'Desert', 'Locus', 'Urza’s',
    'Legendary Land', // Legendary subtype for lands
    'Basic Land',     // Includes Forest, Island, Mountain, Plains, and Swamp
    'Snow Land',      // Snow subtype for lands
    'Gate',           // Common subtype for multicolor lands
    'Island',          // Includes Island as an explicit subtype
    'Enchantment Land', // Add this new type
    'Enchant Land', // Add this new type
  ],
    Planeswalker: [
    'Ajani', 'Chandra', 'Jace', 'Liliana', 'Teferi', 'Kaya', 'Gideon', 'Nicol Bolas', 
    'Sorin', 'Nissa', 'Ral', 'Dovin', 'Saheeli', 'Vraska', 'Garruk', 'Elspeth', 
    'Tamiyo', 'Ugin', 'Narset', 'Karn', 'Samut', 'Ashiok', 'Angrath', 'Domri',
    'Ob Nixilis', 'Tibalt', 'Vivien', 'Teyo', 'Basri', 'Lukka', 'Nahiri', 
    'Aminatou', 'Calix', 'Davriel', 'Mu Yanling', 'Huatli', 'Yanggu', 'Yang Yangu', 
    'Sarkhan', 'The Wanderer', 'Kasmina', 'Grist', 'Tyvar', 'Oko', 'Kiora'
  ],
  Instant: [
    'Tribal Instant', // Specific instants with tribal subtypes
    'Shapeshifter'    // Example for Tribal Instant Shapeshifter
  ],
  
  Sorcery: [
    'Tribal Sorcery', // Specific sorceries with tribal subtypes
    'Shapeshifter'    // Example for Tribal Sorcery Shapeshifter
  ],
  Interupt: ['Tribal Interrupt'], // Specific interrupts with tribal subtypes
  Battle: ['Siege'],
  Summon: [
    'Angel', 'Demon', 'Dragon', 'Elf', 'Goblin', 'Vampire', 'Beast', 'Bird', 'Cleric',
    'Elemental', 'Giant', 'Hydra', 'Knight', 'Merfolk', 'Minotaur', 'Ogre', 'Soldier',
    'Spirit', 'Treefolk', 'Zombie', 'Wizard', 'Cat', 'Wolf', 'Bear', 'Snake', 'Insect',
    'Shapeshifter', 'Construct', 'Golem', 'Djinn', 'Efreet', 'Leviathan', 'Kraken',
    'Pegasus', 'Phoenix', 'Sphinx', 'Unicorn', 'Wurm', 'Warrior', 'Scout', 'Naga',
    'Satyr', 'Troll', 'Druid', 'Pirate', 'Faerie', 'Horror', 'Illusion', 'Fungus',
    'Lizard', 'Monkey', 'Orc', 'Rat', 'Fish', 'Frog', 'Harpy', 'Griffin', 'Slug',
    'Thopter', 'Vedalken', 'Kithkin', 'Dryad', 'Homunculus', 'Gremlin', 'Sliver',
    'Nightmare', 'Devil', 'Avatar', 'Saproling', 'Centaur', 'Cyclops', 'Myr',
    'Badger', 'Boar', 'Crocodile', 'Hippo', 'Octopus', 'Otter', 'Starfish', 'Wombat',
    'Yeti', 'Zubera'
  ],
  };
// Helper function to sanitize folder names
function sanitizeName(name) {
  return name.replace(/[^\w\-]+/g, '_');
}

// Function to organize images
async function organizeImages() {
  try {
    // Ensure necessary directories exist
    await ensureDir(outputDir);
    await ensureDir(missedScansDir);

    const files = await readdir(inputDir);

    for (const file of files) {
      const filePath = join(inputDir, file);
      const ext = extname(file).toLowerCase();

      // Skip non-image files
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        console.warn(`Skipping non-image file: ${file}`);
        continue;
      }

      console.log(`Processing: ${file}`);

      // Perform OCR using Google Cloud Vision
      const [result] = await client.textDetection(filePath);
      const textAnnotations = result.textAnnotations;

      if (!textAnnotations || textAnnotations.length === 0) {
        console.warn(`No text detected for: ${file}`);
        await moveToMissedScans(filePath, file);
        continue;
      }

      // Extract card type (assume type is in the OCR text)
      const ocrText = textAnnotations[0].description;
      const cardType = extractCardType(ocrText);

      if (!cardType) {
        console.warn(`No card type found for: ${file}`);
        await moveToMissedScans(filePath, file);
        continue;
      }

      // Match card type with Magic: The Gathering categories
      const typeFolder = findMatchingType(cardType);
      if (!typeFolder) {
        console.warn(`Unrecognized type for: ${file}`);
        await moveToMissedScans(filePath, file);
        continue;
      }

      const sanitizedTypeFolder = sanitizeName(typeFolder);

      // Create type-specific directory and move the image
      const typeDir = join(outputDir, sanitizedTypeFolder);
      await ensureDir(typeDir);

      const destPath = join(typeDir, file);
      await move(filePath, destPath);

      console.log(`Moved ${file} to ${sanitizedTypeFolder}`);
    }

    console.log('Organization complete.');
  } catch (err) {
    console.error('Error organizing images:', err);
  }
}

function extractCardType(ocrText) {
  const lines = ocrText.split('\n').map(line => line.trim());

  // Look for the type line, including prefixes like "Legendary", "Summon", and "Enchant"
  const typeLine = lines.find(line =>
    line.match(/\b(Legendary|Artifact|Creature|Enchantment|Land|Planeswalker|Instant|Sorcery|Battle|Summon|Enchant)\b/i)
  );

  if (!typeLine) return null;

  const words = typeLine.split(' ');

  // Handle "Legendary" prefix
  if (words[0].toLowerCase() === 'legendary') {
    return `Legendary ${words[1]}`; // e.g., "Legendary Creature"
  }

  // Handle "Summon" prefix
  if (words[0].toLowerCase() === 'summon') {
    return `Summon ${words[1]}`; // e.g., "Summon Angel"
  }

  // Handle "Enchant" prefix
  if (words[0].toLowerCase() === 'enchant') {
    // Check if the second word matches known subtypes
    const enchantSubtype = words[1]?.toLowerCase();
    if (enchantSubtype && magicTypes.Land.includes(`Enchant ${enchantSubtype}`)) {
      return `Enchant ${words[1]}`; // e.g., "Enchant Land"
    }
    if (enchantSubtype && magicTypes.Creature.includes(`Enchant ${enchantSubtype}`)) {
      return `Enchant ${words[1]}`; // e.g., "Enchant Creature"
    }
  }

  return words[0]; // e.g., "Creature"
}



function findMatchingType(cardType) {
  const normalizedCardType = cardType.toLowerCase();

  // Match "Legendary" prefix
  if (normalizedCardType.startsWith('legendary ')) {
    const baseType = normalizedCardType.replace('legendary ', '');
    const mainType = Object.keys(magicTypes).find(type => type.toLowerCase() === baseType);
    if (mainType) return `Legendary ${mainType}`;
  }

  // Match "Summon" prefix
  if (normalizedCardType.startsWith('summon ')) {
    return 'Summon'; // Always place in the "Summon" folder
  }

  // Match "Enchant" prefix
  if (normalizedCardType.startsWith('enchant ')) {
    const subtype = normalizedCardType.replace('enchant ', '').trim();
    if (magicTypes.Enchantment.includes(`Enchant ${subtype}`)) {
      return `Enchant ${subtype}`;
    }
  }

  // Match main types
  const mainType = Object.keys(magicTypes).find(type => type.toLowerCase() === normalizedCardType);
  if (mainType) return mainType;

  // Match subtypes
  for (const [type, subtypes] of Object.entries(magicTypes)) {
    if (subtypes.some(subtype => subtype.toLowerCase() === normalizedCardType)) {
      return type;
    }
  }

  return null; // No match found
}



// Function to move files to the missed scans directory
async function moveToMissedScans(filePath, file) {
  const destPath = join(missedScansDir, file);
  await ensureDir(missedScansDir);
  await move(filePath, destPath);
  console.log(`Moved ${file} to missed scans.`);
}

// Run the script
organizeImages();
