"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Cycle = { id: string; cycle_code: string; farm_id: string; plot_id: string; crop_id: string; status: string };
type Farm = { id: string; name: string };
type Plot = { id: string; name: string; farm_id: string };
type Crop = { id: string; crop_name: string };
type Task = { id: string; cycle_id: string; task_type: string; title: string; description: string | null; planned_at: string | null; completed_at: string | null; status: string };
type InputRecord = { id: string; cycle_id: string; applied_at: string; input_category: string; input_name: string; amount: number; unit: string; application_method: string | null; safety_interval_days: number | null; notes: string | null };

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #dce3dc", borderRadius: 9, padding: 11, marginBottom: 12 };
const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#65776c", marginBottom: 6 };
const panel: React.CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #e3e7df" };
const taskTypes = [{ value: "pruning", label: "전정" }, { value: "irrigation", label: "관수" }, { value: "weeding", label: "제초" }, { value: "pest_control", label: "병해충 관리" }, { value: "fertilizing", label: "시비" }, { value: "soil_management", label: "토양 관리" }, { value: "harvest", label: "수확" }, { value: "other", label: "기타" }];
const categories = [{ value: "fertilizer", label: "비료" }, { value: "pesticide", label: "농약" }, { value: "soil_amendment", label: "토양개량제" }, { value: "water", label: "물" }, { value: "biological", label: "생물학적 자재" }, { value: "other", label: "기타" }];

