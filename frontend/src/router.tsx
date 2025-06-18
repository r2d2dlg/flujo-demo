import { createBrowserRouter } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import CostoDirectoTablePage from './pages/costo_directo/CostoDirectoTablePage';
import CostoDirectoViewPage from './pages/costo_directo/CostoDirectoViewPage';
import PagosTierraTablePage from './pages/PagosTierraTablePage';
import PagosTierraViewPage from './pages/PagosTierraViewPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminDashboard />,
  },
  {
    path: '/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/costo-directo',
    children: [
      {
        path: 'table',
        element: <CostoDirectoTablePage />
      },
      {
        path: 'view',
        element: <CostoDirectoViewPage />
      }
    ]
  },
  {
    path: '/pagos-tierra',
    children: [
      {
        path: 'table',
        element: <PagosTierraTablePage />
      },
      {
        path: 'view',
        element: <PagosTierraViewPage />
      }
    ]
  }
]); 