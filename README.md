# 📚 VocabMaster Backend API

Production-ready, high-performance REST API backend for **VocabMaster** — an advanced personal English vocabulary learning platform and Spaced Repetition (SRS) system built with **NestJS**, **Prisma ORM**, and **Neon PostgreSQL**.

---

## 🚀 Key Features & Highlights

- **3,150+ Curated Vocabulary Catalog**: Complete with CEFR levels (A1–C2), parts of speech, categories, accurate Bangla translations, IPA pronunciations, and 4,100+ contextual example sentences stored directly in Neon PostgreSQL.
- **Production-Grade Authentication**:
  - Name, Email & Password registration and login.
  - Salted password hashing with `bcryptjs` (10 rounds).
  - Dual JWT token engine: short-lived **Access Token** (1 hour) and rotated **Refresh Token** (7 days).
  - Secure **HTTP-only session cookies** (`access_token` and `refresh_token`) with SameSite and CSRF protection.
  - Seamless dual-auth support: Native JWT + Supabase JWT Guard.
- **Spaced Repetition System (SRS)**: Authentic **SuperMemo-2 (SM-2)** algorithm calculating optimal interval intervals, repetition counts, and Easiness Factor ($EF \ge 1.3$) to maximize long-term memory retention.
- **Personalized Daily Word Goal (e.g., 50 words/day)**: Custom daily study target setting, real-time completion tracking, remaining words counter, and motivational streak milestones.
- **Smart 3-Session Daily Curriculum**:
  - 🌅 **Morning Kickstart**: Rapid active recall cards (30% of target).
  - ☀️ **Afternoon Deep Dive**: High-impact vocabulary & sentence contexts (40% of target).
  - 🌙 **Evening Mastery**: Consolidation & quick quiz (30% of target).
- **Word Bookmarking ("Book List a Saved Korbo")**: Instant toggle bookmarking, paginated saved words list, and bulk-save capabilities.
- **Gamification & Badges**: Automatic XP calculations, level progressions (Novice to Supreme Polyglot), and 10 dynamic milestone achievements.
- **External Dictionary Integration**:
  - Live **FreeDict API** integration with authentic Bengali translations and CEFR levels.
  - Global audio pronunciation feeds (`en-US` and `en-GB`).
  - Dynamic Word Ingestion: newly searched words from FreeDict are automatically saved into the database for future offline and instant access.
