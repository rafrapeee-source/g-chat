# Chat — a Google Chat replica

A full-stack real-time chat app: direct messages, group **Spaces**, live typing indicators,
and online/offline presence. React (Vite) frontend, Node/Express + Socket.IO backend,
MongoDB for storage. Built to deploy on Render's free tier with MongoDB Atlas's free
cloud database.

```
gchat-clone/
├── server/     Node + Express + Socket.IO + Mongoose API
├── client/     React (Vite) frontend
└── render.yaml Render Blueprint (deploys both services at once)
```

## Features

- Email/password signup & login (JWT auth, bcrypt-hashed passwords)
- Real-time messaging over WebSockets (Socket.IO) — no polling
- Direct messages (1:1) and group **Spaces** (multi-person rooms)
- Live typing indicators
- Online/offline presence, shown next to avatars
- Message history persisted in MongoDB, loaded on open
- Search people by name/email to start a DM or add to a Space

---

## 1. Set up a free MongoDB Atlas database

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a new **Project**, then click **Build a Database** → choose the **M0 Free** tier → pick any cloud provider/region close to you → **Create**.
3. **Create a database user**: under Security → Database Access → Add New Database User. Choose a username/password (autogenerate is fine) — save these, you'll need them.
4. **Allow network access**: under Security → Network Access → Add IP Address → choose **Allow Access from Anywhere** (`0.0.0.0/0`). This is required since Render's free tier uses dynamic IPs.
5. **Get your connection string**: go to Database → Connect → Drivers → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your actual credentials, and add a database name before the `?`, e.g.:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/gchat-clone?retryWrites=true&w=majority
   ```
   This full string is your `MONGO_URI`.

---

## 2. Run it locally first (recommended before deploying)

### Backend

```bash
cd server
cp .env.example .env
# edit .env: paste your MONGO_URI, set a random JWT_SECRET, leave PORT and CLIENT_ORIGIN as-is
npm install
npm run dev
```

You should see `MongoDB connected: ...` and `Server listening on port 5000`.

Generate a random `JWT_SECRET` quickly with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend

In a second terminal:
```bash
cd client
cp .env.example .env
# .env already points VITE_API_URL at http://localhost:5000, which matches the backend above
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Sign up two different accounts
(e.g. in a second incognito window) to test DMs and real-time messaging between them.

---

## 3. Deploy to Render (free tier)

### Option A — One-click Blueprint (recommended)

1. Push this project to a GitHub repository.
2. In the Render dashboard, click **New** → **Blueprint**, and connect your repo. Render will read `render.yaml` and set up both services automatically.
3. When prompted for environment variables, fill in:
   - **gchat-clone-server**:
     - `MONGO_URI` — your full Atlas connection string from step 1
     - `CLIENT_ORIGIN` — you'll fill this in after the client deploys and you know its URL (e.g. `https://gchat-clone-client.onrender.com`) — you can update it after first deploy in the service's Environment tab
     - `JWT_SECRET` is auto-generated for you
   - **gchat-clone-client**:
     - `VITE_API_URL` — the backend's URL once deployed (e.g. `https://gchat-clone-server.onrender.com`) — same story, you may need to fill this in after the backend's first deploy and trigger a redeploy of the client
4. Deploy. Because each service needs the other's URL, do one deploy first (URLs will be assigned), fill in the missing env var on the other service, then trigger a manual redeploy from the Render dashboard for that service. After that, both services are fully wired to each other.

### Option B — Manual setup

**Backend (Web Service):**
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET` (any long random string), `CLIENT_ORIGIN` (your deployed frontend URL, no trailing slash)
- Plan: Free

**Frontend (Static Site):**
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL` (your deployed backend URL, no trailing slash)
- Add a rewrite rule: source `/*` → destination `/index.html` (so client-side routing/refreshes work)
- Plan: Free

### A note on Render's free tier

Free web services on Render spin down after 15 minutes of inactivity and take
20–50 seconds to wake back up on the next request. Your first login/API call after
idling will feel slow — that's Render waking the backend, not a bug. Socket.IO will
reconnect automatically once the server is back up.

---

## How it's built

- **Auth**: JWT issued on signup/login, sent as `Authorization: Bearer <token>` on API
  requests and as a Socket.IO handshake auth token for the WebSocket connection.
- **Data model**: A "Space" document represents both DMs and group Spaces
  (`isDirect: true/false`) — a DM is just a 2-person Space under the hood, which keeps
  membership, message history, and real-time room logic identical for both.
- **Real-time**: Each connected socket joins a Socket.IO room per Space it belongs to
  (`space:<id>`). Sending a message broadcasts to that room only. Presence (online/offline)
  broadcasts globally so the sidebar can show live status dots.
- **Frontend state**: A small `AuthContext` holds the session and manages the Socket.IO
  connection lifecycle (connect on login, disconnect on logout). `ChatPage` owns the list
  of spaces and merges in live updates (new messages, presence) from socket events.

## Troubleshooting

- **"MONGO_URI is not set"** on server start — you haven't created `server/.env` (locally)
  or set the env var on Render.
- **CORS errors in the browser console** — `CLIENT_ORIGIN` on the backend doesn't match
  your frontend's actual URL exactly (check for `http` vs `https`, and no trailing slash).
- **Socket won't connect / falls back to polling forever** — same cause as above, or
  `VITE_API_URL` on the frontend doesn't point at the right backend URL.
- **Login works but messages never arrive in real time** — check the browser console for
  Socket.IO connection errors; usually a `CLIENT_ORIGIN`/`VITE_API_URL` mismatch.
