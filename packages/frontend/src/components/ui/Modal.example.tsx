import { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Typography } from './Typography';

const STREAMING_TEXT = `The arbitrage opportunity between AAPL on NASDAQ and AAPL on the London Stock Exchange is currently 0.45%. 

This spread is driven by a temporary liquidity imbalance in the European market following the latest earnings report. 

Recommended Action:
1. Buy 500 shares on LSE at $175.20
2. Sell 500 shares on NASDAQ at $176.00
3. Estimated Profit: $400.00 (minus fees)

Risk Assessment: Low. Execution time is critical as the spread is narrowing.`;

/**
 * A demo component showing the Modal in action, simulating LLM text streaming inside Modal.Body.
 */
export const ModalExample = () => {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const startStreaming = useCallback(() => {
    setText('');
    setIsStreaming(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < STREAMING_TEXT.length) {
        setText((prev) => prev + STREAMING_TEXT[index]);
        index++;
      } else {
        setIsStreaming(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const cleanup = startStreaming();
      return cleanup;
    } else {
      setText('');
      setIsStreaming(false);
    }
  }, [isOpen, startStreaming]);

  return (
    <div className="p-8 flex flex-col gap-4 items-center justify-center min-h-[400px] bg-surface-container-lowest border border-outline-variant rounded-lg">
      <Typography variant="h2" className="mb-4">Modal Component Demo</Typography>
      
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <Modal.Trigger>
          <button className="px-6 py-3 bg-primary text-on-primary font-bold uppercase tracking-wider border-2 border-primary hover:bg-transparent hover:text-primary transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            Analyze Arbitrage Opportunity
          </button>
        </Modal.Trigger>

        <Modal.Content className="max-w-2xl">
          <Modal.Header>
            <div className="flex items-center gap-3">
              <span>AI Analysis Report</span>
              {isStreaming && (
                <Badge variant="solid" color="primary" className="animate-pulse">
                  Streaming...
                </Badge>
              )}
            </div>
          </Modal.Header>
          
          <Modal.Body>
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[200px] text-on-surface">
              {text}
              {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Close
            </button>
            <button 
              disabled={isStreaming}
              className="px-4 py-2 bg-primary text-on-primary font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute Trade
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <Typography variant="body" className="text-on-surface-variant mt-4">
        Click the button above to see the modal with simulated LLM streaming.
      </Typography>
    </div>
  );
};
