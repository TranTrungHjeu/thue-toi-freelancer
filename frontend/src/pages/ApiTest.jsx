"use client";

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
import { useI18n } from '../hooks/useI18n';
import { useToast } from '../hooks/useToast';
import { Wallet, StatsUpSquare, MultiBubble } from 'iconoir-react';

function ApiTest() {
  const { t } = useI18n();
  const copy = t('apiTest');
  const apiList = copy.apiList;
  const statIconMap = {
    wallet: Wallet,
    reports: StatsUpSquare,
    reviews: MultiBubble,
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch { return null; }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState('health');
  const [params, setParams] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const selectedApi = apiList.find((api) => api.key === selectedApiKey) ?? apiList[0];

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

  useEffect(() => {
    setParams({});
  }, [selectedApiKey]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus(copy.feedback.loggingIn);
    try {
      const res = await axios.post("/v1/auth/login", { email: loginEmail, password: loginPassword });
      if (res && res.success) {
        setLoginStatus(copy.feedback.loginSuccess);
        setCurrentUser(res.data.user);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        addToast(copy.feedback.loginSuccess, "success");
      } else {
        const fallbackMessage = res?.message || copy.feedback.loginError;
        setLoginStatus(fallbackMessage);
        addToast(fallbackMessage, "error");
      }
    } catch (err) {
      const errorMessage = err?.message || t('errors.fallback.network');
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
      addToast(t('apiTest.feedback.requestSuccess', { api: selectedApi.name }), "success");
    } catch (err) {
      setResponse(err?.success !== undefined ? err : err.response?.data || err.message);
      addToast(copy.feedback.requestError, "error");
    } finally { setLoading(false); }
  };

  return (
    <MainLayout user={currentUser}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-1">
          <H2 className="!mb-0 text-3xl">{copy.page.title}</H2>
          <Text className="text-sm">{copy.page.description}</Text>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>{copy.page.guide}</Button>
          <Button onClick={() => window.location.reload()}>{copy.page.refresh}</Button>
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
          {copy.stats.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={statIconMap[item.iconKey]}
              trend={item.trend}
              trendValue={item.trendValue}
              animation={item.animation}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <H2 className="text-6xl !text-white select-none">{copy.authCard.watermark}</H2>
            </div>
            <H2 className="text-lg mb-6 uppercase tracking-widest text-primary-500">{copy.authCard.title}</H2>
            <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
              <Input
                label={<span className="text-slate-300">{copy.authCard.emailLabel}</span>}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="!bg-slate-800 border-slate-700 !text-white"
              />
              <Input
                label={<span className="text-slate-300">{copy.authCard.passwordLabel}</span>}
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="!bg-slate-800 border-slate-700 !text-white"
              />
              <Button type="submit" className="w-full mt-2">{copy.authCard.submit}</Button>
            </form>
            {loginStatus && <Text className="mt-4 text-xs italic text-primary-400">{loginStatus}</Text>}
          </Card>

          <Card>
            <H2 className="text-lg mb-4 uppercase tracking-widest">{copy.selector.title}</H2>
            <select
              className="w-full p-2.5 border border-slate-300 bg-white font-sans outline-none focus:border-primary-500 transition-colors"
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
            >
              {apiList.map((api) => (
                <option key={api.key} value={api.key}>{api.name}</option>
              ))}
            </select>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <H2 className="text-lg !mb-0 uppercase tracking-widest">{copy.request.title}</H2>
              <Badge color="info">{selectedApi.method}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {selectedApi.params.map((param) => (
                <Input
                  key={param.key}
                  label={param.label}
                  placeholder={t('apiTest.request.placeholder', { label: param.label })}
                  onChange={(e) => setParams((prev) => ({ ...prev, [param.key]: e.target.value }))}
                />
              ))}
            </div>

            <Button className="w-full py-4 text-lg tracking-widest" onClick={handleSend} disabled={loading}>
              {t('apiTest.request.submit', { url: selectedApi.url })}
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
                <Caption className="text-slate-400 font-mono text-[10px]">{copy.responseViewer.title}</Caption>
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
        title={copy.guideModal.title}
      >
        <div className="flex flex-col gap-6">
          <div>
            <Caption className="mb-2 block uppercase tracking-widest text-primary-600">{copy.guideModal.processCaption}</Caption>
            <Stepper 
              steps={copy.guideModal.steps}
              currentStep={1} 
              className="mt-4 mb-10"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Text>{copy.guideModal.tableIntro}</Text>
            <Table
              headers={copy.guideModal.tableHeaders}
              data={copy.guideModal.tableRows}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>{copy.guideModal.confirm}</Button>
          </div>
        </div>
      </Modal>

    </MainLayout>
  );
}

export default ApiTest;
