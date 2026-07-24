import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, Mail, Scan, Activity, LogIn, User, Sun, Moon, UserPlus, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

const Login = ({ theme, toggleTheme }) => {
  const [mode, setMode]               = useState('login'); // 'login' or 'register'
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Pending Approval State for User View
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState(null);
  const [terminalText, setTerminalText] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Terminal typewriter effect
  useEffect(() => {
    const fullText = [
      "> INITIATING SECURE HANDSHAKE...",
      "> ESTABLISHING AI CORE UPLINK...",
      "> SENSOR NETWORK: ONLINE",
      "> PREDICTIVE ENGINE: STANDBY",
      "> USER AUTHENTICATION & APPROVAL MODULE: ACTIVE",
      "> AWAITING OPERATOR AUTHORIZATION..."
    ].join('\n');
    
    let i = 0;
    const typeWriter = setInterval(() => {
      setTerminalText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(typeWriter);
      }
    }, 20);
    
    return () => clearInterval(typeWriter);
  }, [mode]);

  // Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setPendingApprovalMsg(null);

    const result = login(email, password);
    if (result.success) {
      toast.success('Authentication Successful. Uplink Established.');
      navigate(result.redirectPath);
    } else if (result.isPending) {
      toast.error('Account Pending Admin Approval');
      setPendingApprovalMsg({
        email,
        title: 'YOUR ACCOUNT IS PENDING APPROVAL FROM ADMIN',
        text: 'Your registration request is under review by the System Administrator. Once approved, you will gain instant access to your assigned portal.'
      });
    } else {
      toast.error(result.message || 'Authentication Failed');
    }
  };

  // Register Submit
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setPendingApprovalMsg(null);

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    const result = register(name, email, password);
    if (result.success) {
      toast.success('Registration Request Sent to Admin');
      setPendingApprovalMsg({
        email,
        name,
        title: 'WAITING FOR APPROVAL FROM ADMIN',
        text: 'Your account registration request has been dispatched to the Admin Portal for authorization. Please wait for an Admin to review and approve your account.'
      });
      // Clear sensitive fields
      setPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.message || 'Registration Failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden', transition: 'background-color var(--transition-normal)' }}>
      
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme} 
        style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* Cyber-Industrial Styles */}
      <style>{`
        .cyber-input {
          width: 100%;
          background: var(--bg-surface);
          border: none;
          border-bottom: 2px solid rgba(56, 189, 248, 0.3);
          color: var(--color-primary);
          padding: 14px 20px 14px 45px;
          font-size: 0.95rem;
          font-family: monospace;
          transition: all 0.3s ease;
          outline: none;
        }
        .cyber-input:focus {
          border-bottom-color: var(--color-primary);
          background: rgba(56, 189, 248, 0.05);
          box-shadow: 0 10px 20px -10px rgba(56, 189, 248, 0.3);
        }
        .cyber-label {
          position: absolute;
          top: -18px;
          left: 0;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-muted);
        }
        .cyber-btn {
          background: transparent;
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
          padding: 14px;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .cyber-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent);
          transition: all 0.5s ease;
        }
        .cyber-btn:hover {
          background: rgba(56, 189, 248, 0.1);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
        }
        .cyber-btn:hover::before {
          left: 100%;
        }
        .mode-tab {
          flex: 1;
          padding: 10px;
          text-align: center;
          font-family: monospace;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          border: 1px solid var(--border-color);
          background: var(--bg-surface);
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .mode-tab.active {
          border-color: var(--color-primary);
          background: rgba(56, 189, 248, 0.1);
          color: var(--color-primary);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }
        .hex-bg {
          background-image: 
            linear-gradient(30deg, var(--bg-surface) 12%, transparent 12.5%, transparent 87%, var(--bg-surface) 87.5%, var(--bg-surface)),
            linear-gradient(150deg, var(--bg-surface) 12%, transparent 12.5%, transparent 87%, var(--bg-surface) 87.5%, var(--bg-surface)),
            linear-gradient(30deg, var(--bg-surface) 12%, transparent 12.5%, transparent 87%, var(--bg-surface) 87.5%, var(--bg-surface)),
            linear-gradient(150deg, var(--bg-surface) 12%, transparent 12.5%, transparent 87%, var(--bg-surface) 87.5%, var(--bg-surface)),
            linear-gradient(60deg, var(--bg-base) 25%, transparent 25.5%, transparent 75%, var(--bg-base) 75%, var(--bg-base)),
            linear-gradient(60deg, var(--bg-base) 25%, transparent 25.5%, transparent 75%, var(--bg-base) 75%, var(--bg-base));
          background-size: 40px 70px;
          background-position: 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px;
          opacity: 0.15;
        }
        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: var(--color-primary);
          box-shadow: 0 0 15px var(--color-primary), 0 0 30px var(--color-primary);
          animation: scan 4s linear infinite;
          z-index: 10;
        }
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .pulse-icon {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 10px rgba(56,189,248,0.8)); }
          100% { transform: scale(1); }
        }
        @media (max-width: 900px) {
          .split-container { flex-direction: column !important; }
          .right-panel { display: none !important; }
        }
      `}</style>

      <div className="split-container" style={{ display: 'flex', width: '100%', zIndex: 1 }}>
        
        {/* LEFT PANEL: The Form */}
        <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
          
          <div onClick={() => navigate('/')} style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <Activity className="pulse-icon" color="var(--color-primary)" />
            <span style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>Titan<span style={{ color: 'var(--color-primary)' }}>Minds</span></span>
          </div>

          <div style={{ width: '100%', maxWidth: '440px', marginTop: '30px' }} className="animate-fade-in-up">
            
            <h2 style={{ fontSize: '2.2rem', fontWeight: 300, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Operator <span style={{ fontWeight: 700 }}>{mode === 'login' ? 'Access' : 'Registration'}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              AUTHENTICATION & USER MANAGEMENT PROTOCOL v2.5 // REQUIRED
            </p>

            {/* TAB SELECTOR: LOGIN VS REGISTER */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              <div 
                className={`mode-tab ${mode === 'login' ? 'active' : ''}`} 
                onClick={() => { setMode('login'); setPendingApprovalMsg(null); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Lock size={14} /> LOGIN ACCESS
              </div>
              <div 
                className={`mode-tab ${mode === 'register' ? 'active' : ''}`} 
                onClick={() => { setMode('register'); setPendingApprovalMsg(null); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <UserPlus size={14} /> REGISTER ACCOUNT
              </div>
            </div>

            {/* ══ PENDING APPROVAL NOTIFICATION BANNER (USER VIEW) ══ */}
            {pendingApprovalMsg ? (
              <div style={{ padding: '20px', border: '1px solid #ffb300', borderRadius: 10, background: 'rgba(255,179,0,0.06)', backdropFilter: 'blur(10px)', marginBottom: '25px', boxShadow: '0 0 25px rgba(255,179,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Clock size={24} color="#ffb300" className="pulse-icon" />
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', color: '#ffb300', letterSpacing: '0.05em' }}>
                    {pendingApprovalMsg.title}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 15, fontFamily: 'sans-serif' }}>
                  {pendingApprovalMsg.text}
                </div>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: 6, fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,179,0,0.2)' }}>
                  ACCOUNT ID: <span style={{ color: '#00e5ff' }}>{pendingApprovalMsg.email}</span><br />
                  STATUS: <span style={{ color: '#ffb300', fontWeight: 700 }}>PENDING ADMIN REVIEW</span>
                </div>
                <button
                  onClick={() => setPendingApprovalMsg(null)}
                  style={{ width: '100%', marginTop: 15, padding: '8px', background: 'transparent', border: '1px solid #ffb300', color: '#ffb300', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
                >
                  BACK TO LOGIN
                </button>
              </div>
            ) : mode === 'login' ? (

              /* ══ LOGIN FORM ══ */
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                <div style={{ position: 'relative' }}>
                  <label className="cyber-label">Operator ID [Email]</label>
                  <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7, width: '18px' }} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cyber-input" 
                    placeholder="admin@mail.com"
                    required
                  />
                </div>
                
                <div style={{ position: 'relative' }}>
                  <label className="cyber-label">Security Key [Password]</label>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7, width: '18px' }} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input" 
                    placeholder="••••"
                    required
                  />
                </div>

                <button type="submit" className="cyber-btn" style={{ marginTop: '10px' }}>
                  <LogIn size={20} /> Authenticate Access
                </button>
              </form>

            ) : (

              /* ══ REGISTER FORM ══ */
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                
                {/* 1. Full Name */}
                <div style={{ position: 'relative' }}>
                  <label className="cyber-label">Operator Full Name</label>
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7, width: '18px' }} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="cyber-input" 
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* 2. Email */}
                <div style={{ position: 'relative' }}>
                  <label className="cyber-label">Email Address</label>
                  <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7, width: '18px' }} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cyber-input" 
                    placeholder="operator@company.com"
                    required
                  />
                </div>
                
                {/* 3. Password */}
                <div style={{ position: 'relative' }}>
                  <label className="cyber-label">Password</label>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7, width: '18px' }} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input" 
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* 4. Confirm Password */}
                <div style={{ position: 'relative' }}>
                  <label className="cyber-label">Confirm Password</label>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7, width: '18px' }} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="cyber-input" 
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" className="cyber-btn" style={{ marginTop: '10px' }}>
                  <UserPlus size={20} /> Submit Registration Request
                </button>
              </form>
            )}

            {/* Default Credentials Hint Box */}
            <div style={{ marginTop: '30px', padding: '14px', border: '1px dashed rgba(56, 189, 248, 0.3)', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--color-primary)' }}>&gt; APPROVED DEMO CREDENTIALS:</span><br/>
              Admin: admin@mail.com | Manager: manager@mail.com | Engineer: engg@mail.com<br/>
              <span style={{ color: 'var(--color-primary)' }}>&gt; PASSKEY:</span> 1234
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Futuristic AI Visual */}
        <div className="right-panel" style={{ flex: '1.2', background: 'var(--bg-surface-hover)', borderLeft: '1px solid var(--border-color)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', transition: 'background-color var(--transition-normal)' }}>
          
          <div className="hex-bg" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}></div>
          <div className="scan-line"></div>
          
          {/* Central Target Reticle */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '500px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '300px', height: '300px', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '50%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'absolute', width: '340px', height: '340px', border: '1px dashed rgba(56, 189, 248, 0.2)', borderRadius: '50%', animation: 'rotateOrb 30s linear infinite' }}></div>
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderTop: '2px solid var(--color-primary)', borderLeft: '2px solid var(--color-primary)', top: '-10px', left: '-10px' }}></div>
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderTop: '2px solid var(--color-primary)', borderRight: '2px solid var(--color-primary)', top: '-10px', right: '-10px' }}></div>
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderBottom: '2px solid var(--color-primary)', borderLeft: '2px solid var(--color-primary)', bottom: '-10px', left: '-10px' }}></div>
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderBottom: '2px solid var(--color-primary)', borderRight: '2px solid var(--color-primary)', bottom: '-10px', right: '-10px' }}></div>
              
              <Scan className="pulse-icon" size={80} color="var(--color-primary)" opacity={0.8} />
            </div>
          </div>

          {/* Terminal Output */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: '60px', background: 'var(--bg-surface)', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--color-danger)', borderRadius: '50%' }}></div>
              <div style={{ width: '10px', height: '10px', background: 'var(--color-warning)', borderRadius: '50%' }}></div>
              <div style={{ width: '10px', height: '10px', background: 'var(--color-success)', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginLeft: '8px' }}>SYS.TERMINAL.OUT</span>
            </div>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-primary)', whiteSpace: 'pre-wrap', textShadow: '0 0 5px rgba(56, 189, 248, 0.5)' }}>
              {terminalText}
              <span style={{ animation: 'pulse 1s infinite' }}>_</span>
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
