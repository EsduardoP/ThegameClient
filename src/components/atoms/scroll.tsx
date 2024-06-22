import React from 'react';

interface Scroll {
    children: React.ReactNode
}

const Scroll: React.FC<Scroll> = ({ children }) => {
  return (
    <div className="player-list">
      <div className="scroll-container">
        {children}
      </div>
    </div>
  );
};

export default Scroll;