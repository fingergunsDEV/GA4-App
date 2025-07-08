// src/components/Dashboard.js
// --- IMPORTS ---
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Scorecard from './Scorecard'; // Import Scorecard
import DataTable from './DataTable';   // Import DataTable
import './Dashboard.css'; 

// --- AXIOS INSTANCE (no change) ---
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

const Dashboard = () => {
    // --- STATE ---
    // Existing state
    const [overviewData, setOverviewData] = useState([]);
    const [trafficData, setTrafficData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New state for the new metrics
    const [scorecardData, setScorecardData] = useState(null);
    const [locationData, setLocationData] = useState([]);
    const [eventData, setEventData] = useState([]);

    // --- USE EFFECT (updated) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [overviewRes, trafficRes, scorecardRes, locationRes, eventRes] = await Promise.all([
                    api.get('/data/overview'),
                    api.get('/data/traffic'),
                    api.get('/data/scorecards'),
                    api.get('/data/locations'),
                    api.get('/data/events'),
                ]);

                // --- DATA PROCESSING ---
                // Overview (no change)
                const formattedOverview = overviewRes.data.rows.map(row => ({
                    date: `${row.dimensionValues[0].value.slice(4, 6)}/${row.dimensionValues[0].value.slice(6, 8)}`,
                    Users: parseInt(row.metricValues[0].value, 10),
                    Sessions: parseInt(row.metricValues[1].value, 10),
                }));
                setOverviewData(formattedOverview);

                // Traffic (no change)
                const formattedTraffic = trafficRes.data.rows.map(row => ({
                    name: row.dimensionValues[0].value,
                    value: parseInt(row.metricValues[0].value, 10),
                }));
                setTrafficData(formattedTraffic);

                // **NEW** Scorecard data processing
                const scorecardRow = scorecardRes.data.rows[0];
                setScorecardData({
                    users: scorecardRow.metricValues[0].value,
                    engagementRate: scorecardRow.metricValues[1].value,
                    conversions: scorecardRow.metricValues[2].value,
                });
                
                // **NEW** Location data processing
                const formattedLocations = locationRes.data.rows.map(row => [
                    row.dimensionValues[0].value, // Country
                    parseInt(row.metricValues[0].value, 10).toLocaleString(), // Users
                ]);
                setLocationData(formattedLocations);

                // **NEW** Event data processing
                const formattedEvents = eventRes.data.rows.map(row => [
                    row.dimensionValues[0].value, // Event Name
                    parseInt(row.metricValues[0].value, 10).toLocaleString(), // Event Count
                ]);
                setEventData(formattedEvents);
                
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

    // --- RENDER (updated) ---
    return (
        <div className="dashboard">
            <h1>Your Google Analytics Dashboard</h1>
            
            {/* NEW Scorecard Section */}
            {scorecardData && (
                <div className="scorecard-row">
                    <Scorecard title="Total Users" value={scorecardData.users} />
                    <Scorecard title="Engagement Rate" value={scorecardData.engagementRate} format="percent" />
                    <Scorecard title="Conversions" value={scorecardData.conversions} />
                </div>
            )}

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
                
                {/* NEW Data Tables */}
                <DataTable title="Top Locations by Users" headers={["Country", "Users"]} rows={locationData} />
                <DataTable title="Top Events" headers={["Event Name", "Count"]} rows={eventData} />
            </div>
        </div>
    );
};

export default Dashboard;
