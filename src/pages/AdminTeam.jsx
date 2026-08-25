import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTeamMembers, addTeamMember, removeTeamMember } from '../services/team';

const roles = ['Store manager', 'Order fulfillment', 'Support', 'Viewer'];

export default function AdminTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', role: roles[0] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setMembers(await getTeamMembers()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await addTeamMember(form);
      setForm({ name: '', email: '', role: roles[0] });
      toast.success('Added to the roster');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  const remove = async id => {
    if (!confirm('Remove this person from the roster?')) return;
    await removeTeamMember(id);
    toast.success('Removed');
    await load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-sm text-slate-500">Keep track of who helps run the store.</p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          This roster is a directory — it doesn't grant dashboard access by itself. Firebase requires a one-time
          server-side step to actually make someone an admin (the same process used for your own account). Add
          them here to keep track, then send their email over and it can be run for them too.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form className="h-fit rounded-xl border border-slate-200 bg-white p-5" onSubmit={submit}>
          <h2 className="mb-4 font-semibold text-slate-900">Add someone</h2>
          <div className="grid gap-3">
            <input className="dash-field" required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="dash-field" required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <select className="dash-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
            <button className="dash-btn-primary" disabled={saving}><UserPlus size={16} /> {saving ? 'Adding...' : 'Add to roster'}</button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Roster ({members.length})</h2>
          {loading ? (
            <div className="grid gap-3">{[0, 1, 2].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
          ) : !members.length ? (
            <p className="text-sm text-slate-500">Nobody added yet — it's just you.</p>
          ) : (
            <div className="grid gap-2.5">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{m.name}</p>
                    <p className="truncate text-sm text-slate-500">{m.email} · {m.role}</p>
                  </div>
                  <button className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(m.id)} aria-label="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
