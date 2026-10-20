import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bot, BrainCircuit, Check, ChevronDown,
  CircleHelp, Clock3, Command, FileText, Globe2, LayoutDashboard, Menu,
  MessageSquare, MoreHorizontal, Plus, Search, Send, Settings2, ShieldCheck,
  Sparkles, SquarePen, Sun, Terminal, Trash2, Workflow, X, Zap
} from 'lucide-react';
import './styles.css';

const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';

const initialMessages = [{
  id: 1, role: 'assistant', time: 'Agora',
  content: 'Olá! Sou o Orbit, seu agente pessoal. Posso ajudar a organizar ideias, resumir informações e iniciar automações. O que vamos fazer hoje?',
  kind: 'welcome'
}];

const suggestions = [
  { icon: FileText, title: 'Organizar minhas ideias', detail: 'Transforme uma ideia em um plano de ação.' },
  { icon: Workflow, title: 'Criar uma automação', detail: 'Planeje um workflow para uma tarefa repetitiva.' },
  { icon: BrainCircuit, title: 'Explicar um conceito', detail: 'Aprenda algo com exemplos práticos.' },
  { icon: Terminal, title: 'Ajudar com código', detail: 'Investigue um erro ou estruture uma solução.' }
];

function demoAnswer(message) {
  const lower = message.toLowerCase();
  if (lower.includes('automação') || lower.includes('workflow') || lower.includes('n8n')) {
    return {
      text: 'Vamos transformar isso em um workflow claro. Minha sugestão é começar pelo gatilho, validar os dados recebidos, executar uma ação principal e registrar o resultado. Depois adicionamos tratamento de erros e notificações.\n\n**Próximos passos**\n1. Definir o evento que inicia o fluxo.\n2. Identificar os dados de entrada.\n3. Escolher os serviços que serão integrados.\n4. Testar os caminhos de sucesso e falha.',
      intent: 'automation'
    };
  }
  if (lower.includes('código') || lower.includes('java') || lower.includes('erro')) {
    return {
      text: 'Posso ajudar a investigar isso. Para chegar a uma solução confiável, compartilhe o trecho relevante do código, a mensagem de erro completa e o que você esperava que acontecesse. Vamos analisar a causa antes de mudar várias coisas ao mesmo tempo.',
      intent: 'coding'
    };
  }
  if (lower.includes('ideia') || lower.includes('plano') || lower.includes('organizar')) {
    return {
      text: 'Vamos organizar isso em etapas. Primeiro, definimos o resultado desejado; depois dividimos o trabalho em tarefas pequenas, priorizamos o que desbloqueia o restante e estabelecemos critérios para saber quando cada etapa está concluída.\n\n**Plano inicial**\n- Objetivo e resultado esperado\n- Tarefas prioritárias\n- Recursos e dependências\n- Critérios de validação',
      intent: 'planning'
    };
  }
  return {
    text: 'Entendi. Posso ajudar a explorar essa ideia e transformá-la em ações concretas. Para começar, vou separar o objetivo, as informações disponíveis e o próximo passo mais útil. Se for uma tarefa que precise de dados externos ou de executar uma ação, essa capacidade deverá ser configurada no workflow do n8n.',
    intent: 'general'
  };
}

