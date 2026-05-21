# Memberk Emails Bot — Setup Guide

---

## Quick Start

| Platform | Guide |
|---|---|
| Railway | [Jump to Railway setup](#railway-deployment) |
| Replit | [Jump to Replit setup](#replit-setup) |
| Local | [Jump to local setup](#local-development) |

---

## Prerequisites

| Requirement | Where to get it |
|---|---|
| Node.js 22+ | Included on Railway & Replit |
| A Discord application | https://discord.com/developers/applications |
| At least one custom domain | Any registrar (Namecheap, Cloudflare, etc.) |

---

## Step 1 — Create a Discord Application

1. Go to https://discord.com/developers/applications → **New Application**
2. Name it (e.g. "Memberk Emails") → **Create**
3. Copy the **Application ID** → this is your `DISCORD_CLIENT_ID`
4. Open **Bot** in the left sidebar:
   - Click **Reset Token**, copy it → `DISCORD_BOT_TOKEN`
   - Enable **Message Content Intent** (under Privileged Gateway Intents)
5. Under **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Use Slash Commands`, `Send Messages in Threads`
6. Copy the generated URL → open it → invite the bot to your server

---

## Step 2 — Set Up Your Domains

The bot needs catch-all email forwarding on your domains so that every address
(`anything@yourdomain.com`) receives email. Choose a provider:

### Cloudflare Email Routing (free, recommended)

1. Add your domain to Cloudflare (free plan)
2. Dashboard → your domain → **Email → Email Routing → Enable**
3. Add a **Destination address** (your real inbox) and verify it
4. Set up a **Catch-all rule**: match all → forward to your destination
5. Cloudflare updates the MX records automatically

That's it. Every alias the bot creates will land in your real inbox.

### SimpleLogin (alternative — manages aliases per-address)

1. Create an account at https://app.simplelogin.io
2. Go to **Custom Domains → Add domain** and follow the MX record setup
3. A catch-all is enabled by default for your domain

---

## Railway Deployment

Railway is the recommended production host. The bot runs as a background service
(no port binding needed unless you enable the webhook server).

### 1. Push to GitHub

Push your project to a GitHub repository first.

### 2. Create a Railway Project

1. Go to https://railway.app → **New Project → Deploy from GitHub Repo**
2. Select your repository
3. In the service settings → **Settings → Root Directory** → set to:
   ```
   artifacts/discord-bot
   ```

### 3. Add Environment Variables

In Railway → your service → **Variables** tab, add:

| Variable | Value | Required |
|---|---|---|
| `DISCORD_BOT_TOKEN` | Your bot token | ✅ |
| `DISCORD_CLIENT_ID` | Your application ID | ✅ |
| `DOMAIN_COMMANDS` | `lgen:larpers.cc,ngen:nachtmail.online,...` | ✅ |
| `MAX_ALIASES_PER_USER` | `10` | Optional |
| `AUTO_DEPLOY_COMMANDS` | `true` (first deploy only) | Optional |
| `DISCORD_GUILD_ID` | Leave blank for global commands | Optional |
| `DATABASE_PATH` | `/data/aliases.db` (if using a Volume) | Optional |
| `LOG_CHANNEL_ID` | Your audit log channel ID | Optional |
| `ENABLE_WEBHOOK_SERVER` | `false` | Optional |
| `WEBHOOK_SECRET` | Random string for webhook auth | Optional |

### 4. Add a Persistent Volume (recommended)

Without a volume, the SQLite database resets on every redeploy.

1. Railway → your service → **Volumes** tab → **New Volume**
2. Mount path: `/data`
3. Add the variable: `DATABASE_PATH=/data/aliases.db`

### 5. Register Slash Commands (one-time)

Set `AUTO_DEPLOY_COMMANDS=true` in Variables before your first deploy.
The bot will register commands automatically at startup.

After the commands appear in Discord, set `AUTO_DEPLOY_COMMANDS=false` and
redeploy — this keeps startup fast. **Commands stay in Discord until you
explicitly change them.**

> **Re-register when:** you change `DOMAIN_COMMANDS` (add/remove domain commands)

### 6. Deploy

Click **Deploy**. Railway will build with nixpacks and start the bot.
Check the **Logs** tab to confirm:

```
[INFO]  SQLite database: /data/aliases.db
[INFO]  Loaded command: /delete
[INFO]  Loaded command: /gen
...
[INFO]  Loaded domain command: /lgen → @larpers.cc
[INFO]  Logged in as Memberk Emails#1234
```

### Enabling Email-to-DM Delivery on Railway

To receive inbound emails and deliver them to users via Discord DM:

1. Set `ENABLE_WEBHOOK_SERVER=true`
2. Set `WEBHOOK_SECRET=your-random-secret`
3. In Railway → **Settings** → note the public URL (e.g. `your-app.railway.app`)
4. Configure your mail provider to POST emails to:
   - Mailgun: `https://your-app.railway.app/webhook/mailgun`
   - Cloudflare Worker: `https://your-app.railway.app/webhook/cloudflare`
   - Generic: `https://your-app.railway.app/webhook/email`
5. Set the same `WEBHOOK_SECRET` value in your mail provider's webhook config

---

## Replit Setup

1. Open the **Secrets** panel (lock icon) and add the same variables from the table above
2. Open the Shell and run:
   ```bash
   pnpm --filter @workspace/discord-bot run deploy-commands
   ```
3. The **Discord Bot** workflow keeps the bot running

---

## Local Development

1. Copy `.env.example` to `.env` and fill in your values
2. Install dependencies:
   ```bash
   cd artifacts/discord-bot
   pnpm install
   ```
3. Register commands (once):
   ```bash
   node src/deploy-commands.js
   ```
4. Start the bot:
   ```bash
   node src/index.js
   ```

---

## Commands Reference

| Command | Description |
|---|---|
| `/gen` | Generate address on a random domain |
| `/lgen`, `/ngen`, ... | Generate on a specific domain |
| `/listmails` | List your addresses with quota bar |
| `/delete` | Remove an address (with autocomplete) |
| `/stats` | Bot statistics |
| `/ping` | Bot latency |
| `/usage` | Show all commands |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Commands not showing in Discord | Set `AUTO_DEPLOY_COMMANDS=true`, redeploy, then set back to `false` |
| Database resets on redeploy | Add a Railway Volume mounted at `/data` and set `DATABASE_PATH=/data/aliases.db` |
| Bot not starting on Railway | Check Logs tab — usually a missing env var |
| "Missing DISCORD_BOT_TOKEN" | Add it to Railway Variables or Replit Secrets |
| Webhook emails not arriving | Check `WEBHOOK_SECRET` matches your mail provider's config |
| Users not getting DMs | User must have DMs enabled from server members |
