"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Batch = { id:string; batch_code:string; crop_name:string; cultivar:string|null; harvested_on:string; quantity:number; quantity_unit:string; farm_id:string; status:string };
type Process = { id:string; source_batch_id:string; output_batch_id:string; process_name:string; processed_on:string; input_quantity:number; input_unit:string; output_quantity:number; output_unit:string; yield_rate:number; facility_name:string|null };
type Output = { id:string; batch_code:string; crop_name:string; quantity:number; quantity_unit:string; status:string };
const inputStyle:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:11,border:"1px solid #dce3dc",borderRadius:9,marginBottom:12};
const labelStyle:React.CSSProperties={display:"block",fontSize:11,fontWeight:700,color:"#65776c",marginBottom:6};
const panel:React.CSSProperties={background:"#fff",padding:22,border:"1px solid #e3e7df",borderRadius:14};
export default function ProcessingPage(){
 const db=getSupabaseBrowserClient();
 const [tenant,setTenant]=useState("");
 const [batches,setBatches]=useState<Batch[]>([]);
 const [records,setRecords]=useState<Process[]>([]);
 const [outputs,setOutputs]=useState<Output[]>([]);
 const [sourceId,setSourceId]=useState("");
 const [processCode,setProcessCode]=useState("drying");
 const [processName,setProcessName]=useState("저온 건조");
 const [processedOn,setProcessedOn]=useState(new Date().toLocaleDateString("en-CA"));
 const [inputQty,setInputQty]=useState("");
 const [inputUnit,setInputUnit]=useState("kg");
 const [outputName,setOutputName]=useState("");
 const [cultivar,setCultivar]=useState("");
 const [outputQty,setOutputQty]=useState("");
 const [outputUnit,setOutputUnit]=useState("kg");
 const [grade,setGrade]=useState("");
 const [facility,setFacility]=useState("");
 const [operator,setOperator]=useState("");
 const [notes,setNotes]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  if(!db)return;
  const {data:{user}}=await db.auth.getUser();
  if(!user){setNotice("먼저 농장 데이터 화면에서 로그인하세요.");return;}
  const {data:members,error:me}=await db.from("tenant_memberships").select("tenant_id").eq("profile_id",user.id).eq("status","active").limit(1);
  if(me){setNotice(me.message);return;}
  const tid=members?.[0]?.tenant_id;
  if(!tid){setNotice("활성 조직 멤버십이 없습니다.");return;}
  setTenant(tid);
  const [b,p]=await Promise.all([
   db.from("harvest_batches").select("id,batch_code,crop_name,cultivar,harvested_on,quantity,quantity_unit,farm_id,status").eq("tenant_id",tid).order("harvested_on",{ascending:false}).limit(200),
   db.from("processing_records").select("id,source_batch_id,output_batch_id,process_name,processed_on,input_quantity,input_unit,output_quantity,output_unit,yield_rate,facility_name").eq("tenant_id",tid).order("processed_on",{ascending:false}).limit(200)
  ]);
  if(b.error||p.error){setNotice(b.error?.message||p.error?.message||"데이터 조회 오류");return;}
  setBatches(b.data||[]);setRecords(p.data||[]);
  const ids=(p.data||[]).map(x=>x.output_batch_id);
  if(ids.length){const {data:o,error:oe}=await db.from("harvest_batches").select("id,batch_code,crop_name,quantity,quantity_unit,status").eq("tenant_id",tid).in("id",ids);if(oe)setNotice(oe.message);else setOutputs(o||[]);}else setOutputs([]);
  if(!sourceId&&b.data?.[0]){setSourceId(b.data[0].id);setInputUnit(b.data[0].quantity_unit);}
 },[db,sourceId]);
 useEffect(()=>{void refresh();},[refresh]);
 const source=batches.find(b=>b.id===sourceId);
 const alreadyUsed=records.filter(r=>r.source_batch_id===sourceId).reduce((sum,r)=>sum+Number(r.input_quantity),0);
 const available=Math.max(0,Number(source?.quantity||0)-alreadyUsed);
 async function save(e:FormEvent){
  e.preventDefault();if(!db||!tenant||!source)return;
  setBusy(true);setNotice("");
  const {data,error}=await db.rpc("create_processing_batch",{
   p_source_batch_id:source.id,p_process_code:processCode,p_process_name:processName,
   p_processed_on:processedOn,p_input_quantity:Number(inputQty),p_input_unit:inputUnit,
   p_output_crop_name:outputName,p_output_cultivar:cultivar||null,
   p_output_quantity:Number(outputQty),p_output_unit:outputUnit,p_output_grade:grade||null,
   p_facility_name:facility||null,p_operator_name:operator||null,p_notes:notes||null
  });
  if(error)setNotice(error.message);
  else {const result=Array.isArray(data)?data[0]:data;setNotice("가공 LOT 생성 완료: "+result.output_batch_code+" · 수율 "+Number(result.yield_rate).toFixed(2)+"%");setInputQty("");setOutputQty("");setGrade("");setNotes("");await refresh();}
  setBusy(false);
 }
 if(!db)return <main style={{padding:30}}>Supabase 환경변수를 먼저 설정하세요.</main>;
 return <main style={{minHeight:"100vh",background:"#f4f3ed",padding:"34px 20px",color:"#20372e"}}>
  <div style={{maxWidth:1120,margin:"0 auto"}}>
   <header style={{marginBottom:26}}><p style={{color:"#b29660",fontSize:10,fontWeight:800,letterSpacing:3}}>DAM · PROCESSING TRACEABILITY</p><h1 style={{fontSize:30,margin:0}}>가공 · LOT 계보 관리</h1><p style={{color:"#78857b",fontSize:13}}>원료 수확 LOT를 가공 LOT로 전환하고 투입량·생산량·수율을 기록합니다.</p><nav style={{display:"flex",gap:15,flexWrap:"wrap"}}><a href="/farm" style={{color:"#315b49"}}>농장 데이터</a><a href="/farm/harvest" style={{color:"#315b49"}}>수확 · 품질</a><a href="/farm/journal" style={{color:"#315b49"}}>영농 작업일지</a></nav></header>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))",gap:16}}>
    <section style={panel}><h2 style={{fontSize:18,marginTop:0}}>가공 작업 등록</h2><form onSubmit={save}>
     <label style={labelStyle}>원료 수확 LOT *</label><select style={inputStyle} value={sourceId} onChange={e=>{setSourceId(e.target.value);const b=batches.find(x=>x.id===e.target.value);if(b)setInputUnit(b.quantity_unit);}} required><option value="">원료 LOT 선택</option>{batches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.crop_name} · {b.quantity} {b.quantity_unit} · {b.harvested_on}</option>)}</select>
     {source&&<p style={{fontSize:12,color:"#66766c"}}>기등록 투입 {alreadyUsed.toLocaleString()} {source.quantity_unit} · 사용 가능 {available.toLocaleString()} {source.quantity_unit}</p>}
     <label style={labelStyle}>가공 유형 *</label><select style={inputStyle} value={processCode} onChange={e=>{setProcessCode(e.target.value);setProcessName(({drying:"저온 건조",fermentation:"발효",washing:"세척",cutting:"절단·선별",mixing:"혼합·배합",other:"기타 가공"} as Record<string,string>)[e.target.value]);}}><option value="drying">저온 건조</option><option value="fermentation">발효</option><option value="washing">세척</option><option value="cutting">절단·선별</option><option value="mixing">혼합·배합</option><option value="other">기타</option></select>
     <label style={labelStyle}>가공명 *</label><input style={inputStyle} value={processName} onChange={e=>setProcessName(e.target.value)} required/>
     <label style={labelStyle}>가공일 *</label><input style={inputStyle} type="date" value={processedOn} onChange={e=>setProcessedOn(e.target.value)} required/>
     <label style={labelStyle}>원료 투입량 *</label><div style={{display:"grid",gridTemplateColumns:"1fr 100px",gap:8}}><input style={inputStyle} type="number" min="0.001" step="0.001" max={available} value={inputQty} onChange={e=>setInputQty(e.target.value)} required/><select style={inputStyle} value={inputUnit} onChange={e=>setInputUnit(e.target.value)}><option value="kg">kg</option><option value="g">g</option><option value="L">L</option><option value="ea">개</option></select></div>
     <p style={{fontSize:11,color:"#9a6b36"}}>수율을 정확히 계산하려면 투입량과 생산량의 단위를 동일하게 선택하세요.</p><label style={labelStyle}>생산품명 *</label><input style={inputStyle} value={outputName} onChange={e=>setOutputName(e.target.value)} required placeholder="예: 단감 분말"/>
     <label style={labelStyle}>품종·원료 설명</label><input style={inputStyle} value={cultivar} onChange={e=>setCultivar(e.target.value)} placeholder="예: 부유 단감"/>
     <label style={labelStyle}>생산량 *</label><div style={{display:"grid",gridTemplateColumns:"1fr 100px",gap:8}}><input style={inputStyle} type="number" min="0.001" step="0.001" value={outputQty} onChange={e=>setOutputQty(e.target.value)} required/><select style={inputStyle} value={outputUnit} onChange={e=>setOutputUnit(e.target.value)}><option value="kg">kg</option><option value="g">g</option><option value="L">L</option><option value="ea">개</option></select></div>
     <label style={labelStyle}>등급</label><input style={inputStyle} value={grade} onChange={e=>setGrade(e.target.value)}/>
     <label style={labelStyle}>가공 시설</label><input style={inputStyle} value={facility} onChange={e=>setFacility(e.target.value)}/>
     <label style={labelStyle}>작업자</label><input style={inputStyle} value={operator} onChange={e=>setOperator(e.target.value)}/>
     <label style={labelStyle}>비고</label><textarea style={{...inputStyle,minHeight:70}} value={notes} onChange={e=>setNotes(e.target.value)}/>
     <button disabled={busy||!source||!inputQty||Number(inputQty)>available||!outputQty||inputUnit!==outputUnit} style={{width:"100%",padding:12,background:"#18392f",color:"#fff",border:0,borderRadius:9}}>가공 LOT 생성 및 계보 연결</button>
    </form></section>
    <section style={panel}><h2 style={{fontSize:18,marginTop:0}}>LOT 전환 이력</h2>{records.length?records.map(r=>{const out=outputs.find(x=>x.id===r.output_batch_id);const src=batches.find(x=>x.id===r.source_batch_id);return <article key={r.id} style={{borderTop:"1px solid #edf0ea",padding:"14px 0"}}><b>{src?.batch_code||"원료 LOT"} → {out?.batch_code||"가공 LOT"}</b><p style={{fontSize:12,color:"#78857b",margin:"6px 0"}}>{r.process_name} · {r.processed_on} · {r.facility_name||"시설 미입력"}</p><small>투입 {r.input_quantity} {r.input_unit} → 생산 {r.output_quantity} {r.output_unit} · 수율 {Number(r.yield_rate).toFixed(2)}%</small></article>}) : <p style={{fontSize:13,color:"#89958c"}}>아직 등록된 가공 이력이 없습니다.</p>}</section>
   </div>
   {notice&&<p role="status" style={{marginTop:18,fontSize:13,color:"#56735f"}}>{notice}</p>}
  </div>
 </main>;
}
