import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@collab-board/shared-types';
import { useAuth } from '@clerk/clerk-react';
import { useClerkToken } from './useClerkToken';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Explicit reconnection config: exponential backoff, replace local state with server on reconnect via board:join + board:load. */
export const SOCKET_RECONNECT_OPTIONS = {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
} as const;

export type CollabSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface IUseSocketResult {
  socket: CollabSocket | null;
  isConnected: boolean;
  error: string;
}

/**
 * Connects to Socket.io with Clerk JWT in auth.token.
 * Only connects when user is signed in; clears socket when signed out.
 */
export const useSocket = (): IUseSocketResult => {
  const { isLoaded, isSignedIn } = useAuth();
  const getToken = useClerkToken();
  const [socket, setSocket] = useState<CollabSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<CollabSocket | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        queueMicrotask(() => {
          setSocket(null);
          setIsConnected(false);
          setError('');
        });
      } else {
        queueMicrotask(() => setError(''));
      }
      return;
    }

    let cancelled = false;

    const connect = async (): Promise<void> => {
      try {
        const token = await getToken();
        if (cancelled || !token) {
          if (!token) setError('No auth token');
          return;
        }
        const s = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          ...SOCKET_RECONNECT_OPTIONS,
        });
        socketRef.current = s;
        s.on('connect', () => {
          if (!cancelled) {
            setIsConnected(true);
            setError('');
          }
          setSocket(s);
        });
        s.on('connect_error', (err) => {
          if (!cancelled) {
            setError(err.message ?? 'Connection failed');
          }
          if (err.message === 'Unauthorized') {
            s.disconnect();
          }
        });
        s.on('disconnect', () => {
          if (!cancelled) setIsConnected(false);
        });
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isLoaded, isSignedIn, getToken]);

  return { socket, isConnected, error };
};
