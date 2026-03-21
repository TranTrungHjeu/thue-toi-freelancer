import React, { useEffect, useState } from 'react';
import axios from '../api/axiosClient';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import MainLayout from '../components/layout/MainLayout';
import { H2, Text, Caption } from '../components/common/Typography';
import StatCard from '../components/common/StatCard';
import Skeleton from '../components/common/Skeleton';
import Stepper from '../components/common/Stepper';
import { useToast } from '../components/common/Toast';
import { Wallet, StatsUpSquare, User, MultiBubble } from 'iconoir-react';

const apiList = [
  { name: "Health Check", method: "GET", url: "/v1/health", description: "Kiểm tra trạng thái hệ thống", params: [] },
  { name: "Đăng nhập", method: "POST", url: "/v1/auth/login", description: "Đăng nhập hệ thống", params: ["email", "password"] },
  { name: "Danh sách dự án", method: "GET", url: "/v1/projects", description: "Lấy danh sách dự án", params: [] },
];

function ApiTest() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch { return null; }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState(apiList[0]);
  const [params, setParams] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await axios.get('/v1/auth/profile');
        if (res?.success) {
          setCurrentUser(res.data);
          localStorage.setItem('currentUser', JSON.stringify(res.data));
        }
      } catch {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
    };
    loadCurrentUser();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus("Đang đăng nhập...");
    try {
      const res = await axios.post("/v1/auth/login", { email: loginEmail, password: loginPassword });
      if (res && res.success) {
        setLoginStatus("Đăng nhập thành công!");
        setCurrentUser(res.data.user);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        addToast("Đăng nhập thành công!", "success");
      } else {
        setLoginStatus(res?.message || "Đăng nhập thất bại");
        addToast(res?.message || "Đăng nhập thất bại", "error");
      }
    } catch (err) {
      const errorMessage = err?.message || "Lỗi kết nối server";
      setLoginStatus(errorMessage);
      addToast(errorMessage, "error");
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = selectedApi.method === "GET"
        ? await axios.get(selectedApi.url, { params })
        : await axios.post(selectedApi.url, params);
      setResponse(res);
      addToast(`Gửi yêu cầu tới ${selectedApi.name} thành công`, "success");
    } catch (err) {
      setResponse(err.response?.data || err.message);
      addToast("Gửi yêu cầu thất bại", "error");
    } finally { setLoading(false); }
  };

  return (
    <MainLayout user={currentUser}>
      {/* Top Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-1">
          <H2 className="!mb-0 text-3xl">API Laboratory</H2>
          <Text className="text-sm">Môi trường thử nghiệm dịch vụ Thuê Tôi</Text>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Xem Guide</Button>
          <Button onClick={() => window.location.reload()}>Làm mới</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton height="h-32" />
          <Skeleton height="h-32" />
          <Skeleton height="h-32" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            label="Tổng Thu Nhập" 
            value="$12,450" 
            icon={Wallet} 
            trend="up" 
            trendValue="+12%" 
          />
          <StatCard 
            label="Dự Án Hoàn Thành" 
            value="48" 
            icon={StatsUpSquare} 
            trend="up" 
            trendValue="+5" 
            animation="scale"
          />
          <StatCard 
            label="Đánh Giá Trung Bình" 
            value="4.9/5" 
            icon={MultiBubble} 
            trend="up" 
            trendValue="High" 
            animation="float"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Auth & Config */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <H2 className="text-6xl !text-white select-none">AUTH</H2>
            </div>
            <H2 className="text-lg mb-6 uppercase tracking-widest text-primary-500">Authentication</H2>
            <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
              <Input
                label={<span className="text-slate-300">Email Address</span>}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="!bg-slate-800 border-slate-700 !text-white"
              />
              <Input
                label={<span className="text-slate-300">Key Phrase</span>}
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="!bg-slate-800 border-slate-700 !text-white"
              />
              <Button type="submit" className="w-full mt-2">Access Portal</Button>
            </form>
            {loginStatus && <Text className="mt-4 text-xs italic text-primary-400">{loginStatus}</Text>}
          </Card>

          <Card>
            <H2 className="text-lg mb-4 uppercase tracking-widest">Select Endpoint</H2>
            <select
              className="w-full p-2.5 border border-slate-300 bg-white font-sans outline-none focus:border-primary-500 transition-colors"
              value={selectedApi.name}
              onChange={(e) => setSelectedApi(apiList.find(a => a.name === e.target.value))}
            >
              {apiList.map(api => <option key={api.name} value={api.name}>{api.name}</option>)}
            </select>
          </Card>
        </div>

        {/* Right Column - Execution & Results */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <H2 className="text-lg !mb-0 uppercase tracking-widest">Request Payload</H2>
              <Badge color="info">{selectedApi.method}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {selectedApi.params.map(p => (
                <Input key={p} label={p} placeholder={`Value for ${p}`} onChange={e => setParams(prev => ({ ...prev, [p]: e.target.value }))} />
              ))}
            </div>

            <Button className="w-full py-4 text-lg tracking-widest" onClick={handleSend} disabled={loading}>
              Execute {selectedApi.url}
            </Button>
          </Card>

          {response && (
            <Card className="!p-0 border-secondary-900 bg-secondary-900 overflow-hidden shadow-2xl">
              <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-none" />
                  <div className="w-3 h-3 bg-amber-500 rounded-none" />
                  <div className="w-3 h-3 bg-green-500 rounded-none" />
                </div>
                <Caption className="text-slate-400 font-mono text-[10px]">Response Inspector v1.0</Caption>
              </div>
              <pre className="p-6 text-slate-400 font-mono text-sm overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Developer Guide"
      >
        <div className="flex flex-col gap-6">
          <div>
            <Caption className="mb-2 block uppercase tracking-widest text-primary-600">Workflow Progress</Caption>
            <Stepper 
              steps={["Yêu cầu", "Báo giá", "Triển khai", "Hoàn tất"]} 
              currentStep={1} 
              className="mt-4 mb-10"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Text>Ví dụ về <strong>Table</strong> đồng bộ với thiết kế Sharpness:</Text>
            <Table
              headers={["Project", "Client", "Budget"]}
              data={[
                { name: "Thiết kế Landing Page", client: "Mr. Anh", budget: "$500" },
                { name: "Backend API Spring", client: "Ms. Linh", budget: "$1.200" },
              ]}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Đã hiểu</Button>
          </div>
        </div>
      </Modal>

    </MainLayout>
  );
}

export default ApiTest;
