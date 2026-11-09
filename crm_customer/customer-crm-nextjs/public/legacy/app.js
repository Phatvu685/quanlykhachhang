
// Xử lý chống trình duyệt tự động điền sai tài khoản (như admin@yeebo.com) từ các dự án khác
function fixAutofilledCredentials() {
  const u = document.getElementById('loginUser');
  const p = document.getElementById('loginPass');
  if (u && p) {
    // Nếu trình duyệt tự điền email hoặc tài khoản khác
    if (u.value.includes('@') || u.value.toLowerCase().includes('yeebo')) {
      u.value = 'admin';
      p.value = 'admin123';
    }
  }
}

// Bắt sự kiện bấm vào nút "admin / admin123" để tự điền nhanh
function setupDefaultCredentialsHelper() {
  const fillBtn = document.getElementById('fillDefaultAdminBtn');
  if (fillBtn) {
    fillBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const u = document.getElementById('loginUser');
      const p = document.getElementById('loginPass');
      if (u) u.value = 'admin';
      if (p) p.value = 'admin123';
      const err = document.getElementById('loginError');
      if (err) err.classList.remove('show');
    });
  }
}

let customers = [];
let combos = [];
let accounts = [];
let expenses = [];
let products = [];
let stockEntries = [];
let custSeq = 1;
let comboSeq = 1;
let accountSeq = 1;
let expenseSeq = 1;
let productSeq = 1;
let stockSeq = 1;
let editingCustomerId = null;
let editingComboId = null;
// Các nhóm khách hàng (gộp nhiều đơn của cùng 1 khách) đang được mở rộng để xem chi tiết từng đơn
let expandedCustomerGroups = new Set();
let editingAccountId = null;
let editingExpenseId = null;
let editingProductId = null;
let editingStockId = null;
let transferCustomerId = null;
let currentExpenseType = 'chi_phi';
let currentStockType = 'nhap';
let pendingCustomerStage = 'order';

let users = [];
let currentUser = null;
// Map username -> id số (id thật trong DB) — chỉ admin nạp được (users.list() yêu cầu quyền admin).
// Dùng để chuyển đổi giá trị <select> (vốn dùng username làm value, giữ nguyên UI gốc)
// thành staffUserId (khoá ngoại số) khi gọi API tạo/sửa/chuyển giao khách hàng.
let userIdByUsername = {};

/* ================= LỚP ĐỒNG BỘ DỮ LIỆU VỚI BACKEND (API) =================
   Toàn bộ mảng customers/combos/products/stockEntries/expenses/accounts ở trên
   giờ đóng vai trò "cache cục bộ": sau khi đăng nhập, loadAllData() tải dữ liệu
   thật từ backend (NestJS + PostgreSQL) về, ánh xạ (map) sang đúng hình dạng mà
   toàn bộ hàm render...() bên dưới đang mong đợi — nhờ vậy KHÔNG cần sửa lại
   logic hiển thị, chỉ cần thay nguồn dữ liệu. Mọi thao tác THÊM/SỬA/XÓA giờ gọi
   CrmApi.* (xem api.js) rồi gọi lại loadAllData() để đồng bộ cache + vẽ lại UI. */

// ---- Các hàm map: dữ liệu backend trả về (JSON) -> đúng hình dạng field mà code gốc dùng ----
function mapProduct(p){
  return { id:p.id, name:p.name, unit:p.unit, minStock:Number(p.minStock)||0, sellPrice:Number(p.sellPrice)||0, note:p.note||'' };
}
function mapCombo(c){
  return {
    id:c.id, name:c.name, desc:c.desc||'',
    productId:c.productId||null,
    productName:c.productName || (c.product?c.product.name:'') || '',
    unit:c.unit||'kg',
    baseKg:Number(c.baseKg)||0, unitPrice:Number(c.unitPrice)||0,
    offerType:c.offerType||'percent', offerValue:Number(c.offerValue)||0,
    giftProductId:c.giftProductId||null, giftQty:Number(c.giftQty)||0,
  };
}
function mapStockEntry(s){
  return {
    id:s.id, type:s.type, productId:s.productId,
    qty:Number(s.qty)||0, unitPrice:Number(s.unitPrice)||0,
    supplier:s.supplier||'', date:s.date||'', note:s.note||'',
    expenseId: s.expense ? s.expense.id : null,
  };
}
function mapExpense(e){
  // Lưu ý: backend gọi field này là "kind", code gốc gọi là "type" — map lại cho khớp.
  return { id:e.id, type:e.kind, name:e.name, amount:Number(e.amount)||0, date:e.date||'', note:e.note||'', autoStock: !!e.autoStock };
}
function mapSocialAccount(a){
  return { id:a.id, resource:a.resource, username:a.username, password:a.password };
}
function mapCustomer(c){
  return {
    id:c.id, name:c.name, phone:c.phone||'', address:c.address||'', type:c.type, note:c.note||'',
    kg:Number(c.kg)||0, price:Number(c.price)||0,
    // Code gốc dùng "combo" như cờ 'co'/'khong' (không lưu tên), tách riêng khỏi "comboId"
    combo: c.comboId ? 'co' : 'khong',
    comboId: c.comboId || null,
    // Code gốc dùng "staff" là USERNAME (chuỗi), không phải id số -> lấy từ quan hệ staffUser
    staff: c.staffUser ? c.staffUser.username : (c.staffUserId ? String(c.staffUserId) : ''),
    productId: c.productId || null,
    stockEntryId: c.stockEntryId || null,
    giftStockEntryId: c.giftStockEntryId || null,
    giftProductId: c.giftProductId || null,
    stage: c.stage || 'order',
    paymentStatus: c.paymentStatus || 'da_tra',
    packed: !!c.packed, delivered: !!c.delivered,
    acquiredDate: c.acquiredDate || '', lastOrderDate: c.lastOrderDate || '',
    deliveryDate: c.deliveryDate || '', nextContactDate: c.nextContactDate || '',
    createdAt: c.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
  };
}

// Bảng tên hiển thị mặc định cho 5 tài khoản seed sẵn — user đăng ký mới (qua form
// "Đăng ký") sẽ được TỰ ĐỘNG thêm vào bảng này (dùng luôn username làm nhãn hiển thị)
// ngay trong loadAllData(), để giao diện không bao giờ hiện "undefined".
function mergeStaffLabel(usersList){
  (usersList||[]).forEach(u=>{
    if(!staffLabel[u.username]) staffLabel[u.username] = u.username;
  });
}

// ---- Tải TOÀN BỘ dữ liệu từ backend về, ánh xạ vào cache cục bộ, rồi vẽ lại mọi UI ----
async function loadAllData(){
  try{
    const isAdmin = currentUser && currentUser.role === 'admin';
    const results = await Promise.all([
      CrmApi.customers.list(),
      CrmApi.combos.list(),
      CrmApi.products.list(),
      CrmApi.stockEntries.list(),
      CrmApi.expenses.list(),
      CrmApi.socialAccounts.list(),
      // "directory" trả {id,username} cho MỌI role đã đăng nhập (không chỉ admin) —
      // dùng để dịch username <-> id và luôn hiển thị đúng tên nhân viên, kể cả tài
      // khoản vừa tự đăng ký mà chưa từng có admin nào tải danh sách này trước đó.
      CrmApi.users.directory(),
    ]);
    customers = results[0].map(mapCustomer);
    combos = results[1].map(mapCombo);
    products = results[2].map(mapProduct);
    stockEntries = results[3].map(mapStockEntry);
    expenses = results[4].map(mapExpense);
    accounts = results[5].map(mapSocialAccount);

    const directory = results[6] || [];
    userIdByUsername = {};
    directory.forEach(u=>{ userIdByUsername[u.username] = u.id; });
    mergeStaffLabel(directory);

    // Danh sách đầy đủ (kèm role) chỉ admin mới tải được — dùng khi cần (hiện chưa
    // có màn hình riêng quản lý tài khoản trong UI, nhưng giữ sẵn cho tương lai).
    if(isAdmin){
      try{ users = await CrmApi.users.list(); } catch(e){ /* bỏ qua nếu lỗi, không chặn app */ }
    }
  } catch(err){
    appAlert('Không tải được dữ liệu từ máy chủ: ' + err.message, {type:'danger', title:'Lỗi kết nối'});
    return;
  }
  populateProductSelects();
  populateComboSelect();
  populateStaffSelect();
  renderAccounts();
  renderCombos();
  renderWarehouse();
  render(); // renderCustomerList x2 + renderOrders + renderStats + renderCashflow + applyRolePermissions
}

// Chuyển "staff" (username, dùng trong <select>) -> staffUserId (số, dùng cho API).
// Nhân viên thường luôn map về CHÍNH id của họ (dropdown bị khoá vào bản thân họ).
function staffUsernameToId(username){
  if(!username) return null;
  if(currentUser && currentUser.role !== 'admin') return currentUser.id;
  return userIdByUsername[username] || null;
}

/* ================= FORM CẢNH BÁO / XÁC NHẬN DÙNG CHUNG ================= */
// Thay thế alert()/confirm() mặc định của trình duyệt bằng form cảnh báo
// đẹp, đồng bộ giao diện. Dùng cho: xóa dữ liệu, cảnh báo tồn kho không đủ,
// thiếu thông tin bắt buộc, và mọi thông báo quan trọng khác trong ứng dụng.
let _warnResolve = null;

function _showWarnModal({title, message, type='info', okText='Xác nhận', cancelText='Hủy', showCancel=true}){
  const icons = {danger:'🗑️', warning:'⚠️', info:'ℹ️', success:'✅'};
  const iconEl = document.getElementById('warnModalIcon');
  const okBtn = document.getElementById('warnModalOkBtn');
  const cancelBtn = document.getElementById('warnModalCancelBtn');
  const actions = document.getElementById('warnModalActions');
  const box = document.getElementById('warnModalBox');

  iconEl.textContent = icons[type] || icons.info;
  iconEl.className = 'warn-icon type-' + type;
  document.getElementById('warnModalTitle').textContent = title;
  document.getElementById('warnModalMessage').textContent = message;
  okBtn.textContent = okText;
  okBtn.className = 'type-' + type;
  cancelBtn.textContent = cancelText;
  cancelBtn.style.display = showCancel ? '' : 'none';
  actions.classList.toggle('single-action', !showCancel);

  box.classList.remove('shake');
  void box.offsetWidth; // reset animation
  document.getElementById('warnModalOverlay').classList.add('active');
  okBtn.focus();
}

function _closeWarnModal(){
  document.getElementById('warnModalOverlay').classList.remove('active');
}

// appAlert: thông báo đơn giản (chỉ 1 nút OK), trả về Promise khi người dùng bấm OK
function appAlert(message, opts={}){
  return new Promise(resolve=>{
    _showWarnModal({
      title: opts.title || 'Thông báo',
      message,
      type: opts.type || 'info',
      okText: opts.okText || 'Đã hiểu',
      showCancel: false,
    });
    _warnResolve = () => { resolve(); };
  });
}

// appConfirm: hỏi xác nhận (Hủy / Xác nhận), trả về Promise<boolean>
function appConfirm(message, opts={}){
  return new Promise(resolve=>{
    _showWarnModal({
      title: opts.title || (opts.type === 'danger' ? '⚠️ Xác nhận xóa' : 'Xác nhận'),
      message,
      type: opts.type || 'warning',
      okText: opts.okText || 'Xác nhận',
      cancelText: opts.cancelText || 'Hủy',
      showCancel: true,
    });
    _warnResolve = (ok) => { resolve(!!ok); };
  });
}

document.getElementById('warnModalOkBtn').addEventListener('click', ()=>{
  _closeWarnModal();
  const cb = _warnResolve; _warnResolve = null;
  if(cb) cb(true);
});
document.getElementById('warnModalCancelBtn').addEventListener('click', ()=>{
  _closeWarnModal();
  const cb = _warnResolve; _warnResolve = null;
  if(cb) cb(false);
});
document.getElementById('warnModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id !== 'warnModalOverlay') return;
  const box = document.getElementById('warnModalBox');
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && document.getElementById('warnModalOverlay').classList.contains('active')){
    _closeWarnModal();
    const cb = _warnResolve; _warnResolve = null;
    if(cb) cb(false);
  }
});
/* ================= /FORM CẢNH BÁO ================= */

const typeLabel = {
  moi: {t:"Khách mới", c:"tag-new"},
  cu: {t:"Khách cũ", c:"tag-old"},
  tiemnang: {t:"Tiềm năng", c:"tag-lead"},
};
const staffLabel = {
  hai_em: "Hải Em",
  ngoc_thuong: "Ngọc Thương",
  ai_thi: "Ái Thi",
  tan_phat: "Tấn Phát",
};

function populateStaffSelect(){
  const sel = document.getElementById('cStaff');
  const current = sel.value;
  const isAdmin = currentUser && currentUser.role === 'admin';
  if(isAdmin){
    sel.innerHTML = `<option value="">— Chưa phân công —</option>` +
      Object.entries(staffLabel).map(([key,label])=>`<option value="${key}">${escapeHtml(label)}</option>`).join('');
    sel.disabled = false;
    sel.value = current;
  } else if(currentUser && staffLabel[currentUser.username]){
    // Nhân viên: chỉ thấy đúng tên của mình, không được chọn người khác
    sel.innerHTML = `<option value="${currentUser.username}">${escapeHtml(staffLabel[currentUser.username])}</option>`;
    sel.value = currentUser.username;
    sel.disabled = true;
  } else {
    sel.innerHTML = `<option value="">— Chưa phân công —</option>`;
    sel.disabled = true;
  }
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.innerText = s;
  return d.innerHTML;
}
function formatVND(n){
  return Math.round(n).toLocaleString('vi-VN') + 'đ';
}
function formatDateVN(dateStr){
  if(!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
function formatDateTimeVN(ts){
  if(!ts) return '—';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function dateKeyFromTimestamp(ts){
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isPastDate(dateStr){
  if(!dateStr) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  return d < today;
}

// Khởi tạo giao diện ở trạng thái RỖNG trước khi đăng nhập (chưa có dữ liệu thật
// từ backend — dữ liệu thật chỉ được tải về qua loadAllData() SAU KHI đăng nhập
// thành công). 5 tài khoản mặc định (admin/hai_em/ngoc_thuong/ai_thi/tan_phat)
// đã được tạo sẵn trong database qua "npm run seed" ở phía backend.
function initEmptyUI(){
  populateProductSelects();
  populateComboSelect();
  renderAccounts();
  renderCashflow();
  renderWarehouse();
  render();
}

// ---- Các hàm thuần (pure) tính giá combo — vẫn dùng để hiển thị (renderCombos,
// xem trước combo trong form khách hàng...), hoạt động trên dữ liệu đã tải từ backend ----
function comboUnit(c){
  return c.unit || 'kg';
}
function comboBasePrice(c){
  return (Number(c.baseKg)||0) * (Number(c.unitPrice)||0);
}
function comboTotalKg(c){
  const base = Number(c.baseKg)||0;
  if(c.offerType === 'kg') return base + (Number(c.offerValue)||0);
  return base;
}
function comboFinalPrice(c){
  const base = comboBasePrice(c);
  const val = Number(c.offerValue)||0;
  if(c.offerType === 'percent') return Math.max(0, base * (1 - val/100));
  if(c.offerType === 'money') return Math.max(0, base - val);
  return base; // offerType === 'kg': giá không đổi, chỉ tặng thêm
}
function comboOfferLabel(c){
  const val = Number(c.offerValue)||0;
  const unit = comboUnit(c);
  let label = '—';
  if(c.offerType === 'percent') label = `🔻 Giảm ${val}%`;
  else if(c.offerType === 'kg') label = `🎁 Tặng thêm ${formatKg(val, unit)}`;
  else if(c.offerType === 'money') label = `💵 Trừ ${formatVND(val)}`;
  if(c.giftProductId && c.giftQty){
    const gp = products.find(x=>x.id===c.giftProductId);
    label += ` + 🎁 ${formatKg(c.giftQty, gp?gp.unit:'')} ${gp?escapeHtml(gp.name):''}`;
  }
  return label;
}
function formatKg(n, unit){
  n = Number(n)||0;
  unit = unit || 'kg';
  return `${Number.isInteger(n) ? n : n.toFixed(1)} ${unit}`;
}

/* ================= PHÂN TRANG (PAGINATION) ================= */
const PAGE_SIZE = 10;
const paginationState = {
  order: 1,      // Tab Khách hàng
  cskh: 1,       // Tab CSKH
  orders: 1,     // Tab Đơn hàng
  cashflow: 1,   // Tab Sổ dòng tiền
  stock: 1,      // Tab Sổ kho
  products: 1,   // Tab Sản phẩm kho
  combos: 1,     // Tab Combo
  accounts: 1    // Tab Tài khoản MXH
};

function renderPaginationBar(tableKey, totalItems, currentPage, pageSize){
  pageSize = pageSize || PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalItems <= pageSize) {
    return '';
  }

  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, totalItems);

  let pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (safePage > 3) pages.push('...');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push('...');
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  const buttonsHtml = pages.map(p => {
    if (p === '...') return `<span class="page-ellipsis">…</span>`;
    const isActive = p === safePage ? 'active' : '';
    return `<button type="button" class="page-num-btn ${isActive}" data-page="${p}">${p}</button>`;
  }).join('');

  return `
    <div class="pagination-bar" data-table="${tableKey}">
      <div class="pagination-info">
        Hiển thị <strong>${startIdx}–${endIdx}</strong> / <strong>${totalItems}</strong> mục (Trang ${safePage}/${totalPages})
      </div>
      <div class="pagination-controls">
        <button type="button" class="page-nav-btn" data-page="1" ${safePage === 1 ? 'disabled' : ''} title="Trang đầu">«</button>
        <button type="button" class="page-nav-btn" data-page="${safePage - 1}" ${safePage === 1 ? 'disabled' : ''} title="Trang trước">‹ Trước</button>
        <div class="page-numbers">${buttonsHtml}</div>
        <button type="button" class="page-nav-btn" data-page="${safePage + 1}" ${safePage === totalPages ? 'disabled' : ''} title="Trang sau">Sau ›</button>
        <button type="button" class="page-nav-btn" data-page="${totalPages}" ${safePage === totalPages ? 'disabled' : ''} title="Trang cuối">»</button>
      </div>
    </div>
  `;
}

function attachPaginationEvents(holder, tableKey, onPageChange){
  const bar = holder.querySelector(`.pagination-bar[data-table="${tableKey}"]`);
  if (!bar) return;
  bar.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const p = Number(btn.dataset.page);
      if (!isNaN(p) && p > 0) {
        onPageChange(p);
      }
    });
  });
}

function render(){
  renderCustomerList('order', 'custSearch','custFilterType','custFilterStaff','custCount','customerTableHolder', 'custFilterPayment','custFilterPacked','custFilterDelivered');
  renderCustomerList('cskh', 'cskhSearch','cskhFilterType','cskhFilterStaff','cskhCount','cskhTableHolder', 'cskhFilterPayment','cskhFilterPacked','cskhFilterDelivered');
  renderOrders();
  renderStats();
  renderCashflow();
  if(currentUser) applyRolePermissions();
}

// Ngày "thực" của đơn hàng: ưu tiên ngày đặt đơn / tiếp nhận do người dùng nhập,
// chỉ dùng createdAt (thời điểm tạo bản ghi trong hệ thống) khi không có ngày nào khác.
function getOrderDateKey(c){
  return c.lastOrderDate || c.acquiredDate || dateKeyFromTimestamp(c.createdAt || Date.now());
}

