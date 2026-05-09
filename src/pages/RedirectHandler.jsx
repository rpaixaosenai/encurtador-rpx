import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  increment,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

const RedirectHandler = () => {
  const { code } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const performRedirect = async () => {
      try {
        const q = query(collection(db, 'links'), where('shortCode', '==', code));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const linkDoc = querySnapshot.docs[0];
          const linkData = linkDoc.data();
          
          console.log('Link encontrado:', linkData.originalUrl);

          // 1. Capturar Metadados e IP
          const analyticsData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            referrer: document.referrer || 'Direto',
            timestamp: serverTimestamp(),
            platform: navigator.platform
          };

          try {
            console.log('Buscando dados de IP...');
            const ipResponse = await fetch('https://ipapi.co/json/');
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              analyticsData.ip = ipData.ip;
              analyticsData.city = ipData.city;
              analyticsData.region = ipData.region;
              analyticsData.country = ipData.country_name;
              console.log('Dados de IP capturados:', ipData.ip);
            }
          } catch (ipErr) {
            console.warn('Falha ao obter IP:', ipErr);
            analyticsData.ip = 'Erro na captura';
          }

          // 2. Salvar na coleção plana 'clicks_data'
          try {
            console.log('Salvando dados na coleção clicks_data...');
            await addDoc(collection(db, 'clicks_data'), {
              ...analyticsData,
              linkId: linkDoc.id,
              shortCode: code,
              timestamp: Date.now() // Usando timestamp local para garantir gravação imediata
            });
            console.log('Dados de clique salvos com sucesso!');
          } catch (dbErr) {
            console.error('Erro crítico ao salvar dados de clique:', dbErr);
          }

          // 3. Incrementar cliques globais
          try {
            await updateDoc(doc(db, 'links', linkDoc.id), {
              clicks: increment(1)
            });
            console.log('Contador de cliques incrementado.');
          } catch (clickErr) {
            console.error('Erro ao incrementar cliques:', clickErr);
          }

          // 4. Redirecionar
          console.log('Redirecionando para:', linkData.originalUrl);
          window.location.href = linkData.originalUrl;
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    performRedirect();
  }, [code]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
        <AlertCircle size={64} color="var(--error)" />
        <h1 style={{ fontSize: '24px' }}>Link não encontrado</h1>
        <p style={{ color: 'var(--text-dim)' }}>O link que você tentou acessar não existe ou foi removido.</p>
        <a href="/" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Voltar para o Início</a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 size={48} color="var(--primary)" />
      </motion.div>
      <h1 style={{ fontSize: '20px', fontWeight: '400' }}>Redirecionando...</h1>
    </div>
  );
};

export default RedirectHandler;
