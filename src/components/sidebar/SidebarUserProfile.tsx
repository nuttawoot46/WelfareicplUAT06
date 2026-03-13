import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavContext } from '@/hooks/useNavContext';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';

interface SidebarUserProfileProps {
  isExpanded: boolean;
}

export function SidebarUserProfile({ isExpanded }: SidebarUserProfileProps) {
  const { profile, signOut, displayName, email, department, position } = useNavContext();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  useEffect(() => {
    if (profile?.avatar_url !== undefined) {
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile?.avatar_url]);

  return (
    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
      <div className={cn(
        'flex items-center gap-3 mb-4 group relative',
        isExpanded ? 'justify-start' : 'justify-center'
      )}>
        {/* Profile Picture */}
        <div className="relative">
          <ProfilePictureUpload
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            onAvatarUpdate={(newUrl) => setAvatarUrl(newUrl || null)}
            isOpen={isExpanded}
          />

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-50 shadow-xl">
              <div className="font-semibold">{displayName}</div>
              <div className="mt-1 pt-1 space-y-1 border-t border-white/10">
                {email && <div className="text-xs text-gray-300">{email}</div>}
                {department && <div className="text-xs text-gray-300">{department}</div>}
                {position && <div className="text-xs text-gray-300">{position}</div>}
              </div>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="overflow-hidden">
            <p className="text-base font-semibold text-gray-900 truncate">{displayName}</p>
            <div className="mt-0.5 space-y-0.5">
              {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
              {department && <p className="text-xs text-gray-400 truncate">{department}</p>}
              {position && <p className="text-xs text-gray-400 truncate">{position}</p>}
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTimeout(() => {
            signOut().catch(error => {
              console.error('Error in sign out callback:', error);
            });
          }, 100);
        }}
        className={cn(
          'w-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 font-medium',
          !isExpanded && 'justify-center'
        )}
      >
        <LogOut className="h-4 w-4" />
        {isExpanded && <span>ออกจากระบบ</span>}
      </Button>
    </div>
  );
}
