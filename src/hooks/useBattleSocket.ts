import { useEffect } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { Client } from '@stomp/stompjs';

export function useBattleSocket(battleId: string) {
  const setBattleState = useBattleStore((state) => state.setBattleState);
  const appendLog = useBattleStore((state) => state.appendLog);
  const setConnected = useBattleStore((state) => state.setConnected);
  const isSimulating = useBattleStore((state) => state.isSimulating);

  useEffect(() => {
    // If no battleId or if simulating locally or mock mode, do not connect to real websocket
    if (!battleId || battleId.startsWith('sim-') || battleId.startsWith('mock-') || isSimulating) {
      return;
    }

    let stompClient: Client | null = null;
    let isActive = true;

    const initSocket = async () => {
      try {
        // Dynamically import sockjs-client to prevent Next.js SSR reference errors
        const SockJS = (await import('sockjs-client')).default;
        
        if (!isActive) return;

        // In standard Next.js local config, we connect to /ws which is proxied or directly to localhost:8080/ws
        const socketUrl = '/ws';

        stompClient = new Client({
          webSocketFactory: () => new SockJS(socketUrl),
          debug: (str) => {
            console.log('[STOMP-Client]', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        stompClient.onConnect = (frame) => {
          if (!isActive) return;
          setConnected(true);
          console.log('WS Connection Established:', frame.headers);

          // Subscribe to state updates
          stompClient?.subscribe(`/topic/battles/${battleId}/state`, (message) => {
            if (!isActive) return;
            try {
              const state = JSON.parse(message.body);
              setBattleState(state);
            } catch (err) {
              console.error('Failed to parse socket state message:', err);
            }
          });

          // Subscribe to round logs
          stompClient?.subscribe(`/topic/battles/${battleId}/log`, (message) => {
            if (!isActive) return;
            try {
              const log = JSON.parse(message.body);
              appendLog(log);
            } catch (err) {
              console.error('Failed to parse socket log message:', err);
            }
          });

          // Subscribe to battle finished triggers
          stompClient?.subscribe(`/topic/battles/${battleId}/end`, (message) => {
            if (!isActive) return;
            try {
              const finalState = JSON.parse(message.body);
              setBattleState(finalState);
            } catch (err) {
              console.error('Failed to parse socket battle-end message:', err);
            }
          });
        };

        stompClient.onDisconnect = () => {
          setConnected(false);
          console.log('WS Connection Lost');
        };

        stompClient.onStompError = (errorFrame) => {
          console.error('STOMP Broker Error:', errorFrame.headers['message']);
          console.error('STOMP details:', errorFrame.body);
        };

        stompClient.activate();
      } catch (e) {
        console.error('Failed to initialize WebSocket client:', e);
      }
    };

    initSocket();

    return () => {
      isActive = false;
      if (stompClient) {
        stompClient.deactivate();
      }
      setConnected(false);
    };
  }, [battleId, isSimulating, setBattleState, appendLog, setConnected]);
}
