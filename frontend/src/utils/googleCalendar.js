// =============================================================================
// ChronoSync 3D — Google Calendar & Event Sync Utility (googleCalendar.js)
// =============================================================================
// Generates direct RFC-compliant Google Calendar web intents and 1-click sync actions.
// Allows instant synchronization to Google Calendar without waiting for background crawlers
// or being blocked by localhost (127.0.0.1) network boundaries.
// =============================================================================

/**
 * Formats a date string or Date object into Google Calendar UTC format: YYYYMMDDTHHmmssZ
 */
export function formatGCalDate(dt, durationHours = 2) {
  if (!dt) {
    const now = new Date();
    return {
      start: now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: new Date(now.getTime() + durationHours * 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
    };
  }

  const cleanStr = String(dt).replace(' ', 'T');
  let startDate = new Date(cleanStr);
  if (isNaN(startDate.getTime())) {
    startDate = new Date();
  }

  const endDate = new Date(startDate.getTime() + durationHours * 3600000);

  const startUtc = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endUtc = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return { start: startUtc, end: endUtc };
}

/**
 * Builds direct Google Calendar web intent URL for an Examination Schedule
 */
export function getGoogleCalendarExamUrl(exam) {
  if (!exam) return '#';
  const courseCode = exam.course_code || 'EXAM';
  const courseName = exam.course_name || 'Academic Examination';
  const examType = exam.exam_type || 'EXAM';
  const venue = exam.venue || 'Campus Examination Hall';

  const title = `[${examType} EXAM] ${courseCode}: ${courseName}`;
  const details = [
    `🎓 ChronoSync Official Academic Examination Schedule`,
    `Course: ${courseName} (${courseCode})`,
    `Type: ${examType}`,
    `Venue: ${venue}`,
    exam.department ? `Department: ${exam.department}` : '',
    exam.program ? `Program: ${exam.program}` : '',
    exam.scheduled_by ? `Scheduled By: ${exam.scheduled_by}` : '',
    `\nEnforced by ChronoSync Automated 48h Clash Detection.`
  ].filter(Boolean).join('\n');

  const { start, end } = formatGCalDate(exam.exam_date, 3); // 3-hour exam window

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: details,
    location: venue,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Builds direct Google Calendar web intent URL for an Assignment / Deadline
 */
export function getGoogleCalendarDeadlineUrl(deadline) {
  if (!deadline) return '#';
  const title = `[DUE] ${deadline.course_code || 'TASK'}: ${deadline.title || 'Assignment Deadline'}`;
  const details = [
    `📚 ChronoSync Assignment Deadline`,
    deadline.course_name ? `Course: ${deadline.course_name} (${deadline.course_code || ''})` : '',
    deadline.urgency ? `Priority: ${deadline.urgency}` : '',
    deadline.description ? `Details: ${deadline.description}` : '',
    deadline.pdf_blob_url ? `Attachment: ${deadline.pdf_blob_url}` : '',
    deadline.posted_by_name ? `Posted By: ${deadline.posted_by_name}` : '',
  ].filter(Boolean).join('\n');

  // Starts 1 hour before due date
  let due = new Date(String(deadline.due_date).replace(' ', 'T'));
  if (isNaN(due.getTime())) due = new Date();
  const start = new Date(due.getTime() - 3600000);

  const startUtc = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endUtc = due.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: details,
    location: `${deadline.department || 'Campus'} - ${deadline.program || ''}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Builds direct Google Calendar web intent URL for a Department Notice
 */
export function getGoogleCalendarNoticeUrl(notice) {
  if (!notice) return '#';
  const title = `[NOTICE - ${notice.notice_type || 'ANNOUNCEMENT'}] ${notice.title || 'Department Notice'}`;
  const details = [
    `📢 ChronoSync Department Notice & Academic Announcement`,
    notice.notice_type ? `Classification: ${notice.notice_type}` : '',
    notice.department ? `Department: ${notice.department}` : '',
    notice.program ? `Program: ${notice.program}` : '',
    notice.content ? `\nContent:\n${notice.content}` : '',
  ].filter(Boolean).join('\n');

  const { start, end } = formatGCalDate(notice.created_at, 1);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: details,
    location: `${notice.department || 'College Campus'}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar directly in a new tab with the given event
 */
export function openGoogleCalendarEvent(url) {
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Helper to open Google Calendar's Import & Export page
 */
export function openGoogleCalendarImportPage() {
  window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank', 'noopener,noreferrer');
}
