# CrisisLens

A platform for real-time crisis information aggregation and analysis.

## Project Setup

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will run on `http://localhost:8000`

### Health Check

Once both services are running:
- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health

## Environment Variables

Copy `.env.example` to `.env` and configure the required API keys.
