# Garden Planner Project

CMPE352/451 Group 1 - A comprehensive application for planning and managing community gardens.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Backend (Django)](#backend-django)
  - [Frontend (React)](#frontend-react)
  - [Mobile (React Native + Expo)](#mobile-react-native--expo)
- [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Garden Planner is a full-stack application consisting of:
- **Backend**: Django REST Framework API with PostgreSQL database
- **Frontend**: React web application with Vite
- **Mobile**: React Native mobile app using Expo

Features include:
- User authentication and profiles
- Garden creation and management
- Task assignment and tracking
- Community forum and messaging
- Real-time notifications via Firebase
- Badge system for user achievements

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** and npm - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)
- **Expo CLI** (for mobile development) - Install via npm
- **Firebase Account** - [Create account](https://firebase.google.com/)

### Optional
- **Docker & Docker Compose** - [Download](https://www.docker.com/get-started)
- **Android Studio** - For Android emulator
- **Xcode** - For iOS simulator (macOS only)

## Project Structure

```
bounswe2025group1/
├── gardenPlannerBackend/    # Django backend
├── frontend/                # React frontend
├── MOBILE/                  # React Native mobile app
│   └── CommunityGardenApp/
├── docker-compose.yml       # Docker orchestration
└── README.md               # This file
```

## Setup Instructions

### Backend (Django)

#### 1. Navigate to backend directory
```bash
cd gardenPlannerBackend
```

#### 2. Create and activate virtual environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate on macOS/Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

#### 3. Install dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure environment variables
Create a `.env` file in the `gardenPlannerBackend` directory:
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=gardenplanner
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account.json
```

#### 5. Setup Firebase Admin SDK
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as `firebase-service-account.json` in `gardenPlannerBackend/`

#### 6. Setup PostgreSQL database
```bash
# Create database (run in PostgreSQL shell or use pgAdmin)
createdb gardenplanner

# Or connect to PostgreSQL and run:
# CREATE DATABASE gardenplanner;
```

#### 7. Run migrations
```bash
python manage.py migrate
```

#### 8. Create superuser (optional)
```bash
python manage.py createsuperuser
```

#### 9. Start the development server
```bash
python manage.py runserver
```

The backend API will be available at **http://127.0.0.1:8000/**

Admin panel: **http://127.0.0.1:8000/admin/**

API documentation: **http://127.0.0.1:8000/swagger/**

---

### Frontend (React)

#### 1. Navigate to frontend directory
```bash
cd frontend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment variables
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### 4. Start the development server
```bash
npm run dev
```

The frontend will be available at **http://localhost:5173/**

#### Build for production
```bash
npm run build
```

---

### Mobile (React Native + Expo)

#### 1. Navigate to mobile app directory
```bash
cd MOBILE/CommunityGardenApp
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment variables
Create a `.env` file in the `MOBILE/CommunityGardenApp` directory:
```env
EXPO_PUBLIC_API_URL=http://your-backend-ip:8000
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Note**: For mobile testing on physical devices, replace `localhost` with your computer's local IP address (e.g., `192.168.1.100`).

#### 4. Setup Firebase for mobile
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Add Android and/or iOS apps to your project
3. Download `google-services.json` (Android) and/or `GoogleService-Info.plist` (iOS)
4. Follow Expo Firebase setup guide: [Expo Firebase Docs](https://docs.expo.dev/guides/using-firebase/)

#### 5. Start Expo development server
```bash
npx expo start
```

#### Run on different platforms:
- Press **`a`** - Open on Android emulator
- Press **`i`** - Open on iOS simulator (macOS only)
- Press **`w`** - Open in web browser
- Scan QR code with Expo Go app on physical device

#### Build for production
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

---

## Docker Deployment

Run all services (backend, frontend, mobile, and PostgreSQL) using Docker:

#### 1. Ensure all .env files are configured
Make sure you have `.env` files in:
- `gardenPlannerBackend/.env`
- `frontend/.env`
- `MOBILE/CommunityGardenApp/.env`

#### 2. Start all services
```bash
docker-compose up --build
```

#### 3. Access the services
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:8000
- **Mobile**: Expo DevTools at http://localhost:19000
- **PostgreSQL**: localhost:5433

#### Stop services
```bash
docker-compose down
```

#### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mobile
```

---

## Configuration

### Backend Configuration

Key files in `gardenPlannerBackend/`:
- `gardenplanner/settings.py` - Django settings
- `.env` - Environment variables
- `firebase-service-account.json` - Firebase Admin SDK credentials

### Frontend Configuration

Key files in `frontend/`:
- `vite.config.js` - Vite build configuration
- `.env` - Environment variables
- `src/constants/Config.js` - API endpoints

### Mobile Configuration

Key files in `MOBILE/CommunityGardenApp/`:
- `app.json` - Expo configuration
- `.env` - Environment variables
- `constants/Config.ts` - API endpoints
- `config/firebaseConfig.ts` - Firebase client configuration

---

## Troubleshooting

### Backend Issues

**Database connection error**
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep gardenplanner
```

**Migration errors**
```bash
# Reset migrations (⚠️ destroys data)
python manage.py migrate --run-syncdb

# Or create fresh migrations
python manage.py makemigrations
python manage.py migrate
```

**Firebase errors**
- Verify `firebase-service-account.json` is in the correct location
- Check Firebase project permissions
- Ensure service account has proper roles

### Frontend Issues

**API connection error**
- Verify backend is running on port 8000
- Check CORS settings in backend `settings.py`
- Ensure `VITE_API_URL` in `.env` is correct

**Build errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Mobile Issues

**Metro bundler errors**
```bash
# Clear Expo cache
npx expo start -c
```

**Cannot connect to backend**
- Use your computer's local IP address instead of `localhost`
- Ensure devices are on the same network
- Check firewall settings

**Firebase authentication errors**
- Verify Firebase config in `config/firebaseConfig.ts`
- Check Firebase project settings
- Ensure Firebase authentication methods are enabled

**iOS build issues**
- Ensure Xcode is up to date
- Install CocoaPods: `sudo gem install cocoapods`
- Run `npx pod-install` in iOS directory

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of CMPE352/451 coursework at Boğaziçi University.
