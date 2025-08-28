# Requirements Document

## Introduction

This feature enhances the internal training form (อบรมภายใน) by improving the participant selection process. Instead of just selecting teams and entering counts, users will be able to select specific team members by name, with the ability to add new participants if they're not in the existing list.

## Requirements

### Requirement 1

**User Story:** As a training organizer, I want to select specific team members for internal training, so that I can accurately track who will participate in the training session.

#### Acceptance Criteria

1. WHEN I select a team from the dropdown THEN the system SHALL display a list of available team members
2. WHEN I enter a participant count THEN the system SHALL limit my selection to exactly that number of participants
3. WHEN I try to select more participants than the specified count THEN the system SHALL prevent the selection and show an error message
4. WHEN I select fewer participants than the specified count THEN the system SHALL show a warning indicating remaining selections needed

### Requirement 2

**User Story:** As a training organizer, I want to add new participants who are not in the existing team list, so that I can include external participants or new team members.

#### Acceptance Criteria

1. WHEN I cannot find a participant in the team member list THEN the system SHALL provide an "Add New Participant" option
2. WHEN I click "Add New Participant" THEN the system SHALL show a form to enter participant details (name, position)
3. WHEN I add a new participant THEN the system SHALL include them in the selectable list for that team
4. WHEN I add a new participant THEN the system SHALL count them towards the total participant count

### Requirement 3

**User Story:** As a training organizer, I want to see a clear overview of selected participants, so that I can verify the training attendee list before submission.

#### Acceptance Criteria

1. WHEN I select participants THEN the system SHALL display a summary of selected participants by team
2. WHEN I view the participant summary THEN the system SHALL show participant names, teams, and positions
3. WHEN I change team selections THEN the system SHALL update the total participant count automatically
4. WHEN I remove a participant THEN the system SHALL update the count and allow me to select a replacement

### Requirement 4

**User Story:** As a training organizer, I want the participant selection to integrate seamlessly with the existing form, so that the overall user experience remains consistent.

#### Acceptance Criteria

1. WHEN I use the enhanced participant selection THEN the system SHALL maintain all existing form functionality
2. WHEN I submit the form THEN the system SHALL include detailed participant information in the submission
3. WHEN I save a draft THEN the system SHALL preserve selected participant details
4. WHEN I edit an existing training request THEN the system SHALL restore previously selected participants

### Requirement 5

**User Story:** As a system administrator, I want participant data to be properly stored and retrieved, so that training records are complete and accurate.

#### Acceptance Criteria

1. WHEN participants are selected THEN the system SHALL store participant details in the database
2. WHEN a training request is submitted THEN the system SHALL include participant information in generated PDFs
3. WHEN participant data is retrieved THEN the system SHALL handle both existing and newly added participants
4. WHEN the system encounters missing participant data THEN the system SHALL gracefully handle the error and allow manual entry