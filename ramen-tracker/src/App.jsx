import { useEffect, useMemo, useState, Fragment } from "react";
import { toast } from "sonner";

/* ---------- helpers ---------- */
const APP_NAME = "Ramen Naijiro";
const cx = (...c) => c.filter(Boolean).join(" ");
const currency = (n) => {
  const num = Number(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(num)
    : "₱0.00";
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const KEY = { menu: "rn_menu", purchases: "rn_purchases", sales: "rn_sales", biz: "rn_business" };

/* ---------- tiny UI kit ---------- */
function Logo({ className = "h-6 w-6 text-white" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* bowl */}
      <path d="M4 13a8 8 0 0016 0H4z" />
      {/* steam/noodles */}
      <path d="M8 4c1.5 1.2 1.5 2.8 0 4M12 4c1.5 1.2 1.5 2.8 0 4M16 4c1.5 1.2 1.5 2.8 0 4" />
    </svg>
  );
}

function Button({ variant = "primary", className = "", ...props }) {
  const base = "h-10 px-4 rounded-xl font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles = {
    primary: "bg-ramen-600 hover:bg-ramen-700 text-white focus:ring-ramen-400",
    outline: "bg-white border hover:bg-neutral-50 focus:ring-ramen-300",
    subtle: "bg-neutral-100 hover:bg-neutral-200 text-neutral-800",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400",
  };
  return <button className={cx(base, styles[variant], className)} {...props} />;
}
function Input(props) {
  return <input {...props} className={cx("w-full h-10 rounded-xl border px-3 bg-white/90 shadow-sm focus:ring-2 focus:ring-ramen-300 focus:border-ramen-300", props.className)} />;
}
function Select(props) {
  return <select {...props} className={cx("w-full h-10 rounded-xl border px-3 bg-white/90 shadow-sm focus:ring-2 focus:ring-ramen-300", props.className)} />;
}
function Textarea(props) {
  return <textarea {...props} className={cx("w-full rounded-xl border px-3 py-2 bg-white/90 shadow-sm focus:ring-2 focus:ring-ramen-300", props.className)} />;
}
function Card({ children, className }) {
  return <div className={cx("bg-white border rounded-2xl p-4 shadow-card", className)}>{children}</div>;
}

function Section({ title, children, right }) {
  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-2">{right}</div>
      </div>
      <Card>{children}</Card>
    </section>
  );
}

