# Design Document

## Overview

This design enhances the internal training form's participant selection mechanism by replacing the simple team/count input with a comprehensive participant selection interface. The solution provides team member selection with checkboxes, participant count validation, and the ability to add new participants dynamically.

## Architecture

### Component Structure
```
WelfareForm (existing)
├── ParticipantSelectionSection (new)
│   ├── TeamParticipantSelector (new)
│   │   ├── TeamDropdown (existing, enhanced)
│   │   ├── ParticipantCountInput (existing, enhanced)
│   │   ├── ParticipantCheckboxList (new)
│   │   └── AddNewParticipantModal (new)
│   └── ParticipantSummary (new)
```

### Data Flow
1. User selects team → Fetch team members from database
2. User enters participant count → Enable/limit checkbox selections
3. User selects participants → Update form state and total count
4. User adds new participant → Update local state and available options
5. Form submission → Include detailed participant data

## Components and Interfaces

### ParticipantSelectionSection Component
```typescript
interface ParticipantSelectionProps {
  participants: TeamParticipant[];
  onParticipantsChange: (participants: TeamParticipant[]) => void;
  teams: string[];
}

interface TeamParticipant {
  id?: number;
  team: string;
  count: number;
  selectedMembers: ParticipantMember[];
}

interface ParticipantMember {
  id?: number;
  name: string;
  position?: string;
  isNewParticipant?: boolean;
}
```

### TeamParticipantSelector Component
```typescript
interface TeamParticipantSelectorProps {
  teamIndex: number;
  participant: TeamParticipant;
  availableTeams: string[];
  onTeamChange: (teamIndex: number, team: string) => void;
  onCountChange: (teamIndex: number, count: number) => void;
  onMembersChange: (teamIndex: number, members: ParticipantMember[]) => void;
  onRemove: (teamIndex: number) => void;
}
```

### ParticipantCheckboxList Component
```typescript
interface ParticipantCheckboxListProps {
  team: string;
  maxSelections: number;
  selectedMembers: ParticipantMember[];
  onSelectionChange: (members: ParticipantMember[]) => void;
}
```

### AddNewParticipantModal Component
```typescript
interface AddNewParticipantModalProps {
  isOpen: boolean;
  team: string;
  onClose: () => void;
  onAdd: (participant: ParticipantMember) => void;
}
```

## Data Models

### Database Schema Enhancement
```sql
-- New table for storing detailed participant information
CREATE TABLE internal_training_participants (
  id SERIAL PRIMARY KEY,
  training_request_id INTEGER REFERENCES internal_training_requests(id),
  team VARCHAR(100) NOT NULL,
  participant_name VARCHAR(200) NOT NULL,
  participant_position VARCHAR(100),
  is_new_participant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Form Data Structure
```typescript
interface InternalTrainingFormData {
  // ... existing fields
  participants: TeamParticipant[];
  totalParticipants: number;
  detailedParticipants: ParticipantMember[]; // Flattened list for submission
}
```

## Error Handling

### Validation Rules
1. **Participant Count Validation**: Selected members must match specified count
2. **Team Selection Validation**: Each team must have at least one participant if count > 0
3. **Duplicate Prevention**: Prevent selecting the same person multiple times across teams
4. **Required Fields**: Participant name is required for new participants

### Error States
```typescript
interface ParticipantValidationErrors {
  teamErrors: { [teamIndex: number]: string };
  countMismatchErrors: { [teamIndex: number]: string };
  duplicateParticipantErrors: string[];
  newParticipantErrors: { [field: string]: string };
}
```

### Error Messages
- "กรุณาเลือกผู้เข้าร่วมให้ครบตามจำนวนที่ระบุ" (Please select participants according to specified count)
- "ผู้เข้าร่วมคนนี้ถูกเลือกแล้วในทีมอื่น" (This participant is already selected in another team)
- "กรุณากรอกชื่อผู้เข้าร่วม" (Please enter participant name)

## Testing Strategy

### Unit Tests
1. **ParticipantSelectionSection**: Test participant state management
2. **TeamParticipantSelector**: Test team selection and count validation
3. **ParticipantCheckboxList**: Test checkbox selection limits
4. **AddNewParticipantModal**: Test new participant addition

### Integration Tests
1. **Form Submission**: Test complete participant data submission
2. **Data Persistence**: Test saving and loading participant selections
3. **Validation Flow**: Test error handling and validation messages

### User Acceptance Tests
1. **Complete Participant Selection Flow**: End-to-end participant selection
2. **Add New Participant Flow**: Adding and selecting new participants
3. **Form Edit Flow**: Editing existing training requests with participants
4. **Error Handling Flow**: Testing validation and error recovery

## Implementation Considerations

### Performance Optimizations
1. **Lazy Loading**: Load team members only when team is selected
2. **Debounced Search**: Implement search functionality for large team lists
3. **Memoization**: Cache team member lists to avoid repeated API calls

### Accessibility
1. **Keyboard Navigation**: Full keyboard support for participant selection
2. **Screen Reader Support**: Proper ARIA labels and descriptions
3. **Focus Management**: Logical focus flow through selection interface

### Mobile Responsiveness
1. **Touch-Friendly**: Larger touch targets for mobile devices
2. **Responsive Layout**: Adapt layout for smaller screens
3. **Modal Optimization**: Optimize modals for mobile viewing

### Data Migration
1. **Backward Compatibility**: Handle existing training requests without detailed participants
2. **Migration Script**: Convert existing participant counts to detailed records where possible
3. **Fallback Handling**: Graceful degradation for incomplete participant data