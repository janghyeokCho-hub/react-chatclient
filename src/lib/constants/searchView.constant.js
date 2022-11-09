import { format, isMatch } from 'date-fns';

export const SEARCHVIEW_OPTIONS = {
  CONTEXT: 'Context',
  SENDER: 'Note_Sender',
  DATE: 'Date',
};

export const SEARCH_DATE_FORMAT = 'yyyy-MM-dd';

export function convertDate(date, dateFormat = SEARCH_DATE_FORMAT) {
  return format(new Date(date), dateFormat);
}

export function getCurrentDate(dateFormat = SEARCH_DATE_FORMAT) {
  return convertDate(Date.now(), dateFormat);
}

export function isValidDate(date, dateFormat = SEARCH_DATE_FORMAT) {
  return isMatch(date, dateFormat);
}

export function parseDate(date, dateFormat = SEARCH_DATE_FORMAT) {
  const dateType = typeof date;
  try {
    if (dateType === 'string') {
      /* Returns original `date` if value is already valid */
      if (isValidDate(date, dateFormat)) {
        return date;
      }
    }
    return convertDate(date, dateFormat);
  } catch (err) {
    console.log(`ParseDate([${dateType}]${date}): `, err);
    return null;
  }
}

export function isSameDate(from, to) {
  if (!from || !to) {
    return false;
  }
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return false;
  }
  return fromDate === toDate;
}
