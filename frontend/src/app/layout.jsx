import '../index.css';
import ClientProviders from '../components/ClientProviders';

export const metadata = {
  title: 'Thuê Tôi - Freelancer Platform',
  description: 'Nền tảng kết nối Freelancer và Khách hàng chuyên nghiệp.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="root">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
