import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { Overview, Plugins, Releases, Reports } from '../../pages';
// Placeholder for other pages to avoid import errors until they are created
const Timeline = () => <div className="p-8">Timeline Page (Coming Soon)</div>;
const Analytics = () => <div className="p-8">Analytics Page (Coming Soon)</div>;
const Settings = () => <div className="p-8">Settings Page (Coming Soon)</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <Overview /> },
      { path: 'plugins', element: <Plugins /> },
      { path: 'releases', element: <Releases /> },
      { path: 'timeline', element: <Timeline /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