export default function FarmJournalPage() {
  const db = getSupabaseBrowserClient();
  const [tenant, setTenant] = useState("");
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputs, setInputs] = useState<InputRecord[]>([]);
  const [cycleId, setCycleId] = useState("");
  const [taskType, setTaskType] = useState("other");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [plannedAt, setPlannedAt] = useState(new Date().toISOString().slice(0, 16));
  const [taskStatus, setTaskStatus] = useState("completed");
  const [inputCategory, setInputCategory] = useState("fertilizer");
  const [inputName, setInputName] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [inputUnit, setInputUnit] = useState("kg");
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 16));
  const [method, setMethod] = useState("");
  const [safetyDays, setSafetyDays] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!db) return;
    const { data: { user } } = await db.auth.getUser();
    if (!user) { setNotice("먼저 농장 관리 화면에서 로그인하세요."); return; }
    const { data: memberships, error: membershipError } = await db.from("tenant_memberships").select("tenant_id").eq("profile_id", user.id).eq("status", "active").limit(1);
    if (membershipError) { setNotice(membershipError.message); return; }
    const tid = memberships?.[0]?.tenant_id;
    if (!tid) { setNotice("활성 조직 멤버십이 없습니다."); return; }
    setTenant(tid);
    const [cy, f, p, c, t, a] = await Promise.all([
      db.from("cultivation_cycles").select("id,cycle_code,farm_id,plot_id,crop_id,status").eq("tenant_id", tid).order("started_on", { ascending: false }),
      db.from("farms").select("id,name").eq("tenant_id", tid),
      db.from("plots").select("id,name,farm_id").eq("tenant_id", tid),
      db.from("crop_catalog").select("id,crop_name").eq("tenant_id", tid),
      db.from("cultivation_tasks").select("id,cycle_id,task_type,title,description,planned_at,completed_at,status").eq("tenant_id", tid).order("created_at", { ascending: false }),
      db.from("input_applications").select("id,cycle_id,applied_at,input_category,input_name,amount,unit,application_method,safety_interval_days,notes").eq("tenant_id", tid).order("applied_at", { ascending: false })
    ]);
    const error = cy.error || f.error || p.error || c.error || t.error || a.error;
    if (error) { setNotice(error.message); return; }
    setCycles(cy.data || []); setFarms(f.data || []); setPlots(p.data || []); setCrops(c.data || []); setTasks(t.data || []); setInputs(a.data || []);
    if (!cycleId && cy.data?.[0]) setCycleId(cy.data[0].id);
  }, [db, cycleId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function saveTask(e: FormEvent) {
    e.preventDefault();
    if (!db || !tenant || !cycleId) return;
    setBusy(true);
    const isCompleted = taskStatus === "completed";
    const { error } = await db.from("cultivation_tasks").insert({
      tenant_id: tenant, cycle_id: cycleId, task_type: taskType, title: taskTitle.trim(),
      description: taskDescription.trim() || null, planned_at: plannedAt ? new Date(plannedAt).toISOString() : null,
      completed_at: isCompleted ? new Date().toISOString() : null, status: taskStatus
    });
    if (error) setNotice(error.message);
    else { setTaskTitle(""); setTaskDescription(""); setNotice("영농 작업 기록을 저장했습니다."); await refresh(); }
    setBusy(false);
  }

  async function saveInput(e: FormEvent) {
    e.preventDefault();
    if (!db || !tenant || !cycleId) return;
    setBusy(true);
    const { error } = await db.from("input_applications").insert({
      tenant_id: tenant, cycle_id: cycleId, applied_at: new Date(appliedAt).toISOString(),
      input_category: inputCategory, input_name: inputName.trim(), amount: Number(inputAmount), unit: inputUnit.trim(),
      application_method: method.trim() || null, safety_interval_days: safetyDays ? Number(safetyDays) : null,
      notes: notes.trim() || null
    });
    if (error) setNotice(error.message);
    else { setInputName(""); setInputAmount(""); setMethod(""); setSafetyDays(""); setNotes(""); setNotice("투입 자재 기록을 저장했습니다."); await refresh(); }
    setBusy(false);
  }

  const cycleLabel = (id: string) => {
    const c = cycles.find(x => x.id === id);
    if (!c) return "재배 주기 정보 없음";
    const farm = farms.find(x => x.id === c.farm_id)?.name || "농장";
    const plot = plots.find(x => x.id === c.plot_id)?.name || "필지";
    const crop = crops.find(x => x.id === c.crop_id)?.crop_name || "작물";
    return farm + " · " + plot + " · " + crop + " · " + c.cycle_code;
  };
  const taskTypeLabel = (v: string) => taskTypes.find(x => x.value === v)?.label || v;
  const categoryLabel = (v: string) => categories.find(x => x.value === v)?.label || v;

  if (!db) return <main style={{ maxWidth: 760, margin: "70px auto", padding: 24 }}><h1>DAM 영농 작업일지</h1><p>Supabase 환경변수를 먼저 설정하세요.</p></main>;

  return <main style={{ minHeight: "100vh", background: "#f4f3ed", padding: "34px 20px", color: "#20372e" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ marginBottom: 26 }}><p style={{ color: "#b29660", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>DAM · FIELD JOURNAL</p><h1 style={{ fontSize: 30, margin: 0 }}>영농 작업일지</h1><p style={{ color: "#78857b", fontSize: 13 }}>재배 주기별 작업과 농업 투입 자재를 기록합니다.</p><a href="/farm/operations" style={{ color: "#315b49", fontSize: 13 }}>← 필지 · 재배 관리</a></header>
      <section style={{ ...panel, marginBottom: 18 }}><label style={label}>기록할 재배 주기 선택</label><select style={field} value={cycleId} onChange={e => setCycleId(e.target.value)}><option value="">재배 주기 선택</option>{cycles.map(c => <option key={c.id} value={c.id}>{cycleLabel(c.id)}</option>)}</select>{!cycles.length && <p style={{ color: "#8a6b3c", fontSize: 12 }}>먼저 필지·재배 관리에서 재배 주기를 등록하세요.</p>}</section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16, marginBottom: 20 }}>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>작업 기록</h2><form onSubmit={saveTask}>
          <label style={label}>작업 종류 *</label><select style={field} value={taskType} onChange={e => setTaskType(e.target.value)}>{taskTypes.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
          <label style={label}>작업명 *</label><input style={field} value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="예: 봄철 묵은 가지 전정" />
          <label style={label}>작업 일시 *</label><input style={field} type="datetime-local" value={plannedAt} onChange={e => setPlannedAt(e.target.value)} required />
          <label style={label}>작업 상태</label><select style={field} value={taskStatus} onChange={e => setTaskStatus(e.target.value)}><option value="completed">완료</option><option value="in_progress">진행 중</option><option value="planned">예정</option><option value="skipped">미실시</option></select>
          <label style={label}>작업 상세</label><textarea style={{ ...field, minHeight: 76 }} value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="작업 내용, 작업량, 특이사항" />
          <button disabled={busy || !cycleId} style={{ width: "100%", padding: 12, background: "#18392f", color: "white", border: 0, borderRadius: 9 }}>작업 기록 저장</button>
        </form></section>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>투입 자재 기록</h2><form onSubmit={saveInput}>
          <label style={label}>자재 구분 *</label><select style={field} value={inputCategory} onChange={e => setInputCategory(e.target.value)}>{categories.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
          <label style={label}>자재명 *</label><input style={field} value={inputName} onChange={e => setInputName(e.target.value)} required placeholder="제품명 또는 자재명" />
          <label style={label}>사용량 *</label><div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}><input style={field} type="number" min="0.001" step="0.001" value={inputAmount} onChange={e => setInputAmount(e.target.value)} required/><input style={field} value={inputUnit} onChange={e => setInputUnit(e.target.value)} required placeholder="kg, L" /></div>
          <label style={label}>사용 일시 *</label><input style={field} type="datetime-local" value={appliedAt} onChange={e => setAppliedAt(e.target.value)} required />
          <label style={label}>사용 방법</label><input style={field} value={method} onChange={e => setMethod(e.target.value)} placeholder="예: 토양 살포, 엽면 살포" />
          <label style={label}>안전사용기준 수확 전 일수</label><input style={field} type="number" min="0" step="1" value={safetyDays} onChange={e => setSafetyDays(e.target.value)} placeholder="해당 시 제품 라벨 기준으로 입력" />
          <label style={label}>비고</label><textarea style={{ ...field, minHeight: 64 }} value={notes} onChange={e => setNotes(e.target.value)} />
          <button disabled={busy || !cycleId} style={{ width: "100%", padding: 12, background: "#18392f", color: "white", border: 0, borderRadius: 9 }}>자재 기록 저장</button>
        </form></section>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16 }}>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>작업 이력 · {tasks.length}</h2>{tasks.length ? tasks.map(t => <article key={t.id} style={{ borderTop: "1px solid #edf0ea", padding: "13px 0" }}><b>{t.title}</b><p style={{ margin: "5px 0", color: "#78857b", fontSize: 12 }}>{taskTypeLabel(t.task_type)} · {cycleLabel(t.cycle_id)}</p><small>{t.planned_at ? new Date(t.planned_at).toLocaleString("ko-KR") : "일시 미정"} · {t.status}</small>{t.description && <p style={{ fontSize: 12, marginBottom: 0 }}>{t.description}</p>}</article>) : <p style={{ color: "#78857b", fontSize: 13 }}>등록된 작업 기록이 없습니다.</p>}</section>
        <section style={panel}><h2 style={{ fontSize: 18, marginTop: 0 }}>자재 사용 이력 · {inputs.length}</h2>{inputs.length ? inputs.map(x => <article key={x.id} style={{ borderTop: "1px solid #edf0ea", padding: "13px 0" }}><b>{x.input_name} · {Number(x.amount).toLocaleString()} {x.unit}</b><p style={{ margin: "5px 0", color: "#78857b", fontSize: 12 }}>{categoryLabel(x.input_category)} · {cycleLabel(x.cycle_id)}</p><small>{new Date(x.applied_at).toLocaleString("ko-KR")}{x.safety_interval_days !== null ? " · 수확 전 안전사용기준 " + x.safety_interval_days + "일" : ""}</small>{x.notes && <p style={{ fontSize: 12, marginBottom: 0 }}>{x.notes}</p>}</article>) : <p style={{ color: "#78857b", fontSize: 13 }}>등록된 자재 기록이 없습니다.</p>}</section>
      </div>
      {notice && <p role="status" style={{ marginTop: 18, fontSize: 13, color: "#56735f" }}>{notice}</p>}
      <p style={{ marginTop: 24, fontSize: 11, color: "#9aa49c" }}>안전사용기준 일수는 제품 라벨과 공식 등록정보를 확인해 입력하세요. 이 화면은 농약 사용 적합성이나 수확 가능일을 자동 판정하지 않습니다.</p>
    </div>
  </main>;
}
