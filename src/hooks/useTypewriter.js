// hooks/useTypewriter.js

import { useState, useEffect } from 'react';

// A more robust hook that can loop or play once.
const useTypewriter = (text, speed = 110, loop = false) => {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const interval = setTimeout(() => {
        setDisplayed(text.slice(0, index + 1));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(interval);
    } else if (loop) {
      const pauseInterval = setTimeout(() => {
        setIndex(0);
        setDisplayed('');
      }, 1500); // Pause before restarting
      return () => clearTimeout(pauseInterval);
    }
    // If not looping, it will simply stop once the text is complete.
  }, [index, text, speed, loop]);

  return displayed;
};

export default useTypewriter;