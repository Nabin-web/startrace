import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_URL } from '../config';
import './UserPanel.css';

const UserPanel = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/files');
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // WebSocket for real-time updates
  useWebSocket(WS_URL, () => {
    loadFiles();
  });

  const handleViewFile = async (fileId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/files/${fileId}/content`);
      setSelectedFile({ id: fileId, ...response.data });
    } catch (err) {
      setError('Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="user-panel">
      <header className="user-header">
        <h1>CSV File Browser</h1>
        <div className="header-actions">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="user-content">
        <div className="files-section">
          <h2>Available CSV Files</h2>
          {loading && files.length === 0 ? (
            <div className="loading">Loading files...</div>
          ) : files.length === 0 ? (
            <p className="empty-state">No CSV files available yet</p>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <h3>{file.name}</h3>
                    <p className="file-meta">
                      {formatFileSize(file.size)} • {formatDate(file.created_at)}
                    </p>
                    <p className="file-uploader">Uploaded by: {file.uploader_username}</p>
                  </div>
                  <button
                    onClick={() => handleViewFile(file.id)}
                    className="btn-view"
                    disabled={loading}
                  >
                    {loading && selectedFile?.id === file.id ? 'Loading...' : 'View'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFile && (
            <div className="file-viewer">
              <div className="viewer-header">
                <h3>
                  {files.find(f => f.id === selectedFile.id)?.name || 'CSV File'}
                </h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="btn-close"
                >
                  Close
                </button>
              </div>
              <div className="table-container">
                <table className="csv-table">
                  <thead>
                    <tr>
                      {selectedFile.headers.map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFile.rows.slice(0, 100).map((row, idx) => (
                      <tr key={idx}>
                        {selectedFile.headers.map((header, hIdx) => (
                          <td key={hIdx}>{row[header] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedFile.rows.length > 100 && (
                  <p className="row-limit">
                    Showing first 100 rows of {selectedFile.rows.length} total rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPanel;

