// ============================================================================
// api.js — Lớp giao tiếp giữa frontend (app.js) và backend NestJS.
// File này định nghĩa 1 object toàn cục "CrmApi" chứa hàm gọi API cho từng
// tài nguyên (auth, users, products, combos, customers, stockEntries,
// expenses, socialAccounts). app.js chỉ cần gọi CrmApi.xxx.yyy(...) — không
// cần biết chi tiết fetch/URL/token nằm ở đâu.
// PHẢI được nạp TRƯỚC app.js (xem app/page.js bên Next.js).
// ============================================================================
(function () {
  'use strict';

  // Địa chỉ gốc của backend. Thứ tự ưu tiên:
  //   1. Giá trị người dùng tự lưu trong localStorage (đổi được NGAY LÚC CHẠY,
  //      không cần build lại — quan trọng với bản .exe/Electron vì build 1 lần
  //      nhưng backend có thể đổi domain sau này).
  //   2. window.__API_BASE__ — set lúc build (bản web, đọc từ NEXT_PUBLIC_API_BASE_URL).
  //   3. Giá trị mặc định cuối cùng.
  var API_BASE_STORAGE_KEY = 'crm_api_base';
  function resolveApiBase() {
    var stored = '';
    try { stored = localStorage.getItem(API_BASE_STORAGE_KEY) || ''; } catch (e) { /* localStorage có thể bị chặn */ }
    return stored || window.__API_BASE__ || 'http://localhost:3001/api';
  }
  var API_BASE = resolveApiBase();

  // Key lưu JWT token trong localStorage — giữ đăng nhập qua các lần tải lại trang.
  var TOKEN_KEY = 'crm_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }
  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // ---- Hàm gọi API dùng chung cho mọi request ----
  // path: vd '/customers', '/products/5'
  // options: { method, body } — mặc định method='GET'
  async function request(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var res;
    try {
      res = await fetch(API_BASE + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch (networkErr) {
      // Lỗi mạng (backend chưa chạy, sai địa chỉ, mất mạng...)
      throw new Error('Không kết nối được tới máy chủ (' + API_BASE + '). Kiểm tra backend đã chạy chưa.');
    }

    // Trả về JSON nếu có, một số response (vd DELETE) có thể rỗng
    var data = null;
    var text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = null; }
    }

    if (!res.ok) {
      // NestJS trả lỗi dạng { statusCode, message, error } — message có thể là string hoặc mảng string
      var msg = 'Đã xảy ra lỗi (' + res.status + ')';
      if (data) {
        if (Array.isArray(data.message)) msg = data.message.join('; ');
        else if (data.message) msg = data.message;
      }
      var err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  }

  function qs(params) {
    if (!params) return '';
    var parts = [];
    Object.keys(params).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === '') return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    return parts.length ? '?' + parts.join('&') : '';
  }

  // ==========================================================================
  // CrmApi — object toàn cục, mỗi nhóm khớp với 1 module backend tương ứng
  // ==========================================================================
  window.CrmApi = {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,

    // Đổi địa chỉ backend NGAY LÚC CHẠY, lưu lại cho lần mở app sau (dùng ở màn hình
    // "Cấu hình máy chủ" trên bản Electron/.exe — xem app.js, nút "⚙️ Đổi máy chủ").
    getApiBase: function () { return API_BASE; },
    setApiBase: function (url) {
      API_BASE = (url || '').trim().replace(/\/+$/, ''); // bỏ dấu "/" thừa ở cuối
      try { localStorage.setItem(API_BASE_STORAGE_KEY, API_BASE); } catch (e) {}
    },

    auth: {
      login: function (username, password) {
        return request('/auth/login', { method: 'POST', body: { username: username, password: password } });
      },
      register: function (username, password) {
        return request('/auth/register', { method: 'POST', body: { username: username, password: password } });
      },
      me: function () {
        return request('/auth/me');
      },
    },

    users: {
      list: function () { return request('/users'); },
      directory: function () { return request('/users/directory'); },
      create: function (dto) { return request('/users', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/users/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/users/' + id, { method: 'DELETE' }); },
    },

    products: {
      list: function () { return request('/products'); },
      create: function (dto) { return request('/products', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/products/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/products/' + id, { method: 'DELETE' }); },
    },

    combos: {
      list: function () { return request('/combos'); },
      create: function (dto) { return request('/combos', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/combos/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/combos/' + id, { method: 'DELETE' }); },
    },

    customers: {
      list: function (query) { return request('/customers' + qs(query)); },
      get: function (id) { return request('/customers/' + id); },
      create: function (dto) { return request('/customers', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/customers/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/customers/' + id, { method: 'DELETE' }); },
      repeat: function (id) { return request('/customers/' + id + '/repeat', { method: 'POST' }); },
      togglePayment: function (id) { return request('/customers/' + id + '/toggle-payment', { method: 'PATCH' }); },
      togglePacked: function (id) { return request('/customers/' + id + '/toggle-packed', { method: 'PATCH' }); },
      toggleDelivered: function (id) { return request('/customers/' + id + '/toggle-delivered', { method: 'PATCH' }); },
      toggleStage: function (id) { return request('/customers/' + id + '/toggle-stage', { method: 'PATCH' }); },
      transfer: function (id, staffUserId) {
        return request('/customers/' + id + '/transfer', { method: 'PATCH', body: { staffUserId: staffUserId || undefined } });
      },
    },

    stockEntries: {
      list: function () { return request('/stock-entries'); },
      create: function (dto) { return request('/stock-entries', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/stock-entries/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/stock-entries/' + id, { method: 'DELETE' }); },
    },

    expenses: {
      list: function () { return request('/expenses'); },
      create: function (dto) { return request('/expenses', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/expenses/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/expenses/' + id, { method: 'DELETE' }); },
    },

    socialAccounts: {
      list: function () { return request('/social-accounts'); },
      create: function (dto) { return request('/social-accounts', { method: 'POST', body: dto }); },
      update: function (id, dto) { return request('/social-accounts/' + id, { method: 'PATCH', body: dto }); },
      remove: function (id) { return request('/social-accounts/' + id, { method: 'DELETE' }); },
    },

    dataImport: {
      exportJson: function (category) {
        return request('/data-import/export' + (category ? '?category=' + encodeURIComponent(category) : ''));
      },
    },
  };
})();
