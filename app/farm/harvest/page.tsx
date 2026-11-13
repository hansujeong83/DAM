"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Farm = { id: string; name: string };
type Plot = { id: string; farm_id: string; name: string };
type Crop = { id: string; crop_name: string; cultivar: string | null };
type Cycle = { id: string; farm_id: string; plot_id: string; crop_id: string; cycle_code: string };
type Batch = { id: string; farm_id: string; plot_id: string | null; cultivation_cycle_id: string | null; crop_id: string | null; batch_code: string; crop_name: string; cultivar: string | null; harvested_on: string; quantity: number; quantity_unit: string; grade: string | null; brix: number | null; status: string };
type Measurement = { id: string; harvest_batch_id: string; metric_code: string; value_numeric: number | null; value_text: string | null; unit: string | null; measured_at: string };

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #dce3dc", borderRadius: 9, padding: 11, marginBottom: 12 };
const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#65776c", marginBottom: 6 };
const panel: React.CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #e3e7df" };

export default function HarvestPage() {
  const db = getSupabaseBrowserClient();
  const [tenant, setTenant] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [farmId, setFarmId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [harvestedOn, setHarvestedOn] = useState(new Date().toLocaleDateString("en-CA"));
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [grade, setGrade] = useState("");
  const [brix, setBrix] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [metric, setMetric] = useState("weight");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("g");
  const [metricMethod, setMetricMethod] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!db) return;
    const { data: { user } } = await db.auth.getUser();
    if (!user) { setNotice("먼저 농장 데이터 관리 화면에서 로그인하세요."); return; }
    const { data: memberships, error: memberError } = await db.from("tenant_memberships").select("tenant_id").eq("profile_id", user.id).eq("status", "active").limit(1);
    if (memberError) { setNotice(memberError.message); return; }
    const tid = memberships?.[0]?.tenant_id;
    if (!tid) { setNotice("활성 조직 멤버십이 없습니다."); return; }
    setTenant(tid);
    const [f, p, c, cy, b] = await Promise.all([
      db.from("farms").select("id,name").eq("tenant_id", tid).order("name"),
      db.from("plots").select("id,farm_id,name").eq("tenant_id", tid).order("name"),
      db.from("crop_catalog").select("id,crop_name,cultivar").eq("tenant_id", tid).eq("is_active", true).order("crop_name"),
      db.from("cultivation_cycles").select("id,farm_id,plot_id,crop_id,cycle_code").eq("tenant_id", tid).order("started_on", { ascending: false }),
      db.from("harvest_batches").select("id,farm_id,plot_id,cultivation_cycle_id,crop_id,batch_code,crop_name,cultivar,harvested_on,quantity,quantity_unit,grade,brix,status").eq("tenant_id", tid).order("harvested_on", { ascending: false }).limit(100)
    ]);
    const error = f.error || p.error || c.error || cy.error || b.error;
    if (error) { setNotice(error.message); return; }
    setFarms(f.data || []); setPlots(p.data || []); setCrops(c.data || []); setCycles(cy.data || []); setBatches(b.data || []);
    if (!farmId && f.data?.[0]) setFarmId(f.data[0].id);
    if (!cycleId && cy.data?.[0]) setCycleId(cy.data[0].id);
    if (!selectedBatch && b.data?.[0]) setSelectedBatch(b.data[0].id);
    const batchIds = (b.data || []).map(x => x.id);
    if (batchIds.length) {
      const { data: m, error: me } = await db.from("harvest_quality_measurements").select("id,harvest_batch_id,metric_code,value_numeric,value_text,unit,measured_at").eq("tenant_id", tid).in("harvest_batch_id", batchIds).order("measured_at", { ascending: false }).limit(200);
      if (me) setNotice(me.message); else setMeasurements(m || []);
    } else setMeasurements([]);
  }, [db, farmId, cycleId, selectedBatch]);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeCycle = cycles.find(x => x.id === cycleId);
  const activeCrop = crops.find(x => x.id === activeCycle?.crop_id);
  const activePlot = plots.find(x => x.id === activeCycle?.plot_id);

  async function saveHarvest(e: FormEvent) {
    e.preventDefault();
    if (!db || !tenant || !activeCycle || !activeCrop || !quantity) return;
    setBusy(true);
    const { data, error } = await db.from("harvest_batches").insert({
      tenant_id: tenant, farm_id: activeCycle.farm_id, plot_id: activeCycle.plot_id,
      cultivation_cycle_id: activeCycle.id, crop_id: activeCycle.crop_id,
      crop_name: activeCrop.crop_name, cultivar: activeCrop.cultivar,
      harvested_on: harvestedOn, quantity: Number(quantity), quantity_unit: unit,
      grade: grade.trim() || null, brix: brix ? Number(brix) : null, notes: notes.trim() || null
    }).select("id,batch_code").single();
    if (error) setNotice(error.message);
    else {
      setNotice("수확 LOT 생성 완료: " + data.batch_code);
      setQuantity(""); setGrade(""); setBrix(""); setNotes("");
      setSelectedBatch(data.id);
      await refresh();
    }
    setBusy(false);
  }

  async function saveMeasurement(e: FormEvent) {
    e.preventDefault();
    if (!db || !tenant || !selectedBatch || !metricValue) return;
    setBusy(true);
    const { error } = await db.from("harvest_quality_measurements").insert({
      tenant_id: tenant, harvest_batch_id: selectedBatch, metric_code: metric,
      value_numeric: Number(metricValue), unit: metricUnit.trim() || null,
      method: metricMethod.trim() || null
    });
    if (error) setNotice(error.message);
    else { setMetricValue(""); setMetricMethod(""); setNotice("품질 측정값을 저장했습니다."); await refresh(); }
    setBusy(false);
  }

  const farmName = (id: string) => farms.find(x => x.id === id)?.name || "농장";
  const cycleName = (id: string | null) => cycles.find(x => x.id === id)?.cycle_code || "재배 주기 미연결";
  const metricLabel = (v: string) => ({ weight: "개별 과중", size: "과실 크기", firmness: "경도", acidity: "산도", brix: "당도(Brix)", temperature: "온도", other: "기타" } as Record<string,string>)[v] || v;

  if (!db) return <main style={{ maxWidth: 760, margin: "70px auto", padding: 24 }}><h1>DAM 수확 · 품질 관리</h1><p>Supabase 환경변수를 먼저 설정하세요.</p></main>;

  return <main style={{ minHeight: "100vh", background: "#f4f3ed", padding: "34px 20px", color: "#20372e" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ marginBottom: 26 }}>
        <p style={{ color: "#b29660", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>DAM · HARVEST & QUALITY</p>
        <h1 style={{ fontSize: 30, margin: 0 }}>수확 · 품질 관리</h1>
        <p style={{ color: "#78857b", fontSize: 13 }}>재배 이력에 연결된 수확 LOT를 만들고 품질 측정값을 축적합니다.</p>
        <nav style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          <a href="/farm" style={{ color: "#315b49", fontSize: 13 }}>← 농장 데이터</a>
          <a href="/farm/operations" style={{ color: "#315b49", fontSize: 13 }}>필지 · 재배 관리</a>
          <a href="/farm/journal" style={{ color: "#315b49", fontSize: 13 }}>영농 작업일지</a>
        </nav>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16, marginBottom: 20 }}>
        <section style={panel}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>수확 등록 · LOT 자동 발급</h2>
          <form onSubmit={saveHarvest}>
            <label style={label}>재배 주기 *</label>
            <select style={field} value={cycleId} onChange={e => setCycleId(e.target.value)} required><option value="">재배 주기 선택</option>{cycles.map(c => <option key={c.id} value={c.id}>{farmName(c.farm_id)} · {plots.find(p => p.id === c.plot_id)?.name || "필지"} · {c.cycle_code}</option>)}</select>
            {activeCycle && <p style={{ fontSize: 12, color: "#78857b" }}>{activeCrop?.crop_name} {activeCrop?.cultivar || ""} · {activePlot?.name}</p>}
            <label style={label}>수확일 *</label><input style={field} type="date" value={harvestedOn} onChange={e => setHarvestedOn(e.target.value)} required />
            <label style={label}>수확량 *</label><div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}><input style={field} type="number" min="0.001" step="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder="예: 125.5" /><select style={field} value={unit} onChange={e => setUnit(e.target.value)}><option value="kg">kg</option><option value="g">g</option><option value="box">상자</option><option value="ea">개</option></select></div>
            <label style={label}>등급</label><input style={field} value={grade} onChange={e => setGrade(e.target.value)} placeholder="예: 특 / 상 / 보통 / 가공용" />
            <label style={label}>당도(Brix)</label><input style={field} type="number" min="0" max="100" step="0.01" value={brix} onChange={e => setBrix(e.target.value)} placeholder="측정한 경우만 입력" />
            <label style={label}>비고</label><textarea style={{ ...field, minHeight: 70 }} value={notes} onChange={e => setNotes(e.target.value)} />
            <button disabled={busy || !cycles.length || !activeCrop} style={{ width: "100%", padding: 12, background: "#18392f", color: "white", border: 0, borderRadius: 9 }}>수확 등록 및 LOT 발급</button>
          </form>
          <p style={{ fontSize: 11, color: "#9aa49c" }}>LOT 코드는 데이터베이스에서 생성됩니다. 수기 입력이나 브라우저 난수에 의존하지 않습니다.</p>
        </section>
        <section style={panel}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>품질 측정값 추가</h2>
          <form onSubmit={saveMeasurement}>
            <label style={label}>수확 LOT *</label><select style={field} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required><option value="">LOT 선택</option>{batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} · {b.crop_name} · {b.harvested_on}</option>)}</select>
            <label style={label}>측정 항목 *</label><select style={field} value={metric} onChange={e => { setMetric(e.target.value); setMetricUnit(e.target.value === "brix" ? "°Bx" : e.target.value === "size" ? "mm" : e.target.value === "temperature" ? "°C" : "g"); }}><option value="weight">개별 과중</option><option value="size">과실 크기</option><option value="firmness">경도</option><option value="acidity">산도</option><option value="brix">당도(Brix)</option><option value="temperature">온도</option><option value="other">기타 수치</option></select>
            <label style={label}>측정값 *</label><input style={field} type="number" step="0.001" value={metricValue} onChange={e => setMetricValue(e.target.value)} required />
            <label style={label}>단위</label><input style={field} value={metricUnit} onChange={e => setMetricUnit(e.target.value)} />
            <label style={label}>측정 방법·장비</label><input style={field} value={metricMethod} onChange={e => setMetricMethod(e.target.value)} placeholder="예: 디지털 당도계, 샘플 10과 평균" />
            <button disabled={busy || !batches.length} style={{ width: "100%", padding: 12, background: "#315b49", color: "white", border: 0, borderRadius: 9 }}>측정값 저장</button>
          </form>
          <h3 style={{ fontSize: 14, marginTop: 22 }}>최근 측정 기록</h3>
          {measurements.filter(m => m.harvest_batch_id === selectedBatch).slice(0, 8).map(m => <p key={m.id} style={{ borderTop: "1px solid #edf0ea", paddingTop: 8, fontSize: 12 }}>{metricLabel(m.metric_code)} · {m.value_numeric ?? m.value_text} {m.unit || ""} <small style={{ color: "#89958c" }}>{new Date(m.measured_at).toLocaleDateString("ko-KR")}</small></p>)}
          {!measurements.some(m => m.harvest_batch_id === selectedBatch) && <p style={{ fontSize: 12, color: "#89958c" }}>등록된 측정값이 없습니다.</p>}
        </section>
      </div>
      <section style={panel}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>수확 LOT 목록 · {batches.length}</h2>
        {batches.length ? batches.map(b => <article key={b.id} style={{ borderTop: "1px solid #edf0ea", padding: "14px 0", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12 }}>
          <div><b>{b.batch_code}</b><p style={{ margin: "5px 0", color: "#78857b", fontSize: 12 }}>{b.crop_name} {b.cultivar || ""} · {farmName(b.farm_id)} · {cycleName(b.cultivation_cycle_id)}</p><small>{b.harvested_on} · {Number(b.quantity).toLocaleString()} {b.quantity_unit} · {b.grade || "등급 미입력"}{b.brix !== null ? " · " + b.brix + " °Bx" : ""}</small></div>
          <button type="button" onClick={() => setSelectedBatch(b.id)} style={{ alignSelf: "center", border: "1px solid #dce3dc", background: selectedBatch === b.id ? "#e7eee8" : "#fff", borderRadius: 8, padding: "8px 12px" }}>품질 측정</button>
        </article>) : <p style={{ color: "#78857b", fontSize: 13 }}>등록된 수확 LOT가 없습니다. 재배 주기를 먼저 등록하세요.</p>}
      </section>
      {notice && <p role="status" style={{ marginTop: 18, fontSize: 13, color: "#56735f" }}>{notice}</p>}
    </div>
  </main>;
}
