import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  strings: string[];
  typeSpeed?: number;
  backSpeed?: number;
  backDelay?: number;
}

export function Typewriter({
  strings,
  typeSpeed = 50,
  backSpeed = 30,
  backDelay = 1200,
}: TypewriterProps) {
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting) {
      if (currentText === '') {
        setIsDeleting(false);
        setCurrentStringIndex((prev) => (prev + 1) % strings.length);
      } else {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, backSpeed);
      }
    } else {
      const fullText = strings[currentStringIndex];
      if (currentText === fullText) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, backDelay);
      } else {
        timeout = setTimeout(() => {
          setCurrentText(fullText.slice(0, currentText.length + 1));
        }, typeSpeed);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentStringIndex, strings, typeSpeed, backSpeed, backDelay]);

  return (
    <span className="inline-flex items-center">
      <span>{currentText}</span>
      <span className="w-[3px] h-[1em] bg-current ml-1 animate-pulse" />
    </span>
  );
}
