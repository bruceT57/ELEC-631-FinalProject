import { Router } from 'express';
import multer from 'multer';
import PostController from '../controllers/PostController';
import AuthMiddleware from '../middleware/auth';
import { UserRole } from '../models';
import path from 'path';

const router = Router();

/**
 * Configure multer for file uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

/**
 * Post Routes
 */

// Optional authentication middleware - allows both authenticated and anonymous requests
const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Has auth token, use normal authentication
    return AuthMiddleware.authenticate(req, res, next);
  }
  // No auth token, continue without setting req.user
  next();
};

// POST /api/posts - Create new post (supports both authenticated and anonymous)
router.post(
  '/',
  optionalAuth,
  upload.array('attachments', 5),
  PostController.createPost
);

// GET /api/posts/space/:spaceId - Get posts by space (accessible to anonymous students)
router.get('/space/:spaceId', optionalAuth, PostController.getPostsBySpace);

// GET /api/posts/student - Get student's posts
router.get(
  '/student',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.STUDENT),
  PostController.getStudentPosts
);

// GET /api/posts/:id - Get post by ID
router.get('/:id', AuthMiddleware.authenticate, PostController.getPostById);

// PUT /api/posts/:id/answer - Answer a post (Tutor only)
router.put(
  '/:id/answer',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  PostController.answerPost
);

// PUT /api/posts/:id - Update post
router.put('/:id', AuthMiddleware.authenticate, PostController.updatePost);

// DELETE /api/posts/:id - Delete post
router.delete('/:id', AuthMiddleware.authenticate, PostController.deletePost);

// GET /api/posts/space/:spaceId/unanswered - Get unanswered posts
router.get(
  '/space/:spaceId/unanswered',
  AuthMiddleware.authenticate,
  PostController.getUnansweredPosts
);

// GET /api/posts/space/:spaceId/knowledge-summary - Get knowledge summary
router.get(
  '/space/:spaceId/knowledge-summary',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.TUTOR, UserRole.ADMIN),
  PostController.getKnowledgeSummary
);

// GET /api/posts/space/:spaceId/statistics - Get post statistics
router.get(
  '/space/:spaceId/statistics',
  AuthMiddleware.authenticate,
  PostController.getStatistics
);

export default router;
