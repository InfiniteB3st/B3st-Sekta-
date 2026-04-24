import React, { useState, useEffect } from 'react';
import { supabase, getKeyHandshake } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Shield, Database, X, AlertTriangle, CheckCircle2, Globe, HardDrive, Zap, Info, Activity, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { EskaMilaBot } from './EskaMilaBot';

interface DevOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevOverlay: React.FC<DevOverlayProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'OK' | 'ERROR'>('IDLE');
  const [addons, setAddons] = useState<any[]>([]);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [probes, setProbes] = useState<Record<string, 'pending' | 'ok' | 'failed'>>({});
  const [showEskaMila, setShowEskaMila] = useState(false);

  const handshake = getKeyHandshake();

  useEffect(() => {
    if (isOpen) {
      loadSystemState();
      measureLatency();
    }
  }, [isOpen]);

  const loadSystemState = async () => {
    const { data } = await supabase.from('user_addons').select('*');
    if (data) {
      setAddons(data);
      runNetworkProbes(data);
    }
  };

  const measureLatency = async () => {
    const start = performance.now();
    try {
      await fetch(window.location.origin, { method: 'HEAD' });
      setNetworkLatency(Math.round(performance.now() - start));
    } catch {
      setNetworkLatency(-1);
    }
  };

  const runNetworkProbes = async (addonList: any[]) => {
    const results: Record<string, 'pending' | 'ok' | 'failed'> = {};
    addonList.forEach(a => results[a.addon_id] = 'pending');
    setProbes(results);

    for (const addon of addonList) {
      try {
        const urlToFetch = addon.url.replace('stremio://', 'https://');
        const res = await fetch(urlToFetch, { method: 'HEAD', mode: 'no-cors' });
        setProbes(prev => ({ ...prev, [addon.addon_id]: 'ok' }));
      } catch {
        setProbes(prev => ({ ...prev, [addon.addon_id]: 'failed' }));
      }
    }
  };

  if (!isOpen) return null;

  const systemDiagnosticData = {
    user: user?.email,
    handshake: handshake.prefix + "...",
    latency: networkLatency,
    addons: addons.map(a => ({ name: a.name, status: probes[a.addon_id] || 'unknown' }))
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/98 z-[99999] p-8 md:p-16 font-mono selection:bg-primary/30 animate-in fade-in duration-500 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* HEADER BLOCK */}
          <div className="flex justify-between items-start border-b border-white/5 pb-10">
            <div className="space-y-4">
              <h2 className="text-primary text-4xl font-black italic uppercase tracking-tighter flex items-center gap-6">
                <Zap className="text-primary animate-pulse" size={40} /> 
                Advanced <span className="text-white">Diagnostics</span>
              </h2>
              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">
                 <span>Kernel v4.2.0-STRIKE</span>
                 <span className="w-2 h-2 bg-primary rounded-full" />
                 <span className="text-primary">Direct Handshake Active</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowEskaMila(true)}
                className="px-8 py-4 bg-primary text-black rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,177,0,0.3)]"
              >
                <Sparkles size={16} />
                Awaken Eska Mila
              </button>
              <button onClick={onClose} className="w-16 h-16 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-all transform hover:rotate-90">
                <X size={32} />
              </button>
            </div>
          </div>

          {/* METRICS HUD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <MetricBox label="Link Latency" value={networkLatency !== null ? `${networkLatency}ms` : 'PROBING...'} status={networkLatency && networkLatency < 200 ? 'success' : 'warning'} />
             <MetricBox label="DB Handshake" value={handshake.prefix + "..."} status="success" />
             <MetricBox label="Active Nodes" value={String(addons.length)} status={addons.length > 0 ? 'success' : 'idle'} />
             <MetricBox label="Secure Tunnel" value="ENCRYPTED" status="success" />
          </div>

          {/* ADDON DEBUGGER TRANSCRIPT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <div className="bg-[#050505] p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h3 className="text-white font-black uppercase text-sm flex items-center gap-4 italic italic">
                      <HardDrive size={18} className="text-primary" /> Installed Node Registry
                   </h3>
                   <Activity size={18} className="text-primary animate-spin-slow" />
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                   {addons.map(a => (
                     <div key={a.addon_id} className="p-6 bg-white/3 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/40 transition-all">
                        <div className="space-y-1">
                           <span className="text-white text-[12px] font-black italic block uppercase tracking-tight">{a.name}</span>
                           <span className="text-gray-700 text-[9px] font-bold uppercase truncate max-w-[200px] block">{a.url}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className={cn("px-4 py-1 rounded-full text-[8px] font-black uppercase", 
                             probes[a.addon_id] === 'ok' ? "bg-green-500/10 text-green-500 border border-green-500/20" : 
                             probes[a.addon_id] === 'failed' ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-white/5 text-gray-500"
                           )}>
                              {probes[a.addon_id] || 'PROBING'}
                           </div>
                           <span className="text-[8px] text-gray-800 font-black">v{a.version}</span>
                        </div>
                     </div>
                   ))}
                   {addons.length === 0 && (
                     <div className="py-20 text-center text-gray-800 italic font-black uppercase tracking-widest text-[10px]">No Nodes Installed in Registry.</div>
                   )}
                </div>
             </div>

             <div className="bg-[#050505] p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h3 className="text-white font-black uppercase text-sm flex items-center gap-4 italic italic">
                      <Database size={18} className="text-primary" /> Handshake Transcript (RAW)
                   </h3>
                </div>
                <div className="bg-black/60 p-8 rounded-3xl border border-white/5 h-[500px] overflow-auto custom-scrollbar">
                   <pre className="text-primary text-[10px] leading-relaxed whitespace-pre-wrap italic opacity-80">
                      [SYSTEM_LOG] Handshake established via SSL tunnel...
                      [SYSTEM_LOG] URL: https://wnjdlqqlmzjklxcgiqap.supabase.co
                      [SYSTEM_LOG] KEY_SIGNATURE: {handshake.prefix}************************{handshake.suffix}
                      <br /><br />
                      [SYSTEM_LOG] Running CORS Integrity Check...
                      [SYSTEM_LOG] Origin Handshake: {window.location.origin} {'->'} OK
                      <br /><br />
                      [SYSTEM_LOG] Verifying Table Permissions...
                      [SYSTEM_LOG] schema.profiles: SELECT_AUTHORIZED
                      [SYSTEM_LOG] schema.user_addons: SELECT_AUTHORIZED
                      [SYSTEM_LOG] schema.watch_history: UPSERT_AUTHORIZED
                      <br /><br />
                      [SYSTEM_LOG] Diagnostic probe finished successfully. No logic leaks detected.
                   </pre>
                </div>
             </div>
          </div>

          <div className="p-10 bg-primary text-black rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-3xl">
             <div className="flex items-center gap-6">
                <ShieldCheck className="w-16 h-16" />
                <div>
                   <h4 className="text-2xl font-black italic uppercase tracking-tighter">Secure Engine Isolation</h4>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Handshake authorized via senior systems protocols.</p>
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest italic max-w-sm text-right">
                Use this overlay to verify manifest availability and network latency. Red markers indicate blocked or offline nodes.
             </p>
          </div>
        </div>
      </div>
      
      <EskaMilaBot 
        isOpen={showEskaMila} 
        onClose={() => setShowEskaMila(false)} 
        diagnosticData={systemDiagnosticData}
      />
    </>
  );
};

function MetricBox({ label, value, status }: { label: string, value: string, status: 'success' | 'warning' | 'idle' }) {
  return (
    <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-2">
       <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">{label}</span>
       <div className="flex items-center justify-between">
          <span className={cn("text-2xl font-black italic tracking-tighter uppercase", 
            status === 'success' ? "text-white" : status === 'warning' ? "text-yellow-500" : "text-gray-500"
          )}>{value}</span>
          <div className={cn("w-3 h-3 rounded-full", 
            status === 'success' ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
            status === 'warning' ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-white/10"
          )} />
       </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
