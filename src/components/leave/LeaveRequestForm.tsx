import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { LeaveType, LeaveFormData, LeaveBalance } from '@/types';
import { format, differenceInDays, isWeekend, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Upload, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DigitalSignature } from '@/components/signature/DigitalSignature';
import { toast } from 'sonner';

interface LeaveRequestFormProps {
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  onSubmit: (data: LeaveFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  checkConflict?: (startDate: string, endDate: string) => Promise<boolean>;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  leaveTypes,
  leaveBalances,
  onSubmit,
  onCancel,
  isSubmitting = false,
  checkConflict,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [showSignature, setShowSignature] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [conflictWarning, setConflictWarning] = useState<string>('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    defaultValues: {
      leave_type_id: 0,
      start_date: defaultStartDate ? format(defaultStartDate, 'yyyy-MM-dd') : '',
      end_date: defaultEndDate ? format(defaultEndDate, 'yyyy-MM-dd') : '',
      start_time: '08:30',
      end_time: '17:30',
      is_half_day: false,
      half_day_period: undefined,
      reason: '',
    },
  });

  // Update form when default dates change
  useEffect(() => {
    if (defaultStartDate) {
      setValue('start_date', format(defaultStartDate, 'yyyy-MM-dd'));
    }
    if (defaultEndDate) {
      setValue('end_date', format(defaultEndDate, 'yyyy-MM-dd'));
    }
  }, [defaultStartDate, defaultEndDate, setValue]);

  const watchLeaveType = watch('leave_type_id');
  const watchStartDate = watch('start_date');
  const watchEndDate = watch('end_date');
  const watchIsHalfDay = watch('is_half_day');

  // Get selected leave type details
  const selectedLeaveType = leaveTypes.find((t) => t.id === watchLeaveType);
  const selectedBalance = leaveBalances.find((b) => b.leave_type_id === watchLeaveType);
  const remainingDays = selectedBalance?.remaining_days || 0;

  // Calculate working days
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      if (watchIsHalfDay) {
        setCalculatedDays(0.5);
      } else {
        const start = parseISO(watchStartDate);
        const end = parseISO(watchEndDate);
        let workingDays = 0;
        let currentDate = new Date(start);

        while (currentDate <= end) {
          if (!isWeekend(currentDate)) {
            workingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        setCalculatedDays(workingDays);
      }
    } else {
      setCalculatedDays(0);
    }
  }, [watchStartDate, watchEndDate, watchIsHalfDay]);

  // Check for conflicts
  useEffect(() => {
    const checkForConflicts = async () => {
      if (watchStartDate && watchEndDate && checkConflict) {
        const hasConflict = await checkConflict(watchStartDate, watchEndDate);
        if (hasConflict) {
          setConflictWarning('You have overlapping leave requests during this period');
        } else {
          setConflictWarning('');
        }
      }
    };
    checkForConflicts();
  }, [watchStartDate, watchEndDate, checkConflict]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle signature save
  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignature(false);
  };

  // Form submission
  const onFormSubmit = async (data: LeaveFormData) => {
    // Validation
    if (calculatedDays > remainingDays && remainingDays > 0) {
      toast.error('Insufficient leave balance');
      return;
    }

    if (selectedLeaveType?.requires_attachment && selectedFiles.length === 0) {
      toast.error('Attachment is required for this leave type');
      return;
    }

    if (!signature) {
      toast.error('Please provide your signature');
      return;
    }

    // Create file list
    const dt = new DataTransfer();
    selectedFiles.forEach((file) => dt.items.add(file));

    await onSubmit({
      ...data,
      attachments: dt.files,
      user_signature: signature,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Leave Request Form
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leave_type_id">Leave Type *</Label>
            <Controller
              name="leave_type_id"
              control={control}
              rules={{ required: 'Please select a leave type' }}
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => {
                      const balance = leaveBalances.find(
                        (b) => b.leave_type_id === type.id
                      );
                      return (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {type.name_en} ({type.name_th})
                            </span>
                            {balance && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({balance.remaining_days} days left)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.leave_type_id && (
              <p className="text-sm text-red-500">{errors.leave_type_id.message}</p>
            )}

            {/* Balance Info */}
            {selectedBalance && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Remaining: {remainingDays} days out of {selectedBalance.total_days} days
              </div>
            )}
          </div>

          {/* Half Day Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_half_day">Half Day Leave</Label>
            <Controller
              name="is_half_day"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Half Day Period */}
          {watchIsHalfDay && (
            <div className="space-y-2">
              <Label>Period *</Label>
              <Controller
                name="half_day_period"
                control={control}
                rules={{ required: watchIsHalfDay ? 'Please select period' : false }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (08:30 - 12:00)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (13:00 - 17:30)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Controller
                name="start_date"
                control={control}
                rules={{ required: 'Start date is required' }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(parseISO(field.value), 'PPP')
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Controller
                name="end_date"
                control={control}
                rules={{ required: 'End date is required' }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(parseISO(field.value), 'PPP')
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        disabled={(date) =>
                          watchStartDate && date < parseISO(watchStartDate)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Calculated Days */}
          {calculatedDays > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-800">
                Total: {calculatedDays} working day(s)
              </div>
              {calculatedDays > remainingDays && remainingDays > 0 && (
                <div className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  Exceeds remaining balance by {(calculatedDays - remainingDays).toFixed(1)} days
                </div>
              )}
            </div>
          )}

          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="bg-yellow-50 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">{conflictWarning}</span>
            </div>
          )}

          {/* Time Range (for non-half-day) */}
          {!watchIsHalfDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Controller
                  name="start_time"
                  control={control}
                  render={({ field }) => (
                    <Input type="time" {...field} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Controller
                  name="end_time"
                  control={control}
                  render={({ field }) => (
                    <Input type="time" {...field} />
                  )}
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Enter reason for leave request..."
                  rows={3}
                />
              )}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>
              Attachments
              {selectedLeaveType?.requires_attachment && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600 mt-2">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PDF, JPG, PNG, DOC (max 5MB each)
                </span>
              </label>
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label>Signature *</Label>
            {signature ? (
              <div className="border rounded-lg p-2">
                <img
                  src={signature}
                  alt="Signature"
                  className="max-h-24 mx-auto"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowSignature(true)}
                >
                  Change Signature
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowSignature(true)}
              >
                Add Signature
              </Button>
            )}
          </div>

          {/* Signature Dialog */}
          {showSignature && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="font-semibold mb-4">Draw Your Signature</h3>
                <DigitalSignature
                  onSave={handleSignatureSave}
                  onClear={() => {}}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowSignature(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-500 hover:bg-purple-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestForm;
