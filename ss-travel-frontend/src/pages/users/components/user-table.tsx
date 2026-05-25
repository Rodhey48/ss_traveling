import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, KeyRound, UserCheck, UserX } from 'lucide-react';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onResetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canReset?: boolean;
  canToggle?: boolean;
}

export default function UserTable({ 
  users, 
  onEdit, 
  onDelete,
  onResetPassword,
  onToggleStatus,
  canUpdate = true,
  canDelete = true,
  canReset = false,
  canToggle = false
}: UserTableProps) {
  const showActions = canUpdate || canDelete || canReset || canToggle;

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">User Info</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users && users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id} className={cn(!user.isActive && "opacity-60 bg-muted/20")}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-none mb-1">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{user.nip || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[10px] uppercase font-bold",
                    user.type === 'admin' ? "border-amber-500 text-amber-600 bg-amber-50" : "border-blue-500 text-blue-600 bg-blue-50"
                  )}>
                    {user.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.isActive ? 'success' : 'destructive'}
                    className="text-[10px] font-bold"
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canReset && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          title="Reset Password"
                          onClick={() => onResetPassword(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      )}
                      {canToggle && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            user.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                          )}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                          onClick={() => onToggleStatus(user)}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-accent"
                          title="Edit User"
                          onClick={() => onEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Delete User"
                          onClick={() => onDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="h-32 text-center text-muted-foreground italic">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
