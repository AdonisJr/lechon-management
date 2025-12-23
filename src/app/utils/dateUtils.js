// Date and Time Formatting Utilities

/**
 * Format a date to "Month Day, Year" format (e.g., "January 11, 2025")
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateLong = (date) => {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a time to 12-hour format with am/pm (e.g., "11:30am" or "11pm")
 * @param {string} time - The time string in HH:MM format
 * @returns {string} Formatted time string
 */
export const formatTime12Hour = (time) => {
  if (!time) return '';

  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);

  if (isNaN(hour24) || isNaN(minute)) return '';

  const period = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  // If minutes are 0, don't show :00
  if (minute === 0) {
    return `${hour12}${period}`;
  }

  return `${hour12}:${minute.toString().padStart(2, '0')}${period}`;
};

/**
 * Format a date and time combination
 * @param {Date|string} date - The date
 * @param {string} time - The time in HH:MM format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, time) => {
  const formattedDate = formatDateLong(date);
  const formattedTime = formatTime12Hour(time);

  if (formattedDate && formattedTime) {
    return `${formattedDate} at ${formattedTime}`;
  } else if (formattedDate) {
    return formattedDate;
  } else if (formattedTime) {
    return formattedTime;
  }

  return '';
};

/**
 * Convert a full Date object to formatted date and time
 * @param {Date|string} dateTime - The Date object or ISO string
 * @returns {object} Object with formatted date and time
 */
export const formatDateTimeObject = (dateTime) => {
  if (!dateTime) return { date: '', time: '' };

  const dateObj = new Date(dateTime);
  if (isNaN(dateObj.getTime())) return { date: '', time: '' };

  const date = formatDateLong(dateObj);
  const timeString = dateObj.toTimeString().slice(0, 5); // HH:MM format
  const time = formatTime12Hour(timeString);

  return { date, time };
};

/**
 * Get current date in the long format
 * @returns {string} Current date formatted as "Month Day, Year"
 */
export const getCurrentDateFormatted = () => {
  return formatDateLong(new Date());
};

/**
 * Get current time in 12-hour format
 * @returns {string} Current time formatted as "11:30am" or "11pm"
 */
export const getCurrentTimeFormatted = () => {
  const now = new Date();
  const timeString = now.toTimeString().slice(0, 5);
  return formatTime12Hour(timeString);
};