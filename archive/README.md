# bounswe2025group1
CMPE352/451 Group 1 repository

## Garden Planner Project

A web application for planning and managing gardens.

## Setup Instructions

### Backend
1. Navigate to the backend directory:
   ```
   cd gardenPlannerBackend
   ```

2. Create a virtual environment:
   ```
   python3 -m venv .venv
   ```

3. Activate the virtual environment:
   ```
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run the server:
   ```
   python3 manage.py runserver
   ```

The application will be available at http://127.0.0.1:8000/


### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Run the setup command:
   ```
   npm install
   ```
3. Run the server:
   ```
   npm run dev
   ```
The application will be available at http://localhost:5173/


### Mobile

1. Navigate to CommunityGardenApp directory:
   ```
   cd MOBILE/CommunityGardenApp
   ```
   
2. Install dependencies

   ```
   npm install
   ```

3. Start the app

   ```
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).
   
