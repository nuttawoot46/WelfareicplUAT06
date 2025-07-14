// Google Apps Script code to handle form submissions
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const jsonData = JSON.parse(e.postData.contents);
    const action = jsonData.action;
    
    if (action === 'addRequest') {
      return handleAddRequest(jsonData);
    }
    
    return createResponse(400, { error: 'Invalid action' });
  } catch (error) {
    return createResponse(500, { error: error.toString() });
  }
}

function handleAddRequest(data) {
  try {
    // Open the Google Sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Get the headers from the first row
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Prepare the new row data
    const newRow = [];
    
    // Map the data to the correct columns based on headers
    headers.forEach(header => {
      // Convert header to camelCase to match the data keys
      const key = header.toLowerCase();
      
      // Special handling for date fields
      if (key === 'createdat' && data[key]) {
        newRow.push(new Date(data[key]));
      } else {
        newRow.push(data[key] || '');
      }
    });
    
    // Add the new row to the sheet
    sheet.appendRow(newRow);
    
    return createResponse(200, { success: true, message: 'Data added successfully' });
  } catch (error) {
    return createResponse(500, { error: 'Failed to add data: ' + error.toString() });
  }
}

// Helper function to create consistent response format
function createResponse(statusCode, data) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Set CORS headers
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  // Set the status code
  response.setStatusCode(statusCode);
  
  return response;
}

// Handle OPTIONS request for CORS preflight
function doOptions() {
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600'
  });
  return response;
}
