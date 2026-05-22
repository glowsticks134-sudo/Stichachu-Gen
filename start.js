/**
 * Combined launcher — starts both the email bot and utility bot in one process.
 * Used for single-service Railway deployments.
 *
 * Uses pnpm --filter to run each bot so pnpm workspace module resolution works
 * correctly (same as running `pnpm --filter @workspace/discord-bot run start`).
 */

const { spawn } = require('child_process');

const bots = [
  {
    name: 'EmailBot',
    cmd: 'pnpm',
    args: ['--filter', '@workspace/discord-bot', 'run', 'start'],
  },
  {
    name: 'UtilityBot',
    cmd: 'pnpm',
    args: ['--filter', '@workspace/utility-bot', 'run', 'start'],
  },
];

function startBot(bot) {
  console.log(`[Launcher] Starting ${bot.name}...`);

  const proc = spawn(bot.cmd, bot.args, {
    stdio: 'inherit',
    env: process.env,
  });

  proc.on('exit', (code, signal) => {
    console.log(`[Launcher] ${bot.name} exited (code=${code}, signal=${signal}) — restarting in 5s`);
    setTimeout(() => startBot(bot), 5000);
  });

  proc.on('error', (err) => {
    console.error(`[Launcher] ${bot.name} error: ${err.message} — restarting in 5s`);
    setTimeout(() => startBot(bot), 5000);
  });
}

for (const bot of bots) {
  startBot(bot);
}
