import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Protected from './components/Protected';
import CanvasPage from './pages/CanvasPage';
import ContextPage from './pages/ContextPage';
import DesignPage from './pages/DesignPage';
import ExportPage from './pages/ExportPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NamePage from './pages/NamePage';
import PasswordPage from './pages/PasswordPage';
import RegisterPage from './pages/RegisterPage';
import RulesPage from './pages/RulesPage';
import StoriesPage from './pages/StoriesPage';
import TestCasesPage from './pages/TestCasesPage';
import WorkflowsPage from './pages/WorkflowsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<Protected />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/account/password" element={<PasswordPage />} />
            <Route path="/projects/:id/name" element={<NamePage />} />
            <Route path="/projects/:id/context" element={<ContextPage />} />
            <Route path="/projects/:id/design" element={<DesignPage />} />
            <Route path="/projects/:id/design/split" element={<DesignPage />} />
            <Route path="/projects/:id/workflows" element={<WorkflowsPage />} />
            <Route path="/projects/:id/workflows/:wfId" element={<CanvasPage />} />
            <Route path="/projects/:id/rules" element={<RulesPage />} />
            <Route path="/projects/:id/stories" element={<StoriesPage />} />
            <Route path="/projects/:id/test-cases" element={<TestCasesPage />} />
            <Route path="/projects/:id/export" element={<ExportPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
