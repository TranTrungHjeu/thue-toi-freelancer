import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { H1, Text } from '../components/common/Typography';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-2xl border-2 border-slate-200 bg-white p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
          404
        </div>
        <H1 className="mt-4 text-4xl">
          Không tìm thấy trang bạn cần.
        </H1>
        <Text className="mt-4 text-slate-600">
          Hãy quay về trang chủ hoặc khu làm việc để tiếp tục sử dụng các luồng nghiệp vụ đã được hoàn thiện.
        </Text>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
          <Button onClick={() => navigate('/workspace')}>
            Vào khu làm việc
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;
