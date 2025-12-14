import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { VirtualSpace } from '../../types';
import apiService from '../../services/api';
import PostList from '../student/PostList';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Tutor.css';

const TutorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [spaces, setSpaces] = useState<VirtualSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<VirtualSpace | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [knowledgeSummary, setKnowledgeSummary] = useState('');
  const [sessionSummary, setSessionSummary] = useState(''); // Store full AI summary
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    if (selectedSpace) {
      loadSpaceDetails();
    }
  }, [selectedSpace]);

  const loadSpaces = async () => {
    try {
      const { spaces } = await apiService.getTutorSpaces();
      setSpaces(spaces);
    } catch (err) {
      console.error('Failed to load spaces:', err);
    }
  };

  const loadSpaceDetails = async () => {
    if (!selectedSpace) return;

    setDetailsLoading(true);
    setDetailsError('');
    setKnowledgeSummary('');
    setSessionSummary(''); // Reset summary
    setStatistics(null);

    try {
      // Fetch basic details first
      const [summaryData, statsData] = await Promise.all([
        apiService.getKnowledgeSummary(selectedSpace._id),
        apiService.getPostStatistics(selectedSpace._id)
      ]);

      // Check if space already has a saved summary
      if (selectedSpace.aiSessionSummary) {
        setSessionSummary(selectedSpace.aiSessionSummary);
      }

      // Handle knowledge summary - could be array or string
      if (Array.isArray(summaryData.summary)) {
        const summaryText = summaryData.summary
          .map((item: any) => `${item.point}: ${item.count} occurrences`)
          .join('\n');
        setKnowledgeSummary(summaryText);
      } else {
        setKnowledgeSummary(summaryData.summary || '');
      }

      // Handle statistics
      if (statsData.statistics) {
        const stats = statsData.statistics;
        setStatistics({
          total: stats.total || 0,
          answered: stats.answered || 0,
          unanswered: stats.unanswered || 0,
          averageScore: stats.avgDifficulty || stats.averageScore || 0
        });
      }
    } catch (err: any) {
      console.error('Failed to load space details:', err);
      setDetailsError(err.response?.data?.error || 'Failed to load space details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshStatistics = async () => {
    if (!selectedSpace) return;
    try {
      const statsData = await apiService.getPostStatistics(selectedSpace._id);
      if (statsData.statistics) {
        const stats = statsData.statistics;
        setStatistics({
          total: stats.total || 0,
          answered: stats.answered || 0,
          unanswered: stats.unanswered || 0,
          averageScore: stats.avgDifficulty || stats.averageScore || 0
        });
      }
    } catch (err: any) {
      console.error('Failed to refresh statistics:', err);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedSpace) return;
    setGeneratingSummary(true);
    try {
      const { summary } = await apiService.generateSessionSummary(selectedSpace._id);
      setSessionSummary(summary);
      // Update local space state to reflect the new summary
      setSpaces(prev => prev.map(s => s._id === selectedSpace._id ? { ...s, aiSessionSummary: summary } : s));
    } catch (err: any) {
      setDetailsError(err.response?.data?.error || 'Failed to generate session summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedSpace) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Session_Report_${selectedSpace.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setDetailsError('Failed to export PDF report');
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.createSpace(formData);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', startTime: '', endTime: '' });
      await loadSpaces();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="dashboard tutor-dashboard">
      <header className="dashboard-header">
        <h1>Lumina - Tutor Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="create-space-section">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary"
            >
              {showCreateForm ? 'Cancel' : 'Create New Space'}
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateSpace} className="create-space-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Space Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Space'}
                </button>
              </form>
            )}
          </div>

          <div className="spaces-list">
            <h3>My Spaces</h3>
            {spaces.length === 0 ? (
              <p className="empty-state">No spaces created yet</p>
            ) : (
              spaces.map((space) => (
                <div
                  key={space._id}
                  className={`space-card ${selectedSpace?._id === space._id ? 'active' : ''}`}
                  onClick={() => setSelectedSpace(space)}
                >
                  <h4>{space.name}</h4>
                  <p className="space-code">Code: {space.spaceCode}</p>
                  <p className="participant-count">
                    Participants: {space.participantCount ?? 0}
                  </p>
                  <span className={`status-badge ${space.status}`}>{space.status}</span>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="main-content">
          {selectedSpace ? (
            <>
              <div className="space-header">
                <div>
                  <h2>{selectedSpace.name}</h2>
                  <p>{selectedSpace.description}</p>
                  <p className="space-time">
                    {new Date(selectedSpace.startTime).toLocaleString()} -{' '}
                    {new Date(selectedSpace.endTime).toLocaleString()}
                  </p>
                </div>
                <div className="qr-code-section">
                  <h4>Space QR Code</h4>
                  <img
                    src={selectedSpace.qrCode}
                    alt="QR Code"
                    className="qr-code"
                  />
                  <p className="space-code-display">Code: {selectedSpace.spaceCode}</p>
                </div>
              </div>

              {detailsError && <div className="error-message">{detailsError}</div>}

              {detailsLoading && <div className="loading">Loading space details...</div>}

              {statistics && (
                <div className="statistics-panel">
                  <h3>Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{statistics.total}</div>
                      <div className="stat-label">Total Questions</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{statistics.answered}</div>
                      <div className="stat-label">Answered</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{statistics.unanswered}</div>
                      <div className="stat-label">Unanswered</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {statistics.averageScore.toFixed(1)}
                      </div>
                      <div className="stat-label">Avg Difficulty</div>
                    </div>
                  </div>
                </div>
              )}

              {knowledgeSummary && (
                <div className="knowledge-summary">
                  <h3>Knowledge Points Summary</h3>
                  <div
                    className="summary-content"
                    dangerouslySetInnerHTML={{ __html: knowledgeSummary.replace(/\n/g, '<br/>') }}
                  />
                </div>
              )}

              <div className="session-summary-section" style={{ margin: '20px 0', padding: '25px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🤖</span>
                    <h3 style={{ margin: 0, color: '#333' }}>AI Session Report</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {sessionSummary && (
                      <button
                        onClick={handleExportPDF}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        📄 Export PDF
                      </button>
                    )}
                    <button 
                      onClick={handleGenerateSummary} 
                      disabled={generatingSummary}
                      className="btn-primary"
                      style={{ 
                        backgroundColor: generatingSummary ? '#9575cd' : '#673ab7',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px',
                        boxShadow: '0 2px 5px rgba(103, 58, 183, 0.3)'
                      }}
                    >
                      {generatingSummary ? '🔮 Analyzing...' : (sessionSummary ? '🔄 Regenerate' : '✨ Generate Report')}
                    </button>
                  </div>
                </div>

                {sessionSummary ? (
                  <div 
                    ref={reportRef} 
                    className="ai-report-content" 
                    style={{ 
                      backgroundColor: '#fafafa', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      border: '1px solid #e0e0e0',
                      lineHeight: '1.6',
                      color: '#333333', // Enforce dark text color
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ marginBottom: '15px', textAlign: 'center', borderBottom: '2px solid #673ab7', paddingBottom: '8px' }}>
                      <h2 style={{ color: '#673ab7', margin: '0 0 4px 0', fontSize: '1.4em' }}>Session Summary Report</h2>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.85em' }}>
                        Space: {selectedSpace.name} | Date: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                     {/* Enhanced markdown rendering */}
                    <div className="markdown-body" dangerouslySetInnerHTML={{ 
                      __html: sessionSummary
                        .replace(/\n/g, '<br/>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^# (.*$)/gim, '<h3 style="color: #5e35b1; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 15px; margin-bottom: 8px; font-size: 1.2em;">$1</h3>')
                        .replace(/^## (.*$)/gim, '<h4 style="color: #5e35b1; margin-top: 12px; margin-bottom: 5px; font-size: 1.1em;">$1</h4>')
                        .replace(/^- (.*$)/gim, '<li style="margin-left: 15px; margin-bottom: 4px;">$1</li>')
                    }} />
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '8px',
                    border: '1px dashed #ccc' 
                  }}>
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>📊</span>
                    <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>
                      Ready to analyze student questions. Click "Generate Report" to identify main topics, common misconceptions, and review suggestions.
                    </p>
                  </div>
                )}
              </div>

              <PostList
                spaceId={selectedSpace._id}
                isStudent={false}
                onPostsUpdate={refreshStatistics}
              />
            </>
          ) : (
            <div className="empty-state-main">
              <h2>Select a space or create a new one</h2>
              <p>Create virtual discussion spaces for your students</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TutorDashboard;
