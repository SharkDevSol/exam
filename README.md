# Web Exam System

A comprehensive web-based examination platform with three distinct portals: Admin, Teacher, and Student.

## Features

- **Admin Portal**: Manage subjects, bulk import students, view all results, and monitor exam passwords
- **Teacher Portal**: Create exams, manage questions, publish exams, and view subject results
- **Student Portal**: Take exams with randomized questions, auto-save answers, and view detailed results
- **PWA Support**: Student portal installable as a Progressive Web App
- **Secure Authentication**: Role-based access control with session persistence for admin/teacher and stateless JWT for students

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + CSS Modules
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 14+
- **Testing**: Jest + Vitest + Supertest + fast-check (property-based testing)
- **Deployment**: Nginx + PM2 on VPS

## Project Structure

```
web-exam-system/
├── api/                 # Backend API
│   ├── src/
│   ├── migrations/
│   ├── package.json
│   └── tsconfig.json
├── app/                 # Frontend React app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── package.json         # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SharkDevSol/exam.git
cd exam
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp api/.env.example api/.env
# Edit api/.env with your database credentials and secrets
```

4. Create database:
```bash
createdb exam_system
```

5. Run migrations:
```bash
npm run migrate --workspace=api
```

6. Start development servers:
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run frontend tests only
npm run test:app
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Deployment

### Quick Deployment (25-30 minutes)

See [QUICKSTART.md](QUICKSTART.md) for a fast deployment guide.

### Detailed Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions including:
- VPS setup and configuration
- Nginx and SSL setup
- PM2 process management
- Database backups
- Monitoring and maintenance
- Docker deployment (alternative)

### Deployment Files

- `ecosystem.config.js` - PM2 configuration
- `nginx/exam.skoolific.com.conf` - Nginx configuration
- `scripts/setup-vps.sh` - VPS initial setup
- `scripts/deploy.sh` - Application deployment
- `scripts/backup-db.sh` - Database backup
- `scripts/health-check.sh` - System health check
- `docker-compose.yml` - Docker deployment (optional)

### Production Environment

- **Domain**: exam.skoolific.com
- **VPS IP**: 76.13.48.245
- **GitHub**: https://github.com/SharkDevSol/exam.git

## Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:api          # Start backend only
npm run dev:app          # Start frontend only
```

### Production
```bash
npm run build            # Build both frontend and backend
npm run build:prod       # Build with production environment
npm run start:prod       # Start production server
```

### Deployment
```bash
./scripts/setup-vps.sh   # Initial VPS setup (run once)
./scripts/deploy.sh      # Deploy application updates
./scripts/backup-db.sh   # Backup database
./scripts/health-check.sh # Check system health
```

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick deployment guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment guide
- [scripts/README.md](scripts/README.md) - Deployment scripts documentation
- [.kiro/specs/web-exam-system/](..kiro/specs/web-exam-system/) - Full specification

## License

Private - All rights reserved
