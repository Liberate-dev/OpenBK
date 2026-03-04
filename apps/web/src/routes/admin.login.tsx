import { createFileRoute } from '@tanstack/react-router';
import { AdminLoginForm } from '~features/admin-auth/components/AdminLoginForm';

export const Route = createFileRoute('/admin/login')({
    component: AdminLogin
});

function AdminLogin() {
    return <AdminLoginForm />;
}
