import { WebSocket, WebSocketServer } from 'ws';
import { EventBus } from './eventBus';

export class WSServerManager {
  private static wss: WebSocketServer | null = null;
  // Map of client sockets to the set of channels they are subscribed to
  private static clients: Map<WebSocket, Set<string>> = new Map();

  public static init() {
    if ((global as any).__wss) {
      console.log('[WSServer] Using existing WebSocket server instance.');
      return;
    }

    console.log('[WSServer] Booting standalone WebSocket server on port 3001...');
    const wss = new WebSocketServer({ port: 3001 });
    this.wss = wss;
    (global as any).__wss = wss;

    wss.on('connection', (ws) => {
      this.clients.set(ws, new Set());

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.action === 'SUBSCRIBE' && data.channel) {
            this.clients.get(ws)?.add(data.channel);
          } else if (data.action === 'UNSUBSCRIBE' && data.channel) {
            this.clients.get(ws)?.delete(data.channel);
          }
        } catch (e) {
          console.error('[WSServer] Invalid message received', message.toString());
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
      
      ws.on('error', (err) => {
        console.error('[WSServer] Client error:', err);
        this.clients.delete(ws);
      });
    });

    // Wire up global event bus to WebSockets
    EventBus.on('broadcast', ({ channel, eventType, payload }) => {
      const message = JSON.stringify({ channel, eventType, payload });
      
      for (const [ws, subscriptions] of this.clients.entries()) {
        if (ws.readyState === WebSocket.OPEN && subscriptions.has(channel)) {
          ws.send(message);
        }
      }
    });

    // Also broadcast a global ADMIN channel for the simulator / dashboards
    EventBus.on('broadcast', ({ channel, eventType, payload }) => {
      const message = JSON.stringify({ channel: 'ADMIN', sourceChannel: channel, eventType, payload });
      for (const [ws, subscriptions] of this.clients.entries()) {
        if (ws.readyState === WebSocket.OPEN && subscriptions.has('ADMIN')) {
          ws.send(message);
        }
      }
    });
  }
}
