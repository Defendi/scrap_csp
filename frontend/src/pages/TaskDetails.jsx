import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ShieldAlert, 
  Globe, 
  Code, 
  Image, 
  FileText,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';

const TaskDetails = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data } = await api.get(`/tasks/${id}`);
        setTask(data);
      } catch (err) {
        console.error('Falha ao buscar detalhes da task', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(task.suggested_rule);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-primary">
    <Zap className="w-12 h-12 animate-pulse" />
    <p className="animate-pulse">Cruzando dados da auditoria...</p>
  </div>;

  if (!task) return <div className="min-h-screen flex items-center justify-center text-danger">Tarefa não encontrada.</div>;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header Back Link */}
      <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-8 group">
         <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
         <span>Voltar ao Dashboard</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Summary & Suggested Rule */}
        <div className="space-y-8">
           <section>
              <h1 className="text-4xl font-extrabold tracking-tighter mb-2 break-all">{new URL(task.target_url).hostname}</h1>
              <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Relatório Gerado em {new Date(task.created_at).toLocaleString()}</p>
           </section>

           <div className="glass p-8 rounded-3xl relative border-primary/20 bg-primary/5">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                       <ShieldCheck className="text-success w-6 h-6" />
                       Sugestão de CSP Rule
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Regra otimizada baseada nos domínios capturados.</p>
                 </div>
                 <button onClick={handleCopy} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all relative">
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                 </button>
              </div>
              
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs leading-relaxed text-zinc-300 break-words line-clamp-10 hover:line-clamp-none transition-all cursor-pointer">
                 {task.suggested_rule || "Analise incompleta: regre CSP ainda não disponível."}
              </div>
           </div>

           {/** Vulnerabilidades Agregadas */}
           <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2 flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-danger" />
                 Vulnerabilidades Identificadas
              </h3>
              <div className="space-y-3">
                 {task.pages.some(p => p.vulnerabilities.length > 0) ? (
                    task.pages.flatMap(p => p.vulnerabilities.map(v => ({ v, url: p.url }))).slice(0, 5).map((item, idx) => (
                       <div key={idx} className="glass p-4 rounded-2xl flex items-start gap-3 border-danger/10 hover:bg-danger/5 transition-all">
                          <AlertTriangle className="text-danger w-5 h-5 mt-0.5" />
                          <div>
                             <p className="font-semibold text-danger text-sm">{item.v}</p>
                             <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-sm">Detectado em: {item.url}</p>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="glass p-4 rounded-2xl border-success/10 bg-success/5 text-success text-center">
                       Nenhuma falha de configuração básica encontrada.
                    </div>
                 )}
              </div>
           </section>
        </div>

        {/* Right Side: Scanned Pages & Detailed Resources */}
        <div className="space-y-8">
           <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2 flex items-center gap-2">
                 <Globe className="w-4 h-4 text-primary" />
                 Páginas Analisadas ({task.pages.length})
              </h3>
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {task.pages.map((p, idx) => (
                     <button key={idx} onClick={() => setSelectedPage(p)} className="w-full glass p-3 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all text-sm border-white/5 text-left cursor-pointer">
                        <span className="truncate max-w-[200px] text-zinc-400">{p.url}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${p.status === 'SCRAPED' || p.status === 'COMPLETED' ? 'bg-success/10 text-success' : (p.status === 'FAILED' ? 'bg-danger/10 text-danger' : 'bg-zinc-500/10 text-zinc-400')}`}>
                           {p.status}
                        </span>
                     </button>
                  ))}
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2 flex items-center gap-2">
                 <ExternalLink className="w-4 h-4 text-secondary" />
                 Serviços e Domínios Externos ({task.external_domains?.length || 0})
              </h3>
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                 {task.external_domains && task.external_domains.length > 0 ? (
                    task.external_domains.map((ext, idx) => (
                       <button
                          key={idx} 
                          onClick={() => setSelectedDomain(ext)}
                          className="w-full glass p-3 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all text-sm border-white/5 cursor-pointer text-left"
                       >
                          <span className="truncate max-w-[200px] text-zinc-300 font-mono text-xs" title={ext.domain}>{ext.domain}</span>
                          <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-secondary/10 text-secondary uppercase border border-secondary/20">
                             {ext.type}
                          </span>
                       </button>
                    ))
                 ) : (
                    <div className="glass p-4 rounded-xl border-white/5 text-zinc-500 text-center text-xs">
                       Nenhum domínio externo carregado.
                    </div>
                 )}
              </div>
           </section>

           <div className="grid grid-cols-2 gap-4">
              <div className="card-vibrant bg-white/5">
                 <FileText className="w-5 h-5 text-primary mb-3" />
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Status da Task</p>
                 <h4 className={`text-xl font-bold ${task.status === 'COMPLETED' ? 'text-success' : 'text-primary'}`}>
                    {task.status}
                 </h4>
              </div>
              <div className="card-vibrant bg-white/5">
                 <ChevronRight className="w-5 h-5 text-secondary mb-3" />
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Duração Est.</p>
                 <h4 className="text-xl font-bold text-white">
                    ~ 1.5 min
                 </h4>
              </div>
           </div>

           {/* Tip Box */}
           <div className="glass p-6 rounded-3xl border-dashed border-white/10 text-sm text-zinc-500 flex gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg inline-flex items-center justify-center">
                 <Zap className="w-4 h-4 text-zinc-400" />
              </div>
              <p>Nossa sugestão foca no princípio do menor privilégio. Revise cada domínio externo antes de aplicar.</p>
           </div>
        </div>
      </div>
      
      {/* Exibição Modal Profile Page */}
      <AnimatePresence>
        {selectedPage && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={() => setSelectedPage(null)}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                          <FileText className="text-primary w-5 h-5" />
                          Perfil da Página
                       </h3>
                    </div>
                    <button onClick={() => setSelectedPage(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                       <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">URL Analisada</p>
                       <p className="text-zinc-300 font-mono text-sm break-all">{selectedPage.url}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Tempo de Execução</p>
                          <div className="flex items-center gap-2">
                             <Clock className="w-4 h-4 text-zinc-400" />
                             <span className="text-lg font-bold text-white">{selectedPage.execution_time_ms ? `${selectedPage.execution_time_ms}ms` : '---'}</span>
                          </div>
                       </div>
                       
                       <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Status Final</p>
                          <div className="flex items-center gap-2">
                             {selectedPage.status === 'SCRAPED' || selectedPage.status === 'COMPLETED' ? <Check className="w-4 h-4 text-success" /> : (selectedPage.status === 'FAILED' ? <AlertTriangle className="w-4 h-4 text-danger" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin"/>)}
                             <span className={`text-lg font-bold ${selectedPage.status === 'SCRAPED' || selectedPage.status === 'COMPLETED' ? 'text-success' : (selectedPage.status === 'FAILED' ? 'text-danger' : 'text-zinc-400')}`}>{selectedPage.status}</span>
                          </div>
                       </div>
                    </div>

                    {selectedPage.status === 'FAILED' && selectedPage.error_message && (
                       <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl mt-4">
                          <p className="text-danger text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Motivo da Falha</p>
                          <p className="text-danger/90 font-mono text-xs max-h-32 overflow-y-auto mt-2">
                             {selectedPage.error_message}
                          </p>
                       </div>
                    )}
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Exibição Modal Profiler Domínios */}
      <AnimatePresence>
        {selectedDomain && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={() => setSelectedDomain(null)}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                          <Globe className="text-secondary w-5 h-5" />
                          {selectedDomain.domain}
                       </h3>
                       <p className="text-zinc-500 text-sm mt-1">Detalhes das {selectedDomain.details?.length || 0} requisições do tipo <span className="uppercase font-bold text-secondary">{selectedDomain.type}</span></p>
                    </div>
                    <button onClick={() => setSelectedDomain(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10 flex-1">
                    {selectedDomain.details?.map((req, i) => (
                       <div key={i} className={`p-4 rounded-xl border flex flex-col gap-2 ${req.has_error ? 'bg-danger/5 border-danger/20' : 'bg-white/5 border-white/5'}`}>
                          <div className="flex items-start justify-between gap-4">
                             <div className="truncate font-mono text-xs text-zinc-300 w-full" title={req.url}>
                                {req.url}
                             </div>
                             {req.duration_ms !== null ? (
                                <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${req.duration_ms > 1000 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                                   <Clock className="w-3 h-3" /> {req.duration_ms}ms
                                </span>
                             ) : (
                                <span className="flex-shrink-0 text-[10px] text-zinc-600 font-bold px-2 py-1 border border-zinc-700/50 rounded-full">
                                   ---
                                </span>
                             )}
                          </div>
                          
                          {req.has_error && (
                             <div className="flex items-center gap-2 text-danger text-xs bg-danger/10 p-2 rounded-lg mt-1 w-full max-w-full">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{req.error_message || 'Conexão rejeitada'}</span>
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskDetails;
