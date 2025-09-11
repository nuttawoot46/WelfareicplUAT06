# PDF Manager Refactoring Summary

## Overview
The PDF management system has been refactored to separate different types of PDF handling into specialized managers for better maintainability and to avoid confusion between different request types.

## New Structure

### 1. Main PDF Manager (`src/utils/pdfManager.ts`)
- **Role**: Router and shared utilities
- **Functions**:
  - `createInitialPDF()` - Routes to appropriate specialized manager
  - `addSignatureToPDF()` - Routes to appropriate specialized manager
  - `downloadPDFFromDatabase()` - Shared utility for all PDF types
  - `previewPDFFromDatabase()` - Shared utility for all PDF types
  - `debugPDFColumns()` - Shared utility for debugging
  - `getActualEmployeeName()` - Shared utility function
  - `storePDFInDatabase()` - Legacy function (deprecated)

### 2. External Training PDF Manager (`src/utils/externalTrainingPdfManager.ts`)
- **Purpose**: Handles PDF generation for external training requests (`type: 'training'`)
- **Functions**:
  - `createInitialExternalTrainingPDF()` - Creates initial PDF with user signature
  - `addSignatureToExternalTrainingPDF()` - Adds manager/HR signatures
  - `generateExternalTrainingPDFAsBase64()` - Internal PDF generation
  - Helper functions: `getActualEmployeeName()`, `getEmployeeData()`

### 3. Internal Training PDF Manager (`src/utils/internalTrainingPdfManager.ts`)
- **Purpose**: Handles PDF generation for internal training requests (`type: 'internal_training'`)
- **Uses**: HTML-to-PDF generation for Thai language support
- **Functions**:
  - `createInitialInternalTrainingPDF()` - Creates initial PDF with user signature
  - `addSignatureToInternalTrainingPDF()` - Adds manager/HR signatures
  - `storeInternalTrainingPDFInDatabase()` - Stores PDF in appropriate bucket
  - Helper functions: `getActualEmployeeName()`, `getEmployeeData()`

### 4. Welfare PDF Manager (`src/utils/welfarePdfManager.ts`)
- **Purpose**: Handles PDF generation for general welfare requests (fitness, medical, etc.)
- **Functions**:
  - `createInitialWelfarePDF()` - Creates initial PDF with user signature
  - `addSignatureToWelfarePDF()` - Adds manager/HR signatures
  - `generateWelfarePDFAsBase64()` - Internal PDF generation
  - Helper functions: `getActualEmployeeName()`, `getEmployeeData()`

## Request Type Routing

The main PDF manager routes requests based on the `request_type` field:

- `'internal_training'` → Internal Training PDF Manager
- `'training'` → External Training PDF Manager  
- All other types → Welfare PDF Manager

## Benefits

1. **Separation of Concerns**: Each PDF type has its own dedicated manager
2. **Easier Maintenance**: Changes to one PDF type don't affect others
3. **Clearer Code**: Each manager focuses on specific functionality
4. **Future Extensibility**: Easy to add new PDF types by creating new managers
5. **Reduced Confusion**: No more mixed logic between different request types

## Migration Notes

- **Existing Code**: All existing imports and function calls remain the same
- **Backward Compatibility**: The main `pdfManager.ts` maintains the same API
- **New PDF Types**: Future PDF types should follow this pattern by creating dedicated managers

## Usage Example

```typescript
// Existing code continues to work unchanged
import { createInitialPDF, addSignatureToPDF } from '@/utils/pdfManager';

// The router automatically selects the appropriate manager
await createInitialPDF(request, user, employeeData);
await addSignatureToPDF(requestId, 'manager', signature, approverName);
```

## File Structure

```
src/utils/
├── pdfManager.ts                    # Main router + shared utilities
├── externalTrainingPdfManager.ts    # External training PDFs
├── internalTrainingPdfManager.ts    # Internal training PDFs
└── welfarePdfManager.ts            # General welfare PDFs
```

This refactoring provides a clean, maintainable structure while preserving all existing functionality and ensuring smooth operation of the PDF generation workflow.