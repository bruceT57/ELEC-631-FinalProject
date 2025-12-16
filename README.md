# Tutoring Tool - Online Discussion Platform

A comprehensive online tutoring platform that enables real-time Q&A sessions between students and tutors with AI-powered difficulty ranking, multi-modal input support (text, image OCR, voice), and automatic session archiving.

## Features

### Core Features
- **Virtual Discussion Spaces**: Tutors create spaces with unique QR codes for easy student access
- **Multi-Modal Question Input**: Students can ask questions via:
  - Text typing
  - Image upload with OCR (Optical Character Recognition)
  - Voice recording with speech-to-text
- **AI-Powered Difficulty Ranking**: Automatic question difficulty assessment using OpenAI
- **Knowledge Point Extraction**: AI identifies and categorizes topics from questions
- **Real-Time Q&A**: Students post questions, tutors provide answers
- **Automatic Archiving**: Sessions automatically archive after their time slot expires
- **Role-Based Access**: Separate interfaces for Students, Tutors, and Administrators
- **User Authentication**: Secure login and registration system

### User Roles

#### Student
- Join virtual spaces using QR code or space code
- Post questions with multiple input methods
- View all questions ranked by difficulty
- See tutor responses
- Track personal question history

#### Tutor
- Create and manage virtual discussion spaces
- Generate QR codes for student access
- View questions sorted by AI-ranked difficulty
- Answer student questions
- Access knowledge point summaries
- View session statistics
- Manually archive sessions

#### Administrator
- View all archived sessions
- Access comprehensive session statistics
- Review past Q&A interactions
- Monitor platform usage

## Architecture

The system follows a three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  - Student UI  - Tutor UI  - Admin UI  - Authentication     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    API Gateway (Express)                     │
│  - Rate Limiting  - Request Routing  - CORS Handling        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Backend (Node.js/Express)               │
│  - Authentication Service  - Virtual Space Service           │
│  - Post Service  - AI Ranking Service  - Archiving Service  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Database (MongoDB)                      │
│  - Users  - VirtualSpaces  - Posts  - Sessions              │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **QR Code Generation**: qrcode library
- **AI Integration**: OpenAI API (GPT-3.5-turbo)
- **Scheduling**: node-schedule (for auto-archiving)

### API Gateway
- **Framework**: Express.js with TypeScript
- **Proxy**: http-proxy-middleware
- **Rate Limiting**: express-rate-limit
- **Security**: CORS enabled

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **OCR**: Tesseract.js
- **Speech Recognition**: Web Speech API
- **QR Code Display**: qrcode.react

## Object-Oriented Design

All code follows OOP principles:

### Backend Services (Singleton Pattern)
```typescript
class AuthService {
  public async register(data: IRegistrationData): Promise<...>
  public async login(email: string, password: string): Promise<...>
  public generateToken(user: IUser): string
  public verifyToken(token: string): ITokenPayload
}

class VirtualSpaceService {
  private generateSpaceCode(): string
  private async generateQRCode(spaceCode: string): Promise<string>
  public async createSpace(data: IVirtualSpaceData): Promise<...>
  public async joinSpace(spaceCode: string, studentId: string): Promise<...>
}

class AIRankingService {
  public async analyzeQuestion(question: string): Promise<IAIAnalysisResult>
  private buildAnalysisPrompt(question: string): string
  private normalizeAnalysisResult(result: any): IAIAnalysisResult
}
```

### Database Models (Mongoose Schemas)
```typescript
class User extends Document {
  comparePassword(candidatePassword: string): Promise<boolean>
  getPublicProfile(): object
}

class VirtualSpace extends Document {
  isExpired(): boolean
  addParticipant(userId: ObjectId): void
}

class Post extends Document {
  markAsAnswered(tutorId: ObjectId, response: string): void
  updateDifficultyRanking(level: DifficultyLevel, score: number): void
}
```

<<<<<<< HEAD
=======
## Quick Links

