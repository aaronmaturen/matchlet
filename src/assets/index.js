// Import all card assets to ensure they're bundled properly
// This uses Vite's glob import feature to import all SVG files

// Import all monster card SVGs
const animalCardImports = import.meta.glob('./cardsets/animals/*.svg', { eager: true });
const emojiCardImports = import.meta.glob('./cardsets/emojis/*.svg', { eager: true });
const monsterCardImports = import.meta.glob('./cardsets/monsters/*.svg', { eager: true });
const symbolsCardImports = import.meta.glob('./cardsets/symbols/*.svg', { eager: true });
const emojiFaceCardImports = import.meta.glob('./cardsets/emoji_faces/*.svg', { eager: true });
const mixedShapesCardImports = import.meta.glob('./cardsets/mixed_shapes/*.svg', { eager: true });
const avatarImports = import.meta.glob('./avatars/*.svg', { eager: true });

// Available avatars in public/avatars directory
// Using underscore prefix to indicate intentionally unused variable
const _avatarList = [
  "0201e35304ee6e58.svg",
  "069d87858be0162d.svg",
  "19615c04fd12819a.svg",
  "19e4a684452bef8c.svg",
  "28924ef7f7f679e8.svg",
  "3258508ba5a1be0f.svg",
  "3f459c50f96a77a4.svg",
  "69e054956e831eb1.svg",
  "6d6a2afc46152f67.svg",
  "776003a115f3458d.svg",
  "7cede0e7a110b709.svg",
  "854fad09bd8676d4.svg",
  "97ce7cd8b8e90dbd.svg",
  "9a8e6e3027d89157.svg",
  "9ac234827d3666fb.svg",
  "a033f14526b48510.svg",
  "a41d42a2a72908db.svg",
  "a606efd924376295.svg",
  "bf36a7596b17be6d.svg",
  "d498bc72ffc72c9b.svg",
  "f0cb03da1b59b63f.svg",
  "f20d5dc563edbac9.svg",
];

// Convert imports to usable maps
export const animalCards = Object.fromEntries(
  Object.entries(animalCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const emojiCards = Object.fromEntries(
  Object.entries(emojiCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const monsterCards = Object.fromEntries(
  Object.entries(monsterCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const symbolsCards = Object.fromEntries(
  Object.entries(symbolsCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const emojiFacesCards = Object.fromEntries(
  Object.entries(emojiFaceCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const mixedShapesCards = Object.fromEntries(
  Object.entries(mixedShapesCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const avatars = Object.fromEntries(
  Object.entries(avatarImports).map(([path, module]) => {
    const filename = path.split('/').pop();
    return [filename, module.default];
  })
);

// Helper function to get the URL for a card
export function getCardUrl(cardset, value) {
  switch (cardset) {
    case 'animals':
      return animalCards[value] || null;
    case 'emojis':
      return emojiCards[value] || null;
    case 'monsters':
      return monsterCards[value] || null;
    case 'symbols':
      return symbolsCards[value] || null;
    case 'emoji faces':
      return emojiFacesCards[value] || null;
    case 'mixed shapes':
      return mixedShapesCards[value] || null;
    default:
      return null;
  }
}

// Helper function to get number of cards in a cardset
export function getMaxCardId(cardset) {
  switch (cardset) {
    case 'animals':
      return Object.keys(animalCards).length;
    case 'emojis':
      return Object.keys(emojiCards).length;
    case 'monsters':
      return Object.keys(monsterCards).length;
    case 'symbols':
      return Object.keys(symbolsCards).length;
    case 'emoji faces':
      return Object.keys(emojiFacesCards).length;
    case 'mixed shapes':
      return Object.keys(mixedShapesCards).length;
    default:
      return 0;
  }
}

// Helper function to get the URL for an avatar
export function getAvatarUrl(filename) {
  return avatars[filename] || null;
}
