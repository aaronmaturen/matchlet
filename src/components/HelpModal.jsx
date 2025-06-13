import React from "react";

const HelpModal = ({ opened, onClose }) => {
  if (!opened) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box font-comic bg-base-100 max-w-3xl p-6">
        <h3 className="font-bubblegum text-primary mb-5 text-3xl">
          Let's Play Wingspan!
        </h3>

        <div className="space-y-6 text-left">
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-schoolbell text-secondary mb-2 text-2xl">
              What's the game about?
            </h4>
            <p className="font-comic text-lg">
              This is a fun game where you find cards that look the same. When
              you find three matching cards, you get a point! The person with
              the most points wins the game.
            </p>
          </div>

          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-schoolbell text-secondary mb-2 text-2xl">
              How to play:
            </h4>
            <p className="font-comic mb-3 text-lg">
              First, pick any two cards and flip them over. If they match, you
              get to flip one more card!
            </p>
            <p className="font-comic mb-3 text-lg">
              If all three cards match, you get a point and the cards stay face
              up. Yay!
            </p>
            <p className="font-comic mb-3 text-lg">
              If the cards don't match, they get turned back over and it's the
              next player's turn.
            </p>
            <p className="font-comic mb-3 text-lg">
              When you play with friends, you take turns flipping cards.
            </p>
            <p className="font-comic text-lg">
              The game is over when all the matching sets are found.
            </p>
          </div>

          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-schoolbell text-secondary mb-2 text-2xl">
              Helpful hints:
            </h4>
            <p className="font-comic mb-3 text-lg">
              Watch where other players flip their cards so you can remember for
              your turn.
            </p>
            <p className="font-comic mb-3 text-lg">
              Try to remember where you've seen each card.
            </p>
            <p className="font-comic text-lg">
              When you find two matching cards, think about where you might have
              seen the third one!
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            className="btn btn-primary btn-lg font-bubblegum px-8"
            onClick={onClose}
          >
            Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
