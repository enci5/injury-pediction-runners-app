import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarComponent.css';
import { fetchTrainingDays } from '../../services/trainingService';

const CalendarComponent = () => {
    const [highlightedDates, setHighlightedDates] = useState([]);

    useEffect(() => {
        const loadTrainingDays = async () => {
            const dates = await fetchTrainingDays();
            setHighlightedDates(dates);
        };

        loadTrainingDays();
    }, []);

    const isSameDay = (date1, date2) => {
        const d1 = date1.toISOString().split("T")[0];
        const d2 = date2.toISOString().split("T")[0];
        return d1 === d2;
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            if (highlightedDates.some(d => isSameDay(new Date(d.date), date))) {
                return 'highlight';
            }
        }
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const trainingDay = highlightedDates.find(d => isSameDay(new Date(d.date), date));
            if (trainingDay) {
                return <div title={`Number of Sessions: ${trainingDay.nr_sessions}`}></div>;
            }
        }
    };

    return (
        <div className="calendar-container">
            <Calendar
                tileClassName={tileClassName}
                tileContent={tileContent}
                locale="en-US"
            />
        </div>
    );
};

export default CalendarComponent;
