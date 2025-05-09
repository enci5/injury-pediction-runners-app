import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchPhysicalLoad } from '../../services/trainingService';
import { addDays, format, subDays } from 'date-fns';

const PhysicalLoadChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const result = await fetchPhysicalLoad();

            // Generate the last 7 days
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = subDays(today, 6 - i);
                const formattedDate = format(date, 'yyyy-MM-dd');
                
                // Find the training day, or use defaults if missing
                const trainingDay = result.find(d => d.date === formattedDate) || {
                    date: formattedDate,
                    total_km: 0,
                    km_z3_4: 0,
                    km_z5_t1_t2: 0,
                    km_sprinting: 0,
                };

                return trainingDay;
            });

            setData(last7Days);
        };

        loadData();
    }, []);

    return (
        <div className="chart-container">
            <h2>Physical Load (Last 7 Days)</h2>
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
                    <Bar dataKey="total_km" fill="#8884d8" stackId="a" />
                    <Bar dataKey="km_z3_4" fill="#82ca9d" stackId="a" />
                    <Bar dataKey="km_z5_t1_t2" fill="#ffc658" stackId="a" />
                    <Bar dataKey="km_sprinting" fill="#ff8042" stackId="a" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PhysicalLoadChart;
