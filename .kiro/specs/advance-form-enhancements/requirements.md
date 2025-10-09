# Requirements Document

## Introduction

This specification covers enhancements to the Advance Payment Form (AdvanceForm.tsx) to improve user experience and add automatic request numbering functionality. The changes include converting the activity type from a dropdown selection to a free text input field and implementing an automatic run number generation system with the format ADV202501.

## Requirements

### Requirement 1

**User Story:** As a user filling out an advance payment form, I want to enter the activity type as free text, so that I can specify any type of activity without being limited to predefined options.

#### Acceptance Criteria

1. WHEN a user accesses the advance payment form THEN the activity type field SHALL be displayed as a text input field instead of a dropdown
2. WHEN a user types in the activity type field THEN the system SHALL accept any text input up to 255 characters
3. WHEN a user submits the form with a custom activity type THEN the system SHALL save the custom text to the database
4. WHEN a user edits an existing advance request THEN the system SHALL display the previously entered custom activity type in the text field

### Requirement 2

**User Story:** As a system administrator, I want advance payment requests to have automatic run numbers with format ADV202501, so that each request can be uniquely identified and tracked.

#### Acceptance Criteria

1. WHEN a new advance payment request is created THEN the system SHALL automatically generate a run number with format ADV + YYYYMM + sequential number
2. WHEN the first request of a month is created THEN the sequential number SHALL start at 01 (e.g., ADV202501)
3. WHEN subsequent requests are created in the same month THEN the sequential number SHALL increment (e.g., ADV202502, ADV202503)
4. WHEN a new month begins THEN the sequential number SHALL reset to 01 with the new month format
5. WHEN a request is submitted THEN the run number SHALL be stored in the database and displayed to the user
6. WHEN a user views their request history THEN each advance request SHALL display its unique run number

### Requirement 3

**User Story:** As a user, I want to see my request's run number immediately after submission, so that I can reference it for tracking purposes.

#### Acceptance Criteria

1. WHEN a user successfully submits an advance payment request THEN the system SHALL display the generated run number in the success message
2. WHEN a user views their request details THEN the run number SHALL be prominently displayed
3. WHEN a user prints or exports the PDF THEN the run number SHALL be included in the document header