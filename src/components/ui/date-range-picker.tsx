import * as React from 'react';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  value: { from: Date | null; to: Date | null } | null;
  onChange: (range: { from: Date | null; to: Date | null } | null) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from && value?.to
            ? `${format(value.from, 'dd/MM/yyyy')} - ${format(value.to, 'dd/MM/yyyy')}`
            : 'เลือกช่วงวันที่'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
