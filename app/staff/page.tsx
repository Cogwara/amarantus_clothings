'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  UserCog,
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  History,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { User, Role } from '@/lib/types';

export default function StaffPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Add User Modal
  const [addUserModal, setAddUserModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('password123');
  const [role, setRole] = React.useState<Role>('STAFF');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, sRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/users').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (sRes?.users) setUsers(sRes.users);
      if (sRes?.auditLogs) setAuditLogs(sRes.auditLogs);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          password: password.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setAddUserModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('password123');
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: any) => {
    if (u.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          isActive: !u.isActive,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (u: any, newRole: Role) => {
    if (u.id === currentUser?.id) {
      alert('You cannot change your own role.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          role: newRole,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Staff & Role Permissions"
      subtitle="Manage shop employees, permissions and administrative audit records"
    >
      <div className="space-y-6">
        {/* Banner with Role Explanation */}
        <div className="bg-[#EAF7EE] border border-[#C5E9CE] rounded-[12px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white text-[#16803C] flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#16803C]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F5C2E]">
                Role-Based Access Control
              </h3>
              <p className="text-xs text-[#16803C] mt-1 max-w-2xl leading-relaxed">
                • <strong>OWNER:</strong> Full access to all financials, settings & user management.<br />
                • <strong>MANAGER:</strong> Sales POS, Inventory, Purchasing batches, Customers, Expenses and Reports.<br />
                • <strong>STAFF:</strong> Sales POS, Customer records, and View-only inventory.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setAddUserModal(true)}
            className="gap-2 shrink-0 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </Button>
        </div>

        {success && (
          <div className="p-3 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] text-xs font-bold text-[#16803C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Staff Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Staff Accounts</CardTitle>
              <p className="text-xs text-[#66736B]">
                Active team members and sales records
              </p>
            </div>
            <span className="text-xs font-semibold text-[#16803C]">
              {users.length} Users
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Name & Contact</th>
                      <th className="py-3 px-3 font-medium">Assigned Role</th>
                      <th className="py-3 px-3 font-medium text-center">Status</th>
                      <th className="py-3 px-3 font-medium text-center">Sales Processed</th>
                      <th className="py-3 px-3 font-medium text-right">Revenue Handled</th>
                      <th className="py-3 px-4 text-center font-medium">Toggle Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#17211B] text-sm">{u.name}</p>
                          <p className="text-[11px] text-[#66736B]">
                            {u.email} {u.phone ? `• ${u.phone}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                            disabled={u.id === currentUser?.id}
                            className="rounded-[8px] border border-[#DDE5DF] bg-white px-2 py-1 text-xs font-semibold text-[#17211B] focus:border-[#16803C] focus:outline-none"
                          >
                            <option value="STAFF">STAFF</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="OWNER">OWNER</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={u.isActive ? 'green' : 'red'}
                            className="text-[10px] font-bold"
                          >
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[#17211B]">
                          {u.salesCount || 0} sales
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#16803C]">
                          {formatNaira(u.totalSalesHandled || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {u.id !== currentUser?.id ? (
                            <Button
                              variant={u.isActive ? 'outline' : 'primary'}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleToggleActive(u)}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-[#66736B] italic">
                              Current User
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader className="pb-3 flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-[#16803C]" />
                <span>Security & Action Audit Logs</span>
              </CardTitle>
              <p className="text-xs text-[#66736B]">
                Track all sales, stock adjustments, logins and financial modifications
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Timestamp</th>
                    <th className="py-2.5 px-3 font-medium">User</th>
                    <th className="py-2.5 px-3 font-medium">Action</th>
                    <th className="py-2.5 px-3 font-medium">Entity</th>
                    <th className="py-2.5 px-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F1]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAF9]">
                      <td className="py-2.5 px-4 text-[#66736B] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-NG')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#17211B]">
                        {log.userName || 'System'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[#66736B]">{log.entity}</td>
                      <td className="py-2.5 px-4 text-[#17211B]">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Staff Account Modal */}
      <Modal
        isOpen={addUserModal}
        onClose={() => setAddUserModal(false)}
        title="Add Staff Member"
        description="Create user login credentials for shop staff or managers"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <Input
            label="Staff Full Name"
            placeholder="e.g. Blessing Adeyemi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address (Login Username)"
            type="email"
            placeholder="blessing@amarantus.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            placeholder="+234 805 777 8899"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Temporary Password"
            type="text"
            placeholder="password123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-1.5">
              Assigned Role & Permissions
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3 py-2 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none"
            >
              <option value="STAFF">STAFF (Point of sale & customer records only)</option>
              <option value="MANAGER">MANAGER (Sales, Inventory, Purchasing, Expenses & Reports)</option>
              <option value="OWNER">OWNER (Full administrative access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setAddUserModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
