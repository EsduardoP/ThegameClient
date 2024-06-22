import React, { useEffect } from 'react';

interface PlusSignProps {
  children: React.ReactNode;
  vidas: number
}

const PlusSignComponent: React.FC<PlusSignProps> = ({ children, vidas }) => {
  const createPlusSign = () => {
    const rechargerContainer = document.querySelector('.recharger');
    if (!rechargerContainer) return;

    const plusSign = document.createElement('div');
    plusSign.textContent = '+';
    plusSign.className = 'plus-sign';

    let x = 45 + randomNormalDistribution() * 10;
    let y = 40 + randomNormalDistribution() * 10;

    x = Math.min(Math.max(x, 0), 90);
    y = Math.min(Math.max(y, 0), 90);

    plusSign.style.left = `${x}%`;
    plusSign.style.top = `${y}%`;

    rechargerContainer.appendChild(plusSign);

    setTimeout(() => {
      plusSign.remove();
    }, 1500);
  };

  useEffect(() => {
    const intervalId = setInterval(createPlusSign, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const randomNormalDistribution = () => {
    return Math.random() * 2 - 1;
  };

  return (
    <div className="recharger">
      <div className="recharger-lives">{vidas}</div>
      <div className="recharger-content">{children}</div>
    </div>
  );
};

export default PlusSignComponent;
