import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchTrainingQuality } from '../../services/trainingService';
import { addDays, format, subDays } from 'date-fns';

const TrainingQualityChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const result = await fetchTrainingQuality();

            // Generate the last 7 days
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = subDays(today, 6 - i);
                const formattedDate = format(date, 'yyyy-MM-dd');
                
                // Find the training day, or use defaults if missing
                const trainingDay = result.find(d => d.date === formattedDate) || {
                    date: formattedDate,
                    perceived_exertion: -0.01,
                    perceived_training_success: -0.01,
                    perceived_recovery: -0.01,
                };

                return trainingDay;
            });

            setData(last7Days);
        };

        loadData();
    }, []);

    return (
        <div className="chart-container">
            <h2>Training Quality (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => date.slice(5)}  // Show only MM-DD
                        interval={0}  // Force all dates to show
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="perceived_exertion" fill="#8884d8" />
                    <Bar dataKey="perceived_training_success" fill="#82ca9d" />
                    <Bar dataKey="perceived_recovery" fill="#ffc658" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TrainingQualityChart;