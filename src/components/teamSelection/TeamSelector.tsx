
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamSelectorProps {
  teams: string[];
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  isLoading: boolean;
}

export const TeamSelector = ({ teams, selectedTeam, onTeamChange, isLoading }: TeamSelectorProps) => {
  return (
    <Select value={selectedTeam} onValueChange={onTeamChange}>
      <SelectTrigger id="team" className="w-full">
        <SelectValue placeholder="เลือกทีม" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>กำลังโหลด...</SelectItem>
        ) : teams.length > 0 ? (
          teams.map((teamName) => (
            <SelectItem key={teamName} value={teamName}>
              {teamName}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="empty" disabled>ไม่พบข้อมูลทีม</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
