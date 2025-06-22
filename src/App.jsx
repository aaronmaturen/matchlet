import { useState, useEffect } from "react";
import Game from "./components/Game.tsx";
import HelpModal from "./components/HelpModal";
import UnifiedGameSetupModal from "./components/UnifiedGameSetupModal";
import "./App.css";

function App() {
  const [resetGame, setResetGame] = useState(false);
  const [helpModalOpened, setHelpModalOpened] = useState(false);
  const [gameModeModalOpened, setGameModeModalOpened] = useState(true); // Open by default
  const [gameMode, setGameMode] = useState(null); // null, { mode: 'local' } or { mode: 'online', roomId: '123', isHost: true }
  const [gameConfig, setGameConfig] = useState(null); // Store the game configuration

  // Child-friendly themes subset
  const themeList = [
    "light",
    "dark",
    "cupcake",
    "bumblebee",
    "emerald",
    "corporate",
    "synthwave",
    "retro",
    "cyberpunk",
    "valentine",
    "halloween",
    "garden",
    "forest",
    "aqua",
    "lofi",
    "pastel",
    "fantasy",
    "wireframe",
    "black",
    "luxury",
    "dracula",
    "cmyk",
    "autumn",
    "business",
    "acid",
    "lemonade",
    "night",
    "coffee",
    "winter",
    "dim",
    "nord",
    "sunset",
    "caramellatte",
    "abyss",
    "silk",
  ];

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "cupcake";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Get current theme
  const getCurrentTheme = () => {
    return document.documentElement.getAttribute("data-theme") || "cupcake";
  };

  // Change theme and save to localStorage
  const changeTheme = (theme) => {
    // Apply theme to html element
    document.documentElement.setAttribute("data-theme", theme);
    // Save to localStorage
    localStorage.setItem("theme", theme);
    // Force re-render
    setThemeState(theme);
  };

  // State to track current theme
  const [, setThemeState] = useState(getCurrentTheme());

  const handleNewGame = () => {
    setGameModeModalOpened(true);
  };

  const handleGameSetup = (mode, config) => {
    setGameMode(mode);
    setGameConfig(config); // Store the game configuration
    setGameModeModalOpened(false);
    // Trigger reset to start the game with the selected mode and config
    setResetGame(true);
  };

  return (
    <div className="bg-base-100 font-comic flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-base-100 sticky top-0 z-10 flex w-full items-center justify-between border-b p-4">
        <h1 className="font-bubblegum text-primary text-3xl">Matchlet</h1>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                />
              </svg>
              <span className="font-comic ml-1">Theme</span>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] max-h-96 w-96 overflow-x-auto p-2 shadow"
            >
              {themeList.map((theme) => (
                <li key={theme}>
                  <button
                    className={`font-comic ${getCurrentTheme() === theme ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      changeTheme(theme);
                      // Close the dropdown
                      document.activeElement.blur();
                    }}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button className="btn btn-ghost" onClick={handleNewGame}>
            New Game
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setHelpModalOpened(true)}
          >
            Help
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-2">
        <Game
          triggerReset={resetGame}
          onResetComplete={() => setResetGame(false)}
          gameMode={gameMode}
          initialGameConfig={gameConfig}
          onBackToMenu={handleNewGame}
        />
      </main>

      <HelpModal
        opened={helpModalOpened}
        onClose={() => setHelpModalOpened(false)}
      />

      <UnifiedGameSetupModal
        opened={gameModeModalOpened}
        onClose={() => setGameModeModalOpened(false)}
        onStartGame={handleGameSetup}
        initialStep="mode"
      />

      {/* Footer */}
      <footer className="bg-base-100 sticky bottom-0 z-10 w-full border-t p-2 text-center text-sm">
        Made with &lt;3 by{" "}
        <a href="https://github.com/duanemay" target="_blank">
          Duane
        </a>{" "}
        and{" "}
        <a href="https://github.com/aaronmaturen" target="_blank">
          Aaron
        </a>
      </footer>
    </div>
  );
}

export default App;
