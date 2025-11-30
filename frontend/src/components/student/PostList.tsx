import React, { useState, useEffect } from 'react';
import { Post, DifficultyLevel } from '../../types';
import apiService from '../../services/api';

interface PostListProps {
  spaceId: string;
  isStudent: boolean;
  sessionToken?: string; // For anonymous students
  participantId?: string; // For anonymous students
  onPostsUpdate?: () => void; // Callback when posts are updated
}

const PostList: React.FC<PostListProps> = ({ spaceId, isStudent, sessionToken, participantId, onPostsUpdate }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'difficulty' | 'time'>('difficulty');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [tutorResponse, setTutorResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null); // Post ID being commented on
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadPosts();

    // Auto-refresh every 5 seconds
    const intervalId = setInterval(() => {
      loadPosts(false); // Silent refresh without loading indicator
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [spaceId, sortBy]);

  const loadPosts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { posts } = await apiService.getPostsBySpace(spaceId, sortBy);
      setPosts(posts);
      if (initialLoad) setInitialLoad(false);

      // Trigger callback to update statistics in parent component
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
    if (!commentText.trim() || !participantId || !sessionToken) return;

    setSubmitting(true);
    try {
      await apiService.addStudentComment(postId, commentText.trim(), participantId, sessionToken);
      setCommentText('');
      setCommentingOn(null);
      await loadPosts(false); // Refresh posts silently
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
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
                  {post.studentNickname}
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

            {/* Student Comments Section */}
            {post.studentComments && post.studentComments.length > 0 && (
              <div className="student-comments">
                <strong>Student Responses ({post.studentComments.length}):</strong>
                {post.studentComments.map((comment, idx) => (
                  <div key={idx} className="student-comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.studentNickname}</span>
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Section (Only for students) */}
            {isStudent && participantId && sessionToken && (
              <div className="add-comment-section">
                {commentingOn === post._id ? (
                  <>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add your response to help this student..."
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="comment-actions">
                      <button
                        onClick={() => handleAddComment(post._id)}
                        disabled={submitting || !commentText.trim()}
                        className="btn-primary btn-small"
                      >
                        {submitting ? 'Posting...' : 'Post Response'}
                      </button>
                      <button
                        onClick={() => {
                          setCommentingOn(null);
                          setCommentText('');
                        }}
                        className="btn-secondary btn-small"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setCommentingOn(post._id)}
                    className="btn-secondary btn-small"
                  >
                    💬 Respond to this question
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PostList;
