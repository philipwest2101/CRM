import React, { useRef, useState } from "react";
import { C } from "../../theme";
import { ModalShell, FooterBtns, Label, fieldStyle } from "./mvp-modal-kit";

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS TAB — "Products & Contracts"
// Shown on the contact detail view for contacts in the Network lifecycle.
// A contact can hold several products/contracts, one of seven kinds:
//   Financing · Insurance · Investment · Gold · Real Estate Investment ·
//   Workshop · Advisory
// Each kind has its own Add/Edit form and its own summary card. New rows are
// added from the "Add Product ▾" menu; each card can be edited or expanded to
// reveal its note. Product changes never move the contact's Network Status
// automatically — the advisor updates that manually in the left rail if needed
// (per the r0EEC wireframe note).
//
// Per the user story:
//   · Status defaults to Active on create; Product Type is locked after create.
//   · On create: update the list, expand the newly created card, toast (#10).
//   · On update: update the card, toast (#11).
//   · Mandatory fields show an inline "Required field." error (#5); text length
//     is capped (100 / 1,000, #7); closing with unsaved changes asks to discard
//     (#31); the empty state is "No products added yet." (#61).
// ─────────────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  type: string;
  status: string;
  note?: string;
  [k: string]: any;
};

const PRODUCT_TYPES = [
  "Financing", "Insurance", "Investment", "Gold",
  "Real Estate Investment", "Workshop", "Advisory",
];

const STATUS_OPTIONS = ["Active", "Inactive", "Paused", "Dissolved"];
const STATUS_TONE: Record<string, string> = {
  Active: C.green, Inactive: C.slate, Paused: C.amber, Dissolved: C.red,
};

// Glossary copy (Vion-CRM App Glossary).
const MSG = {
  empty: "No products added yet.",              // #61
  created: "Product created successfully.",      // #10  ([X] = "Product")
  updated: "Product updated successfully.",      // #11  ([X] = "Product")
  required: "Required field.",                   // #5
  discardTitle: "Discard changes?",              // #31
  discardBody: "Your unsaved changes will be lost if you continue.",
};

const MAX_TEXT = 100;
const MAX_NOTE = 1000;

// A field descriptor drives both the modal form and (via `card`) the summary card.
type Field = {
  key: string;
  label: string;
  control: "text" | "date" | "textarea" | "segmented";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  showIf?: (d: Product) => boolean;
};

