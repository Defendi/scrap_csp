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
  Zap
} from 'lucide-react';

const TaskDetails = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                 {task.pages.map((p, idx) => (
                    <div key={idx} className="glass p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all text-sm border-white/5">
                       <span className="truncate max-w-[200px] text-zinc-400">{p.url}</span>
                       <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${p.status === 'SCRAPED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {p.status}
                       </span>
                    </div>
                 ))}
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
    </div>
  );
};

export default TaskDetails;