- **[Local Development Setup](#setup-instructions)** - Run locally on your machine
- **[Namecheap Deployment Guide](NAMECHEAP_DEPLOYMENT.md)** - Deploy to Namecheap Stellar hosting
- **[MongoDB Atlas Setup](MONGODB_ATLAS_SETUP.md)** - Cloud database setup
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment checklist
- **[Quick Start Guide](QUICKSTART.md)** - 5-minute local setup

>>>>>>> ai_feature_clean
## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- OpenAI API key (for AI ranking features)

### 1. Clone and Install

```bash
# Navigate to the project directory
cd tutoring-tool

# Install backend dependencies
cd backend
npm install

# Install gateway dependencies
cd ../gateway
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tutoring-tool
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=development
GATEWAY_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

#### Gateway (.env)
```bash
cd ../gateway
cp .env.example .env
```

Edit `gateway/.env`:
```env
PORT=4000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Start the Application

Open three terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Gateway:**
```bash
cd gateway
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Backend**: http://localhost:5000

## Usage Guide

### For Students

1. **Register/Login**
   - Navigate to http://localhost:3000
   - Click "Register" and create a student account
   - Login with your credentials

2. **Join a Virtual Space**
   - Get the space code from your tutor (or scan QR code)
   - Enter the code in the "Join a Space" section
   - Click "Join"

3. **Ask Questions**
   - Select a joined space from the sidebar
   - Choose input method:
     - **Text**: Type your question directly
     - **Image (OCR)**: Upload an image of written text
     - **Voice**: Click "Start Recording" and speak your question
   - Optionally attach supporting images
   - Click "Post Question"

4. **View Responses**
   - Questions are displayed sorted by difficulty
   - Tutor responses appear below each question
   - AI-identified knowledge points are shown as tags

### For Tutors

1. **Create a Virtual Space**
   - Login as a tutor
   - Click "Create New Space"
   - Fill in:
     - Space name
     - Description
     - Start and end times
   - Click "Create Space"

2. **Share Access**
   - A unique QR code is generated automatically
   - Share the QR code or space code with students
   - Students can scan or enter the code to join

3. **Answer Questions**
   - Select a space from your list
   - View questions sorted by AI-ranked difficulty
   - Click "Answer Question" on any post
   - Type your response and submit

4. **Monitor Session**
   - View real-time statistics:
     - Total questions
     - Answered/Unanswered counts
     - Average difficulty score
   - Review knowledge point summary
   - See participant list

### For Administrators

1. **View Archived Sessions**
   - Login as admin
   - Browse list of archived sessions
   - Click on any session to view details

2. **Review Session Data**
   - See comprehensive statistics
   - Review all Q&A interactions
   - Access participant information
   - View difficulty distribution

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Virtual Spaces
- `POST /api/spaces` - Create space (tutor only)
- `GET /api/spaces/code/:code` - Get space by code
- `POST /api/spaces/join/:code` - Join space (student)
- `GET /api/spaces/tutor` - Get tutor's spaces
- `GET /api/spaces/student` - Get student's spaces
- `GET /api/spaces/:id` - Get space details
- `PUT /api/spaces/:id/status` - Update space status
- `DELETE /api/spaces/:id` - Delete space

### Posts
- `POST /api/posts` - Create post (with file upload)
- `GET /api/posts/space/:spaceId` - Get posts by space
- `GET /api/posts/student` - Get student's posts
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id/answer` - Answer post (tutor only)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/space/:spaceId/unanswered` - Get unanswered posts
- `GET /api/posts/space/:spaceId/knowledge-summary` - Get knowledge summary
- `GET /api/posts/space/:spaceId/statistics` - Get statistics

### Archives
- `GET /api/archives` - Get archived spaces
- `GET /api/archives/:sessionId` - Get archive details
- `POST /api/archives/manual/:spaceId` - Manually archive space
- `POST /api/archives/trigger` - Trigger auto-archive (admin only)

## Project Structure

```
tutoring-tool/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── gateway/
│   ├── src/
│   │   ├── config/          # Gateway configuration
│   │   ├── middleware/      # Rate limiting, etc.
│   │   └── index.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── common/      # Shared components
│   │   │   ├── student/     # Student interface
│   │   │   └── tutor/       # Tutor interface
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Development

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Gateway:**
```bash
cd gateway
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Testing

Run tests (when implemented):
```bash
npm test
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation
- Role-based access control
- Secure session management

## Performance Optimizations

- MongoDB indexing on frequently queried fields
- Background AI analysis (non-blocking)
- Efficient archiving scheduler (runs every 5 minutes)
- Request rate limiting to prevent abuse
- Optimized database queries with population

<<<<<<< HEAD
=======
## Deployment

The Tutoring Tool can be deployed to various hosting platforms. Complete deployment guides are available:

### Namecheap Stellar Hosting

For deployment to Namecheap Stellar shared hosting with cPanel:

1. **Read the deployment guide**: [NAMECHEAP_DEPLOYMENT.md](NAMECHEAP_DEPLOYMENT.md)
2. **Setup MongoDB Atlas**: [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)
3. **Follow the checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Quick Deployment Steps:**

```bash
# 1. Prepare deployment files
npm run deploy:prepare

# On Windows:
deploy-prepare.bat

# On Mac/Linux:
./deploy-prepare.sh

# 2. Configure environment
cp .env.production .env
# Edit .env with your MongoDB Atlas connection string and other settings

# 3. Test locally
npm run start:production

# 4. Upload to Namecheap via cPanel File Manager or FTP
# 5. Setup Node.js app in cPanel (see full guide)
```

### Other Platforms

The application can also be deployed to:
- **Heroku**: Use the production-server.js as entry point
- **AWS EC2/Elastic Beanstalk**: Deploy as Node.js application
- **DigitalOcean**: Use Node.js droplet
- **Vercel/Netlify**: Frontend only (requires separate backend hosting)
- **Docker**: Create container with production-server.js

For all platforms:
1. Use MongoDB Atlas for database
2. Set environment variables (see `.env.production`)
3. Build: `npm run build:production`
4. Start: `npm run start:production`

>>>>>>> ai_feature_clean
## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If not running, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port Already in Use
```bash
# Find and kill process using port 3000, 4000, or 5000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### OpenAI API Issues
- Verify API key is correctly set in `backend/.env`
- Check OpenAI account has available credits
- System will use default difficulty rankings if AI is unavailable

## License

MIT License - Feel free to use this project for educational purposes.

## Contributors

Built with modern web technologies and best practices in software engineering.
