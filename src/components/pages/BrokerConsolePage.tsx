import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { MOCK_CLIENTS } from '../../data/mockData';
import type { ClientProfile } from '../../types';
import { Briefcase, ChevronRight } from 'lucide-react';

export const BrokerConsolePage: React.FC = () => {
  const { setCurrentPage } = useApp();
  const [selectedClient, setSelectedClient] = useState<ClientProfile>(MOCK_CLIENTS[0]);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'flagged'>('all');

  const filteredClients = filterSeverity === 'flagged' 
    ? MOCK_CLIENTS.filter(c => c.flagCount > 0)
    : MOCK_CLIENTS;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Briefcase className="w-4 h-4" />
              <span>B2B Relationship Manager Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">
              Broker / RM Console
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Manage assigned client portfolios, monitor mis-selling flags, and proactively prevent panic-driven attrition.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-[#FFF8EE] px-3 py-1.5 rounded-xl border border-[#F7E5C8] text-xs font-semibold text-[#63451B]">
            <span>Assigned RM: Amit Verma</span>
          </div>
        </div>

        {/* Client Roster & Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Client List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-[#0B1220]">
                Assigned Clients ({filteredClients.length})
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterSeverity('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterSeverity === 'all'
                      ? 'bg-[#0B1220] text-white'
                      : 'bg-white text-[#64748B] border border-[#EDE9DF]'
                  }`}
                >
                  All Clients
                </button>
                <button
                  onClick={() => setFilterSeverity('flagged')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterSeverity === 'flagged'
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-white text-[#64748B] border border-[#EDE9DF]'
                  }`}
                >
                  Flagged Only
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredClients.map((client) => {
                const isSelected = selectedClient.id === client.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
                      isSelected
                        ? 'border-2 border-[#C57D25] ring-2 ring-[#C57D25]/10'
                        : 'border-[#EDE9DF] hover:border-[#D4C7B5]'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-[#F6F4ED] text-[#C57D25] font-bold flex items-center justify-center border border-[#EDE9DF]">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0B1220]">{client.name}</h3>
                        <p className="text-xs text-[#8B93A7] font-mono">PAN: {client.casPan}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="text-xs font-extrabold font-mono-num text-[#0B1220]">
                          ₹{client.totalValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#8B93A7]">{client.riskProfile}</div>
                      </div>

                      <div className="text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          client.healthScore >= 80 
                            ? 'bg-[#E6F4EA] text-[#2BB673]' 
                            : 'bg-[#FFF8EE] text-[#C57D25]'
                        }`}>
                          {client.healthScore}/100
                        </span>
                        {client.flagCount > 0 && (
                          <div className="text-[10px] font-bold text-[#EF4444] mt-0.5">
                            {client.flagCount} Alert{client.flagCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#8B93A7]" />
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Single Client Detail Inspector (Right 1 col) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs h-fit sticky top-24">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-1">Client Summary</div>
            <h3 className="text-xl font-extrabold text-[#0B1220] mb-4">{selectedClient.name}</h3>

            <div className="space-y-4 text-xs">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF] space-y-1">
                <div className="text-[#8B93A7]">Email Address</div>
                <div className="font-semibold text-[#0B1220]">{selectedClient.email}</div>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF] space-y-1">
                <div className="text-[#8B93A7]">Active Flag Issue</div>
                <div className="font-bold text-[#991B1B]">{selectedClient.topFlag}</div>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF] space-y-1">
                <div className="text-[#8B93A7]">Last Statement Sync</div>
                <div className="font-medium text-[#475569]">{selectedClient.lastUpdated}</div>
              </div>

              <button
                onClick={() => setCurrentPage('explainability')}
                className="w-full py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs mt-2"
              >
                Inspect Client Explainability
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
