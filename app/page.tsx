const modules = [
  { title: "FARM", subtitle: "농가·농장 관리", detail: "농장, 구성원, 재배 기반 정보를 관리합니다." },
  { title: "HARVEST", subtitle: "생산·수확 데이터", detail: "수확 배치(LOT)를 중심으로 생산 이력을 연결합니다." },
  { title: "TRACE", subtitle: "이력 추적", detail: "생산·가공·이동 이벤트를 기록합니다." },
  { title: "BRAND", subtitle: "상품·브랜드", detail: "농산물과 브랜드 상품 정보를 관리합니다." },
  { title: "MARKET", subtitle: "주문·고객", detail: "고객, 주문, 판매 데이터를 연결합니다." },
  { title: "INTELLIGENCE", subtitle: "AI·지식 분석", detail: "문서 기반 RAG와 지식 그래프를 단계적으로 구축합니다." },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 24px 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800, letterSpacing: 3 }}>DAM</div>
        <div style={{ fontSize: 12, letterSpacing: 2, color: "#718078" }}>DATA × AGRI × MARKET</div>
      </header>
      <section style={{ padding: "88px 0 56px" }}>
        <p style={{ color: "#9a7a43", fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>AGRI DATA OPERATING SYSTEM</p>
        <h1 style={{ fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1.08, maxWidth: 820, margin: "18px 0" }}>
          농업 데이터에서<br />브랜드와 시장까지.
        </h1>
        <p style={{ color: "#66766d", fontSize: 18, lineHeight: 1.8, maxWidth: 680 }}>
          농가의 생산 기록과 수확 이력을 자산으로 만들고, 상품·브랜드·거래를 하나의 데이터 흐름으로 연결합니다.
        </p>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {modules.map((module) => (
          <article key={module.title} style={{ background: "#fff", border: "1px solid #e3e8e1", borderRadius: 16, padding: 24 }}>
            <p style={{ color: "#9a7a43", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{module.title}</p>
            <h2 style={{ fontSize: 21, margin: "12px 0" }}>{module.subtitle}</h2>
            <p style={{ color: "#718078", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{module.detail}</p>
          </article>
        ))}
      </section>
      <footer style={{ borderTop: "1px solid #dfe5dd", marginTop: 64, paddingTop: 24, color: "#87938b", fontSize: 12 }}>
        DAM · DATA × AGRI × MARKET · Foundation build 0.1.0
      </footer>
    </main>
  );
}