// Per-type schema. `fields` is the modal form (in wireframe order); `card` lists
// the label/value cells shown on the collapsed summary card; `subtitle` is the
// small grey line under the type name; `defaults` seed a new product.
const TYPE_SCHEMA: Record<string, {
  fields: Field[];
  card: { label: string; key: string }[];
  subtitle?: (p: Product) => string;
  defaults?: Record<string, any>;
}> = {
  Financing: {
    fields: [
      { key: "financingType", label: "Type of Financing", control: "segmented", options: ["Mortgage Loan", "Consumer Loan", "Debt Restructuring", "Other"] },
      { key: "financingTypeOther", label: "Type of Financing", control: "text", placeholder: "Enter type of financing", required: true, showIf: d => d.financingType === "Other" },
      { key: "partner", label: "Product Partner", control: "text", placeholder: "Enter product partner" },
      { key: "amount", label: "Product Amount", control: "text", placeholder: "Enter product amount" },
      { key: "term", label: "Term", control: "text", placeholder: "Enter term" },
      { key: "closingDate", label: "Closed Date", control: "date" },
    ],
    card: [
      { label: "Product Amount", key: "amount" },
      { label: "Term", key: "term" },
      { label: "Product Partner", key: "partner" },
      { label: "Closed Date", key: "closingDate" },
    ],
    subtitle: p => p.financingType === "Other"
      ? `Other${p.financingTypeOther ? ` - ${p.financingTypeOther}` : ""}`
      : (p.financingType || ""),
    defaults: { financingType: "Mortgage Loan" },
  },
  Insurance: {
    fields: [
      { key: "title", label: "Product Title", control: "text", placeholder: "Enter product title" },
      { key: "partner", label: "Product Partner", control: "text", placeholder: "Enter product partner" },
      { key: "amount", label: "Product Amount", control: "text", placeholder: "Enter product amount" },
      { key: "premium", label: "Monthly Premium", control: "text", placeholder: "Enter monthly premium" },
      { key: "closingDate", label: "Closed Date", control: "date" },
    ],
    card: [
      { label: "Product Amount", key: "amount" },
      { label: "Monthly Premium", key: "premium" },
      { label: "Product Partner", key: "partner" },
      { label: "Closed Date", key: "closingDate" },
    ],
    subtitle: p => p.title || "",
  },
  Investment: {
    fields: [
      { key: "investmentType", label: "Type of Investment", control: "segmented", options: ["Securities Account", "Asset Management", "Tangible Asset Policy", "Other"] },
      { key: "investmentTypeOther", label: "Type of Investment", control: "text", placeholder: "Enter type of investment", required: true, showIf: d => d.investmentType === "Other" },
      { key: "title", label: "Product Title", control: "text", placeholder: "Enter product title" },
      { key: "partner", label: "Product Partner", control: "text", placeholder: "Enter product partner" },
      { key: "oneTime", label: "One-time Amount", control: "text", placeholder: "Enter one-time amount" },
      { key: "savings", label: "Savings Plan Amount", control: "text", placeholder: "Enter savings plan amount" },
      { key: "closingDate", label: "Closed Date", control: "date" },
    ],
    card: [
      { label: "One-time Amount", key: "oneTime" },
      { label: "Savings Plan Amount", key: "savings" },
      { label: "Product Partner", key: "partner" },
      { label: "Closed Date", key: "closingDate" },
    ],
    subtitle: p => p.investmentType === "Other"
      ? `Other${p.investmentTypeOther ? ` - ${p.investmentTypeOther}` : ""}`
      : (p.investmentType || ""),
    defaults: { investmentType: "Securities Account" },
  },
  Gold: {
    fields: [
      { key: "partner", label: "Product Partner", control: "text", placeholder: "Enter product partner" },
      { key: "oneTime", label: "One-time Amount", control: "text", placeholder: "Enter one-time amount" },
      { key: "savings", label: "Savings Plan Amount", control: "text", placeholder: "Enter savings plan amount" },
      { key: "closingDate", label: "Closed Date", control: "date" },
    ],
    card: [
      { label: "One-time Amount", key: "oneTime" },
      { label: "Savings Plan Amount", key: "savings" },
      { label: "Product Partner", key: "partner" },
      { label: "Closed Date", key: "closingDate" },
    ],
  },
  "Real Estate Investment": {
    fields: [
      { key: "partner", label: "Product Partner", control: "text", placeholder: "Enter product partner" },
      { key: "amount", label: "Product Amount", control: "text", placeholder: "Enter product amount" },
      { key: "closingDate", label: "Closed Date", control: "date" },
    ],
    card: [
      { label: "Product Amount", key: "amount" },
      { label: "Product Partner", key: "partner" },
      { label: "Closed Date", key: "closingDate" },
    ],
  },
  Workshop: {
    fields: [
      { key: "workshopDate", label: "Workshop Date", control: "date" },
      { key: "price", label: "Workshop Price", control: "text", placeholder: "Enter workshop price" },
      { key: "attended", label: "Attended", control: "segmented", options: ["Attended", "Not Attended"] },
      { key: "paid", label: "Paid", control: "segmented", options: ["Paid", "Unpaid"] },
    ],
    card: [
      { label: "Workshop Price", key: "price" },
      { label: "Paid", key: "paid" },
      { label: "Attended", key: "attended" },
      { label: "Workshop Date", key: "workshopDate" },
    ],
    defaults: { attended: "Not Attended", paid: "Unpaid" },
  },
  Advisory: {
    fields: [
      { key: "consultationDate", label: "Consultation Date", control: "date" },
      { key: "fee", label: "Consultation Fee", control: "text", placeholder: "Enter consultation fee" },
      { key: "paid", label: "Paid", control: "segmented", options: ["Paid", "Unpaid"] },
    ],
    card: [
      { label: "Consultation Fee", key: "fee" },
      { label: "Paid", key: "paid" },
      { label: "Consultation Date", key: "consultationDate" },
    ],
    defaults: { paid: "Unpaid" },
  },
};

// Native date inputs store "YYYY-MM-DD"; the spec displays dates as YYYY.MM.DD.
const fmtDate = (v: any) =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.replace(/-/g, ".") : v;

