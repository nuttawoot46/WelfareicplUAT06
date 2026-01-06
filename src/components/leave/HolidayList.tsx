import React from 'react';
import { Holiday } from '@/types';
import { getRelativeTime } from '@/services/leaveApi';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface HolidayListProps {
  holidays: Holiday[];
  year: number;
}

export const HolidayList: React.FC<HolidayListProps> = ({ holidays, year }) => {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="m-portlet">
      <div className="m-portlet__head bg-green-500 rounded-t-lg">
        <div className="m-portlet__head-caption p-4">
          <div className="m-portlet__head-title flex items-center gap-2">
            <span className="m-portlet__head-icon">
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
            <h3 className="m-portlet__head-text text-black font-semibold text-lg">
              Holiday (วันหยุดประจำปี {year + 543})
            </h3>
          </div>
        </div>
      </div>

      <div className="m-portlet__body p-4">
        <details className="group">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Holiday Lists ({holidays.length} วัน)
          </summary>

          <div
            className="mt-4 max-h-[300px] overflow-auto pr-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="m-list-timeline">
              <div className="m-list-timeline__items space-y-3">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="m-list-timeline__item flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="text-gray-900">
                          {formatDate(holiday.date)}
                        </strong>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        {holiday.name_th}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {getRelativeTime(holiday.date)}
                    </span>
                  </div>
                ))}

                {holidays.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    ไม่พบข้อมูลวันหยุด
                  </div>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default HolidayList;
