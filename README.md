# CrisisLens

CrisisLens is a crisis intelligence platform that aggregates, analyzes, and presents real-time global emergency information through an interactive dashboard with AI-powered summarization and multi-language support.

## Overview

CrisisLens provides humanitarian organizations, journalists, researchers, and decision-makers with timely access to crisis events worldwide. The platform combines news aggregation, geospatial visualization, and artificial intelligence to deliver actionable crisis intelligence.

## Features

- Real-time crisis event tracking with global geographic visualization
- AI-generated event summaries and impact analysis using OpenAI GPT-3.5
- Multi-language support with on-demand translation (10 languages)
- User preferences and personalized event filtering
- Event bookmarking and saved article management
- Crisis relief fund integration
- Role-based access control (member and reviewer roles)
- Firebase-backed user authentication and data persistence
- Responsive design supporting desktop and mobile platforms

## Architecture

The application consists of two primary components:

### Frontend
- React 18 with Vite build system
- Framer Motion for animations
- Tailwind CSS for styling
- Three.js for 3D globe visualization
- Firestore real-time database integration

### Backend
- Flask 3.0.0 REST API
- Python-based service layer
- Firebase Admin SDK integration
- OpenAI API for translations
- News aggregation pipeline

### Data
- Firestore database for user profiles, preferences, and event data
- Firebase Authentication for user management

## Prerequisites

- Node.js 18.x or later
- Python 3.9 or later
- Firebase project with Admin SDK credentials
- OpenAI API key
- News API key (for crisis event aggregation)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your API credentials:
- FIREBASE_CREDENTIALS_PATH
- OPENAI_API_KEY
- NEWS_API_KEY

5. Start the backend server:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your API endpoints and Firebase configuration.

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Running the Application

Once both services are configured and started:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Backend health check: http://localhost:8000/health

## API Endpoints

### Events
- `GET /api/events` - Retrieve all crisis events (supports language parameter)
- `GET /api/events/{id}` - Retrieve a specific event
- `POST /api/events/{id}/translate` - Translate event content to specified language

### News
- `GET /api/news/trending` - Retrieve trending articles

### Users
- `GET /api/users/me` - Retrieve current user profile
- `PATCH /api/users/me` - Update user preferences and language
- `GET /api/users/me/saved-events` - Retrieve saved events

### Relief Campaigns
- `GET /api/campaigns` - Retrieve relief fund campaigns
- `GET /api/campaigns/{id}` - Retrieve specific campaign
- `POST /api/campaigns` - Create new relief fund campaign
- `PATCH /api/campaigns/{id}` - Update campaign details
- `POST /api/campaigns/{id}/review` - Submit campaign for review

## Technology Stack

### Frontend
- React 18
- Vite 5.4
- Tailwind CSS 3
- Framer Motion
- Three.js
- Lucide React icons

### Backend
- Flask 3.0.0
- Python 3.9+
- Firebase Admin SDK
- OpenAI API (GPT-3.5-turbo)
- Requests HTTP library

### Infrastructure
- Firebase Firestore (database)
- Firebase Authentication
- Firebase Admin SDK

## Language Support

The translation feature supports the following languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Arabic (ar)
- Hindi (hi)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)

Users can select their preferred language in account preferences. Event translations are performed on-demand through the translation endpoint.

## Development Notes

- The backend includes a translation service with configurable OpenAI integration
- Translations are disabled by default (set `ENABLE_TRANSLATIONS=true` to activate bulk translation)
- The frontend implements optimized state management for event caching and performance
- All user preferences and language settings are persisted in Firebase
- The application implements proper error handling and timeout management for API calls

## Security

- User authentication is managed through Firebase
- API endpoints requiring authentication use Firebase ID tokens
- Environment variables for sensitive credentials are kept in `.env` files (not committed to version control)
- Role-based access control restricts certain operations to specific user types

## Performance Considerations

- Event translations are performed on-demand to avoid bulk API costs
- Frontend implements caching for event data
- Firestore is optimized for real-time queries
- The 3D globe uses Three.js for efficient rendering