// ── segmented control (Type of Financing, Status, …) ──────────────────────────
const Segmented = ({ options, value, onChange }: any) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map((o: string) => {
      const on = value === o;
      return (
        <button key={o} type="button" onClick={() => onChange(o)}
          style={{
            flex: "1 1 auto", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
            fontSize: 12.5, fontWeight: on ? 700 : 500, whiteSpace: "nowrap",
            border: `1.5px solid ${on ? C.primary : C.border}`,
            background: on ? C.primary + "14" : "#fff", color: on ? C.primaryDark : C.slate,
          }}>{o}</button>
      );
    })}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const tone = STATUS_TONE[status] || C.slate;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: tone, background: tone + "1A", padding: "3px 12px", borderRadius: 14, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
};

// ── "Discard changes?" confirmation (#31), shown over the open modal ──────────
const DiscardDialog = ({ onKeepEditing, onDiscard }: any) => (
  <>
    <div onClick={onKeepEditing} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 600 }} />
    <div role="alertdialog" aria-modal="true" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 380, maxWidth: "92vw", background: "#fff", borderRadius: 14, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.24)", padding: "20px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{MSG.discardTitle}</div>
      <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.5 }}>{MSG.discardBody}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
        <button onClick={onKeepEditing} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Keep editing</button>
        <button onClick={onDiscard} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Discard</button>
      </div>
    </div>
  </>
);

