import { useState } from 'react';

const GameModeSelector = ({ opened, onSelectMode, onClose }) => {
  const [mode, setMode] = useState('local');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  
  const handleModeSelect = () => {
    if (mode === 'local') {
      onSelectMode({ mode: 'local' });
    } else if (mode === 'online') {
      if (isCreatingRoom) {
        // Generate a random room ID if creating a new room
        const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        onSelectMode({ mode: 'online', roomId: generatedRoomId, isHost: true });
      } else {
        // Join existing room
        if (!roomId.trim()) return; // Don't proceed if room ID is empty
        onSelectMode({ mode: 'online', roomId: roomId.trim(), isHost: false });
      }
    }
  };

  if (!opened) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="modal modal-open">
        <div className="modal-box relative w-11/12 max-w-lg font-comic bg-base-100 shadow-xl p-4">
          <h3 className="modal-title text-xl font-bubblegum text-primary text-center mb-3">Select Game Mode</h3>
          <button
            className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2"
            onClick={onClose}
          >
            ✕
          </button>

          <div className="flex flex-col gap-5 px-1">
            <div className="card bg-base-200 shadow-sm p-4 rounded-lg">
              <div className="join w-full flex justify-center mb-4">
                <button
                  className={`join-item btn ${mode === 'local' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setMode('local')}
                >
                  Local Play
                </button>
                <button
                  className={`join-item btn ${mode === 'online' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setMode('online')}
                >
                  Online Play
                </button>
              </div>

              {mode === 'local' && (
                <div className="text-center">
                  <p className="mb-2">Play with friends on the same device</p>
                </div>
              )}

              {mode === 'online' && (
                <div className="flex flex-col gap-3">
                  <div className="join w-full flex justify-center">
                    <button
                      className={`join-item btn btn-sm ${isCreatingRoom ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setIsCreatingRoom(true)}
                    >
                      Create Room
                    </button>
                    <button
                      className={`join-item btn btn-sm ${!isCreatingRoom ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setIsCreatingRoom(false)}
                    >
                      Join Room
                    </button>
                  </div>

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
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        maxLength={6}
                      />
                    </div>
                  )}

                  <p className="text-xs text-center mt-2">
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
                disabled={mode === 'online' && !isCreatingRoom && !roomId.trim()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector;
