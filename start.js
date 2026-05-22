/**
 * Combined launcher — starts both the email bot and utility bot in one process.
 * Used for single-service Railway deployments.
 */

const { spawn } = require('child_process');
const path = require('path');

const bots = [
  {
    name: 'EmailBot',
    cwd: path.join(__dirname, 'artifacts/discord-bot'),
    cmd: 'node',
    args: ['--no-warnings=ExperimentalWarning', 'src/index.js'],
  },
  {
    name: 'UtilityBot',
    cwd: path.join(__dirname, 'artifacts/utility-bot'),
    cmd: 'node',
    args: ['src/shard.js'],
  },
];

function startBot(bot) {
  console.log(`[Launcher] Starting ${bot.name}...`);

  const proc = spawn(bot.cmd, bot.args, {
    cwd: bot.cwd,
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
