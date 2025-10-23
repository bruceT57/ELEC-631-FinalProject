import React, { useState, useEffect } from 'react';
import { Post, DifficultyLevel } from '../../types';
import apiService from '../../services/api';

interface PostListProps {
  spaceId: string;
  isStudent: boolean;
}

const PostList: React.FC<PostListProps> = ({ spaceId, isStudent }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'difficulty' | 'time'>('difficulty');
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [tutorResponse, setTutorResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [spaceId, sortBy]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { posts } = await apiService.getPostsBySpace(spaceId, sortBy);
      setPosts(posts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
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
                  {post.studentId.firstName} {post.studentId.lastName}
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
          </div>
        ))
      )}
    </div>
  );
};

export default PostList;
