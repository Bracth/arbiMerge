import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMergerStore } from '../../../lib/store';
import type { PriceUpdate } from '../index';
import { TrendType } from '@arbimerge/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.bratch.cloud';

export const useMergerWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { setConnectionStatus, updateMergerPrice, updateMultiplePrices, setError } = useMergerStore();

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
      setConnectionStatus('idle');
    });

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('error');
      setError(error.message);
    });

    socket.on('priceUpdate', (data: PriceUpdate) => {
      updateMergerPrice(
        data.ticker, 
        data.targetPrice, 
        data.buyerPrice, 
        data.spread, 
        data.trend, 
        data.effectiveOfferPrice, 
        data.lastTargetPriceUpdate, 
        data.lastBuyerPriceUpdate
      );
    });

    socket.on('initialPrices', (data: { 
      symbol: string, 
      targetPrice: number, 
      buyerPrice: number | null, 
      spread: number, 
      trend: TrendType, 
      effectiveOfferPrice: number, 
      lastTargetPriceUpdate: number | null, 
      lastBuyerPriceUpdate: number | null 
    }[]) => {
      updateMultiplePrices(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [setConnectionStatus, updateMergerPrice, updateMultiplePrices, setError]);

  return socketRef.current;
};
