# Requirements Document

## Introduction

This feature creates a PDF generator that produces an exact replica of the External Training Application form (แบบขออนุมัติส่งพนักงานเข้ารับการฝึกอบรม) as shown in the provided image. The PDF will be populated with data from training welfare requests and maintain the exact layout, formatting, and Thai language content of the original form.

## Requirements

### Requirement 1

**User Story:** As an employee, I want to generate a PDF training application form that matches the exact format of the company's official form, so that I can submit a properly formatted training request.

#### Acceptance Criteria

1. WHEN a user generates a training PDF THEN the system SHALL create a PDF that exactly matches the layout shown in the reference image
2. WHEN the PDF is generated THEN the system SHALL include the company logo in the top-left corner
3. WHEN the PDF is generated THEN the system SHALL display the form title "แบบขออนุมัติส่งพนักงานเข้ารับการฝึกอบรม (External Training Application)" in the header
4. WHEN the PDF is generated THEN the system SHALL include the form code "F-TRA-01-06 Rev: 02 01/09/2023" in the top-right corner
5. WHEN the PDF is generated THEN the system SHALL include the approval workflow boxes (ต้นสังกัด → HR → VP) in the header

### Requirement 2

**User Story:** As an employee, I want my personal and training information to be automatically populated in the PDF form, so that I don't have to manually fill in the details.

#### Acceptance Criteria

1. WHEN the PDF is generated THEN the system SHALL populate the employee name from the user data
2. WHEN the PDF is generated THEN the system SHALL populate the course name from the welfare request data
3. WHEN the PDF is generated THEN the system SHALL populate the organizer/institution name from the welfare request data
4. WHEN the PDF is generated THEN the system SHALL populate the training start and end dates from the welfare request data
5. WHEN the PDF is generated THEN the system SHALL calculate and display the total number of training days
6. WHEN the PDF is generated THEN the system SHALL populate the training objectives from the welfare request details

### Requirement 3

**User Story:** As an employee, I want the financial information to be accurately calculated and displayed in the PDF form, so that the approval process includes correct cost details.

#### Acceptance Criteria

1. WHEN the PDF is generated THEN the system SHALL display the base training cost (excluding VAT)
2. WHEN the PDF is generated THEN the system SHALL calculate and display the 7% VAT amount
3. WHEN the PDF is generated THEN the system SHALL calculate and display the 3% withholding tax amount
4. WHEN the PDF is generated THEN the system SHALL calculate and display the net amount
5. WHEN the PDF is generated THEN the system SHALL calculate and display the total amount
6. WHEN the PDF is generated THEN the system SHALL display the company payment portion (50%)
7. WHEN the PDF is generated THEN the system SHALL display the employee payment portion (50%)
8. WHEN the PDF is generated THEN the system SHALL convert the net amount to Thai text format
9. WHEN the PDF is generated THEN the system SHALL display the remaining training budget

### Requirement 4

**User Story:** As an employee, I want the PDF to include signature sections for all required approvers, so that the form can be used for the complete approval workflow.

#### Acceptance Criteria

1. WHEN the PDF is generated THEN the system SHALL include four signature sections (Employee, Manager, HR, Deputy Managing Director)
2. WHEN the PDF is generated THEN each signature section SHALL include approval/rejection checkboxes
3. WHEN the PDF is generated THEN each signature section SHALL include a signature line
4. WHEN the PDF is generated THEN each signature section SHALL include a date field
5. WHEN digital signatures are available THEN the system SHALL display them in the appropriate signature sections
6. WHEN the employee has signed THEN the system SHALL mark the appropriate approval checkbox

### Requirement 5

**User Story:** As an employee, I want the PDF to include all necessary checkboxes and form elements, so that the form is complete and ready for submission.

#### Acceptance Criteria

1. WHEN the PDF is generated THEN the system SHALL include checkboxes for "ต้นสังกัด" and "ส่วนกลางในนาม"
2. WHEN the PDF is generated THEN the system SHALL include a checkbox for "ขอหนังสือรับรองจากการฝึก ณ ที่จ่าย"
3. WHEN the PDF is generated THEN the system SHALL include the current date in Thai format (day/month/Buddhist year)
4. WHEN the PDF is generated THEN the system SHALL maintain exact spacing and alignment as shown in the reference image
5. WHEN the PDF is generated THEN the system SHALL use appropriate Thai fonts for proper text rendering

### Requirement 6

**User Story:** As a user, I want to download the generated PDF file, so that I can save, print, or submit the training application form.

#### Acceptance Criteria

1. WHEN the PDF generation is complete THEN the system SHALL automatically download the PDF file
2. WHEN the PDF is downloaded THEN the filename SHALL include the employee name and timestamp
3. WHEN the PDF generation fails THEN the system SHALL display an appropriate error message
4. WHEN the PDF is generated THEN the system SHALL ensure the file is in A4 format
5. WHEN the PDF is generated THEN the system SHALL ensure high-quality rendering suitable for printing