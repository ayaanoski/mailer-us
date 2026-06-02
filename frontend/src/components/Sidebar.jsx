import { useState } from 'react';
import {
  Widget2Linear,
  Widget2Bold,
  GlobalLinear,
  GlobalBold,
  Pen2Linear,
  Pen2Bold,
  TShirtLinear,
  MedicalKitLinear,
  CpuLinear,
  ServerLinear,
  Logout3Linear,
  MagnifierLinear,
  LetterUnreadBold,
} from '@solar-icons/react-perf';

export default function Sidebar({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  domains,
  user,
  onLogout,
  showToast
}) {
  const [activeDomainId, setActiveDomainId] = useState(null);

  const handleDomainClick = (domain) => {
    setActiveDomainId(domain._id);
    setActiveView('domains');
    setTimeout(() => {
      const cardEl = document.getElementById(`domain-card-${domain._id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.classList.add('ring-2', 'ring-accent', 'ring-offset-2');
        setTimeout(() => cardEl.classList.remove('ring-2', 'ring-accent', 'ring-offset-2'), 2500);
      }
    }, 100);
  };

  const domainItems = domains && domains.length > 0
    ? domains
    : [];

  const userInitial = user && user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Widget2Linear, iconActive: Widget2Bold },
    { id: 'domains', label: 'Domains', icon: GlobalLinear, iconActive: GlobalBold },
    { id: 'compose', label: 'Compose', icon: Pen2Linear, iconActive: Pen2Bold },
  ];

  return (
    <aside className="w-[240px] bg-surface-raised flex flex-col h-screen sticky top-0 flex-shrink-0 border-r border-border-light">
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border-light">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white flex-shrink-0">
          <LetterUnreadBold size={16} />
        </div>
        <span className="text-base font-bold tracking-tight text-fg">Mailer</span>
      </div>

      <div className="px-3 pt-3 pb-2">
        <div className="relative flex items-center bg-surface-secondary rounded-lg px-2.5 h-9 text-fg-muted border border-border-light focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/10 transition-all">
          <MagnifierLinear size={15} className="mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-fg placeholder:text-fg-muted w-full"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1">
        <div className="text-[10px] font-semibold uppercase text-fg-muted tracking-wider px-2.5 mb-2">Menu</div>
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ id, label, icon: Icon, iconActive: IconActive }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left w-full text-sm ${
                  isActive
                    ? 'bg-accent-muted text-accent font-semibold'
                    : 'text-fg-secondary hover:text-fg hover:bg-surface-secondary'
                }`}
                type="button"
              >
                {isActive ? <IconActive size={18} className="flex-shrink-0" /> : <Icon size={18} className="flex-shrink-0" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {domainItems.length > 0 && (
          <>
            <div className="h-px bg-border-light my-3 mx-2.5" />
            <div className="text-[10px] font-semibold uppercase text-fg-muted tracking-wider px-2.5 mb-2">Domains</div>
            <div className="flex flex-col gap-0.5">
              {domainItems.map((domain) => {
                const isActive = activeDomainId === domain._id;
                return (
                  <button
                    key={domain._id}
                    onClick={() => handleDomainClick(domain)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left w-full text-sm ${
                      isActive
                        ? 'bg-accent-muted text-accent font-semibold'
                        : 'text-fg-secondary hover:text-fg hover:bg-surface-secondary'
                    }`}
                    type="button"
                  >
                    <div className="w-6 h-6 rounded-md bg-surface-secondary flex items-center justify-center flex-shrink-0">
                      <ServerLinear size={13} className="text-fg-muted" />
                    </div>
                    <span className="truncate">{domain.domainName}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-border-light p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent font-semibold flex items-center justify-center text-xs flex-shrink-0">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-fg truncate">{user ? user.name : 'Not signed in'}</div>
          <div className="text-[11px] text-fg-muted truncate">{user ? `${user.email}` : 'Authenticate'}</div>
        </div>
        <button
          onClick={onLogout}
          className="text-fg-muted hover:text-error hover:bg-error-muted/30 p-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer"
          type="button"
          title="Log out"
        >
          <Logout3Linear size={16} />
        </button>
      </div>
    </aside>
  );
}
