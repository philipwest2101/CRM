import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart } from "../ui/bar-chart";
import { PeriodSelector } from "../ui/period-selector";
import { C } from "../../theme";

export const ReportDetail = ({ report, role, onBack }) => {
  const [period, setPeriod] = useState("month");
  const isVD = role === "vd";
  const Tbl = ({ headers, rows }) => (
    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
      <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>{headers.map(h=><th key={h} style={{ padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row,i)=><tr key={i} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>{row.map((cell,j)=><td key={j} style={{ padding:"9px 12px",color:C.text }}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
  const KpiBox = ({ label, value, sub, color }) => (
    <div style={{ padding:"16px 18px",borderRadius:10,background:color+"0D",border:`1px solid ${color}25` }}>
      <div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24,fontWeight:800,color }}>{value}</div>
      {sub&&<div style={{ fontSize:11,color:C.slate,marginTop:4 }}>{sub}</div>}
    </div>
  );
  const renderContent = () => {
    if(report.key==="vd_performance") {

      /* ── VD view: show MY team's consultants ── */
      if(isVD) return (<>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
          <KpiBox label="Team Leads" value="890" sub="+18% vs last month" color={C.navy} />
          <KpiBox label="Team Appointments" value="54" sub="+11% vs last month" color={C.indigo} />
          <KpiBox label="Team Closed (MTD)" value="34" sub="+26% vs last month" color={C.green} />
          <KpiBox label="Team Conv. Rate" value="7.1%" sub="+0.9pp vs last month" color={C.purple} />
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Consultant Breakdown — Thomas Müller's Team (MTD)</div>
          <Tbl headers={["Consultant","Leads","Contacted","Reached","Appointments","Closed","Conv. Rate","Trend"]}
            rows={[
              ["Anna Klein",   "62","48","33","21","14",<span style={{color:C.green,fontWeight:700}}>8.1%</span>,<span style={{color:C.green,fontWeight:700}}>↑ +1.2pp</span>],
              ["Marc Otto",    "58","42","28","18","11",<span style={{color:C.green,fontWeight:700}}>6.7%</span>,<span style={{color:C.green,fontWeight:700}}>↑ +1.2pp</span>],
              ["Nina Schmitt", "58","40","24","15"," 9",<span style={{color:C.amber,fontWeight:700}}>5.4%</span>,<span style={{color:C.muted, fontWeight:700}}>→ 0pp</span>],
              ["Thomas Müller (self)","6","5","4","2","1",<span style={{color:C.indigo,fontWeight:700}}>16.7%</span>,<span style={{color:C.green,fontWeight:700}}>↑</span>],
            ]} />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Closings per Consultant</div>
            {[["Anna Klein",14,C.green],["Marc Otto",11,C.indigo],["Nina Schmitt",9,C.amber],["Thomas Müller (self)",1,C.blue]].map(([n,v,col])=>(
              <div key={n} style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                  <span style={{ fontWeight:600 }}>{n}</span>
                  <span style={{ color:col,fontWeight:700 }}>{v} closed</span>
                </div>
                <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${(v/14)*100}%`,background:col,borderRadius:4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Team Closed Trend (MTD)</div>
            <BarChart data={[{l:"Aug",v:18},{l:"Sep",v:21},{l:"Oct",v:24},{l:"Nov",v:27},{l:"Dec",v:22},{l:"Jan",v:27},{l:"Feb",v:34}]} color={C.indigo} height={65} />
          </div>
        </div>
      </>);

      /* ── SA view: show all Sales Directors ── */
      return (<>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
          <KpiBox label="Total Org Leads" value="2,904" sub="+12% vs last month" color={C.navy} />
          <KpiBox label="Total Appointments" value="134" sub="+23% vs last month" color={C.indigo} />
          <KpiBox label="Total Closed (MTD)" value="89" sub="+31% vs last month" color={C.green} />
          <KpiBox label="Avg Conv. Rate" value="6.2%" sub="+1.1pp vs last month" color={C.purple} />
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Sales Director Breakdown (MTD)</div>
          <Tbl headers={["Director","GPs","Leads","Contacted","Appointments","Closed","Conv. Rate","Self Leads"]}
            rows={[
              ["Thomas Müller","3","890","668","54","34",<span style={{color:C.green,fontWeight:700}}>7.1%</span>,<span style={{color:C.indigo,fontWeight:700}}>6</span>],
              ["Lisa Weber","2","720","540","41","28",<span style={{color:C.green,fontWeight:700}}>6.5%</span>,"—"],
              ["Ralf Fischer","1","540","378","28","18",<span style={{color:C.amber,fontWeight:700}}>5.2%</span>,"—"],
              ["Jana Kruse","2","410","246","11","9",<span style={{color:C.red,fontWeight:700}}>3.9%</span>,"—"],
            ]} />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Closings per Director</div>
            {[["Thomas Müller",34,C.indigo],["Lisa Weber",28,C.blue],["Ralf Fischer",18,C.green],["Jana Kruse",9,C.amber]].map(([n,v,col])=>(
              <div key={n} style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}><span style={{ fontWeight:600 }}>{n.split(" ")[0]}</span><span style={{ color:col,fontWeight:700 }}>{v} closed</span></div>
                <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${(v/34)*100}%`,background:col,borderRadius:4 }} /></div>
              </div>
            ))}
          </div>
          <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Monthly Closed Trend (Org)</div>
            <BarChart data={[{l:"Aug",v:41},{l:"Sep",v:48},{l:"Oct",v:52},{l:"Nov",v:61},{l:"Dec",v:55},{l:"Jan",v:72},{l:"Feb",v:89}]} color={C.navy} height={65} />
          </div>
        </div>
      </>);
    }

    if(report.key==="campaign_roi") return (<>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        <KpiBox label="Total Leads (MTD)" value="2,904" sub="Across all sources" color={C.navy} />
        <KpiBox label="Best Campaign" value="Q1 Finanz" sub="8.6% conv. rate" color={C.indigo} />
        <KpiBox label="Avg Cost-per-Lead" value="€4.20" sub="−€0.80 vs Jan" color={C.green} />
        <KpiBox label="Zapier Status" value="⚠ Down" sub="0 leads in 6h" color={C.red} />
      </div>
      <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Campaign Performance Breakdown</div>
        <Tbl
          headers={["Campaign","Source","Leads","Contacted","Appointments","Closed","Conv. Rate","Cost-per-Lead"]}
          rows={[
            ["Q1 Finanz","Meta Ads","840","630","72","34",<span style={{color:C.green,fontWeight:700}}>8.6%</span>,"€3.80"],
            ["Webinar März","Landing Page","620","496","48","22",<span style={{color:C.green,fontWeight:700}}>7.1%</span>,"€4.10"],
            ["Partner Ref","Google Sheets","430","344","31","14",<span style={{color:C.indigo,fontWeight:700}}>5.5%</span>,"€2.20"],
            ["Messe FFM","CSV","605","97","12","5",<span style={{color:C.amber,fontWeight:700}}>4.8%</span>,"€5.60"],
            ["Giveaway","Zapier","409","245","18","8",<span style={{color:C.amber,fontWeight:700}}>3.2%</span>,"€6.90"],
          ]} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Leads by Source</div>
          {[["Meta Ads",1240,C.indigo],["Landing Pages",780,C.blue],["Google Sheets",430,C.green],["CSV",205,C.amber],["Other / Zapier",249,C.muted]].map(([n,v,col])=>(
            <div key={n} style={{ marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{n}</span><span style={{ color:col,fontWeight:700 }}>{v.toLocaleString()}</span>
              </div>
              <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${(v/1240)*100}%`,background:col,borderRadius:4 }} /></div>
            </div>
          ))}
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Monthly Lead Volume Trend</div>
          <BarChart data={[{l:"Aug",v:210},{l:"Sep",v:248},{l:"Oct",v:295},{l:"Nov",v:340},{l:"Dec",v:290},{l:"Jan",v:380},{l:"Feb",v:412}]} color={C.indigo} height={65} />
          <div style={{ marginTop:12,padding:"8px 12px",borderRadius:8,background:C.red+"0A",border:`1px solid ${C.red}20`,fontSize:11,color:C.red,fontWeight:600 }}>
            ⚠ Zapier webhook disconnected — 0 leads captured since 09:14 today. Reconnect in Settings → Integrations.
          </div>
        </div>
      </div>
    </>);

    if(report.key==="appointments") return (<>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        <KpiBox label="Total Booked (MTD)" value="134" sub="+23% vs last month" color={C.blue} />
        <KpiBox label="Show Rate" value="81%" sub="+4pp vs last month" color={C.green} />
        <KpiBox label="Cancellation Rate" value="11%" sub="−2pp vs last month" color={C.amber} />
        <KpiBox label="No-Show Rate" value="8%" sub="Team avg" color={C.red} />
      </div>
      <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Appointments by Consultant (MTD)</div>
        <Tbl
          headers={["Consultant","VD","Booked","Showed","No-Show","Cancelled","Show Rate","Closed from Appt"]}
          rows={[
            ["Anna Klein","T. Müller","21","18","2","1",<span style={{color:C.green,fontWeight:700}}>86%</span>,"14"],
            ["Marc Otto","T. Müller","18","14","3","1",<span style={{color:C.green,fontWeight:700}}>78%</span>,"11"],
            ["Kai Becker","L. Weber","15","12","2","1",<span style={{color:C.indigo,fontWeight:700}}>80%</span>,"9"],
            ["Nina Schmitt","T. Müller","15","11","3","1",<span style={{color:C.amber,fontWeight:700}}>73%</span>,"7"],
            ["Tanja Vogt","L. Weber","12","10","1","1",<span style={{color:C.green,fontWeight:700}}>83%</span>,"6"],
            ["Ben Hartmann","R. Fischer","10","8","1","1",<span style={{color:C.amber,fontWeight:700}}>80%</span>,"4"],
          ]} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Bookings by Type</div>
          {[["📞 Phone Call",68,C.blue],["📹 Video Call",48,C.indigo],["🤝 In-Person",18,C.green]].map(([n,v,col])=>(
            <div key={n} style={{ marginBottom:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{n}</span><span style={{ color:col,fontWeight:700 }}>{v} booked</span>
              </div>
              <div style={{ height:8,background:C.border,borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${(v/68)*100}%`,background:col,borderRadius:4 }} /></div>
            </div>
          ))}
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Weekly Booking Trend (Feb)</div>
          <BarChart data={[{l:"W1",v:28},{l:"W2",v:34},{l:"W3",v:38},{l:"W4",v:34}]} color={C.blue} height={65} />
        </div>
      </div>
    </>);

    if(report.key==="closing") return (<>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        <KpiBox label="Closed (MTD)" value="89" sub="+31% vs last month" color={C.green} />
        <KpiBox label="Total Revenue (MTD)" value="€178K" sub="+28% vs last month" color={C.navy} />
        <KpiBox label="Avg Deal Value" value="€2,000" sub="Per closed lead" color={C.indigo} />
        <KpiBox label="Avg Sales Cycle" value="9.4 days" sub="−1.2 days vs Jan" color={C.purple} />
      </div>
      <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Closed Deals by Consultant (MTD)</div>
        <Tbl
          headers={["Consultant","VD","Leads","Closed","Conv. Rate","Revenue","Avg Deal","Cycle (days)"]}
          rows={[
            ["Anna Klein","T. Müller","62","14",<span style={{color:C.green,fontWeight:700}}>8.1%</span>,"€28,000","€2,000","8.2"],
            ["Kai Becker","L. Weber","55","10",<span style={{color:C.green,fontWeight:700}}>7.3%</span>,"€24,000","€2,400","9.1"],
            ["Marc Otto","T. Müller","58","11",<span style={{color:C.green,fontWeight:700}}>6.7%</span>,"€22,000","€2,000","10.0"],
            ["Thomas Müller","—","6","1",<span style={{color:C.indigo,fontWeight:700}}>16.7%</span>,"€1,800","€1,800","5.0"],
            ["Nina Schmitt","T. Müller","58","9",<span style={{color:C.amber,fontWeight:700}}>5.4%</span>,"€16,200","€1,800","11.3"],
            ["Ben Hartmann","R. Fischer","42","7",<span style={{color:C.amber,fontWeight:700}}>4.8%</span>,"€14,000","€2,000","12.1"],
          ]} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Revenue by Campaign</div>
          {[["Q1 Finanz","€68K",34,C.indigo],["Webinar März","€44K",22,C.blue],["Partner Ref","€28K",14,C.green],["Messe FFM","€10K",5,C.amber],["Giveaway","€16K",8,C.purple]].map(([n,rev,v,col])=>(
            <div key={n} style={{ marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{n}</span>
                <span style={{ color:col,fontWeight:700 }}>{rev} · {v} closed</span>
              </div>
              <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${(v/34)*100}%`,background:col,borderRadius:4 }} /></div>
            </div>
          ))}
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Monthly Revenue Trend (€K)</div>
          <BarChart data={[{l:"Aug",v:82},{l:"Sep",v:96},{l:"Oct",v:104},{l:"Nov",v:122},{l:"Dec",v:110},{l:"Jan",v:139},{l:"Feb",v:178}]} color={C.green} height={65} />
        </div>
      </div>
    </>);

    if(report.key==="gdpr") return (<>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        <KpiBox label="Consent Rate" value="79.8%" sub="2,316 of 2,904 leads" color={C.green} />
        <KpiBox label="No Consent" value="588" sub="Retargeting restricted" color={C.amber} />
        <KpiBox label="Deletion Requests" value="3" sub="Pending action" color={C.red} />
        <KpiBox label="Double Opt-in" value="94.2%" sub="Of consented leads" color={C.indigo} />
      </div>
      <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Consent by Campaign Source</div>
        <Tbl
          headers={["Source","Total Leads","Consented","No Consent","Consent Rate","Double Opt-in"]}
          rows={[
            ["Meta Ads","1,240","1,042","198",<span style={{color:C.green,fontWeight:700}}>84.0%</span>,"97.1%"],
            ["Landing Page","780","655","125",<span style={{color:C.green,fontWeight:700}}>84.0%</span>,"95.6%"],
            ["Google Sheets","430","336","94",<span style={{color:C.indigo,fontWeight:700}}>78.1%</span>,"90.2%"],
            ["CSV","205","140","65",<span style={{color:C.amber,fontWeight:700}}>68.3%</span>,"81.4%"],
            ["Zapier / Other","249","143","106",<span style={{color:C.amber,fontWeight:700}}>57.4%</span>,"76.9%"],
          ]} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Consent Trend (Last 6 Months)</div>
          <BarChart data={[{l:"Sep",v:74},{l:"Oct",v:75},{l:"Nov",v:77},{l:"Dec",v:78},{l:"Jan",v:79},{l:"Feb",v:80}]} color={C.green} height={60} />
          <div style={{ fontSize:11,color:C.muted,marginTop:8 }}>Consent rate % — improving month-over-month</div>
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Pending Actions</div>
          {[
            { type:"⚠ Deletion Request", lead:"Felix Wagner", detail:"5 attempts, no consent — pending deletion", color:C.red },
            { type:"⚠ Deletion Request", lead:"Ben Schulze", detail:"Requested data removal on Feb 21", color:C.red },
            { type:"⚠ Deletion Request", lead:"Monika Braun", detail:"No interest, opted out Feb 22", color:C.red },
            { type:"ℹ No Consent", lead:"15 CSV leads", detail:"Imported without consent flag — review needed", color:C.amber },
          ].map((a,i)=>(
            <div key={i} style={{ display:"flex",gap:10,padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none",alignItems:"flex-start" }}>
              <span style={{ fontSize:16 }}>{a.type.split(" ")[0]}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:a.color }}>{a.lead}</div>
                <div style={{ fontSize:11,color:C.muted }}>{a.detail}</div>
              </div>
              <button style={{ padding:"3px 9px",borderRadius:5,border:`1px solid ${a.color}30`,background:a.color+"0D",color:a.color,fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0 }}>Resolve</button>
            </div>
          ))}
        </div>
      </div>
    </>);

    if(report.key==="email") return (<>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        <KpiBox label="Emails Sent (MTD)" value="5,808" sub="2× per lead avg" color={C.amber} />
        <KpiBox label="Open Rate" value="38.4%" sub="+3.2pp vs Jan" color={C.indigo} />
        <KpiBox label="Click Rate" value="12.1%" sub="+1.8pp vs Jan" color={C.blue} />
        <KpiBox label="Conv. from Email" value="2.8%" sub="Email-assisted closes" color={C.green} />
      </div>
      <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Email Journey Performance</div>
        <Tbl
          headers={["Journey","Trigger","Sent","Open Rate","Click Rate","Appointments","Conv. Rate"]}
          rows={[
            ["Welcome Email","Lead captured","2,904",<span style={{color:C.green,fontWeight:700}}>52.1%</span>,"18.4%","—","—"],
            ["Follow-up #1","No contact 24h","1,840",<span style={{color:C.indigo,fontWeight:700}}>41.3%</span>,"14.2%","62","3.4%"],
            ["Follow-up #2","No contact 72h","920",<span style={{color:C.amber,fontWeight:700}}>29.8%</span>,"10.1%","28","3.0%"],
            ["Appointment Reminder","Appt -24h","134",<span style={{color:C.green,fontWeight:700}}>88.1%</span>,"72.4%","—","—"],
            ["Post-Appt Nurture","After appointment","98",<span style={{color:C.green,fontWeight:700}}>61.2%</span>,"30.6%","12","12.2%"],
          ]} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Open Rate by Campaign</div>
          {[["Q1 Finanz",44,C.indigo],["Webinar März",41,C.blue],["Partner Ref",38,C.green],["Messe FFM",29,C.amber],["Giveaway",22,C.muted]].map(([n,v,col])=>(
            <div key={n} style={{ marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{n}</span><span style={{ color:col,fontWeight:700 }}>{v}%</span>
              </div>
              <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${(v/44)*100}%`,background:col,borderRadius:4 }} /></div>
            </div>
          ))}
        </div>
        <div style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Weekly Email Volume (Feb)</div>
          <BarChart data={[{l:"W1",v:1340},{l:"W2",v:1520},{l:"W3",v:1610},{l:"W4",v:1338}]} color={C.amber} height={65} />
        </div>
      </div>
    </>);

    return null;
  };
  return (
    <div style={{ padding:"0" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:20 }}>
        <button onClick={onBack} style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>← Back</button>
        <span style={{ fontSize:12,color:C.muted }}>Analytics</span><span style={{ color:C.muted }}>›</span>
        <span style={{ fontSize:12,color:C.text,fontWeight:700 }}>{report.title}</span>
        <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
          <PeriodSelector period={period} setPeriod={setPeriod} activeColor={report.color} />
          <button style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>⬇ CSV</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

// ─── AI Insights Tab ──────────────────────────────────────────────────────────
// ─── AI Objection Roleplay ────────────────────────────────────────────────────