// ── Add / Edit Product modal ──────────────────────────────────────────────────
const ProductModal = ({ mode, type, product, onClose, onSave }: any) => {
  const schema = TYPE_SCHEMA[type];
  const makeInitial = (): Product =>
    product ? { ...product } : { id: "", type, status: "Active", note: "", ...(schema.defaults || {}) };
  const [draft, setDraft] = useState<Product>(makeInitial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Snapshot of the pristine draft — powers the "unsaved changes" check (#31).
  const initialJson = useRef(JSON.stringify(makeInitial()));
  const dirty = JSON.stringify(draft) !== initialJson.current;

  const set = (k: string, v: any) => {
    setDraft(d => ({ ...d, [k]: v }));
    setErrors(e => (e[k] ? { ...e, [k]: "" } : e));
  };

  // Mandatory-field check (#5). Only visible, required fields are validated.
  const validate = () => {
    const e: Record<string, string> = {};
    for (const f of schema.fields) {
      if (f.showIf && !f.showIf(draft)) continue;
      if (f.required && !String(draft[f.key] ?? "").trim()) e[f.key] = MSG.required;
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(draft);
    onClose();
  };

  // Closing (Cancel / × / backdrop / Esc) asks to discard when there are edits.
  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose());

  const renderField = (f: Field) => {
    if (f.showIf && !f.showIf(draft)) return null;
    const err = errors[f.key];
    let control: React.ReactNode;
    if (f.control === "segmented") {
      control = <Segmented options={f.options} value={draft[f.key]} onChange={(v: string) => set(f.key, v)} />;
    } else if (f.control === "date") {
      control = <input type="date" style={fieldStyle} value={draft[f.key] || ""} onChange={e => set(f.key, e.target.value)} />;
    } else if (f.control === "textarea") {
      control = <textarea maxLength={MAX_NOTE} style={{ ...fieldStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }} placeholder={f.placeholder} value={draft[f.key] || ""} onChange={e => set(f.key, e.target.value)} />;
    } else {
      control = <input maxLength={MAX_TEXT} style={{ ...fieldStyle, ...(err ? { borderColor: C.red } : null) }} placeholder={f.placeholder} value={draft[f.key] || ""} onChange={e => set(f.key, e.target.value)} />;
    }
    return (
      <div key={f.key} style={{ marginBottom: 16 }}>
        <Label>{f.label}</Label>
        {control}
        {err && <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>{err}</div>}
      </div>
    );
  };

  return (
    <ModalShell icon="📦" title={mode === "edit" ? "Edit Product" : "Add Product"} subtitle={type} accent={C.primary} width={480} onClose={requestClose}>
      {schema.fields.map(renderField)}
      {/* Status + Note are common to every product type */}
      <div style={{ marginBottom: 16 }}>
        <Label>Status</Label>
        <Segmented options={STATUS_OPTIONS} value={draft.status} onChange={(v: string) => set("status", v)} />
      </div>
      <div>
        <Label>Note</Label>
        <textarea maxLength={MAX_NOTE} style={{ ...fieldStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }} placeholder="Enter a note"
          value={draft.note || ""} onChange={e => set("note", e.target.value)} />
      </div>
      <FooterBtns onClose={requestClose} label={mode === "edit" ? "Update" : "Save"} onAction={handleSave} />

      {confirmDiscard && (
        <DiscardDialog onKeepEditing={() => setConfirmDiscard(false)} onDiscard={onClose} />
      )}
    </ModalShell>
  );
};

// ── summary card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, open, onToggle, onEdit }: any) => {
  const schema = TYPE_SCHEMA[product.type];
  const subtitle = schema.subtitle ? schema.subtitle(product) : "";
  const IconBtn = ({ title, onClick, children }: any) => (
    <span role="button" title={title} onClick={onClick}
      style={{ cursor: "pointer", color: C.slate, width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", fontSize: 14 }}
      onMouseEnter={e => (e.currentTarget.style.background = C.light)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>{children}</span>
  );
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: C.primarySoft, color: C.primary, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>📦</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{product.type}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>}
        </div>
        <StatusBadge status={product.status} />
        <IconBtn title="Edit" onClick={() => onEdit(product)}>✎</IconBtn>
        <IconBtn title={open ? "Collapse" : "Expand"} onClick={onToggle}>{open ? "▲" : "▼"}</IconBtn>
      </div>

      <div style={{ height: 1, background: C.border, margin: "12px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
        {schema.card.map(cell => (
          <div key={cell.key} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{cell.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtDate(product[cell.key]) || "—"}</div>
          </div>
        ))}
      </div>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Note</div>
          <div style={{ fontSize: 13, color: product.note ? C.text : C.muted, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{product.note || "—"}</div>
        </div>
      )}
    </div>
  );
};

// ── Add Product ▾ menu ────────────────────────────────────────────────────────
const AddProductButton = ({ onPick }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Add Product <span style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 12px 36px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 210, padding: "6px 0" }}>
            {PRODUCT_TYPES.map(pt => (
              <div key={pt} onClick={() => { setOpen(false); onPick(pt); }}
                style={{ padding: "9px 16px", fontSize: 13, color: C.text, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
                onMouseEnter={e => (e.currentTarget.style.background = C.light)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>{pt}</div>
            ))}
          </div>
        </>
      )}
    </span>
  );
};

let seq = 0;
const nextId = () => `prod-${Date.now()}-${seq++}`;

export const ProductsTab = ({ notify }: { notify?: (msg: string, variant?: string) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  // Ids of the cards whose Note section is expanded. Collapsed by default; a
  // newly created product is expanded automatically (per the user story).
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // editor: { mode, type, product? } while an Add/Edit modal is open.
  const [editor, setEditor] = useState<any>(null);

  const openAdd = (type: string) => setEditor({ mode: "add", type });
  const openEdit = (product: Product) => setEditor({ mode: "edit", type: product.type, product });

  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const save = (draft: Product) => {
    if (editor?.mode === "edit") {
      setProducts(list => list.map(p => (p.id === draft.id ? draft : p)));
      notify && notify(MSG.updated, "success");
    } else {
      const id = nextId();
      setProducts(list => [...list, { ...draft, id }]);
      setExpandedIds(prev => new Set(prev).add(id));   // expand the new product
      notify && notify(MSG.created, "success");
    }
  };

  const count = products.length;

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Products &amp; Contracts</div>
        <AddProductButton onPick={openAdd} />
      </div>

      {count === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 0", color: C.muted }}>
          <span style={{ fontSize: 26 }}>📦</span>
          <span style={{ fontSize: 13 }}>{MSG.empty}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} open={expandedIds.has(p.id)} onToggle={() => toggleExpand(p.id)} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Footer meta row — mirrors the wireframe's paging bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
        <span>Page 1 of 1</span>
        <span>{count === 0 ? "Displaying 0 records" : `Displaying 1-${count} of ${count} record${count === 1 ? "" : "s"}`}</span>
      </div>

      {editor && (
        <ProductModal mode={editor.mode} type={editor.type} product={editor.product}
          onClose={() => setEditor(null)} onSave={save} />
      )}
    </div>
  );
};

export default ProductsTab;
