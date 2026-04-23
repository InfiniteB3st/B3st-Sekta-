import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Shield, Database, Layout, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DevOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevOverlay: React.FC<DevOverlayProps> = ({ isOpen, onClose }) => {
  const { user, session } = useAuth();
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'OK' | 'ERROR'>('IDLE');
  const [dbError, setDbError] = useState<string | null>(null);
  const [addonStatus, setAddonStatus] = useState<'IDLE' | 'OK' | 'ERROR'>('IDLE');
  const [sessionData, setSessionData] = useState<any>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!isOpen) return;

    const runTests = async () => {
      // 1. Session Check
      const { data } = await supabase.auth.getSession();
      setSessionData(data.session);

      // 2. Handshake Check
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setDbStatus('OK');
      } catch (err: any) {
        setDbStatus('ERROR');
        setDbError(err.message || 'Unknown DB Handshake Error');
      }
    };

    runTests();
  }, [isOpen]);

  const checkAddons = async () => {
    try {
      const { error } = await supabase.from('user_addons').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') { 
         setAddonStatus('ERROR');
      } else {
         setAddonStatus('OK');
      }
    } catch {
      setAddonStatus('ERROR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[99999] p-10 font-mono text-xs overflow-y-auto selection:bg-[#ffb100]/30 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h2 className="text-[#ffb100] text-2xl font-black uppercase tracking-[0.2em] italic flex items-center gap-4">
              <Shield className="text-[#ffb100]" /> B3ST SEKTA :: DIAGNOSTIC_NODE_01
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Kernel Version 3.4.0-STRIKE :: {new Date().toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-all group"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard 
            label="Handshake" 
            value={dbStatus === 'OK' ? 'SECURE' : 'COMPROMISED'} 
            status={dbStatus === 'OK' ? 'success' : 'error'} 
            sub={dbError || 'Direct tunnel established'}
          />
          <MetricCard 
            label="Infrastructures" 
            value={anonKey ? 'CONFIGURED' : 'UNSET'} 
            status={anonKey ? 'success' : 'error'} 
            sub={supabaseUrl ? 'URL_RESOLVED' : 'URL_MISSING'}
          />
          <MetricCard 
            label="Addon Registry" 
            value={addonStatus} 
            status={addonStatus === 'OK' ? 'success' : 'error'} 
            sub="user_addons table state"
          />
          <MetricCard 
            label="Session Node" 
            value={sessionData ? 'ACTIVE' : 'INACTIVE'} 
            status={sessionData ? 'success' : 'error'} 
            sub={user?.email || 'Unauthorized access detected'}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
           <button 
             onClick={checkAddons}
             className="bg-[#ffb100] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,177,0,0.3)]"
           >
             Check Addon Registry
           </button>
        </div>

        {/* ENV VERIFICATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
              <h3 className="text-white font-black uppercase flex items-center gap-3">
                <Database size={18} className="text-[#ffb100]" /> Environment Integrity
              </h3>
              <div className="space-y-4">
                 <EnvRow label="VITE_SUPABASE_URL" value={supabaseUrl} />
                 <EnvRow label="VITE_SUPABASE_ANON_KEY" value={anonKey ? '********************' : 'UNDEFINED'} />
                 <EnvRow label="NODE_ENV" value={import.meta.env.MODE} />
              </div>
           </div>

           <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
              <h3 className="text-white font-black uppercase flex items-center gap-3">
                <Layout size={18} className="text-[#ffb100]" /> Redirect Blueprints
              </h3>
              <div className="space-y-4">
                 <EnvRow label="Origin" value={window.location.origin} />
                 <EnvRow label="Redirect Target" value={`${window.location.origin}/home`} />
                 <EnvRow label="User ID" value={user?.id || 'null'} />
              </div>
           </div>
        </div>

        {/* LOGS */}
        <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/10">
          <div className="flex items-center gap-4 mb-4">
             <AlertTriangle className="text-red-500" size={20} />
             <h3 className="text-red-500 font-black uppercase">Incident Report / Last Sync Failure</h3>
          </div>
          <div className="bg-black/40 p-6 rounded-xl border border-white/5">
             <pre className="text-red-400 text-[10px] whitespace-pre-wrap leading-relaxed italic">
               {dbError ? `[FATAL] ${dbError}` : '[OK] System reports zero critical handshake disruptions in the last 60s.'}
             </pre>
          </div>
        </div>

        <div className="text-center text-gray-700 text-[9px] font-bold uppercase tracking-[0.5em] pt-10 border-t border-white/5">
           B3ST SEKTA PRE-FLIGHT DIAGNOSTICS // USE CTRL + SHIFT + D TO EXIT
        </div>
      </div>
    </div>
  );
};

function MetricCard({ label, value, status, sub }: { label: string, value: string, status: 'success' | 'error' | 'idle', sub: string }) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
       <div className="flex justify-between items-start mb-2">
          <p className="text-gray-500 font-bold uppercase tracking-widest">{label}</p>
          {status === 'success' ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-red-500" />}
       </div>
       <p className={status === 'success' ? "text-green-400 text-xl font-black mb-1" : "text-red-400 text-xl font-black mb-1"}>{value}</p>
       <p className="text-[9px] text-gray-600 truncate italic">{sub}</p>
    </div>
  );
}

function EnvRow({ label, value }: { label: string, value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">{label}</span>
      <span className={value ? "text-white truncate bg-white/5 p-2 rounded-lg" : "text-red-500 font-black italic bg-red-500/5 p-2 rounded-lg border border-red-500/10"}>
        {value || 'UNDEFINED'}
      </span>
    </div>
  );
}
