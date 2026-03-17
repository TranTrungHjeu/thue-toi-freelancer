import React, { useState } from 'react';
import axios from '../api/axiosClient';

const endpoints = [
  { name: 'Health', method: 'GET', url: '/api/health' },
  { name: 'Register', method: 'POST', url: '/api/v1/auth/register', body: { email: '', password: '', fullName: '', role: 'client' } },
  { name: 'Login', method: 'POST', url: '/api/v1/auth/login', body: { email: '', password: '' } },
  { name: 'Get Projects', method: 'GET', url: '/api/v1/projects' },
  { name: 'Create Project', method: 'POST', url: '/api/v1/projects', body: { userId: '', title: '', description: '', budgetMin: 0, budgetMax: 0, deadline: '' } },
  { name: 'Get Bids', method: 'GET', url: '/api/v1/bids' },
  { name: 'Create Bid', method: 'POST', url: '/api/v1/bids', body: { projectId: '', freelancerId: '', price: 0, message: '', estimatedTime: '', attachments: '' } },
  { name: 'Get Contracts', method: 'GET', url: '/api/contracts/user/1' },
  { name: 'Create Contract', method: 'POST', url: '/api/contracts', body: { projectId: '', freelancerId: '', clientId: '', status: 'ACTIVE' } },
  { name: 'Get Reviews', method: 'GET', url: '/api/reviews/contract/1' },
  { name: 'Create Review', method: 'POST', url: '/api/reviews', body: { contractId: '', reviewerId: '', rating: 5, comment: '' } },
  { name: 'Get Messages', method: 'GET', url: '/api/messages/contract/1' },
  { name: 'Send Message', method: 'POST', url: '/api/messages', body: { contractId: '', senderId: '', content: '', sentAt: '' } },
  { name: 'Get Notifications', method: 'GET', url: '/api/notifications/user/1' },
  { name: 'Create Notification', method: 'POST', url: '/api/notifications', body: { userId: '', title: '', content: '', createdAt: '', isRead: false } },
];

function ApiTest() {
  const [results, setResults] = useState({});
  const [inputs, setInputs] = useState({});

  const handleInputChange = (endpointIdx, key, value) => {
    setInputs((prev) => ({
      ...prev,
      [endpointIdx]: {
        ...prev[endpointIdx],
        [key]: value,
      },
    }));
  };

  const testApi = async (idx) => {
    const ep = endpoints[idx];
    let data = ep.body ? { ...ep.body, ...inputs[idx] } : undefined;
    try {
      const res = await axios({
        method: ep.method,
        url: ep.url,
        data,
      });
      setResults((prev) => ({ ...prev, [idx]: res.data }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [idx]: err.response ? err.response.data : err.message }));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>API Test UI (Simple)</h2>
      {endpoints.map((ep, idx) => (
        <div key={ep.name} style={{ border: '1px solid #ccc', marginBottom: 16, padding: 12 }}>
          <div><b>{ep.name}</b> [{ep.method}] <span style={{ color: '#888' }}>{ep.url}</span></div>
          {ep.body && Object.keys(ep.body).map((key) => (
            <div key={key} style={{ marginBottom: 4 }}>
              <label>{key}: </label>
              <input
                type="text"
                value={inputs[idx]?.[key] || ''}
                onChange={e => handleInputChange(idx, key, e.target.value)}
                style={{ width: 200 }}
              />
            </div>
          ))}
          <button onClick={() => testApi(idx)} style={{ marginTop: 8 }}>Test</button>
          <div style={{ marginTop: 8, background: '#f9f9f9', padding: 8, minHeight: 40 }}>
            <pre>{JSON.stringify(results[idx], null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ApiTest;
