import { useState, useEffect, useCallback, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.bratch.cloud';

export const useAISummaryStream = () => {
  const [summary, setSummary] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback((mergerId: string) => {
    // Close any existing stream
    closeStream();
    
    setSummary('');
    setError(null);
    setIsStreaming(true);
    setIsFinished(false);

    const url = `${BACKEND_URL}/api/mergers/${mergerId}/analyze/stream`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        closeStream();
        setIsFinished(true);
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          closeStream();
          return;
        }

        if (data.text) {
          setSummary((prev) => prev + data.text);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
        setError('Failed to parse AI summary update');
        closeStream();
      }
    };

    eventSource.onerror = (err) => {
      // EventSource error doesn't provide much info, but we know it failed
      console.error('SSE error:', err);
      setError('Connection to AI summary stream failed');
      closeStream();
    };
  }, [closeStream]);

  useEffect(() => {
    return () => {
      closeStream();
    };
  }, [closeStream]);

  return {
    summary,
    isStreaming,
    isFinished,
    error,
    startStream,
    closeStream,
  };
};