function Tabs({ value, onChange }) {
  const tabs = [
    { id: "menu", name: "Menu" },
    { id: "purchases", name: "Purchases" },
    { id: "sales", name: "Sales" },
    { id: "report", name: "Report" },
    { id: "backup", name: "Backup" },
  ];
  return (
    <nav className="bg-white border-b">
      <div className="max-w-3xl mx-auto px-4">
        <ul className="flex gap-1">
          {tabs.map(t => {
            const active = value === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => onChange(t.id)}
                  className={`h-10 px-3 text-sm font-medium transition
                    ${active
                      ? "text-red-700 border-b-2 border-red-600"
                      : "text-neutral-700 border-b-2 border-transparent hover:text-red-700 hover:bg-neutral-50"}`}
                >
                  {t.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [biz, setBiz] = useState(() => load(KEY.biz, { name: "Ramen Naijiro", owner: "Mom", location: "Santiago, Philippines" }));
  const [menu, setMenu] = useState(() => load(KEY.menu, [{ id: crypto.randomUUID(), name: "Classic Ramen", price: 120 }]));
  const [newItem, setNewItem] = useState({ name: "", price: "" });

  const [purchases, setPurchases] = useState(() => load(KEY.purchases, []));
  const [pForm, setPForm] = useState({ date: todayISO(), item: "", qty: "", unit: "", total: "", note: "" });
  const [autoTotal, setAutoTotal] = useState(true);

  const [sales, setSales] = useState(() => load(KEY.sales, []));
  const [sForm, setSForm] = useState({ date: todayISO(), productId: "", qty: "" });

  const [tab, setTab] = useState("menu");
  const [range, setRange] = useState({ start: todayISO(), end: todayISO(), groupByDay: true });

  useEffect(() => save(KEY.menu, menu), [menu]);
  useEffect(() => save(KEY.purchases, purchases), [purchases]);
  useEffect(() => save(KEY.sales, sales), [sales]);
  useEffect(() => save(KEY.biz, biz), [biz]);

  const menuById = useMemo(() => Object.fromEntries(menu.map(m => [m.id, m])), [menu]);

  // Filters
  const fPurchases = useMemo(() => {
    const s = new Date(range.start); const e = new Date(range.end); e.setHours(23, 59, 59, 999);
    return purchases.filter(p => new Date(p.date) >= s && new Date(p.date) <= e);
  }, [purchases, range]);

  const fSales = useMemo(() => {
    const s = new Date(range.start); const e = new Date(range.end); e.setHours(23, 59, 59, 999);
    return sales.filter(x => new Date(x.date) >= s && new Date(x.date) <= e);
  }, [sales, range]);

  const totals = useMemo(() => {
    const revenue = fSales.reduce((sum, s) => sum + ((menuById[s.productId]?.price || 0) * s.qty), 0);
    const expense = fPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    return { revenue, expense, profit: revenue - expense };
  }, [fPurchases, fSales, menuById]);

  const groupedSales = useMemo(() => {
    const map = new Map();
    for (const s of fSales) { const key = range.groupByDay ? s.date : "all"; if (!map.has(key)) map.set(key, []); map.get(key).push(s); }
    return map;
  }, [fSales, range.groupByDay]);

  // Handlers
  const addMenuItem = () => {
    const name = newItem.name.trim();
    const price = Number(newItem.price);
    if (!name) return toast.error("Enter a product name");
    if (!Number.isFinite(price) || price <= 0) return toast.error("Enter a valid price");
    setMenu(prev => [...prev, { id: crypto.randomUUID(), name, price }]);
    setNewItem({ name: "", price: "" });
    toast.success("Menu item added");
  };
  const updateMenuItem = (id, patch) => setMenu(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  const deleteMenuItem = (id) => setMenu(prev => prev.filter(m => m.id !== id));

  const addPurchase = () => {
    const item = pForm.item.trim();
    const total = Number(pForm.total || 0);
    if (!item) return toast.error("What did you buy?");
    if (!Number.isFinite(total) || total <= 0) return toast.error("Enter a valid total");
    const row = {
      id: crypto.randomUUID(),
      date: pForm.date || todayISO(),
      item,
      qty: Number(pForm.qty || 0),
      unit: Number(pForm.unit || 0),
      total,
      note: (pForm.note || "").trim(),
    };
    setPurchases(prev => [row, ...prev]);
    setPForm({ date: todayISO(), item: "", qty: "", unit: "", total: "", note: "" });
    toast.success("Purchase saved");
  };

  const addSaleQuick = (productId) => setSales(prev => [{ id: crypto.randomUUID(), date: todayISO(), productId, qty: 1 }, ...prev]);
  const addSale = () => {
    if (!sForm.productId) return toast.error("Pick a product");
    const qty = Number(sForm.qty || 0);
    if (!Number.isFinite(qty) || qty <= 0) return toast.error("Enter a valid quantity");
    setSales(prev => [{ id: crypto.randomUUID(), date: sForm.date || todayISO(), productId: sForm.productId, qty }, ...prev]);
    setSForm({ date: todayISO(), productId: "", qty: "" });
    toast.success("Sale added");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ biz, menu, purchases, sales }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ramen-naijiro-backup-${todayISO()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => { try {
      const data = JSON.parse(reader.result);
      setBiz(data.biz || biz);
      setMenu(Array.isArray(data.menu) ? data.menu : menu);
      setPurchases(Array.isArray(data.purchases) ? data.purchases : purchases);
      setSales(Array.isArray(data.sales) ? data.sales : sales);
      toast.success("Backup loaded");
    } catch { toast.error("Could not import file"); } };
    reader.readAsText(file);
  };
  const clearAll = () => { if (confirm("This will clear all data on this device. Proceed?")) { setMenu([]); setPurchases([]); setSales([]); } };
  const printSummary = () => window.print();

  useEffect(() => {
    if (autoTotal) {
      const qty = Number(pForm.qty || 0); const unit = Number(pForm.unit || 0);
      const t = Math.round(qty * unit * 100) / 100; if (t > 0) setPForm(p => ({ ...p, total: String(t) }));
    }
  }, [pForm.qty, pForm.unit, autoTotal]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Red header */}
      <header className="bg-red-600 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-white font-bold text-xl">{APP_NAME} Tracker</h1>
        </div>
      </header>

    {/* Nav directly under the red header */}
    <Tabs value={tab} onChange={setTab} />
      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-5 pb-28">
        {/* Removing this because it is useless. Only one person is using this. */}
        {/* <Section title="Business info">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-neutral-600">Business name</label>
              <Input value={biz.name} onChange={e => setBiz({ ...biz, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-neutral-600">Owner</label>
              <Input value={biz.owner} onChange={e => setBiz({ ...biz, owner: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-neutral-600">Location</label>
              <Input value={biz.location} onChange={e => setBiz({ ...biz, location: e.target.value })} />
            </div>
          </div>
        </Section> */}

        <Tabs value={tab} onChange={setTab} />

        {tab === "menu" && (
          <Section title="Menu and prices">
            <div className="grid sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="text-xs text-neutral-600">Item name</label>
                <Input placeholder="Tonkotsu Ramen" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-neutral-600">Price (PHP)</label>
                <Input type="number" inputMode="decimal" placeholder="120" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
              </div>
              <Button onClick={addMenuItem}>Add</Button>
            </div>

            <div className="mt-3 rounded-2xl border overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.length === 0 && <tr><td className="p-3 text-neutral-500" colSpan={3}>No items yet</td></tr>}
                  {menu.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2"><Input value={m.name} onChange={e => updateMenuItem(m.id, { name: e.target.value })} /></td>
                      <td className="p-2 text-right"><Input type="number" inputMode="decimal" className="w-28 text-right" value={m.price} onChange={e => updateMenuItem(m.id, { price: Number(e.target.value || 0) })} /></td>
                      <td className="p-2 text-right"><Button variant="outline" className="px-3" onClick={() => deleteMenuItem(m.id)}>Delete</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === "purchases" && (
          <Section title="Purchases and expenses">
            <div className="grid sm:grid-cols-7 gap-3 items-end">
              <div>
                <label className="text-xs text-neutral-600">Date</label>
                <Input type="date" value={pForm.date} onChange={e => setPForm({ ...pForm, date: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-neutral-600">What did you buy</label>
                <Input placeholder="Pork bones, noodles" value={pForm.item} onChange={e => setPForm({ ...pForm, item: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Qty</label>
                <Input type="number" inputMode="decimal" value={pForm.qty} onChange={e => setPForm({ ...pForm, qty: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Unit price</label>
                <Input type="number" inputMode="decimal" value={pForm.unit} onChange={e => setPForm({ ...pForm, unit: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Total</label>
                <Input type="number" inputMode="decimal" value={pForm.total} onChange={e => setPForm({ ...pForm, total: e.target.value })} />
              </div>
              <label className="inline-flex gap-2 items-center text-sm select-none">
                <input type="checkbox" checked={autoTotal} onChange={e => setAutoTotal(e.target.checked)} />
                Auto total = qty × unit
              </label>
            </div>
            <div className="mt-2">
              <label className="text-xs text-neutral-600">Note</label>
              <Textarea rows={2} placeholder="Supplier or receipt" value={pForm.note} onChange={e => setPForm({ ...pForm, note: e.target.value })} />
            </div>
            <div className="mt-2 flex gap-2">
              <Button onClick={addPurchase}>Save purchase</Button>
            </div>

            <div className="mt-3 rounded-2xl border overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 && <tr><td className="p-3 text-neutral-500" colSpan={6}>No purchases yet</td></tr>}
                  {purchases.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.date}</td>
                      <td className="p-2">{p.item}</td>
                      <td className="p-2 text-right">{p.qty || ""}</td>
                      <td className="p-2 text-right">{p.unit ? currency(p.unit) : ""}</td>
                      <td className="p-2 text-right font-medium">{currency(p.total)}</td>
                      <td className="p-2">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === "sales" && (
          <Section title="Daily sales">
            <div className="flex flex-wrap gap-2">
              {menu.map(m => (
                <Button key={m.id} variant="outline" className="px-3" onClick={() => addSaleQuick(m.id)}>+1 {m.name}</Button>
              ))}
              {menu.length === 0 && <p className="text-sm text-neutral-500">Add menu items first</p>}
            </div>
            <div className="grid sm:grid-cols-5 gap-3 items-end mt-3">
              <div>
                <label className="text-xs text-neutral-600">Date</label>
                <Input type="date" value={sForm.date} onChange={e => setSForm({ ...sForm, date: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-neutral-600">Product</label>
                <Select value={sForm.productId} onChange={e => setSForm({ ...sForm, productId: e.target.value })}>
                  <option value="">Pick a product</option>
                  {menu.map(m => <option key={m.id} value={m.id}>{m.name} ({currency(m.price)})</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs text-neutral-600">Qty</label>
                <Input type="number" inputMode="numeric" value={sForm.qty} onChange={e => setSForm({ ...sForm, qty: e.target.value })} />
              </div>
              <Button onClick={addSale}>Add sale</Button>
            </div>

            <div className="mt-3 rounded-2xl border overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 && <tr><td className="p-3 text-neutral-500" colSpan={4}>No sales yet</td></tr>}
                  {sales.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{s.date}</td>
                      <td className="p-2">{menuById[s.productId]?.name || "Deleted item"}</td>
                      <td className="p-2 text-right">{s.qty}</td>
                      <td className="p-2 text-right">{currency((menuById[s.productId]?.price || 0) * s.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === "report" && (
          <Section
            title="Summary and report"
            right={
              <>
                <Button variant="outline" onClick={() => {
                  const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, "0");
                  const start = `${y}-${m}-01`; const end = new Date(y, now.getMonth() + 1, 0).toISOString().slice(0, 10);
                  setRange(r => ({ ...r, start, end }));
                }}>This month</Button>
                <Button onClick={printSummary}>Print or Save PDF</Button>
              </>
            }
          >
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <Card>
                <div className="text-sm text-neutral-600">Revenue</div>
                <div className="text-2xl font-bold">{currency(totals.revenue)}</div>
              </Card>
              <Card>
                <div className="text-sm text-neutral-600">Expenses</div>
                <div className="text-2xl font-bold">{currency(totals.expense)}</div>
              </Card>
              <Card>
                <div className="text-sm text-neutral-600">Profit</div>
                <div className={cx("text-2xl font-bold", totals.profit >= 0 ? "text-emerald-600" : "text-red-600")}>{currency(totals.profit)}</div>
              </Card>
            </div>

            <div className="rounded-2xl border overflow-hidden mb-3 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...groupedSales.entries()].map(([key, list]) => (
                    <Fragment key={key}>
                      {range.groupByDay && (
                        <tr className="bg-neutral-50 border-t"><td className="p-2 font-medium" colSpan={5}>{key}</td></tr>
                      )}
                      {list.map(s => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">{s.date}</td>
                          <td className="p-2">{menuById[s.productId]?.name || "Deleted item"}</td>
                          <td className="p-2 text-right">{s.qty}</td>
                          <td className="p-2 text-right">{currency(menuById[s.productId]?.price || 0)}</td>
                          <td className="p-2 text-right">{currency((menuById[s.productId]?.price || 0) * s.qty)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {fPurchases.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.date}</td>
                      <td className="p-2">{p.item}</td>
                      <td className="p-2 text-right">{p.qty || ""}</td>
                      <td className="p-2 text-right">{p.unit ? currency(p.unit) : ""}</td>
                      <td className="p-2 text-right font-medium">{currency(p.total)}</td>
                      <td className="p-2">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-neutral-500 mt-2">Report period {range.start} to {range.end}. Generated for {biz.name} at {new Date().toLocaleString()}.</div>
          </Section>
        )}

        {tab === "backup" && (
          <Section title="Backup and data">
            <div className="flex flex-wrap gap-2 mb-2">
              <Button onClick={exportJSON}>Export JSON</Button>
              <label className="h-10 rounded-xl border px-4 inline-flex items-center gap-2 cursor-pointer bg-white shadow-sm">
                <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && importJSON(e.target.files[0])} />
                Import JSON
              </label>
              <Button variant="outline" onClick={clearAll}>Clear all data</Button>
            </div>
            <p className="text-sm text-neutral-600">Data is saved on this device using localStorage. To move to another device, export JSON and import on the other device.</p>
          </Section>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0">
        <div className="max-w-3xl mx-auto px-4 py-2 text-center text-xs text-neutral-700/80 bg-white/90 backdrop-blur border-t">
          Tip: go to <span className="font-medium">Report</span> and press <span className="font-medium">Print</span> to save a PDF.
        </div>
      </footer>
    </div>
  );
}
