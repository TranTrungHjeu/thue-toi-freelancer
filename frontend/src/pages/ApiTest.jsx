import React, { useState } from "react";
import axios from "../api/axiosClient";

const apiList = [
  {
    name: "Health Check",
    method: "GET",
    url: "/health",
    description: "Kiểm tra trạng thái hệ thống",
    params: [],
  },
  {
    name: "Đăng nhập",
    method: "POST",
    url: "/user/login",
    description: "Đăng nhập hệ thống",
    params: ["email", "password"],
  },
  {
    name: "Lấy thông tin cá nhân",
    method: "GET",
    url: "/user/profile",
    description: "Lấy thông tin user hiện tại",
    params: [],
  },
  {
    name: "Danh sách dự án",
    method: "GET",
    url: "/projects",
    description: "Lấy danh sách dự án",
    params: [],
  },
  {
    name: "Tạo dự án",
    method: "POST",
    url: "/projects",
    description: "Tạo dự án mới",
    params: ["title", "description", "budgetMin", "budgetMax", "deadline"],
  },
  {
    name: "Danh sách bid",
    method: "GET",
    url: "/bids",
    description: "Lấy danh sách bid",
    params: [],
  },
  {
    name: "Tạo bid",
    method: "POST",
    url: "/bids",
    description: "Tạo bid mới",
    params: ["projectId", "price", "description"],
  },
  {
    name: "Danh sách hợp đồng",
    method: "GET",
    url: "/contracts",
    description: "Lấy danh sách hợp đồng",
    params: [],
  },
  {
    name: "Tạo hợp đồng",
    method: "POST",
    url: "/contracts",
    description: "Tạo hợp đồng mới",
    params: ["projectId", "freelancerId", "clientId", "status"],
  },
  {
    name: "Danh sách milestone",
    method: "GET",
    url: "/milestones",
    description: "Lấy danh sách milestone",
    params: [],
  },
  {
    name: "Tạo milestone",
    method: "POST",
    url: "/milestones",
    description: "Tạo milestone mới",
    params: ["contractId", "title", "description", "amount", "dueDate", "status"],
  },
  {
    name: "Danh sách notification",
    method: "GET",
    url: "/api/notifications",
    description: "Lấy danh sách notification",
    params: [],
  },
  {
    name: "Tạo notification",
    method: "POST",
    url: "/api/notifications",
    description: "Tạo notification mới",
    params: ["userId", "title", "content", "isRead"],
  },
];

<<<<<<< HEAD
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
=======
import React, { useState } from "react";
import axios from "../api/axiosClient";

const apiList = [
  {
    name: "Health Check",
    method: "GET",
    url: "/health",
    description: "Kiểm tra trạng thái hệ thống",
    params: [],
  },
  {
    name: "Đăng nhập",
    method: "POST",
    url: "/user/login",
    description: "Đăng nhập hệ thống",
    params: ["email", "password"],
  },
  {
    name: "Lấy thông tin cá nhân",
    method: "GET",
    url: "/user/profile",
    description: "Lấy thông tin user hiện tại",
    params: [],
  },
  {
    name: "Danh sách dự án",
    method: "GET",
    url: "/projects",
    description: "Lấy danh sách dự án",
    params: [],
  },
  {
    name: "Tạo dự án",
    method: "POST",
    url: "/projects",
    description: "Tạo dự án mới",
    params: ["title", "description", "budgetMin", "budgetMax", "deadline"],
  },
  {
    name: "Danh sách bid",
    method: "GET",
    url: "/bids",
    description: "Lấy danh sách bid",
    params: [],
  },
  {
    name: "Tạo bid",
    method: "POST",
    url: "/bids",
    description: "Tạo bid mới",
    params: ["projectId", "price", "description"],
  },
  {
    name: "Danh sách hợp đồng",
    method: "GET",
    url: "/contracts",
    description: "Lấy danh sách hợp đồng",
    params: [],
  },
  {
    name: "Tạo hợp đồng",
    method: "POST",
    url: "/contracts",
    description: "Tạo hợp đồng mới",
    params: ["projectId", "freelancerId", "clientId", "status"],
  },
  {
    name: "Danh sách milestone",
    method: "GET",
    url: "/milestones",
    description: "Lấy danh sách milestone",
    params: [],
  },
  {
    name: "Tạo milestone",
    method: "POST",
    url: "/milestones",
    description: "Tạo milestone mới",
    params: ["contractId", "title", "description", "amount", "dueDate", "status"],
  },
  {
    name: "Danh sách notification",
    method: "GET",
    url: "/api/notifications",
    description: "Lấy danh sách notification",
    params: [],
  },
  {
    name: "Tạo notification",
    method: "POST",
    url: "/api/notifications",
    description: "Tạo notification mới",
    params: ["userId", "title", "content", "isRead"],
  },
];

function ApiTest() {
    // Đăng nhập
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginStatus, setLoginStatus] = useState(null);

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoginStatus("Đang đăng nhập...");
      try {
        const res = await axios.post("/user/login", {
          email: loginEmail,
          password: loginPassword,
        });
        if (res && res.success) {
          setLoginStatus("Đăng nhập thành công!");
        } else {
          setLoginStatus("Sai tài khoản hoặc mật khẩu");
        }
      } catch (err) {
        setLoginStatus("Sai tài khoản hoặc mật khẩu");
      }
    };
  const [selectedApi, setSelectedApi] = useState(apiList[0]);
  const [params, setParams] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChangeApi = (api) => {
    setSelectedApi(api);
    setParams({});
    setResponse(null);
  };

  const handleChangeParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let res;
      if (selectedApi.method === "GET") {
        res = await axios.get(selectedApi.url, { params });
      } else {
        res = await axios.post(selectedApi.url, params);
      }
      setResponse(res);
    } catch (err) {
      setResponse(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">API Test UI</h2>
      {/* Form đăng nhập đơn giản */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-semibold mb-2">Đăng nhập để test API</h3>
        <form onSubmit={handleLogin} className="flex gap-2 items-center">
          <input
            type="email"
            className="p-2 border rounded"
            placeholder="Email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="p-2 border rounded"
            placeholder="Mật khẩu"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 transition">
            Đăng nhập
          </button>
        </form>
        {loginStatus && <div className="mt-2 text-sm text-green-600">{loginStatus}</div>}
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">Chọn API:</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedApi.name}
          onChange={(e) => handleChangeApi(apiList.find(api => api.name === e.target.value))}
        >
          {apiList.map((api, idx) => (
            <option key={api.name + idx} value={api.name}>{api.name}</option>
          ))}
        </select>
      </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold">Mô tả:</label>
            <div className="bg-gray-100 p-2 rounded">{selectedApi.description}</div>
          </div>

          {selectedApi.params.length > 0 && (
            <div className="mb-6">
              <label className="block mb-2 font-semibold">Nhập tham số:</label>
              {selectedApi.params.map((param, idx) => (
                <input
                  key={param + idx}
                  className="w-full p-2 mb-2 border rounded"
                  placeholder={param}
                  value={params[param] || ""}
                  onChange={e => handleChangeParam(param, e.target.value)}
                />
              ))}
            </div>
          )}

          <button
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition mb-4"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : `Gửi ${selectedApi.method}`}
          </button>

          {response && (
            <div className="mt-6">
              <label className="block mb-2 font-semibold">Kết quả:</label>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
>>>>>>> d790990 (Sync local changes before rebase)
    </div>
  );
}

export default ApiTest;
