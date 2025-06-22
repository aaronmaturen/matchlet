import { useState, useEffect } from "react";
import { getAvatarUrl } from "../assets";

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
  "f20d5dc563edbac9.svg",
];

const UnifiedGameSetupModal = ({ opened, onClose, onStartGame, initialStep = "mode" }) => {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(initialStep); // "mode" or "setup"
  
  // Game mode state
  const [gameMode, setGameMode] = useState({ mode: "local" });
  const [roomId, setRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  
  // Game setup state
  const [boardSize, setBoardSize] = useState("md");
  const [players, setPlayers] = useState([
    {
      name: "Player 1",
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    },
  ]);
  const [cardsets, setCardsets] = useState(["emojis"]);
  const [selectedCardset, setSelectedCardset] = useState("emojis");

  // Derived state
  const isOnlineMode = gameMode?.mode === "online";
  const isJoiningRoom = isOnlineMode && !gameMode?.isHost;

  // Reset step when modal opens
  useEffect(() => {
    if (opened) {
      setCurrentStep(initialStep);
    }
  }, [opened, initialStep]);

  // Fetch available cardsets
  useEffect(() => {
    // In a real app, we would fetch this from an API
    setCardsets([
      "animals",
      "emojis",
      "monsters",
      "symbols",
      "emoji faces",
      "mixed shapes",
    ]);
  }, []);

  // Reset players when switching game modes
  useEffect(() => {
    if (isOnlineMode) {
      // For online mode, we only need one player (the local user)
      setPlayers([
        {
          name: "Player 1",
          avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        },
      ]);
    }
  }, [isOnlineMode]);

  const handleModeSelect = () => {
    if (gameMode.mode === "local") {
      setGameMode({ mode: "local" });
      setCurrentStep("setup");
    } else if (gameMode.mode === "online") {
      if (isCreatingRoom) {
        // Generate a random room ID if creating a new room
        const generatedRoomId = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        setGameMode({ 
          mode: "online", 
          roomId: generatedRoomId, 
          isHost: true 
        });
      } else {
        // Join existing room
        if (!roomId.trim()) return; // Don't proceed if room ID is empty
        setGameMode({ 
          mode: "online", 
          roomId: roomId.trim(), 
          isHost: false 
        });
      }
      setCurrentStep("setup");
    }
  };

  const addPlayer = () => {
    // Get a random avatar that hasn't been used yet
    const usedAvatars = players.map((player) => player.avatar);
    const availableAvatars = AVATARS.filter(
      (avatar) => !usedAvatars.includes(avatar)
    );
    const randomAvatar =
      availableAvatars.length > 0
        ? availableAvatars[Math.floor(Math.random() * availableAvatars.length)]
        : AVATARS[Math.floor(Math.random() * AVATARS.length)];

    setPlayers([
      ...players,
      {
        name: `Player ${players.length + 1}`,
        avatar: randomAvatar,
      },
    ]);
  };

  const removePlayer = (index) => {
    if (players.length <= 1) return; // Always keep at least one player

    const newPlayers = [...players];
    newPlayers.splice(index, 1);

    // Rename players to ensure sequential numbering
    const renamedPlayers = newPlayers.map((player, idx) => ({
      ...player,
      name: player.name.startsWith("Player ")
        ? `Player ${idx + 1}`
        : player.name,
    }));

    setPlayers(renamedPlayers);
  };

  const handlePlayerNameChange = (index, name) => {
    const newPlayers = [...players];
    newPlayers[index].name = name;
    setPlayers(newPlayers);
  };

  const handleChangeAvatar = (index) => {
    const newPlayers = [...players];

    // Get a random avatar that hasn't been used by other players
    const usedAvatars = players
      .filter((_, i) => i !== index)
      .map((p) => p.avatar);
    const availableAvatars = AVATARS.filter(
      (avatar) => !usedAvatars.includes(avatar)
    );
    const randomAvatar =
      availableAvatars.length > 0
        ? availableAvatars[Math.floor(Math.random() * availableAvatars.length)]
        : AVATARS[Math.floor(Math.random() * AVATARS.length)];

    newPlayers[index] = {
      ...newPlayers[index],
      avatar: randomAvatar,
    };

    setPlayers(newPlayers);
  };

  const handleStartGame = () => {
    // Create the game configuration
    let gameConfig;
    
    if (isJoiningRoom) {
      // When joining a room, we only need the local player info
      // Board size and other settings will come from the host
      gameConfig = {
        players: [{
          name: players[0].name,
          avatar: players[0].avatar,
        }],
      };
    } else {
      // For host or local mode, include all configuration
      const { cols, rows } = BOARD_SIZES[boardSize];
      gameConfig = {
        boardSize,
        gridCols: cols,
        gridRows: rows,
        players: isOnlineMode 
          ? [{ // For online mode, only use the first player (local user)
              name: players[0].name,
              avatar: players[0].avatar,
            }]
          : players.map((player) => ({ // For local mode, use all players
              name: player.name,
              avatar: player.avatar,
            })),
        cardset: selectedCardset,
      };
    }

    onStartGame(gameMode, gameConfig);
    onClose();
  };

  const handleBackToModeSelection = () => {
    setCurrentStep("mode");
  };

  if (!opened) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="modal modal-open">
        <div className="modal-box font-comic bg-base-100 relative w-11/12 max-w-lg p-4 shadow-xl">
          <h3 className="modal-title font-bubblegum text-primary mb-3 text-center text-xl">
            {currentStep === "mode" ? "Select Game Mode" : "Game Setup"}
          </h3>
          <button
            className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2"
            onClick={onClose}
          >
            ✕
          </button>

          {currentStep === "mode" && (
            <div className="flex flex-col gap-5 px-1">
              <div className="card bg-base-200 rounded-lg p-4 shadow-sm">
                <div className="mb-4 flex w-full justify-center">
                  <button
                    className={`btn ${gameMode.mode === "local" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      setGameMode({ mode: "local" });
                      setIsCreatingRoom(false);
                    }}
                  >
                    Local Play
                  </button>
                  <button
                    className={`btn ${gameMode.mode === "online" && isCreatingRoom ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      setGameMode({ mode: "online" });
                      setIsCreatingRoom(true);
                    }}
                  >
                    Create Room
                  </button>
                  <button
                    className={`btn ${gameMode.mode === "online" && !isCreatingRoom ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      setGameMode({ mode: "online" });
                      setIsCreatingRoom(false);
                    }}
                  >
                    Join Room
                  </button>
                </div>

                {gameMode.mode === "local" && (
                  <div className="text-center">
                    <p className="mb-2">Play with friends on the same device</p>
                  </div>
                )}

                {gameMode.mode === "online" && (
                  <div className="flex flex-col gap-3">
                    {!isCreatingRoom && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Room Code</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter room code"
                          className="input input-bordered w-full"
                          value={roomId}
                          onChange={(e) =>
                            setRoomId(e.target.value.toUpperCase())
                          }
                          maxLength={6}
                        />
                      </div>
                    )}

                    <p className="mt-2">
                      {isCreatingRoom
                        ? "Create a new room and invite friends to join"
                        : "Enter the room code shared by your friend"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  className="btn btn-primary font-bubblegum px-8"
                  onClick={handleModeSelect}
                  disabled={
                    gameMode.mode === "online" && !isCreatingRoom && !roomId.trim()
                  }
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === "setup" && (
            <div className="flex flex-col gap-3 px-1">
              {!isJoiningRoom && (
                <div className="card bg-base-200 rounded-lg p-2 shadow-sm">
                  <span className="font-schoolbell text-secondary mb-1 block text-center text-sm">
                    Board Size
                  </span>
                  <div className="join flex justify-center">
                    {Object.keys(BOARD_SIZES).map((size) => (
                      <button
                        key={size}
                        className={`join-item btn btn-sm ${boardSize === size ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setBoardSize(size)}
                      >
                        {BOARD_SIZES[size].label}
                      </button>
                    ))}
                  </div>
                  <span className="mt-1 block text-center text-xs">
                    {BOARD_SIZES[boardSize].cols}x{BOARD_SIZES[boardSize].rows} grid
                    ({BOARD_SIZES[boardSize].cols * BOARD_SIZES[boardSize].rows}{" "}
                    cards)
                  </span>
                </div>
              )}

              <div className="card bg-base-200 rounded-lg p-2 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-schoolbell text-secondary text-sm">
                    {isOnlineMode ? "Your Player" : "Players"}
                  </span>
                  <span className="text-accent text-xs">
                    Click avatar to change
                  </span>
                </div>

                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div
                      key={index}
                      className="bg-base-100 flex items-center gap-2 rounded-lg p-1"
                    >
                      {!isOnlineMode && players.length > 1 && (
                        <button
                          className="btn btn-xs btn-ghost btn-circle text-error"
                          onClick={() => removePlayer(index)}
                          title="Remove player"
                        >
                          ✕
                        </button>
                      )}
                      <div
                        className="avatar cursor-pointer"
                        onClick={() => handleChangeAvatar(index)}
                        title="Click to change avatar"
                      >
                        <div className="border-primary hover:border-accent h-8 w-8 overflow-hidden rounded-full border transition-colors duration-200">
                          <img
                            src={getAvatarUrl(player.avatar)}
                            alt={`${player.name}'s avatar`}
                            className="h-full w-full object-cover"
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
                        className="input input-bordered input-sm font-comic w-full"
                      />
                    </div>
                  ))}
                </div>
                {!isOnlineMode && (
                  <div className="mt-2 flex justify-end">
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={addPlayer}
                      disabled={players.length >= 4}
                    >
                      Add Player +
                    </button>
                  </div>
                )}
              </div>

              {!isJoiningRoom && (
                <div className="card bg-base-200 rounded-lg p-2 shadow-sm">
                  <span className="font-schoolbell text-secondary mb-1 block text-center text-sm">
                    Card Set
                  </span>
                  <select
                    className="select select-bordered select-sm font-comic bg-base-100 w-full"
                    value={selectedCardset}
                    onChange={(e) => setSelectedCardset(e.target.value)}
                  >
                    {cardsets.map((cardset) => (
                      <option key={cardset} value={cardset}>
                        {cardset.charAt(0).toUpperCase() + cardset.slice(1)}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-center text-xs">
                    Select a theme for your cards
                  </span>
                </div>
              )}

              <div className="mt-3 flex justify-center gap-2">
                <button
                  className="btn btn-sm btn-outline font-bubblegum px-4"
                  onClick={handleBackToModeSelection}
                >
                  Back
                </button>
                <button
                  className="btn btn-sm btn-primary font-bubblegum px-4"
                  onClick={handleStartGame}
                >
                  Start Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedGameSetupModal;
