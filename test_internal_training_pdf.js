// Simple test for Internal Training PDF Generator
import { generateInternalTrainingPDF } from './src/components/pdf/InternalTrainingPDFGenerator.tsx';

const testRequest = {
  id: 1,
  type: 'internal_training',
  status: 'pending_manager',
  userName: 'Test User',
  userDepartment: 'HR',
  amount: 50000,
  date: new Date().toISOString(),
  details: 'Test internal training request',
  course_name: 'MBTI Training 2025',
  department: 'ฝ่ายทรัพยากรบุคคล',
  branch: 'สำนักงานสุรวงศ์',
  start_date: '2025-01-15',
  end_date: '2025-01-15',
  start_time: '09:00',
  end_time: '17:00',
  total_hours: 8,
  venue: 'ห้องประชุม A',
  total_participants: 25,
  participants: JSON.stringify([
    { team: 'Management', count: 5, selectedParticipants: [] },
    { team: 'Account', count: 10, selectedParticipants: [] },
    { team: 'Marketing(PES)', count: 10, selectedParticipants: [] }
  ]),
  instructor_fee: 15000,
  room_food_beverage: 25000,
  other_expenses: 10000,
  withholding_tax: 1500,
  vat: 3500,
  total_amount: 50000,
  average_cost_per_person: 2000,
  tax_certificate_name: 'บริษัท ไอซีพี ลาดดา จำกัด',
  withholding_tax_amount: 1500,
  additional_notes: 'หมายเหตุเพิ่มเติม',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

const testEmployeeData = {
  Name: 'Test Employee',
  Position: 'Manager',
  Team: 'HR',
  start_date: '2024-01-01'
};

async function testPDFGeneration() {
  try {
    console.log('Testing Internal Training PDF Generation...');
    const pdfBlob = await generateInternalTrainingPDF(testRequest, testUser, testEmployeeData);
    console.log('PDF generated successfully!');
    console.log('PDF size:', pdfBlob.size, 'bytes');
    console.log('PDF type:', pdfBlob.type);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
}

// Run test
testPDFGeneration().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
});