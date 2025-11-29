# Student Anonymous Access - Implementation Changes

## Overview

This document outlines the major architectural changes to convert the tutoring tool from requiring student accounts to allowing anonymous student participation via QR codes with just nickname and email.

---

## Changes Made So Far

### 1. Backend Models

#### **NEW: StudentParticipant Model** (`backend/src/models/StudentParticipant.ts`)
- Created new model for anonymous students
- Fields:
  - `spaceId`: Reference to VirtualSpace
  - `nickname`: Student's display name
  - `email`: Student's email
  - `sessionToken`: Temporary session token for this space
  - `joinedAt`, `createdAt`, `updatedAt`: Timestamps
- Compound index on `spaceId` + `email` for uniqueness per space

#### **UPDATED: Post Model** (`backend/src/models/Post.ts`)
- Changed `studentId` reference from `User` to `StudentParticipant`
- Added `studentNickname` field (denormalized for performance)
- Posts now linked to anonymous participants instead of authenticated users

#### **UPDATED: Models Index** (`backend/src/models/index.ts`)
- Added export for `StudentParticipant` and `IStudentParticipant`

### 2. Frontend Components

#### **NEW: StudentJoin Component** (`frontend/src/components/student/StudentJoin.tsx`)
- Replaces the authenticated student dashboard
- Anonymous students visit `/join/:spaceCode` via QR code
- Features:
  - Simple form: nickname + email only
  - No authentication required
  - Session stored in `sessionStorage` per space
  - After joining, shows question posting interface
  - Can post questions and view all questions in the session
  - "Leave Session" button to clear local session

#### **UPDATED: CreatePost Component** (`frontend/src/components/student/CreatePost.tsx`)
- Added optional props: `participantId` and `sessionToken`
- Modified to work with both authenticated tutors and anonymous students
- Includes participant info in FormData when posting anonymously

#### **UPDATED: App Routes** (`frontend/src/App.tsx`)
- Removed `StudentDashboard` import and route
- Changed `/join/:spaceCode` to use `StudentJoin` (anonymous, no auth required)
- Removed student role from home page redirect logic
- Only Tutor and Admin roles now have authenticated dashboards

### 3. Frontend Services

#### **UPDATED: API Service** (`frontend/src/services/api.ts`)
- Added `joinSpaceAnonymous(code, {nickname, email})` method
- Returns `{participantId, sessionToken, space}`

---

## Changes Still Required

### 4. Backend Controllers

#### **NEED TO CREATE: Anonymous Join Method** in `VirtualSpaceController.ts`
```typescript
public async joinSpaceAnonymous(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const { nickname, email } = req.body;

    // Validate inputs
    if (!nickname || !email) {
      res.status(400).json({ error: 'Nickname and email are required' });
      return;
    }

    // Find space by code
    const space = await VirtualSpaceService.getSpaceByCode(code);
    if (!space) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }

    // Check if space is active
    if (space.status !== 'active') {
      res.status(400).json({ error: 'This session is not currently active' });
      return;
    }

    // Create or find participant
    const StudentParticipant = (await import('../models/StudentParticipant')).default;
    const crypto = require('crypto');

    let participant = await StudentParticipant.findOne({
      spaceId: space._id,
      email: email.toLowerCase().trim()
    });

    if (participant) {
      // Update nickname if changed
      participant.nickname = nickname.trim();
      await participant.save();
    } else {
      // Create new participant
      const sessionToken = crypto.randomBytes(32).toString('hex');
      participant = await StudentParticipant.create({
        spaceId: space._id,
        nickname: nickname.trim(),
        email: email.toLowerCase().trim(),
        sessionToken
      });
    }

    res.status(200).json({
      participantId: participant._id,
      sessionToken: participant.sessionToken,
      space
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to join space'
    });
  }
}
```

### 5. Backend Routes

#### **NEED TO UPDATE: `backend/src/routes/spaces.ts`**
Add route for anonymous joining:
```typescript
// POST /api/spaces/join-anonymous/:code - Join anonymously (no auth)
router.post('/join-anonymous/:code', VirtualSpaceController.joinSpaceAnonymous);
```

