# BODMAS Challenge — with Admin Dashboard & Excel Export

This is your BODMAS game plus:
- A small backend that records every question a student answers (name, score, correct/wrong, timestamp).
- An **admin page** at `/admin` (password-protected) showing a live scoreboard.
- A **Download Excel** button on the admin page that generates a `.xlsx` file with two sheets:
  `Summary` (one row per student) and `Attempts (Detail)` (one row per question answered).

## Project structure

```
bodmas-project/
├── server.js          ← backend (Express)
├── package.json
├── .env.example        ← copy to .env and edit
├── public/
│   └── index.html       ← the game (students play this)
├── views/
│   └── admin.html       ← the admin dashboard
└── data/
    └── attempts.json    ← where scores are stored (auto-created)
```

## 1. Run it locally first

**The easy way:** unzip the folder, install [Node.js](https://nodejs.org) (LTS version) if you don't have it, then:
- **Mac/Linux:** double-click `start.sh` (or run `./start.sh` in a terminal)
- **Windows:** double-click `start.bat`

That's it — the script installs dependencies the first time, creates a `.env` file with a default admin login (`admin` / `changeme123`), and starts the server. Then open:
- Game: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (username `admin`, password `changeme123` unless you changed it)

You can change the admin password any time by editing `.env` and restarting the server. **Change it before you deploy publicly.**

**The manual way**, if you'd rather run each step yourself:

```bash
cd bodmas-project
npm install
cp .env.example .env
```

Open `.env` and set a real admin username/password:

```
ADMIN_USER=admin
ADMIN_PASSWORD=your-strong-password-here
```

Then start it:

```bash
npm start
```

- Game: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (your browser will ask for the username/password from `.env`)

Play through a few questions, then open `/admin` — you should see the scores appear, and "Download Excel" should give you a working spreadsheet.

## 2. Hosting it on a real server

This app needs to **run Node.js continuously** (it's not a static site), so it needs a Node-capable host. A few good, simple options:

### Option A — Render.com (free tier available)
1. Push this folder to a GitHub repo.
2. On Render: **New → Web Service** → connect your repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables `ADMIN_USER` and `ADMIN_PASSWORD` in the Render dashboard (don't upload your `.env` file).
6. **Important:** Render's free filesystem is *ephemeral* — it resets on redeploy. To keep scores permanently, add a free **Persistent Disk** in Render (mount it at `/opt/render/project/src/data`) so `attempts.json` survives restarts.

### Option B — Railway.app
Same idea as Render: connect the repo, it auto-detects `npm start`, add your `ADMIN_USER`/`ADMIN_PASSWORD` as environment variables, and attach a volume for the `data/` folder if you want scores to persist across deploys.

### Option C — Your own VPS (DigitalOcean, AWS EC2, etc.)
1. Install Node.js on the server.
2. Copy this folder up (`scp` or `git clone`).
3. `npm install --production`
4. Create your `.env` file on the server with real credentials.
5. Run it with a process manager so it survives reboots:
   ```bash
   npm install -g pm2
   pm2 start server.js --name bodmas
   pm2 save
   pm2 startup
   ```
6. Put it behind Nginx/Caddy for HTTPS and a proper domain.

### If you only have basic shared/cPanel hosting (no Node.js)
Let me know — most budget shared hosting can't run a Node.js process directly, and this project would need to be re-built with a PHP backend (writing to a `.csv`/Excel file and a password-protected `admin.php`) to work there. Happy to build that version if that's what you end up with.

## 3. Notes

- **Data storage:** scores are stored in `data/attempts.json`, a simple JSON file — no database setup needed. This is fine for a class-sized game; if you expect very heavy concurrent traffic later, it can be swapped for a real database.
- **Security:** change `ADMIN_PASSWORD` before you deploy — don't leave it as `changeme`. The admin routes (`/admin`, `/api/admin/*`) are protected by HTTP Basic Auth using the credentials in `.env`.
- **Resetting scores:** to clear all data, stop the server and delete (or empty to `[]`) `data/attempts.json`.
- **Backing up scores:** just download the Excel export any time — it always reflects the latest data.