function renderOrders(){
  const holder = document.getElementById('orderTableHolder');
  if(!holder) return;

  const search = document.getElementById('orderSearch').value.trim().toLowerCase();
  const staffFilter = document.getElementById('orderFilterStaff').value;
  const paymentFilter = document.getElementById('orderFilterPayment').value;
  const fromDate = document.getElementById('orderFromDate').value;
  const toDate = document.getElementById('orderToDate').value;

  // Một "đơn hàng" là khách hàng đã có giá trị đơn (price > 0), bất kể đang ở giai đoạn Đơn hàng hay CSKH
  const allOrders = customers.filter(c=>c.price > 0);

  const todayKey = dateKeyFromTimestamp(Date.now());
  const todayOrders = allOrders.filter(c=>getOrderDateKey(c) === todayKey);
  const todayCount = todayOrders.length;
  const todayValue = todayOrders.reduce((s,c)=>s+(Number(c.price)||0), 0);
  const orderTodayCountEl = document.getElementById('orderTodayCount');
  if(orderTodayCountEl) orderTodayCountEl.textContent = `${todayCount} đơn`;
  const orderTodayValueEl = document.getElementById('orderTodayValue');
  if(orderTodayValueEl) orderTodayValueEl.textContent = formatVND(todayValue);

  const filtered = allOrders.filter(c=>{
    const matchSearch = !search || c.name.toLowerCase().includes(search) || c.phone.includes(search);
    const matchStaff = !staffFilter || (staffFilter === 'none' ? !c.staff : c.staff === staffFilter);
    const matchPayment = !paymentFilter || c.paymentStatus === paymentFilter;
    const orderDateKey = getOrderDateKey(c);
    const matchFrom = !fromDate || orderDateKey >= fromDate;
    const matchTo = !toDate || orderDateKey <= toDate;
    return matchSearch && matchStaff && matchPayment && matchFrom && matchTo;
  }).sort((a,b)=>getOrderDateKey(b).localeCompare(getOrderDateKey(a)) || (b.createdAt||0)-(a.createdAt||0));

  document.getElementById('orderFilteredCount').textContent = `${filtered.length} đơn`;
  document.getElementById('orderFilteredValue').textContent = formatVND(filtered.reduce((s,c)=>s+c.price,0));
  document.getElementById('orderCount').textContent = `${filtered.length} / ${allOrders.length} đơn hàng`;

  if(filtered.length === 0){
    holder.innerHTML = `<div class="empty">Không có đơn hàng nào khớp bộ lọc.</div>`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (!paginationState.orders || paginationState.orders > totalPages) {
    paginationState.orders = 1;
  }
  const curPage = paginationState.orders;
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pagedOrders = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  holder.innerHTML = `<table>
    <thead><tr>
      <th>Ngày đặt đơn</th>
      <th>Khách hàng</th>
      <th>Sản phẩm / KL</th>
      <th>Giá trị</th>
      <th style="text-align:center;">Trạng thái</th>
      <th>Nhân viên</th>
      <th style="text-align:center;">Thao tác</th>
    </tr></thead>
    <tbody>
      ${pagedOrders.map(c=>{
        const product = c.productId ? products.find(p=>p.id===c.productId) : null;
        const payTag = c.paymentStatus === 'chua_tra'
          ? `<span class="tag tag-debt row-action tag-clickable" data-action="toggle-payment" data-id="${c.id}" title="Bấm để đổi thanh toán">🕒 Công nợ</span>`
          : `<span class="tag tag-revenue row-action tag-clickable" data-action="toggle-payment" data-id="${c.id}" title="Bấm để đổi thanh toán">✅ Đã thu</span>`;
        return `<tr>
          <td style="white-space:nowrap;">${formatDateVN(getOrderDateKey(c))}</td>
          <td><div class="cust-name">${escapeHtml(c.name)}</div><div class="cust-phone">${escapeHtml(c.phone||'')}</div></td>
          <td>${product ? escapeHtml(product.name) : '—'}${c.kg ? ` — <strong>${c.kg} ${product ? escapeHtml(product.unit) : 'kg'}</strong>` : ''}</td>
          <td style="white-space:nowrap;font-weight:700;color:#0f172a;">${formatVND(c.price)}</td>
          <td style="white-space:nowrap;text-align:center;">${payTag}</td>
          <td style="white-space:nowrap;">${c.staff ? escapeHtml(staffLabel[c.staff]) : '<span class="contact-line">—</span>'}</td>
          <td style="white-space:nowrap;text-align:center;">
            <button class="row-action" data-action="print-invoice" data-id="${c.id}" title="In / Xuất hóa đơn PDF" style="padding:4px 10px;font-size:12px;font-weight:700;">🧾 In hóa đơn</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  ${renderPaginationBar('orders', filtered.length, curPage, PAGE_SIZE)}`;

  attachPaginationEvents(holder, 'orders', (newPage) => {
    paginationState.orders = newPage;
    renderOrders();
    holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'print-invoice') {
        const c = customers.find(x => x.id === id);
        if(c) showInvoiceModal(c);
      } else if(btn.dataset.action === 'toggle-payment') {
        togglePaymentStatus(id);
      }
    });
  });
}

async function toggleCustomerStage(id){
  return togglePaymentStatus(id);
}

// Khóa để gộp các đơn hàng của CÙNG 1 khách lại với nhau: ưu tiên theo SĐT, nếu không có SĐT thì theo tên+địa chỉ
function customerGroupKey(c){
  const phone = (c.phone||'').trim();
  if(phone) return 'p:'+phone;
  return 'n:'+(c.name||'').trim().toLowerCase()+'|'+(c.address||'').trim().toLowerCase();
}

function toggleCustomerGroup(key){
  if(expandedCustomerGroups.has(key)) expandedCustomerGroups.delete(key);
  else expandedCustomerGroups.add(key);
  render();
}

// Render 1 dòng <tr> cho 1 đơn hàng (dùng chung cho dòng đơn lẻ và dòng con khi mở rộng nhóm).
// compactIdentity=true: đây là dòng con trong 1 nhóm đã mở rộng -> không lặp lại tên/SĐT/địa chỉ nữa,
// thay vào đó hiển thị ngày giờ đặt đơn cụ thể để phân biệt các đơn với nhau.
function renderCustomerRow(c, stage, compactIdentity){
  const tp = typeLabel[c.type];
  const qtyInfo = c.kg ? `${c.kg} kg` : '—';
  const amountInfo = c.price ? formatVND(c.price) : '—';

  const paymentBadge = c.price
    ? (c.paymentStatus === 'chua_tra'
        ? `<span class="tag tag-debt row-action tag-clickable" data-action="toggle-payment" data-id="${c.id}" title="Bấm để đổi thanh toán">🕒 Công nợ</span>`
        : `<span class="tag tag-revenue row-action tag-clickable" data-action="toggle-payment" data-id="${c.id}" title="Bấm để đổi thanh toán">✅ Đã thu</span>`)
    : '<span class="contact-line">—</span>';

  const packedBadge = c.packed
    ? `<span class="tag tag-packed-done row-action tag-clickable" data-action="toggle-packed" data-id="${c.id}" title="Bấm để đổi đóng hàng">📦 Đã đóng</span>`
    : `<span class="tag tag-packed-pending row-action tag-clickable" data-action="toggle-packed" data-id="${c.id}" title="Bấm để đổi đóng hàng">📦 Chưa đóng</span>`;

  const deliveredBadge = c.delivered
    ? `<span class="tag tag-delivered-done row-action tag-clickable" data-action="toggle-delivered" data-id="${c.id}" title="Bấm để đổi giao hàng">🚚 Đã giao</span>`
    : `<span class="tag tag-delivered-pending row-action tag-clickable" data-action="toggle-delivered" data-id="${c.id}" title="Bấm để đổi giao hàng">🚚 Chưa giao</span>`;

  const comboInfo = c.combo === 'co'
    ? `<div class="contact-line">🎁 ${escapeHtml(combos.find(x=>x.id===c.comboId)?.name || 'Combo đã xóa')}</div>`
    : '';

  const dateLines = [];
  if(c.acquiredDate) dateLines.push(`<div class="contact-line">Tiếp nhận: ${formatDateVN(c.acquiredDate)}</div>`);
  if(c.lastOrderDate) dateLines.push(`<div class="contact-line">Đặt đơn: ${formatDateVN(c.lastOrderDate)}</div>`);
  if(c.deliveryDate){
    const overdue = isPastDate(c.deliveryDate);
    dateLines.push(`<div class="contact-line${overdue?' date-overdue':''}">Giao: ${formatDateVN(c.deliveryDate)}${overdue?' (quá hạn)':''}</div>`);
  }
  if(c.nextContactDate) dateLines.push(`<div class="contact-line">Liên hệ: ${formatDateVN(c.nextContactDate)}</div>`);
  const dateInfo = dateLines.length ? dateLines.join('') : '<span class="contact-line">—</span>';
  const stageToggleLabel = stage === 'cskh' ? '✅ Đã thanh toán' : '🕒 Chuyển công nợ';

  const createdLabel = formatDateTimeVN(c.createdAt);

  const identityCell = compactIdentity
    ? `<div class="contact-line">↳ Đặt lúc: <strong>${createdLabel}</strong></div>`
    : `
      <div class="cust-name">${escapeHtml(c.name)}</div>
      <div class="cust-phone">${escapeHtml(c.phone||'—')}</div>
      <div class="cust-address">${escapeHtml(c.address||'')}</div>
    `;

  return `
  <tr${compactIdentity ? ' class="cust-subrow"' : ''}>
    <td>${identityCell}</td>
    <td style="white-space:nowrap;">
      <span class="tag ${tp.c}">${tp.t}</span>
      <button class="row-action stage-btn" data-action="toggle-payment" data-id="${c.id}" title="${stage === 'cskh' ? 'Bấm để đánh dấu đã thanh toán (tự động chuyển sang mục Khách hàng)' : 'Bấm để chuyển sang mục Danh sách công nợ'}">${stageToggleLabel}</button>
    </td>
    <td style="white-space:nowrap;">${c.staff ? escapeHtml(staffLabel[c.staff]) : '<span class="contact-line">—</span>'}</td>
    <td style="white-space:nowrap;">
      <div style="font-weight:700;color:#0f172a;">${qtyInfo}</div>
      ${comboInfo}
    </td>
    <td style="white-space:nowrap;font-weight:700;color:#0f172a;font-size:13.5px;">${amountInfo}</td>
    <td style="white-space:nowrap;text-align:center;">
      ${paymentBadge}
    </td>
    <td style="white-space:nowrap;text-align:center;">
      <div style="display:inline-flex;gap:6px;align-items:center;justify-content:center;vertical-align:middle;">
        ${packedBadge}
        ${deliveredBadge}
      </div>
    </td>
    <td>${dateInfo}</td>
    <td class="note-cell">${escapeHtml(c.note||'—')}</td>
    <td style="white-space:nowrap;text-align:center;">
      <div style="display:flex;gap:4px;align-items:center;justify-content:center;">
        ${c.price ? `<button class="row-action" data-action="print-invoice" data-id="${c.id}" title="In / Xuất hóa đơn PDF">🧾</button>` : ''}
        <button class="row-action" data-action="edit" data-id="${c.id}" title="Sửa">✏️</button>
        <button class="row-action" data-action="repeat" data-id="${c.id}" title="Khách mua lại — tạo đơn hàng mới, giữ nguyên đơn cũ">🔁</button>
        <button class="row-action" data-action="transfer" data-id="${c.id}" title="Chuyển giao cho nhân viên khác">🔄</button>
        <button class="row-action row-action-delete" data-action="delete" data-id="${c.id}" title="Xóa">🗑️</button>
      </div>
    </td>
  </tr>`;
}

function renderCustomerGroupHeaderRow(orders, stage, groupKey){
  const latest = orders[0]; // đơn mới nhất (đã sort giảm dần theo createdAt)
  const isOpen = expandedCustomerGroups.has(groupKey);
  const totalKg = orders.reduce((s,c)=>s+(Number(c.kg)||0), 0);
  const totalPrice = orders.reduce((s,c)=>s+(Number(c.price)||0), 0);
  const paidCount = orders.filter(c=>c.price && c.paymentStatus !== 'chua_tra').length;
  const debtCount = orders.filter(c=>c.price && c.paymentStatus === 'chua_tra').length;
  const packedCount = orders.filter(c=>c.packed).length;
  const deliveredCount = orders.filter(c=>c.delivered).length;
  const tp = typeLabel[latest.type];

  // Nếu các đơn trong nhóm do NHIỀU nhân viên khác nhau phụ trách, hiển thị rõ tất cả tên
  // (tránh hiểu lầm là khách "chuyển hẳn" sang người mới, mất phần của người cũ)
  const distinctStaff = Array.from(new Set(orders.map(c=>c.staff || '')));
  let staffCellHtml;
  if(distinctStaff.length <= 1){
    staffCellHtml = latest.staff ? escapeHtml(staffLabel[latest.staff]) : '<span class="contact-line">—</span>';
  } else {
    const names = distinctStaff.map(s=> s ? escapeHtml(staffLabel[s]) : 'Chưa phân công').join(', ');
    staffCellHtml = `<span class="tag tag-lead" >👥 ${distinctStaff.length} NV</span><div class="contact-line">${names}</div>`;
  }

  return `
  <tr class="cust-grouprow">
    <td>
      <button class="row-action group-toggle-btn" data-action="toggle-group" data-key="${escapeHtml(groupKey)}" title="${isOpen ? 'Thu gọn' : 'Bấm xem chi tiết ' + orders.length + ' đơn'}">${isOpen ? '▼' : '▶'}</button>
      <div style="display:inline-block;vertical-align:middle;">
        <div class="cust-name">${escapeHtml(latest.name)} <span class="tag tag-vip-group">👑 ${orders.length} đơn</span></div>
        <div class="cust-phone">${escapeHtml(latest.phone||'—')}</div>
        <div class="cust-address">${escapeHtml(latest.address||'')}</div>
      </div>
    </td>
    <td style="white-space:nowrap;"><span class="tag ${tp.c}">${tp.t}</span><div class="contact-line">Đơn gần nhất</div></td>
    <td style="white-space:nowrap;">${staffCellHtml}</td>
    <td style="white-space:nowrap;">Tổng: <strong>${totalKg} kg</strong></td>
    <td style="white-space:nowrap;">Tổng: <strong>${formatVND(totalPrice)}</strong></td>
    <td style="white-space:nowrap;">
      <div class="contact-line">✅ Đã thu: ${paidCount}</div>
      <div class="contact-line">🕒 Công nợ: ${debtCount}</div>
    </td>
    <td style="white-space:nowrap;">
      <div class="contact-line">📦 Đã đóng: ${packedCount}/${orders.length}</div>
      <div class="contact-line">🚚 Đã giao: ${deliveredCount}/${orders.length}</div>
    </td>
    <td class="contact-line">Đơn gần nhất: ${formatDateVN(getOrderDateKey(latest)) || '—'}</td>
    <td class="note-cell">—</td>
    <td style="white-space:nowrap;text-align:center;">
      <button class="row-action" data-action="repeat" data-id="${latest.id}" title="Thêm đơn hàng mới cho khách này">🔁 Mua lại</button>
    </td>
  </tr>`;
}

function renderCustomerList(stage, searchId, typeId, staffId, countId, holderId, paymentId, packedId, deliveredId){
  const search = document.getElementById(searchId)?.value.trim().toLowerCase() || '';
  const filter = typeId ? (document.getElementById(typeId)?.value || '') : '';
  const staffFilter = staffId ? (document.getElementById(staffId)?.value || '') : '';
  const paymentFilter = paymentId ? (document.getElementById(paymentId)?.value || '') : '';
  const packedFilter = packedId ? (document.getElementById(packedId)?.value || '') : '';
  const deliveredFilter = deliveredId ? (document.getElementById(deliveredId)?.value || '') : '';

  // Lọc ngày tháng năm cho mục Danh sách công nợ (cskh)
  const fromDate = stage === 'cskh' ? (document.getElementById('cskhFromDate')?.value || '') : '';
  const toDate = stage === 'cskh' ? (document.getElementById('cskhToDate')?.value || '') : '';

  let list = customers.filter(c=>{
    // Phân loại mục Khách hàng và Danh sách công nợ theo trạng thái thanh toán:
    // Tab "order" (Khách hàng): Chỉ hiển thị khách đã thanh toán (paymentStatus !== 'chua_tra')
    // Tab "cskh" (Danh sách công nợ): Chỉ hiển thị khách hàng chưa thanh toán (paymentStatus === 'chua_tra')
    if(stage === 'order' && c.paymentStatus === 'chua_tra') return false;
    if(stage === 'cskh' && c.paymentStatus !== 'chua_tra') return false;

    const matchSearch = !search || c.name.toLowerCase().includes(search) || c.phone.includes(search);
    const matchFilter = !filter || c.type === filter;
    const matchStaff = !staffFilter || (staffFilter === 'none' ? !c.staff : c.staff === staffFilter);
    const matchPayment = !paymentFilter || c.paymentStatus === paymentFilter;
    const matchPacked = !packedFilter || (packedFilter === 'da' ? !!c.packed : !c.packed);
    const matchDelivered = !deliveredFilter || (deliveredFilter === 'da' ? !!c.delivered : !c.delivered);

    let matchDate = true;
    if(stage === 'cskh' && (fromDate || toDate)){
      const dateKey = getOrderDateKey(c);
      const matchFrom = !fromDate || dateKey >= fromDate;
      const matchTo = !toDate || dateKey <= toDate;
      matchDate = matchFrom && matchTo;
    }

    return matchSearch && matchFilter && matchStaff && matchPayment && matchPacked && matchDelivered && matchDate;
  });

  const unitLabel = stage === 'cskh' ? 'khách nợ' : 'khách hàng';
  const holder = document.getElementById(holderId);

  if(list.length === 0){
    document.getElementById(countId).textContent = `0 ${unitLabel}`;
    holder.innerHTML = `<div class="empty">${stage === 'cskh' ? 'Không có khách hàng nào đang có công nợ.' : 'Chưa có khách hàng nào khớp bộ lọc.'}</div>`;
    return;
  }

  // Gộp các đơn của cùng 1 khách lại thành 1 nhóm, đơn mới nhất lên đầu
  const groupsMap = new Map();
  list.forEach(c=>{
    const key = stage+'::'+customerGroupKey(c);
    if(!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key).push(c);
  });
  const groups = Array.from(groupsMap.entries()).map(([key, orders])=>{
    orders.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    return { key, orders };
  }).sort((ga,gb)=>(gb.orders[0].createdAt||0)-(ga.orders[0].createdAt||0));

  const groupCount = groups.length;
  const totalPages = Math.max(1, Math.ceil(groupCount / PAGE_SIZE));
  if (!paginationState[stage] || paginationState[stage] > totalPages) {
    paginationState[stage] = 1;
  }
  const curPage = paginationState[stage];
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pagedGroups = groups.slice(startIdx, startIdx + PAGE_SIZE);

  if(stage === 'cskh'){
    const totalDebtAmount = list.reduce((s, c) => s + (Number(c.price) || 0), 0);
    document.getElementById(countId).innerHTML = groupCount !== list.length
      ? `<strong>${list.length} đơn nợ</strong> — ${groupCount} khách &nbsp;•&nbsp; <span style="color:#dc2626;font-weight:700;">Tổng công nợ: ${formatVND(totalDebtAmount)}</span>`
      : `<strong>${list.length} ${unitLabel}</strong> &nbsp;•&nbsp; <span style="color:#dc2626;font-weight:700;">Tổng công nợ: ${formatVND(totalDebtAmount)}</span>`;
  } else {
    document.getElementById(countId).textContent = groupCount !== list.length
      ? `${list.length} ${unitLabel} — ${groupCount} khách`
      : `${list.length} ${unitLabel}`;
  }

  const rowsHtml = pagedGroups.map(({key, orders})=>{
    if(orders.length === 1) return renderCustomerRow(orders[0], stage, false);
    const headerRow = renderCustomerGroupHeaderRow(orders, stage, key);
    if(!expandedCustomerGroups.has(key)) return headerRow;
    const subRows = orders.map(c=>renderCustomerRow(c, stage, true)).join('');
    return headerRow + subRows;
  }).join('');

  const paginationHtml = renderPaginationBar(stage, groupCount, curPage, PAGE_SIZE);

  holder.innerHTML = `
    <table>
      <thead><tr>
        <th>Khách hàng</th><th>Phân loại</th><th>Phụ trách</th><th>Số lượng</th><th>Số tiền</th><th style="text-align:center;">Trạng thái</th><th style="text-align:center;">Đóng hàng / Giao hàng</th><th>Mốc thời gian</th><th>Ghi chú</th><th style="text-align:center;">Thao tác</th>
      </tr></thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    ${paginationHtml}
  `;
  attachPaginationEvents(holder, stage, (newPage) => {
    paginationState[stage] = newPage;
    renderCustomerList(stage, searchId, typeId, staffId, countId, holderId, paymentId, packedId, deliveredId);
    holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.dataset.action === 'toggle-group'){ toggleCustomerGroup(btn.dataset.key); return; }
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'edit') startEditCustomer(id);
      else if(btn.dataset.action === 'repeat') startRepeatOrder(id);
      else if(btn.dataset.action === 'print-invoice') { const c = customers.find(x=>x.id===id); if(c) showInvoiceModal(c); }
      else if(btn.dataset.action === 'transfer') openTransferModal(id);
      else if(btn.dataset.action === 'toggle-payment') togglePaymentStatus(id);
      else if(btn.dataset.action === 'toggle-packed') togglePackedStatus(id);
      else if(btn.dataset.action === 'toggle-delivered') toggleDeliveredStatus(id);
      else if(btn.dataset.action === 'toggle-stage') toggleCustomerStage(id);
      else deleteCustomer(id);
    });
  });
}

function renderCashflow(){
  if(!document.getElementById('cfRevenue')) return;

  const revenueEntries = customers
    .filter(c=>c.price && c.paymentStatus !== 'chua_tra')
    .map(c=>({
      id: 'cust-'+c.id, kind:'revenue', name: c.name, amount: c.price,
      date: c.lastOrderDate || c.acquiredDate || '', note: c.kg ? `${c.kg} kg — đã thu` : 'đã thu'
    }));
  const debtEntries = customers
    .filter(c=>c.price && c.paymentStatus === 'chua_tra')
    .map(c=>({
      id: 'debt-'+c.id, kind:'debt', name: c.name, amount: c.price,
      date: c.lastOrderDate || c.acquiredDate || '', note: c.kg ? `${c.kg} kg — công nợ` : 'công nợ', custId: c.id
    }));
  const expenseEntries = expenses.map(e=>({
    id: e.id, kind: e.type, name: e.name, amount: e.amount, date: e.date, note: e.note, autoStock: !!e.autoStock
  }));

  const totalRevenue = revenueEntries.reduce((s,e)=>s+e.amount,0);
  const totalDebt = debtEntries.reduce((s,e)=>s+e.amount,0);
  const totalExpense = expenses.filter(e=>e.type==='chi_phi').reduce((s,e)=>s+e.amount,0);
  const totalCapital = expenses.filter(e=>e.type==='von').reduce((s,e)=>s+e.amount,0);
  const totalRefund = expenses.filter(e=>e.type==='hoan_von').reduce((s,e)=>s+e.amount,0);
  const capitalOutstanding = totalCapital - totalRefund; // Vốn Đang Treo: phần vốn 4 người ứng ra mà công ty chưa hoàn lại
  // Lời/Lỗ không trừ "Hoàn vốn" vì đây chỉ là chuyển tiền trả lại người góp, không phải chi phí kinh doanh mới
  const profit = totalRevenue - totalExpense - totalCapital;

  document.getElementById('cfRevenue').textContent = formatVND(totalRevenue);
  document.getElementById('cfExpense').textContent = formatVND(totalExpense);
  document.getElementById('cfCapital').textContent = formatVND(capitalOutstanding);
  document.getElementById('cfCapitalDetail').textContent = `Đã bỏ ra: ${formatVND(totalCapital)} · Đã hoàn: ${formatVND(totalRefund)}`;
  document.getElementById('cfDebt').textContent = formatVND(totalDebt);
  const profitEl = document.getElementById('cfProfit');
  profitEl.textContent = (profit<0?'-':'') + formatVND(Math.abs(profit));
  profitEl.classList.remove('positive','negative');
  profitEl.classList.add(profit>=0?'positive':'negative');

  const allEntries = [...revenueEntries, ...debtEntries, ...expenseEntries].sort((a,b)=>{
    if(!a.date) return 1;
    if(!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  const search = document.getElementById('cfSearch').value.trim().toLowerCase();
  const kindFilter = document.getElementById('cfFilterKind').value;
  const fromDate = document.getElementById('cfFilterFrom').value;
  const toDate = document.getElementById('cfFilterTo').value;

  const filteredEntries = allEntries.filter(e=>{
    const matchSearch = !search || e.name.toLowerCase().includes(search) || (e.note||'').toLowerCase().includes(search);
    const matchKind = !kindFilter || e.kind === kindFilter;
    const matchFrom = !fromDate || (e.date && e.date >= fromDate);
    const matchTo = !toDate || (e.date && e.date <= toDate);
    return matchSearch && matchKind && matchFrom && matchTo;
  });

  // Tính toán số liệu theo bộ lọc cho 2 ô: Tổng doanh thu và Tổng chi phí & vốn
  const filteredRevEntries = filteredEntries.filter(e=>e.kind==='revenue');
  const filteredRevTotal = filteredRevEntries.reduce((s,e)=>s+e.amount,0);

  const filteredDebtEntries = filteredEntries.filter(e=>e.kind==='debt');
  const filteredDebtTotal = filteredDebtEntries.reduce((s,e)=>s+e.amount,0);

  const filteredExpEntries = filteredEntries.filter(e=>e.kind==='chi_phi');
  const filteredCapEntries = filteredEntries.filter(e=>e.kind==='von');
  const filteredRefEntries = filteredEntries.filter(e=>e.kind==='hoan_von');

  const filteredExpTotal = filteredExpEntries.reduce((s,e)=>s+e.amount,0);
  const filteredCapTotal = filteredCapEntries.reduce((s,e)=>s+e.amount,0);
  const filteredRefTotal = filteredRefEntries.reduce((s,e)=>s+e.amount,0);
  const filteredCostTotal = filteredExpTotal + filteredCapTotal - filteredRefTotal;

  // Cập nhật 3 ô thống kê theo bộ lọc: Doanh thu, Chi phí, Vốn
  const cfFilteredRevEl = document.getElementById('cfFilteredRevenue');
  if(cfFilteredRevEl){
    cfFilteredRevEl.textContent = formatVND(filteredRevTotal);
    const revBadgeEl = document.getElementById('cfFilteredRevBadge');
    if(revBadgeEl) revBadgeEl.textContent = `${filteredRevEntries.length} khoản đã thu`;
    const revDetailEl = document.getElementById('cfFilteredRevenueDetail');
    if(revDetailEl){
      if(filteredDebtTotal > 0){
        revDetailEl.textContent = `Đã thu: ${formatVND(filteredRevTotal)} · Công nợ: ${formatVND(filteredDebtTotal)} (${filteredDebtEntries.length} đơn)`;
      } else {
        revDetailEl.textContent = `Tổng doanh thu khách hàng đã thanh toán`;
      }
    }
  }

  const cfFilteredExpEl = document.getElementById('cfFilteredExpense');
  if(cfFilteredExpEl){
    cfFilteredExpEl.textContent = formatVND(filteredExpTotal);
    const expBadgeEl = document.getElementById('cfFilteredExpBadge');
    if(expBadgeEl) expBadgeEl.textContent = `${filteredExpEntries.length} khoản chi`;
    const expDetailEl = document.getElementById('cfFilteredExpenseDetail');
    if(expDetailEl){
      expDetailEl.textContent = `Chi phí bán hàng trong kỳ lọc`;
    }
  }

  const cfFilteredCapEl = document.getElementById('cfFilteredCapital');
  if(cfFilteredCapEl){
    const netCapital = filteredCapTotal - filteredRefTotal;
    cfFilteredCapEl.textContent = (netCapital < 0 ? '-' : '') + formatVND(Math.abs(netCapital));
    const capBadgeEl = document.getElementById('cfFilteredCapBadge');
    const capCount = filteredCapEntries.length + filteredRefEntries.length;
    if(capBadgeEl) capBadgeEl.textContent = `${capCount} khoản vốn`;
    const capDetailEl = document.getElementById('cfFilteredCapitalDetail');
    if(capDetailEl){
      if(filteredRefTotal > 0){
        capDetailEl.textContent = `Đã bỏ ra: ${formatVND(filteredCapTotal)} · Đã hoàn: ${formatVND(filteredRefTotal)}`;
      } else {
        capDetailEl.textContent = `Số vốn đã xuất ra trong kỳ lọc`;
      }
    }
  }

  const clearFilterBtn = document.getElementById('cfClearFilterBtn');
  if(clearFilterBtn){
    clearFilterBtn.style.display = (fromDate || toDate) ? 'inline-block' : 'none';
  }

  const netDiff = filteredRevTotal - filteredCostTotal;
  const netDiffSign = netDiff >= 0 ? '+' : '-';
  const netDiffColor = netDiff >= 0 ? '#15803d' : '#dc2626';

  let dateNote = '';
  if(fromDate && toDate && fromDate === toDate){
    dateNote = ` (Ngày ${formatDateVN(fromDate)})`;
  } else if(fromDate || toDate){
    dateNote = ` (${fromDate ? 'Từ ' + formatDateVN(fromDate) : ''}${toDate ? ' đến ' + formatDateVN(toDate) : ''})`;
  }

  const cfCountEl = document.getElementById('cfCount');
  if(cfCountEl){
    cfCountEl.innerHTML = `
      <span>${filteredEntries.length} / ${allEntries.length} khoản mục (${filteredRevEntries.length} đã thu${filteredDebtEntries.length ? `, ${filteredDebtEntries.length} công nợ` : ''}, ${filteredExpEntries.length} chi phí, ${filteredCapEntries.length + filteredRefEntries.length} vốn)${dateNote}</span>
      <span style="margin-left:14px;color:${netDiffColor};font-weight:700;">Chênh lệch thu − (chi + vốn): ${netDiffSign}${formatVND(Math.abs(netDiff))}</span>
    `;
  }

  const holder = document.getElementById('cashflowTableHolder');
  if(filteredEntries.length === 0){
    holder.innerHTML = `<div class="empty">Không có khoản mục nào khớp bộ lọc.</div>`;
    return;
  }

  const kindMeta = {
    revenue: {t:'Đã thu', c:'tag-revenue'},
    debt: {t:'Công nợ', c:'tag-debt'},
    chi_phi: {t:'Chi phí bán hàng', c:'tag-expense'},
    von: {t:'Vốn', c:'tag-capital'},
    hoan_von: {t:'Hoàn vốn', c:'tag-refund'},
  };

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  if (!paginationState.cashflow || paginationState.cashflow > totalPages) {
    paginationState.cashflow = 1;
  }
  const curPage = paginationState.cashflow;
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pagedEntries = filteredEntries.slice(startIdx, startIdx + PAGE_SIZE);

  holder.innerHTML = `
    <table>
      <thead>
        <tr>
          <th style="text-align:center;width:120px;">Loại</th>
          <th>Nội dung</th>
          <th style="text-align:right;width:150px;">Số tiền</th>
          <th style="text-align:center;width:115px;">Ngày</th>
          <th>Ghi chú</th>
          <th style="text-align:center;width:110px;">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${pagedEntries.map(e=>{
          const km = kindMeta[e.kind];
          const isPositive = (e.kind === 'revenue' || e.kind === 'debt');
          const sign = isPositive ? '+' : '-';
          const amountColor = isPositive ? '#15803d' : '#dc2626';
          const amountBg = isPositive ? '#dcfce7' : '#fef2f2';
          const isExpenseEditable = (e.kind === 'chi_phi' || e.kind === 'von' || e.kind === 'hoan_von') && !e.autoStock;
          return `<tr>
            <td style="text-align:center;white-space:nowrap;"><span class="tag ${km.c}">${km.t}</span></td>
            <td>
              <div style="font-weight:700;color:#0f172a;font-size:13.5px;">${escapeHtml(e.name)}</div>
            </td>
            <td style="white-space:nowrap;text-align:right;">
              <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-weight:800;font-size:13.5px;color:${amountColor};background:${amountBg};font-variant-numeric:tabular-nums;">
                ${sign}${formatVND(e.amount)}
              </span>
            </td>
            <td style="white-space:nowrap;text-align:center;color:#475569;font-weight:600;font-size:13px;">${e.date ? formatDateVN(e.date) : '<span style="color:#94a3b8;">—</span>'}</td>
            <td class="note-cell" style="color:#64748b;font-size:12.5px;">${e.note ? escapeHtml(e.note) : '<span style="color:#cbd5e1;">—</span>'}</td>
            <td style="text-align:center;white-space:nowrap;">
              ${isExpenseEditable ? `
                <div style="display:inline-flex;gap:4px;align-items:center;justify-content:center;">
                  <button class="row-action" data-action="edit" data-id="${e.id}" title="Sửa" style="width:28px;height:28px;padding:0;border-radius:6px;">✏️</button>
                  <button class="row-action row-action-delete" data-action="delete" data-id="${e.id}" title="Xóa" style="width:28px;height:28px;padding:0;border-radius:6px;">🗑️</button>
                </div>
              ` : e.kind === 'debt' ? `
                <button class="row-action" data-action="mark-paid" data-id="${e.custId}" title="Đánh dấu đã thu tiền" style="background:#dcfce7;color:#15803d;border:1.5px solid #22c55e;font-weight:700;font-size:11.5px;padding:3px 8px;border-radius:6px;cursor:pointer;">✅ Đã thu</button>
              ` : e.autoStock ? `
                <span class="tag" style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;font-size:11px;padding:2px 8px;border-radius:6px;" title="Sửa/xóa tại tab Kho hàng">🔒 Kho hàng</span>
              ` : `<span class="contact-line" style="color:#94a3b8;font-size:11.5px;">tự động</span>`}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${renderPaginationBar('cashflow', filteredEntries.length, curPage, PAGE_SIZE)}
  `;
  attachPaginationEvents(holder, 'cashflow', (newPage) => {
    paginationState.cashflow = newPage;
    renderCashflow();
    holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'edit') startEditExpense(id);
      else if(btn.dataset.action === 'delete') deleteExpense(id);
      else if(btn.dataset.action === 'mark-paid') markCustomerPaid(id);
    });
  });
}

async function markCustomerPaid(custId){
  try{ await CrmApi.customers.togglePayment(custId); await loadAllData(); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); }
}

