import { useState } from 'react';

export default function DashboardView({
  campaigns,
  onRefresh,
  onLaunch,
  searchQuery,
  setActiveView,
  showToast
}) {
  const [layoutMode, setLayoutMode] = useState('kanban');
  const [timeFilter, setTimeFilter] = useState('All time');

  const getRecipientStats = (campaign) =>
    campaign.recipients.reduce(
      (stats, recipient) => {
        if (stats[recipient.status] !== undefined) {
          stats[recipient.status] += 1;
        }
        return stats;
      },
      { pending: 0, sent: 0, failed: 0 }
    );

  const summary = campaigns.reduce(
    (totals, campaign) => {
      totals.total += 1;
      if (totals[campaign.status] !== undefined) {
        totals[campaign.status] += 1;
      }
      totals.sent += getRecipientStats(campaign).sent;
      return totals;
    },
    { total: 0, Draft: 0, Running: 0, Completed: 0, sent: 0 }
  );

  const filteredCampaigns = campaigns.filter((campaign) => {
    const query = searchQuery.toLowerCase();
    const name = campaign.name ? campaign.name.toLowerCase() : '';
    const subject = campaign.subject ? campaign.subject.toLowerCase() : '';
    return name.includes(query) || subject.includes(query);
  });

  const columns = {
    Draft: filteredCampaigns.filter((c) => c.status === 'Draft'),
    Running: filteredCampaigns.filter((c) => c.status === 'Running'),
    Completed: filteredCampaigns.filter((c) => c.status === 'Completed')
  };

  const statusConfig = {
    Draft: { dot: 'bg-warning', bg: 'bg-warning-muted', text: 'text-warning' },
    Running: { dot: 'bg-accent', bg: 'bg-accent-muted', text: 'text-accent' },
    Completed: { dot: 'bg-success', bg: 'bg-success-muted', text: 'text-success' }
  };

  const getProgress = (campaign) => {
    const stats = getRecipientStats(campaign);
    const total = campaign.recipients.length;
    return total === 0 ? 0 : Math.round(((stats.sent + stats.failed) / total) * 100);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const StatPill = ({ label, value }) => (
    <div className="flex items-center gap-2 bg-surface-raised border border-border-light rounded-lg px-3 h-8">
      <span className="text-xs text-fg-muted">{label}</span>
      <span className="text-sm font-semibold text-fg">{value}</span>
    </div>
  );

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-fg">Campaigns</h1>
          <div className="flex items-center gap-1.5">
            <StatPill label="Total" value={summary.total} />
            <StatPill label="Sent" value={summary.sent} />
            <StatPill label="Drafts" value={summary.Draft} />
            <StatPill label="Running" value={summary.Running} />
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setActiveView('compose')}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all cursor-pointer"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New campaign
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-surface-raised border border-border-light rounded-lg p-1.5 mb-6">
        <div className="flex items-center gap-1.5 bg-surface-secondary rounded-md px-2.5 py-1.5 flex-1 text-fg-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="bg-transparent border-none outline-none text-xs text-fg placeholder:text-fg-muted w-full"
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            disabled
          />
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="outline-none cursor-pointer h-7 px-2 rounded-md text-xs font-medium bg-surface-raised text-fg-secondary border border-border hover:bg-surface-secondary transition-all"
        >
          <option>Last week</option>
          <option>Last month</option>
          <option>All time</option>
        </select>
        <button
          onClick={() => showToast('Filters reflect the active board columns.')}
          className="h-7 px-2 rounded-md text-xs font-medium bg-surface-raised text-fg-secondary border border-border hover:bg-surface-secondary transition-all cursor-pointer"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
        <div className="w-px h-5 bg-border-light" />
        <div className="flex bg-surface-secondary rounded-md p-0.5">
          <button
            onClick={() => setLayoutMode('table')}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              layoutMode === 'table' ? 'bg-surface-raised text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
            }`}
            type="button"
          >
            Table
          </button>
          <button
            onClick={() => setLayoutMode('kanban')}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              layoutMode === 'kanban' ? 'bg-surface-raised text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
            }`}
            type="button"
          >
            Kanban
          </button>
        </div>
      </div>

      {layoutMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {Object.entries(columns).map(([colName, colItems]) => {
            const cfg = statusConfig[colName];
            return (
              <div key={colName} className="bg-surface-secondary rounded-xl p-4 min-h-[400px] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <h3 className="text-sm font-semibold text-fg">
                      {colName === 'Running' ? 'In Progress' : colName}
                    </h3>
                    <span className="bg-surface-raised text-fg-muted text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-border-light">
                      {colItems.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {colItems.length === 0 ? (
                    <p className="text-center text-fg-muted text-xs py-8 border border-dashed border-border rounded-lg bg-surface-raised/50">
                      No {colName.toLowerCase()} campaigns
                    </p>
                  ) : (
                    colItems.map((campaign) => {
                      const stats = getRecipientStats(campaign);
                      const total = campaign.recipients.length;
                      const progress = getProgress(campaign);
                      return (
                        <article
                          key={campaign._id}
                          className="bg-surface-raised border border-border-light rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-sm hover:-translate-y-px"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-fg truncate flex-1">{campaign.name}</h3>
                          </div>
                          <p className="text-xs text-fg-secondary line-clamp-2 leading-relaxed">{campaign.subject}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="bg-surface-secondary text-fg-muted text-[10px] font-medium px-1.5 py-0.5 rounded">{total} recipients</span>
                            <span className="bg-surface-secondary text-fg-muted text-[10px] font-medium px-1.5 py-0.5 rounded">{campaign.senderRotationMode}</span>
                          </div>

                          <div>
                            <div className="h-1 bg-surface-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-fg-muted mt-1">
                              <span>{progress}%</span>
                              <span>{stats.sent} sent · {stats.failed} failed</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border-light">
                            <span className="text-[10px] text-fg-muted">{formatDate(campaign.createdAt)}</span>
                            {campaign.status === 'Draft' && (
                              <button
                                onClick={() => onLaunch(campaign._id)}
                                className="h-7 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-all active:scale-95 cursor-pointer"
                                type="button"
                              >
                                Launch
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">Name</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">Subject</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">Status</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">Recipients</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">Created</th>
                <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-fg-muted text-sm">No campaigns found.</td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const cfg = statusConfig[campaign.status] || statusConfig.Draft;
                  return (
                    <tr key={campaign._id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-all">
                      <td className="px-5 py-3.5 font-medium text-fg truncate max-w-[180px]">{campaign.name}</td>
                      <td className="px-5 py-3.5 text-fg-secondary truncate max-w-[260px]">{campaign.subject}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-fg-secondary">{campaign.recipients.length}</td>
                      <td className="px-5 py-3.5 text-fg-muted text-xs">{formatDate(campaign.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {campaign.status === 'Draft' ? (
                          <button
                            onClick={() => onLaunch(campaign._id)}
                            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-all cursor-pointer"
                            type="button"
                          >
                            Launch
                          </button>
                        ) : (
                          <span className="text-fg-muted text-xs">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
