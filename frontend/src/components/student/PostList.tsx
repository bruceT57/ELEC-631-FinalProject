import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import apiService from '../../services/api';
import PostItem from './PostItem';

interface PostListProps {
  spaceId: string;
  isStudent: boolean;
  refreshTrigger?: number;
  spaceTutorId?: string;
}

const PostList: React.FC<PostListProps> = ({ spaceId, isStudent, refreshTrigger, spaceTutorId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'difficulty' | 'time'>('difficulty');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();

    // Auto-refresh posts every 5 seconds
    const intervalId = setInterval(() => {
      loadPosts(true); // Pass true to indicate background refresh (silent)
    }, 5000);

    return () => clearInterval(intervalId);
  }, [spaceId, sortBy, refreshTrigger]);

  const loadPosts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const { posts } = await apiService.getPostsBySpace(spaceId, sortBy);
      setPosts(posts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      if (!isBackground) setLoading(false);
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
        <div className="posts-container">
          {posts.map((post) => (
            <div key={post._id} className="post-wrapper">
              <PostItem 
                post={post} 
                onUpdate={() => loadPosts(true)} 
                spaceTutorId={spaceTutorId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;
