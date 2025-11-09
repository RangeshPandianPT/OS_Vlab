
import React, { useState } from 'react';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';

const mockData = [
  { name: 'Avg Waiting Time', FCFS: 4.2, SJF: 2.8, RR: 3.5 },
  { name: 'Avg Turnaround Time', FCFS: 8.5, SJF: 6.1, RR: 7.2 },
];

const ComparisonPage: React.FC = () => {
  const [module, setModule] = useState('cpu-scheduling');
  const { theme } = useTheme();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Algorithm Comparison</h1>
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label htmlFor="module" className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Select Module</label>
            <select
              id="module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
            >
              <option value="cpu-scheduling">CPU Scheduling</option>
              <option value="page-replacement">Page Replacement</option>
              <option value="disk-scheduling">Disk Scheduling</option>
            </select>
          </div>
           {/* Add selects for Algorithm 1 and Algorithm 2 here */}
        </div>

        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
                <XAxis dataKey="name" stroke={theme === 'light' ? '#4b5563' : '#d1d5db'}/>
                <YAxis stroke={theme === 'light' ? '#4b5563' : '#d1d5db'}/>
                <Tooltip 
                    contentStyle={{
                        backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                        borderColor: theme === 'light' ? '#e5e7eb' : '#374151'
                    }}
                />
                <Legend />
                <Bar dataKey="FCFS" fill="#3b82f6" />
                <Bar dataKey="SJF" fill="#10b981" />
                <Bar dataKey="RR" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default ComparisonPage;
