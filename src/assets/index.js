// Import all card assets to ensure they're bundled properly
// This uses Vite's glob import feature to import all SVG files

// Import all monster card SVGs
const monsterCardImports = import.meta.glob('./cardsets/monsters/*.svg', { eager: true });
const animalCardImports = import.meta.glob('./cardsets/animals/*.svg', { eager: true });
const symbolCardImports = import.meta.glob('./cardsets/symbols/*.svg', { eager: true });
const avatarImports = import.meta.glob('./avatars/*.svg', { eager: true });

// Convert imports to usable maps
export const monsterCards = Object.fromEntries(
  Object.entries(monsterCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const animalCards = Object.fromEntries(
  Object.entries(animalCardImports).map(([path, module]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, module.default];
  })
);

export const symbolCards = Object.fromEntries(
  Object.entries(symbolCardImports).map(([path, module]) => {
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
  const collection = cardset === 'monsters' ? monsterCards :
                      cardset === 'animals' ? animalCards :
                      cardset === 'symbols' ? symbolCards : {};
      return collection[value] || null;
}

// Helper function to get the URL for an avatar
export function getAvatarUrl(filename) {
  return avatars[filename] || null;
}
