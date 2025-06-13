import { useState, useEffect } from "react";

const BOARD_SIZES = {
  xs: { cols: 3, rows: 2, label: "XS" },
  sm: { cols: 4, rows: 3, label: "SM" },
  md: { cols: 6, rows: 3, label: "MD" },
  lg: { cols: 6, rows: 4, label: "LG" },
  xl: { cols: 8, rows: 4, label: "XL" },
  xxl: { cols: 8, rows: 6, label: "XXL" },
};

// Available avatars in public/avatars directory
const AVATARS = [
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
  "f20d5dc563edbac9.svg"
];

const GameSetupModal = ({ opened, onClose, onStartGame }) => {
  const [boardSize, setBoardSize] = useState("md");
  const [playerCount, setPlayerCount] = useState(1);
  const [players, setPlayers] = useState([
    { name: "Player 1", avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] },
  ]);
  const [cardsets, setCardsets] = useState(["monsters"]);
  const [selectedCardset, setSelectedCardset] = useState("monsters");
  
  // Fetch available cardsets
  useEffect(() => {
    // In a real app, we would fetch this from an API
    // For now, we have monsters and animals cardsets
    setCardsets(["monsters", "animals"]);
  }, []);

  const handlePlayerCountChange = (value) => {
    const count = parseInt(value);
    setPlayerCount(count);

    // Update players array based on new count
    const newPlayers = [...players];

    // Add players if needed
    while (newPlayers.length < count) {
      // Get a random avatar that hasn't been used yet
      const usedAvatars = newPlayers.map(player => player.avatar);
      const availableAvatars = AVATARS.filter(avatar => !usedAvatars.includes(avatar));
      const randomAvatar = availableAvatars.length > 0 
        ? availableAvatars[Math.floor(Math.random() * availableAvatars.length)]
        : AVATARS[Math.floor(Math.random() * AVATARS.length)];
        
      newPlayers.push({
        name: `Player ${newPlayers.length + 1}`,
        avatar: randomAvatar,
      });
    }

    // Remove players if needed
    while (newPlayers.length > count) {
      newPlayers.pop();
    }

    setPlayers(newPlayers);
  };

  const handlePlayerNameChange = (index, name) => {
    const newPlayers = [...players];
    newPlayers[index].name = name;
    setPlayers(newPlayers);
  };

  const handleChangeAvatar = (index) => {
    const newPlayers = [...players];
    
    // Get a random avatar that hasn't been used by other players
    const usedAvatars = players.filter((_, i) => i !== index).map(p => p.avatar);
    const availableAvatars = AVATARS.filter(avatar => !usedAvatars.includes(avatar));
    const randomAvatar = availableAvatars.length > 0 
      ? availableAvatars[Math.floor(Math.random() * availableAvatars.length)]
      : AVATARS[Math.floor(Math.random() * AVATARS.length)];
    
    newPlayers[index] = {
      ...newPlayers[index],
      avatar: randomAvatar
    };
    
    setPlayers(newPlayers);
  };

  const handleStartGame = () => {
    const { cols, rows } = BOARD_SIZES[boardSize];
    onStartGame({
      boardSize,
      gridCols: cols,
      gridRows: rows,
      players,
      cardset: selectedCardset,
    });
  };

  if (!opened) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="modal modal-open">
        <div className="modal-box relative w-11/12 max-w-lg font-comic bg-base-100 shadow-xl p-4">
          <h3 className="modal-title text-xl font-bubblegum text-primary text-center mb-3">Game Setup</h3>
          <button
            className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2"
            onClick={onClose}
          >
            ✕
          </button>

          <div className="flex flex-col gap-3 px-1">
            <div className="card bg-base-200 shadow-sm p-2 rounded-lg">
              <span className="mb-1 block text-sm font-schoolbell text-secondary text-center">Board Size</span>
              <div className="join w-full flex justify-center">
                {Object.entries(BOARD_SIZES).map(([key, { label }]) => (
                  <button
                    key={key}
                    className={`join-item btn btn-sm ${
                      boardSize === key ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => setBoardSize(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="mt-1 block text-xs text-center">
                {BOARD_SIZES[boardSize].cols}x{BOARD_SIZES[boardSize].rows} grid
                ({BOARD_SIZES[boardSize].cols * BOARD_SIZES[boardSize].rows}{" "}
                cards)
              </span>
            </div>

            <div className="card bg-base-200 shadow-sm p-2 rounded-lg">
              <span className="mb-1 block text-sm font-schoolbell text-secondary text-center">
                Number of Players
              </span>
              <div className="join flex justify-center">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    className={`join-item btn btn-sm w-12 ${
                      playerCount === num ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => handlePlayerCountChange(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="card bg-base-200 shadow-sm p-2 rounded-lg">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-schoolbell text-secondary">Players</span>
                <span className="text-xs text-accent">
                  Click avatar to change
                </span>
              </div>

              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center gap-2 bg-base-100 p-1 rounded-lg">
                    <div 
                      className="avatar cursor-pointer" 
                      onClick={() => handleChangeAvatar(index)}
                      title="Click to change avatar"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-primary hover:border-accent transition-colors duration-200">
                        <img 
                          src={`/avatars/${player.avatar}`} 
                          alt={`${player.name}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder={`Player ${index + 1} name`}
                      value={player.name}
                      onChange={(e) =>
                        handlePlayerNameChange(index, e.target.value)
                      }
                      className="input input-bordered input-sm w-full font-comic"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-base-200 shadow-sm p-2 rounded-lg">
              <span className="mb-1 block text-sm font-schoolbell text-secondary text-center">Card Set</span>
              <select 
                className="select select-bordered select-sm w-full font-comic bg-base-100" 
                value={selectedCardset}
                onChange={(e) => setSelectedCardset(e.target.value)}
              >
                {cardsets.map((cardset) => (
                  <option key={cardset} value={cardset}>
                    {cardset.charAt(0).toUpperCase() + cardset.slice(1)}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-center">
                Select a theme for your cards
              </span>
            </div>

            <div className="mt-3 flex justify-center gap-2">
              <button className="btn btn-sm btn-outline font-bubblegum px-4" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-sm btn-primary font-bubblegum px-4" onClick={handleStartGame}>
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetupModal;
