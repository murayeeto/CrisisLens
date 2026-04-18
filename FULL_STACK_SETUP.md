# CrisisLens - Full Stack Setup Guide

This guide explains how to run the CrisisLens application with both the backend API and frontend.

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create or update the `.env` file with your configuration:
```bash
# Copy the example (if it exists)
cp .env.example .env
# Then edit .env with your API keys and settings
```

4. Run the backend server:
```bash
python main.py
```

The backend will start on `http://localhost:8000`

You can verify it's running by visiting: `http://localhost:8000/health`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (or update the existing one) with the API configuration:
```bash
VITE_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Running Both Services

From the root `CrisisLens` directory, you can open two terminals:

**Terminal 1 (Backend):**
```bash
cd backend
python main.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Then open your browser to `http://localhost:5173`

## API Integration

The frontend communicates with the backend through the API client in `frontend/src/lib/api.js`.

Key endpoints:
- `GET /health` - Health check
- `GET /events` - List events
- `POST /auth/login` - User login
- `GET /users/me` - Current user
- And more...

See the backend routes in `backend/routes/` for complete API documentation.

## Environment Variables

**Frontend (.env):**
- `VITE_API_URL` - Backend API base URL (default: http://localhost:8000)

**Backend (.env):**
- `DEBUG` - Enable debug mode (true/false)
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `NEWS_API_KEY` - News API key
- `OPENAI_API_KEY` - OpenAI API key
- `MAPS_API_KEY` - Google Maps or Mapbox API key
- `USE_MOCK_AUTH` - Use mock authentication (true/false)
- `USE_MOCK_DATA` - Use mock data (true/false)

## Troubleshooting

**Frontend can't reach backend:**
- Make sure the backend is running on port 8000
- Check `VITE_API_URL` in frontend/.env
- Check CORS_ORIGINS in backend/.env
- Check browser console for errors

**CORS errors:**
- Verify backend CORS_ORIGINS includes frontend URL
- Default is `http://localhost:5173` for dev

**Dependency issues:**
- Frontend: `npm ci` (clean install)
- Backend: `pip install -r requirements.txt --force-reinstall`
