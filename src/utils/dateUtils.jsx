/**
 * Format a timestamp string to DD/MM/YYYY HH:MM:SS without any timezone conversion
 * This function parses the date string directly to avoid JavaScript's automatic timezone handling
 * 
 * @param {string} timestamp - The timestamp string from the database
 * @returns {JSX.Element|string} - Formatted date display or "—" if invalid
 */
export function formatTimestampWithTime(timestamp) {
  if (!timestamp || timestamp === "" || timestamp === null) {
    return "—";
  }

  try {
    // Convert timestamp to string for processing
    let dateStr = String(timestamp);
    
    // Clean up the string: remove 'T', milliseconds, timezone indicators
    dateStr = dateStr
      .replace('T', ' ')
      .replace(/\\.\\d+Z?$/, '') // remove .000 or .000Z
      .replace(/Z$/, '') // remove trailing Z
      .replace(/[+-]\\d{2}:\\d{2}$/, ''); // remove timezone offset like +05:30
    
    // Try to parse as "YYYY-MM-DD HH:MM:SS" format
    const parts = dateStr.trim().split(' ');
    
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      
      const dateComponents = datePart.split('-');
      if (dateComponents.length === 3) {
        const [year, month, day] = dateComponents;
        
        // Validate and format
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);
        
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
          const formattedTime = timePart || '00:00:00';
          
          return (
            <div>
              <div className="font-medium">{formattedDate}</div>
              <div className="text-xs text-gray-500">{formattedTime}</div>
            </div>
          );
        }
      }
    }
    
    // If single part (date only), try to parse just the date
    if (parts.length === 1) {
      const dateComponents = parts[0].split('-');
      if (dateComponents.length === 3) {
        const [year, month, day] = dateComponents;
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);
        
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }
    }
    
    // Last resort: return the timestamp as-is
    return timestamp;
  } catch (error) {
    console.error('Error formatting timestamp:', error, timestamp);
    return "—";
  }
}

/**
 * Format a timestamp string to DD/MM/YYYY without any timezone conversion
 * 
 * @param {string} timestamp - The timestamp string from the database
 * @returns {string} - Formatted date or "—" if invalid
 */
export function formatTimestampToDDMMYYYY(timestamp) {
  if (!timestamp || timestamp === "" || timestamp === null) {
    return "—";
  }

  try {
    let dateStr = String(timestamp);
    
    // Clean up the string
    dateStr = dateStr
      .replace('T', ' ')
      .replace(/\\.\\d+Z?$/, '')
      .replace(/Z$/, '')
      .replace(/[+-]\\d{2}:\\d{2}$/, '');
    
    // Extract date part (before space or entire string)
    const datePart = dateStr.split(' ')[0];
    const dateComponents = datePart.split('-');
    
    if (dateComponents.length === 3) {
      const [year, month, day] = dateComponents;
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    
    return timestamp;
  } catch (error) {
    console.error('Error formatting date:', error, timestamp);
    return "—";
  }
}

/**
 * Format a date/time string for display - simplified version for delegation data
 * 
 * @param {string} dateStr - The date string from the database
 * @returns {string} - Formatted date or "—" if invalid
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  
  try {
    let cleanStr = String(dateStr);
    
    // Clean up the string
    cleanStr = cleanStr
      .replace('T', ' ')
      .replace(/\\.\\d+Z?$/, '')
      .replace(/Z$/, '')
      .replace(/[+-]\\d{2}:\\d{2}$/, '');
    
    // Extract date part
    const datePart = cleanStr.split(' ')[0];
    const dateComponents = datePart.split('-');
    
    if (dateComponents.length === 3) {
      const [year, month, day] = dateComponents;
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    
    return dateStr;
  } catch (error) {
    console.error('Error formatting date:', error, dateStr);
    return "—";
  }
}

/**
 * Format task start date with both date and time for checklist display
 * Returns a JSX element with date on one line and time on another
 * 
 * @param {string} dateStr - The date string from the database
 * @returns {JSX.Element|string} - Formatted date/time display or "—" if invalid
 */
export function formatTaskStartDate(dateStr) {
  if (!dateStr) return "—";
  
  try {
    let cleanStr = String(dateStr);
    
    // Clean up the string: remove 'T', milliseconds, timezone indicators
    cleanStr = cleanStr
      .replace('T', ' ')
      .replace(/\\.\\d+Z?$/, '')
      .replace(/Z$/, '')
      .replace(/[+-]\\d{2}:\\d{2}$/, '');
    
    const parts = cleanStr.trim().split(' ');
    
    if (parts.length >= 2) {
      const [datePart, timePart] = parts;
      const dateComponents = datePart.split('-');
      
      if (dateComponents.length === 3) {
        const [y, m, d] = dateComponents;
        
        return (
          <div>
            <div className="font-medium break-words">
              {d}/{m}/{y}
            </div>
            <div className="text-xs text-gray-500 break-words">
              {timePart}
            </div>
          </div>
        );
      }
    }
    
    // If just date without time
    if (parts.length === 1) {
      const dateComponents = parts[0].split('-');
      if (dateComponents.length === 3) {
        const [y, m, d] = dateComponents;
        return `${d}/${m}/${y}`;
      }
    }
    
    return dateStr;
  } catch (error) {
    console.error('Error formatting task start date:', error, dateStr);
    return "—";
  }
}
