import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DAM | DATA × AGRI × MARKET",
  description: "농업 데이터에서 브랜드와 시장까지 연결하는 DAM",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f6f7f2", color: "#20352c" }}>
        {children}
      </body>
    </html>
  );
}
