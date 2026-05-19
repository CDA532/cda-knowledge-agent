# CDA Knowledge Agent — Setup Guide
> AI-powered Google Drive search for Coastal Dental Arts staff

---

## How It Works

```
Staff types a question
        ↓
Next.js frontend (localhost:3000)
        ↓
FastAPI backend (localhost:8000)
        ↓
Google Drive API → reads your SOPs, manuals, HR docs
        ↓
Claude AI → synthesizes a plain-English answer
        ↓
Staff sees the answer + clickable document links
```

---

## STEP 1 — Google Cloud Setup (one-time, ~30 min)

### 1a. Create a Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click the project dropdown → **New Project**
3. Name it `CDA Knowledge Agent` → Create
4. Make sure this new project is selected

### 1b. Enable the Google Drive API
1. Go to **APIs & Services → Library**
2. Search for "Google Drive API" → Click it → **Enable**

### 1c. Create OAuth 2.0 Credentials (for staff login)
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth Client ID**
3. If prompted, configure the consent screen first:
   - User type: **Internal** (only your org)
   - App name: CDA Knowledge Agent
   - Add scope: `../auth/userinfo.email`
4. Back to Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
5. Click Create → **Copy the Client ID**
   → This is your `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### 1d. Create a Service Account (for reading Drive files)
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → Service Account**
3. Name it `drive-reader` → Create and Continue → Done
4. Click the service account you just created
5. Go to the **Keys** tab → **Add Key → Create new key → JSON**
6. A JSON file downloads → open it, copy ALL the contents
   → This is your `GOOGLE_SERVICE_ACCOUNT_JSON`

### 1e. Enable Domain-Wide Delegation (so it can read all Drive files)
1. Still on the service account page → **Details** tab
2. Check "Enable Google Workspace Domain-wide Delegation" → Save
3. Note the **Client ID** of the service account (numeric, looks like: 123456789)
4. Go to your **Google Workspace Admin Console** (admin.google.com)
5. Security → Access and data control → **API controls**
6. → **Manage Domain Wide Delegation → Add new**
7. Client ID: paste the service account's numeric Client ID
8. OAuth Scopes: `https://www.googleapis.com/auth/drive.readonly`
9. → Authorize

> ⚠️ If you don't have Google Workspace (just regular Gmail), skip 1e.
> The agent will still work but can only search files shared with the service account.

---

## STEP 2 — Backend Setup

```bash
cd drive-agent/backend

# 1. Create a virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up your environment variables
cp .env.example .env
```

Now open `.env` and fill in:
```
ANTHROPIC_API_KEY=sk-ant-...          # from console.anthropic.com
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # paste entire JSON on ONE line
GOOGLE_ADMIN_EMAIL=peter@cdentalarts.com    # your Google Workspace admin email
ALLOWED_DOMAIN=cdentalarts.com         # only this domain can log in
FRONTEND_URL=http://localhost:3000
```

```bash
# 4. Start the backend
uvicorn main:app --reload
# → Running at http://localhost:8000
# → Test it: http://localhost:8000/health
```

---

## STEP 3 — Frontend Setup

```bash
cd drive-agent/frontend

# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
```

Open `.env.local` and fill in:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# 3. Start the frontend
npm run dev
# → Open http://localhost:3000
```

---

## STEP 4 — Test It

1. Open http://localhost:3000
2. Click **Sign in with Google** → use your @cdentalarts.com account
3. Type a question like: `what is the sterilization SOP?`
4. You should see an AI answer + links to matching Drive docs ✓

---

## STEP 5 — Deploy (optional, for staff access from any device)

### Backend → Railway (free)
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Point to the `backend/` folder
3. Add all your `.env` variables in Railway's Variables tab
4. Copy the generated URL (e.g. `https://cda-agent.railway.app`)

### Frontend → Vercel (free)
1. Go to https://vercel.com → New Project → Import from GitHub
2. Point to the `frontend/` folder
3. Add environment variables:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your Client ID
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy → Copy the Vercel URL

### Final step after deploying:
Go back to Google Cloud → Credentials → your OAuth Client → add the Vercel URL to:
- Authorized JavaScript origins
- Authorized redirect URIs

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Invalid token" error | Make sure ALLOWED_DOMAIN matches your email domain |
| No documents found | Check service account has Drive read access; verify domain-wide delegation |
| Backend won't start | Check GOOGLE_SERVICE_ACCOUNT_JSON is valid JSON on one line |
| CORS error | Make sure FRONTEND_URL in backend .env matches your frontend URL |
| "Sign in failed" | Make sure localhost:3000 is in Authorized JS Origins in Google Cloud |
