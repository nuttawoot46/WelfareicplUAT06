interface SidebarBadgeProps {
  count: number;
}

export function SidebarBadge({ count }: SidebarBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="ml-auto bg-red-500 text-white text-xs font-medium min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
