const $ = (id) => document.getElementById(id);
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('attendanceDate').value = localDate;
let students = [];
let attendanceDraft = {};
let toastTimer;

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {'Content-Type':'application/json', ...(options.headers || {})},
    ...options
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (_) {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
}
function selectedDate() { return $('attendanceDate').value || localDate; }
function initials(name) {
  return String(name).trim().split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toUpperCase();
}
async function refreshAll() {
  try {
    students = await api('/api/students');
    await Promise.all([renderStudents(), renderAttendance(), renderSummary(), renderRecords()]);
  } catch (error) {
    showToast(`Could not load data: ${error.message}`);
  }
}
function renderStudents() {
  $('studentCount').textContent = `${students.length} student${students.length === 1 ? '' : 's'}`;
  $('studentsBody').innerHTML = students.length ? students.map(s => `
    <tr>
      <td><span class="student-name">${escapeHtml(s.name)}</span><span class="student-sub">Student ID #${s.id}</span></td>
      <td>${escapeHtml(s.rollNumber)}</td><td>${escapeHtml(s.course)}</td>
      <td><button class="delete-btn" data-delete="${s.id}">Delete</button></td>
    </tr>`).join('') : '<tr><td colspan="4" class="empty-state">No students yet. Add your first student above.</td></tr>';
}
async function renderAttendance() {
  $('dateLabel').textContent = new Date(`${selectedDate()}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const records = await api(`/api/attendance?date=${encodeURIComponent(selectedDate())}`);
  const savedByStudent = new Map(records.map(r => [r.studentId, r.status]));
  students.forEach(s => {
    if (!attendanceDraft[s.id]) attendanceDraft[s.id] = savedByStudent.get(s.id) || 'Present';
  });
  // Always show saved status when switching dates; the draft is reset by the date-change handler.
  $('attendanceList').innerHTML = students.length ? students.map(s => {
    const status = attendanceDraft[s.id] || savedByStudent.get(s.id) || 'Present';
    return `<div class="attendance-row">
      <div class="student-ident"><div class="avatar">${escapeHtml(initials(s.name))}</div>
        <div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.rollNumber)} · ${escapeHtml(s.course)}</small></div>
      </div>
      <div class="status-toggle" role="group" aria-label="Attendance for ${escapeHtml(s.name)}">
        <button type="button" class="${status === 'Present' ? 'active present' : ''}" data-student="${s.id}" data-status="Present">✓ Present</button>
        <button type="button" class="${status === 'Absent' ? 'active absent' : ''}" data-student="${s.id}" data-status="Absent">× Absent</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty-state">No students to mark. Add students in the directory first.</div>';
  $('attendanceHint').textContent = students.length ? `${students.length} student${students.length===1?'':'s'} in your register` : 'Add students to begin.';
}
async function renderSummary() {
  const summary = await api(`/api/attendance/summary?date=${encodeURIComponent(selectedDate())}`);
  $('totalStudents').textContent = summary.students;
  $('presentCount').textContent = summary.present;
  $('absentCount').textContent = summary.absent;
  $('notMarkedCount').textContent = summary.notMarked;
}
async function renderRecords() {
  const records = await api(`/api/attendance?date=${encodeURIComponent(selectedDate())}`);
  $('recordCount').textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;
  $('recordsBody').innerHTML = records.length ? records.map(r => `
    <tr><td><span class="student-name">${escapeHtml(r.name)}</span></td>
    <td>${escapeHtml(r.rollNumber)}</td><td>${escapeHtml(r.course)}</td><td>${escapeHtml(r.date)}</td>
    <td><span class="status-badge ${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td></tr>
  `).join('') : '<tr><td colspan="5" class="empty-state">No saved attendance for this date.</td></tr>';
}
$('studentForm').addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    rollNumber: $('rollNumber').value.trim(),
    name: $('studentName').value.trim(),
    course: $('course').value.trim()
  };
  try {
    const student = await api('/api/students', {method:'POST', body:JSON.stringify(payload)});
    students.push(student);
    attendanceDraft[student.id] = 'Present';
    $('studentForm').reset();
    await refreshAll();
    showToast('Student added successfully.');
  } catch (error) { showToast(error.message); }
});
$('studentsBody').addEventListener('click', async event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const student = students.find(s => s.id === Number(button.dataset.delete));
  if (!student || !confirm(`Delete ${student.name} and their attendance records?`)) return;
  try {
    await api(`/api/students/${student.id}`, {method:'DELETE'});
    delete attendanceDraft[student.id];
    await refreshAll();
    showToast('Student deleted.');
  } catch (error) { showToast(error.message); }
});
$('attendanceList').addEventListener('click', event => {
  const button = event.target.closest('[data-student][data-status]');
  if (!button) return;
  attendanceDraft[button.dataset.student] = button.dataset.status;
  renderAttendance().catch(error => showToast(error.message));
});
$('saveAttendance').addEventListener('click', async () => {
  if (!students.length) return showToast('Add students before saving attendance.');
  try {
    for (const student of students) {
      await api('/api/attendance', {
        method:'POST',
        body:JSON.stringify({
          studentId:student.id,
          date:selectedDate(),
          status:attendanceDraft[student.id] || 'Present'
        })
      });
    }
    await Promise.all([renderSummary(), renderRecords()]);
    showToast('Attendance saved successfully.');
  } catch (error) { showToast(`Could not save attendance: ${error.message}`); }
});
$('attendanceDate').addEventListener('change', async () => {
  attendanceDraft = {};
  try { await Promise.all([renderAttendance(), renderSummary(), renderRecords()]); }
  catch (error) { showToast(error.message); }
});
refreshAll();
