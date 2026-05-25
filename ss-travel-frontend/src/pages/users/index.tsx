import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import UserTable from './components/user-table';
import UserModal from './components/user-modal';
import ResetPasswordModal from './components/reset-password-modal';
import { UserService } from '@/services/user.service';
import type { User, UserFormData } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function UsersPage() {
  const { isCreate, isUpdate, isDelete, actions } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Specific Action Permissions
  const canReset = !!actions['PermissionUser.reset'];
  const canDeleteUser = !!actions['PermissionUser.delete'] || isDelete;
  const canToggleStatus = !!actions['PermissionUser.status'];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await UserService.findAll({ search });
      if (response.status) {
        setUsers(response.data.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await UserService.toggleStatus(user.id);
      if (response.status) {
        toast.success(response.message);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status user');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await UserService.remove(id);
        toast.success('User berhasil dihapus');
        fetchMenus();
      } catch (error) {
        toast.error('Gagal menghapus user');
      }
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    try {
      setSubmitting(true);
      if (selectedUser) {
        await UserService.update(selectedUser.id, data);
        toast.success('User berhasil diperbarui');
      } else {
        await UserService.create(data);
        toast.success('User berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Manajemen User"
          description="Kelola daftar pengguna sistem dan pengaturan akses mereka."
        />
        {isCreate && (
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari user (nama, email, NIP)..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <UserTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
        canUpdate={isUpdate}
        canDelete={canDeleteUser}
        canReset={canReset}
        canToggle={canToggleStatus}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={selectedUser}
        loading={submitting}
      />

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
