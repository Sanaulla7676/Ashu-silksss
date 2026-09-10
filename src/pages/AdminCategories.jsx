import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, ArrowUp, ArrowDown, Info, RefreshCw, Pencil, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCategories } from '../context/CategoryContext';
import { getCatalogProducts, updateCatalogProduct } from '../services/catalog';

export default function AdminCategories() {
  const { categories, saveCategories } = useCategories();
  const [draft, setDraft] = useState(categories);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameTo, setRenameTo] = useState('');
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setDraft(categories); }, [categories]);

  const load = async () => {
    try { setProducts(await getCatalogProducts()); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  // How many products sit in each category, so nothing is deleted blindly.
  const usage = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const c = p.category || 'Uncategorised';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [products]);

  const dirty = draft.length !== categories.length || draft.some((c, i) => c !== categories[i]);

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (draft.some(c => c.toLowerCase() === name.toLowerCase())) {
      toast.error(`"${name}" is already in the list`);
      return;
    }
    setDraft([...draft, name]);
    setNewName('');
  };

  const move = (index, delta) => {
    const next = [...draft];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  const remove = index => {
    const name = draft[index];
    const count = usage[name] || 0;
    if (count > 0) {
      toast.error(`${count} product${count === 1 ? '' : 's'} still use "${name}" — move them first`);
      return;
    }
    setDraft(draft.filter((_, i) => i !== index));
  };

  const save = async () => {
    setBusy(true); setError('');
    try {
      await saveCategories(draft);
      toast.success('Categories saved');
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  // Renaming has to move every product across too, or they fall out of the shop.
  const commitRename = async index => {
    const from = draft[index];
    const to = renameTo.trim();
    if (!to || to === from) { setRenaming(null); return; }
    if (draft.some((c, i) => i !== index && c.toLowerCase() === to.toLowerCase())) {
      toast.error(`"${to}" is already in the list`);
      return;
    }

    setBusy(true); setError('');
    try {
      const affected = products.filter(p => p.category === from);
      for (const p of affected) {
        await updateCatalogProduct(p.id, { category: to });
      }
      const next = draft.map((c, i) => (i === index ? to : c));
      await saveCategories(next);
      setDraft(next);
      setRenaming(null);
      await load();
      toast.success(
        affected.length
          ? `Renamed, and moved ${affected.length} product${affected.length === 1 ? '' : 's'}`
          : 'Category renamed',
      );
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  // Categories that products use but that aren't in the list — easy to miss.
  const orphans = Object.keys(usage).filter(
    c => c !== 'Uncategorised' && !draft.some(d => d === c),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">
            These are the collections customers browse by, and the choices in the product form.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="dash-btn-ghost" onClick={load} disabled={busy}><RefreshCw size={16} /> Refresh</button>
          <button className="dash-btn-primary" onClick={save} disabled={busy || !dirty}>
            <Save size={16} /> {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          Renaming a category moves every product in it across automatically. A category that still has products in it
          can't be deleted — move those products to another category first.
        </p>
      </div>

      {orphans.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Not in your list:</b> {orphans.map(o => `${o} (${usage[o]})`).join(', ')}. Products are using these, but
          customers won't see them as a collection until you add them below.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="dash-card h-fit p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Add a category</h2>
          <div className="flex gap-2">
            <input
              className="dash-field"
              placeholder="e.g. Mysore Silk"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            />
            <button className="dash-btn-primary shrink-0" onClick={add} disabled={!newName.trim()}>
              <Plus size={16} /> Add
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            New categories appear in the product form straight away. Save to publish them to the storefront.
          </p>
        </div>

        <div className="dash-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Your categories ({draft.length})</h2>
            {dirty && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
          </div>

          <div className="grid gap-2.5">
            {draft.map((name, i) => (
              <div key={`${name}-${i}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex shrink-0 flex-col">
                  <button
                    className="text-slate-400 transition-colors hover:text-indigo-600 disabled:opacity-25"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${name} up`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="text-slate-400 transition-colors hover:text-indigo-600 disabled:opacity-25"
                    onClick={() => move(i, 1)}
                    disabled={i === draft.length - 1}
                    aria-label={`Move ${name} down`}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                {renaming === i ? (
                  <>
                    <input
                      className="dash-field"
                      value={renameTo}
                      autoFocus
                      onChange={e => setRenameTo(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitRename(i); } }}
                    />
                    <button className="dash-btn-primary shrink-0" onClick={() => commitRename(i)} disabled={busy}>
                      <Check size={16} />
                    </button>
                    <button className="dash-btn-ghost shrink-0" onClick={() => setRenaming(null)} disabled={busy}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">
                        {usage[name] ? `${usage[name]} product${usage[name] === 1 ? '' : 's'}` : 'No products yet'}
                      </p>
                    </div>
                    <button
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      onClick={() => { setRenaming(i); setRenameTo(name); }}
                      aria-label={`Rename ${name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => remove(i)}
                      aria-label={`Delete ${name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {!draft.length && (
              <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No categories yet — add one on the left.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
