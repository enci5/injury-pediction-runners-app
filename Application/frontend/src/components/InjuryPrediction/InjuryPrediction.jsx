import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { fetchWithAuth } from '../../services/fetchWithAuth';
import './InjuryPrediction.css'

const InjuryPrediction = ({dataUpdated}) => {
    const [probability, setProbability] = useState(0);
    const [riskLevel, setRiskLevel] = useState("Low");

    useEffect(() => {
        const fetchPrediction = async () => {
            try {
                const res = await fetchWithAuth("http://localhost:8000/api/predict/");
                const data = await res.json();
                setProbability(data.probability * 100);
                setRiskLevel(data.injury_risk ? "High" : "Low");
            } catch (error) {
                console.error("Error fetching injury prediction:", error);
            }
        };

        fetchPrediction();
    }, [dataUpdated]);

    return (
        <div className="injury-prediction">
            <h2>Injury Risk</h2>
            <div style={{ width: 200, height: 200, margin: '0 auto' }}>
                <CircularProgressbar
                    value={probability}
                    text={`${probability.toFixed(0)}%`}
                    styles={buildStyles({
                        textColor: riskLevel === "High" ? "#f94144" : "#43aa8b",
                        pathColor: riskLevel === "High" ? "#f94144" : "#43aa8b",
                        trailColor: "#eee",
                    })}
                />
            </div>
            <p className="risk-level" style={{ color: riskLevel === "High" ? "#f94144" : "#43aa8b" }}>
                {riskLevel} Risk
            </p>
        </div>
    );
};

export default InjuryPrediction;
