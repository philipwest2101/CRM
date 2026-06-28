import React, { useState } from "react";
import { C } from "../../theme";

const IMP_ROWS = [
  { name:"Q1_Campaign.xlsx",   type:"CSV / Excel",   total:1234, count:1234, date:"2026-02-03 - 14:22", resp:"John Smith",  status:"success" },
  { name:"Partner Companies",  type:"Google Sheets", total:150,  count:145,  date:"2026-02-02 - 09:15", resp:"Anna Muller",  status:"partial" },
  { name:"Partners",           type:"Google Sheets", total:67,   count:0,    date:"2026-02-01 - 16:40", resp:"John Smith",  status:"error"   },
  { name:"Other_2025.xlsx",    type:"CSV / Excel",   total:25,   count:25,   date:"2025-01-02 - 10:01", resp:"Anna Muller",  status:"success" },
  { name:"Q2 Subs 2025.xlsx",  type:"CSV / Excel",   total:4321, count:4321, date:"2026-02-03 - 14:22", resp:"John Smith",  status:"success" },
  { name:"Sales Deals Q2",     type:"Google Sheets", total:150,  count:90,   date:"2026-02-02 - 09:15", resp:"Anna Muller",  status:"partial" },
  { name:"Q1 Leads",           type:"Google Sheets", total:79,   count:0,    date:"2026-02-01 - 16:40", resp:"John Smith",  status:"error"   },
];

const SM = {
  success: { label:"Imported", color:C.green, icon:"⊙" },
  partial: { label:"Partial",  color:C.amber, icon:"ℹ" },
  error:   { label:"Failed",   color:C.red,   icon:"⊗" },
};

export const ImportsHistoryPage = () => {
  const inputStyle: React.CSSProperties = {
    width:"100%", border:`1px solid ${C.border}`, borderRadius:6,
    padding:"5px 8px", fontSize:12, fontFamily:"inherit",
    outline:"none", boxSizing:"border-box", color:C.text, background:"#fff",
  };
  const selStyle: React.CSSProperties = { ...inputStyle, color:C.slate, cursor:"pointer" };

  return (
    <div style={{ flex:1, overflowY:"auto", fontFamily:"Inter, system-ui, sans-serif" }}>
      <div style={{ padding:"28px 32px 40px", maxWidth:1200 }}>

        {/* Title + Import button */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:C.navy, letterSpacing:"-0.02em" }}>
            Imports History
          </h1>
          <label style={{
            padding:"10px 36px", borderRadius:9, border:"none",
            background:"#93C5FD", color:"#1E3A5F",
            fontSize:14, fontWeight:700, cursor:"pointer",
            display:"inline-flex", alignItems:"center", gap:6, letterSpacing:"0.01em",
          }}>
            <input type="file" accept=".csv,.xlsx" style={{ display:"none" }}
              onChange={e => { if (e.target.files?.[0]) alert("Import started: " + e.target.files[0].name); (e.target as HTMLInputElement).value = ""; }}/>
            Import
          </label>
        </div>

        {/* Table */}
        <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
            <colgroup>
              <col style={{ width:"22%" }}/>
              <col style={{ width:"13%" }}/>
              <col style={{ width:"14%" }}/>
              <col style={{ width:"16%" }}/>
              <col style={{ width:"12%" }}/>
              <col style={{ width:"14%" }}/>
              <col style={{ width:"9%" }}/>
            </colgroup>
            <thead>
              {/* Column headers */}
              <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                {["Name","Type","Imported / Total","Date & Time","Responsible","Status",""].map(h => (
                  <th key={h} style={{
                    padding:"11px 14px", textAlign:"left", fontSize:12,
                    fontWeight:600, color:C.navy, whiteSpace:"nowrap",
                    userSelect:"none", cursor: h ? "pointer" : "default",
                  }}>
                    {h}{h && <span style={{ marginLeft:4, fontSize:10, color:C.muted, verticalAlign:"middle" }}>⇅</span>}
                  </th>
                ))}
              </tr>
              {/* Filter row */}
              <tr style={{ background:"#F8FAFC", borderBottom:`2px solid ${C.border}` }}>
                <td style={{ padding:"5px 8px" }}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:7, top:"50%", transform:"translateY(-50%)", color:C.muted, fontSize:11, pointerEvents:"none" }}>Q</span>
                    <input placeholder="" style={{ ...inputStyle, paddingLeft:22 }}/>
                  </div>
                </td>
                <td style={{ padding:"5px 8px" }}>
                  <select style={selStyle}>
                    <option value=""/>
                    <option>CSV / Excel</option>
                    <option>Google Sheets</option>
                  </select>
                </td>
                <td style={{ padding:"5px 8px" }}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:7, top:"50%", transform:"translateY(-50%)", color:C.muted, fontSize:11, pointerEvents:"none" }}>Q</span>
                    <input placeholder="" style={{ ...inputStyle, paddingLeft:22 }}/>
                  </div>
                </td>
                <td style={{ padding:"5px 8px" }}>
                  <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    <input type="text" placeholder="/ /" style={{ ...inputStyle, flex:1 }}/>
                    <span style={{ fontSize:16, color:C.muted, cursor:"pointer", flexShrink:0 }}>📅</span>
                  </div>
                </td>
                <td style={{ padding:"5px 8px" }}>
                  <select style={selStyle}>
                    <option value=""/>
                    <option>John Smith</option>
                    <option>Anna Muller</option>
                  </select>
                </td>
                <td style={{ padding:"5px 8px" }}>
                  <select style={selStyle}>
                    <option value=""/>
                    <option>Imported</option>
                    <option>Partial</option>
                    <option>Failed</option>
                  </select>
                </td>
                <td style={{ padding:"5px 8px" }}>
                  <div style={{ display:"flex", gap:5, justifyContent:"center" }}>
                    <button title="Apply filters" style={{ width:26, height:26, borderRadius:6, border:"none", background:C.primary, color:"#fff", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✓</button>
                    <button title="Reset filters"  style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>↺</button>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {IMP_ROWS.map((row, i) => {
                const sm = SM[row.status];
                const needsDl = row.status === "partial" || row.status === "error";
                return (
                  <tr key={row.name}
                    style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAFA")}>
                    <td style={{ padding:"12px 14px", fontSize:13, color:C.text }}>{row.name}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:C.slate }}>{row.type}</td>
                    <td style={{ padding:"12px 14px", fontSize:13, color:C.text }}>
                      {row.count.toLocaleString()} of {row.total.toLocaleString()}
                    </td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:C.slate, whiteSpace:"nowrap" }}>{row.date}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:C.text }}>{row.resp}</td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        fontSize:12, fontWeight:600,
                        padding:"4px 12px", borderRadius:6,
                        background: sm.color + "10", color: sm.color,
                        border: `1.5px solid ${sm.color}60`,
                      }}>
                        <span style={{ fontSize:13 }}>{sm.icon}</span> {sm.label}
                      </span>
                    </td>
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      {needsDl && (
                        <span title="Download the error file"
                          style={{ fontSize:18, color:C.muted, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                          ↓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, color:C.text }}>
              Page <span style={{ color:C.primary, fontWeight:700, cursor:"pointer" }}>1</span> of 1
            </span>
            <button style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <button style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <select style={{ border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px", fontSize:12, fontFamily:"inherit", color:C.slate, outline:"none", cursor:"pointer", background:"#fff" }}>
              <option>10</option><option>25</option><option>50</option>
            </select>
            <span style={{ fontSize:12, color:C.slate }}>Displaying 1–7 of 7 records</span>
          </div>
        </div>

      </div>
    </div>
  );
};
