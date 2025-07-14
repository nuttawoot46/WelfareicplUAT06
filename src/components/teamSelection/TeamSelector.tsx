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
      <SelectTrigger 
        id="team" 
        className="w-full border-2 border-transparent bg-clip-padding"
        style={{
          backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, rgb(111 133 200) 2.64%, rgb(240, 191, 170) 39.56%, rgb(225, 158, 200) 69.51%, rgb(108, 161, 199) 102.42%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
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
