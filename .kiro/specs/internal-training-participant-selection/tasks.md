# Implementation Plan

- [ ] 1. Create database schema for detailed participant tracking
  - Create migration file for internal_training_participants table
  - Add foreign key relationships to internal_training_requests
  - Include fields for participant name, position, team, and custom flag
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 2. Update FormValues interface and data structures
  - Extend participants interface to include selectedMembers array
  - Add ParticipantMember interface with name, position, and isNewParticipant fields
  - Update form validation schema for new participant selection
  - _Requirements: 4.1, 4.2_

- [ ] 3. Create team member data fetching service
  - Implement API service to fetch team members from Employee table
  - Add caching mechanism for team member lists
  - Handle error states for missing team data
  - _Requirements: 1.1, 5.3_

- [ ] 4. Build ParticipantCheckboxList component
  - Create checkbox list component for team member selection
  - Implement selection limit validation based on participant count
  - Add visual indicators for selection status and limits
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 5. Create AddNewParticipantModal component
  - Build modal form for adding new participants
  - Include name and position input fields with validation
  - Implement add participant functionality to local state
  - _Requirements: 2.1, 2.2, 2.3_- 
[ ] 6. Enhance TeamParticipantSelector component
  - Replace simple count input with detailed participant selection
  - Integrate ParticipantCheckboxList and AddNewParticipantModal
  - Add validation for count vs selected participants mismatch
  - _Requirements: 1.2, 1.3, 2.4_

- [ ] 7. Create ParticipantSummary component
  - Build summary display showing selected participants by team
  - Include participant names, positions, and team information
  - Add remove participant functionality from summary view
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8. Update form submission logic
  - Modify processFormSubmission to include detailed participant data
  - Update internal training data structure for database storage
  - Ensure participant information is included in PDF generation
  - _Requirements: 4.3, 5.2_

- [ ] 9. Implement form validation and error handling
  - Add validation for participant count vs selected members
  - Implement duplicate participant prevention across teams
  - Create user-friendly error messages in Thai
  - _Requirements: 1.3, 1.4, 2.4_

- [ ] 10. Update PDF generation for detailed participants
  - Modify InternalTrainingPDFGenerator to include participant names
  - Format participant list by team in PDF output
  - Handle both existing and new participant data in PDF
  - _Requirements: 4.3, 5.2_

- [ ] 11. Add data persistence and retrieval
  - Update form reset and prefill logic for edit mode
  - Implement participant data loading from database
  - Handle backward compatibility with existing simple participant data
  - _Requirements: 4.4, 5.4_

- [ ] 12. Create comprehensive test coverage
  - Write unit tests for all new components
  - Add integration tests for participant selection flow
  - Test form validation and error handling scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_