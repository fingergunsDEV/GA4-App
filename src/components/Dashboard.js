// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css'; // For styling

// Configure axios to send credentials (cookies) with each request
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

const Dashboard = () => {
    const [overviewData, setOverviewData] = useState([]);
    const [trafficData, setTrafficData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch data in parallel
                const [overviewRes, trafficRes] = await Promise.all([
                    api.get('/data/overview'),
                    api.get('/data/traffic')
                ]);

                // Process overview data for the line chart
                const formattedOverview = overviewRes.data.rows.map(row => ({
                    date: `${row.dimensionValues[0].value.slice(4, 6)}/${row.dimensionValues[0].value.slice(6, 8)}`,
                    Users: parseInt(row.metricValues[0].value, 10),
                    Sessions: parseInt(row.metricValues[1].value, 10),
                }));
                setOverviewData(formattedOverview);

                // Process traffic data for the pie chart
                const formattedTraffic = trafficRes.data.rows.map(row => ({
                    name: row.dimensionValues[0].value,
                    value: parseInt(row.metricValues[0].value, 10),
                }));
                setTrafficData(formattedTraffic);
                
            } catch (err) {
                console.error("Error fetching data:", err);
                setError('Failed to fetch data. You might need to log in again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loading">Loading Dashboard...</div>;
    if (error) return <div className="error">{error} <a href="/">Login</a></div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="dashboard">
            <h1>Your Google Analytics Dashboard</h1>
            <div className="grid-container">
                <div className="chart-card">
                    <h3>Users and Sessions Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={overviewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Users" stroke="#8884d8" />
                            <Line type="monotone" dataKey="Sessions" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3>Sessions by Channel</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={trafficData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {trafficData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Add more chart cards here for other data points */}
            </div>
        </div>
    );
};

export default Dashboard;
