# Quick Start Guide

## Installation & Setup (5 Minutes)

### 1. Install Dependencies

```bash
cd tutoring-tool
npm run install-all
```

This will install all dependencies for backend, gateway, and frontend.

### 2. Setup Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:
- `JWT_SECRET` - Any random string for production
- `OPENAI_API_KEY` - Your OpenAI API key (optional, but needed for AI ranking)

**Gateway:**
```bash
cd ../gateway
cp .env.example .env
```

No changes needed unless you want to use different ports.

### 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Run the Application

Open 3 terminal windows and run:

**Terminal 1:**
```bash
cd tutoring-tool/backend
npm run dev
```

**Terminal 2:**
```bash
cd tutoring-tool/gateway
npm run dev
```

**Terminal 3:**
```bash
cd tutoring-tool/frontend
npm run dev
```

### 5. Access the App

Open your browser and go to: **http://localhost:3000**

## First Time Usage

### Create Test Accounts

**Tutor Account:**
1. Click "Register"
2. Fill in details
3. Select "Tutor" role
4. Submit

**Student Account:**
1. Logout (if logged in as tutor)
2. Click "Register"
3. Fill in details
4. Select "Student" role
5. Submit

**Admin Account:**
You need to manually create an admin in MongoDB:

```bash
mongosh
use tutoring-tool

db.users.updateOne(
  { email: "admin@example.com" },
  {
    $set: {
      role: "admin",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      password: "$2a$10$..." // Use a hashed password
    }
  },
  { upsert: true }
)
```

Or register as a student and manually change the role in MongoDB.

### Test the System

**As Tutor:**
1. Login with tutor account
2. Click "Create New Space"
3. Fill in space details (set start time to now, end time to 1 hour from now)
4. Note the Space Code displayed with QR code

**As Student:**
1. Login with student account
2. Enter the Space Code in "Join a Space"
3. Click Join
4. Select the space from sidebar
5. Test posting questions:
   - Try **Text** mode
   - Try **Image (OCR)** mode (upload an image with text)
   - Try **Voice** mode (speak a question)

**As Tutor (continued):**
1. View the student's questions
2. Click "Answer Question" on a post
3. Type a response and submit
4. Check statistics and knowledge summary

**As Admin:**
1. Wait for the space to expire OR manually archive it as tutor
2. Login with admin account
3. View archived sessions
4. Click on a session to see details

## Features Demonstration

### Multi-Modal Input Testing

**Text Input:**
- Just type a question normally

**OCR Input:**
1. Take a photo of handwritten or printed text
2. Click the "Image (OCR)" mode
3. Upload the image
4. Wait for text extraction
5. Edit if needed and post

**Voice Input:**
1. Click "Voice" mode
2. Click "Start Recording"
3. Speak your question clearly
4. Click "Stop Recording"
5. Review the transcribed text
6. Post the question

### AI Difficulty Ranking

- After posting a question, wait a few seconds
- The system will automatically analyze and assign:
  - Difficulty level (Easy, Medium, Hard, Very Hard)
  - Difficulty score (0-100)
  - Knowledge points (topics and concepts)

### QR Code Access

1. As tutor, create a space
2. The QR code is displayed automatically
3. Students can scan it with their phone to get the space code
4. (Note: Full QR scanning requires the app to be deployed on HTTPS)

### Automatic Archiving

1. Create a space with end time in the past
2. Wait 5 minutes (archiving runs every 5 minutes)
3. The space will automatically be archived
4. Check admin dashboard to see archived session

### Knowledge Point Summary

1. Have students post several questions on different topics
2. Wait for AI analysis to complete
3. As tutor, view the Knowledge Summary section
4. It shows aggregated topics and concepts from all questions

## Common Issues

**Port already in use:**
```bash
# Change ports in .env files
# Backend: PORT=5001
# Gateway: PORT=4001
# Frontend: vite.config.ts -> server.port: 3001
```

**MongoDB not running:**
```bash
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
net start MongoDB                      # Windows
```

**AI ranking not working:**
- Check OPENAI_API_KEY in backend/.env
- Verify OpenAI account has credits
- System will use default ranking if AI fails

**OCR not working:**
- Ensure image is clear and has visible text
- Try with different image formats (JPG, PNG)
- Check browser console for errors

**Voice recognition not working:**
- Use Chrome, Edge, or Safari (best support)
- Allow microphone permissions
- Speak clearly and in English

## Next Steps

1. **Customize the UI**: Edit CSS files in frontend/src/components/
2. **Add more AI features**: Modify backend/src/services/AIRankingService.ts
3. **Implement notifications**: Add WebSocket support for real-time updates
4. **Deploy**: Use services like Heroku, AWS, or Vercel

## Support

For issues or questions:
1. Check the main README.md
2. Review error messages in browser console and terminal
3. Verify all services are running correctly

Enjoy using the Tutoring Tool!