function setExpenseType(type){
  currentExpenseType = type;
  document.getElementById('cfType').value = type;
  document.getElementById('cfTypeExpenseBtn').classList.toggle('active', type==='chi_phi');
  document.getElementById('cfTypeCapitalBtn').classList.toggle('active', type==='von');
  document.getElementById('cfTypeRefundBtn').classList.toggle('active', type==='hoan_von');
}

function openExpenseModal(){
  document.getElementById('expenseModalOverlay').classList.add('active');
}
function closeExpenseModal(){
  document.getElementById('expenseModalOverlay').classList.remove('active');
}

function startEditExpense(id){
  const e = expenses.find(x=>x.id===id);
  if(!e) return;
  if(e.autoStock){ appAlert('Khoản này được tự động tạo từ phiếu nhập kho. Vui lòng sửa tại tab Kho hàng để số liệu luôn khớp nhau.', {type:'info', title:'Không thể sửa'}); return; }
  editingExpenseId = id;
  openExpenseModal();
  setExpenseType(e.type);
  document.getElementById('cfName').value = e.name;
  document.getElementById('cfAmount').value = e.amount ? e.amount/1000 : '';
  document.getElementById('cfDate').value = e.date || '';
  document.getElementById('cfNote').value = e.note || '';
  document.getElementById('cfFormTitle').textContent = '✏️ Sửa khoản mục';
  document.getElementById('addExpenseBtn').textContent = 'Lưu thay đổi';
  document.getElementById('cancelExpenseEditBtn').style.display = 'block';
  document.getElementById('cfName').focus();
}

function resetExpenseForm(){
  editingExpenseId = null;
  setExpenseType('chi_phi');
  document.getElementById('cfName').value = '';
  document.getElementById('cfAmount').value = '';
  document.getElementById('cfDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('cfNote').value = '';
  document.getElementById('cfFormTitle').textContent = '💸 Thêm khoản chi phí / vốn';
  document.getElementById('addExpenseBtn').textContent = 'Lưu khoản mục';
  document.getElementById('cancelExpenseEditBtn').style.display = 'none';
}

async function deleteExpense(id){
  const e = expenses.find(x=>x.id===id);
  if(!e) return;
  if(e.autoStock){ appAlert('Khoản này được tự động tạo từ phiếu nhập kho. Vui lòng xóa phiếu kho tương ứng tại tab Kho hàng để số liệu luôn khớp nhau.', {type:'info', title:'Không thể xóa'}); return; }
  const ok = await appConfirm(`Xóa khoản mục "${e.name}"?`, {type:'danger', title:'⚠️ Xóa khoản mục'});
  if(!ok) return;
  try{ await CrmApi.expenses.remove(id); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); return; }
  if(editingExpenseId === id) resetExpenseForm();
  await loadAllData();
}

/* ===== Kho hàng ===== */

function populateProductSelects(){
  const whProduct = document.getElementById('whProduct');
  if(whProduct){
    const current = whProduct.value;
    whProduct.innerHTML = `<option value="">— Chọn sản phẩm —</option>` +
      products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.unit)})</option>`).join('');
    whProduct.value = current;
  }
  const whFilterProduct = document.getElementById('whFilterProduct');
  if(whFilterProduct){
    const current = whFilterProduct.value;
    whFilterProduct.innerHTML = `<option value="">Tất cả sản phẩm</option>` +
      products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    whFilterProduct.value = current;
  }
  populateComboProductSelect();
  const cProduct = document.getElementById('cProduct');
  if(cProduct){
    const current = cProduct.value;
    cProduct.innerHTML = `<option value="">— Không trừ kho —</option>` +
      products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.unit)})</option>`).join('');
    cProduct.value = current;
  }
}

function getProductStock(productId){
  return stockEntries.filter(s=>s.productId===productId).reduce((sum,s)=>{
    return sum + (s.type === 'nhap' ? s.qty : -s.qty);
  }, 0);
}

// Tồn kho hiện tại của 1 sản phẩm, KHÔNG tính phiếu kho có id = excludeEntryId
// (dùng khi đang sửa khách hàng, để không tự trừ nhầm phiếu xuất cũ của chính khách đó)
function getProductStockExcluding(productId, excludeEntryId){
  return stockEntries.filter(s=>s.productId===productId && s.id!==excludeEntryId).reduce((sum,s)=>{
    return sum + (s.type === 'nhap' ? s.qty : -s.qty);
  }, 0);
}

// Kiểm tra tồn kho trước khi xuất bán cho khách. Nếu không đủ hàng, hỏi xác nhận;
// bấm OK thì vẫn cho lưu (kho sẽ bị âm), bấm Hủy thì dừng lại không lưu đơn.
async function confirmStockAvailability(productId, qty, excludeEntryId){
  productId = productId ? Number(productId) : null;
  qty = Number(qty) || 0;
  if(!productId || qty <= 0) return true;
  const p = products.find(x=>x.id===productId);
  if(!p) return true;
  const available = getProductStockExcluding(productId, excludeEntryId);
  if(available < qty){
    const afterMsg = available <= 0
      ? `Kho hàng sản phẩm "${p.name}" hiện đã hết (tồn kho: ${formatKg(available, p.unit)}).`
      : `Kho hàng sản phẩm "${p.name}" không đủ (tồn kho: ${formatKg(available, p.unit)}, cần xuất: ${formatKg(qty, p.unit)}).`;
    return await appConfirm(
      `${afterMsg}\n\nNếu bấm "Vẫn lưu đơn", đơn hàng vẫn được lưu và kho sẽ bị ÂM (${formatKg(available - qty, p.unit)}).\nBấm "Hủy" để dừng lại và không lưu đơn.`,
      {type:'warning', title:'⚠️ Không đủ hàng trong kho', okText:'Vẫn lưu đơn', cancelText:'Hủy'}
    );
  }
  return true;
}

function getLastImportUnitPrice(productId){
  const nhapEntries = stockEntries.filter(s=>s.productId===productId && s.type==='nhap' && s.qty>0 && s.unitPrice>0);
  if(nhapEntries.length === 0) return 0;
  const sorted = [...nhapEntries].sort((a,b)=>(a.date||'').localeCompare(b.date||'') || a.id-b.id);
  const last = sorted[sorted.length-1];
  return last.unitPrice / last.qty;
}

function renderWarehouse(){
  renderProducts();
  renderStockLedger();
  renderWarehouseStats();
}

function renderWarehouseStats(){
  if(!document.getElementById('whStatProducts')) return;
  document.getElementById('whStatProducts').textContent = products.length;
  const totalStock = products.reduce((s,p)=>s+getProductStock(p.id), 0);
  document.getElementById('whStatStock').textContent = totalStock.toLocaleString('vi-VN');
  const lowStockCount = products.filter(p=>getProductStock(p.id) < p.minStock).length;
  document.getElementById('whStatLow').textContent = lowStockCount;
  const totalValue = products.reduce((s,p)=>s + getProductStock(p.id) * getLastImportUnitPrice(p.id), 0);
  document.getElementById('whStatValue').textContent = formatVND(totalValue);
}

function renderProducts(){
  const holder = document.getElementById('productTableHolder');
  if(!holder) return;
  document.getElementById('productCount').textContent = `${products.length} sản phẩm`;
  if(products.length === 0){
    holder.innerHTML = `<div class="empty">Chưa có sản phẩm nào. Thêm sản phẩm đầu tiên bên trái.</div>`;
    return;
  }
  holder.innerHTML = `
    <table>
      <thead><tr><th>Sản phẩm</th><th>Đơn vị</th><th>Tồn kho</th><th>Tồn tối thiểu</th><th>Giá nhập gần nhất</th><th>Giá bán</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
      <tbody>
        ${products.map(p=>{
          const stock = getProductStock(p.id);
          const isLow = stock < p.minStock;
          const lastPrice = getLastImportUnitPrice(p.id);
          return `<tr>
            <td class="combo-row-name">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.unit)}</td>
            <td class="${isLow?'stock-low':''}">${stock.toLocaleString('vi-VN')} ${escapeHtml(p.unit)}${isLow?' ⚠️':''}</td>
            <td>${p.minStock.toLocaleString('vi-VN')} ${escapeHtml(p.unit)}</td>
            <td>${lastPrice ? formatVND(lastPrice)+'/'+escapeHtml(p.unit) : '—'}</td>
            <td><b>${p.sellPrice ? formatVND(p.sellPrice)+'/'+escapeHtml(p.unit) : '—'}</b></td>
            <td class="note-cell">${escapeHtml(p.note||'—')}</td>
            <td style="white-space:nowrap;">
              <button class="row-action" data-action="edit" data-id="${p.id}" title="Sửa">✏️</button>
              <button class="row-action" data-action="delete" data-id="${p.id}" title="Xóa">🗑️</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'edit') startEditProduct(id);
      else deleteProduct(id);
    });
  });
}

function openProductModal(){
  document.getElementById('productModalOverlay').classList.add('active');
}
function closeProductModal(){
  document.getElementById('productModalOverlay').classList.remove('active');
  resetProductForm();
}

function startEditProduct(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  editingProductId = id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pUnit').value = p.unit;
  document.getElementById('pMinStock').value = p.minStock || '';
  document.getElementById('pSellPrice').value = p.sellPrice ? p.sellPrice/1000 : '';
  document.getElementById('pNote').value = p.note || '';
  updatePSellPriceSuffix();
  document.getElementById('productFormTitle').textContent = '✏️ Sửa sản phẩm';
  document.getElementById('addProductBtn').textContent = 'Lưu thay đổi';
  openProductModal();
  document.getElementById('pName').focus();
}

function resetProductForm(){
  editingProductId = null;
  document.getElementById('pName').value = '';
  document.getElementById('pUnit').value = 'kg';
  document.getElementById('pMinStock').value = '';
  document.getElementById('pSellPrice').value = '';
  document.getElementById('pNote').value = '';
  updatePSellPriceSuffix();
  document.getElementById('productFormTitle').textContent = '🧺 Thêm sản phẩm';
  document.getElementById('addProductBtn').textContent = 'Lưu sản phẩm';
}

function updatePSellPriceSuffix(){
  const unit = document.getElementById('pUnit').value;
  document.getElementById('pSellPriceSuffix').textContent = `.000 đ/${unit}`;
}

