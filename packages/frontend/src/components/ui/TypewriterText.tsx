import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per word
  className?: string;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 30,
  className,
  onComplete 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Split by spaces to type word-by-word, or characters for char-by-char
    // Word-by-word is faster and looks better for long LLM responses
    const tokens = text.match(/[\s\S]/g) || []; // Using chars for smoother effect but we can do words

    if (currentIndex < tokens.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + tokens[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (currentIndex === tokens.length && tokens.length > 0) {
      if (onComplete) onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes completely
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={cn("inline-block", className)}>
      {displayedText}
      {currentIndex < (text.match(/[\s\S]/g)?.length || 0) && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />
      )}
    </span>
  );
};
