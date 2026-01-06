import React from 'react';
import { LeaveBalance, LeaveType } from '@/types';
import { formatLeaveBalance, calculateUsagePercentage } from '@/services/leaveApi';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  leaveType?: LeaveType;
  onShowDetail?: (balance: LeaveBalance) => void;
}

// Color mapping based on leave type
const getProgressBarColor = (leaveTypeName: string): string => {
  const colorMap: Record<string, string> = {
    'Annual Leave': 'bg-blue-300',
    'Business Leave': 'bg-green-400',
    'Sick Leave': 'bg-purple-400',
    'Ordination Leave': 'bg-yellow-400',
    'Leave Without Pay': 'bg-red-400',
    'Sterilization Leave': 'bg-amber-700',
    'Wedding Leave': 'bg-pink-400',
    'Training Leave': 'bg-blue-400',
    'Military Leave': 'bg-green-500',
    'Maternity Leave': 'bg-pink-300',
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (leaveTypeName.includes(key)) {
      return color;
    }
  }
  return 'bg-gray-400';
};

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  balance,
  leaveType,
  onShowDetail,
}) => {
  const usedDays = Math.floor(balance.used_days);
  const usedHours = balance.used_hours || 0;
  const usedMinutes = balance.used_minutes || 0;
  const totalDays = Math.floor(balance.total_days);
  const percentage = calculateUsagePercentage(balance.used_days, balance.total_days);

  const typeName = leaveType?.name_en || 'Unknown';
  const typeNameTh = leaveType?.name_th || '';
  const progressColor = getProgressBarColor(typeName);

  const displayName = typeNameTh
    ? `${typeName} (${typeNameTh})`
    : typeName;

  return (
    <div className="fc-unthemed mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h6 className="text-sm font-medium text-gray-700">
          {displayName}
          {balance.carry_over_expiry && (
            <span className="text-xs text-red-500 ml-2">
              * หมดอายุวันที่ {new Date(balance.carry_over_expiry).toLocaleDateString('th-TH')}
            </span>
          )}
        </h6>
        {onShowDetail && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onShowDetail(balance)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ดูรายละเอียด</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h6 className="text-sm font-medium text-gray-900">
          {formatLeaveBalance(usedDays, usedHours, usedMinutes)} /
        </h6>
        <span className="text-xs text-gray-500">
          {formatLeaveBalance(totalDays, 0, 0)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor} animate-pulse`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>ใช้ไป {percentage}%</span>
        <span>เหลือ {Math.max(0, totalDays - usedDays)} วัน</span>
      </div>

      <div className="border-b border-gray-200 my-3" />
    </div>
  );
};

interface LeaveBalanceListProps {
  balances: LeaveBalance[];
  leaveTypes: LeaveType[];
  employeeName?: string;
  employeePosition?: string;
  employeeEmail?: string;
  employeeGmail?: string;
  onShowDetail?: (balance: LeaveBalance) => void;
}

export const LeaveBalanceList: React.FC<LeaveBalanceListProps> = ({
  balances,
  leaveTypes,
  employeeName,
  employeePosition,
  employeeEmail,
  employeeGmail,
  onShowDetail,
}) => {
  const getLeaveType = (leaveTypeId: number): LeaveType | undefined => {
    return leaveTypes.find((t) => t.id === leaveTypeId);
  };

  return (
    <div className="m-portlet bg-white rounded-lg shadow">
      <div className="m-portlet__head border-b border-gray-200 p-4">
        <div className="m-portlet__head-title flex items-center gap-2">
          <span className="m-portlet__head-icon">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </span>
          <h3 className="font-semibold text-gray-800">Leave Day Detail</h3>
        </div>
      </div>

      <div className="m-portlet__body p-4">
        {/* Employee Info */}
        {employeeName && (
          <div className="mb-4 space-y-1">
            <div className="text-sm">
              <span className="font-medium">Name : </span>
              <span>{employeeName}</span>
            </div>
            {employeePosition && (
              <div className="text-sm">
                <span className="font-medium">Position : </span>
                <span>{employeePosition}</span>
              </div>
            )}
            {employeeEmail && (
              <div className="text-sm">
                <span className="font-medium">E-mail : </span>
                <span>{employeeEmail}</span>
              </div>
            )}
            {employeeGmail && (
              <div className="text-sm">
                <span className="font-medium">G-mail : </span>
                <span>{employeeGmail}</span>
              </div>
            )}
          </div>
        )}

        <div className="h-px bg-gray-200 my-4" />

        {/* Leave Balances */}
        <div
          className="max-h-[400px] overflow-auto pr-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {balances.map((balance) => (
            <LeaveBalanceCard
              key={balance.id}
              balance={balance}
              leaveType={getLeaveType(balance.leave_type_id)}
              onShowDetail={onShowDetail}
            />
          ))}

          {balances.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              ไม่พบข้อมูลวันลา
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCard;
