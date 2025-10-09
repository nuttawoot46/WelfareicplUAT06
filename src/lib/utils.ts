
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-amber-500';
    case 'approved':
      return 'text-green-500';
    case 'rejected':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const getWelfareTypeColor = (type: string) => {
  switch (type) {
    case 'wedding':
      return 'bg-welfare-blue text-white';
    case 'training':
      return 'bg-welfare-teal text-white';
    case 'childbirth':
      return 'bg-welfare-pink text-white';
    case 'funeral':
      return 'bg-welfare-purple text-white';
    case 'glasses':
      return 'bg-welfare-blue text-white';
    case 'dental':
      return 'bg-welfare-orange text-white';
    case 'fitness':
      return 'bg-welfare-green text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const getWelfareTypeLabel = (type: string): string => {
  const welfareTypeLabels: Record<string, string> = {
    'wedding': 'สวัสดิการงานสมรส',
    'training': 'ค่าอบรม',
    'childbirth': 'ค่าคลอดบุตร',
    'funeral': 'ค่าช่วยเหลืองานศพ',
    'glasses': 'ค่าตัดแว่น',
    'dental': 'ค่าทำฟัน',
    'fitness': 'ค่าออกกำลังกาย',
    'medical': 'ของเยี่ยมกรณีเจ็บป่วย',
    'internal_training': 'อบรมภายใน',
    'advance': 'เบิกเงินล่วงหน้า (ฝ่ายขาย)',
    'general-advance': 'เบิกเงินล่วงหน้า (ทั่วไป)',
    'expense-clearing': 'เคลียร์ค่าใช้จ่าย'
  };

  return welfareTypeLabels[type] || type;
};