# ETF Price Monitor

A web app for viewing ETF prices and holdings. Upload ETF composition files and a price file to explore historical ETF price trends and analyze top holdings.

Built with a React + TypeScript frontend and a Node.js + Express backend. The backend parses CSVs, performs all calculations, and exposes REST APIs. The frontend only uploads files and renders the returned data.

---

## What It Does

- Upload ETF composition files (e.g. `ETF1.csv`, `ETF2.csv`)
- Upload price data (`prices.csv`)
- View holdings in a sortable table with latest prices and computed holding size
- See ETF price over time (derived from constituent prices)
- View top N holdings by market value (default top 5)

---

## How It Works

### Frontend (React + TypeScript)

- Single-page app with drag-and-drop upload
- Charts built with Recharts
- No client-side calculations — all computed data is fetched from the API

### Backend (Node.js + Express)

- REST endpoints for uploads and data retrieval
- Parses CSV files and stores data in memory
- Computes everything server-side:
  - latest price per constituent
  - enriched holdings (e.g., weight × latest price)
  - ETF price series over time
  - top holdings by size
  - sorted holdings based on query params

### Typical Flow

1. App starts and checks/loads price data from the server
2. User uploads an ETF file
3. Server parses and stores holdings
4. Once both ETF + prices exist, the frontend fetches:
   - enriched holdings (sorted)
   - ETF price series
   - top holdings
5. User changes sort → frontend requests a new sorted dataset (server does the sort)

---

## API (Backend)

| Endpoint                                  | Description                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `POST /api/upload/etf`                    | Upload ETF CSV → parsed holdings                                                                       |
| `POST /api/upload/prices`                 | Upload prices CSV → parsed price data                                                                  |
| `GET /api/prices`                         | Full price data (for badges / loading checks)                                                          |
| `GET /api/prices/latest`                  | Latest price per constituent                                                                           |
| `GET /api/holdings/enriched?sort=&order=` | Enriched holdings with latest price and holding size, sorted (default `sort=constituent`, `order=asc`) |
| `GET /api/etf-price-series`               | ETF price series: `[{ date, price }]`                                                                  |
| `GET /api/holdings/top?n=5`               | Top N holdings by size                                                                                 |

---

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts  
**Backend:** Node.js, Express, TypeScript, Multer, csv-parser

---

## Assumptions

### Data format assumptions

- ETF CSV contains `name` and `weight` columns (or `constituent` instead of `name`)
- Prices CSV is a wide format: `DATE` column + constituent columns (A, B, C, ...)
- Constituent identifiers match exactly between ETF and price files
- Dates are `YYYY-MM-DD`
- Missing prices are treated as `0`

### Calculation assumptions

- ETF price (per day) = sum of `(weight × constituent price)` across constituents
- Holding size = `weight × latest price`
- Weights stay constant over time (per requirements)

### Technical assumptions

- Data is stored in memory (lost on server restart)
- 10MB upload limit
- Works in modern browsers
- Dates are sorted as strings (safe for ISO dates)

---

## Usage

Requires **Node.js v18+**.

### 1) Configure frontend API URL

Create a file at `client/.env`:

```bash
VITE_API_URL=http://localhost:3001
```

Vite will read this value at build/dev time, and the frontend will use it for API requests.

### 2) Install dependencies (root)

From the project root:

```bash
npm install
```

This installs dependencies for both `client/` and `server/` via the root `postinstall` script.

### 3) Run in development

From the project root:

```bash
npm run dev
```

- Frontend (Vite): `http://localhost:5173/`
- Backend API: `http://localhost:3001/`

### 4) Run in “production” mode

From the project root:

```bash
npm run start
```

- Frontend: `http://localhost:5173/`
- Backend API: `http://localhost:3001/`

> Note: In a typical production setup, you would run a built frontend (e.g. behind a CDN) and a deployed API. For this assignment, `npm run start` is a convenient way to run both apps together locally using their `start` scripts.

---

## Real-World Deployment (Example: AWS)

Due to the purpose of this assignment, this application is designed to run locally. In a real production scenario, the same architecture can be hosted on the cloud—especially because the workflow is event-triggered (upload → parse → compute → serve results).

Below is one practical AWS approach:

### Frontend hosting

- Host the React (Vite) frontend on **AWS Amplify Hosting** (or S3 + CloudFront).
- Amplify handles CI/CD from GitHub and provides HTTPS out of the box.

### File uploads (CSV)

- Store uploaded CSV files in **Amazon S3**.
- Use **pre-signed URLs** for secure, temporary uploads:
  1. Frontend calls an API endpoint to request a pre-signed upload URL
  2. Frontend uploads the CSV directly to S3 (no file payload through the API)
  3. S3 stores the raw file in a temporary/prefix location (e.g. `uploads/tmp/`)

### Parsing and processing

Because parsing is lightweight and event-driven:

- Trigger processing using **S3 Event Notifications** (ObjectCreated) → **AWS Lambda**
- The Lambda function:
  - validates the CSV structure
  - parses/normalizes the data
  - writes parsed results to a “clean” S3 prefix (e.g. `uploads/processed/`) or to a database for querying

> If you need to prevent untrusted raw files from being persisted long-term, you can store raw uploads in a short-lived temp prefix and move only validated/parsed output forward (plus apply S3 lifecycle rules to auto-delete temp files).

### API layer

- Host all REST endpoints as **AWS Lambda** behind **API Gateway**.
- This fits well here because the endpoints are stateless and the calculations are lightweight.

### Data persistence (production upgrade)

The current assignment stores everything in memory. In production, store state in:

- **DynamoDB** (simple key/value or document-style storage for holdings, latest prices, series results)
- or **S3** (store parsed JSON artifacts and read them back through APIs)
- optionally **ElastiCache/Redis** for caching “latest” computed outputs

### Security and ops (typical additions)

- **Cognito** for authentication/authorization (if needed)
- **IAM** least-privilege roles for S3/Lambda access
- **CloudWatch** logs/metrics + alarms
- Optional: **WAF** in front of API Gateway/CloudFront for basic protection

This deployment keeps costs low, scales automatically with upload volume, and matches the event-driven nature of the app.

---

## What’s Implemented

- Drag-and-drop file upload
- Sortable holdings table
- ETF price chart over time
- Top holdings chart (default top 5)
