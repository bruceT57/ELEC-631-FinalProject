import React, { useState, useEffect } from 'react';
import { Post, DifficultyLevel } from '../../types';
import apiService from '../../services/api';

interface PostListProps {
  spaceId: string;
  isStudent: boolean;
  sessionToken?: string; // For anonymous students
  participantId?: string; // For student comments
  onPostsUpdate?: () => void; // Callback for statistics refresh
}

const PostList: React.FC<PostListProps> = ({ spaceId, isStudent, participantId, onPostsUpdate }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'difficulty' | 'time'>('difficulty');
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [tutorResponse, setTutorResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Student comment state
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [postId: string]: boolean }>({});

  useEffect(() => {
    loadPosts();

    // Set up polling for new posts every 5 seconds
    const intervalId = setInterval(() => {
      loadPosts(false); // Pass false to skip loading spinner on background updates
    }, 5000);

    return () => clearInterval(intervalId);
  }, [spaceId, sortBy]);

  const loadPosts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { posts } = await apiService.getPostsBySpace(spaceId, sortBy);
      setPosts(posts);

      // Trigger callback for statistics refresh
      if (onPostsUpdate) {
        onPostsUpdate();
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAnswerPost = async (postId: string) => {
    if (!tutorResponse.trim()) return;

    setSubmitting(true);
    try {
      await apiService.answerPost(postId, tutorResponse);
      setTutorResponse('');
      setSelectedPost(null);
      await loadPosts();
    } catch (err) {
      console.error('Failed to answer post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const comment = commentText[postId]?.trim();
    if (!comment || !participantId) return;

    setSubmittingComment({ ...submittingComment, [postId]: true });
    try {
      await apiService.addStudentComment(postId, participantId, comment);
      setCommentText({ ...commentText, [postId]: '' });
      await loadPosts(false); // Reload without spinner
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment({ ...submittingComment, [postId]: false });
    }
  };

  const getDifficultyColor = (level: DifficultyLevel): string => {
    switch (level) {
      case DifficultyLevel.EASY:
        return '#4caf50';
      case DifficultyLevel.MEDIUM:
        return '#ff9800';
      case DifficultyLevel.HARD:
        return '#f44336';
      case DifficultyLevel.VERY_HARD:
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  return (
    <div className="post-list">
      <div className="post-list-header">
        <h3>Questions</h3>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="difficulty">Sort by Difficulty</option>
          <option value="time">Sort by Time</option>
        </select>
      </div>

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="empty-state">No questions posted yet</p>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="post-card">
            <div className="post-header">
              <div className="post-author">
                <strong>
                  {post.studentNickname || (typeof post.studentId !== 'string' ? `${post.studentId.firstName} ${post.studentId.lastName}` : 'Student')}
                </strong>
                <span className="post-time">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="post-meta">
                <span
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(post.difficultyLevel) }}
                >
                  {post.difficultyLevel} ({post.difficultyScore})
                </span>
                <span className="input-type-badge">{post.inputType}</span>
              </div>
            </div>

            <div className="post-content">
              <p>{post.question}</p>
              {post.mediaAttachments.length > 0 && (
                <div className="attachments">
                  {post.mediaAttachments.map((attachment, idx) => (
                    <img
                      key={idx}
                      src={attachment.url}
                      alt={attachment.originalName}
                      className="attachment-preview"
                    />
                  ))}
                </div>
              )}
            </div>

            {post.knowledgePoints.length > 0 && (
              <div className="knowledge-points">
                <strong>Topics:</strong>
                {post.knowledgePoints.map((kp, idx) => (
                  <span key={idx} className="knowledge-tag">
                    {kp.topic}: {kp.concept}
                  </span>
                ))}
              </div>
            )}

            {!isStudent && post.aiHint && (
              <div className="ai-hint-box" style={{ 
                backgroundColor: '#f0f7ff', 
                padding: '15px', 
                margin: '10px 0', 
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3',
                fontSize: '0.95em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#1565c0', display: 'block', marginBottom: '5px' }}>💡 AI Hint for Tutor:</strong>
                  <p style={{ margin: 0, lineHeight: '1.5' }}>{post.aiHint}</p>
                </div>
                
                {post.keyConceptsDefinitions && post.keyConceptsDefinitions.length > 0 && (
                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #e3f2fd' }}>
                    <strong style={{ color: '#1565c0', display: 'block', marginBottom: '8px' }}>📚 Key Concepts:</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                      {post.keyConceptsDefinitions.map((def, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>
                          <strong>{def.term}:</strong> <span style={{ color: '#546e7a' }}>{def.definition}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {post.isAnswered ? (
              <div className="tutor-response">
                <strong>Tutor Response:</strong>
                <p>{post.tutorResponse}</p>
                <span className="answered-time">
                  Answered {new Date(post.answeredAt!).toLocaleString()}
                </span>
              </div>
            ) : !isStudent ? (
              <div className="answer-section">
                {selectedPost?._id === post._id ? (
                  <>
                    <textarea
                      value={tutorResponse}
                      onChange={(e) => setTutorResponse(e.target.value)}
                      placeholder="Your response..."
                      rows={4}
                    />
                    <div className="answer-actions">
                      <button
                        onClick={() => handleAnswerPost(post._id)}
                        disabled={submitting}
                        className="btn-primary"
                      >
                        {submitting ? 'Submitting...' : 'Submit Answer'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPost(null);
                          setTutorResponse('');
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="btn-primary"
                  >
                    Answer Question
                  </button>
                )}
              </div>
            ) : (
              <div className="unanswered-badge">Waiting for tutor response...</div>
            )}

            {/* Student Comments Section - Visible to EVERYONE (students, tutors, admins) */}
            {post.studentComments && post.studentComments.length > 0 && (
              <div className="student-comments-section">
                <h4>Student Responses:</h4>
                {post.studentComments.map((comment, idx) => (
                  <div key={idx} className="student-comment">
                    <div className="comment-header">
                      <strong>{comment.nickname}</strong>
                      <span className="comment-time">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Section - ONLY for Students */}
            {isStudent && participantId && (
              <div className="add-comment-section">
                <textarea
                  value={commentText[post._id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                  placeholder="Share your thoughts or help with this question..."
                  rows={2}
                  className="comment-textarea"
                />
                <button
                  onClick={() => handleAddComment(post._id)}
                  disabled={submittingComment[post._id] || !commentText[post._id]?.trim()}
                  className="btn-secondary btn-comment"
                >
                  {submittingComment[post._id] ? 'Posting...' : 'Add Response'}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PostList;
