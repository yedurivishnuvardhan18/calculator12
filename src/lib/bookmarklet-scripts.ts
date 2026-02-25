// Bookmarklet scripts that run on the GITAM portal pages
// These are self-contained JS snippets that extract DOM data and copy JSON to clipboard

export function getGradesBookmarklet(): string {
  const script = `
(function(){
  try {
    var rows = document.querySelectorAll('table tbody tr');
    if (!rows.length) { alert('No grades table found. Make sure you are on the Grades/Results page.'); return; }
    var grades = [];
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        grades.push({
          code: (cells[0]||{}).textContent.trim(),
          name: (cells[1]||{}).textContent.trim(),
          credits: parseFloat((cells[2]||{}).textContent.trim()) || 0,
          internal: (cells[3]||{}).textContent.trim(),
          external: (cells[4]||{}).textContent.trim(),
          grade: (cells[5]||{}).textContent.trim(),
          gradePoint: parseFloat((cells[6]||{}).textContent.trim()) || null
        });
      }
    });
    var semSelect = document.querySelector('select[name*="sem"], select[id*="sem"], select');
    var semester = semSelect ? semSelect.options[semSelect.selectedIndex].text : 'Unknown';
    var output = JSON.stringify({ type:'gitam-grades', version:1, semester:semester, extractedAt:new Date().toISOString(), data:grades }, null, 2);
    navigator.clipboard.writeText(output).then(function(){
      alert('Grades extracted! ' + grades.length + ' subjects copied to clipboard. Go to HabbitTrackerPro and paste.');
    }).catch(function(){
      prompt('Copy this JSON:', output);
    });
  } catch(e) { alert('Error extracting grades: ' + e.message); }
})();
  `.trim();
  return `javascript:${encodeURIComponent(script)}`;
}

export function getAttendanceBookmarklet(): string {
  const script = `
(function(){
  try {
    var rows = document.querySelectorAll('table tbody tr');
    if (!rows.length) { alert('No attendance table found. Make sure you are on the Attendance page.'); return; }
    var attendance = [];
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        var pctText = (cells[cells.length-1]||cells[3]||{}).textContent.trim().replace('%','');
        attendance.push({
          code: (cells[0]||{}).textContent.trim(),
          name: (cells[1]||{}).textContent.trim(),
          present: parseInt((cells[2]||{}).textContent.trim()) || 0,
          total: parseInt((cells[3]||{}).textContent.trim()) || 0,
          percentage: parseFloat(pctText) || 0
        });
      }
    });
    var output = JSON.stringify({ type:'gitam-attendance', version:1, extractedAt:new Date().toISOString(), data:attendance }, null, 2);
    navigator.clipboard.writeText(output).then(function(){
      alert('Attendance extracted! ' + attendance.length + ' subjects copied to clipboard. Go to HabbitTrackerPro and paste.');
    }).catch(function(){
      prompt('Copy this JSON:', output);
    });
  } catch(e) { alert('Error extracting attendance: ' + e.message); }
})();
  `.trim();
  return `javascript:${encodeURIComponent(script)}`;
}
