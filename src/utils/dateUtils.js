import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateStr, formatPattern = 'MMM dd, yyyy') => {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return dateStr;
    return format(date, formatPattern);
  } catch (e) {
    return dateStr;
  }
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    // If it's a full ISO timestamp
    if (timeStr.includes('T')) {
      const date = parseISO(timeStr);
      if (isValid(date)) return format(date, 'hh:mm a');
    }
    // If it's HH:mm string (e.g. 14:30)
    const [hours, minutes] = timeStr.split(':');
    if (hours !== undefined && minutes !== undefined) {
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return format(date, 'hh:mm a');
    }
    return timeStr;
  } catch (e) {
    return timeStr;
  }
};

export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  try {
    const date = typeof dateTimeStr === 'string' ? parseISO(dateTimeStr) : dateTimeStr;
    if (!isValid(date)) return dateTimeStr;
    return format(date, 'MMM dd, yyyy | hh:mm a');
  } catch (e) {
    return dateTimeStr;
  }
};

export const getNextNDays = (n = 7) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      fullDate: format(date, 'yyyy-MM-dd'),
      dayName: i === 0 ? 'Today' : format(date, 'EEE'),
      dateNum: format(date, 'dd'),
      monthName: format(date, 'MMM')
    });
  }
  return days;
};
