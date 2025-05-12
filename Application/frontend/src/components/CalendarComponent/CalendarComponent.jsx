import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarComponent.css';
import { fetchTrainingDays } from '../../services/trainingService';

const CalendarComponent = ({ dataUpdated, onDateSelect }) => {
  const [highlightedDates, setHighlightedDates] = useState([]);

  useEffect(() => {
    fetchTrainingDays().then(days => {
      // turn each ISO-string into a real Date at midnight rather than toISOString
      setHighlightedDates(
        days.map(d => ({
          date: new Date(d.date + 'T00:00:00'),
          nr_sessions: d.nr_sessions,
        }))
      );
    });
  }, [dataUpdated]);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    return highlightedDates.some(d => isSameDay(d.date, date))
      ? 'highlight'
      : null;
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const td = highlightedDates.find(d => isSameDay(d.date, date));
    return td
      ? <div className="session-dot" title={`# sessions: ${td.nr_sessions}`} />
      : null;
  };

  return (
    <div className="calendar-container">
      <Calendar
        locale="en-GB"           // UK formatting
        tileClassName={tileClassName}
        tileContent={tileContent}
        onClickDay={date => onDateSelect(date)}
        maxDetail="month"
        minDetail="month"
      />
    </div>
  );
};

export default CalendarComponent;
