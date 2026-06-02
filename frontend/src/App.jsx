import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import DomainsView from './components/DomainsView';
import ComposeView from './components/ComposeView';
import {
  apiFetch,
  getLocalSession,
  saveSession,
  deleteLocalSession,
  setLogoutCallback
} from './utils/api';

export default function App() {
  const [session, setSession] = useState(getLocalSession());
  const [activeView, setActiveView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [domains, setDomains] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [authTab, setAuthTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setLogoutCallback(() => {
      setSession({ token: '', user: null });
      showToast('Session expired. Please log in again.', 'error');
    });
  }, []);

  const loadDomains = async () => {
    try {
      const res = await apiFetch('/domains');
      setDomains(res.domains || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadCampaigns = async () => {
    try {
      const res = await apiFetch('/campaigns');
      setCampaigns(res.campaigns || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadDashboard = () => {
    loadDomains();
    loadCampaigns();
  };

  useEffect(() => {
    if (session.token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboard();
    } else {
      setDomains([]);
      setCampaigns([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      saveSession(res.token, res.user);
      setSession({ token: res.token, user: res.user });
      setLoginEmail('');
      setLoginPassword('');
      showToast('Logged in successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword
        })
      });
      saveSession(res.token, res.user);
      setSession({ token: res.token, user: res.user });
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      showToast('Account created successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    deleteLocalSession();
    setSession({ token: '', user: null });
    setActiveView('overview');
    showToast('Logged out successfully.');
  };

  const handleAddDomain = async (domainData) => {
    try {
      await apiFetch('/domains', {
        method: 'POST',
        body: JSON.stringify(domainData)
      });
      showToast('Sending domain added.');
      loadDomains();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleSaveCampaign = async (campaignData) => {
    try {
      await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      });
      showToast('Campaign draft saved.');
      loadDashboard();
      setActiveView('overview');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleLaunchCampaign = async (campaignId) => {
    try {
      const res = await apiFetch(`/campaigns/${campaignId}/launch`, {
        method: 'POST'
      });
      showToast(`${res.message}. ${res.queuedJobs} email job(s) queued.`);
      loadCampaigns();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <DashboardView
            campaigns={campaigns}
            onRefresh={loadCampaigns}
            onLaunch={handleLaunchCampaign}
            searchQuery={searchQuery}
            setActiveView={setActiveView}
            showToast={showToast}
          />
        );
      case 'domains':
        return (
          <DomainsView
            domains={domains}
            onRefresh={loadDomains}
            onAddDomain={handleAddDomain}
            user={session.user}
          />
        );
      case 'compose':
        return (
          <ComposeView
            domains={domains}
            onSaveCampaign={handleSaveCampaign}
          />
        );
      default:
        return <div className="p-12 text-fg-muted text-center">View not found</div>;
    }
  };

  const isSignedIn = Boolean(session.token && session.user);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen grid place-items-center bg-surface-secondary p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] max-w-[960px] w-full rounded-2xl overflow-hidden bg-surface-raised shadow-lg border border-border-light">
          <article className="bg-accent text-surface-raised p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-surface-raised/20 backdrop-blur-sm rounded-xl mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Mailer</h2>
              <p className="text-sm text-surface-raised/70 leading-relaxed mb-8 max-w-sm">
                Self-hosted campaign delivery. Configure domains, compose messages, and monitor delivery from one place.
              </p>
              <div className="flex flex-col gap-3">
                {['Token-based authorization', 'Multi-domain rotation', 'BullMQ job queue'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-surface-raised/80">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-surface-raised/50 mt-8">Trusted by operations teams</p>
          </article>

          <article className="p-10 lg:p-12 flex flex-col justify-center bg-surface-raised">
            <div className="flex gap-1 mb-8 bg-surface-secondary rounded-lg p-1 w-fit">
              <button
                onClick={() => setAuthTab('login')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-surface-raised text-fg shadow-sm'
                    : 'text-fg-muted hover:text-fg'
                }`}
                type="button"
              >
                Log in
              </button>
              <button
                onClick={() => setAuthTab('register')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  authTab === 'register'
                    ? 'bg-surface-raised text-fg shadow-sm'
                    : 'text-fg-muted hover:text-fg'
                }`}
                type="button"
              >
                Register
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-fg-secondary">Email address</span>
                  <input
                    className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isAuthSubmitting}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-fg-secondary">Password</span>
                  <input
                    className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isAuthSubmitting}
                    required
                  />
                </label>
                <button
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
                  type="submit"
                  disabled={isAuthSubmitting}
                >
                  {isAuthSubmitting ? 'Logging in...' : 'Log in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-fg-secondary">Full name</span>
                  <input
                    className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                    type="text"
                    autoComplete="name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={isAuthSubmitting}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-fg-secondary">Email address</span>
                  <input
                    className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                    type="email"
                    autoComplete="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isAuthSubmitting}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-fg-secondary">Password</span>
                  <input
                    className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isAuthSubmitting}
                    required
                  />
                </label>
                <button
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
                  type="submit"
                  disabled={isAuthSubmitting}
                >
                  {isAuthSubmitting ? 'Registering...' : 'Create account'}
                </button>
                <p className="text-xs text-fg-muted text-center mt-2">The first registered user is configured as Admin.</p>
              </form>
            )}
          </article>
        </div>

        {toast && (
          <ToastNotification toast={toast} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        domains={domains}
        user={session.user}
        onLogout={handleLogout}
        showToast={showToast}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8 lg:p-10">
          {renderActiveView()}
        </div>
      </main>

      {toast && (
        <ToastNotification toast={toast} />
      )}
    </div>
  );
}

function ToastNotification({ toast }) {
  const isError = toast.type === 'error';
  return (
    <div
      className={`fixed right-5 bottom-5 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 transition-all ${
        isError
          ? 'bg-error-bg text-error border border-error-muted'
          : 'bg-surface-raised text-fg border border-border shadow-lg'
      }`}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isError ? 'bg-error' : 'bg-success'}`} />
      {toast.message}
    </div>
  );
}
