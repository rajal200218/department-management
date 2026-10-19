import * as XLSX from 'xlsx';

/**
 * Clean & Professional Excel (.xlsx) Exporter for LJ University
 * @param {Array<Object>} data - Array of row objects to export
 * @param {string} fileName - Base filename (e.g. 'NUV_Departments')
 * @param {string} sheetName - Worksheet tab title (e.g. 'Departments')
 */
export function exportToExcel(data, fileName = 'NUV_Export', sheetName = 'Data') {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // 1. Convert JSON array to Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Auto-format column widths for great readability
  const keys = Object.keys(data[0] || {});
  const colWidths = keys.map((key) => {
    let maxLen = key.toString().length;
    data.forEach((row) => {
      const val = row[key] !== undefined && row[key] !== null ? row[key].toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
  });
  worksheet['!cols'] = colWidths;

  // 3. Create Workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  // 4. Generate timestamped .xlsx download
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${dateStr}.xlsx`;
  
  XLSX.writeFile(workbook, fullFileName);
}
