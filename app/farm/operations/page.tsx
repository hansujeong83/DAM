"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Farm = { id: string; name: string };
type Plot = { id: string; farm_id: string; plot_code: string; name: string; area_m2: number | null };
type Crop = { id: string; crop_name: string; crop_code: string; cultivar: string | null };
type Cycle = { id: string; cycle_code: string; started_on: string; expected_harvest_on: string | null; status: string; farm_id: string; plot_id: string; crop_id: string };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #dce3dc", borderRadius: 9, padding: 11, marginBottom: 12 };
const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#65776c", marginBottom: 6 };
const panel: React.CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #e3e7df" };

export default function FarmOperationsPage() {
  const db = getSupabaseBrowserClient();
  const [tenant, setTenant] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [farmId, setFarmId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [cropId, setCropId] = useState("");
  const [plotCode, setPlotCode] = useState("");
  const [plotName, setPlotName] = useState("");
  const [plotArea, setPlotArea] = useState("");
  const [cycleCode, setCycleCode] = useState("");
  const [startedOn, setStartedOn] = useState(new Date().toISOString().slice(0, 10));
  const [expectedOn, setExpectedOn] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!db) return;
    const { data: { user } } = await db.auth.getUser();
    if (!user) { setStatus("먼저 /farm 화면에서 로그인하세요."); return; }
    const { data: memberships, error: me } = await db.from("tenant_memberships").select("tenant_id").eq("profile_id", user.id).eq("status", "active").limit(1);
    if (me) { setStatus(me.message); return; }
    const tid = memberships?.[0]?.tenant_id;
    if (!tid) { setStatus("활성 조직 멤버십이 없습니다."); return; }
    setTenant(tid);
    const [f, p, c, cy] = await Promise.all([
      db.from("farms").select("id,name").eq("tenant_id", tid).order("name"),
      db.from("plots").select("id,farm_id,plot_code,name,area_m2").eq("tenant_id", tid).order("created_at", { ascending: false }),
      db.from("crop_catalog").select("id,crop_name,crop_code,cultivar").eq("tenant_id", tid).eq("is_active", true).order("crop_name"),
      db.from("cultivation_cycles").select("id,cycle_code,started_on,expected_harvest_on,status,farm_id,plot_id,crop_id").eq("tenant_id", tid).order("started_on", { ascending: false })
    ]);
    const error = f.error || p.error || c.error || cy.error;
    if (error) { setStatus(error.message); return; }
    setFarms(f.data || []); setPlots(p.data || []); setCrops(c.data || []); setCycles(cy.data || []);
    if (!farmId && f.data?.[0]) setFarmId(f.data[0].id);
    if (!plotId && p.data?.[0]) setPlotId(p.data[0].id);
    if (!cropId && c.data?.[0]) setCropId(c.data[0].id);
  }, [db, farmId, plotId, cropId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function savePlot(e: FormEvent) {
    e.preventDefault(); if (!db || !tenant || !farmId) return; setBusy(true);
    const { error } = await db.from("plots").insert({ tenant_id: tenant, farm_id: farmId, plot_code: plotCode.trim(), name: plotName.trim(), area_m2: plotArea ? Number(plotArea) : null });
    if (error) setStatus(error.message);
    else { setPlotCode(""); setPlotName(""); setPlotArea(""); setStatus("필지 등록 완료"); await refresh(); }
    setBusy(false);
  }

  async function saveCycle(e: FormEvent) {
    e.preventDefault(); if (!db || !tenant || !farmId || !plotId || !cropId) return; setBusy(true);
    const { error } = await db.from("cultivation_cycles").insert({ tenant_id: tenant, farm_id: farmId, plot_id: plotId, crop_id: cropId, cycle_code: cycleCode.trim(), started_on: startedOn, expected_harvest_on: expectedOn || null, status: "planned" });
    if (error) setStatus(error.message);
    else { setCycleCode(""); setExpectedOn(""); setStatus("재배 이력 등록 완료"); await refresh(); }
    setBusy(false);
  }

  const farmName = (id: string) => farms.find(x => x.id === id)?.name || "농장 정보 없음";
  const plotLabel = (id: string) => plots.find(x => x.id === id)?.name || "필지 정보 없음";
  const cropName = (id: string) => crops.find(x => x.id === id)?.crop_name || "작물 정보 없음";

  if (!db) return <main style={{ maxWidth: 760, margin: "70px auto", padding: 24 }}><h1>DAM 재배 운영</h1><p>Supabase 환경변수를 먼저 설정하세요.</p></main>;

  return <main style={{ minHeight: "100vh", background: "#f4f3ed", padding: "34px 20px", color: "#20372e" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}><p style={{ color: "#b29660", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>DAM · CULTIVATION</p><h1 style={{ fontSize: 30, margin: 0 }}>필지 · 재배 관리</h1><p style={{ color: "#78857b", fontSize: 13 }}>농장 아래 필지를 나누고 작물별 재배 주기를 기록합니다.</p><nav style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:12}}><a href="/farm" style={{ color: "#315b49", fontSize: 13 }}>← 농장·작물 관리</a><a href="/farm/journal" style={{ color: "#315b49", fontSize: 13 }}>영농 작업일지 →</a></nav></header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16, marginBottom: 20 }}>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>필지 등록</h2><form onSubmit={savePlot}>
          <label style={label}>소속 농장 *</label><select style={field} value={farmId} onChange={e => setFarmId(e.target.value)} required><option value="">농장 선택</option>{farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <label style={label}>필지 코드 *</label><input style={field} value={plotCode} onChange={e => setPlotCode(e.target.value)} required placeholder="P-001" />
          <label style={label}>필지명 *</label><input style={field} value={plotName} onChange={e => setPlotName(e.target.value)} required placeholder="동쪽 과수원" />
          <label style={label}>면적 (㎡)</label><input style={field} type="number" min="0.01" step="0.01" value={plotArea} onChange={e => setPlotArea(e.target.value)} />
          <button disabled={busy || !farms.length} style={{ width: "100%", padding: 12, background: "#18392f", color: "white", border: 0, borderRadius: 9 }}>필지 저장</button>
        </form></section>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>재배 주기 등록</h2><form onSubmit={saveCycle}>
          <label style={label}>농장 *</label><select style={field} value={farmId} onChange={e => { setFarmId(e.target.value); setPlotId(""); }} required><option value="">농장 선택</option>{farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <label style={label}>필지 *</label><select style={field} value={plotId} onChange={e => setPlotId(e.target.value)} required><option value="">필지 선택</option>{plots.filter(p => p.farm_id === farmId).map(p => <option key={p.id} value={p.id}>{p.name} ({p.plot_code})</option>)}</select>
          <label style={label}>작물·품종 *</label><select style={field} value={cropId} onChange={e => setCropId(e.target.value)} required><option value="">작물 선택</option>{crops.map(c => <option key={c.id} value={c.id}>{c.crop_name}{c.cultivar ? " · " + c.cultivar : ""}</option>)}</select>
          <label style={label}>재배 주기 코드 *</label><input style={field} value={cycleCode} onChange={e => setCycleCode(e.target.value)} required placeholder="2027-PERSIMMON-01" />
          <label style={label}>재배 시작일 *</label><input style={field} type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)} required />
          <label style={label}>예상 수확일</label><input style={field} type="date" min={startedOn} value={expectedOn} onChange={e => setExpectedOn(e.target.value)} />
          <button disabled={busy || !farms.length || !plots.some(p => p.farm_id === farmId) || !crops.length} style={{ width: "100%", padding: 12, background: "#18392f", color: "white", border: 0, borderRadius: 9 }}>재배 이력 저장</button>
        </form></section>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16 }}>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>필지 현황 · {plots.length}</h2>{plots.length ? plots.map(p => <article key={p.id} style={{ borderTop: "1px solid #edf0ea", padding: "13px 0" }}><b>{p.name}</b><p style={{ margin: "5px 0", color: "#78857b", fontSize: 12 }}>{farmName(p.farm_id)} · {p.plot_code}</p><small>{p.area_m2 ? Number(p.area_m2).toLocaleString() + "㎡" : "면적 미등록"}</small></article>) : <p>등록된 필지가 없습니다.</p>}</section>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>재배 이력 · {cycles.length}</h2>{cycles.length ? cycles.map(c => <article key={c.id} style={{ borderTop: "1px solid #edf0ea", padding: "13px 0" }}><b>{cropName(c.crop_id)} · {c.cycle_code}</b><p style={{ margin: "5px 0", color: "#78857b", fontSize: 12 }}>{farmName(c.farm_id)} / {plotLabel(c.plot_id)}</p><small>{c.started_on} ~ {c.expected_harvest_on || "수확일 미정"} · {c.status}</small></article>) : <p>등록된 재배 이력이 없습니다.</p>}</section>
      </div>
      {status && <p role="status" style={{ marginTop: 18, fontSize: 13, color: "#56735f" }}>{status}</p>}
      <p style={{ marginTop: 24, fontSize: 11, color: "#9aa49c" }}>로그인 사용자의 활성 테넌트 기준으로 조회·저장합니다. 실제 접근 통제는 Supabase RLS 정책 적용이 필요합니다.</p>
    </div>
  </main>;
}
