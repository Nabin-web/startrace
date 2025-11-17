import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_URL } from '../config';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFiles = async () => {
    try {
      const response = await api.get('/api/files');
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load files');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  useEffect(() => {
    loadFiles();
    loadUsers();
  }, []);

  // WebSocket for real-time updates
  useWebSocket(WS_URL, () => {
    loadFiles();
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/api/admin/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await loadFiles();
      e.target.value = ''; // Reset file input
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/files/${fileId}`);
      await loadFiles();
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete file');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleViewFile = async (fileId) => {
    try {
      const response = await api.get(`/api/files/${fileId}/content`);
      setSelectedFile({ id: fileId, ...response.data });
    } catch (err) {
      setError('Failed to load file content');
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
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <div className="header-actions">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="admin-content">
        <div className="admin-section">
          <h2>File Management</h2>
          <div className="upload-section">
            <label htmlFor="file-upload" className="upload-btn">
              {loading ? 'Uploading...' : 'Upload CSV File'}
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </div>

          <div className="files-list">
            <h3>Uploaded Files ({files.length})</h3>
            {files.length === 0 ? (
              <p className="empty-state">No files uploaded yet</p>
            ) : (
              <table className="files-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td>{file.name}</td>
                      <td>{formatFileSize(file.size)}</td>
                      <td>{file.uploader_username}</td>
                      <td>{formatDate(file.created_at)}</td>
                      <td>
                        <button
                          onClick={() => handleViewFile(file.id)}
                          className="btn-view"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedFile && (
            <div className="file-viewer">
              <h3>File Content: {files.find(f => f.id === selectedFile.id)?.name}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="btn-close"
              >
                Close
              </button>
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
                  <p className="row-limit">Showing first 100 rows of {selectedFile.rows.length}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="admin-section">
          <h2>User Management</h2>
          <div className="users-list">
            <h3>Registered Users ({users.length})</h3>
            {users.length === 0 ? (
              <p className="empty-state">No users found</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

