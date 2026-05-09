import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Chrome, UserPlus } from 'lucide-react';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (err) {
      setError('Falha na autenticação. Verifique seus dados.');
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Erro ao entrar com Google.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          textAlign: 'center'
        }}
      >
        <div style={{
          background: 'var(--primary)',
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 16px rgba(59, 130, 246, 0.4)'
        }}>
          <LogIn color="white" size={32} />
        </div>

        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
          {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '32px', fontSize: '14px' }}>
          {isLogin ? 'Acesse o Encurta Link do Tio Paixão' : 'Comece a encurtar seus links agora'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid var(--error)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
            <input 
              type="email" 
              placeholder="Seu e-mail" 
              required
              style={{ width: '100%', paddingLeft: '40px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
            <input 
              type="password" 
              placeholder="Sua senha" 
              required
              style={{ width: '100%', paddingLeft: '40px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '14px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            marginTop: '10px'
          }}>
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', color: 'var(--text-dim)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ margin: '0 10px', fontSize: '12px' }}>OU</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <button 
          onClick={handleGoogle}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: '500'
          }}
        >
          <Chrome size={20} /> Entrar com Google
        </button>

        <p style={{ marginTop: '32px', color: 'var(--text-dim)', fontSize: '14px' }}>
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'} {' '}
          <span 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
