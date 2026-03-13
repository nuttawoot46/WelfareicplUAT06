import { cn } from '@/lib/utils';

const COLORS = [
  { name: 'แดง', hex: '#EF4444' },
  { name: 'ส้ม', hex: '#F97316' },
  { name: 'เหลือง', hex: '#EAB308' },
  { name: 'เขียว', hex: '#22C55E' },
  { name: 'ฟ้า', hex: '#06B6D4' },
  { name: 'น้ำเงิน', hex: '#3B82F6' },
  { name: 'ม่วง', hex: '#8B5CF6' },
  { name: 'ชมพู', hex: '#EC4899' },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map(color => (
        <button
          key={color.hex}
          type="button"
          title={color.name}
          onClick={() => onChange(color.hex)}
          className={cn(
            'w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110',
            value === color.hex ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent'
          )}
          style={{ backgroundColor: color.hex }}
        />
      ))}
    </div>
  );
}