async function deleteProduct(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const linkedEntries = stockEntries.filter(s=>s.productId===id);
  const linked = linkedEntries.length;
  const linkedCombos = combos.filter(c=>c.productId===id || c.giftProductId===id).length;
  const msgParts = [];
  if(linked>0) msgParts.push(`${linked} phiếu nhập/xuất kho (sẽ bị xóa luôn, kèm các khoản Vốn tương ứng bên Dòng tiền nếu có)`);
  if(linkedCombos>0) msgParts.push(`${linkedCombos} combo đang dùng sản phẩm này (combo sẽ mất liên kết sản phẩm, có thể tính giá/trừ kho sai)`);
  const msg = msgParts.length>0
    ? `Sản phẩm "${p.name}" đang gắn với ${msgParts.join(' và ')}. Vẫn xóa?`
    : `Xóa sản phẩm "${p.name}"?`;
  const ok = await appConfirm(msg, {type:'danger', title:'⚠️ Xóa sản phẩm'});
  if(!ok) return;
  try{ await CrmApi.products.remove(id); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); return; }
  if(editingProductId === id) resetProductForm();
  await loadAllData();
}

function setStockType(type){
  currentStockType = type;
  document.getElementById('whType').value = type;
  document.getElementById('whTypeNhapBtn').classList.toggle('active', type==='nhap');
  document.getElementById('whTypeXuatBtn').classList.toggle('active', type==='xuat');
  document.getElementById('whPriceLabel').textContent = type==='nhap' ? 'Tổng giá trị nhập' : 'Tổng giá trị xuất (không bắt buộc)';
  document.getElementById('whSupplierWrap').style.display = type==='nhap' ? 'block' : 'none';
}

