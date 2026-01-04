import Papa from 'papaparse';

// Database column definitions
export const CHECKLIST_COLUMNS = [
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'given_by', label: 'Given By', type: 'text' },
  { key: 'name', label: 'Name (Doer)', type: 'text', required: true },
  { key: 'task_description', label: 'Task Description', type: 'text', required: true },
  { key: 'enable_reminder', label: 'Enable Reminder', type: 'select', options: ['yes', 'no'] },
  { key: 'require_attachment', label: 'Require Attachment', type: 'select', options: ['yes', 'no'] },
  { key: 'frequency', label: 'Frequency', type: 'text' },
  { key: 'remark', label: 'Remark', type: 'text' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'image', label: 'Image URL', type: 'text' },
  { key: 'admin_done', label: 'Admin Done', type: 'text' },
  { key: 'delay', label: 'Delay', type: 'text' },
  { key: 'planned_date', label: 'Planned Date', type: 'datetime' },
  { key: 'task_start_date', label: 'Task Start Date', type: 'datetime' },
  { key: 'submission_date', label: 'Submission Date', type: 'datetime' }
];

export const DELEGATION_COLUMNS = [...CHECKLIST_COLUMNS];

/**
 * Parse CSV file using PapaParse
 * @param {File} file - The CSV file to parse
 * @returns {Promise} - Promise resolving to parsed data
 */
export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')));
        } else {
          resolve({
            headers: results.meta.fields || [],
            data: results.data
          });
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Auto-match CSV headers to database columns
 * @param {Array} csvHeaders - Headers from CSV file
 * @param {Array} dbColumns - Database column definitions
 * @returns {Object} - Mapping of CSV headers to DB columns
 */
export const mapColumns = (csvHeaders, dbColumns) => {
  const mapping = {};
  
  csvHeaders.forEach(csvHeader => {
    const normalizedCsvHeader = csvHeader.toLowerCase().trim().replace(/[_\s-]/g, '');
    
    // Try to find exact or similar match
    const match = dbColumns.find(dbCol => {
      const normalizedDbKey = dbCol.key.toLowerCase().replace(/[_\s-]/g, '');
      const normalizedDbLabel = dbCol.label.toLowerCase().replace(/[_\s-]/g, '');
      
      return normalizedCsvHeader === normalizedDbKey || 
             normalizedCsvHeader === normalizedDbLabel ||
             normalizedCsvHeader.includes(normalizedDbKey) ||
             normalizedDbKey.includes(normalizedCsvHeader);
    });
    
    if (match) {
      mapping[csvHeader] = match.key;
    } else {
      mapping[csvHeader] = null; // Unmapped column
    }
  });
  
  return mapping;
};

/**
 * Validate a row of data
 * @param {Object} row - Row data
 * @param {Object} columnMapping - Mapping of CSV headers to DB columns
 * @param {Array} selectedColumns - Array of selected DB column keys
 * @param {Array} dbColumns - Database column definitions
 * @returns {Array} - Array of validation errors
 */
export const validateRowData = (row, columnMapping, selectedColumns, dbColumns) => {
  const errors = [];
  
  // Check required fields
  dbColumns.forEach(dbCol => {
    if (dbCol.required && selectedColumns.includes(dbCol.key)) {
      // Find if this column is mapped from any CSV header
      const csvHeader = Object.keys(columnMapping).find(
        header => columnMapping[header] === dbCol.key
      );
      
      if (!csvHeader || !row[csvHeader] || row[csvHeader].trim() === '') {
        errors.push(`Missing required field: ${dbCol.label}`);
      }
    }
  });
  
  return errors;
};

/**
 * Prepare data for import API
 * @param {Array} parsedData - Parsed CSV data
 * @param {Object} columnMapping - Mapping of CSV headers to DB columns
 * @param {Array} selectedColumns - Array of selected DB column keys
 * @returns {Array} - Array of data objects ready for API
 */
export const prepareImportData = (parsedData, columnMapping, selectedColumns) => {
  return parsedData.map(row => {
    const preparedRow = {};
    
    // Map only selected columns
    Object.entries(columnMapping).forEach(([csvHeader, dbColumn]) => {
      if (dbColumn && selectedColumns.includes(dbColumn)) {
        preparedRow[dbColumn] = row[csvHeader] || null;
      }
    });
    
    return preparedRow;
  });
};

/**
 * Get preview data for display
 * @param {Array} parsedData - Parsed CSV data
 * @param {Object} columnMapping - Mapping of CSV headers to DB columns
 * @param {number} maxRows - Maximum rows to preview
 * @returns {Array} - Preview data
 */
export const getPreviewData = (parsedData, columnMapping, maxRows = 5) => {
  return parsedData.slice(0, maxRows);
};
