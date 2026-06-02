import { useState } from 'react';

export default function DomainsView({
  domains,
  onRefresh,
  onAddDomain,
  user
}) {
  const [formData, setFormData] = useState({
    domainName: '',
    senderEmail: '',
    senderName: '',
    dailyLimit: '',
    status: 'Pending Verification'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddDomain = user && user.role === 'Admin';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAddDomain) return;

    setIsSubmitting(true);
    try {
      await onAddDomain({
        ...formData,
        dailyLimit: Number(formData.dailyLimit)
      });
      setFormData({
        domainName: '',
        senderEmail: '',
        senderName: '',
        dailyLimit: '',
        status: 'Pending Verification'
      });
    } catch {
      // Handled in caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusStyles = {
    'Active': 'bg-success-muted text-success',
    'Pending Verification': 'bg-warning-muted text-warning',
    'Disabled': 'bg-error-muted text-error',
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold tracking-tight text-fg">Sending Domains</h1>
        <button
          onClick={onRefresh}
          className="inline-flex items-center justify-center h-8 px-3 border border-border rounded-lg text-xs font-medium bg-surface-raised text-fg-secondary hover:bg-surface-secondary transition-all cursor-pointer"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <article className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-fg mb-1">Add a sending domain</h3>
            <p className="text-xs text-fg-muted">
              {canAddDomain
                ? 'Register a domain you control. Delivery routes through the internal mail relay.'
                : 'Admin access is required to add sending domains.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-secondary">Domain name</span>
                <input
                  className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                  name="domainName"
                  type="text"
                  placeholder="vinsmoke.org"
                  value={formData.domainName}
                  onChange={handleChange}
                  disabled={!canAddDomain || isSubmitting}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-secondary">Sender email</span>
                <input
                  className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                  name="senderEmail"
                  type="email"
                  placeholder="info@vinsmoke.org"
                  value={formData.senderEmail}
                  onChange={handleChange}
                  disabled={!canAddDomain || isSubmitting}
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-secondary">Sender name</span>
                <input
                  className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                  name="senderName"
                  type="text"
                  placeholder="Vin Support"
                  value={formData.senderName}
                  onChange={handleChange}
                  disabled={!canAddDomain || isSubmitting}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-secondary">Daily limit</span>
                <input
                  className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                  name="dailyLimit"
                  type="number"
                  min="1"
                  placeholder="1000"
                  value={formData.dailyLimit}
                  onChange={handleChange}
                  disabled={!canAddDomain || isSubmitting}
                  required
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">Status</span>
              <select
                className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!canAddDomain || isSubmitting}
              >
                <option value="Pending Verification">Pending Verification</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </label>

            <button
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
              type="submit"
              disabled={!canAddDomain || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add domain'}
            </button>
          </form>
        </article>

        <div className="flex flex-col gap-3">
          {domains.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-surface-raised">
              <p className="text-sm text-fg-muted">No domains yet.</p>
              <p className="text-xs text-fg-muted mt-1">Add a sending domain to start preparing campaigns.</p>
            </div>
          ) : (
            domains.map((domain) => {
              const usage = domain.dailyUsage || 0;
              const limit = domain.dailyLimit || 1;
              const usagePercent = Math.min(Math.round((usage / limit) * 100), 100);
              const status = domain.status;
              const statusClass = statusStyles[status] || 'bg-surface-secondary text-fg-muted';

              return (
                <article
                  key={domain._id}
                  id={`domain-card-${domain._id}`}
                  className="bg-surface-raised border border-border rounded-xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-fg">{domain.domainName}</h3>
                      <p className="text-xs text-fg-muted mt-0.5">
                        {domain.senderName} &lt;{domain.senderEmail}&gt;
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusClass}`}>
                      {status}
                    </span>
                  </div>

                  <div className="border-t border-border-light pt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-fg-muted">Daily usage</span>
                      <span className="text-[11px] font-medium text-fg-secondary">{usage} / {limit}</span>
                    </div>
                    <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent >= 90 ? 'bg-error' : usagePercent >= 70 ? 'bg-warning' : 'bg-accent'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-fg-muted mt-1.5">
                      {domain.totalEmailsSent || 0} sent overall
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