function renderStockLedger(){
  const holder = document.getElementById('stockTableHolder');
  if(!holder) return;

  const search = document.getElementById('whSearch').value.trim().toLowerCase();
  const typeFilter = document.getElementById('whFilterType').value;
  const productFilter = document.getElementById('whFilterProduct').value;
  const fromDate = document.getElementById('whFilterFrom').value;
  const toDate = document.getElementById('whFilterTo').value;

  let list = stockEntries.filter(s=>{
    const p = products.find(x=>x.id===s.productId);
    const pname = p ? p.name.toLowerCase() : '';
    const matchSearch = !search || pname.includes(search) || (s.note||'').toLowerCase().includes(search) || (s.supplier||'').toLowerCase().includes(search);
    const matchType = !typeFilter || s.type === typeFilter;
    const matchProduct = !productFilter || s.productId === Number(productFilter);
    const matchFrom = !fromDate || (s.date && s.date >= fromDate);
    const matchTo = !toDate || (s.date && s.date <= toDate);
    return matchSearch && matchType && matchProduct && matchFrom && matchTo;
  }).sort((a,b)=>{
    if(!a.date) return 1;
    if(!b.date) return -1;
    return b.date.localeCompare(a.date) || b.id-a.id;
  });

  document.getElementById('whCount').textContent = `${list.length} / ${stockEntries.length} phiếu kho`;

  if(list.length === 0){
    holder.innerHTML = `<div class="empty">Không có phiếu kho nào khớp bộ lọc.</div>`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (!paginationState.stock || paginationState.stock > totalPages) {
    paginationState.stock = 1;
  }
  const curPage = paginationState.stock;
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pagedStock = list.slice(startIdx, startIdx + PAGE_SIZE);

  holder.innerHTML = `
    <table>
      <thead><tr><th>Loại</th><th>Sản phẩm</th><th>Số lượng</th><th>Thành tiền</th><th>Ngày</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
      <tbody>
        ${pagedStock.map(s=>{
          const p = products.find(x=>x.id===s.productId);
          const pname = p ? p.name : 'Sản phẩm đã xóa';
          const unit = p ? p.unit : '';
          const noteParts = [s.supplier, s.note].filter(Boolean);
          return `<tr>
            <td><span class="tag ${s.type==='nhap'?'tag-stock-in':'tag-stock-out'}">${s.type==='nhap'?'📥 Nhập kho':'📤 Xuất kho'}</span></td>
            <td>${escapeHtml(pname)}</td>
            <td style="white-space:nowrap;">${s.qty.toLocaleString('vi-VN')} ${escapeHtml(unit)}</td>
            <td style="white-space:nowrap;">${s.unitPrice ? formatVND(s.unitPrice) : '—'}</td>
            <td>${s.date ? formatDateVN(s.date) : '—'}</td>
            <td class="note-cell">${escapeHtml(noteParts.join(' — ') || '—')}</td>
            <td style="white-space:nowrap;">
              <button class="row-action" data-action="edit" data-id="${s.id}" title="Sửa">✏️</button>
              <button class="row-action" data-action="delete" data-id="${s.id}" title="Xóa">🗑️</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${renderPaginationBar('stock', list.length, curPage, PAGE_SIZE)}
  `;
  attachPaginationEvents(holder, 'stock', (newPage) => {
    paginationState.stock = newPage;
    renderStockLedger();
    holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'edit') startEditStockEntry(id);
      else deleteStockEntry(id);
    });
  });
}

function openStockModal(){
  document.getElementById('stockModalOverlay').classList.add('active');
}
function closeStockModal(){
  document.getElementById('stockModalOverlay').classList.remove('active');
  resetStockEntryForm();
}

function startEditStockEntry(id){
  const s = stockEntries.find(x=>x.id===id);
  if(!s) return;
  editingStockId = id;
  populateProductSelects();
  setStockType(s.type);
  document.getElementById('whProduct').value = s.productId;
  document.getElementById('whQty').value = s.qty || '';
  document.getElementById('whPrice').value = s.unitPrice ? s.unitPrice/1000 : '';
  document.getElementById('whSupplier').value = s.supplier || '';
  document.getElementById('whDate').value = s.date || '';
  document.getElementById('whNote').value = s.note || '';
  document.getElementById('whEntryFormTitle').textContent = '✏️ Sửa phiếu kho';
  document.getElementById('addStockEntryBtn').textContent = 'Lưu thay đổi';
  openStockModal();
  document.getElementById('whProduct').focus();
}

function resetStockEntryForm(){
  editingStockId = null;
  populateProductSelects();
  setStockType('nhap');
  document.getElementById('whProduct').value = '';
  document.getElementById('whQty').value = '';
  document.getElementById('whPrice').value = '';
  document.getElementById('whSupplier').value = '';
  document.getElementById('whDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('whNote').value = '';
  document.getElementById('whEntryFormTitle').textContent = '📥 Nhập / xuất kho';
  document.getElementById('addStockEntryBtn').textContent = 'Lưu phiếu';
}

async function deleteStockEntry(id){
  const s = stockEntries.find(x=>x.id===id);
  if(!s) return;
  const linkedCustomer = customers.find(cu=>cu.stockEntryId===id || cu.giftStockEntryId===id);
  const msg = linkedCustomer
    ? `Phiếu ${s.type==='nhap'?'nhập':'xuất'} kho này đang gắn với đơn hàng của khách "${linkedCustomer.name}". Xóa phiếu sẽ KHÔNG xóa đơn hàng của khách, chỉ làm mất phần trừ kho tương ứng (kho sẽ hiện dư nhiều hơn thực tế cho tới khi bạn sửa lại đơn hàng đó). Vẫn xóa?`
    : `Xóa phiếu ${s.type==='nhap'?'nhập':'xuất'} kho này?`;
  const ok = await appConfirm(msg, {type:'danger', title:'⚠️ Xóa phiếu kho'});
  if(!ok) return;
  try{ await CrmApi.stockEntries.remove(id); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); return; }
  if(editingStockId === id) resetStockEntryForm();
  await loadAllData();
}

/* ===== Xuất Excel ===== */

function downloadWorkbook(wb, filename){
  if(typeof XLSX === 'undefined'){
    appAlert('Không tải được thư viện xuất Excel. Vui lòng kiểm tra kết nối mạng và thử lại.', {type:'danger', title:'Lỗi xuất Excel'});
    return;
  }
  XLSX.writeFile(wb, filename);
}

function exportCashflowExcel(){
  const search = document.getElementById('cfSearch').value.trim().toLowerCase();
  const kindFilter = document.getElementById('cfFilterKind').value;
  const fromDate = document.getElementById('cfFilterFrom').value;
  const toDate = document.getElementById('cfFilterTo').value;

  const revenueEntries = customers
    .filter(c=>c.price && c.paymentStatus !== 'chua_tra')
    .map(c=>({ kind:'Đã thu', name: c.name, amount: c.price, date: c.lastOrderDate || c.acquiredDate || '', note: c.kg ? `${c.kg} kg — đã thu` : 'đã thu' }));
  const debtEntries = customers
    .filter(c=>c.price && c.paymentStatus === 'chua_tra')
    .map(c=>({ kind:'Công nợ', name: c.name, amount: c.price, date: c.lastOrderDate || c.acquiredDate || '', note: c.kg ? `${c.kg} kg — công nợ` : 'công nợ' }));
  const expenseEntries = expenses.map(e=>({
    kind: e.type==='chi_phi' ? 'Chi phí bán hàng' : (e.type==='hoan_von' ? 'Hoàn vốn' : 'Vốn'), name: e.name, amount: e.amount, date: e.date, note: e.note
  }));
  const kindRaw = { 'Đã thu':'revenue', 'Công nợ':'debt', 'Chi phí bán hàng':'chi_phi', 'Vốn':'von', 'Hoàn vốn':'hoan_von' };

  const allEntries = [...revenueEntries, ...debtEntries, ...expenseEntries].filter(e=>{
    const matchSearch = !search || e.name.toLowerCase().includes(search) || (e.note||'').toLowerCase().includes(search);
    const matchKind = !kindFilter || kindRaw[e.kind] === kindFilter;
    const matchFrom = !fromDate || (e.date && e.date >= fromDate);
    const matchTo = !toDate || (e.date && e.date <= toDate);
    return matchSearch && matchKind && matchFrom && matchTo;
  }).sort((a,b)=>{
    if(!a.date) return 1;
    if(!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  if(allEntries.length === 0){ appAlert('Không có khoản mục nào để xuất theo bộ lọc hiện tại.', {type:'info', title:'Không có dữ liệu'}); return; }

  const rows = allEntries.map(e=>({
    'Loại': e.kind,
    'Nội dung': e.name,
    'Số tiền (đ)': e.amount,
    'Ngày': e.date ? formatDateVN(e.date) : '',
    'Ghi chú': e.note || '',
  }));

  const totalRevenue = revenueEntries.reduce((s,e)=>s+e.amount,0);
  const totalDebt = debtEntries.reduce((s,e)=>s+e.amount,0);
  const totalExpense = expenses.filter(e=>e.type==='chi_phi').reduce((s,e)=>s+e.amount,0);
  const totalCapital = expenses.filter(e=>e.type==='von').reduce((s,e)=>s+e.amount,0);
  const totalRefund = expenses.filter(e=>e.type==='hoan_von').reduce((s,e)=>s+e.amount,0);
  const capitalOutstanding = totalCapital - totalRefund;
  const profit = totalRevenue - totalExpense - totalCapital;
  const summaryRows = [
    {'Chỉ tiêu':'Tổng doanh thu (đã thu)', 'Số tiền (đ)': totalRevenue},
    {'Chỉ tiêu':'Công nợ chưa thu', 'Số tiền (đ)': totalDebt},
    {'Chỉ tiêu':'Tổng chi phí bán hàng', 'Số tiền (đ)': totalExpense},
    {'Chỉ tiêu':'Vốn đã bỏ ra (tổng)', 'Số tiền (đ)': totalCapital},
    {'Chỉ tiêu':'Đã hoàn vốn', 'Số tiền (đ)': totalRefund},
    {'Chỉ tiêu':'Vốn Đang Treo (chưa hoàn)', 'Số tiền (đ)': capitalOutstanding},
    {'Chỉ tiêu':'Lời / Lỗ', 'Số tiền (đ)': profit},
  ];

  if(fromDate || toDate || kindFilter || search){
    const fRev = allEntries.filter(e=>e.kind==='Đã thu').reduce((s,e)=>s+e.amount,0);
    const fExp = allEntries.filter(e=>e.kind==='Chi phí bán hàng').reduce((s,e)=>s+e.amount,0);
    const fCap = allEntries.filter(e=>e.kind==='Vốn').reduce((s,e)=>s+e.amount,0);
    const fRef = allEntries.filter(e=>e.kind==='Hoàn vốn').reduce((s,e)=>s+e.amount,0);
    const fCost = fExp + fCap - fRef;
    summaryRows.unshift(
      {'Chỉ tiêu':'--- SỐ LIỆU THEO BỘ LỌC HIỆN TẠI ---', 'Số tiền (đ)': ''},
      {'Chỉ tiêu':'Doanh thu theo bộ lọc', 'Số tiền (đ)': fRev},
      {'Chỉ tiêu':'Chi phí & Vốn theo bộ lọc', 'Số tiền (đ)': fCost},
      {'Chỉ tiêu':'  + Trong đó Chi phí', 'Số tiền (đ)': fExp},
      {'Chỉ tiêu':'  + Trong đó Vốn', 'Số tiền (đ)': fCap},
      {'Chỉ tiêu':'  + Trong đó Hoàn vốn', 'Số tiền (đ)': fRef},
      {'Chỉ tiêu':'Chênh lệch thu - chi (theo lọc)', 'Số tiền (đ)': fRev - fCost},
      {'Chỉ tiêu':'--- TOÀN BỘ SỔ DÒNG TIỀN (TOÀN THỜI GIAN) ---', 'Số tiền (đ)': ''}
    );
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Sổ dòng tiền');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Tổng hợp');
  const today = new Date().toISOString().slice(0,10);
  downloadWorkbook(wb, `dong-tien_${today}.xlsx`);
}

function exportWarehouseExcel(){
  const search = document.getElementById('whSearch').value.trim().toLowerCase();
  const typeFilter = document.getElementById('whFilterType').value;
  const productFilter = document.getElementById('whFilterProduct').value;
  const fromDate = document.getElementById('whFilterFrom').value;
  const toDate = document.getElementById('whFilterTo').value;

  let list = stockEntries.filter(s=>{
    const p = products.find(x=>x.id===s.productId);
    const pname = p ? p.name.toLowerCase() : '';
    const matchSearch = !search || pname.includes(search) || (s.note||'').toLowerCase().includes(search) || (s.supplier||'').toLowerCase().includes(search);
    const matchType = !typeFilter || s.type === typeFilter;
    const matchProduct = !productFilter || s.productId === Number(productFilter);
    const matchFrom = !fromDate || (s.date && s.date >= fromDate);
    const matchTo = !toDate || (s.date && s.date <= toDate);
    return matchSearch && matchType && matchProduct && matchFrom && matchTo;
  }).sort((a,b)=>{
    if(!a.date) return 1;
    if(!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  if(list.length === 0){ appAlert('Không có phiếu kho nào để xuất theo bộ lọc hiện tại.', {type:'info', title:'Không có dữ liệu'}); return; }

  const rows = list.map(s=>{
    const p = products.find(x=>x.id===s.productId);
    return {
      'Loại': s.type==='nhap' ? 'Nhập kho' : 'Xuất kho',
      'Sản phẩm': p ? p.name : 'Sản phẩm đã xóa',
      'Số lượng': s.qty,
      'Đơn vị': p ? p.unit : '',
      'Thành tiền (đ)': s.unitPrice || 0,
      'Ngày': s.date ? formatDateVN(s.date) : '',
      'Nhà cung cấp': s.supplier || '',
      'Ghi chú': s.note || '',
    };
  });

  const stockRows = products.map(p=>({
    'Sản phẩm': p.name,
    'Đơn vị': p.unit,
    'Tồn kho hiện tại': getProductStock(p.id),
    'Tồn tối thiểu': p.minStock,
    'Giá nhập gần nhất (đ)': getLastImportUnitPrice(p.id),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Sổ kho');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockRows), 'Tồn kho hiện tại');
  const today = new Date().toISOString().slice(0,10);
  downloadWorkbook(wb, `kho-hang_${today}.xlsx`);
}

function renderStats(){
  document.getElementById('statTotal').textContent = customers.filter(c=>c.paymentStatus !== 'chua_tra').length;
  document.getElementById('statCskh').textContent = customers.filter(c=>c.paymentStatus === 'chua_tra').length;
  document.getElementById('statOld').textContent = customers.filter(c=>c.type==='cu').length;
  document.getElementById('statLead').textContent = customers.filter(c=>c.type==='tiemnang').length;
}

function openCustomerModal(){
  document.getElementById('customerModalOverlay').classList.add('active');
}
function closeCustomerModal(){
  document.getElementById('customerModalOverlay').classList.remove('active');
  resetCustomerForm();
}

function openTransferModal(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  transferCustomerId = id;
  document.getElementById('transferCustName').textContent = `Khách hàng: ${c.name}`;
  document.getElementById('transferStaff').value = c.staff || '';
  document.getElementById('transferModalOverlay').classList.add('active');
}
function closeTransferModal(){
  transferCustomerId = null;
  document.getElementById('transferModalOverlay').classList.remove('active');
}


// ================= HỆ THỐNG XUẤT HÓA ĐƠN BÁN HÀNG & FILE PDF =================
let currentInvoiceCustomer = null;
let invoicePreviewIncludeSignatures = true;

/**
 * Hàm đọc số tiền thành chữ tiếng Việt chuẩn ngân hàng
 * Ví dụ: 290000 -> "Hai trăm chín mươi nghìn Việt Nam đồng (VND)"
 */
function docSoThanhChu(so) {
  if (!so || isNaN(so) || Number(so) === 0) return 'Không đồng';
  so = Math.round(Math.abs(Number(so)));

  const chuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const lop = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function doc3So(baso, daydu) {
    let tram = Math.floor(baso / 100);
    let chuc = Math.floor((baso % 100) / 10);
    let donvi = baso % 10;
    let ketqua = '';

    if (tram > 0 || daydu) {
      ketqua += chuSo[tram] + ' trăm ';
    }

    if (chuc > 1) {
      ketqua += chuSo[chuc] + ' mươi ';
      if (donvi === 1) ketqua += 'mốt ';
      else if (donvi === 5) ketqua += 'lăm ';
      else if (donvi > 0) ketqua += chuSo[donvi] + ' ';
    } else if (chuc === 1) {
      ketqua += 'mười ';
      if (donvi === 5) ketqua += 'lăm ';
      else if (donvi > 0) ketqua += chuSo[donvi] + ' ';
    } else if (chuc === 0) {
      if (donvi > 0) {
        if (tram > 0 || daydu) ketqua += 'lẻ ';
        ketqua += chuSo[donvi] + ' ';
      }
    }
    return ketqua.trim();
  }

  let str = String(so);
  let groups = [];
  while (str.length > 0) {
    groups.unshift(parseInt(str.slice(-3), 10));
    str = str.slice(0, -3);
  }

  let ketqua = '';
  for (let i = 0; i < groups.length; i++) {
    let g = groups[i];
    let pos = groups.length - 1 - i;
    if (g > 0) {
      let docG = doc3So(g, i > 0);
      ketqua += docG + ' ' + lop[pos] + ' ';
    }
  }

  ketqua = ketqua.trim().replace(/\s+/g, ' ');
  if (!ketqua) return 'Không đồng';
  return ketqua.charAt(0).toUpperCase() + ketqua.slice(1) + ' Việt Nam đồng (VND)';
}

function formatOrderDateTimeShort(val) {
  if (!val) val = new Date();
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yy = String(d.getFullYear()).slice(-2);
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function formatReceiptVND(n){
  const num = Math.round(Number(n) || 0);
  return num.toLocaleString('en-US') + '₫';
}

function generateInvoiceHtml(c, options = {}){
  const product = c.productId ? products.find(p=>p.id===c.productId) : null;
  const combo = c.comboId ? combos.find(x=>x.id===c.comboId) : null;
  const giftProduct = (combo && combo.giftProductId) ? products.find(p=>p.id===combo.giftProductId) : null;
  
  const staffName = c.staff ? (staffLabel[c.staff] || c.staff) : (currentUser ? currentUser.username : 'Ngọc Thương');
  const staffPhone = '0706839434';
  const staffDisplay = staffName.includes('(') ? staffName : `${staffName} (${staffPhone})`;

  const orderDateStr = formatOrderDateTimeShort(c.lastOrderDate || c.createdAt);
  const orderCode = 'DH' + c.id;
  const isPaid = c.paymentStatus !== 'chua_tra';

  let itemName = 'Sản phẩm gạo / nông sản';
  let unit = 'kg';
  let unitPrice = (c.kg && Number(c.kg) > 0) ? Math.round(Number(c.price) / Number(c.kg)) : Number(c.price);
  let qty = combo ? 1 : (Number(c.kg) || 1);

  if(combo){
    itemName = combo.name;
    unit = combo.unit || 'combo';
    unitPrice = Number(combo.unitPrice) || Number(c.price);
  } else if(product){
    itemName = product.name;
    unit = product.unit || 'kg';
    if(product.sellPrice && Number(product.sellPrice) > 0){
      unitPrice = Number(product.sellPrice);
    }
  }

  const subtotal = Math.round(unitPrice * qty);
  const finalPrice = Math.round(Number(c.price) || 0);
  const discount = subtotal > finalPrice ? (subtotal - finalPrice) : 0;
  const docTien = docSoThanhChu(finalPrice);

  let giftItemHtml = '';
  if(combo && giftProduct && combo.giftQty){
    giftItemHtml = `
      <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0;">
        <div style="font-weight:700;color:#15803d;font-size:12px;">🎁 Quà tặng kèm: ${escapeHtml(giftProduct.name)}</div>
        <div style="display:grid;grid-template-columns:1fr 50px 105px;align-items:center;font-size:12px;color:#64748b;margin-top:2px;">
          <div>0₫</div>
          <div style="text-align:center;"><span style="display:inline-block;background:#f0fdf4;color:#166534;font-weight:700;padding:1px 6px;border-radius:4px;">${combo.giftQty}</span></div>
          <div style="text-align:right;color:#16a34a;font-weight:700;">0₫ (Miễn phí)</div>
        </div>
      </div>
    `;
  }

  return `
  <div class="invoice-paper" id="invoicePaper" style="max-width:460px;width:100%;margin:0 auto;background:#ffffff;padding:22px 24px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12.5px;line-height:1.5;box-sizing:border-box;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 20px -2px rgba(15,23,42,0.08);">

    <!-- 1. Header: Logo & Thông tin thương hiệu -->
    <div style="display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:2px solid #0f172a;margin-bottom:12px;">
      <img src="/assets/logo.png" alt="Logo" style="width:58px;height:58px;border-radius:10px;object-fit:cover;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.06);border:1px solid #e2e8f0;" onerror="this.src='/assets/logo.jpg'">
      <div style="line-height:1.45;color:#0f172a;">
        <div style="font-weight:900;font-size:15px;color:#0f172a;letter-spacing:0.02em;text-transform:uppercase;">Vị Nguyên Food (Vigen Food)</div>
        <div style="font-size:11.5px;color:#15803d;font-weight:600;margin-top:1px;">🌾 Gạo sạch & Nông sản nguyên chất</div>
        <div style="font-size:12px;color:#334155;margin-top:2px;">📞 Hotline / Zalo: <strong>0706.839.434</strong></div>
        <div style="font-size:11.5px;color:#64748b;margin-top:1px;">📍 Đ/C: 185/17, Phạm Văn Chiêu, P.14, Gò Vấp, TP.HCM</div>
      </div>
    </div>

    <!-- 2. Tiêu đề & Mã đơn hàng -->
    <div style="text-align:center;margin:10px 0 14px 0;">
      <div style="display:inline-block;background:#eff6ff;color:#1e40af;font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;border:1px solid #bfdbfe;margin-bottom:4px;font-family:monospace;">
        Mã đơn hàng: ${orderCode}
      </div>
      <div style="font-size:20px;font-weight:900;color:#0f172a;letter-spacing:0.04em;margin-top:2px;">
        HÓA ĐƠN BÁN HÀNG
      </div>
    </div>

    <!-- 3. Thông tin khách hàng & NV phụ trách (Thiết kế thẻ gọn gàng, thanh lịch) -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;margin-bottom:12px;font-size:12.5px;line-height:1.6;color:#1e293b;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div><span style="color:#64748b;font-weight:600;">Khách hàng:</span> <strong style="color:#0f172a;font-size:13px;">${escapeHtml(c.name || 'Khách vãng lai')}</strong> ${c.note ? `<span style="color:#64748b;font-size:11.5px;">(${escapeHtml(c.note)})</span>` : ''}</div>
        <div><span style="color:#64748b;font-weight:600;">SĐT:</span> <strong style="color:#2563eb;">${escapeHtml(c.phone || '—')}</strong></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:3px;padding-top:3px;border-top:1px dashed #e2e8f0;">
        <div><span style="color:#64748b;font-weight:600;">Ngày đặt:</span> <strong style="color:#334155;">${orderDateStr}</strong></div>
        <div><span style="color:#64748b;font-weight:600;">NV tạo đơn:</span> <strong style="color:#334155;">${escapeHtml(staffDisplay)}</strong></div>
      </div>
    </div>

    <!-- 4. Header bảng sản phẩm: ĐG | SL | Thành tiền -->
    <div style="display:grid;grid-template-columns:1fr 50px 105px;background:#f1f5f9;padding:6px 10px;font-weight:800;font-size:11.5px;color:#334155;border-radius:6px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.03em;">
      <div>Đơn giá (ĐG)</div>
      <div style="text-align:center;">SL</div>
      <div style="text-align:right;">Thành tiền</div>
    </div>

    <!-- Chi tiết sản phẩm -->
    <div style="padding:2px 8px 6px 8px;">
      <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px;">
        ${escapeHtml(itemName)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 50px 105px;align-items:center;font-size:12.5px;color:#334155;">
        <div style="color:#64748b;font-weight:500;">${formatReceiptVND(unitPrice)}</div>
        <div style="text-align:center;"><span style="display:inline-block;background:#f1f5f9;font-weight:700;color:#0f172a;padding:1px 8px;border-radius:4px;font-size:12px;">${qty}</span></div>
        <div style="text-align:right;font-weight:700;color:#0f172a;font-size:13px;">${formatReceiptVND(subtotal)}</div>
      </div>
      ${giftItemHtml}
    </div>

    <!-- Đường nét đứt ngăn cách -->
    <div style="border-top:1.5px dashed #cbd5e1;margin:8px 0 10px 0;"></div>

    <!-- 5. Chiết khấu & Phí vận chuyển -->
    <div style="font-size:12.5px;line-height:1.7;color:#334155;padding:0 8px;">
      <div style="display:flex;justify-content:space-between;">
        <span>Giảm giá đơn hàng:</span>
        <strong style="color:${discount > 0 ? '#dc2626' : '#64748b'};">${discount > 0 ? '-' + formatReceiptVND(discount) : '0₫'}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:2px;">
        <span>Phí vận chuyển:</span>
        <strong style="color:#16a34a;">0₫ (Miễn phí)</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:2px;">
        <span>Giảm giá vận chuyển:</span>
        <strong style="color:#64748b;">0₫</strong>
      </div>
    </div>

    <!-- 6. Thành tiền & Đọc số thành chữ -->
    <div style="border-top:2px solid #0f172a;padding-top:10px;margin-top:10px;padding-left:8px;padding-right:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:900;font-size:14px;color:#0f172a;letter-spacing:0.03em;text-transform:uppercase;">THÀNH TIỀN:</span>
        <span style="font-weight:900;font-size:18px;color:#1e40af;">${formatReceiptVND(finalPrice)}</span>
      </div>
      <div style="text-align:right;font-size:11px;font-style:italic;color:#64748b;margin-top:2px;">
        (${docTien})
      </div>
    </div>

    <!-- 7. Thanh toán & Công nợ -->
    <div style="border-top:1px dashed #cbd5e1;margin-top:10px;padding-top:8px;font-size:12.5px;line-height:1.7;padding-left:8px;padding-right:8px;">
      <div style="display:flex;justify-content:space-between;color:#475569;">
        <span>Khách đã thanh toán:</span>
        <strong style="color:${isPaid ? '#15803d' : '#64748b'};">${isPaid ? formatReceiptVND(finalPrice) : '0₫'}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
        <span style="font-weight:800;color:#0f172a;font-size:13px;">Khách còn phải trả:</span>
        <strong style="color:${isPaid ? '#15803d' : '#dc2626'};font-size:15px;font-weight:900;">${isPaid ? '0₫ (Đã thanh toán)' : formatReceiptVND(finalPrice)}</strong>
      </div>
    </div>

    <!-- 8. Khối VietQR thanh toán nhanh (MB Bank) -->
    ${!isPaid && finalPrice > 0 ? `
      <div style="text-align:center;margin-top:14px;padding:12px 10px;background:#f8fafc;border-radius:10px;border:1px dashed #94a3b8;">
        <div style="font-size:11.5px;font-weight:800;color:#166534;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span>📱 QUÉT MÃ VIETQR ĐỂ THANH TOÁN</span>
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;"></span>
        </div>
        <div style="display:inline-block;background:#ffffff;padding:6px;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
          <img src="https://img.vietqr.io/image/MB-0939803856-qr_only.png?amount=${finalPrice}&addInfo=${orderCode}&accountName=${encodeURIComponent('NGUYEN AI THI')}" alt="VietQR" style="width:130px;height:130px;display:block;object-fit:contain;">
        </div>
        <div style="font-size:11px;color:#475569;margin-top:6px;line-height:1.45;">
          Ngân hàng: <strong style="color:#1e40af;">MB Bank</strong> • STK: <strong style="color:#1e40af;">0939803856</strong><br>
          Chủ TK: <strong style="color:#0f172a;">NGUYEN AI THI</strong> • Nội dung: <strong style="color:#1e40af;">${orderCode}</strong>
        </div>
      </div>
    ` : (isPaid ? `
      <div style="text-align:center;margin-top:14px;padding:10px 14px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
        <span style="display:inline-block;color:#15803d;font-weight:800;font-size:13px;">
          ✅ ĐƠN HÀNG ĐÃ THANH TOÁN THÀNH CÔNG
        </span>
      </div>
    ` : '')}

    <!-- 9. Lời cảm ơn chân thành -->
    <div style="text-align:center;margin-top:14px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:11px;color:#64748b;line-height:1.45;">
      <div>🙏 Cảm ơn Quý khách đã tin tưởng và đồng hành cùng <strong>Vị Nguyên Food</strong>!</div>
      <div style="margin-top:2px;font-size:10px;color:#94a3b8;">Hóa đơn bán hàng điện tử • In & phát hành tự động</div>
    </div>

  </div>
  `;
}

let invoicePollTimer = null;

function showInvoiceModal(c){
  if(!c) return;
  currentInvoiceCustomer = c;

  if(invoicePollTimer){
    clearInterval(invoicePollTimer);
    invoicePollTimer = null;
  }

  // Xóa dứt điểm nếu còn sót phần tử cũ trong DOM do trình duyệt lưu cache
  const oldTopExport = document.getElementById('exportPdfBtn');
  if(oldTopExport && oldTopExport.parentElement) oldTopExport.parentElement.remove();
  const oldPrintRadio = document.getElementById('invoicePreviewPrint');
  if(oldPrintRadio) {
    const bar = oldPrintRadio.closest('.no-print');
    if(bar) bar.remove();
  }

  const area = document.getElementById('invoiceContentArea');
  if(area){
    area.innerHTML = generateInvoiceHtml(c, { includeSignatures: false });
  }
  const title = document.getElementById('invoiceModalTitle');
  if(title) title.textContent = '🧾 Hóa đơn bán hàng — ' + c.name;
  const modal = document.getElementById('invoiceModalOverlay');
  if(modal) modal.classList.add('active');

  // Nếu đơn hàng chưa thanh toán và có giá trị > 0, bật polling kiểm tra biến động số dư VietQR mỗi 3 giây
  if(c.paymentStatus === 'chua_tra' && Number(c.price) > 0){
    invoicePollTimer = setInterval(async () => {
      try {
        if(!currentInvoiceCustomer || currentInvoiceCustomer.id !== c.id){
          if(invoicePollTimer) { clearInterval(invoicePollTimer); invoicePollTimer = null; }
          return;
        }
        if(!window.CrmApi || !window.CrmApi.payments) return;
        const res = await window.CrmApi.payments.getStatus(c.id);
        if(res && res.paymentStatus === 'da_tra'){
          if(invoicePollTimer) { clearInterval(invoicePollTimer); invoicePollTimer = null; }
          currentInvoiceCustomer.paymentStatus = 'da_tra';
          c.paymentStatus = 'da_tra';

          const target = customers.find(x => x.id === c.id);
          if(target) target.paymentStatus = 'da_tra';

          if(area) area.innerHTML = generateInvoiceHtml(currentInvoiceCustomer, { includeSignatures: false });
          if(typeof renderCustomerList === 'function') renderCustomerList();
          if(typeof renderOrders === 'function') renderOrders();

          if(typeof appAlert === 'function'){
            appAlert(`🎉 Khách hàng đã thanh toán thành công đơn hàng HD-${String(c.id).padStart(5, '0')} qua VietQR!`, { type: 'success', title: 'Thanh toán thành công' });
          }
        }
      } catch (err) {
        // bỏ qua lỗi tạm thời trong lúc poll
      }
    }, 3000);
  }
}

function closeInvoiceModal(){
  if(invoicePollTimer){
    clearInterval(invoicePollTimer);
    invoicePollTimer = null;
  }
  currentInvoiceCustomer = null;
  const modal = document.getElementById('invoiceModalOverlay');
  if(modal) modal.classList.remove('active');
}

async function checkInvoicePaymentManual(){
  if(!currentInvoiceCustomer) return;
  const c = currentInvoiceCustomer;
  try {
    if(!window.CrmApi || !window.CrmApi.payments){
      appAlert('Chưa kết nối được cổng kiểm tra thanh toán.', { type: 'error' });
      return;
    }
    const res = await window.CrmApi.payments.getStatus(c.id);
    if(res && res.paymentStatus === 'da_tra'){
      currentInvoiceCustomer.paymentStatus = 'da_tra';
      c.paymentStatus = 'da_tra';
      const target = customers.find(x => x.id === c.id);
      if(target) target.paymentStatus = 'da_tra';

      const area = document.getElementById('invoiceContentArea');
      if(area) area.innerHTML = generateInvoiceHtml(currentInvoiceCustomer, { includeSignatures: false });
      if(typeof renderCustomerList === 'function') renderCustomerList();
      if(typeof renderOrders === 'function') renderOrders();

      appAlert(`✅ Đơn hàng HD-${String(c.id).padStart(5, '0')} đã được ghi nhận ĐÃ THANH TOÁN!`, { type: 'success', title: 'Đã thanh toán' });
    } else {
      appAlert(`Chưa nhận được giao dịch cho đơn hàng HD-${c.id} trên tài khoản MB Bank. Vui lòng thử lại sau giây lát hoặc nhắc khách quét đúng mã QR!`, { type: 'info', title: 'Chưa nhận tiền' });
    }
  } catch (err) {
    appAlert('Lỗi kiểm tra thanh toán: ' + (err.message || 'Không thể kết nối máy chủ'), { type: 'error' });
  }
}

function openPrintWindow(c, options = {}){
  const invoiceHtml = generateInvoiceHtml(c);
  const printWindow = window.open('', '_blank', 'width=680,height=900');
  if(!printWindow){
    showInvoiceModal(c);
    return;
  }
  const cleanName = (c.name || 'Khach_Hang').replace(/[^\w\s\u00C0-\u1EF9]/gi, '').trim().replace(/\s+/g, '_');
  const title = `Hoa_don_${cleanName}_DH${c.id}`;

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: auto;
      margin: 8mm auto;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #000000;
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-paper {
      max-width: 440px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      padding: 18px 20px !important;
    }
    @media print {
      body {
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
      .invoice-paper {
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:440px;margin:0 auto 12px auto;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:12px;font-weight:600;color:#1e40af;">
      💡 Chọn <strong>"Save as PDF"</strong> để lưu file hoặc chọn máy in để in ra giấy.
    </span>
    <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">🖨️ In / Lưu PDF</button>
  </div>
  ${invoiceHtml}
  <script>
    window.onload = function(){
      setTimeout(function(){ window.print(); }, 350);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

function printInvoice(c){
  if(!c) c = currentInvoiceCustomer;
  if(!c) return;
  openPrintWindow(c);
}

let cachedLogoBase64 = null;
async function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch('/assets/logo.png');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result;
        resolve(cachedLogoBase64);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

let cachedVietQrSvg = {};
async function getVietQrSvg(amount, customerId) {
  const cacheKey = `${customerId}_${amount}`;
  if (cachedVietQrSvg[cacheKey]) return cachedVietQrSvg[cacheKey];

  const amt = Math.round(Number(amount) || 0);
  const memo = encodeURIComponent('DH' + customerId);

  const apiBase = (window.CrmApi && window.CrmApi.getApiBase) ? window.CrmApi.getApiBase() : (window.__API_BASE__ || 'http://localhost:3001/api');

  // 1. Thử qua apiBase trực tiếp tới backend
  try {
    const res = await fetch(`${apiBase}/payments/qr?amount=${amt}&orderCode=DH${customerId}`);
    if(res.ok){
      const text = await res.text();
      if(text && text.includes('<svg')){
        cachedVietQrSvg[cacheKey] = text;
        return text;
      }
    }
  } catch (e) {}

  // 2. Thử đường dẫn tương đối /api/payments/qr (nhờ Next.js rewrite)
  try {
    const res = await fetch(`/api/payments/qr?amount=${amt}&orderCode=DH${customerId}`);
    if(res.ok){
      const text = await res.text();
      if(text && text.includes('<svg')){
        cachedVietQrSvg[cacheKey] = text;
        return text;
      }
    }
  } catch (e) {}

  // 3. Thử qua qr-base64
  try {
    const res = await fetch(`${apiBase}/payments/qr-base64?amount=${amt}&orderCode=DH${customerId}`);
    if(res.ok){
      const json = await res.json();
      if(json && json.dataUrl){
        cachedVietQrSvg[cacheKey] = json.dataUrl;
        return json.dataUrl;
      }
    }
  } catch (e) {}

  return null;
}

async function generatePdfWithPdfMake(c){
  if(!window.pdfMake){
    openPrintWindow(c, { isExport: true });
    return;
  }
  if(window.pdfFonts && window.pdfFonts.pdfMake){
    window.pdfMake.vfs = window.pdfFonts.pdfMake.vfs;
  } else if(window.pdfFonts && window.pdfFonts.vfs){
    window.pdfMake.vfs = window.pdfFonts.vfs;
  }

  const logoBase64 = await getLogoBase64();
  const qrVal = (c.paymentStatus === 'chua_tra' && Number(c.price) > 0) ? await getVietQrSvg(c.price, c.id) : null;
  const product = c.productId ? products.find(p=>p.id===c.productId) : null;
  const combo = c.comboId ? combos.find(x=>x.id===c.comboId) : null;
  const giftProduct = (combo && combo.giftProductId) ? products.find(p=>p.id===combo.giftProductId) : null;
  
  const staffName = c.staff ? (staffLabel[c.staff] || c.staff) : (currentUser ? currentUser.username : 'Ngọc Thương');
  const staffPhone = '0706839434';
  const staffDisplay = staffName.includes('(') ? staffName : `${staffName} (${staffPhone})`;

  const orderDateStr = formatOrderDateTimeShort(c.lastOrderDate || c.createdAt);
  const orderCode = 'DH' + c.id;
  const isPaid = c.paymentStatus !== 'chua_tra';

  let itemName = 'Sản phẩm gạo / nông sản';
  let unit = 'kg';
  let unitPrice = (c.kg && Number(c.kg) > 0) ? Math.round(Number(c.price) / Number(c.kg)) : Number(c.price);
  let qty = combo ? 1 : (Number(c.kg) || 1);

  if(combo){
    itemName = combo.name;
    unit = combo.unit || 'combo';
    unitPrice = Number(combo.unitPrice) || Number(c.price);
  } else if(product){
    itemName = product.name;
    unit = product.unit || 'kg';
    if(product.sellPrice && Number(product.sellPrice) > 0){
      unitPrice = Number(product.sellPrice);
    }
  }

  const subtotal = Math.round(unitPrice * qty);
  const finalPrice = Math.round(Number(c.price) || 0);
  const discount = subtotal > finalPrice ? (subtotal - finalPrice) : 0;
  const docTien = docSoThanhChu(finalPrice);

  const cleanName = (c.name || 'Khach_Hang').replace(/[^\w\s\u00C0-\u1EF9]/gi, '').trim().replace(/\s+/g, '_');
  const filename = `Hoa_don_${cleanName}_DH${c.id}.pdf`;

  const headerColumns = [];
  if(logoBase64){
    headerColumns.push({
      width: 48,
      image: logoBase64,
      fit: [44, 44],
      margin: [0, 0, 8, 0]
    });
  }
  headerColumns.push({
    width: '*',
    stack: [
      { text: 'VỊ NGUYÊN FOOD (VIGEN FOOD)', fontSize: 11, bold: true, color: '#0f172a' },
      { text: '🌾 Gạo sạch & Nông sản nguyên chất', fontSize: 8.5, color: '#15803d', margin: [0, 1, 0, 0] },
      { text: '📞 Hotline / Zalo: 0706.839.434', fontSize: 8.5, color: '#334155', margin: [0, 1, 0, 0] },
      { text: '📍 Đ/C: 185/17, Phạm Văn Chiêu, P.14, Gò Vấp, TP.HCM', fontSize: 7.5, color: '#64748b', margin: [0, 1, 0, 0] }
    ]
  });

  // Tạo phần tử hiển thị mã QR (hỗ trợ cả SVG lẫn base64)
  let qrElement = { text: '📱 Quét mã VietQR chuyển khoản nhanh', fontSize: 8.5, color: '#166534', alignment: 'center' };
  if(qrVal && typeof qrVal === 'string'){
    if(qrVal.includes('<svg')){
      qrElement = { svg: qrVal, width: 88, height: 88, alignment: 'center', margin: [0, 3, 0, 3] };
    } else if(qrVal.startsWith('data:')){
      qrElement = { image: qrVal, fit: [88, 88], alignment: 'center', margin: [0, 3, 0, 3] };
    }
  }

  const content = [
    { columns: headerColumns },
    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 372, y2: 5, lineWidth: 1.5, lineColor: '#0f172a' }] },
    { text: '', margin: [0, 3, 0, 0] },
    { text: `Mã đơn hàng: ${orderCode}`, fontSize: 8.5, bold: true, color: '#1e40af', alignment: 'center' },
    { text: 'HÓA ĐƠN BÁN HÀNG', fontSize: 14.5, bold: true, color: '#0f172a', alignment: 'center', margin: [0, 1, 0, 5] },

    // Khách hàng & NV tạo đơn (Card 2 hàng chuẩn đẹp)
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              fillColor: '#f8fafc',
              margin: [8, 4, 8, 4],
              stack: [
                {
                  columns: [
                    { text: [{ text: 'Khách hàng: ', color: '#64748b', fontSize: 8.5 }, { text: (c.name || 'Khách vãng lai') + (c.note ? ' (' + c.note + ')' : ''), bold: true, color: '#0f172a', fontSize: 8.5 }] },
                    { text: [{ text: 'SĐT: ', color: '#64748b', fontSize: 8.5 }, { text: c.phone || '—', bold: true, color: '#2563eb', fontSize: 8.5 }], alignment: 'right' }
                  ]
                },
                { text: '', margin: [0, 2, 0, 0] },
                {
                  columns: [
                    { text: [{ text: 'Ngày đặt: ', color: '#64748b', fontSize: 8.5 }, { text: orderDateStr, bold: true, color: '#334155', fontSize: 8.5 }] },
                    { text: [{ text: 'NV tạo đơn: ', color: '#64748b', fontSize: 8.5 }, { text: staffDisplay, bold: true, color: '#334155', fontSize: 8.5 }], alignment: 'right' }
                  ]
                }
              ]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.8,
        vLineWidth: () => 0.8,
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#e2e8f0'
      }
    },
    { text: '', margin: [0, 5, 0, 0] },

    // Header bảng sản phẩm: ĐG | SL | Thành tiền
    {
      table: {
        widths: ['*', 45, 85],
        body: [
          [
            { text: 'ĐƠN GIÁ (ĐG)', bold: true, fontSize: 8, color: '#334155', fillColor: '#f1f5f9', margin: [4, 3, 4, 3] },
            { text: 'SL', bold: true, fontSize: 8, color: '#334155', alignment: 'center', fillColor: '#f1f5f9', margin: [4, 3, 4, 3] },
            { text: 'THÀNH TIỀN', bold: true, fontSize: 8, color: '#334155', alignment: 'right', fillColor: '#f1f5f9', margin: [4, 3, 4, 3] }
          ]
        ]
      },
      layout: 'noBorders'
    },

    // Chi tiết sản phẩm
    {
      margin: [4, 3, 4, 2],
      stack: [
        { text: itemName, fontSize: 8.5, bold: true, color: '#0f172a' },
        {
          columns: [
            { text: formatReceiptVND(unitPrice), fontSize: 8.5, color: '#64748b', width: '*' },
            { text: String(qty), fontSize: 8.5, bold: true, alignment: 'center', color: '#0f172a', width: 45 },
            { text: formatReceiptVND(subtotal), fontSize: 8.5, bold: true, alignment: 'right', color: '#0f172a', width: 85 }
          ],
          margin: [0, 2, 0, 0]
        },
        ...(combo && giftProduct && combo.giftQty ? [
          { text: `🎁 Quà tặng kèm: ${giftProduct.name}`, fontSize: 8, bold: true, color: '#15803d', margin: [0, 2, 0, 0] },
          {
            columns: [
              { text: '0₫', fontSize: 8, color: '#666666', width: '*' },
              { text: `${combo.giftQty}`, fontSize: 8, bold: true, alignment: 'center', color: '#166534', width: 45 },
              { text: '0₫ (Miễn phí)', fontSize: 8, bold: true, alignment: 'right', color: '#16a34a', width: 85 }
            ]
          }
        ] : [])
      ]
    },

    // Đường nét đứt
    { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 372, y2: 4, lineWidth: 0.8, dash: { length: 3, space: 2 }, lineColor: '#cbd5e1' }] },
    { text: '', margin: [0, 3, 0, 0] },

    // Giảm giá & Vận chuyển
    {
      columns: [
        { text: 'Giảm giá đơn hàng:', fontSize: 8.5, color: '#334155' },
        { text: discount > 0 ? '-' + formatReceiptVND(discount) : '0₫', fontSize: 8.5, bold: true, alignment: 'right', color: discount > 0 ? '#dc2626' : '#64748b' }
      ]
    },
    {
      columns: [
        { text: 'Phí vận chuyển:', fontSize: 8.5, color: '#334155', margin: [0, 1, 0, 0] },
        { text: '0₫ (Miễn phí)', fontSize: 8.5, bold: true, alignment: 'right', color: '#16a34a', margin: [0, 1, 0, 0] }
      ]
    },
    {
      columns: [
        { text: 'Giảm giá vận chuyển:', fontSize: 8.5, color: '#334155', margin: [0, 1, 0, 0] },
        { text: '0₫', fontSize: 8.5, alignment: 'right', color: '#64748b', margin: [0, 1, 0, 0] }
      ]
    },

    // Đường kẻ đậm
    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 372, y2: 5, lineWidth: 1.5, lineColor: '#0f172a' }] },
    { text: '', margin: [0, 4, 0, 0] },

    // THÀNH TIỀN
    {
      columns: [
        { text: 'THÀNH TIỀN:', fontSize: 10, bold: true, color: '#0f172a' },
        { text: formatReceiptVND(finalPrice), fontSize: 13, bold: true, color: '#1e40af', alignment: 'right' }
      ]
    },
    { text: `(${docTien})`, fontSize: 7.5, italics: true, color: '#64748b', alignment: 'right', margin: [0, 1, 0, 0] },

    // Đường nét đứt
    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 372, y2: 5, lineWidth: 0.8, dash: { length: 3, space: 2 }, lineColor: '#cbd5e1' }] },
    { text: '', margin: [0, 4, 0, 0] },

    // Thanh toán
    {
      columns: [
        { text: 'Khách đã thanh toán:', fontSize: 8.5, color: '#475569' },
        { text: isPaid ? formatReceiptVND(finalPrice) : '0₫', fontSize: 8.5, bold: true, alignment: 'right', color: isPaid ? '#15803d' : '#64748b' }
      ]
    },
    {
      columns: [
        { text: 'Khách còn phải trả:', fontSize: 9, bold: true, color: '#0f172a', margin: [0, 2, 0, 0] },
        { text: isPaid ? '0₫ (Đã thanh toán)' : formatReceiptVND(finalPrice), fontSize: 9.5, bold: true, alignment: 'right', color: isPaid ? '#15803d' : '#dc2626', margin: [0, 2, 0, 0] }
      ]
    },

    // Khối VietQR (Đảm bảo luôn luôn hiển thị đầy đủ, sắc nét)
    ...(!isPaid && finalPrice > 0 ? [
      { text: '', margin: [0, 6, 0, 0] },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#f8fafc',
                margin: [6, 5, 6, 5],
                stack: [
                  { text: '📱 QUÉT MÃ VIETQR ĐỂ THANH TOÁN', fontSize: 8, bold: true, color: '#166534', alignment: 'center' },
                  qrElement,
                  { text: 'Ngân hàng: MB Bank • STK: 0939803856', fontSize: 7.5, color: '#475569', alignment: 'center' },
                  { text: 'Chủ TK: NGUYEN AI THI • Nội dung: ' + orderCode, fontSize: 7.5, bold: true, color: '#1e40af', alignment: 'center', margin: [0, 1, 0, 0] }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1'
        }
      }
    ] : (isPaid ? [
      { text: '', margin: [0, 6, 0, 0] },
      { text: '✅ ĐƠN HÀNG ĐÃ THANH TOÁN THÀNH CÔNG', fontSize: 8.5, bold: true, color: '#15803d', alignment: 'center' }
    ] : [])),

    // Lời cảm ơn
    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 372, y2: 5, lineWidth: 0.6, dash: { length: 2, space: 2 }, lineColor: '#cbd5e1' }] },
    { text: '🙏 Cảm ơn Quý khách đã tin tưởng và đồng hành cùng Vị Nguyên Food!', fontSize: 7.5, color: '#64748b', alignment: 'center', margin: [0, 3, 0, 0] },
    { text: 'Hóa đơn bán hàng điện tử • In & phát hành tự động', fontSize: 6.5, color: '#94a3b8', alignment: 'center', margin: [0, 1, 0, 0] }
  ];

  const docDefinition = {
    pageSize: 'A5',
    pageMargins: [24, 14, 24, 14],
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8.5
    }
  };

  try {
    window.pdfMake.createPdf(docDefinition).download(filename);
    if(typeof appAlert === 'function') {
      appAlert(`Đã xuất file PDF "${filename}" thành công!`, {type:'success', title:'Xuất file PDF'});
    }
  } catch(e) {
    console.error('pdfMake download error:', e);
    openPrintWindow(c, { isExport: true });
  }
}

async function exportPdf(c){
  if(!c) c = currentInvoiceCustomer;
  if(!c) return;
  const btn = document.getElementById('exportPdfBtnBottom');
  const origHtml = btn ? btn.innerHTML : '';
  if(btn) btn.innerHTML = '⏳ Đang tạo file PDF...';

  try {
    await generatePdfWithPdfMake(c);
  } catch (err) {
    console.error('exportPdf error:', err);
    openPrintWindow(c, { isExport: true });
  } finally {
    if(btn) btn.innerHTML = origHtml;
  }
}
// ================= /HỆ THỐNG XUẤT HÓA ĐƠN =================

function startEditCustomer(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  editingCustomerId = id;
  document.getElementById('cName').value = c.name;
  document.getElementById('cPhone').value = c.phone;
  document.getElementById('cAddress').value = c.address;
  document.getElementById('cType').value = c.type;
  document.getElementById('cStage').value = c.stage || 'order';
  document.getElementById('cAcquiredDate').value = c.acquiredDate || '';
  document.getElementById('cLastOrderDate').value = c.lastOrderDate || '';
  document.getElementById('cDeliveryDate').value = c.deliveryDate || '';
  document.getElementById('cNextContactDate').value = c.nextContactDate || '';
  populateStaffSelect();
  if(currentUser && currentUser.role === 'admin') document.getElementById('cStaff').value = c.staff || '';
  document.getElementById('cNote').value = c.note;
  const presetKgs = ['5','10','15','20','25','30','40','50','100'];
  if(presetKgs.includes(String(c.kg))){
    document.getElementById('cKg').value = String(c.kg);
    document.getElementById('cKgCustom').style.display = 'none';
    document.getElementById('cKgCustom').value = '';
  } else {
    document.getElementById('cKg').value = 'custom';
    document.getElementById('cKgCustom').style.display = 'block';
    document.getElementById('cKgCustom').value = c.kg || '';
  }
  document.getElementById('cPrice').value = c.price ? c.price/1000 : '';
  document.getElementById('cPaymentStatus').value = c.paymentStatus || 'da_tra';
  populateProductSelects();
  document.getElementById('cProduct').value = c.productId || '';
  populateComboSelect();
  document.getElementById('cCombo').value = c.comboId || '';
  applyComboToCustomerForm();
  document.getElementById('custFormTitle').textContent = '✏️ Sửa khách hàng';
  document.getElementById('addCustomerBtn').textContent = 'Lưu thay đổi';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  openCustomerModal();
  document.getElementById('cName').focus();
}

// Khách cũ mua lại: tạo 1 ĐƠN HÀNG MỚI (dòng mới, KHÔNG ghi đè đơn cũ),
// tự điền sẵn tên/SĐT/địa chỉ/nhân viên phụ trách của khách, còn số lượng/sản phẩm/giá/ngày để trống cho đơn mới.
function startRepeatOrder(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  pendingCustomerStage = 'order';
  resetCustomerForm(); // đảm bảo editingCustomerId = null -> lưu sẽ tạo dòng mới, không sửa đơn cũ
  document.getElementById('cName').value = c.name;
  document.getElementById('cPhone').value = c.phone;
  document.getElementById('cAddress').value = c.address;
  document.getElementById('cType').value = 'cu'; // tự đánh dấu Khách cũ
  populateStaffSelect();
  document.getElementById('cStaff').value = c.staff || '';
  document.getElementById('custFormTitle').textContent = `🔁 Đơn hàng mới cho khách cũ: ${c.name}`;
  openCustomerModal();
  document.getElementById('cKgCustom').focus();
}

function resetCustomerForm(){
  editingCustomerId = null;
  document.getElementById('cName').value='';
  document.getElementById('cPhone').value='';
  document.getElementById('cAddress').value='';
  document.getElementById('cNote').value='';
  document.getElementById('cType').value='moi';
  document.getElementById('cStage').value = pendingCustomerStage;
  document.getElementById('cAcquiredDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('cLastOrderDate').value='';
  document.getElementById('cDeliveryDate').value='';
  document.getElementById('cNextContactDate').value='';
  document.getElementById('cStaff').value='';
  populateStaffSelect();
  document.getElementById('cKg').value='25';
  document.getElementById('cKgCustom').value='';
  document.getElementById('cKgCustom').style.display='none';
  document.getElementById('cPrice').value='';
  document.getElementById('cPaymentStatus').value = pendingCustomerStage === 'cskh' ? 'chua_tra' : 'da_tra';
  populateProductSelects();
  document.getElementById('cProduct').value='';
  document.getElementById('cCombo').value='';
  applyComboToCustomerForm();
  document.getElementById('custFormTitle').textContent = pendingCustomerStage === 'cskh' ? '💳 Thêm công nợ' : '👤 Thêm khách hàng';
  document.getElementById('addCustomerBtn').textContent = 'Lưu khách hàng';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
}

function populateComboSelect(){
  const sel = document.getElementById('cCombo');
  const current = sel.value;
  sel.innerHTML = `<option value="">Không mua combo</option>` +
    combos.map(c=>`<option value="${c.id}">🎁 ${escapeHtml(c.name)} — ${formatVND(comboFinalPrice(c))} (${formatKg(comboTotalKg(c), comboUnit(c))})</option>`).join('');
  sel.value = current;
}

function renderCombos(){
  const holder = document.getElementById('comboTableHolder');
  document.getElementById('comboCount').textContent = `${combos.length} combo`;
  if(combos.length===0){
    holder.innerHTML = `<div class="empty">Chưa có combo nào. Tạo combo đầu tiên bên trái.</div>`;
    return;
  }
  holder.innerHTML = `
    <table>
      <thead><tr><th>Combo</th><th>Mô tả</th><th>Ưu đãi</th><th>Tổng kg</th><th>Giá gốc</th><th>Giá cuối</th><th>Đã mua bởi</th><th>Thao tác</th></tr></thead>
      <tbody>
        ${combos.map(c=>{
          const boughtCount = customers.filter(cu=>cu.combo==='co' && cu.comboId===c.id).length;
          const offerLabel = comboOfferLabel(c);
          return `<tr>
            <td class="combo-row-name">${escapeHtml(c.name)}</td>
            <td class="note-cell" style="max-width:220px;">${escapeHtml(c.desc||'—')}</td>
            <td>${offerLabel}</td>
            <td>${formatKg(comboTotalKg(c), comboUnit(c))}</td>
            <td>${formatVND(comboBasePrice(c))}</td>
            <td><b>${formatVND(comboFinalPrice(c))}</b></td>
            <td>${boughtCount} khách</td>
            <td>
              <button class="row-action" data-action="edit" data-id="${c.id}" title="Sửa">✏️</button>
              <button class="row-action" data-action="delete" data-id="${c.id}" title="Xóa">🗑️</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'edit') startEditCombo(id);
      else deleteCombo(id);
    });
  });
}

function openComboModal(){
  document.getElementById('comboModalOverlay').classList.add('active');
}
function closeComboModal(){
  document.getElementById('comboModalOverlay').classList.remove('active');
}

function startEditCombo(id){
  const c = combos.find(x=>x.id===id);
  if(!c) return;
  editingComboId = id;
  openComboModal();
  document.getElementById('koName').value = c.name;
  document.getElementById('koDesc').value = c.desc;
  document.getElementById('koProduct').value = c.productId || '';
  document.getElementById('koBaseKg').value = c.baseKg || '';
  document.getElementById('koUnitPrice').value = c.unitPrice ? c.unitPrice/1000 : '';
  document.getElementById('koOfferValue').value = c.offerType==='money' ? (c.offerValue ? c.offerValue/1000 : '') : (c.offerValue || '');
  document.getElementById('koGiftProduct').value = c.giftProductId || '';
  document.getElementById('koGiftQty').value = c.giftQty || '';
  document.getElementById('koGiftQtyWrap').style.display = c.giftProductId ? 'block' : 'none';
  updateComboUnitLabels();
  setComboOfferType(c.offerType || 'percent');
  document.getElementById('comboFormTitle').textContent = '✏️ Sửa combo';
  document.getElementById('addComboBtn').textContent = 'Lưu thay đổi';
  document.getElementById('cancelComboEditBtn').style.display = 'inline-flex';
  document.getElementById('koName').focus();
  updateComboCalc();
}

function resetComboForm(){
  editingComboId = null;
  document.getElementById('koName').value='';
  document.getElementById('koDesc').value='';
  document.getElementById('koProduct').value='';
  document.getElementById('koBaseKg').value='';
  document.getElementById('koUnitPrice').value='';
  document.getElementById('koOfferValue').value='';
  document.getElementById('koGiftProduct').value='';
  document.getElementById('koGiftQty').value='';
  document.getElementById('koGiftQtyWrap').style.display='none';
  updateComboUnitLabels();
  setComboOfferType('percent');
  document.getElementById('comboFormTitle').textContent = '🎁 Tạo combo ưu đãi';
  document.getElementById('addComboBtn').textContent = 'Lưu combo';
  document.getElementById('cancelComboEditBtn').style.display = 'inline-flex';
  updateComboCalc();
}

function populateComboProductSelect(){
  const sel = document.getElementById('koProduct');
  if(!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">— Chọn sản phẩm trong kho —</option>` +
    products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.unit)})</option>`).join('');
  sel.value = current;

  const giftSel = document.getElementById('koGiftProduct');
  if(giftSel){
    const giftCurrent = giftSel.value;
    giftSel.innerHTML = `<option value="">— Không có quà tặng kèm —</option>` +
      products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.unit)})</option>`).join('');
    giftSel.value = giftCurrent;
  }
}

