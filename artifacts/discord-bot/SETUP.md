# Discord Email Alias Bot — Setup Guide

## Overview

This bot lets Discord users generate, manage, and delete disposable email aliases
on your own custom domain. Aliases can be backed by:

- **SimpleLogin** — a privacy-focused alias service with a free API tier
- **Cloudflare Email Routing** — built into Cloudflare's free plan
- **Local** — no external API; useful when you have a catch-all rule in place

---

## Prerequisites

| Requirement | Where to get it |
|---|---|
| Node.js 18+ | Already on Replit |
| A Discord application | https://discord.com/developers/applications |
| A custom domain | Any registrar (Namecheap, Cloudflare, etc.) |
| SimpleLogin account **or** Cloudflare account | See provider sections below |

---

## Step 1 — Create a Discord Application

1. Go to https://discord.com/developers/applications → **New Application**
2. Name it (e.g. "Email Alias Bot") → **Create**
3. Copy the **Application ID** → this is your `DISCORD_CLIENT_ID`
4. Open **Bot** in the left sidebar → **Add Bot**
5. Under the bot's username, click **Reset Token**, then copy it → `DISCORD_BOT_TOKEN`
6. Enable **Message Content Intent** (not required now but good practice)
7. Under **OAuth2 → URL Generator**, tick `bot` + `applications.commands`
8. Under **Bot Permissions** tick: _Use Slash Commands_
9. Copy the generated URL, open it in your browser, and invite the bot to your server

---

## Step 2 — Configure Your Domain

### Option A — SimpleLogin (recommended for beginners)

SimpleLogin acts as the alias layer. Your domain is verified once; every alias
is created via their API. Forwarding is handled entirely by SimpleLogin.

**How it works:**
```
Someone sends email → alias@yourdomain.com
SimpleLogin receives it (because MX records point to them)
SimpleLogin forwards it to your real inbox
```

**Setup:**
1. Create a free account at https://app.simplelogin.io
2. Go to **Dashboard → Custom Domains → Add a domain**
3. Add the MX and TXT DNS records shown — usually:
   ```
   Type  Name   Value                          Priority
   MX    @      mx1.simplelogin.co.            10
   MX    @      mx2.simplelogin.co.            20
   TXT   @      "v=spf1 include:simplelogin.co ~all"
   TXT   dkim._domainkey   (value shown in SL dashboard)
   ```
4. Wait for DNS to propagate (usually < 15 minutes)
5. Click **Verify** in the SimpleLogin dashboard
6. Go to **API Key** and generate one → `SIMPLELOGIN_API_KEY`

**Set in `.env`:**
```
EMAIL_PROVIDER=simplelogin
SIMPLELOGIN_API_KEY=sl-your-key-here
EMAIL_DOMAIN=yourdomain.com
```

---

### Option B — Cloudflare Email Routing

Cloudflare intercepts incoming email for your domain and routes it based on
rules you define. This bot creates one routing rule per alias via the API.

**How email routing works:**
```
Someone sends email → alias@yourdomain.com
Cloudflare receives it (MX records point to Cloudflare's servers)
Cloudflare looks up matching routing rule for that address
Cloudflare forwards it to CLOUDFLARE_DESTINATION_EMAIL
```

**Setup:**
1. Add your domain to Cloudflare (free plan is fine)
2. In the Cloudflare dashboard → your domain → **Email → Email Routing**
3. Click **Enable Email Routing** — Cloudflare will prompt you to update your
   MX records automatically if your nameservers are already Cloudflare
4. Add a **Destination Address** (your real inbox) and verify it
5. Create an API Token at https://dash.cloudflare.com/profile/api-tokens:
   - Template: **Custom token**
   - Permission: `Zone` → `Email Routing Rules` → `Edit`
   - Zone resource: your domain
6. Copy your **Zone ID** from the domain overview page (right sidebar)

**Set in `.env`:**
```
EMAIL_PROVIDER=cloudflare
EMAIL_DOMAIN=yourdomain.com
CLOUDFLARE_API_TOKEN=your-token-here
CLOUDFLARE_ZONE_ID=your-zone-id-here
CLOUDFLARE_DESTINATION_EMAIL=you@gmail.com
```

---

### Option C — Local (no external API)

Use this if you already have a **catch-all** forwarding rule set up on your
domain (e.g. a Cloudflare catch-all, or your hosting provider's wildcard route).
The bot generates alias addresses and tracks them in SQLite only — no API calls.

**Set in `.env`:**
```
EMAIL_PROVIDER=local
EMAIL_DOMAIN=yourdomain.com
```

> Emails to any `*@yourdomain.com` will land in your catch-all inbox.
> The bot tracks who owns each alias but doesn't create per-alias routing rules.

---

## Step 3 — Configure Environment Variables on Replit

1. In Replit, open the **Secrets** panel (lock icon in the left sidebar)
2. Add each key from `.env.example` with your real values
   - Never paste secrets directly into code files

---

## Step 4 — Install Dependencies & Register Commands

Open the Replit **Shell** and run:

```bash
# Install packages
cd artifacts/discord-bot && pnpm install

# Register slash commands
# Set DISCORD_GUILD_ID in Secrets for instant registration (dev only)
node src/deploy-commands.js
```

> **Global vs guild commands:**
> - Guild commands appear instantly (good for testing)
> - Global commands can take up to 1 hour to propagate across Discord
> - Remove `DISCORD_GUILD_ID` from Secrets before going to production

---

## Step 5 — Start the Bot

The bot runs as a persistent workflow. To start or restart it:

```bash
# From the discord-bot directory
node src/index.js
```

On Replit the workflow keeps the bot alive automatically. You can also use the
**Run** button if a workflow has been configured.

---

## Available Commands

| Command | Description |
|---|---|
| `/createemail` | Generate a new unique alias (30s cooldown, max 5 per user) |
| `/myemails` | List all your active aliases (ephemeral — only you see it) |
| `/deleteemail alias:<email>` | Delete one of your aliases permanently |
| `/emailinfo alias:<email>` | Show creation date and status of an alias |

---

## Security Notes

- All replies are **ephemeral** — only the command author sees them
- Each alias is **owner-locked** — you cannot view or delete another user's alias
- Rate limits: 30 s cooldown on create, 10 s on all other commands
- Hard cap of `MAX_ALIASES_PER_USER` (default 5) per Discord user
- Aliases are soft-deleted in the database to preserve audit history

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Commands not showing up | Run `node src/deploy-commands.js` again; set `DISCORD_GUILD_ID` for instant update |
| `DISCORD_BOT_TOKEN missing` | Add it to Replit Secrets |
| SimpleLogin "domain not found" | Verify the domain in your SimpleLogin dashboard and wait for DNS |
| Cloudflare "API error" | Check your token has `Email Routing Rules: Edit` permission |
| `better-sqlite3` build error | Run `pnpm install` again; the package compiles a native addon |
