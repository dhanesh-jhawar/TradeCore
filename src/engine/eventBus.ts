import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners since many connections might listen to the same events temporarily 
    // or we might route heavily
    this.setMaxListeners(100);
  }

  // Helper method for typed emitting
  public broadcast(channel: string, eventType: string, payload: any) {
    this.emit('broadcast', { channel, eventType, payload });
  }
}

// Next.js hot reload safety
export const EventBus = (global as any).__eventBus || new AppEventBus();
if (!(global as any).__eventBus) {
  (global as any).__eventBus = EventBus;
}