document.getElementById('koGiftProduct').addEventListener('change', ()=>{
  document.getElementById('koGiftQtyWrap').style.display =
    document.getElementById('koGiftProduct').value ? 'block' : 'none';
});

function updateComboUnitLabels(){
  const productId = Number(document.getElementById('koProduct').value)||0;
  const p = products.find(x=>x.id===productId);
  const unit = p ? p.unit : 'kg';
  document.getElementById('koUnitPriceSuffix').textContent = `.000 đ/${unit}`;
  const type = document.getElementById('koOfferType').value;
  if(type==='kg'){
    document.getElementById('koOfferValueLbl').textContent = `Giá trị ưu đãi (${unit})`;
    document.getElementById('koOfferValueSuffix').textContent = unit;
  }
}

function onComboProductChange(){
  const productId = Number(document.getElementById('koProduct').value)||0;
  const p = products.find(x=>x.id===productId);
  if(p){
    if(p.sellPrice){
      document.getElementById('koUnitPrice').value = Math.round(p.sellPrice/1000);
    }
  }
  updateComboUnitLabels();
  updateComboCalc();
}

function setComboOfferType(type){
  document.getElementById('koOfferType').value = type;
  document.querySelectorAll('#koOfferTypeBtns .btn').forEach(b=>{
    b.style.background = (b.dataset.offer===type) ? 'var(--accent)' : '';
    b.style.color = (b.dataset.offer===type) ? '#fff' : '';
  });
  const productId = Number(document.getElementById('koProduct').value)||0;
  const p = products.find(x=>x.id===productId);
  const unit = p ? p.unit : 'kg';
  const lbl = document.getElementById('koOfferValueLbl');
  const suffix = document.getElementById('koOfferValueSuffix');
  if(type==='percent'){ lbl.textContent='Giá trị ưu đãi (%)'; suffix.textContent='%'; }
  else if(type==='kg'){ lbl.textContent=`Giá trị ưu đãi (${unit})`; suffix.textContent=unit; }
  else { lbl.textContent='Giá trị ưu đãi (tiền)'; suffix.textContent='.000 đ'; }
  updateComboCalc();
}

function updateComboCalc(){
  const productId = Number(document.getElementById('koProduct').value)||0;
  const p = products.find(x=>x.id===productId);
  const unit = p ? p.unit : 'kg';
  const baseKg = Number(document.getElementById('koBaseKg').value)||0;
  const unitPrice = (Number(document.getElementById('koUnitPrice').value)||0) * 1000;
  const offerType = document.getElementById('koOfferType').value;
  const rawVal = Number(document.getElementById('koOfferValue').value)||0;
  const offerValue = offerType==='money' ? rawVal*1000 : rawVal;
  const tmp = { baseKg, unitPrice, offerType, offerValue, unit };
  document.getElementById('koCalcBase').textContent = formatVND(comboBasePrice(tmp));
  document.getElementById('koCalcKg').textContent = formatKg(comboTotalKg(tmp), unit);
  document.getElementById('koCalcFinal').textContent = formatVND(comboFinalPrice(tmp));
}

async function deleteCombo(id){
  const c = combos.find(x=>x.id===id);
  if(!c) return;
  const linked = customers.filter(cu=>cu.combo==='co' && cu.comboId===id).length;
  const msg = linked>0
    ? `Combo "${c.name}" đang gắn với ${linked} khách hàng. Xóa vẫn giữ khách hàng nhưng mất liên kết combo. Vẫn xóa?`
    : `Xóa combo "${c.name}"?`;
  const ok = await appConfirm(msg, {type:'danger', title:'⚠️ Xóa combo'});
  if(!ok) return;
  try{ await CrmApi.combos.remove(id); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); return; }
  if(editingComboId === id) resetComboForm();
  await loadAllData();
}

