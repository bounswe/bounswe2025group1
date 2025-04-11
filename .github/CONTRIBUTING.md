# Contributing Guidelines

Welcome to the CMPE 352 Group 1 Project repository! This document outlines the guidelines and practices for contributing to our team project.

## Table of Contents
- [Getting Started](#getting-started)
  - [Tech Stack Overview](#tech-stack-overview)
  - [Environment Setup](#environment-setup)
- [Development Process](#development-process)
  - [Issue Management](#issue-management)
  - [Branch Management](#branch-management)
  - [Pull Request Workflow](#pull-request-workflow)
  - [Code Review Process](#code-review-process)
- [Project Standards](#project-standards)
  - [Code Style Guidelines](#code-style-guidelines)
  - [Documentation Standards](#documentation-standards)
  - [Testing Requirements](#testing-requirements)

---

## Getting Started

### Tech Stack Overview

Our project uses the following technologies:
- **Backend**: Django REST Framework (Python 3.9+)
- **Database**: MySQL 8.0+
- **Frontend**: React 18+ (with React Router, Redux)
- **Mobile**: React Native (latest stable version)

### Environment Setup

#### Backend (Django REST Framework)

**Prerequisites**:
- Python 3.9+
- pipenv or virtualenv
- MySQL 8.0+

**Setup Steps**:
```bash
# Clone the repository
git clone <repository-url>
cd bounswe2025group1

# Create and activate virtual environment
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and update the values

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

#### Database (MySQL)

**Prerequisites**:
- MySQL 8.0+ installed
- MySQL Workbench (optional, for GUI management)

**Setup Steps**:
```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE project_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create a user for the application
CREATE USER 'project_user'@'localhost' IDENTIFIED BY 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON project_db.* TO 'project_user'@'localhost';
FLUSH PRIVILEGES;
```

**Configure Database in Django**:
Update your `.env` file with the database credentials.

#### Frontend (React)

**Prerequisites**:
- Node.js 18+
- npm or yarn

**Setup Steps**:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### Mobile (React Native)

**Prerequisites**:
- Node.js 18+
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

**Setup Steps**:
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# For iOS (macOS only)
cd ios
pod install
cd ..

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

---

## Development Process

### Issue Management

#### Issue Creation

- Use the appropriate issue template
- Provide a clear, descriptive title
- Include detailed description with acceptance criteria
- For bugs: Include reproduction steps, expected vs. actual behavior
- For features: Include user story and acceptance criteria
- Link to related issues where applicable

#### Issue Categorization

We use a structured labeling system to categorize and prioritize issues:

**Type Labels**
- `enhancement` - New features or requests
- `bug` - Bug fixes
- `documentation` - Documentation changes
- `review` - Only for review tasks
- `meeting` - Meeting-related items
- `duplicate` - Duplicate issues
- `invalid` - Invalid issues
- `wontfix` - Issues that won't be fixed

**Priority Labels**
- `priority: high` - High priority issues
- `priority: medium` - Medium priority issues
- `priority: low` - Low priority issues

**Component Labels**
- `backend` - Backend-related issues
- `frontend` - Frontend-related issues
- `mobile` - Mobile-related issues
- `design` - Design-related issues

**Status Labels**
- `status: not started` - Issue hasn't been started yet
- `status: in progress` - Issue is being worked on
- `status: review` - Issue needs review
- `status: completed` - Issue has been completed

**Additional Labels**
- `help wanted` - Extra assistance is needed
- `question` - Issue requires further clarification

### Branch Management

#### Branch Naming Convention

| Branch Prefix | Purpose | Example |
|---------------|---------|---------|
| `feature/` | New features | `feature/42-user-authentication` |
| `bugfix/` | Bug fixes | `bugfix/57-fix-login-redirect` |
| `refactor/` | Code refactoring | `refactor/23-optimize-database-queries` |
| `docs/` | Documentation updates | `docs/15-api-documentation` |
| `test/` | Test-related changes | `test/31-increase-coverage` |

**Format**: `prefix/[issue-number]-[short-description]`

### Pull Request Workflow

#### Creating Pull Requests

1. **Create** a PR from your feature branch to the main branch
2. **Select the appropriate PR template** based on your change type:
   - Feature Implementation
   - Bug Fix
   - Documentation Update
   - Design Change
   - Refactoring

Our PR templates will guide you through providing all necessary information, including:
- ✅ Summary of changes
- 🔗 Link to relevant issue(s)
- 📝 Deployment notes (if applicable)
- 📸 Screenshots (for UI changes)
- 🧪 Testing instructions

#### PR Labeling

Apply appropriate labels to your PR based on our labeling system:

**Component Labels**
- `backend` - Backend-related changes
- `frontend` - Frontend-related changes
- `mobile` - Mobile app changes
- `documentation` - Documentation updates
- `design` - UI/UX design changes

**Type Labels**
- `enhancement` - New features or requests
- `bug` - Bug fixes

**Priority Labels**
- `priority: high` - High priority changes
- `priority: medium` - Medium priority changes
- `priority: low` - Low priority changes

**Status Labels**
- `status: in progress` - Work in progress
- `status: review` - Ready for review
- `status: completed` - Approved and ready to merge

**Additional Labels**
- `help wanted` - Extra attention needed
- `question` - PR contains questions that need answers

#### PR Requirements

- ✅ All automated tests must pass
- 🚫 No merge conflicts
- 👥 At least 2 team member approvals required
- 🎯 PR scope should focus on a single issue/feature
- 💬 All review comments must be resolved before merging

#### PR Review Process

1. **Assign reviewers** to your PR from relevant teams
2. **Wait for CI checks** to complete
3. **Address feedback** from reviewers promptly
4. **Update the PR status label** as you progress through the review
5. **Request re-review** after addressing all feedback

#### Post-Merge Actions

- 🗑️ Delete the branch after successful merge
- 📋 Update the related issue status to `status: completed`
- 📝 Document any necessary follow-ups as new issues

### Code Review Process

#### Review Checklist

- [ ] Code functions as intended
- [ ] Follows project coding standards
- [ ] Handles edge cases appropriately
- [ ] Includes proper error handling
- [ ] Has sufficient test coverage
- [ ] Documentation is complete and accurate
- [ ] No security vulnerabilities introduced

---

## Project Standards

### Code Style Guidelines

#### Python/Django
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use Django's coding style for Django-specific code
- Maximum line length: 88 characters (using Black formatter)
- Use 4 spaces for indentation
- Run `black` and `flake8` before committing

#### JavaScript/React/React Native
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ES6+ features where appropriate
- Use 2 spaces for indentation
- Use semi-colons at the end of statements
- Use JSX for React components
- Prefer functional components with hooks over class components
- Run ESLint before committing

#### SQL
- Use UPPERCASE for SQL keywords
- Use snake_case for table and column names
- Include comments for complex queries

### Documentation Standards

#### Code Documentation
- **Python**: Use docstrings for modules, classes, and functions
- **JavaScript**: Use JSDoc comments for functions and components
- **All languages**: Comment complex logic or non-obvious code

#### API Documentation
Each API endpoint should document:
- URL path and HTTP method
- Request parameters/body schema
- Response format and schema
- Possible error codes and messages
- Authentication requirements

#### Component Documentation
- Document React components with prop types and descriptions
- Include usage examples for reusable components

#### README Updates
- Update README.md for new features or workflow changes
- Keep installation instructions current

### Testing Requirements

#### Backend Testing
- Unit tests for models, services, and utility functions
- Integration tests for API endpoints
- Use pytest as the testing framework
- Aim for >80% code coverage

#### Frontend Testing
- Unit tests for utility functions and hooks
- Component tests for React components
- Integration tests for key user flows
- Use Jest and React Testing Library

#### Mobile Testing
- Component and integration tests
- Platform-specific tests for Android and iOS features

#### General Testing Rules
- New features require accompanying tests
- Bug fixes must include tests that verify the fix
- Tests must pass before PR approval