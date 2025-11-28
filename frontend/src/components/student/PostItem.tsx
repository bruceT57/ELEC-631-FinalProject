import React, { useState, useRef } from 'react';
import { Post, DifficultyLevel, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

interface PostItemProps {
  post: Post;
  onUpdate: () => void;
  spaceTutorId?: string;
}

const PostItem: React.FC<PostItemProps> = ({ post, onUpdate, spaceTutorId }) => {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiService.toggleLike(post._id);
      onUpdate();
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleReplyLike = async (e: React.MouseEvent, replyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiService.toggleReplyLike(post._id, replyId);
      onUpdate();
    } catch (err) {
      console.error('Failed to like reply:', err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await apiService.addReply(post._id, replyContent);
      setReplyContent('');
      setShowReplyInput(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyToReply = (authorName: string) => {
    setReplyContent(`@${authorName} `);
    setShowReplyInput(true);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
  };

  const getDifficultyColor = (level: DifficultyLevel): string => {
    switch (level) {
      case DifficultyLevel.EASY: return '#4caf50';
      case DifficultyLevel.MEDIUM: return '#ff9800';
      case DifficultyLevel.HARD: return '#f44336';
      case DifficultyLevel.VERY_HARD: return '#9c27b0';
      default: return '#757575';
    }
  };

  const isLiked = post.likes?.includes(user?.id || '');

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <strong>{post.studentId?.firstName || 'Unknown'} {post.studentId?.lastName || 'User'}</strong>
          <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <div className="post-meta">
          <span className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(post.difficultyLevel) }}>
            {post.difficultyLevel} ({post.difficultyScore})
          </span>
          <span className="input-type-badge">{post.inputType}</span>
        </div>
      </div>

      <div className="post-content">
        <p>{post.question}</p>
        {post.originalText && post.originalText !== post.question && (
          <div className="original-text">
            <small>Original: {post.originalText}</small>
          </div>
        )}
        
        {post.mediaAttachments?.length > 0 && (
          <div className="attachments">
            {post.mediaAttachments.map((media, idx) => (
              <a key={idx} href={media.url} target="_blank" rel="noopener noreferrer">
                {media.type.startsWith('image/') ? (
                  <img src={media.url} alt="attachment" className="attachment-preview" />
                ) : (
                  <span>📎 {media.originalName}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button 
          type="button"
          className={`action-btn like-btn ${isLiked ? 'active' : ''}`} 
          onClick={handleLike}
        >
          {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
        </button>
        <button 
          type="button"
          className="action-btn reply-btn"
          onClick={() => setShowReplyInput(!showReplyInput)}
        >
          💬 Reply ({post.replies?.length || 0})
        </button>
      </div>

      {/* Discussion / Replies */}
      {post.replies?.length > 0 && (
        <div className="replies-section">
          {post.replies.map(reply => {
            // Check both id and _id to be robust against backend response variations
            const authorId = (reply.author as any)?._id || reply.author?.id;
            const isTutor = spaceTutorId && authorId && String(authorId) === String(spaceTutorId);
            
            return (
              <div key={reply._id} className={`reply-item ${isTutor ? 'tutor-reply' : ''}`}>
                <div className="reply-header">
                  <strong>{reply.author?.firstName || 'Unknown'} {reply.author?.lastName || 'User'}</strong>
                  <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
                  {isTutor && <span className="tutor-badge">Tutor</span>}
                </div>
                <p className="reply-content">{reply.content}</p>
                <div className="reply-actions">
                  <button 
                    type="button"
                    className={`like-btn-small ${reply.likes?.includes(user?.id || '') ? 'active' : ''}`}
                    onClick={(e) => handleReplyLike(e, reply._id)}
                  >
                    👍 {reply.likes?.length || 0}
                  </button>
                  <button 
                    type="button"
                    className="reply-btn-small"
                    onClick={() => handleReplyToReply(`${reply.author?.firstName || 'User'} ${reply.author?.lastName || ''}`)}
                  >
                    ↩ Reply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <form onSubmit={handleReply} className="reply-form">
          <textarea
            ref={replyInputRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting || !replyContent.trim()} className="btn-primary btn-sm">
            Reply
          </button>
        </form>
      )}
    </div>
  );
};

export default PostItem;