async function togglePaymentStatus(id){
  try{
    const prev = customers.find(x=>x.id===id);
    const wasUnpaid = prev && prev.paymentStatus === 'chua_tra';
    await CrmApi.customers.togglePayment(id);
    await loadAllData();
    if(wasUnpaid){
      appAlert(`Đã thu tiền khách hàng "${prev ? prev.name : id}".\n\nKhách hàng đã tự động chuyển sang mục "Khách hàng".`, {type:'success', title:'✅ Đã thanh toán'});
    } else if(prev){
      appAlert(`Đã chuyển khách hàng "${prev.name}" sang mục "Danh sách công nợ".`, {type:'info', title:'🕒 Ghi nhận công nợ'});
    }
  }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); }
}

async function togglePackedStatus(id){
  try{ await CrmApi.customers.togglePacked(id); await loadAllData(); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); }
}

async function toggleDeliveredStatus(id){
  try{ await CrmApi.customers.toggleDelivered(id); await loadAllData(); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); }
}

async function deleteCustomer(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  const ok = await appConfirm(`Xóa khách hàng "${c.name}"?`, {type:'danger', title:'⚠️ Xóa khách hàng'});
  if(!ok) return;
  try{ await CrmApi.customers.remove(id); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); return; }
  if(editingCustomerId === id) resetCustomerForm();
  await loadAllData();
}

function renderAccounts(){
  const holder = document.getElementById('accountTableHolder');
  document.getElementById('accountCount').textContent = `${accounts.length} tài khoản`;
  if(accounts.length===0){
    holder.innerHTML = `<div class="empty">Chưa có tài khoản nào. Thêm tài khoản đầu tiên bên trái.</div>`;
    return;
  }
  holder.innerHTML = `
    <table>
      <thead><tr><th>Tên tài nguyên</th><th>Tên ĐN</th><th>Mật khẩu</th><th>Thao tác</th></tr></thead>
      <tbody>
        ${accounts.map(a=>`
          <tr>
            <td><span class="tag tag-lead">${escapeHtml(a.resource)}</span></td>
            <td>${escapeHtml(a.username)}</td>
            <td class="pw-cell">${escapeHtml(a.password)}</td>
            <td>
              <button class="row-action" data-action="edit" data-id="${a.id}" title="Sửa">✏️</button>
              <button class="row-action" data-action="delete" data-id="${a.id}" title="Xóa">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;
  holder.querySelectorAll('.row-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      if(btn.dataset.action === 'edit') startEditAccount(id);
      else deleteAccount(id);
    });
  });
}

function openAccountModal(){
  document.getElementById('accountModalOverlay').classList.add('active');
}
function closeAccountModal(){
  document.getElementById('accountModalOverlay').classList.remove('active');
}

function startEditAccount(id){
  const a = accounts.find(x=>x.id===id);
  if(!a) return;
  editingAccountId = id;
  openAccountModal();
  const presetResources = ['EMAIL','FACEBOOK','ZALO','SP EXPRESS','SHOPEE','TIKTOK','WEBSITE'];
  if(presetResources.includes(a.resource)){
    document.getElementById('acName').value = a.resource;
    document.getElementById('acNameCustom').style.display = 'none';
  } else {
    document.getElementById('acName').value = 'KHAC';
    document.getElementById('acNameCustom').style.display = 'block';
    document.getElementById('acNameCustom').value = a.resource;
  }
  document.getElementById('acUser').value = a.username;
  document.getElementById('acPass').value = a.password;
  document.getElementById('accountFormTitle').textContent = '✏️ Sửa tài khoản';
  document.getElementById('addAccountBtn').textContent = 'Lưu thay đổi';
  document.getElementById('cancelAccountEditBtn').style.display = 'block';
  document.getElementById('acUser').focus();
}

function resetAccountForm(){
  editingAccountId = null;
  document.getElementById('acName').value = 'EMAIL';
  document.getElementById('acNameCustom').value = '';
  document.getElementById('acNameCustom').style.display = 'none';
  document.getElementById('acUser').value = '';
  document.getElementById('acPass').value = '';
  document.getElementById('accountFormTitle').textContent = '🔑 Thêm tài khoản';
  document.getElementById('addAccountBtn').textContent = 'Lưu tài khoản';
  document.getElementById('cancelAccountEditBtn').style.display = 'none';
}

async function deleteAccount(id){
  const a = accounts.find(x=>x.id===id);
  if(!a) return;
  const ok = await appConfirm(`Xóa tài khoản "${a.resource} — ${a.username}"?`, {type:'danger', title:'⚠️ Xóa tài khoản'});
  if(!ok) return;
  try{ await CrmApi.socialAccounts.remove(id); }
  catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi'}); return; }
  if(editingAccountId === id) resetAccountForm();
  await loadAllData();
}

document.getElementById('addCustomerBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const address = document.getElementById('cAddress').value.trim();
  const type = document.getElementById('cType').value;
  const stage = document.getElementById('cStage').value;
  const staff = document.getElementById('cStaff').value;
  const note = document.getElementById('cNote').value.trim();
  const productId = document.getElementById('cProduct').value ? Number(document.getElementById('cProduct').value) : null;
  const kgSelect = document.getElementById('cKg').value;
  const kg = kgSelect === 'custom' ? (document.getElementById('cKgCustom').value || 0) : kgSelect;
  const price = (document.getElementById('cPrice').value || 0) * 1000;
  const paymentStatus = document.getElementById('cPaymentStatus').value;
  const comboId = document.getElementById('cCombo').value ? Number(document.getElementById('cCombo').value) : null;
  const combo = comboId ? 'co' : 'khong';
  const acquiredDate = document.getElementById('cAcquiredDate').value;
  const lastOrderDate = document.getElementById('cLastOrderDate').value;
  const deliveryDate = document.getElementById('cDeliveryDate').value;
  const nextContactDate = document.getElementById('cNextContactDate').value;

  if(!name){ appAlert('Vui lòng nhập tên khách hàng.', {type:'warning', title:'Thiếu thông tin'}); return; }

  // Kiểm tra tồn kho trước khi lưu: nếu không đủ hàng thì hỏi xác nhận (Vẫn lưu = kho âm; Hủy = dừng lại)
  {
    const editingCust = editingCustomerId ? customers.find(x=>x.id===editingCustomerId) : null;
    const excludeMainId = editingCust ? editingCust.stockEntryId : null;
    if(!(await confirmStockAvailability(productId, kg, excludeMainId))) return;

    const comboForStock = comboId ? combos.find(x=>x.id===comboId) : null;
    if(comboForStock && comboForStock.giftProductId && comboForStock.giftQty){
      const excludeGiftId = editingCust ? editingCust.giftStockEntryId : null;
      if(!(await confirmStockAvailability(comboForStock.giftProductId, comboForStock.giftQty, excludeGiftId))) return;
    }
  }

  // Chuyển "staff" (username hiển thị trong <select>) -> staffUserId (khoá ngoại số) cho API
  const staffUserId = staffUsernameToId(staff);

  // Lưu ý: comboId/staffUserId/productId gửi ĐÚNG giá trị (number HOẶC null) —
  // KHÔNG đổi null thành undefined, vì null nghĩa là "bỏ chọn/xoá liên kết",
  // còn undefined nghĩa là "không đổi gì" — 2 ý nghĩa khác nhau khi SỬA khách hàng.
  const payload = {
    name, phone, address, type, stage, note,
    kg: Number(kg)||0,
    price: Number(price)||0,
    comboId: comboId,
    staffUserId: staffUserId,
    productId: productId,
    paymentStatus,
    acquiredDate: acquiredDate || undefined,
    lastOrderDate: lastOrderDate || undefined,
    deliveryDate: deliveryDate || undefined,
    nextContactDate: nextContactDate || undefined,
  };

  try{
    let savedRecord = null;
    if(editingCustomerId){
      savedRecord = await CrmApi.customers.update(editingCustomerId, payload);
    } else {
      savedRecord = await CrmApi.customers.create(payload);
    }
  } catch(err){
    appAlert(err.message, {type:'danger', title:'Lỗi lưu khách hàng'});
    return;
  }
  resetCustomerForm();
  closeCustomerModal();
  await loadAllData();

  // Tự động xuất hóa đơn nếu là thêm khách mới hoặc mua lại (đơn mới) có giá trị
  const hasOrder = (payload.price && Number(payload.price) > 0) || (payload.kg && Number(payload.kg) > 0);
  if(!editingCustomerId && hasOrder){
    const targetCust = (savedRecord && savedRecord.id)
      ? (customers.find(x => x.id === savedRecord.id) || savedRecord)
      : customers[0];
    if(targetCust){
      showInvoiceModal(targetCust);
    }
  }
});

document.getElementById('openAddCustomerBtn').addEventListener('click', ()=>{
  pendingCustomerStage = 'order';
  resetCustomerForm();
  openCustomerModal();
});
document.getElementById('openAddCskhBtn').addEventListener('click', ()=>{
  pendingCustomerStage = 'cskh';
  resetCustomerForm();
  openCustomerModal();
});
document.getElementById('closeCustomerModal').addEventListener('click', closeCustomerModal);
document.getElementById('customerModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'customerModalOverlay') closeCustomerModal();
});

document.getElementById('cKg').addEventListener('change', ()=>{
  document.getElementById('cKgCustom').style.display =
    document.getElementById('cKg').value === 'custom' ? 'block' : 'none';
  updateAutoPriceFromProduct();
});
document.getElementById('cKgCustom').addEventListener('input', updateAutoPriceFromProduct);
document.getElementById('cProduct').addEventListener('change', updateAutoPriceFromProduct);

function updateAutoPriceFromProduct(){
  const comboId = document.getElementById('cCombo').value;
  if(comboId) return; // giá đã được tự tính theo combo, không ghi đè
  const productId = document.getElementById('cProduct').value ? Number(document.getElementById('cProduct').value) : null;
  if(!productId) return;
  const p = products.find(x=>x.id===productId);
  if(!p || !p.sellPrice) return;
  const kgSelect = document.getElementById('cKg').value;
  const kg = Number(kgSelect === 'custom' ? (document.getElementById('cKgCustom').value || 0) : kgSelect) || 0;
  if(kg <= 0) return;
  document.getElementById('cPrice').value = Math.round((p.sellPrice * kg) / 1000);
}

function applyComboToCustomerForm(){
  const comboId = document.getElementById('cCombo').value ? Number(document.getElementById('cCombo').value) : null;
  const productSelect = document.getElementById('cProduct');
  const kgSelect = document.getElementById('cKg');
  const kgCustom = document.getElementById('cKgCustom');
  const priceInput = document.getElementById('cPrice');
  const hint = document.getElementById('cComboHint');
  if(comboId){
    const c = combos.find(x=>x.id===comboId);
    if(c){
      const totalKg = comboTotalKg(c);
      const finalPrice = comboFinalPrice(c);
      if(c.productId) productSelect.value = String(c.productId);
      kgSelect.value = 'custom';
      kgCustom.style.display = 'block';
      kgCustom.value = totalKg;
      priceInput.value = Math.round(finalPrice/1000);
      productSelect.disabled = true;
      kgSelect.disabled = true;
      kgCustom.disabled = true;
      priceInput.disabled = true;
      hint.style.display = 'block';
      hint.textContent = `${comboOfferLabel(c)} — tự động điền theo combo "${c.name}"` +
        (c.giftProductId ? ` (kho sẽ tự trừ thêm quà tặng kèm khi lưu)` : '');
      return;
    }
  }
  productSelect.disabled = false;
  kgSelect.disabled = false;
  kgCustom.disabled = false;
  priceInput.disabled = false;
  hint.style.display = 'none';
  hint.textContent = '';
  updateAutoPriceFromProduct();
}

document.getElementById('cCombo').addEventListener('change', applyComboToCustomerForm);

document.getElementById('cancelEditBtn').addEventListener('click', closeCustomerModal);
document.getElementById('custSearch').addEventListener('input', ()=>{ paginationState.order = 1; render(); });
document.getElementById('custFilterType').addEventListener('change', ()=>{ paginationState.order = 1; render(); });
document.getElementById('custFilterStaff').addEventListener('change', ()=>{ paginationState.order = 1; render(); });
const custFilterPayEl = document.getElementById('custFilterPayment');
if(custFilterPayEl) custFilterPayEl.addEventListener('change', ()=>{ paginationState.order = 1; render(); });
document.getElementById('custFilterPacked').addEventListener('change', ()=>{ paginationState.order = 1; render(); });
document.getElementById('custFilterDelivered').addEventListener('change', ()=>{ paginationState.order = 1; render(); });
document.getElementById('cskhSearch').addEventListener('input', ()=>{ paginationState.cskh = 1; render(); });

const cskhFromDateEl = document.getElementById('cskhFromDate');
if(cskhFromDateEl) cskhFromDateEl.addEventListener('change', ()=>{ paginationState.cskh = 1; render(); });

const cskhToDateEl = document.getElementById('cskhToDate');
if(cskhToDateEl) cskhToDateEl.addEventListener('change', ()=>{ paginationState.cskh = 1; render(); });

const cskhTodayBtn = document.getElementById('cskhTodayBtn');
if(cskhTodayBtn) cskhTodayBtn.addEventListener('click', ()=>{
  const todayKey = dateKeyFromTimestamp(Date.now());
  if(cskhFromDateEl) cskhFromDateEl.value = todayKey;
  if(cskhToDateEl) cskhToDateEl.value = todayKey;
  paginationState.cskh = 1;
  render();
});

const cskhClearDateBtn = document.getElementById('cskhClearDateBtn');
if(cskhClearDateBtn) cskhClearDateBtn.addEventListener('click', ()=>{
  if(cskhFromDateEl) cskhFromDateEl.value = '';
  if(cskhToDateEl) cskhToDateEl.value = '';
  const searchInput = document.getElementById('cskhSearch');
  if(searchInput) searchInput.value = '';
  paginationState.cskh = 1;
  render();
});

document.getElementById('orderSearch').addEventListener('input', ()=>{ paginationState.orders = 1; render(); });
document.getElementById('orderFilterStaff').addEventListener('change', ()=>{ paginationState.orders = 1; render(); });
document.getElementById('orderFilterPayment').addEventListener('change', ()=>{ paginationState.orders = 1; render(); });
document.getElementById('orderFromDate').addEventListener('change', ()=>{ paginationState.orders = 1; render(); });
document.getElementById('orderToDate').addEventListener('change', ()=>{ paginationState.orders = 1; render(); });
document.getElementById('orderTodayBtn').addEventListener('click', ()=>{
  const todayKey = dateKeyFromTimestamp(Date.now());
  document.getElementById('orderFromDate').value = todayKey;
  document.getElementById('orderToDate').value = todayKey;
  render();
});
document.getElementById('orderClearFilterBtn').addEventListener('click', ()=>{
  document.getElementById('orderSearch').value = '';
  document.getElementById('orderFilterPayment').value = '';
  document.getElementById('orderFromDate').value = '';
  document.getElementById('orderToDate').value = '';
  if(!document.getElementById('orderFilterStaff').disabled) document.getElementById('orderFilterStaff').value = '';
  render();
});

document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('view-'+tab.dataset.view).classList.add('active');
  });
});

document.getElementById('addComboBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('koName').value.trim();
  const desc = document.getElementById('koDesc').value.trim();
  const productId = Number(document.getElementById('koProduct').value)||0;
  const product = products.find(x=>x.id===productId);
  const unit = product ? product.unit : 'kg';
  const baseKg = Number(document.getElementById('koBaseKg').value)||0;
  const unitPrice = (Number(document.getElementById('koUnitPrice').value)||0) * 1000;
  const offerType = document.getElementById('koOfferType').value;
  const rawVal = Number(document.getElementById('koOfferValue').value)||0;
  const offerValue = offerType==='money' ? rawVal*1000 : rawVal;
  const giftProductId = Number(document.getElementById('koGiftProduct').value)||0;
  const giftQty = giftProductId ? (Number(document.getElementById('koGiftQty').value)||0) : 0;

  if(!name || !productId || !baseKg || !unitPrice){ appAlert('Vui lòng nhập tên combo, chọn sản phẩm, số lượng gốc và đơn giá.', {type:'warning', title:'Thiếu thông tin'}); return; }

  const payload = { name, desc, productId, unit, baseKg, unitPrice, offerType, offerValue, giftProductId: giftProductId||null, giftQty };
  try{
    if(editingComboId) await CrmApi.combos.update(editingComboId, payload);
    else await CrmApi.combos.create(payload);
  } catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi lưu combo'}); return; }
  resetComboForm();
  closeComboModal();
  await loadAllData();
});
document.getElementById('cancelComboEditBtn').addEventListener('click', closeComboModal);

document.getElementById('openAddComboBtn').addEventListener('click', ()=>{
  if(products.length === 0){
    appAlert('Kho hàng chưa có sản phẩm nào.\n\nCombo ưu đãi cần dựa trên 1 sản phẩm có sẵn trong kho (kèm đơn giá) để tính giá gốc, nên bạn cần vào tab "📦 Kho hàng" thêm ít nhất 1 sản phẩm (VD: Gạo ST25, giá bán...) trước khi tạo combo.\n\nHệ thống sẽ tự chuyển bạn sang tab Kho hàng ngay bây giờ.', {type:'warning', title:'Chưa có sản phẩm'});
    document.getElementById('warehouseTab').click();
    return;
  }
  resetComboForm();
  openComboModal();
});
document.getElementById('closeComboModal').addEventListener('click', closeComboModal);
document.getElementById('comboModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'comboModalOverlay') closeComboModal();
});

document.querySelectorAll('#koOfferTypeBtns .btn').forEach(btn=>{
  btn.addEventListener('click', ()=> setComboOfferType(btn.dataset.offer));
});
document.getElementById('koProduct').addEventListener('change', onComboProductChange);
['koBaseKg','koUnitPrice','koOfferValue'].forEach(id=>{
  document.getElementById(id).addEventListener('input', updateComboCalc);
});

document.getElementById('openAddProductBtn').addEventListener('click', ()=>{
  resetProductForm();
  openProductModal();
});
document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
document.getElementById('productModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'productModalOverlay') closeProductModal();
});

document.getElementById('addProductBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('pName').value.trim();
  const unit = document.getElementById('pUnit').value;
  const minStock = Number(document.getElementById('pMinStock').value) || 0;
  const sellPrice = (Number(document.getElementById('pSellPrice').value) || 0) * 1000;
  const note = document.getElementById('pNote').value.trim();
  if(!name){ appAlert('Vui lòng nhập tên sản phẩm.', {type:'warning', title:'Thiếu thông tin'}); return; }

  const payload = { name, unit, minStock, sellPrice, note };
  try{
    if(editingProductId) await CrmApi.products.update(editingProductId, payload);
    else await CrmApi.products.create(payload);
  } catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi lưu sản phẩm'}); return; }
  resetProductForm();
  closeProductModal();
  await loadAllData();
});
document.getElementById('pUnit').addEventListener('change', updatePSellPriceSuffix);
document.getElementById('cancelProductEditBtn').addEventListener('click', closeProductModal);

document.getElementById('openAddStockBtn').addEventListener('click', ()=>{
  resetStockEntryForm();
  openStockModal();
});
document.getElementById('closeStockModal').addEventListener('click', closeStockModal);
document.getElementById('stockModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'stockModalOverlay') closeStockModal();
});

document.getElementById('whTypeNhapBtn').addEventListener('click', ()=>setStockType('nhap'));
document.getElementById('whTypeXuatBtn').addEventListener('click', ()=>setStockType('xuat'));

document.getElementById('addStockEntryBtn').addEventListener('click', async ()=>{
  const type = document.getElementById('whType').value;
  const productId = document.getElementById('whProduct').value;
  const qty = Number(document.getElementById('whQty').value) || 0;
  const unitPrice = (document.getElementById('whPrice').value || 0) * 1000;
  const supplier = document.getElementById('whSupplier').value.trim();
  const date = document.getElementById('whDate').value;
  const note = document.getElementById('whNote').value.trim();

  if(!productId){ appAlert('Vui lòng chọn sản phẩm.', {type:'warning', title:'Thiếu thông tin'}); return; }
  if(!qty){ appAlert('Vui lòng nhập số lượng.', {type:'warning', title:'Thiếu thông tin'}); return; }
  if(type === 'xuat'){
    const currentStock = getProductStock(Number(productId));
    const editingQty = editingStockId ? (stockEntries.find(x=>x.id===editingStockId)?.type === 'xuat' ? stockEntries.find(x=>x.id===editingStockId).qty : 0) : 0;
    if(qty > currentStock + editingQty){
      const ok = await appConfirm(
        `Tồn kho hiện chỉ còn ${(currentStock+editingQty).toLocaleString('vi-VN')}. Vẫn tiếp tục xuất ${qty.toLocaleString('vi-VN')}?`,
        {type:'warning', title:'⚠️ Không đủ hàng trong kho', okText:'Vẫn xuất kho', cancelText:'Hủy'}
      );
      if(!ok) return;
    }
  }

  const payload = { type, productId: Number(productId), qty, unitPrice: Number(unitPrice), supplier, date, note };
  try{
    if(editingStockId) await CrmApi.stockEntries.update(editingStockId, payload);
    else await CrmApi.stockEntries.create(payload);
  } catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi lưu phiếu kho'}); return; }
  resetStockEntryForm();
  closeStockModal();
  await loadAllData();
});
document.getElementById('cancelStockEditBtn').addEventListener('click', closeStockModal);
document.getElementById('whSearch').addEventListener('input', ()=>{ paginationState.stock = 1; renderStockLedger(); });
document.getElementById('whFilterType').addEventListener('change', ()=>{ paginationState.stock = 1; renderStockLedger(); });
document.getElementById('whFilterProduct').addEventListener('change', ()=>{ paginationState.stock = 1; renderStockLedger(); });
document.getElementById('whFilterFrom').addEventListener('change', ()=>{ paginationState.stock = 1; renderStockLedger(); });
document.getElementById('whFilterTo').addEventListener('change', ()=>{ paginationState.stock = 1; renderStockLedger(); });
document.getElementById('exportWhExcelBtn').addEventListener('click', exportWarehouseExcel);

