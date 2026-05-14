"use client";

import Link from 'next/link';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { H1, Text } from '../components/common/Typography';

/**
 * Trang 404 tùy chỉnh cho Next.js App Router.
 * File này được Next.js nhận diện tự động khi người dùng truy cập
 * một URL không khớp với bất kỳ route nào đã được định nghĩa.
 *
 * @returns {React.ReactNode} Giao diện trang không tìm thấy
 */
export default function NotFound() {
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
          <Link href="/">
            <Button variant="outline">Về trang chủ</Button>
          </Link>
          <Link href="/workspace">
            <Button>Vào khu làm việc</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
