import ClientRouteGuard from '../../../components/ClientRouteGuard';

export default function AdminLayout({ children }) {
  return (
    <ClientRouteGuard adminOnly={true}>
      {children}
    </ClientRouteGuard>
  );
}
