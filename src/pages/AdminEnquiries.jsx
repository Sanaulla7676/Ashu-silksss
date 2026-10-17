import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getAllEnquiries, updateEnquiryStatusAdmin } from '../services/admin';

const STATUSES = ['new', 'contacted', 'resolved', 'spam'];
const STATUS_TINT = {
  new: 'bg-rose-50 text-rose-700',
  contacted: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  spam: 'bg-slate-100 text-slate-600',
};
function dateValue(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate()
    : value.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function displayDate(value) {
  const date = dateValue(value);
  return date ? date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date not recorded';
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try { setEnquiries(await getAllEnquiries()); }
    catch (err) { setError(err?.message || 'Enquiries could not be loaded from Firestore.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enquiries.filter(item => {
      const state = String(item.status || 'new').toLowerCase();
      if (status !== 'all' && state !== status) return false;
      const content = [
        item.customerName, item.name, item.phone, item.email, item.productName,
        item.productSku, item.message, item.subject, item.id,
      ].filter(Boolean).join(' ').toLowerCase();
      return !term || content.includes(term);
    });
  }, [enquiries, search, status]);

  const changeStatus = async (item, nextStatus) => {
    setSavingId(item.id);
    setError('');
    try {
      await updateEnquiryStatusAdmin(item.id, nextStatus);
      setEnquiries(current => current.map(row => row.id === item.id ? { ...row, status: nextStatus } : row));
      toast.success('Enquiry status saved');
    } catch (err) {
      setError(err?.message || 'The enquiry status was not saved.');
      toast.error('Could not save the enquiry status');
    } finally { setSavingId(''); }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Enquiries</h1>
          <p className="mt-1 text-sm text-slate-500">Customer questions from the actual Firestore enquiry records.</p>
        </div>
        <button type="button" className="dash-btn-ghost" onClick={load} disabled={loading || Boolean(savingId)}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="dash-card mb-5 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="relative block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="dash-field pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, product, phone, SKU…" />
        </label>
        <select className="dash-field" value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter enquiries by status">
          <option value="all">All statuses</option>
          {STATUSES.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
        </select>
      </div>

      <div className="dash-card overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading real enquiry records…</div>
          : error && !enquiries.length ? <div className="p-8 text-center text-sm text-slate-500">Enquiry data is unavailable because the database read failed.</div>
          : !filtered.length ? <div className="p-10 text-center">
              <MessageSquare size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">{enquiries.length ? 'No enquiries match these filters' : 'No enquiries recorded yet'}</p>
              <p className="mt-1 text-sm text-slate-500">{enquiries.length ? 'Try another search or status.' : 'New customer messages will appear here when they are saved to Firestore.'}</p>
            </div>
          : <div className="divide-y divide-slate-100">
              {filtered.map(item => {
                const currentStatus = String(item.status || 'new').toLowerCase();
                const customer = item.customerName || item.name || 'Customer name not provided';
                const phone = item.phone || '';
                const email = item.email || '';
                return <article key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{customer}</h2>
                      <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + (STATUS_TINT[currentStatus] || STATUS_TINT.new)}>{currentStatus}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{displayDate(item.createdAt)} · {item.productName || item.subject || 'General enquiry'}{item.productSku ? ' · ' + item.productSku : ''}</p>
                    {(phone || email) && <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {phone && <a className="text-[#9f1239] hover:underline" href={'tel:' + phone}>{phone}</a>}
                      {email && <a className="text-[#9f1239] hover:underline" href={'mailto:' + email}>{email}</a>}
                    </p>}
                    {item.message && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.message}</p>}
                    {item.productId && <Link className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#9f1239] hover:underline" to={'/product/' + encodeURIComponent(item.productId)} target="_blank">View related product <ExternalLink size={12} /></Link>}
                    <p className="mt-2 break-all text-[11px] text-slate-400">Record: {item.id}</p>
                  </div>
                  <label className="grid gap-1 text-xs font-semibold text-slate-500">
                    Follow-up status
                    <select className="dash-field" value={STATUSES.includes(currentStatus) ? currentStatus : 'new'} disabled={savingId === item.id} onChange={event => changeStatus(item, event.target.value)}>
                      {STATUSES.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                    </select>
                    {savingId === item.id && <span className="font-normal text-slate-400">Saving to Firestore…</span>}
                  </label>
                </article>;
              })}
            </div>}
        {!loading && !error && <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing {filtered.length} of {enquiries.length} recorded enquiries.</div>}
      </div>
    </section>
  );
}
