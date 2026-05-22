/**
 * Launcher — starts the email bot.
 * Used for single-service Railway deployments.
 *
 * Uses pnpm --filter to run the bot so pnpm workspace module resolution works
 * correctly (same as running `pnpm --filter @workspace/discord-bot run start`).
 *
 * Requires Node.js 22+.
 */

const { spawn } = require('child_process');

function startBot() {
  console.log('[Launcher] Starting EmailBot...');

  const proc = spawn('pnpm', ['--filter', '@workspace/discord-bot', 'run', 'start'], {
    stdio: 'inherit',
    env: process.env,
  });

  proc.on('exit', (code, signal) => {
    console.log(`[Launcher] EmailBot exited (code=${code}, signal=${signal}) — restarting in 5s`);
    setTimeout(startBot, 5000);
  });

  proc.on('error', (err) => {
    console.error(`[Launcher] EmailBot error: ${err.message} — restarting in 5s`);
    setTimeout(startBot, 5000);
  });
}

startBot();
