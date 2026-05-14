import LandingClientView from './LandingClientView';

// Revalidate mỗi 60 giây để đảm bảo SEO luôn cập nhật mà không gây quá tải cho Backend
export const revalidate = 60;

export default async function Page() {
  let recentProjects = [];
  
  try {
    const backendUrl = process.env.VITE_DEV_BACKEND_TARGET || 'http://localhost:8080';
    const res = await fetch(`${backendUrl}/api/v1/projects/search?status=open`, {
      next: { revalidate: 60 }
    });
    
    if (res.ok) {
      const response = await res.json();
      if (response?.success && Array.isArray(response?.data)) {
        // Chỉ lấy 4 dự án mới nhất để hiển thị trên Landing Page
        recentProjects = response.data.slice(0, 4);
      }
    }
  } catch (error) {
    // Bỏ qua lỗi âm thầm, Next.js sẽ nạp giao diện tĩnh với danh sách rỗng nếu Backend không phản hồi
  }

  return <LandingClientView recentProjects={recentProjects} />;
}
