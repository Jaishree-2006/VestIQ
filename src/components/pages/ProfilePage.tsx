import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ScoreHistoryChart } from '../portfolio/ScoreHistoryChart';
import { DataFreshnessIndicator } from '../portfolio/DataFreshnessIndicator';

export const ProfilePage: React.FC = () => {
  const { uploadedCas, healthScoreEvents, userName, signOut, navigateTo } = useApp();

  const [fullName, setFullName] = useState(userName || 'Investor Name');
  const [email, setEmail] = useState(`${(userName || 'investor').toLowerCase().replace(/\s+/g, '.')}@example.com`);
  const [phone, setPhone] = useState('');
  const [investmentGoal, setInvestmentGoal] = useState('Grow wealth over time');
  const [timeline, setTimeline] = useState('1-3');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(userName || 'Investor Name');
    setEmail(`${(userName || 'investor').toLowerCase().replace(/\s+/g, '.')}@example.com`);
  }, [userName]);

  const maskedPan = uploadedCas?.pan ? `${uploadedCas.pan.substring(0,5)}***${uploadedCas.pan.substring(uploadedCas.pan.length-1)}` : '';

  const handleSave = async () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">Your Profile</h2>
              <p className="text-sm text-[#6B7280]">Manage account details and preferences.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => signOut()} className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] cursor-pointer">Sign out</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-xs font-bold mb-1">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#EDE9DF] bg-[#FAF8F5]" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#EDE9DF] bg-[#FAF8F5]" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#EDE9DF] bg-[#FAF8F5]" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">PAN (masked)</label>
              <input value={maskedPan} readOnly className="w-full px-3 py-2 rounded-xl border border-[#EDE9DF] bg-[#F8FAFC]" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1">Investment goal</label>
              <input value={investmentGoal} onChange={(e) => setInvestmentGoal(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#EDE9DF] bg-[#FAF8F5]" />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">When might you need this money?</label>
              <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#EDE9DF] bg-[#FAF8F5]">
                <option value="">Choose...</option>
                <option value="<1">&lt;1 year</option>
                <option value="1-3">1-3 years</option>
                <option value=">3">3+ years</option>
                <option value="no-timeline">No specific timeline</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-between">
              <div className="text-xs text-[#6B7280]">Health Score History</div>
              <div>
                <button onClick={handleSave} className="px-4 py-2 bg-[#C57D25] text-white rounded-xl">{saving ? 'Saving…' : 'Save Profile'}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
            <h3 className="font-extrabold">Health Score History</h3>
            <DataFreshnessIndicator
              uploadedCas={uploadedCas}
              onReUpload={() => navigateTo('dashboard')}
            />
          </div>
          <ScoreHistoryChart events={healthScoreEvents} />
        </div>

        <div className="mt-6 text-sm text-[#8B93A7]">
          <button className="text-red-600 underline">Delete my data</button>
        </div>
      </div>
    </div>
  );
};
