import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Credenciais inválidas ou erro no servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 rounded-3xl"
      >
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 animate-pulse">
              <Shield className="text-primary w-8 h-8" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight">Scrap-CSP</h1>
           <p className="text-zinc-400 mt-2">Segurança recursiva simplificada</p>
        </div>

        {error && (
           <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg mb-6">
              {error}
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
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-primary outline-none transition-all"
                   placeholder="seu_usuario"
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
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-primary outline-none transition-all"
                   placeholder="••••••••"
                 />
              </div>
           </div>
           <button type="submit" className="w-full btn-primary mt-4 py-3">
              Entrar
           </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-8">
           Novo por aqui? <Link to="/register" className="text-primary hover:underline">Crie uma conta</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
