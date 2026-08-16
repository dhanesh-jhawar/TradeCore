export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { WSServerManager } = await import('./engine/wsServer');
    WSServerManager.init();
  }
}
