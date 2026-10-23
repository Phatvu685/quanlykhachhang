"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import bodyMarkup from "./bodyMarkup";

const APP_VERSION = "20261023_2001";

/**
 * This page renders the original CRM app markup/CSS verbatim, then loads scripts
 * client-side in order.
 */
export default function Page() {
  const [xlsxReady, setXlsxReady] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  const serverBase =
    typeof window !== "undefined"
      ? window.__SERVER_API_BASE__ || window.__API_BASE__
      : "";
  const rawApiBase = (
    serverBase ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3001/api"
  )
    .trim()
    .replace(/\/$/, "");
  const apiBase = rawApiBase.endsWith("/api")
    ? rawApiBase
    : `${rawApiBase}/api`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__API_BASE__ = apiBase;
    }
  }, [apiBase]);

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: bodyMarkup }}
        suppressHydrationWarning={true}
      />

      {/* Bộ engine pdfmake để xuất trực tiếp file PDF không qua form in của trình duyệt */}
      <Script src="/legacy/pdfmake.min.js" strategy="afterInteractive" />
      <Script src="/legacy/vfs_fonts.js" strategy="afterInteractive" />

      {/* Cùng bản xlsx mà trang gốc tải từ CDN, giờ tự host tại chỗ. */}
      <Script
        src="/legacy/xlsx.full.min.js"
        strategy="afterInteractive"
        onLoad={() => setXlsxReady(true)}
      />

      {/* Lớp gọi API tới backend NestJS — PHẢI nạp trước app.js vì app.js dùng window.CrmApi */}
      <Script
        src={`/legacy/api.js?v=${APP_VERSION}`}
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
      />

      {/* Logic chính của app — chỉ chạy khi cả xlsx lẫn api.js đã sẵn sàng */}
      {xlsxReady && apiReady && (
        <Script src={`/legacy/app.js?v=${APP_VERSION}`} strategy="afterInteractive" />
      )}
    </>
  );
}
