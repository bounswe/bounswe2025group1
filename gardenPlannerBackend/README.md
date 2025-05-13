# Garden Planner Backend

A Django REST API for managing garden layouts and plant information.

## Project Structure

```
gardenPlannerBackend/
├── core/                   # Main Django project settings
├── gardenplanner/          # Main application package
│   ├── apps/               # Django applications
│   │   ├── garden/         # Garden planning application
│   │   └── ...             # Other apps can be added here
├── manage.py               # Django management script
├── .env                    # Environment variables
└── requirements.txt        # Project dependencies
```

## Setup

1. Create and activate a virtual environment:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

5. Run the development server:
   ```
   python manage.py runserver
   ```

## API Endpoints

API endpoints will be documented here as they are developed. 

## Task Types

The system supports both predefined system task types and custom user-defined task types:

### Predefined Task Types
- **Harvest**: For scheduling and tracking harvest activities
- **Maintenance**: For garden maintenance activities

### Custom Task Types
Users can create their own custom task types specific to their garden needs through the CustomTaskType model.

When creating a task, specify one of the following:
1. A predefined task type (HARVEST or MAINTENANCE)
2. A custom task type (setting task_type to CUSTOM and providing a custom_type reference)

