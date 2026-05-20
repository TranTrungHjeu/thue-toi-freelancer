export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <p className="text-2xl text-gray-400 mb-8">Trang không tìm thấy</p>
        <a href="/" className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
          Quay về trang chủ
        </a>
      </div>
    </div>
  )
}

