import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail]       = useState('admin@helpdesk.pe');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading]   = useState(false);
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido al sistema');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0F2040] to-[#162B50] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/40 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">HelpDesk Pro</h1>
          <p className="text-white/40 text-sm mt-1">Mesa de Ayuda ITIL v4 · IA</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-white text-lg font-semibold mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">Correo electrónico</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-lg text-white text-sm placeholder-white/30 outline-none focus:border-blue-500 focus:bg-white/12 transition-colors"
                placeholder="usuario@empresa.com" required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">Contraseña</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-lg text-white text-sm placeholder-white/30 outline-none focus:border-blue-500 focus:bg-white/12 transition-colors"
                placeholder="••••••••" required
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Verificando...</> : 'Ingresar al sistema'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-white/30 text-xs text-center mb-3">Cuentas de demostración</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@helpdesk.pe', pwd: 'Admin123!' },
                { label: 'Técnico', email: 'ana@helpdesk.pe', pwd: 'Tech123!' },
              ].map((a) => (
                <button key={a.email}
                  onClick={() => { setEmail(a.email); setPassword(a.pwd); }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 text-xs font-medium transition-colors text-left"
                >
                  <span className="block text-white/80 font-semibold">{a.label}</span>
                  <span className="block truncate">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          HelpDesk Pro v1.0 · Perú 2025
        </p>
      </div>
    </div>
  );
}
