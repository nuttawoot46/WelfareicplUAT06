# Design Document

## Overview

The External Training PDF Form Generator creates an exact replica of the company's official training application form (F-TRA-01-06) using HTML-to-PDF conversion. The component will take training welfare request data and user information to populate a pixel-perfect recreation of the form shown in the reference image.

## Architecture

### Component Structure
```
ExternalTrainingPDFGenerator/
├── ExternalTrainingPDFGenerator.tsx (Main component)
├── utils/
│   ├── thaiNumberConverter.ts (Number to Thai text conversion)
│   ├── dateFormatter.ts (Thai date formatting)
│   └── pdfGenerator.ts (HTML to PDF conversion)
└── templates/
    └── trainingFormTemplate.ts (HTML template)
```

### Technology Stack
- **jsPDF**: PDF generation library
- **html2canvas**: HTML to canvas conversion for high-quality rendering
- **React**: Component framework
- **TypeScript**: Type safety

## Components and Interfaces

### Main Component Interface
```typescript
interface ExternalTrainingPDFGeneratorProps {
  welfareData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    manager_name?: string;
  };
  userSignature?: string;
  managerSignature?: string;
  hrSignature?: string;
  remainingBudget?: number;
}
```

### PDF Template Data Interface
```typescript
interface TrainingFormData {
  // Header Information
  formCode: string;
  currentDate: ThaiDate;
  
  // Employee Information
  employeeName: string;
  employeePosition: string;
  employeeDepartment: string;
  managerName: string;
  
  // Training Information
  courseName: string;
  organizer: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  trainingObjectives: string[];
  
  // Financial Information
  baseCost: number;
  vatAmount: number;
  withholdingTax: number;
  netAmount: number;
  totalAmount: number;
  companyPayment: number;
  employeePayment: number;
  netAmountText: string;
  remainingBudget: number;
  
  // Signatures
  userSignature?: string;
  managerSignature?: string;
  hrSignature?: string;
  
  // Checkboxes
  isCompleted: boolean;
  requestTaxCertificate: boolean;
}

interface ThaiDate {
  day: string;
  month: string;
  year: string; // Buddhist year
}
```

## Data Models

### Training Objectives Parsing
The system will parse training objectives from the `training_topics` or `details` field:
1. **JSON Array**: Parse as structured data
2. **Comma/Line Separated**: Split by delimiters
3. **Fallback**: Use default objectives if parsing fails

### Financial Calculations
```typescript
interface FinancialCalculation {
  baseCost: number; // From welfareData.amount
  vatAmount: number; // baseCost * 0.07
  withholdingTax: number; // baseCost * 0.03
  totalAmount: number; // baseCost + vatAmount
  netAmount: number; // totalAmount - withholdingTax
  companyPayment: number; // baseCost * 0.5
  employeePayment: number; // baseCost * 0.5
}
```

### Thai Number Conversion
```typescript
interface ThaiNumberConverter {
  convertToThaiText(amount: number): string;
  // Converts numbers like 1,799.00 to "หนึ่งพันเจ็ดร้อยเก้าสิบเก้าบาทถ้วน"
}
```

## Error Handling

### Data Validation
1. **Required Fields**: Validate essential data before PDF generation
2. **Fallback Values**: Provide defaults for missing optional data
3. **Type Safety**: Ensure proper data types throughout the pipeline

### PDF Generation Errors
1. **Canvas Rendering**: Handle html2canvas failures gracefully
2. **PDF Creation**: Catch jsPDF errors and provide user feedback
3. **File Download**: Handle browser download restrictions

### Error Recovery
```typescript
interface ErrorHandling {
  validateRequiredData(data: TrainingFormData): ValidationResult;
  handleMissingData(field: string): string | number;
  logGenerationError(error: Error): void;
  showUserError(message: string): void;
}
```

## Testing Strategy

### Unit Tests
1. **Thai Number Conversion**: Test various number formats and edge cases
2. **Date Formatting**: Verify Thai Buddhist calendar conversion
3. **Financial Calculations**: Ensure accurate tax and total calculations
4. **Data Parsing**: Test training objectives parsing with different formats

### Integration Tests
1. **PDF Generation**: Test complete PDF creation workflow
2. **Template Rendering**: Verify HTML template renders correctly
3. **Signature Integration**: Test digital signature embedding
4. **Download Functionality**: Verify file download works across browsers

### Visual Tests
1. **Layout Accuracy**: Compare generated PDF with reference image
2. **Font Rendering**: Ensure Thai text displays correctly
3. **Alignment**: Verify precise positioning of form elements
4. **Print Quality**: Test PDF quality at various zoom levels

## Implementation Approach

### Phase 1: Core Template
1. Create HTML template matching exact layout
2. Implement basic data population
3. Set up PDF generation pipeline

### Phase 2: Data Integration
1. Implement Thai number conversion
2. Add financial calculations
3. Parse training objectives

### Phase 3: Signatures & Polish
1. Integrate digital signatures
2. Add checkbox logic
3. Optimize rendering quality

### Phase 4: Testing & Refinement
1. Cross-browser testing
2. Print quality verification
3. Performance optimization

## Performance Considerations

### Rendering Optimization
- Use appropriate canvas scale for quality vs. performance
- Optimize HTML structure for faster rendering
- Cache converted images (logo, signatures)

### Memory Management
- Clean up temporary DOM elements
- Release canvas resources after PDF generation
- Limit concurrent PDF generations

## Security Considerations

### Data Handling
- Sanitize user input before template insertion
- Validate signature data integrity
- Ensure no sensitive data leaks in error messages

### File Generation
- Generate PDFs client-side to avoid server data exposure
- Use secure random filenames
- Implement proper cleanup of temporary resources