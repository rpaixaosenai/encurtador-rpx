import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link as LinkIcon, 
  LogOut, 
  Copy, 
  Trash2, 
  BarChart2, 
  ExternalLink,
  Plus,
  Pencil,
  X,
  Check,
  QrCode,
  Download
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  
  // Edit Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editError, setEditError] = useState('');

  // QR Code States
  const [qrCodeLink, setQrCodeLink] = useState(null);

  // Stats States
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsLink, setStatsLink] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'links'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setLinks(linksData);
    });
    return unsubscribe;
  }, [user]);

  const fetchStats = async (link) => {
    setStatsLink(link);
    setStatsLoading(true);
    setIsStatsOpen(true);
    try {
      // Buscar na nova coleção plana filtrando pelo ID do link
      const q = query(
        collection(db, 'clicks_data'), 
        where('linkId', '==', link.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.timestamp - a.timestamp); // Sort simples por número
      setStatsData(data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
    setStatsLoading(false);
  };

  const handleEncurtar = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const code = nanoid(6);
      await addDoc(collection(db, 'links'), {
        userId: user.uid,
        originalUrl: url.startsWith('http') ? url : `https://${url}`,
        shortCode: code,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      setUrl('');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openEditModal = (link) => {
    setEditingLink(link);
    setEditUrl(link.originalUrl);
    setEditCode(link.shortCode);
    setEditError('');
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError('');
    setLoading(true);

    try {
      // Se o código mudou, verificar se o novo já existe
      if (editCode !== editingLink.shortCode) {
        const q = query(collection(db, 'links'), where('shortCode', '==', editCode));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setEditError('Este código curto já está em uso.');
          setLoading(false);
          return;
        }
      }

      await updateDoc(doc(db, 'links', editingLink.id), {
        originalUrl: editUrl.startsWith('http') ? editUrl : `https://${editUrl}`,
        shortCode: editCode
      });

      setIsEditOpen(false);
      setEditingLink(null);
    } catch (err) {
      console.error(err);
      setEditError('Falha ao atualizar o link.');
    }
    setLoading(false);
  };

  const handleCopy = (code) => {
    const shortUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(shortUrl);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este link?')) {
      await deleteDoc(doc(db, 'links', id));
    }
  };

  const downloadQRCode = (code) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/${code}`)}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qrcode-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <header className="glass" style={{
        padding: '16px 40px',
        margin: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '20px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
            <LinkIcon size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Encurta Link do Tio Paixão</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{user.email}</span>
          <button 
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
        {/* Input Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass" 
          style={{ padding: '40px', marginBottom: '40px' }}
        >
          <h1 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
            Seu próximo link curto começa aqui
          </h1>
          <form onSubmit={handleEncurtar} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <LinkIcon size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Cole sua URL longa aqui..."
                style={{ width: '100%', padding: '18px 18px 18px 48px', fontSize: '16px' }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              type="submit" 
              style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '0 32px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? 'Processando...' : <><Plus size={20} /> Encurtar</>}
            </button>
          </form>
        </motion.section>

        {/* Links List */}
        <section>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', color: 'var(--text-dim)' }}>Seus Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AnimatePresence>
              {links.map((link) => (
                <motion.div 
                  key={link.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass"
                  style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ flex: 1, marginRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '18px' }}>
                        {window.location.origin}/{link.shortCode}
                      </span>
                      <button 
                        onClick={() => handleCopy(link.shortCode)}
                        style={{ background: 'transparent', color: copySuccess === link.shortCode ? 'var(--success)' : 'var(--text-dim)' }}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                      {link.originalUrl}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => fetchStats(link)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: 'var(--text-main)', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <BarChart2 size={16} color="var(--primary)" /> {link.clicks} cliques
                      </button>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {link.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => setQrCodeLink(link)}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          color: 'var(--primary)', 
                          padding: '8px', 
                          borderRadius: '8px',
                          display: 'flex'
                        }}
                        title="Ver QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                      <button 
                        onClick={() => openEditModal(link)}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          color: 'var(--text-main)', 
                          padding: '8px', 
                          borderRadius: '8px',
                          display: 'flex'
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                      <a 
                        href={`/${link.shortCode}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          color: 'white', 
                          padding: '8px', 
                          borderRadius: '8px',
                          display: 'flex'
                        }}
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(link.id)}
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: 'var(--error)', 
                          padding: '8px', 
                          borderRadius: '8px',
                          display: 'flex'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {links.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                Nenhum link encurtado ainda. Comece agora!
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '32px',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setIsEditOpen(false)}
                style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-dim)' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Editar Link</h2>
              
              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '14px' }}>URL Original</label>
                  <input 
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '14px' }}>Código Curto Customizado</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>/</span>
                    <input 
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      style={{ flex: 1, padding: '14px', fontSize: '16px' }}
                    />
                  </div>
                  {editError && <p style={{ color: 'var(--error)', fontSize: '13px', marginTop: '8px' }}>{editError}</p>}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      borderRadius: '8px', 
                      background: 'rgba(255,255,255,0.05)',
                      fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={loading}
                    type="submit" 
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      borderRadius: '8px', 
                      background: 'var(--primary)',
                      color: 'white',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? 'Salvando...' : <><Check size={20} /> Salvar Alterações</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrCodeLink && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '32px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setQrCodeLink(null)}
                style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-dim)' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>QR Code do Link</h2>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/${qrCodeLink.shortCode}`)}`} 
                  alt="QR Code" 
                  style={{ width: '250px', height: '250px' }}
                />
              </div>

              <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
                {window.location.origin}/{qrCodeLink.shortCode}
              </p>

              <button 
                onClick={() => downloadQRCode(qrCodeLink.shortCode)}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '8px', 
                  background: 'var(--primary)',
                  color: 'white',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={20} /> Baixar QR Code
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {isStatsOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="glass"
              style={{
                width: '90%',
                maxWidth: '900px',
                maxHeight: '80vh',
                padding: '32px',
                position: 'relative',
                overflowY: 'auto'
              }}
            >
              <button 
                onClick={() => setIsStatsOpen(false)}
                style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-dim)' }}
              >
                <X size={24} />
              </button>

              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Estatísticas Detalhadas</h2>
                <p style={{ color: 'var(--text-dim)' }}>
                  Acessos para: <span style={{ color: 'var(--primary)' }}>/{statsLink?.shortCode}</span>
                </p>
              </div>

              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Carregando dados...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)', fontSize: '14px' }}>
                        <th style={{ padding: '12px' }}>Data/Hora</th>
                        <th style={{ padding: '12px' }}>IP</th>
                        <th style={{ padding: '12px' }}>Localização</th>
                        <th style={{ padding: '12px' }}>Dispositivo/Navegador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.map((click) => (
                        <tr key={click.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                          <td style={{ padding: '12px' }}>
                            {new Date(click.timestamp).toLocaleString('pt-BR')}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace' }}>{click.ip}</td>
                          <td style={{ padding: '12px' }}>
                            {click.city ? `${click.city}, ${click.region} (${click.country})` : 'Desconhecido'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '11px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {click.userAgent}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {statsData.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      Nenhum clique registrado ainda.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
