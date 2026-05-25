import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import ProfileModal from './profile-modal';

export default function UserNav() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border/50 shadow-sm">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.avatar}
                alt={user?.name || ''}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60 p-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1 p-1">
              <p className="text-sm font-bold leading-none text-foreground">{user?.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground opacity-80">
                {user?.email || 'user@example.com'}
              </p>
              {user?.nip && (
                <p className="text-[10px] mt-1 text-primary font-medium">NIP: {user.nip}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg py-2"
              onClick={() => setIsProfileOpen(true)}
            >
              Profile & Security
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer rounded-lg py-2">
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive rounded-lg py-2"
            onClick={logout}
          >
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
}