document.getElementById('exportCfExcelBtn').addEventListener('click', exportCashflowExcel);
document.getElementById('cfTodayBtn').addEventListener('click', ()=>{
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('cfFilterFrom').value = today;
  document.getElementById('cfFilterTo').value = today;
  paginationState.cashflow = 1;
  renderCashflow();
});
const cfClearBtn = document.getElementById('cfClearFilterBtn');
if(cfClearBtn){
  cfClearBtn.addEventListener('click', ()=>{
    document.getElementById('cfFilterFrom').value = '';
    document.getElementById('cfFilterTo').value = '';
    paginationState.cashflow = 1;
    renderCashflow();
  });
}

document.getElementById('acName').addEventListener('change', ()=>{
  document.getElementById('acNameCustom').style.display =
    document.getElementById('acName').value === 'KHAC' ? 'block' : 'none';
});

document.getElementById('addAccountBtn').addEventListener('click', async ()=>{
  const nameSel = document.getElementById('acName').value;
  const resource = nameSel === 'KHAC' ? document.getElementById('acNameCustom').value.trim() : nameSel;
  const username = document.getElementById('acUser').value.trim();
  const password = document.getElementById('acPass').value.trim();
  if(!resource || !username || !password){ appAlert('Vui lòng nhập đầy đủ tên tài nguyên, tên đăng nhập và mật khẩu.', {type:'warning', title:'Thiếu thông tin'}); return; }

  const payload = { resource, username, password };
  try{
    if(editingAccountId) await CrmApi.socialAccounts.update(editingAccountId, payload);
    else await CrmApi.socialAccounts.create(payload);
  } catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi lưu tài khoản'}); return; }
  resetAccountForm();
  closeAccountModal();
  await loadAllData();
});
document.getElementById('cancelAccountEditBtn').addEventListener('click', closeAccountModal);

document.getElementById('openAddAccountBtn').addEventListener('click', ()=>{
  resetAccountForm();
  openAccountModal();
});
document.getElementById('closeAccountModal').addEventListener('click', closeAccountModal);
document.getElementById('accountModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'accountModalOverlay') closeAccountModal();
});

document.getElementById('cfTypeExpenseBtn').addEventListener('click', ()=>setExpenseType('chi_phi'));
document.getElementById('cfTypeCapitalBtn').addEventListener('click', ()=>setExpenseType('von'));
document.getElementById('cfTypeRefundBtn').addEventListener('click', ()=>setExpenseType('hoan_von'));

document.getElementById('addExpenseBtn').addEventListener('click', async ()=>{
  const type = document.getElementById('cfType').value;
  const name = document.getElementById('cfName').value.trim();
  const amount = (Number(document.getElementById('cfAmount').value) || 0) * 1000;
  const date = document.getElementById('cfDate').value;
  const note = document.getElementById('cfNote').value.trim();
  if(!name || !amount){ appAlert('Vui lòng nhập tên khoản mục và số tiền.', {type:'warning', title:'Thiếu thông tin'}); return; }

  // Lưu ý: backend gọi field này là "kind", frontend gọi là "type" -> đổi tên khi gửi lên API
  const payload = { kind: type, name, amount: Number(amount), date, note };
  try{
    if(editingExpenseId) await CrmApi.expenses.update(editingExpenseId, payload);
    else await CrmApi.expenses.create(payload);
  } catch(err){ appAlert(err.message, {type:'danger', title:'Lỗi lưu khoản mục'}); return; }
  resetExpenseForm();
  closeExpenseModal();
  await loadAllData();
});
document.getElementById('cancelExpenseEditBtn').addEventListener('click', closeExpenseModal);

document.getElementById('openAddExpenseBtn').addEventListener('click', ()=>{
  resetExpenseForm();
  openExpenseModal();
});
document.getElementById('closeExpenseModal').addEventListener('click', closeExpenseModal);
document.getElementById('expenseModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'expenseModalOverlay') closeExpenseModal();
});
document.getElementById('cfSearch').addEventListener('input', ()=>{ paginationState.cashflow = 1; renderCashflow(); });
document.getElementById('cfFilterKind').addEventListener('change', ()=>{ paginationState.cashflow = 1; renderCashflow(); });
document.getElementById('cfFilterFrom').addEventListener('change', ()=>{ paginationState.cashflow = 1; renderCashflow(); });
document.getElementById('cfFilterTo').addEventListener('change', ()=>{ paginationState.cashflow = 1; renderCashflow(); });

/* ===== Đăng nhập / Đăng ký / Phân quyền ===== */

function showAuth(){
  document.getElementById('authOverlay').classList.remove('hidden');
}
function hideAuth(){
  document.getElementById('authOverlay').classList.add('hidden');
}
function showLoginForm(){
  document.getElementById('registerForm').classList.remove('active');
  document.getElementById('loginForm').classList.add('active');
  document.getElementById('loginError').classList.remove('show');
}
function showRegisterForm(){
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('registerForm').classList.add('active');
  document.getElementById('registerError').classList.remove('show');
}

function populateCustFilterStaff(){
  populateStaffFilterSelect('custFilterStaff');
  populateStaffFilterSelect('cskhFilterStaff');
  populateStaffFilterSelect('orderFilterStaff');
}

function populateStaffFilterSelect(selectId){
  const sel = document.getElementById(selectId);
  if(!sel) return;
  const isAdmin = currentUser && currentUser.role === 'admin';
  if(isAdmin){
    sel.innerHTML = `<option value="">Tất cả nhân viên</option>` +
      Object.entries(staffLabel).map(([key,label])=>`<option value="${key}">${escapeHtml(label)}</option>`).join('') +
      `<option value="none">Chưa phân công</option>`;
    sel.disabled = false;
  } else if(currentUser && staffLabel[currentUser.username]){
    // Nhân viên: chỉ được xem khách hàng của chính mình, không đổi được bộ lọc
    sel.innerHTML = `<option value="${currentUser.username}">${escapeHtml(staffLabel[currentUser.username])}</option>`;
    sel.value = currentUser.username;
    sel.disabled = true;
  } else {
    sel.innerHTML = `<option value="">Tất cả nhân viên</option>`;
    sel.disabled = true;
  }
}

function applyRolePermissions(){
  const isAdmin = currentUser && currentUser.role === 'admin';
  populateCustFilterStaff();
  document.getElementById('accountsTab').style.display = isAdmin ? '' : 'none';
  document.getElementById('combosTab').style.display = isAdmin ? '' : 'none';
  document.getElementById('cashflowTab').style.display = isAdmin ? '' : 'none';
  document.getElementById('warehouseTab').style.display = isAdmin ? '' : 'none';
  // Nếu đang ở tab không được phép mà không phải admin, chuyển về tab Khách hàng
  if(!isAdmin && (document.getElementById('view-accounts').classList.contains('active') || document.getElementById('view-combos').classList.contains('active') || document.getElementById('view-cashflow').classList.contains('active') || document.getElementById('view-warehouse').classList.contains('active'))){
    document.querySelector('.tab[data-view="customers"]').click();
  }
  document.querySelectorAll('#customerTableHolder .row-action[data-action="delete"], #cskhTableHolder .row-action[data-action="delete"]').forEach(btn=>{
    btn.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('#customerTableHolder .row-action[data-action="transfer"], #cskhTableHolder .row-action[data-action="transfer"]').forEach(btn=>{
    btn.style.display = isAdmin ? '' : 'none';
  });
}

function updateUserBadge(){
  if(!currentUser) return;
  document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
  document.getElementById('userName').textContent = currentUser.username;
  document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Nhân viên';
}

// Đăng nhập THẬT qua backend: gọi POST /auth/login, lưu JWT token, rồi tải
// toàn bộ dữ liệu thật của tài khoản này về (loadAllData()).
async function loginUser(username, password){
  let res;
  try{
    res = await CrmApi.auth.login(username, password);
  } catch(err){
    document.getElementById('loginError').textContent = err.message || 'Sai tên đăng nhập hoặc mật khẩu.';
    document.getElementById('loginError').classList.add('show');
    return;
  }
  CrmApi.setToken(res.accessToken);
  currentUser = res.user; // { id, username, role }
  updateUserBadge();
  hideAuth();
  await loadAllData();
  // applyRolePermissions() được render() (bên trong loadAllData) tự gọi lại,
  // nên không cần gọi riêng ở đây.
}

document.getElementById('loginBtn').addEventListener('click', ()=>{
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if(!username || !password){
    document.getElementById('loginError').textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
    document.getElementById('loginError').classList.add('show');
    return;
  }
  loginUser(username, password);
});
document.getElementById('loginPass').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') document.getElementById('loginBtn').click();
});

// Tự đăng ký tài khoản NHÂN VIÊN mới qua backend (POST /auth/register — công khai,
// LUÔN tạo role='staff' dù form có ô chọn role, để không ai tự đăng ký thành admin).
document.getElementById('registerBtn').addEventListener('click', async ()=>{
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const errEl = document.getElementById('registerError');
  if(!username || !password){
    errEl.textContent = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
    errEl.classList.add('show');
    return;
  }
  if(password.length < 6){
    errEl.textContent = 'Mật khẩu tối thiểu 6 ký tự.';
    errEl.classList.add('show');
    return;
  }
  try{
    await CrmApi.auth.register(username, password);
  } catch(err){
    errEl.textContent = err.message || 'Không đăng ký được, vui lòng thử lại.';
    errEl.classList.add('show');
    return;
  }
  errEl.classList.remove('show');
  showLoginForm();
  document.getElementById('loginUser').value = username;
  document.getElementById('loginPass').value = '';
  document.getElementById('regUser').value = '';
  document.getElementById('regPass').value = '';
});

document.getElementById('goRegister').addEventListener('click', showRegisterForm);
document.getElementById('goLogin').addEventListener('click', showLoginForm);

// Cho phép đổi địa chỉ backend NGAY LÚC CHẠY (quan trọng với bản .exe/Electron —
// build 1 lần, nhưng người dùng có thể cần trỏ sang backend khác sau này, vd đổi
// nhà cung cấp hosting). Lưu vào localStorage nên chỉ cần đổi 1 lần / máy.
function updateServerConfigLabel(){
  const el = document.getElementById('serverConfigLabel');
  if(el) el.textContent = 'Đang kết nối: ' + CrmApi.getApiBase();
}
document.getElementById('openServerConfig').addEventListener('click', ()=>{
  const current = CrmApi.getApiBase();
  const next = window.prompt('Nhập địa chỉ máy chủ backend (API):', current);
  if(next === null) return; // bấm Hủy
  const trimmed = next.trim();
  if(!trimmed) return;
  CrmApi.setApiBase(trimmed);
  updateServerConfigLabel();
  appAlert('Đã lưu địa chỉ máy chủ mới:\n' + trimmed + '\n\nVui lòng đăng nhập lại.', {type:'success', title:'✅ Đã cập nhật'});
});
updateServerConfigLabel();

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  CrmApi.clearToken();
  currentUser = null;
  customers = []; combos = []; accounts = []; expenses = []; products = []; stockEntries = []; users = []; userIdByUsername = {};
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  showLoginForm();
  
fixAutofilledCredentials();
setupDefaultCredentialsHelper();
setTimeout(fixAutofilledCredentials, 100);
setTimeout(fixAutofilledCredentials, 400);
setTimeout(fixAutofilledCredentials, 1000);
showAuth();
});

document.getElementById('confirmTransferBtn').addEventListener('click', async ()=>{
  if(!transferCustomerId) return;
  const staffUsername = document.getElementById('transferStaff').value;
  const staffUserId = staffUsernameToId(staffUsername);
  try{
    await CrmApi.customers.transfer(transferCustomerId, staffUserId);
  } catch(err){
    appAlert(err.message, {type:'danger', title:'Lỗi chuyển giao'});
    return;
  }
  closeTransferModal();
  await loadAllData();
});
document.getElementById('cancelTransferBtn').addEventListener('click', closeTransferModal);
document.getElementById('closeTransferModal').addEventListener('click', closeTransferModal);
document.getElementById('transferModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'transferModalOverlay') closeTransferModal();
});

document.getElementById('cfDate').value = new Date().toISOString().slice(0,10);
document.getElementById('whDate').value = new Date().toISOString().slice(0,10);
setStockType('nhap');
setComboOfferType('percent');


/* ================= TÍNH NĂNG XUẤT DỮ LIỆU JSON ================= */
// Xuất file JSON theo từng category hoặc toàn bộ
async function exportCategoryJson(category) {
  try {
    const data = await CrmApi.dataImport.exportJson(category);
    let fileName = 'crm_data.json';
    if (category === 'customers') fileName = 'customers.json';
    else if (category === 'combos') fileName = 'combos.json';
    else if (category === 'products') fileName = 'products.json';
    else if (category === 'stock-entries') fileName = 'stock-entries.json';
    else if (category === 'expenses') fileName = 'expenses.json';
    else fileName = `crm_saoluu_${new Date().toISOString().slice(0, 10)}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    appAlert(`Đã xuất file ${fileName} thành công!`, { title: 'Xuất dữ liệu' });
  } catch (err) {
    appAlert('Không thể xuất dữ liệu: ' + err.message, { type: 'danger', title: 'Lỗi xuất dữ liệu' });
  }
}

// Gắn sự kiện cho các nút Xuất JSON
function setupImportExportEvents() {
  const exportCust = document.getElementById('exportFullJsonBtn');
  if (exportCust) exportCust.addEventListener('click', () => exportCategoryJson('customers'));

  const exportOrders = document.getElementById('exportOrdersJsonBtn');
  if (exportOrders) exportOrders.addEventListener('click', () => exportCategoryJson('customers'));

  const exportCskh = document.getElementById('exportCskhJsonBtn');
  if (exportCskh) exportCskh.addEventListener('click', () => exportCategoryJson('customers'));

  const exportCombos = document.getElementById('exportCombosJsonBtn');
  if (exportCombos) exportCombos.addEventListener('click', () => exportCategoryJson('combos'));

  const exportProducts = document.getElementById('exportProductsJsonBtn');
  if (exportProducts) exportProducts.addEventListener('click', () => exportCategoryJson('products'));
}
setupImportExportEvents();

initEmptyUI();
showAuth();

/* ================= HIỆU ỨNG RIPPLE CHO NÚT BẤM ================= */
document.addEventListener('click', function(e){
  const btn = e.target.closest('.btn, .btn-secondary, .today-btn, .export-btn, .stage-btn, .tab, .row-action, .group-toggle-btn, .cf-type-btn');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const dot = document.createElement('span');
  dot.className = 'ripple-dot';
  dot.style.width = dot.style.height = size + 'px';
  dot.style.left = (e.clientX - rect.left - size/2) + 'px';
  dot.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(dot);
  setTimeout(()=>dot.remove(), 600);
});


// Event listeners cho modal hóa đơn
if(document.getElementById('closeInvoiceModal')){
  document.getElementById('closeInvoiceModal').addEventListener('click', closeInvoiceModal);
}
if(document.getElementById('closeInvoiceBtn')){
  document.getElementById('closeInvoiceBtn').addEventListener('click', closeInvoiceModal);
}
if(document.getElementById('invoiceCheckPaymentBtn')){
  document.getElementById('invoiceCheckPaymentBtn').addEventListener('click', checkInvoicePaymentManual);
}
// Nút in hóa đơn ra giấy (có chữ ký)
if(document.getElementById('printInvoiceBtn')){
  document.getElementById('printInvoiceBtn').addEventListener('click', ()=> printInvoice(currentInvoiceCustomer));
}
if(document.getElementById('printInvoiceBtnBottom')){
  document.getElementById('printInvoiceBtnBottom').addEventListener('click', ()=> printInvoice(currentInvoiceCustomer));
}
// Nút xuất file PDF (KHÔNG có chữ ký)
if(document.getElementById('exportPdfBtn')){
  document.getElementById('exportPdfBtn').addEventListener('click', ()=> exportPdf(currentInvoiceCustomer));
}
if(document.getElementById('exportPdfBtnBottom')){
  document.getElementById('exportPdfBtnBottom').addEventListener('click', ()=> exportPdf(currentInvoiceCustomer));
}
// Chuyển đổi chế độ xem trước (có chữ ký vs không chữ ký)
if(document.getElementById('invoicePreviewPrint')){
  document.getElementById('invoicePreviewPrint').addEventListener('change', ()=>{
    invoicePreviewIncludeSignatures = true;
    updateInvoicePreview();
  });
}
if(document.getElementById('invoicePreviewExport')){
  document.getElementById('invoicePreviewExport').addEventListener('change', ()=>{
    invoicePreviewIncludeSignatures = false;
    updateInvoicePreview();
  });
}
if(document.getElementById('invoiceModalOverlay')){
  document.getElementById('invoiceModalOverlay').addEventListener('click', (e)=>{
    if(e.target.id === 'invoiceModalOverlay') closeInvoiceModal();
  });
}

/* ==========================================================================
   KHỞI TẠO VÀ XỬ LÝ TRỢ LÝ AI (AI COPILOT)
   ========================================================================== */
const aiChatHistory = [];

function initAiChat() {
  const bubble = document.getElementById('aiChatBubble');
  const win = document.getElementById('aiChatWindow');
  const closeBtn = document.getElementById('aiCloseBtn');
  const settingsBtn = document.getElementById('aiSettingsBtn');
  const settingsPanel = document.getElementById('aiSettingsPanel');
  const apiKeyInput = document.getElementById('aiApiKeyInput');
  const saveKeyBtn = document.getElementById('aiSaveKeyBtn');
  const clearKeyBtn = document.getElementById('aiClearKeyBtn');
  const messagesEl = document.getElementById('aiChatMessages');
  const inputEl = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiSendBtn');
  const chipsContainer = document.getElementById('aiQuickChips');

  if (!bubble || !win) return;

  // Tải API Key đã lưu (nếu có)
  const savedKey = localStorage.getItem('vigen_gemini_api_key') || '';
  if (apiKeyInput) apiKeyInput.value = savedKey;

  // Mở / Đóng chat window
  bubble.addEventListener('click', () => {
    win.classList.toggle('active');
    if (win.classList.contains('active') && inputEl) {
      inputEl.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      win.classList.remove('active');
    });
  }

  // Mở / Đóng Settings Panel
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Lưu Key
  if (saveKeyBtn && apiKeyInput) {
    saveKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        localStorage.setItem('vigen_gemini_api_key', key);
        appAlert('Đã lưu API Key AI thành công!', { type: 'success', title: '⚙️ Cài đặt AI' });
      } else {
        localStorage.removeItem('vigen_gemini_api_key');
        appAlert('Đã xóa API Key.', { type: 'info', title: '⚙️ Cài đặt AI' });
      }
      if (settingsPanel) settingsPanel.style.display = 'none';
    });
  }

  if (clearKeyBtn && apiKeyInput) {
    clearKeyBtn.addEventListener('click', () => {
      apiKeyInput.value = '';
      localStorage.removeItem('vigen_gemini_api_key');
      appAlert('Đã xóa API Key.', { type: 'info', title: '⚙️ Cài đặt AI' });
      if (settingsPanel) settingsPanel.style.display = 'none';
    });
  }

  // Gợi ý nhanh (Quick chips)
  if (chipsContainer) {
    chipsContainer.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          sendUserMessage(prompt);
        }
      });
    });
  }

  // Gửi tin nhắn
  function sendUserMessage(text) {
    const msg = (text || (inputEl ? inputEl.value : '') || '').trim();
    if (!msg) return;

    if (inputEl) inputEl.value = '';

    // Append tin nhắn User
    appendAiMessage('user', msg);
    aiChatHistory.push({ role: 'user', content: msg });

    // Hiển thị typing indicator
    const typingEl = showTypingIndicator();

    if (sendBtn) sendBtn.disabled = true;

    const apiKey = localStorage.getItem('vigen_gemini_api_key') || undefined;

    CrmApi.ai.chat({ message: msg, history: aiChatHistory, apiKey })
      .then(res => {
        removeTypingIndicator(typingEl);
        if (sendBtn) sendBtn.disabled = false;
        const reply = res.reply || 'Xin lỗi, tôi chưa hiểu ý bạn.';
        appendAiMessage('bot', reply);
        aiChatHistory.push({ role: 'model', content: reply });
      })
      .catch(err => {
        removeTypingIndicator(typingEl);
        if (sendBtn) sendBtn.disabled = false;
        appendAiMessage('bot', `⚠️ Lỗi: Không thể kết nối tới máy chủ AI (${err.message || 'Lỗi mạng'}).`);
      });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => sendUserMessage());
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendUserMessage();
      }
    });
  }

  function appendAiMessage(role, text) {
    if (!messagesEl) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ai-msg-${role}`;
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'ai-msg-bubble';

    // Format markdown đơn giản: **bold**, *italic*, \n
    let formatted = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    bubbleDiv.innerHTML = formatted;
    msgDiv.appendChild(bubbleDiv);
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTypingIndicator() {
    if (!messagesEl) return null;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-msg ai-msg-bot';
    typingDiv.id = 'aiTypingIndicator';
    typingDiv.innerHTML = `
      <div class="ai-msg-bubble" style="padding:8px 12px;">
        <div class="ai-typing-indicator">
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
        </div>
      </div>
    `;
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return typingDiv;
  }

  function removeTypingIndicator(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

// Khởi chạy Trợ lý AI ngay khi tải xong
initAiChat();
