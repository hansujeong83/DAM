const modules = [
  { code: "01", title: "농장·필지", en: "FARM & PLOT", desc: "농장과 필지, 면적과 위치를 구조화합니다.", tag: "기반 데이터" },
  { code: "02", title: "작물·재배", en: "CROP & CULTIVATION", desc: "작물, 품종, 재배 주기와 작업을 기록합니다.", tag: "영농 관리" },
  { code: "03", title: "생산·환경", en: "PRODUCTION DATA", desc: "센서와 현장 기록을 시간축으로 연결합니다.", tag: "데이터 수집" },
  { code: "04", title: "수확·품질", en: "HARVEST & QUALITY", desc: "수확량, 당도, 등급과 LOT를 관리합니다.", tag: "핵심 자산" },
  { code: "05", title: "가공·이력", en: "PROCESSING & TRACE", desc: "분할·혼합·가공 전후의 LOT 계보를 추적합니다.", tag: "이력 추적" },
  { code: "06", title: "브랜드·시장", en: "BRAND & MARKET", desc: "상품, 고객, 주문과 판매를 생산 데이터에 연결합니다.", tag: "시장 연결" },
];

const steps = [
  ["FARM", "농장과 필지 등록"],
  ["CROP", "작물·재배 주기 설정"],
  ["RECORD", "작업·투입재·환경 기록"],
  ["HARVEST", "수확 LOT 및 품질 등록"],
  ["TRACE", "가공·유통 이력 연결"],
  ["MARKET", "상품·주문·고객 연결"],
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "#b89a61", fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", margin: "0 0 12px" }}>{children}</p>;
}

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#f4f3ed", color: "#20372e" }}>
      <div style={{ background: "#18392f", color: "#f6f2e8" }}>
        <header style={{ maxWidth: 1240, margin: "0 auto", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, border: "1px solid #b89a61", borderRadius: 10, display: "grid", placeItems: "center", color: "#d6bd86", fontWeight: 900, fontSize: 14 }}>D</div>
            <div><div style={{ fontWeight: 900, letterSpacing: "0.18em", fontSize: 15 }}>DAM</div><div style={{ color: "#a9b8ad", fontSize: 9, letterSpacing: "0.18em", marginTop: 3 }}>DATA × AGRI × MARKET</div></div>
          </div>
          <nav style={{ display: "flex", gap: 22, color: "#d0d9d1", fontSize: 11, letterSpacing: "0.08em" }}>
            <span>OVERVIEW</span><span>FARM DATA</span><span>TRACEABILITY</span><span>INTELLIGENCE</span>
          </nav>
          <div style={{ border: "1px solid #567064", borderRadius: 30, padding: "8px 13px", fontSize: 10, color: "#d6e0d7" }}>FOUNDATION 0.2</div>
        </header>
      </div>

      <section style={{ background: "#18392f", color: "#f6f2e8", padding: "64px 28px 76px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 0.65fr)", gap: 48, alignItems: "end" }}>
          <div>
            <SectionLabel>AGRICULTURE DATA OPERATING SYSTEM</SectionLabel>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 70px)", lineHeight: 1.08, letterSpacing: "-0.055em", margin: "0 0 24px", fontWeight: 750 }}>농업의 모든 기록을<br /><span style={{ color: "#d4bd8a" }}>하나의 데이터</span>로.</h1>
            <p style={{ color: "#c4d0c7", fontSize: 15, lineHeight: 1.9, maxWidth: 610, margin: 0 }}>농장과 재배에서 시작해 수확 LOT, 가공, 브랜드, 시장까지. 흩어진 농업 데이터를 연결해 농산물의 생산 과정과 가치를 증명합니다.</p>
          </div>
          <div style={{ borderLeft: "1px solid #587064", padding: "8px 0 8px 24px" }}>
            <p style={{ color: "#d4bd8a", fontSize: 10, letterSpacing: "0.18em", margin: "0 0 10px" }}>CORE PRINCIPLE</p>
            <p style={{ fontSize: 19, lineHeight: 1.55, margin: 0, fontWeight: 650 }}>생산 데이터가<br />상품의 신뢰가 되고<br />시장의 경쟁력이 된다.</p>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1240, margin: "-24px auto 0", padding: "0 28px" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e4dc", borderRadius: 16, padding: "18px 22px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, boxShadow: "0 12px 35px rgba(26,49,39,0.06)" }}>
          {[["01", "DOMAIN FIRST", "업무 구조 우선"], ["02", "DATA CONNECT", "데이터 연결"], ["03", "TRACEABLE LOT", "LOT 기반 추적"], ["04", "AI READY", "AI 확장 구조"]].map(([n, t, d]) => (
            <div key={n} style={{ display: "flex", gap: 12, alignItems: "center", borderRight: n !== "04" ? "1px solid #ecebe5" : "none" }}>
              <span style={{ color: "#b89a61", fontSize: 11, fontWeight: 800 }}>{n}</span>
              <div><div style={{ fontSize: 10, fontWeight: 850, letterSpacing: "0.08em" }}>{t}</div><div style={{ color: "#879188", fontSize: 11, marginTop: 4 }}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "76px 28px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <div><SectionLabel>DAM MODULES</SectionLabel><h2 style={{ fontSize: 30, margin: 0, letterSpacing: "-0.04em" }}>농업 운영을 구성하는 6개 영역</h2></div>
          <p style={{ color: "#7b887f", fontSize: 12, margin: 0 }}>도메인 기반으로 순차 구현 중인 서비스 구조</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: 14 }}>
          {modules.map((m) => (
            <article key={m.code} style={{ background: "#fff", border: "1px solid #e5e4dc", borderRadius: 14, padding: 22, minHeight: 154 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: "#b89a61", fontSize: 11, fontWeight: 850 }}>{m.code}</span><span style={{ color: "#7d8d82", background: "#eef1eb", borderRadius: 20, padding: "5px 9px", fontSize: 9 }}>{m.tag}</span></div>
              <p style={{ color: "#8c998f", fontSize: 9, letterSpacing: "0.16em", margin: "18px 0 7px", fontWeight: 800 }}>{m.en}</p>
              <h3 style={{ fontSize: 19, margin: "0 0 8px" }}>{m.title}</h3>
              <p style={{ color: "#748178", fontSize: 12, lineHeight: 1.7, margin: 0 }}>{m.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "58px 28px 78px" }}>
        <div style={{ background: "#e9ece4", borderRadius: 18, padding: "30px 30px 32px" }}>
          <SectionLabel>END-TO-END DATA FLOW</SectionLabel>
          <h2 style={{ fontSize: 27, margin: "0 0 26px", letterSpacing: "-0.04em" }}>농장 데이터가 시장으로 이동하는 과정</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 9 }}>
            {steps.map(([code, label], i) => (
              <div key={code} style={{ background: "#fff", borderRadius: 11, padding: "17px 15px", position: "relative" }}>
                <div style={{ color: "#b89a61", fontSize: 9, fontWeight: 900, letterSpacing: "0.14em" }}>STEP {String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: 12, fontWeight: 900, marginTop: 11 }}>{code}</div>
                <div style={{ color: "#748178", fontSize: 11, marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ background: "#18392f", color: "#aebdb2", padding: "24px 28px", fontSize: 10 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}><span style={{ letterSpacing: "0.16em", color: "#e7e3d8", fontWeight: 800 }}>DAM · DATA × AGRI × MARKET</span><span>농업 데이터 연결 서비스 · Foundation build 0.2</span></div>
      </footer>
    </main>
  );
}
