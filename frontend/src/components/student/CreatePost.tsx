import React, { useState, useRef } from 'react';
import { InputType } from '../../types';
import apiService from '../../services/api';
import ocrService from '../../utils/ocrService';
import voiceService from '../../utils/voiceService';

interface CreatePostProps {
  spaceId: string;
  participantId?: string; // For anonymous students
  sessionToken?: string; // For anonymous students
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ spaceId, participantId, sessionToken, onPostCreated }) => {
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
    setFiles(selectedFiles);

    // If OCR mode and image selected, extract text
    if (inputMode === InputType.OCR && selectedFiles.length > 0) {
      const imageFile = selectedFiles[0];
      setOcrProgress('Processing image...');

      try {
        const extractedText = await ocrService.extractTextFromImage(imageFile);
        setQuestion(extractedText);
        setOriginalText(extractedText);
        setOcrProgress('Text extracted successfully!');
      } catch (err) {
        setError('Failed to extract text from image');
        setOcrProgress('');
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

      // If anonymous student, include participant info
      if (participantId && sessionToken) {
        formData.append('participantId', participantId);
        formData.append('sessionToken', sessionToken);
      }

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <h3>Ask a Question</h3>

      {error && <div className="error-message">{error}</div>}
      {ocrProgress && <div className="info-message">{ocrProgress}</div>}

      <div className="input-mode-selector">
        <button
          className={`mode-btn ${inputMode === InputType.TEXT ? 'active' : ''}`}
          onClick={() => setInputMode(InputType.TEXT)}
        >
          Text
        </button>
        <button
          className={`mode-btn ${inputMode === InputType.OCR ? 'active' : ''}`}
          onClick={() => setInputMode(InputType.OCR)}
        >
          Image (OCR)
        </button>
        <button
          className={`mode-btn ${inputMode === InputType.VOICE ? 'active' : ''}`}
          onClick={() => setInputMode(InputType.VOICE)}
        >
          Voice
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {inputMode === InputType.OCR && (
          <div className="file-input-section">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              disabled={loading}
            />
          </div>
        )}

        {inputMode === InputType.VOICE && (
          <div className="voice-input-section">
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`btn-voice ${isListening ? 'listening' : ''}`}
              disabled={loading}
            >
              {isListening ? 'Stop Recording' : 'Start Recording'}
            </button>
            {isListening && <p className="listening-indicator">Listening...</p>}
          </div>
        )}

        <div className="form-group">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Your question here..."
            rows={10}
            disabled={loading}
            required
          />
        </div>

        {inputMode === InputType.TEXT && (
          <div className="file-input-section">
            <label>Attach images (optional):</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileSelect}
              disabled={loading}
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Posting...' : 'Post Question'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
