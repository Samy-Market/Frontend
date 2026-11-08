import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './auth/RequireRole';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import Justifications from './pages/admin/Justifications';
import Reports from './pages/admin/Reports';
import Schedules from './pages/admin/Schedules';
import Shifts from './pages/admin/Shifts';
import Sites from './pages/admin/Sites';
import Users from './pages/admin/Users';
import EmployeeHistory from './pages/employee/EmployeeHistory';
import EmployeeHome from './pages/employee/EmployeeHome';
import EmployeeLayout from './pages/employee/EmployeeLayout';
import EmployeeRequests from './pages/employee/EmployeeRequests';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireRole roles={['EMPLOYEE']}>
            <EmployeeLayout />
          </RequireRole>
        }
      >
        <Route index element={<EmployeeHome />} />
        <Route path="historial" element={<EmployeeHistory />} />
        <Route path="solicitudes" element={<EmployeeRequests />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireRole roles={['ADMIN', 'SUPERVISOR']}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sedes" element={<Sites />} />
        <Route path="empleados" element={<Employees />} />
        <Route path="turnos" element={<Shifts />} />
        <Route path="horarios" element={<Schedules />} />
        <Route path="justificaciones" element={<Justifications />} />
        <Route path="reportes" element={<Reports />} />
        <Route
          path="usuarios"
          element={
            <RequireRole roles={['ADMIN']}>
              <Users />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
