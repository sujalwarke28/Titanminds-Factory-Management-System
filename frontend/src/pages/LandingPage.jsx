import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, Zap, ArrowRight, Cpu, TrendingUp, TrendingDown, DollarSign, Waves, AlertTriangle, Sun, Moon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { root: document.querySelector('.snap-container'), threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);
};

// Market Data for Chart: Simulating cumulative costs over 5 years
const marketCostData = [
  { year: 'Year 1', reactiveCost: 500, predictiveCost: 350 },
  { year: 'Year 2', reactiveCost: 1100, predictiveCost: 600 },
  { year: 'Year 3', reactiveCost: 1800, predictiveCost: 800 },
  { year: 'Year 4', reactiveCost: 2600, predictiveCost: 950 },
  { year: 'Year 5', reactiveCost: 3500, predictiveCost: 1100 },
];

const LandingPage = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <nav style={{ padding: 'var(--spacing-6) var(--spacing-12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', position: 'fixed', width: '100%', zIndex: 100 }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
          <Cpu className="text-gradient" style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>TitanMinds</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
          <button onClick={toggleTheme} className="theme-toggle" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: 'var(--spacing-2) var(--spacing-6)', fontSize: '0.9rem' }}>
            Platform Login
          </button>
        </div>
      </nav>

      <main className="snap-container">
        
        {/* Animated Hero Splash Section */}
        <section className="snap-section" style={{ padding: '0 var(--spacing-12)' }}>
          
          {/* Splash Background Animations */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', opacity: 0.6 }}>
            {/* Rotating Gradient Orbs */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 60%)', filter: 'blur(80px)', animation: 'rotateOrb 20s linear infinite' }} />
            <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 60%)', filter: 'blur(100px)', animation: 'rotateOrb 25s linear infinite reverse' }} />
            
            {/* Animated SVG Data Flow */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }} xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 300 Q 200 100, 400 300 T 800 300 T 1200 300" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeOpacity="0.1" />
              <path d="M 0 300 Q 200 100, 400 300 T 800 300 T 1200 300" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeDasharray="1000" style={{ animation: 'dataFlow 8s infinite ease-in-out' }} />
              <path d="M -100 500 Q 300 700, 500 500 T 900 500 T 1400 500" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeOpacity="0.1" />
              <path d="M -100 500 Q 300 700, 500 500 T 900 500 T 1400 500" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="1000" style={{ animation: 'dataFlow 12s infinite ease-in-out reverse' }} />
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: 'var(--spacing-12)', alignItems: 'center' }}>
            <div className="reveal active delay-100" style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-1) var(--spacing-3)', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--spacing-4)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-primary)' }}>
                <Activity size={16} /> Edge AI IoT Platform
              </div>
              <h1 style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: 'var(--spacing-6)' }}>
                Predict Failures <br />
                <span className="text-gradient">Before They Happen.</span>
              </h1>
              <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-8)', lineHeight: 1.6, maxWidth: '600px' }}>
                Stop reacting to machine downtime. Using advanced IoT telemetry and Explainable Edge AI, we transform your CNC machinery into intelligent assets that schedule their own maintenance.
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: 'var(--spacing-4) var(--spacing-8)', fontSize: '1.125rem' }}>
                  Explore the Platform <ArrowRight style={{ marginLeft: 'var(--spacing-2)' }} />
                </button>
              </div>
            </div>
            
            {/* Visual Splash Box */}
            <div className="reveal active delay-200" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <div className="glass-panel floating" style={{ width: '100%', maxWidth: '450px', padding: 'var(--spacing-6)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Live Asset Monitoring</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-success)', fontSize: '0.875rem' }}><div style={{width:'8px', height:'8px', background:'var(--color-success)', borderRadius:'50%'}}></div> Online</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div style={{ background: 'var(--bg-base)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Spindle Vibration</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>4.2 <span style={{fontSize:'1rem', color:'var(--text-muted)'}}>mm/s</span></div>
                    </div>
                    <Waves color="var(--color-primary)" />
                  </div>
                  <div style={{ background: 'var(--bg-base)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Failure Probability</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>88%</div>
                    </div>
                    <AlertTriangle color="var(--color-danger)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Analytics Section */}
        <section className="snap-section" style={{ background: 'var(--bg-surface-hover)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="reveal delay-100" style={{ textAlign: 'center', marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: 'var(--spacing-4)' }}>The True Cost of Inaction</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
                Unplanned downtime isn't just an inconvenience—it's a massive financial drain. Recent 2025 industrial research reveals the staggering reality of relying on reactive maintenance.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-8)' }}>
              {/* Stat Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                <div className="card glass-panel reveal delay-200" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                  <div style={{ padding: 'var(--spacing-4)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}><DollarSign size={32} color="var(--color-danger)" /></div>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: '800' }}>$125,000+</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Median cost per hour of unplanned CNC downtime.</div>
                  </div>
                </div>
                <div className="card glass-panel reveal delay-300" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                  <div style={{ padding: 'var(--spacing-4)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}><TrendingDown size={32} color="var(--color-success)" /></div>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: '800' }}>50% Drop</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Reduction in unplanned downtime via Predictive AI.</div>
                  </div>
                </div>
                <div className="card glass-panel reveal delay-400" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                  <div style={{ padding: 'var(--spacing-4)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)' }}><TrendingUp size={32} color="var(--color-primary)" /></div>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: '800' }}>250% ROI</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Average return on investment within 12 months.</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="card glass-panel reveal delay-200" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-2)' }}>Cumulative Maintenance Cost ($k)</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }}>Reactive vs Predictive Strategies over 5 Years</p>
                <div style={{ flex: 1, minHeight: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketCostData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReactive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPredictive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="year" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }} />
                      <Area type="monotone" dataKey="reactiveCost" name="Reactive Maintenance" stroke="var(--color-danger)" fill="url(#colorReactive)" />
                      <Area type="monotone" dataKey="predictiveCost" name="Predictive AI" stroke="var(--color-success)" fill="url(#colorPredictive)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="snap-section">
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-12)', alignItems: 'center' }}>
            <div className="glass-panel reveal" style={{ padding: 'var(--spacing-8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-start' }}>
                  <div style={{ padding: 'var(--spacing-3)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-lg)' }}><Activity color="var(--color-success)" /></div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Monitor at the Edge</h4>
                    <p style={{ color: 'var(--text-muted)' }}>Temperature, Sound, and Motion tracked via ESP32 nodes with zero latency.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-start' }}>
                  <div style={{ padding: 'var(--spacing-3)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-lg)' }}><Shield color="var(--color-primary)" /></div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Predict with Certainty</h4>
                    <p style={{ color: 'var(--text-muted)' }}>Our ML pipeline calculates Failure Probabilities and identifies exact root causes.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-start' }}>
                  <div style={{ padding: 'var(--spacing-3)', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-lg)' }}><Zap color="var(--color-warning)" /></div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Act Preemptively</h4>
                    <p style={{ color: 'var(--text-muted)' }}>Engineers receive actionable, plain-English recommendations before breakdowns occur.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal delay-200">
              <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: 'var(--spacing-4)' }}>Why TitanMinds?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 'var(--spacing-4)' }}>
                Traditional threshold-based alerts are dead. They notify you when a machine is *already* failing. TitanMinds utilizes Explainable AI to understand the unique baselines of your specific CNC machines.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7 }}>
                By converting physical telemetry into predictive insight, we extend your asset lifecycles by up to 40% and eliminate the stress of catastrophic factory halts.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
