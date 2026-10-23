import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Quản Lý Khách Hàng — Đại lý Gạo",
  description: "Quản Lý Khách Hàng — Vị Nguyên Food",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
