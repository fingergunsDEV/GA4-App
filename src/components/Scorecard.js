// src/components/Scorecard.js
import React from 'react';
import './Dashboard.css'; // We'll reuse the dashboard styles

const Scorecard = ({ title, value, format = "number" }) => {
    let displayValue = value;
    if (format === 'percent') {
        displayValue = `${(parseFloat(value) * 100).toFixed(2)}%`;
    } else if (format === 'number') {
        displayValue = parseInt(value, 10).toLocaleString();
    }

    return (
        <div className="scorecard">
            <h3 className="scorecard-title">{title}</h3>
            <p className="scorecard-value">{displayValue}</p>
        </div>
    );
};

export default Scorecard;
