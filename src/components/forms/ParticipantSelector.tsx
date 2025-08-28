import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, User } from 'lucide-react';
import { ParticipantMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParticipantSelectorProps {
  team: string;
  maxCount: number;
  selectedParticipants: ParticipantMember[];
  onParticipantsChange: (participants: ParticipantMember[]) => void;
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  team,
  maxCount,
  selectedParticipants,
  onParticipantsChange,
}) => {
  const [teamEmployees, setTeamEmployees] = useState<ParticipantMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const { toast } = useToast();

  // Fetch employees for the selected team
  useEffect(() => {
    const fetchTeamEmployees = async () => {
      if (!team) {
        setTeamEmployees([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('Employee')
          .select('id, Name, Position')
          .eq('Team', team)
          .order('Name');

        if (error) throw error;

        const employees: ParticipantMember[] = (data || []).map(emp => ({
          id: emp.id,
          name: emp.Name || 'ไม่ระบุชื่อ',
          position: emp.Position || 'ไม่ระบุตำแหน่ง',
          isCustom: false,
        }));

        setTeamEmployees(employees);
      } catch (error: any) {
        console.error('Error fetching team employees:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถดึงข้อมูลพนักงานได้',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamEmployees();
  }, [team, toast]);

  // Handle participant selection
  const handleParticipantToggle = (participant: ParticipantMember, checked: boolean) => {
    if (checked) {
      if (selectedParticipants.length >= maxCount) {
        toast({
          title: 'เกินจำนวนที่กำหนด',
          description: `สามารถเลือกได้สูงสุด ${maxCount} คน`,
          variant: 'destructive',
        });
        return;
      }
      onParticipantsChange([...selectedParticipants, participant]);
    } else {
      onParticipantsChange(selectedParticipants.filter(p => 
        p.isCustom ? p.name !== participant.name : p.id !== participant.id
      ));
    }
  };

  // Add custom participant
  const handleAddCustom = () => {
    if (!customName.trim()) {
      toast({
        title: 'กรุณากรอกชื่อ',
        description: 'ชื่อผู้เข้าร่วมไม่สามารถเว้นว่างได้',
        variant: 'destructive',
      });
      return;
    }

    if (selectedParticipants.length >= maxCount) {
      toast({
        title: 'เกินจำนวนที่กำหนด',
        description: `สามารถเลือกได้สูงสุด ${maxCount} คน`,
        variant: 'destructive',
      });
      return;
    }

    const customParticipant: ParticipantMember = {
      name: customName.trim(),
      position: customPosition.trim() || 'ไม่ระบุตำแหน่ง',
      isCustom: true,
    };

    onParticipantsChange([...selectedParticipants, customParticipant]);
    setCustomName('');
    setCustomPosition('');
    setShowAddCustom(false);
  };

  // Remove participant
  const handleRemoveParticipant = (participant: ParticipantMember) => {
    onParticipantsChange(selectedParticipants.filter(p => 
      p.isCustom ? p.name !== participant.name : p.id !== participant.id
    ));
  };

  if (!team) {
    return (
      <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50">
        กรุณาเลือกทีมก่อนเพื่อเลือกผู้เข้าร่วม
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">
          เลือกผู้เข้าร่วมจากทีม {team} ({selectedParticipants.length}/{maxCount})
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          เพิ่มชื่อ
        </Button>
      </div>

      {/* Add custom participant form */}
      {showAddCustom && (
        <div className="space-y-2 p-3 border rounded bg-white">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="ชื่อ-นามสกุล"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="ตำแหน่ง (ไม่บังคับ)"
              value={customPosition}
              onChange={(e) => setCustomPosition(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustom}
              className="text-xs"
            >
              เพิ่ม
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddCustom(false);
                setCustomName('');
                setCustomPosition('');
              }}
              className="text-xs"
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-sm text-gray-500 p-2">
          กำลังโหลดข้อมูลพนักงาน...
        </div>
      )}

      {/* Employee list */}
      {!loading && teamEmployees.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-medium text-gray-600 mb-2">
            พนักงานในทีม:
          </div>
          {teamEmployees.map((employee) => {
            const isSelected = selectedParticipants.some(p => p.id === employee.id);
            return (
              <div key={employee.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleParticipantToggle(employee, checked as boolean)}
                  disabled={!isSelected && selectedParticipants.length >= maxCount}
                />
                <User className="h-4 w-4 text-gray-400" />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-xs text-gray-500">{employee.position}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No employees found */}
      {!loading && teamEmployees.length === 0 && (
        <div className="text-sm text-gray-500 p-2">
          ไม่พบพนักงานในทีมนี้
        </div>
      )}

      {/* Selected participants */}
      {selectedParticipants.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600">
            ผู้เข้าร่วมที่เลือก:
          </div>
          <div className="space-y-1">
            {selectedParticipants.map((participant, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-xs text-gray-500">
                      {participant.position}
                      {participant.isCustom && (
                        <span className="ml-1 text-orange-500">(เพิ่มเอง)</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParticipant(participant)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};