function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeNav, setActiveNav] = useState('assistant');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [connection, setConnection] = useState(webhookUrl ? 'configured' : 'demo');

  const pageTitle = activeNav === 'assistant' ? 'Assistente' : activeNav === 'activity' ? 'Atividade' : activeNav === 'knowledge' ? 'Conhecimento' : 'Configurações';
  const filteredHistory = useMemo(() => history.filter(item => item.title.toLowerCase().includes(search.toLowerCase())), [history, search]);

  function newChat() {
    if (messages.length > 1) {
      const firstUser = messages.find(m => m.role === 'user');
      setHistory(prev => [{ id: Date.now(), title: firstUser?.content.slice(0, 48) || 'Conversa sem título', date: 'Agora', messages }, ...prev]);
    }
    setMessages(initialMessages);
    setActiveNav('assistant');
    setSidebarOpen(false);
    setNotice('');
  }

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean || busy) return;

    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMessage = { id: Date.now(), role: 'user', content: clean, time: currentTime };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setBusy(true);
    setNotice('');

    try {
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: clean, chatInput: clean, source: 'orbit-frontend' })
        });

        if (!response.ok) throw new Error(`O webhook respondeu HTTP ${response.status}`);

        setConnection('connected');

        const assistantId = Date.now() + 1;
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: '',
          intent: 'n8n',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]);

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            let chunk = decoder.decode(value, { stream: true });
            
            // Tratamento caso o n8n envie em formato JSON puro {"output":"..."}
            if (chunk.includes('{"output":"')) {
              try {
                const parsed = JSON.parse(chunk);
                chunk = parsed.output || chunk;
              } catch (e) {
                chunk = chunk.replace(/^{"output":"/, '').replace(/"}$/, '');
              }
            }

            setMessages(prev => prev.map(msg => 
              msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg
            ));
          }
        }
      } else if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 650));
        const answer = demoAnswer(clean);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: answer.text,
          intent: answer.intent,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error('Configure VITE_N8N_WEBHOOK_URL no arquivo .env.');
      }
    } catch (error) {
      setNotice(`${error.message}. Confira o webhook, o n8n e as configurações de CORS.`);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        role: 'assistant',
        content: 'Não consegui alcançar o serviço configurado. Verifique se o n8n está ativo e se a URL do webhook está correta.',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        error: true
      }]);
      setConnection('error');
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function selectSuggestion(title) {
    const prompts = {
      'Organizar minhas ideias': 'Me ajude a transformar uma ideia em um plano de ação organizado.',
      'Criar uma automação': 'Me ajude a planejar uma automação no n8n para uma tarefa repetitiva.',
      'Explicar um conceito': 'Explique um conceito de tecnologia com exemplos práticos.',
      'Ajudar com código': 'Me ajude a investigar um problema de código. Que informações você precisa?'
    };
    sendMessage(prompts[title] || title);
  }

  return (
    <div className="desktop-shell">
      <div className="mac-window">
        <header className="mac-titlebar">
          <div className="window-title"><Sparkles size={13}/> Orbit <span>Personal AI</span></div>
          <div className="titlebar-right"><span className="titlebar-live"/> Ambiente local</div>
        </header>
        <div className="app-shell">
          <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="brand-row">
              <div className="brand-mark"><Sparkles size={19} strokeWidth={2.2} /></div>
              <span className="brand-name">orbit<span className="brand-dot">.</span></span>
              <button className="icon-btn sidebar-close" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}><X size={18}/></button>
            </div>

            <button className="new-chat" onClick={newChat}><SquarePen size={16}/><span>Nova conversa</span><span className="shortcut">⌘ K</span></button>

            <div className="nav-label">WORKSPACE</div>
            <nav className="main-nav">
              <button className={activeNav === 'assistant' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('assistant')}><MessageSquare size={17}/><span>Assistente</span></button>
              <button className={activeNav === 'activity' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('activity')}><Activity size={17}/><span>Atividade</span><span className="nav-count">{history.length + messages.filter(m => m.role === 'user').length}</span></button>
              <button className={activeNav === 'knowledge' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('knowledge')}><BrainCircuit size={17}/><span>Conhecimento</span><span className="soon">EM BREVE</span></button>
            </nav>

            <div className="history-heading">
              <span className="nav-label">RECENTES</span>
              <button className="tiny-icon" aria-label="Nova conversa" onClick={newChat}><Plus size={15}/></button>
            </div>
            <div className="history-search"><Search size={14}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversas"/></div>
            <div className="history-list">
              {filteredHistory.length ? filteredHistory.map(item => (
                <button className="history-item" key={item.id} onClick={() => { setMessages(item.messages); setActiveNav('assistant'); setSidebarOpen(false); }}>
                  <MessageSquare size={15}/><span>{item.title}</span>
                </button>
              )) : <div className="empty-history">{search ? 'Nenhuma conversa encontrada.' : 'Suas conversas aparecerão aqui.'}</div>}
            </div>

            <div className="sidebar-bottom">
              <div className="local-card">
                <div className="local-icon"><ShieldCheck size={16}/></div>
                <div className="local-copy"><strong>Seu espaço privado</strong><span>Projetado para execução local</span></div>
                <span className="status-dot"/>
              </div>
              <button className="profile-row" onClick={() => setSettingsOpen(true)}>
                <div className="avatar">A</div>
                <div className="profile-copy"><strong>Meu workspace</strong><span>Plano local</span></div>
                <MoreHorizontal size={18} className="profile-more"/>
              </button>
            </div>
          </aside>

          {sidebarOpen && <button className="mobile-overlay" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}

          <main className="main-panel">
            <header className="topbar">
              <div className="topbar-left">
                <button className="icon-btn mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={19}/></button>
                <span className="breadcrumb-muted">Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{pageTitle}</span>
              </div>
              <div className="topbar-actions">
                <div className={`connection-pill ${connection}`}><span className="status-dot"/>{connection === 'connected' ? 'n8n conectado' : connection === 'error' ? 'Falha na conexão' : 'Modo demonstração'}</div>
                <button className="icon-btn" aria-label="Configurações" onClick={() => setSettingsOpen(true)}><Settings2 size={18}/></button>
                <button className="help-btn" onClick={() => setNotice('Dica: configure o webhook do n8n no arquivo .env para conectar a IA.')}><CircleHelp size={16}/><span>Ajuda</span></button>
              </div>
            </header>

            {activeNav === 'assistant' && (
              <section className="assistant-view">
                {messages.length <= 1 ? (
                  <div className="welcome-area">
                    <div className="welcome-eyebrow"><span className="eyebrow-line"/><Sparkles size={13}/><span>SEU ASSISTENTE PESSOAL</span><span className="eyebrow-line"/></div>
                    <div className="orb-wrap"><div className="orb-halo"/><div className="orb"><div className="orb-core"/><div className="orb-shine"/></div><span className="orb-spark spark-one">✳</span><span className="orb-spark spark-two">✧</span></div>
                    <h1>Uma ideia de cada vez.<br/><span>Vamos começar?</span></h1>
                    <p className="welcome-subtitle">Pense em voz alta. Organize seus planos. Automatize o que importa.<br className="desktop-break"/> Seu espaço para transformar intenção em ação.</p>
                    <div className="suggestion-grid">
                      {suggestions.map(({ icon: Icon, title, detail }) => (
                        <button className="suggestion-card" key={title} onClick={() => selectSuggestion(title)}>
                          <div className="suggestion-icon"><Icon size={18}/></div>
                          <div className="suggestion-copy"><strong>{title}</strong><span>{detail}</span></div>
                          <ArrowUpRight size={16} className="suggestion-arrow"/>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="conversation">
                    <div className="conversation-meta"><span className="live-dot"/><span>CONVERSA ATIVA</span><span className="meta-separator">·</span><span>{messages.filter(m => m.role === 'user').length} mensagens suas</span></div>
                    {messages.map(message => (
                      <div className={`message-row ${message.role}`} key={message.id}>
                        {message.role === 'assistant' && <div className="message-avatar"><Sparkles size={15}/></div>}
                        <div className="message-body">
                          <div className="message-author">{message.role === 'assistant' ? 'Orbit' : 'Você'} <span>{message.time}</span></div>
                          <div className={`message-content ${message.error ? 'message-error' : ''}`}>
                            {message.content ? message.content.split('\n').map((line, i) => (
                              <React.Fragment key={i}>
                                {line.startsWith('**') && line.endsWith('**') ? <strong className="message-heading">{line.slice(2,-2)}</strong> : line}
                                {i < message.content.split('\n').length - 1 && <br/>}
                              </React.Fragment>
                            )) : <span className="typing-cursor">▌</span>}
                          </div>
                          {message.role === 'assistant' && !message.welcome && message.content && (
                            <div className="message-tools">
                              <button onClick={() => navigator.clipboard?.writeText(message.content)}><FileText size={13}/> Copiar resposta</button>
                              <span className="response-tag"><Sparkles size={11}/>{message.intent || 'assistente'}</span>
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && <div className="user-avatar">A</div>}
                      </div>
                    ))}
                    {busy && <div className="message-row assistant"><div className="message-avatar"><Sparkles size={15}/></div><div className="message-body"><div className="message-author">Orbit <span>agora</span></div><div className="typing"><i/><i/><i/><span>Gerando resposta...</span></div></div></div>}
                    <div id="conversation-end"/>
                  </div>
                )}
                <div className={`composer-wrap ${messages.length > 1 ? 'composer-in-conversation' : ''}`}>
                  {notice && <div className="notice"><CircleHelp size={14}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={14}/></button></div>}
                  <form className="composer" onSubmit={handleSubmit}>
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} placeholder="Pergunte qualquer coisa ao Orbit..." rows={1} aria-label="Mensagem para o agente"/>
                    <div className="composer-bottom">
                      <div className="composer-tools"><span className="composer-mode"><BrainCircuit size={14}/> Assistente <ChevronDown size={13}/></span><span className="composer-local"><span className="status-dot"/> Local</span></div>
                      <div className="composer-send-area"><span className="enter-hint">↵ enviar</span><button className="send-btn" type="submit" disabled={!input.trim() || busy} aria-label="Enviar mensagem">{busy ? <div className="mini-spinner"/> : <Send size={16}/>}</button></div>
                    </div>
                  </form>
                  <p className="disclaimer">O Orbit pode cometer erros. Revise informações importantes antes de agir.</p>
                </div>
              </section>
            )}

            {activeNav === 'activity' && (
              <section className="secondary-view">
                <div className="section-eyebrow"><Activity size={14}/> CENTRAL DE ATIVIDADE</div>
                <h1>Seu trabalho, em movimento.</h1>
                <p className="secondary-subtitle">Acompanhe as conversas e ações desta sessão.</p>
                <div className="stats-grid">
                  <div className="stat-card"><span>Mensagens nesta sessão</span><strong>{messages.filter(m => m.role === 'user').length}</strong><MessageSquare size={18}/></div>
                  <div className="stat-card"><span>Conversas salvas</span><strong>{history.length}</strong><Clock3 size={18}/></div>
                  <div className="stat-card"><span>Status do agente</span><strong className="stat-status">{connection === 'connected' ? 'Conectado' : connection === 'error' ? 'Atenção' : 'Demonstração'}</strong><Activity size={18}/></div>
                </div>
                <div className="activity-panel"><div className="panel-heading"><strong>Eventos recentes</strong><span>Esta sessão</span></div>{messages.filter(m => m.role === 'user').length ? messages.filter(m => m.role === 'user').map(m => <div className="activity-row" key={m.id}><div className="activity-icon"><MessageSquare size={15}/></div><div><strong>Mensagem enviada</strong><p>{m.content}</p></div><span>{m.time}</span></div>) : <div className="panel-empty"><Activity size={24}/><strong>Nenhuma atividade ainda</strong><span>Comece uma conversa para ver seus eventos aqui.</span><button onClick={() => setActiveNav('assistant')}>Ir para o assistente <ArrowUpRight size={14}/></button></div>}</div>
              </section>
            )}

            {activeNav === 'knowledge' && (
              <section className="secondary-view">
                <div className="section-eyebrow"><BrainCircuit size={14}/> MEMÓRIA E CONTEXTO</div>
                <h1>Conhecimento do Orbit.</h1>
                <p className="secondary-subtitle">Prepare a próxima evolução do agente: uma base de conhecimento pesquisável.</p>
                <div className="knowledge-card"><div className="knowledge-illustration"><BrainCircuit size={30}/></div><div><span className="feature-label">PRÓXIMA FUNCIONALIDADE</span><h3>Memória com controle seu</h3><p>Na próxima versão, o agente poderá consultar documentos locais e recuperar contexto relevante. Os arquivos e as fontes deverão ser escolhidos por você.</p><button className="outline-btn" onClick={() => setNotice('Roadmap: ingestão de documentos, embeddings locais, busca semântica e opção de apagar a memória.')}>Ver ideia de implementação <ArrowUpRight size={14}/></button></div></div>
                <div className="feature-list"><div><ShieldCheck size={17}/><span><strong>Privacidade primeiro</strong><small>Dados armazenados localmente quando configurado.</small></span><span className="feature-state">PLANEJADO</span></div><div><Search size={17}/><span><strong>Busca contextual</strong><small>Encontrar trechos relevantes em documentos.</small></span><span className="feature-state">PLANEJADO</span></div><div><Trash2 size={17}/><span><strong>Controle de memória</strong><small>Revisar e remover informações armazenadas.</small></span><span className="feature-state">PLANEJADO</span></div></div>
              </section>
            )}

            <footer className="app-footer"><span>ORBIT <span className="footer-separator">/</span> PERSONAL AI WORKSPACE</span><span><span className="footer-status"/>{connection === 'connected' ? 'Conectado ao n8n' : 'Executando em modo local'}</span><span className="footer-version">v0.1.0 · Preview</span></footer>
          </main>
        </div>
        {settingsOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSettingsOpen(false); }}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="modal-header"><div><span className="section-eyebrow"><Settings2 size={13}/> PREFERÊNCIAS</span><h2 id="settings-title">Configurações do workspace</h2></div><button className="icon-btn" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações"><X size={18}/></button></div><div className="setting-row"><div className="setting-icon"><Workflow size={17}/></div><div className="setting-copy"><strong>Webhook do n8n</strong><span>{webhookUrl || 'Nenhuma URL configurada no .env'}</span></div><span className={`setting-state ${webhookUrl ? 'ok' : ''}`}>{webhookUrl ? 'CONFIGURADO' : 'DEMO'}</span></div><div className="setting-row"><div className="setting-icon"><BrainCircuit size={17}/></div><div className="setting-copy"><strong>Modelo de IA</strong><span>OpenRouter - Nvidia Nemotron 3.5 Free</span></div><span className="setting-state">OPENROUTER</span></div><div className="setting-row"><div className="setting-icon"><ShieldCheck size={17}/></div><div className="setting-copy"><strong>Modo de privacidade</strong><span>O frontend não salva conversas no servidor por padrão.</span></div><span className="setting-state ok">ATIVO</span></div><div className="modal-note"><CircleHelp size={16}/><p>Para conectar o agente, configure <code>VITE_N8N_WEBHOOK_URL</code> no arquivo <code>.env</code>, reinicie o frontend e configure o CORS no n8n para permitir a origem do frontend local.</p></div><button className="modal-done" onClick={() => setSettingsOpen(false)}>Concluído <Check size={15}/></button></section></div>}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);