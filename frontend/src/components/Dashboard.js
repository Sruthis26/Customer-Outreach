import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LogOut, Upload, Users, UserPlus, Trash2, 
  CheckCircle, AlertCircle, FileText, BarChart3 
} from 'lucide-react';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Agent form state
  const [agentForm, setAgentForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchAgents();
    fetchDistribution();
  }, []);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API_URL}/agents`, axiosConfig);
      if (response.data.success) {
        setAgents(response.data.agents);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch agents');
    }
  };

  const fetchDistribution = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers/distribution`, axiosConfig);
      if (response.data.success) {
        setDistribution(response.data.distribution);
      }
    } catch (error) {
      console.error('Failed to fetch distribution');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/agents`, agentForm, axiosConfig);
      if (response.data.success) {
        showMessage('success', 'Agent created successfully');
        setAgentForm({ name: '', email: '', mobile: '', password: '' });
        fetchAgents();
        fetchDistribution();
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await axios.delete(`${API_URL}/agents/${id}`, axiosConfig);
      if (response.data.success) {
        showMessage('success', 'Agent deleted successfully');
        fetchAgents();
        fetchDistribution();
      }
    } catch (error) {
      showMessage('error', 'Failed to delete agent');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showMessage('error', 'Please select a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(
        `${API_URL}/customers/upload`,
        formData,
        {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        showMessage('success', response.data.message);
        setSelectedFile(null);
        fetchDistribution();
        setActiveTab('distribution');
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Customer Outreach System</h1>
            <p className="header-subtitle">Manage agents and distribute customer lists</p>
          </div>
          <button onClick={onLogout} className="logout-button">
            <LogOut className="icon" />
            Logout
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle className="message-icon" />
          ) : (
            <AlertCircle className="message-icon" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="dashboard-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <Users className="tab-icon" />
            Agents
          </button>
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="tab-icon" />
            Upload Customers
          </button>
          <button 
            className={`tab ${activeTab === 'distribution' ? 'active' : ''}`}
            onClick={() => setActiveTab('distribution')}
          >
            <BarChart3 className="tab-icon" />
            Distribution
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'agents' && (
            <div className="agents-section">
              <div className="section-card">
                <div className="card-header">
                  <UserPlus className="card-icon" />
                  <h2>Create New Agent</h2>
                </div>
                <form onSubmit={handleAgentSubmit} className="agent-form">
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={agentForm.name}
                      onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={agentForm.email}
                      onChange={(e) => setAgentForm({...agentForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="tel"
                      placeholder="Mobile (+91 1234567890)"
                      value={agentForm.mobile}
                      onChange={(e) => setAgentForm({...agentForm, mobile: e.target.value})}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={agentForm.password}
                      onChange={(e) => setAgentForm({...agentForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Agent'}
                  </button>
                </form>
              </div>

              <div className="section-card">
                <div className="card-header">
                  <Users className="card-icon" />
                  <h2>All Agents ({agents.length})</h2>
                </div>
                <div className="agents-list">
                  {agents.length === 0 ? (
                    <p className="empty-state">No agents created yet</p>
                  ) : (
                    agents.map(agent => (
                      <div key={agent._id} className="agent-card">
                        <div className="agent-info">
                          <h3>{agent.name}</h3>
                          <p>{agent.email}</p>
                          <p className="agent-mobile">{agent.mobile}</p>
                          <span className="agent-customers">
                            {agent.assignedCustomers?.length || 0} customers
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteAgent(agent._id)}
                          className="delete-button"
                        >
                          <Trash2 className="icon" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="upload-section">
              <div className="section-card">
                <div className="card-header">
                  <FileText className="card-icon" />
                  <h2>Upload Customer List</h2>
                </div>
                <div className="upload-info">
                  <p>Upload a CSV or Excel file with customer data</p>
                  <ul>
                    <li>Required columns: FirstName, Phone</li>
                    <li>Optional column: Notes</li>
                    <li>File formats: .csv, .xlsx, .xls</li>
                  </ul>
                </div>
                <form onSubmit={handleFileUpload} className="upload-form">
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="file-label">
                      <Upload className="icon" />
                      {selectedFile ? selectedFile.name : 'Choose file'}
                    </label>
                  </div>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={loading || !selectedFile}
                  >
                    {loading ? 'Uploading...' : 'Upload & Distribute'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="distribution-section">
              <div className="section-card">
                <div className="card-header">
                  <BarChart3 className="card-icon" />
                  <h2>Customer Distribution</h2>
                </div>
                {distribution.length === 0 ? (
                  <p className="empty-state">No customers distributed yet</p>
                ) : (
                  <div className="distribution-grid">
                    {distribution.map(agent => (
                      <div key={agent.agentId} className="distribution-card">
                        <div className="distribution-header">
                          <h3>{agent.agentName}</h3>
                          <span className="customer-count">{agent.customersCount}</span>
                        </div>
                        <p className="agent-email">{agent.email}</p>
                        <div className="customers-list">
                          {agent.customers.slice(0, 5).map(customer => (
                            <div key={customer._id} className="customer-item">
                              <span className="customer-name">{customer.firstName}</span>
                              <span className="customer-phone">{customer.phone}</span>
                            </div>
                          ))}
                          {agent.customersCount > 5 && (
                            <p className="more-customers">+{agent.customersCount - 5} more</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;