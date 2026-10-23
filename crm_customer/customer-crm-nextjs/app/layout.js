import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Quản Lý Khách Hàng — Đại lý Gạo",
  description: "Quản Lý Khách Hàng — Vị Nguyên Food",
};

export default function RootLayout({ children }) {
  const envApiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    ""
  ).trim();

  let formattedApiBase = "";
  if (envApiBase) {
    const withoutTrailingSlash = envApiBase.replace(/\/+$/, "");
    formattedApiBase = withoutTrailingSlash.endsWith("/api")
      ? withoutTrailingSlash
      : withoutTrailingSlash + "/api";
  }

  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <head>
        {formattedApiBase ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__SERVER_API_BASE__ = ${JSON.stringify(envApiBase)}; window.__API_BASE__ = ${JSON.stringify(formattedApiBase)};`,
            }}
          />
        ) : null}
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
