import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Loader2,
  AlertTriangle,
  LayoutDashboard,
  LogOut,
  Globe,
  RefreshCw,
  Key,
  X,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, api, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Falha ao buscar tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // Polling simple local
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUrl) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/tasks', { target_url: newUrl });
      setNewUrl('');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    
    if (newPassword !== confirmNewPassword) {
      setPwdError('A nova senha e a confirmação não coincidem.');
      return;
    }
    
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPwdSuccess('Senha atualizada com sucesso!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPwdSuccess('');
      }, 2000);
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Erro ao alterar senha');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir esta auditoria?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  const handleRepeat = async (e, url) => {
    e.stopPropagation();
    setError('');
    setLoading(true);
    try {
      await api.post('/tasks', { target_url: url });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao repetir auditoria');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-zinc-400" />;
      case 'PROCESSING': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'FAILED': return <AlertTriangle className="w-5 h-5 text-danger" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'PENDING': return <span className="text-zinc-400">Pendente</span>;
      case 'PROCESSING': return <span className="text-primary font-medium">Analisando...</span>;
      case 'COMPLETED': return <span className="text-success font-medium">Concluído</span>;
      case 'FAILED': return <span className="text-danger font-medium">Falha</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 md:p-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <LayoutDashboard className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard de Auditoria</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
             <p className="text-sm font-medium">{user.username}</p>
             <p className="text-xs text-zinc-500 uppercase tracking-widest">Colaborador</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPasswordModal(true)} className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20 rounded-lg transition-all" title="Alterar Senha">
               <Key className="w-5 h-5" />
            </button>
            <button onClick={logout} className="p-2 hover:bg-danger/10 text-zinc-400 hover:text-danger border border-white/5 hover:border-danger/20 rounded-lg transition-all" title="Sair">
               <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Create Task Card */}
          <section className="lg:col-span-4 glass p-8 rounded-3xl mb-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
             <div className="relative z-10">
                <h2 className="text-xl font-bold mb-2">Nova Auditoria Recursiva</h2>
                <p className="text-zinc-100/60 text-sm mb-6">Insira a URL raiz para escanear até 10 páginas e gerar uma política CSP robusta.</p>
                <form onSubmit={handleCreate} className="flex gap-4">
                   <div className="flex-1 relative">
                      <Globe className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                      <input 
                        type="url" 
                        required
                        placeholder="https://exemplo.com.br"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary outline-none transition-all placeholder:text-zinc-600"
                      />
                   </div>
                   <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      Analisar
                   </button>
                </form>
                {error && <p className="text-danger text-xs mt-3">{error}</p>}
             </div>
          </section>

          {/* Stats Summary (Aggregated from tasks) */}
          <div className="lg:col-span-1 space-y-6">
             <div className="card-vibrant bg-white/5">
                <p className="text-zinc-500 text-sm uppercase font-bold tracking-widest mb-1">Total de Tasks</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black">{tasks.length}</h3>
                   <span className="text-zinc-500 text-xs">atividades</span>
                </div>
             </div>
             <div className="card-vibrant bg-white/5">
                <p className="text-zinc-500 text-sm uppercase font-bold tracking-widest mb-1">Pendentes/Em Fila</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black text-primary">
                      {tasks.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length}
                   </h3>
                </div>
             </div>
          </div>

          {/* Task List */}
          <div className="lg:col-span-3 space-y-4">
             <h3 className="text-zinc-500 text-xs uppercase font-bold tracking-widest pl-2">Auditorias Recentes</h3>
             <AnimatePresence mode='popLayout'>
                {tasks.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 text-center rounded-3xl border-dashed border-white/10">
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-zinc-600 w-6 h-6" />
                     </div>
                     <p className="text-zinc-500">Nenhuma auditoria iniciada ainda.</p>
                  </motion.div>
                ) : (
                  tasks.map((task) => (
                    <motion.div 
                      layout
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="glass hover:bg-white/10 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6 cursor-pointer transition-all group"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <div className="flex-1 flex gap-4 items-center">
                         <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <Globe className="text-zinc-400 w-5 h-5" />
                         </div>
                         <div className="overflow-hidden">
                            <p className="font-semibold text-white truncate max-w-[250px] md:max-w-md">{task.target_url}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">Criada em {new Date(task.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 min-w-[140px] justify-end">
                         <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            {getStatusLabel(task.status)}
                         </div>
                         <button 
                            onClick={(e) => handleRepeat(e, task.target_url)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:text-secondary transition-all text-zinc-500"
                            title="Repetir Auditoria"
                          >
                            <RefreshCw className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={(e) => handleDelete(e, task.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:text-danger transition-all text-zinc-500"
                            title="Excluir Auditoria"
                          >
                            <Trash2 className="w-4 h-4" />
                         </button>
                         <ExternalLink className="w-4 h-4 text-zinc-500 opacity-20 group-hover:opacity-100" />
                      </div>
                    </motion.div>
                  ))
                )}
             </AnimatePresence>
           </div>
        </div>
      </main>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm flex flex-col shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-all rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold">Alterar Senha</h2>
                <p className="text-sm text-zinc-500 mt-1">Defina uma nova senha segura</p>
              </div>

              {pwdError && <div className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">{pwdError}</div>}
              {pwdSuccess && <div className="p-3 mb-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm">{pwdSuccess}</div>}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Senha Atual</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input 
                      type="password" 
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={!!pwdSuccess}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:border-white/40 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={!!pwdSuccess}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:border-white/40 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input 
                      type="password" 
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={!!pwdSuccess}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:border-white/40 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={!!pwdSuccess}
                  className="w-full bg-white text-black font-bold rounded-xl py-2.5 mt-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  Salvar Nova Senha
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
