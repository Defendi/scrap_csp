import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, CheckCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-md p-8 rounded-3xl"
      >
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4 border border-secondary/30">
              <Shield className="text-secondary w-8 h-8" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight">Crie sua Conta</h1>
           <p className="text-zinc-400 mt-2">Comece suas auditorias recursivas</p>
        </div>

        {error && (
           <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg mb-6">
              {error}
           </div>
        )}

        {success && (
           <div className="bg-success/10 border border-success/20 text-success text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>Conta criada com sucesso! Redirecionando...</span>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">Usuário</label>
              <div className="relative">
                 <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                 <input 
                   type="text" 
                   value={username}
                   onChange={e => setUsername(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-secondary outline-none transition-all"
                   placeholder="seu_usuario"
                   disabled={success}
                 />
              </div>
           </div>
           <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">Senha</label>
              <div className="relative">
                 <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                 <input 
                   type="password" 
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-secondary outline-none transition-all"
                   placeholder="••••••••"
                   disabled={success}
                 />
              </div>
           </div>
           <button 
             type="submit" 
             className="w-full px-6 py-3 bg-secondary hover:bg-secondary/80 transition-all rounded-full font-semibold shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
             disabled={success}
           >
              Cadastrar
           </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-8">
           Já tem uma conta? <Link to="/login" className="text-secondary hover:underline">Faça login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
