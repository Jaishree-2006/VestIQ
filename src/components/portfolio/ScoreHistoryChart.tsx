import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthScoreEvent } from '../../types';

interface Props { events: HealthScoreEvent[] }

export const ScoreHistoryChart: React.FC<Props> = ({ events }) => {
  const sorted = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const data = sorted.map(e => ({ date: new Date(e.timestamp).toLocaleDateString(), score: e.newScore }));
  if (data.length === 0) return <div className="text-xs text-[#6B7280]">No history available yet.</div>;

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0,100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#C57D25" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