Remove or deprecate the old authenticated student join route.

### 6. Backend Post Controller

#### **NEED TO UPDATE: PostController.ts**
Modify `createPost` to handle both:
1. Authenticated tutors (existing logic)
2. Anonymous students with `participantId` and `sessionToken`

```typescript
public async createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { spaceId, question, inputType, participantId, sessionToken } = req.body;

    let studentId, studentNickname;

    // Check if anonymous student
    if (participantId && sessionToken) {
      // Verify session token
      const StudentParticipant = (await import('../models/StudentParticipant')).default;
      const participant = await StudentParticipant.findOne({
        _id: participantId,
        sessionToken
      });

      if (!participant) {
        res.status(401).json({ error: 'Invalid session' });
        return;
      }

      studentId = participant._id;
      studentNickname = participant.nickname;
    } else if (req.user) {
      // Authenticated user
      studentId = req.user.userId;
      const User = (await import('../models/User')).default;
      const user = await User.findById(studentId);
      studentNickname = `${user?.firstName} ${user?.lastName}`;
    } else {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Create post with studentId and studentNickname
    // ... rest of post creation logic
  }
}
```

### 7. Admin Dashboard - User Management

#### **NEED TO CREATE: User Management Component** in `AdminDashboard.tsx`
Add section to admin dashboard for managing tutor and admin accounts:

```typescript
- List all users (Tutors and Admins)
- View user details
- Create new tutor/admin accounts
- Disable/enable accounts
- Reset passwords
- View user activity/statistics
```

**Features needed:**
- GET /api/admin/users - List all tutors and admins
- POST /api/admin/users - Create new user
- PUT /api/admin/users/:id - Update user
- DELETE /api/admin/users/:id - Delete user
- PUT /api/admin/users/:id/reset-password - Reset password

### 8. Remove Student-Related Code

#### **Files/Components to Remove:**
- `frontend/src/components/student/StudentDashboard.tsx`
- `frontend/src/components/common/JoinSpace.tsx` (old authenticated version)
- Backend routes for authenticated student operations

#### **Backend Routes to Remove/Update:**
- Remove: `GET /api/spaces/student` (get student's spaces)
- Remove: Student role authorization from various routes

### 9. Update PostList Component

#### **NEED TO UPDATE: `frontend/src/components/student/PostList.tsx`**
- Add prop to handle anonymous viewing
- Don't require authentication for viewing posts in a space
- Pass sessionToken for anonymous students

### 10. Database Migration Considerations

Since we're changing the Post model's `studentId` reference:
- Existing posts reference `User` model
- New posts will reference `StudentParticipant` model
- **Options:**
  1. Keep backward compatibility (accept both references)
  2. Migrate existing data
  3. Start fresh (if acceptable)

---

## Summary of Architecture

### Before:
- Students create accounts (username, password, email)
- Students login to dashboard
- Students join spaces from dashboard
- Students are full User documents

### After:
- Students visit QR code link directly (`/join/ABC123`)
- Students enter only nickname + email
- Students get temporary session token
- Students are lightweight StudentParticipant documents
- Only Tutors and Admins have full accounts

---

## Next Steps

1. ✅ Complete backend controller for anonymous join
2. ✅ Add anonymous join route
3. ✅ Update PostController for anonymous posting
4. ✅ Add user management to Admin dashboard
5. ✅ Test anonymous student flow end-to-end
6. ✅ Remove old student authentication code
7. ✅ Rebuild and deploy

---

## Testing Checklist

- [ ] Anonymous student can scan QR code
- [ ] Anonymous student can join with nickname + email
- [ ] Session persists in sessionStorage
- [ ] Anonymous student can post questions (text, OCR, voice)
- [ ] Anonymous student can view all questions in session
- [ ] Anonymous student can leave session
- [ ] Tutor can see anonymous student questions
- [ ] Tutor can answer anonymous student questions
- [ ] Admin can view archived sessions with anonymous students
- [ ] Admin can manage tutor/admin accounts
- [ ] Registration only allows Tutor and Admin roles