- **Full Offline PWA Sync Engine**: Supports offline client review pushes with conflict resolution and pull updates.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS 11](https://nestjs.com/) (TypeScript)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Authentication**: JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`
- **Validation**: `class-validator`, `class-transformer`
- **Documentation**: Swagger / OpenAPI 3.0
- **Testing**: Jest (100% passing test suites)

---

## 📋 Complete API Endpoints Reference

### 🔐 1. Authentication & Sessions (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with Name, Email & Password. Returns tokens and sets HTTP cookies. |
| `POST` | `/api/auth/login` | Log in user with Email & Password. Sets secure cookies and returns tokens. |
| `POST` | `/api/auth/refresh` | Rotate access & refresh tokens (reads from body or HTTP cookie). |
| `POST` | `/api/auth/logout` | Revoke database refresh token and clear HTTP session cookies. |
| `GET` | `/api/auth/me` | Get current authenticated user profile, settings and study stats. |

---

### 👤 2. User Profile & Daily Target (`/api/user`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/user/profile` | Get full user profile, learning preferences, and current streak. |
| `PUT` | `/api/user/profile` | Update profile (full name, preferred accent US/UK, theme, target language). |
| `GET` | `/api/user/daily-goal` | Get today's goal progress, words reviewed, remaining count, and percent complete. |
| `PATCH` | `/api/user/daily-goal` | Set custom daily target (e.g. `{ "dailyWordGoal": 50 }`). |
| `GET` | `/api/user/activity` | Get user's recent 30-day activity logs. |

---

### 📊 3. User Dashboard & Curriculum (`/api/dashboard`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/overview` | Comprehensive dashboard overview: streak, level XP, daily goal status, KPIs, and 7-day review forecast. |
| `GET` | `/api/dashboard/daily-plan` | Smart 3-session daily plan customized to user's daily word goal (Morning, Afternoon, Evening). |
| `GET` | `/api/dashboard/struggling-words` | List of words where user frequently lapses with personal mnemonics and mastery tips. |
| `GET` | `/api/dashboard/achievements` | Milestone badges, streaks, unlock status, and progress bars. |
| `GET` | `/api/dashboard/heatmap` | 365-day GitHub-style learning activity matrix with intensity levels. |

---

### 📖 4. Vocabulary & Bookmarks (`/api/vocabulary`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/vocabulary` | Search and filter 3,150+ words (supports search, CEFR, category, POS, pagination, or `source=freedict`). |
| `GET` | `/api/vocabulary/categories` | List all vocabulary categories with live word counts. |
| `GET` | `/api/vocabulary/bookmarks` | Get paginated list of words saved in user's personal book list. |
| `POST` | `/api/vocabulary/bookmark/:wordId` | Toggle bookmark on a word (saves or removes from book list). |
| `DELETE` | `/api/vocabulary/bookmark/:wordId` | Remove a word from user's book list. |
| `POST` | `/api/vocabulary/bookmarks/bulk` | Save multiple words to book list at once (`{ "wordIds": ["peace", "hope"] }`). |
| `GET` | `/api/vocabulary/:wordOrId` | Deep word details with examples, synonyms, antonyms, and user notes. |
| `POST` | `/api/vocabulary/custom` | Create a user custom vocabulary word with custom translations. |

---

### 🌐 5. Dictionary & FreeDict API (`/api/dictionary`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dictionary/freedict/words` | Paginated live feed from FreeDict API with Bengali translations & CEFR levels. |
| `GET` | `/api/dictionary/freedict/:word` | Direct word lookup via FreeDict API with Bengali translations & phonetic IPA. |
| `GET` | `/api/dictionary/lookup/:word` | Unified dictionary lookup combining FreeDict with FreeDictionary audio phonetics. |
| `GET` | `/api/dictionary/raw/:word` | Raw OpenDictionary definitions payload. |
| `GET` | `/api/tts/speak` | Fallback text-to-speech audio pronunciation URL (`US`, `UK`, or `BN`). |

---

### 🧠 6. Spaced Repetition (SRS) Flashcards (`/api/srs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/srs/queue` | Get due review cards and new learning cards for the current user. |
| `POST` | `/api/srs/review` | Submit card rating (1: AGAIN, 2: HARD, 3: GOOD, 4: EASY) with SM-2 recalculation. |
| `GET` | `/api/srs/summary` | Get SRS statistics: total reviewed, mastered, learning, and retention rate. |

---

### 🎯 7. Interactive Quiz Engine (`/api/quiz`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/quiz/generate` | Generate dynamic quiz (MULTIPLE_CHOICE, FILL_IN_BLANK, AUDIO_LISTENING, MATCHING_PAIRS). |
| `POST` | `/api/quiz/submit` | Submit quiz session answers, compute accuracy, and persist score to database. |
| `GET` | `/api/quiz/history` | Get user's past quiz sessions and scores. |

---

### 📁 8. Collections & Notes (`/api/collections` & `/api/notes`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/collections` | List all custom collections for the user with word counts. |
| `POST` | `/api/collections` | Create a new custom collection deck. |
| `GET` | `/api/collections/:id` | Get collection details and its included words. |
| `POST` | `/api/collections/:id/words` | Add a vocabulary word to a collection. |
| `DELETE` | `/api/collections/:id/words/:wordId` | Remove a word from a collection. |
| `GET` | `/api/notes/:wordId` | Get personal study note and mnemonic for a word. |
| `POST` | `/api/notes/:wordId` | Save or update personal note, mnemonic, and custom example sentence. |

---

### 🔄 9. Offline PWA Synchronization (`/api/sync`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sync/push` | Push offline review cards recorded on client IndexedDB with conflict resolution. |
| `GET` | `/api/sync/pull` | Pull delta updates modified since last client sync timestamp. |

---

### 🏥 10. Health Check (`/api/health`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Live service health status, database connectivity, and uptime. |

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the `backend/` directory:

```env
# Application Port & Mode
PORT=4000
NODE_ENV=production

# PostgreSQL Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:password@ep-bold-paper-...neon.tech/neondb?sslmode=require"

# Native JWT Secrets & Cookie Authentication
JWT_ACCESS_SECRET="your-super-secure-access-jwt-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secure-refresh-jwt-secret-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# FreeDict API (Bengali Translations & CEFR Dictionary)
FREEDICT_API_KEY="fd_de8a207b7f277eb4db2ca81df9b932c10f00381e525d52bf"
FREEDICT_API_URL="https://freedict.com/api/v1"

# Supabase Credentials (optional dual auth)
SUPABASE_URL="https://hycctnmwtzeuuvojazwx.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# CORS Settings
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## 🏃 Local Setup & Development

### 1. Install Dependencies
```bash
# From repository root:
npm install
```

### 2. Synchronize Database & Generate Prisma Client
```bash
cd backend
npx prisma db push
```

### 3. Run Unit Tests (29/29 passing)
```bash
npm run test
```

### 4. Start Development Server
```bash
npm run start:dev
```
The API will be live at: `http://localhost:4000/api`  
Interactive Swagger Documentation: `http://localhost:4000/api/docs`

---

## 🚢 Production Deployment Guide

### Option 1: Deploy on Render.com (Recommended Free Cloud Host)
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New + -> Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Environment:** `Node`
   - **Build Command:**
     ```bash
     npm ci && npm --workspace=packages/shared run build && npm --workspace=backend run build
     ```
   - **Start Command:**
     ```bash
     npm --workspace=backend run start:prod
     ```
   - **Instance Type:** `Free`
5. Add your Environment Variables in the **Environment** tab:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `FREEDICT_API_KEY`
   - `CORS_ORIGIN` = `*` (or your frontend deployment URL)
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**!

---

### Option 2: Deploy with Docker
The repository includes a production multi-stage `Dockerfile`:

```bash
# Build Docker image
docker build -f backend/Dockerfile -t vocabmaster-backend .

# Run Docker container
docker run -p 4000:4000 --env-file backend/.env vocabmaster-backend
```

Or using Docker Compose:
```bash
docker compose up -d backend
```

---

## 📄 License

MIT © [VocabMaster Team](https://github.com/aftab-farhan)
