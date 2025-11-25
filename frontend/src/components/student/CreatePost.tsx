import React, { useState, useRef } from 'react';
import { InputType } from '../../types';
import apiService from '../../services/api';
import ocrService from '../../utils/ocrService';
import voiceService from '../../utils/voiceService';

interface CreatePostProps {
  spaceId: string;
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ spaceId, onPostCreated }) => {
  const [inputMode, setInputMode] = useState<InputType>(InputType.TEXT);
  const [question, setQuestion] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    setFiles(selectedFiles);

    // Auto-OCR if it's an image and text box is empty
    const imageFile = selectedFiles.find(f => f.type.startsWith('image/'));
    if (imageFile && !question.trim()) {
      setInputMode(InputType.OCR);
      setOcrProgress('Extracting text from image...');
      try {
        const extractedText = await ocrService.extractTextFromImage(imageFile);
        setQuestion(extractedText);
        setOriginalText(extractedText);
        setOcrProgress('');
      } catch (err) {
        console.error('OCR failed:', err);
        setOcrProgress('');
        // Fallback to text mode if OCR fails
        setInputMode(InputType.TEXT);
      }
    }
  };

  const handleVoiceInput = () => {
    if (!voiceService.isSupported()) {
      setError('Voice recognition not supported in your browser');
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setInputMode(InputType.VOICE);
    setIsListening(true);
    voiceService.startListening(
      (text) => {
        setQuestion(text);
        setOriginalText(text);
        setIsListening(false);
      },
      (error) => {
        setError(`Voice recognition error: ${error}`);
        setIsListening(false);
      }
    );
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('spaceId', spaceId);
      formData.append('question', question);
      formData.append('inputType', inputMode);

      if (originalText) {
        formData.append('originalText', originalText);
      }

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      await apiService.createPost(formData);

      // Reset form
      setQuestion('');
      setOriginalText('');
      setFiles([]);
      setOcrProgress('');
      setInputMode(InputType.TEXT);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onPostCreated();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create post';
      setError(errorMessage);

      // If the space is archived/expired, refresh the page to update UI
      if (errorMessage === 'This space is no longer active') {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <h3>Ask a Question</h3>

      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="input-area">
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (inputMode !== InputType.TEXT && !originalText) {
                setInputMode(InputType.TEXT);
              }
            }}
            placeholder={isListening ? "Listening..." : "Type your question here..."}
            rows={4}
            disabled={loading}
            className={isListening ? 'listening-mode' : ''}
            required
          />
          {ocrProgress && <div className="ocr-status">{ocrProgress}</div>}
        </div>

        <div className="action-bar">
          <div className="left-actions">
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`action-btn voice-btn ${isListening ? 'active' : ''}`}
              disabled={loading}
              title="Record Voice"
            >
              {isListening ? '⏹ Stop' : '🎤 Voice'}
            </button>

            <button
              type="button"
              onClick={triggerFileSelect}
              className="action-btn file-btn"
              disabled={loading}
              title="Attach File"
            >
              📎 Attach
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {files.length > 0 && (
              <span className="file-count">
                {files.length} file(s) selected
              </span>
            )}
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Posting...' : 'Post Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
