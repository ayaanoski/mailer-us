import { useState } from 'react';

export default function ComposeView({
  domains,
  onSaveCampaign
}) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    recipients: '',
    senderRotationMode: 'Fixed',
    delayType: 'fixed',
    fixedValue: '0',
    min: '0',
    max: '0'
  });

  const [selectedDomains, setSelectedDomains] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const activeDomains = domains.filter((d) => d.status === 'Active');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDomainCheckboxChange = (domainId) => {
    setSelectedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDomains.length === 0) {
      alert('Select at least one active sending domain.');
      return;
    }

    setIsSaving(true);
    try {
      const recipientsList = formData.recipients
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(',').map((part) => part.trim());
          const email = parts.length === 1 ? parts[0] : parts.at(-1);
          const name = parts.length === 1 ? '' : parts.slice(0, -1).join(' ');

          if (!email.includes('@')) {
            throw new Error(`Invalid recipient email: ${email}`);
          }

          return { name, email, status: 'pending' };
        });

      const delaySettings =
        formData.delayType === 'fixed'
          ? { type: 'fixed', fixedValue: Number(formData.fixedValue), min: 0, max: 0 }
          : { type: 'random', fixedValue: 0, min: Number(formData.min), max: Number(formData.max) };

      const payload = {
        name: formData.name,
        subject: formData.subject,
        htmlContent: formData.htmlContent,
        recipients: recipientsList,
        senderRotationMode: formData.senderRotationMode,
        selectedDomains,
        delaySettings
      };

      await onSaveCampaign(payload);

      setFormData({
        name: '',
        subject: '',
        htmlContent: '',
        recipients: '',
        senderRotationMode: 'Fixed',
        delayType: 'fixed',
        fixedValue: '0',
        min: '0',
        max: '0'
      });
      setSelectedDomains([]);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-fg">Create a Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-raised border border-border rounded-xl p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-secondary">Campaign name</span>
            <input
              className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
              name="name"
              type="text"
              placeholder="June Newsletter"
              value={formData.name}
              onChange={handleChange}
              disabled={isSaving}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-secondary">Subject line</span>
            <input
              className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
              name="subject"
              type="text"
              placeholder="Weekly Updates"
              value={formData.subject}
              onChange={handleChange}
              disabled={isSaving}
              required
            />
          </label>
        </div>

        <hr className="border-border-light" />

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-secondary">HTML content</span>
          <textarea
            className="w-full p-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all resize-y disabled:opacity-50 font-mono"
            name="htmlContent"
            rows="8"
            placeholder="<h1>Hello!</h1>"
            value={formData.htmlContent}
            onChange={handleChange}
            disabled={isSaving}
            required
          />
        </label>

        <hr className="border-border-light" />

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-secondary">Recipients</span>
          <textarea
            className="w-full p-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all resize-y disabled:opacity-50"
            name="recipients"
            rows="6"
            placeholder="Ada Lovelace, ada@vinsmoke.org&#10;grace@vinsmoke.org"
            value={formData.recipients}
            onChange={handleChange}
            disabled={isSaving}
            required
          />
          <span className="text-[11px] text-fg-muted mt-1">One per line as <span className="font-medium">Name, email</span> or just <span className="font-medium">email</span>.</span>
        </label>

        <hr className="border-border-light" />

        <fieldset className="border border-border rounded-lg p-4">
          <legend className="text-xs font-medium text-fg-secondary px-1.5">Active sending domains</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {activeDomains.length === 0 ? (
              <p className="text-xs text-fg-muted col-span-full py-2">
                No active domains. Add or activate one before saving a campaign.
              </p>
            ) : (
              activeDomains.map((domain) => {
                const isChecked = selectedDomains.includes(domain._id);
                return (
                  <label
                    key={domain._id}
                    className={`flex items-center gap-2.5 border rounded-lg p-2.5 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-accent bg-accent-surface'
                        : 'border-border bg-surface-secondary hover:border-border'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-accent cursor-pointer"
                      checked={isChecked}
                      onChange={() => handleDomainCheckboxChange(domain._id)}
                      disabled={isSaving}
                    />
                    <div className="min-w-0">
                      <span className="text-sm text-fg font-medium block truncate">{domain.domainName}</span>
                      <span className="text-[10px] text-fg-muted truncate block">{domain.senderEmail}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </fieldset>

        <hr className="border-border-light" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-secondary">Sender rotation</span>
            <select
              className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
              name="senderRotationMode"
              value={formData.senderRotationMode}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="Fixed">Fixed</option>
              <option value="Random">Random</option>
              <option value="Round-Robin">Round-Robin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-secondary">Delay profile</span>
            <select
              className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
              name="delayType"
              value={formData.delayType}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="fixed">Fixed</option>
              <option value="random">Random</option>
            </select>
          </label>
        </div>

        {formData.delayType === 'fixed' ? (
          <label className="flex flex-col gap-1 max-w-xs">
            <span className="text-xs font-medium text-fg-secondary">Delay after each email (seconds)</span>
            <input
              className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
              name="fixedValue"
              type="number"
              min="0"
              step="0.1"
              value={formData.fixedValue}
              onChange={handleChange}
              disabled={isSaving}
              required
            />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">Min (seconds)</span>
              <input
                className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                name="min"
                type="number"
                min="0"
                step="0.1"
                value={formData.min}
                onChange={handleChange}
                disabled={isSaving}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">Max (seconds)</span>
              <input
                className="w-full h-10 px-3 border border-border rounded-lg outline-none text-sm text-fg bg-surface-secondary placeholder:text-fg-muted focus:border-accent focus:ring-3 focus:ring-accent/10 transition-all disabled:opacity-50"
                name="max"
                type="number"
                min="0"
                step="0.1"
                value={formData.max}
                onChange={handleChange}
                disabled={isSaving}
                required
              />
            </label>
          </div>
        )}

        <div className="border-t border-border-light pt-4 flex justify-end">
          <button
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save campaign draft'}
          </button>
        </div>
      </form>
    </section>
  );
}
