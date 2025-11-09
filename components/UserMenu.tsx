import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { User as UserIcon, LogOut } from 'lucide-react';

interface UserMenuProps {
  isMobile?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ isMobile }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    if (!auth) {
      console.error("Firebase not configured. Cannot log out.");
      return;
    }
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in AuthContext will handle the state update.
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isMobile) {
     return (
        <div className="w-full">
            <div className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                   <UserIcon size={20} />
                </div>
                <div className="text-sm">
                    <p className="font-semibold">{currentUser?.displayName || 'User'}</p>
                    <p className="text-text-muted-light dark:text-text-muted-dark truncate">{currentUser?.email}</p>
                </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-base font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left">
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
     );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="User" className="h-full w-full rounded-full" />
        ) : (
            <UserIcon size={20} />
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card-light dark:bg-card-dark backdrop-blur-xl border border-border-light dark:border-border-dark rounded-lg shadow-lg py-2">
          <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
            <p className="font-semibold text-sm truncate">{currentUser?.displayName || 'User'}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">{currentUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;