import React, { useMemo } from 'react';
import { format, getDay } from 'date-fns';
import { getDictionary, isJSONStr, getSysMsgFormatStr } from '@/lib/common';

const getWeekText = dayIndex => {
  if (dayIndex == 0) {
    return getDictionary('일;Sun;Sun;Sun;;;;;;');
  } else if (dayIndex == 1) {
    return getDictionary('월;Mon;Mon;Mon;;;;;;');
  } else if (dayIndex == 2) {
    return getDictionary('화;Tue;Tue;Tue;;;;;;');
  } else if (dayIndex == 3) {
    return getDictionary('수;Wed;Wed;Wed;;;;;;');
  } else if (dayIndex == 4) {
    return getDictionary('목;Thu;Thu;Thu;;;;;;');
  } else if (dayIndex == 5) {
    return getDictionary('금;Fri;Fri;Fri;;;;;;');
  } else if (dayIndex == 6) {
    return getDictionary('토;Sat;Sat;Sat;;;;;;');
  }
};

const SystemMessageBox = ({ message, date }) => {
  const drawMessage = useMemo(() => {
    try {
      let printMessage = '';
      if (date) {
        const msgDate = new Date(message);

        if (msgDate != 'Invalid Date') {
          const formatText = format(msgDate, `yyyy. MM. dd`);

          printMessage = `${formatText} (${getWeekText(getDay(msgDate))})`;
        } else {
          printMessage = message.context;
        }
      } else {
        if (isJSONStr(message.context)) {
          const jsonData = JSON.parse(message.context);
          printMessage = getSysMsgFormatStr(
            covi.getDic(jsonData.templateKey),
            jsonData.datas,
          );
        } else {
          printMessage = message.context;
        }
      }

      return (
        <li className="dateinfo">
          <p
            style={{ textAlign: 'center' }}
            dangerouslySetInnerHTML={{ __html: printMessage }}
          ></p>
        </li>
      );
    } catch (e) {
      console.log('system message draw err :: ' + e);
      return <></>;
    }
  }, [message, date]);

  return drawMessage;
};

export default React.memo(SystemMessageBox);
