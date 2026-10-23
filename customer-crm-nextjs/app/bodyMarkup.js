// Auto-extracted original body markup (auth overlay + main app shell).
// Kept verbatim from the original HTML so all element IDs referenced by legacy/app.js remain intact.
const bodyMarkup = `
<div class="auth-overlay" id="authOverlay">
  <div class="auth-blob b1"></div>
  <div class="auth-blob b2"></div>
  <div class="auth-blob b3"></div>
  <svg class="auth-illustration" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 105 Q40 150 100 155 Q160 150 160 105 Z"/>
      <path d="M40 105 Q100 120 160 105"/>
      <path d="M55 105 Q100 95 145 105" stroke-width="1.4" opacity="0.7"/>
      <path d="M85 70 Q80 55 88 42 M100 68 Q98 50 108 36 M115 70 Q118 54 112 40" stroke-width="2" opacity="0.8"/>
    </g>
    <g fill="#ffffff" opacity="0.9">
      <ellipse cx="70" cy="118" rx="5" ry="2.6"/>
      <ellipse cx="90" cy="128" rx="5" ry="2.6"/>
      <ellipse cx="112" cy="120" rx="5" ry="2.6"/>
      <ellipse cx="130" cy="130" rx="5" ry="2.6"/>
      <ellipse cx="100" cy="112" rx="5" ry="2.6"/>
    </g>
  </svg>
  <div class="auth-box">
    <div class="auth-form active" id="loginForm">
      <h1>🔐 Đăng nhập</h1>
      <div class="auth-sub">Quản Lý Khách Hàng — Vị Nguyên Food</div>
      <label for="loginUser">Tên đăng nhập</label>
      <input id="loginUser" placeholder="admin" autocomplete="off" spellcheck="false">
      <label for="loginPass">Mật khẩu</label>
      <input id="loginPass" type="password" placeholder="••••••••" autocomplete="new-password">
      <div class="auth-error" id="loginError">Sai tên đăng nhập hoặc mật khẩu.</div>
      <button class="btn" id="loginBtn">Đăng nhập</button>
      <div style="margin-top:12px;font-size:12px;color:var(--text-light,#526b7e);text-align:center;">
        💡 Tài khoản mặc định: <a id="fillDefaultAdminBtn" style="color:var(--accent,#1a6b9a);font-weight:600;cursor:pointer;text-decoration:underline;">admin / admin123</a> (bấm để điền)
      </div>
      <div class="auth-switch">Chưa có tài khoản? <a id="goRegister">Đăng ký ngay</a></div>
      <div class="auth-switch" style="margin-top:4px;font-size:12px;opacity:0.8">
        <a id="openServerConfig">⚙️ Đổi địa chỉ máy chủ</a>
        <span id="serverConfigLabel" style="display:block;margin-top:2px;color:inherit;opacity:0.7"></span>
      </div>
    </div>

    <div class="auth-form" id="registerForm">
      <h1>📝 Đăng ký</h1>
      <div class="auth-sub">Tạo tài khoản nhân viên mới</div>
      <label for="regUser">Tên đăng nhập</label>
      <input id="regUser" placeholder="VD: ngoc_thuong">
      <label for="regPass">Mật khẩu</label>
      <input id="regPass" type="password" placeholder="••••••••">
      <label for="regRole">Vai trò</label>
      <select id="regRole" style="display:none">
        <option value="staff" selected>Nhân viên</option>
      </select>
      <p style="margin:4px 0 10px;font-size:13px;color:var(--muted,#6b8ba3)">
        Tài khoản tự đăng ký luôn ở vai trò <strong>Nhân viên</strong>. Muốn tạo tài khoản Quản trị viên, liên hệ admin hiện tại để được cấp qua mục "Tài khoản đăng nhập".
      </p>
      <div class="auth-error" id="registerError">Vui lòng kiểm tra lại thông tin.</div>
      <button class="btn" id="registerBtn">Tạo tài khoản</button>
      <div class="auth-switch">Đã có tài khoản? <a id="goLogin">Đăng nhập</a></div>
    </div>
  </div>
</div>

<div class="wrap">

  <div class="sticky-head">
  <header>
    <div class="brand">
      <div class="brand-mark"><img src="/assets/logo.png" alt="Vị Nguyên Food"></div>
      <div class="brand-info">
        <h1>Quản Lý Khách Hàng <span class="brand-highlight">— VỊ NGUYÊN FOOD</span></h1>
        <div class="brand-slogan">Từ giọt phù sa đến bàn ăn người Việt</div>
      </div>
    </div>
    <div class="header-right">
      <div class="user-badge" id="userBadge">
        <span class="avatar" id="userAvatar">?</span>
        <span id="userName">—</span>
        <span class="role-pill" id="userRole">—</span>
        <button class="logout-btn" id="logoutBtn" title="Đăng xuất">⎋</button>
      </div>
      <div class="stats">
        <div class="stat"><div class="num" id="statTotal">0</div><div class="lbl">Tổng khách</div></div>
        <div class="stat"><div class="num" id="statCskh">0</div><div class="lbl">Đang CSKH</div></div>
        <div class="stat"><div class="num" id="statOld">0</div><div class="lbl">Khách cũ</div></div>
        <div class="stat"><div class="num" id="statLead">0</div><div class="lbl">Tiềm năng</div></div>
      </div>
    </div>
  </header>

  <div class="tabs">
    <div class="tab active" data-view="customers">👤 Khách hàng</div>
    <div class="tab" data-view="orders" id="ordersTab">🧾 Đơn hàng</div>
    <div class="tab" data-view="cskh" id="cskhTab">🤝 Chăm sóc khách hàng</div>
    <div class="tab" data-view="combos" id="combosTab">🎁 Combo ưu đãi</div>
    <div class="tab" data-view="warehouse" id="warehouseTab">📦 Kho hàng</div>
    <div class="tab" data-view="cashflow" id="cashflowTab">💰 Dòng tiền</div>
    <div class="tab" data-view="accounts" id="accountsTab">🔑 Tài khoản quản trị</div>
  </div>
  </div>

  <div class="view active" id="view-customers">
  <div class="card" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
    <h2 style="margin:0;">Danh sách khách hàng — đã phát sinh đơn</h2>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button class="btn btn-secondary export-btn" id="exportFullJsonBtn" type="button" style="margin:0;width:auto;padding:10px 16px;">📤 Xuất JSON</button>
      <button class="btn" id="openAddCustomerBtn" style="margin:0;width:auto;padding:10px 20px;">+ Thêm khách hàng</button>
    </div>
  </div>
  <div class="card">
      <div class="toolbar">
        <input id="custSearch" placeholder="🔍 Tìm theo tên hoặc SĐT..." style="min-width:200px;">
        <select id="custFilterType" style="min-width:125px;">
          <option value="">Tất cả phân loại</option>
          <option value="moi">Khách mới</option>
          <option value="cu">Khách cũ</option>
          <option value="tiemnang">Khách tiềm năng</option>
        </select>
        <select id="custFilterStaff" style="min-width:125px;">
          <option value="">Tất cả nhân viên</option>
          <option value="hai_em">Hải Em</option>
          <option value="ngoc_thuong">Ngọc Thương</option>
          <option value="ai_thi">Ái Thi</option>
          <option value="tan_phat">Tấn Phát</option>
          <option value="none">Chưa phân công</option>
        </select>
        <select id="custFilterPayment" style="min-width:125px;">
          <option value="">Tất cả trạng thái</option>
          <option value="da_tra">✅ Đã thu</option>
          <option value="chua_tra">🕒 Công nợ</option>
        </select>
        <select id="custFilterPacked" style="min-width:125px;">
          <option value="">Đóng hàng: tất cả</option>
          <option value="da">📦 Đã đóng hàng</option>
          <option value="chua">🧺 Chưa đóng hàng</option>
        </select>
        <select id="custFilterDelivered" style="min-width:125px;">
          <option value="">Giao hàng: tất cả</option>
          <option value="da">🚚 Đã giao hàng</option>
          <option value="chua">🕓 Chưa giao hàng</option>
        </select>
      </div>
      <div class="count" id="custCount"></div>
      <div id="customerTableHolder"></div>
  </div>
  </div>

  <div class="view" id="view-orders">
  <div class="card" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <h2 style="margin:0;">Danh sách đơn hàng</h2>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button class="btn btn-secondary export-btn" id="exportOrdersJsonBtn" type="button" style="margin:0;width:auto;padding:10px 16px;">📤 Xuất JSON</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="cf-stats" style="display:flex;gap:16px;flex-wrap:wrap;">
      <div class="cf-stat" style="flex:1;min-width:180px;">
        <div class="cf-lbl">Tổng đơn hôm nay</div>
        <div class="cf-num" id="orderTodayCount">0 đơn</div>
      </div>
      <div class="cf-stat" style="flex:1;min-width:180px;">
        <div class="cf-lbl">Tổng tiền hôm nay</div>
        <div class="cf-num" id="orderTodayValue">0đ</div>
      </div>
      <div class="cf-stat" style="flex:1;min-width:180px;">
        <div class="cf-lbl">Tổng đơn theo bộ lọc</div>
        <div class="cf-num" id="orderFilteredCount">0 đơn</div>
      </div>
      <div class="cf-stat" style="flex:1;min-width:180px;">
        <div class="cf-lbl">Tổng giá trị theo bộ lọc</div>
        <div class="cf-num" id="orderFilteredValue">0đ</div>
      </div>
    </div>
  </div>
  <div class="card">
      <div class="toolbar">
        <input id="orderSearch" placeholder="Tìm theo tên khách hàng / SĐT...">
        <select id="orderFilterStaff">
          <option value="">Tất cả nhân viên</option>
        </select>
        <select id="orderFilterPayment">
          <option value="">Tất cả trạng thái</option>
          <option value="da_tra">✅ Đã thu</option>
          <option value="chua_tra">🕒 Công nợ</option>
        </select>
      </div>
      <div class="toolbar">
        <label style="font-size:13px;color:var(--muted);white-space:nowrap;">Từ ngày</label>
        <input type="date" id="orderFromDate">
        <label style="font-size:13px;color:var(--muted);white-space:nowrap;">Đến ngày</label>
        <input type="date" id="orderToDate">
        <button class="btn btn-secondary" id="orderTodayBtn" style="width:auto;padding:8px 16px;">📅 Hôm nay</button>
        <button class="btn btn-secondary" id="orderClearFilterBtn" style="width:auto;padding:8px 16px;">Xóa lọc</button>
      </div>
      <div class="count" id="orderCount"></div>
      <div id="orderTableHolder"></div>
  </div>
  </div>

  <div class="view" id="view-cskh">
  <div class="card" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
    <h2 style="margin:0;">Chăm sóc khách hàng — chưa phát sinh đơn</h2>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button class="btn btn-secondary export-btn" id="exportCskhJsonBtn" type="button" style="margin:0;width:auto;padding:10px 16px;">📤 Xuất JSON</button>
      <button class="btn" id="openAddCskhBtn" style="margin:0;width:auto;padding:10px 20px;">+ Thêm khách hàng CSKH</button>
    </div>
  </div>
  <div class="card">
      <div class="toolbar">
        <input id="cskhSearch" placeholder="🔍 Tìm theo tên hoặc SĐT..." style="min-width:200px;">
        <select id="cskhFilterType" style="min-width:125px;">
          <option value="">Tất cả phân loại</option>
          <option value="moi">Khách mới</option>
          <option value="cu">Khách cũ</option>
          <option value="tiemnang">Khách tiềm năng</option>
        </select>
        <select id="cskhFilterStaff" style="min-width:125px;">
          <option value="">Tất cả nhân viên</option>
          <option value="hai_em">Hải Em</option>
          <option value="ngoc_thuong">Ngọc Thương</option>
          <option value="ai_thi">Ái Thi</option>
          <option value="tan_phat">Tấn Phát</option>
          <option value="none">Chưa phân công</option>
        </select>
        <select id="cskhFilterPayment" style="min-width:125px;">
          <option value="">Tất cả trạng thái</option>
          <option value="da_tra">✅ Đã thu</option>
          <option value="chua_tra">🕒 Công nợ</option>
        </select>
        <select id="cskhFilterPacked" style="min-width:125px;">
          <option value="">Đóng hàng: tất cả</option>
          <option value="da">📦 Đã đóng hàng</option>
          <option value="chua">🧺 Chưa đóng hàng</option>
        </select>
        <select id="cskhFilterDelivered" style="min-width:125px;">
          <option value="">Giao hàng: tất cả</option>
          <option value="da">🚚 Đã giao hàng</option>
          <option value="chua">🕓 Chưa giao hàng</option>
        </select>
      </div>
      <div class="count" id="cskhCount"></div>
      <div id="cskhTableHolder"></div>
  </div>
  </div>



  <div class="modal-overlay" id="customerModalOverlay">
    <div class="modal-box modal-box-large">
      <div class="modal-header">
        <div>
          <h2 id="custFormTitle" style="margin:0;">👤 Thêm khách hàng</h2>
          <div class="modal-subtitle">Điền thông tin khách hàng và thông tin đơn hàng</div>
        </div>
        <button class="modal-close" id="closeCustomerModal" type="button">✕</button>
      </div>

      <div class="modal-body-grid">
        <!-- CỘT 1: THÔNG TIN KHÁCH HÀNG & PHÂN CÔNG -->
        <div class="modal-col">
          <div class="form-section-title">📌 Thông tin cá nhân & Phân loại</div>

          <label for="cName">Tên khách hàng <span class="req">*</span></label>
          <input id="cName" placeholder="VD: Quán cơm Cô Tư">

          <div class="field-row">
            <div>
              <label for="cPhone">Số điện thoại</label>
              <input id="cPhone" placeholder="090xxxxxxx">
            </div>
            <div>
              <label for="cStaff">Nhân viên phụ trách</label>
              <select id="cStaff">
                <option value="">— Chưa phân công —</option>
                <option value="hai_em">Hải Em</option>
                <option value="ngoc_thuong">Ngọc Thương</option>
                <option value="ai_thi">Ái Thi</option>
                <option value="tan_phat">Tấn Phát</option>
              </select>
            </div>
          </div>

          <label for="cAddress">Địa chỉ giao hàng</label>
          <input id="cAddress" placeholder="VD: 12 Lê Lợi, Q1, TP.HCM">

          <div class="field-row">
            <div>
              <label for="cType">Phân loại khách</label>
              <select id="cType">
                <option value="moi">Khách mới</option>
                <option value="cu">Khách cũ</option>
                <option value="tiemnang">Khách tiềm năng</option>
              </select>
            </div>
            <div>
              <label for="cStage">Giai đoạn</label>
              <select id="cStage">
                <option value="cskh">🤝 Đang chăm sóc</option>
                <option value="order">✅ Đã phát sinh đơn</option>
              </select>
            </div>
          </div>

          <label for="cNote">Ghi chú về khách hàng</label>
          <textarea id="cNote" rows="3" placeholder="VD: Thích gạo dẻo thơm, hay đặt vào cuối tuần..."></textarea>
        </div>

        <!-- CỘT 2: MỐC THỜI GIAN & ĐƠN HÀNG -->
        <div class="modal-col">
          <div class="form-section-title">📅 Các mốc thời gian</div>
          <div class="field-row">
            <div>
              <label for="cAcquiredDate">Ngày tiếp nhận</label>
              <input id="cAcquiredDate" type="date">
            </div>
            <div>
              <label for="cLastOrderDate">Ngày đặt đơn</label>
              <input id="cLastOrderDate" type="date">
            </div>
          </div>
          <div class="field-row">
            <div>
              <label for="cDeliveryDate">Ngày giao hàng</label>
              <input id="cDeliveryDate" type="date">
            </div>
            <div>
              <label for="cNextContactDate">Ngày liên hệ lại</label>
              <input id="cNextContactDate" type="date">
            </div>
          </div>

          <div class="form-section-box">
            <div class="form-section-title" style="margin-top:0;">🧾 Thông tin đơn hàng (nếu có)</div>

            <label for="cProduct">Sản phẩm mua (tự trừ kho)</label>
            <select id="cProduct">
              <option value="">— Không trừ kho —</option>
            </select>

            <div class="field-row">
              <div>
                <label for="cKg">Số lượng (kg)</label>
                <select id="cKg">
                  <option value="5">5 kg</option>
                  <option value="10">10 kg</option>
                  <option value="15">15 kg</option>
                  <option value="20">20 kg</option>
                  <option value="25" selected>25 kg</option>
                  <option value="30">30 kg</option>
                  <option value="40">40 kg</option>
                  <option value="50">50 kg</option>
                  <option value="100">100 kg</option>
                  <option value="custom">Khác...</option>
                </select>
                <input id="cKgCustom" type="number" min="0" step="1" placeholder="Nhập số kg" style="display:none;margin-top:6px;">
              </div>
              <div>
                <label for="cPrice">Giá tiền</label>
                <div class="money-input">
                  <input id="cPrice" type="number" min="0" step="1" placeholder="450">
                  <span class="money-suffix">.000 đ</span>
                </div>
              </div>
            </div>

            <div class="field-row">
              <div>
                <label for="cPaymentStatus">Thanh toán</label>
                <select id="cPaymentStatus">
                  <option value="da_tra">✅ Đã thu (trả liền)</option>
                  <option value="chua_tra">🕒 Công nợ</option>
                </select>
              </div>
              <div>
                <label for="cCombo">Combo ưu đãi</label>
                <select id="cCombo">
                  <option value="">Không mua combo</option>
                </select>
              </div>
            </div>
            <div class="contact-line" id="cComboHint" style="display:none;font-size:12px;color:var(--accent-dark);margin-top:6px;font-weight:600;"></div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelEditBtn" type="button">Hủy</button>
        <button class="btn" id="addCustomerBtn" type="button">Lưu khách hàng</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="transferModalOverlay">
    <div class="modal-box" style="max-width:440px;">
      <div class="modal-header">
        <div>
          <h2 style="margin:0;">🔄 Chuyển giao khách hàng</h2>
          <div class="modal-subtitle" id="transferCustName"></div>
        </div>
        <button class="modal-close" id="closeTransferModal" type="button">✕</button>
      </div>
      <label for="transferStaff" style="margin-top:14px;">Chọn nhân viên nhận phụ trách</label>
      <select id="transferStaff">
        <option value="">— Chưa phân công —</option>
        <option value="hai_em">Hải Em</option>
        <option value="ngoc_thuong">Ngọc Thương</option>
        <option value="ai_thi">Ái Thi</option>
        <option value="tan_phat">Tấn Phát</option>
      </select>
      <div class="modal-footer" style="margin-top:20px;">
        <button class="btn btn-secondary" id="cancelTransferBtn" type="button">Hủy</button>
        <button class="btn" id="confirmTransferBtn" type="button">Xác nhận chuyển</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="warnModalOverlay">
    <div class="modal-box warn-modal-box" id="warnModalBox">
      <div class="warn-icon" id="warnModalIcon">⚠️</div>
      <h2 class="warn-title" id="warnModalTitle">Xác nhận</h2>
      <div class="warn-message" id="warnModalMessage"></div>
      <div class="warn-actions" id="warnModalActions">
        <button class="btn btn-secondary" id="warnModalCancelBtn" style="margin:0;flex:1;">Hủy</button>
        <button class="btn" id="warnModalOkBtn" style="margin:0;flex:1;">Xác nhận</button>
      </div>
    </div>
  </div>

  <div class="view" id="view-combos">
  <div class="card">
    <div class="card-header-row">
      <h2 style="margin:0;">Danh sách combo</h2>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-secondary export-btn" id="exportCombosJsonBtn" type="button" style="margin:0;width:auto;padding:10px 16px;">📤 Xuất JSON</button>
          <button class="btn" id="openAddComboBtn" style="margin:0;width:auto;padding:10px 20px;">+ Tạo combo</button>
        </div>
    </div>
    <div class="count" id="comboCount"></div>
    <div id="comboTableHolder"></div>
  </div>
  </div>

  <div class="modal-overlay" id="comboModalOverlay">
    <div class="modal-box modal-box-large">
      <div class="modal-header">
        <div>
          <h2 id="comboFormTitle" style="margin:0;">🎁 Tạo combo ưu đãi</h2>
          <div class="modal-subtitle">Thiết lập chương trình combo khuyến mãi, giảm giá và tặng kèm</div>
        </div>
        <button class="modal-close" id="closeComboModal" type="button">✕</button>
      </div>

      <div class="modal-body-grid">
        <!-- CỘT 1: THÔNG TIN SẢN PHẨM & COMBO -->
        <div class="modal-col">
          <div class="form-section-title">📌 Thông tin cơ bản Combo</div>

          <label for="koName">Tên combo <span class="req">*</span></label>
          <input id="koName" placeholder="VD: Combo Gia Đình 25kg">

          <label for="koDesc">Mô tả chi tiết</label>
          <textarea id="koDesc" rows="3" placeholder="VD: 1 bao ST25 25kg + 1 chai nước mắm truyền thống Phú Quốc"></textarea>

          <label for="koProduct">Sản phẩm đi kèm (trong kho) <span class="req">*</span></label>
          <select id="koProduct">
            <option value="">— Chọn sản phẩm trong kho —</option>
          </select>

          <div class="field-row">
            <div>
              <label for="koBaseKg">Số lượng gốc</label>
              <input id="koBaseKg" type="number" min="0" step="0.1" placeholder="25">
            </div>
            <div>
              <label for="koUnitPrice">Đơn giá / đơn vị</label>
              <div class="money-input">
                <input id="koUnitPrice" type="number" min="0" step="1" placeholder="25">
                <span class="money-suffix" id="koUnitPriceSuffix">.000 đ/kg</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CỘT 2: CHÍNH SÁCH ƯU ĐÃI & XEM TRƯỚC GIÁ -->
        <div class="modal-col">
          <div class="form-section-title">⭐ Chính sách ưu đãi & Quà tặng</div>

          <label>Loại ưu đãi áp dụng</label>
          <div class="toolbar" id="koOfferTypeBtns">
            <button type="button" class="btn btn-secondary" data-offer="percent" id="koOfferPercentBtn">🔻 Giảm %</button>
            <button type="button" class="btn btn-secondary" data-offer="kg" id="koOfferKgBtn">🎁 Tặng thêm</button>
            <button type="button" class="btn btn-secondary" data-offer="money" id="koOfferMoneyBtn">💵 Trừ tiền</button>
          </div>
          <input type="hidden" id="koOfferType" value="percent">

          <label for="koOfferValue" id="koOfferValueLbl">Giá trị ưu đãi (%)</label>
          <div class="money-input" id="koOfferValueWrap">
            <input id="koOfferValue" type="number" min="0" step="0.1" placeholder="10">
            <span class="money-suffix" id="koOfferValueSuffix">%</span>
          </div>

          <label for="koGiftProduct">Quà tặng kèm (không tính giá, tùy chọn)</label>
          <select id="koGiftProduct">
            <option value="">— Không có quà tặng kèm —</option>
          </select>

          <div id="koGiftQtyWrap" style="display:none;margin-top:8px;">
            <label for="koGiftQty">Số lượng quà tặng</label>
            <input id="koGiftQty" type="number" min="0" step="0.1" placeholder="1">
          </div>

          <!-- BẢNG XEM TRƯỚC TÍNH TOÁN GIÁ -->
          <div class="combo-preview-card">
            <div class="combo-preview-title">📊 Xem trước kết quả tính toán</div>
            <div class="combo-preview-row">
              <span>Giá gốc ban đầu:</span>
              <strong id="koCalcBase">0 đ</strong>
            </div>
            <div class="combo-preview-row">
              <span>Tổng khối lượng khách nhận:</span>
              <strong id="koCalcKg">0 kg</strong>
            </div>
            <div class="combo-preview-divider"></div>
            <div class="combo-preview-row final-row">
              <span>Giá thanh toán cuối cùng:</span>
              <strong id="koCalcFinal">0 đ</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelComboEditBtn" type="button">Hủy</button>
        <button class="btn" id="addComboBtn" type="button">Lưu combo</button>
      </div>
    </div>
  </div>

  <div class="view" id="view-warehouse">
    <div class="cf-stats">
      <div class="cf-stat wh-stat wh-count">
        <div class="cf-lbl">Loại sản phẩm</div>
        <div class="cf-num" id="whStatProducts">0</div>
      </div>
      <div class="cf-stat wh-stat wh-stock">
        <div class="cf-lbl">Tổng tồn kho (kg)</div>
        <div class="cf-num" id="whStatStock">0</div>
      </div>
      <div class="cf-stat wh-stat wh-low">
        <div class="cf-lbl">Sắp hết hàng</div>
        <div class="cf-num" id="whStatLow">0</div>
      </div>
      <div class="cf-stat wh-stat wh-value">
        <div class="cf-lbl">Giá trị tồn kho (ước tính)</div>
        <div class="cf-num" id="whStatValue">0đ</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header-row">
        <h2 style="margin:0;">Danh sách sản phẩm &amp; tồn kho</h2>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-secondary export-btn" id="exportProductsJsonBtn" type="button" style="margin:0;width:auto;padding:10px 16px;">📤 Xuất JSON</button>
          <button class="btn" id="openAddProductBtn" style="margin:0;width:auto;padding:10px 20px;">+ Thêm sản phẩm</button>
        </div>
      </div>
      <div class="count" id="productCount"></div>
      <div id="productTableHolder"></div>
    </div>

    <div class="card">
      <div class="card-header-row">
        <h2 style="margin:0;">Sổ kho (nhập / xuất)</h2>
        <div style="display:flex;gap:8px;">
          <button class="export-btn" id="exportWhExcelBtn" type="button">📥 Xuất Excel</button>
          <button class="btn" id="openAddStockBtn" style="margin:0;width:auto;padding:10px 20px;">+ Nhập / xuất kho</button>
        </div>
      </div>
      <div class="toolbar">
        <input id="whSearch" placeholder="Tìm theo sản phẩm / ghi chú...">
        <select id="whFilterType">
          <option value="">Tất cả loại</option>
          <option value="nhap">Nhập kho</option>
          <option value="xuat">Xuất kho</option>
        </select>
        <select id="whFilterProduct">
          <option value="">Tất cả sản phẩm</option>
        </select>
      </div>
      <div class="field-row" style="margin-bottom:6px;">
        <div>
          <label for="whFilterFrom">Từ ngày</label>
          <input id="whFilterFrom" type="date">
        </div>
        <div>
          <label for="whFilterTo">Đến ngày</label>
          <input id="whFilterTo" type="date">
        </div>
      </div>
      <div class="count" id="whCount"></div>
      <div id="stockTableHolder"></div>
    </div>
  </div>

  <div class="modal-overlay" id="productModalOverlay">
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="productFormTitle" style="margin:0;">🧺 Thêm sản phẩm</h2>
        <button class="modal-close" id="closeProductModal" type="button">✕</button>
      </div>
      <label for="pName">Tên sản phẩm</label>
      <input id="pName" placeholder="VD: Gạo ST25">
      <label for="pUnit">Đơn vị tính</label>
      <select id="pUnit">
        <option value="kg">kg</option>
        <option value="bao">bao</option>
        <option value="thung">thùng</option>
        <option value="chai">chai</option>
      </select>
      <label for="pMinStock">Tồn tối thiểu (cảnh báo sắp hết)</label>
      <input id="pMinStock" type="number" min="0" step="1" placeholder="VD: 50">
      <label for="pSellPrice">Giá bán</label>
      <div class="money-input">
        <input id="pSellPrice" type="number" min="0" step="1" placeholder="VD: 32">
        <span class="money-suffix" id="pSellPriceSuffix">.000 đ/kg</span>
      </div>
      <label for="pNote">Ghi chú</label>
      <textarea id="pNote" placeholder="VD: gạo dẻo, xuất xứ Sóc Trăng..."></textarea>
      <button class="btn" id="addProductBtn">Lưu sản phẩm</button>
      <button class="btn btn-secondary" id="cancelProductEditBtn">Hủy</button>
    </div>
  </div>

  <div class="modal-overlay" id="stockModalOverlay">
    <div class="modal-box" style="max-width:540px;">
      <div class="modal-header">
        <div>
          <h2 id="whEntryFormTitle" style="margin:0;">📥 Nhập / xuất kho</h2>
          <div class="modal-subtitle">Ghi nhận phiếu nhập hàng hoặc xuất kho điều chuyển</div>
        </div>
        <button class="modal-close" id="closeStockModal" type="button">✕</button>
      </div>
      <label>Loại phiếu kho</label>
      <div class="cf-type-toggle">
        <button type="button" class="cf-type-btn active" id="whTypeNhapBtn" data-type="nhap">📥 Nhập kho</button>
        <button type="button" class="cf-type-btn" id="whTypeXuatBtn" data-type="xuat">📤 Xuất kho</button>
      </div>
      <input type="hidden" id="whType" value="nhap">
      <label for="whProduct">Sản phẩm <span class="req">*</span></label>
      <select id="whProduct"></select>
      <div class="field-row">
        <div>
          <label for="whQty">Số lượng</label>
          <input id="whQty" type="number" min="0" step="1" placeholder="VD: 100">
        </div>
        <div>
          <label for="whPrice" id="whPriceLabel">Tổng giá trị</label>
          <div class="money-input">
            <input id="whPrice" type="number" min="0" step="1" placeholder="18">
            <span class="money-suffix">.000 đ</span>
          </div>
        </div>
      </div>
      <div id="whSupplierWrap">
        <label for="whSupplier">Nhà cung cấp / Đối tác</label>
        <input id="whSupplier" placeholder="VD: Đại lý gạo Tân Phát">
      </div>
      <label for="whDate">Ngày phát sinh phiếu</label>
      <input id="whDate" type="date">
      <label for="whNote">Ghi chú</label>
      <textarea id="whNote" rows="2" placeholder="Ghi chú thêm (không bắt buộc)..."></textarea>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelStockEditBtn" type="button">Hủy</button>
        <button class="btn" id="addStockEntryBtn" type="button">Lưu phiếu kho</button>
      </div>
    </div>
  </div>

  <div class="view" id="view-cashflow">
    <div class="cf-stats">
      <div class="cf-stat cf-revenue">
        <div class="cf-lbl">Tổng doanh thu</div>
        <div class="cf-num" id="cfRevenue">0đ</div>
      </div>
      <div class="cf-stat cf-expense">
        <div class="cf-lbl">Tổng chi phí bán hàng</div>
        <div class="cf-num" id="cfExpense">0đ</div>
      </div>
      <div class="cf-stat cf-capital" title="Số vốn 4 người đã ứng ra mà công ty chưa hoàn lại (Vốn đã bỏ ra − Đã hoàn vốn)">
        <div class="cf-lbl">Vốn Đang Treo</div>
        <div class="cf-num" id="cfCapital">0đ</div>
        <div class="cf-sub" id="cfCapitalDetail" style="font-size:11px;color:var(--muted);margin-top:4px;"></div>
      </div>
      <div class="cf-stat cf-debt">
        <div class="cf-lbl">Công nợ chưa thu</div>
        <div class="cf-num" id="cfDebt">0đ</div>
      </div>
      <div class="cf-stat cf-profit">
        <div class="cf-lbl">Lời / Lỗ</div>
        <div class="cf-num" id="cfProfit">0đ</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header-row">
        <h2 style="margin:0;">Sổ dòng tiền (doanh thu khách hàng + chi phí + vốn)</h2>
        <div style="display:flex;gap:8px;">
          <button class="today-btn" id="cfTodayBtn" type="button">📅 Hôm nay</button>
          <button class="export-btn" id="exportCfExcelBtn" type="button">📥 Xuất Excel</button>
          <button class="btn" id="openAddExpenseBtn" style="margin:0;width:auto;padding:10px 20px;">+ Thêm khoản chi phí / vốn</button>
        </div>
      </div>
      <div class="toolbar" style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <input id="cfSearch" placeholder="🔍 Tìm theo tên khách hàng / khoản mục..." style="flex:2;min-width:260px;">
        <select id="cfFilterKind" style="flex:1;min-width:160px;">
          <option value="">Tất cả loại</option>
          <option value="revenue">✅ Đã thu</option>
          <option value="debt">🕒 Công nợ</option>
          <option value="chi_phi">💸 Chi phí bán hàng</option>
          <option value="von">💼 Vốn</option>
          <option value="hoan_von">🔄 Hoàn vốn</option>
        </select>
        <div style="display:flex;gap:6px;align-items:center;flex:1.5;min-width:280px;">
          <input id="cfFilterFrom" type="date" title="Từ ngày" style="flex:1;">
          <span style="color:#64748b;font-weight:700;">→</span>
          <input id="cfFilterTo" type="date" title="Đến ngày" style="flex:1;">
        </div>
      </div>
      <div class="count" id="cfCount" style="margin-bottom:12px;font-size:13px;font-weight:700;color:#475569;"></div>
      <div id="cashflowTableHolder"></div>
    </div>
  </div>

  <div class="modal-overlay" id="expenseModalOverlay">
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="cfFormTitle" style="margin:0;">💸 Thêm khoản chi phí / vốn</h2>
        <button class="modal-close" id="closeExpenseModal" type="button">✕</button>
      </div>
      <label>Loại khoản mục</label>
      <div class="cf-type-toggle">
        <button type="button" class="cf-type-btn active" id="cfTypeExpenseBtn" data-type="chi_phi">Chi phí bán hàng</button>
        <button type="button" class="cf-type-btn" id="cfTypeCapitalBtn" data-type="von">Vốn bỏ ra</button>
        <button type="button" class="cf-type-btn" id="cfTypeRefundBtn" data-type="hoan_von">Hoàn vốn</button>
      </div>
      <input type="hidden" id="cfType" value="chi_phi">
      <label for="cfName">Tên khoản mục</label>
      <input id="cfName" placeholder="VD: Tiền xăng, thuê kho, mua bao bì...">
      <label for="cfAmount">Số tiền</label>
      <div class="money-input">
        <input id="cfAmount" type="number" min="0" step="1" placeholder="500">
        <span class="money-suffix">.000 đ</span>
      </div>
      <label for="cfDate">Ngày phát sinh</label>
      <input id="cfDate" type="date">
      <label for="cfNote">Ghi chú</label>
      <textarea id="cfNote" placeholder="Ghi chú thêm (không bắt buộc)..."></textarea>
      <button class="btn" id="addExpenseBtn">Lưu khoản mục</button>
      <button class="btn btn-secondary" id="cancelExpenseEditBtn" style="display:none;">Hủy sửa</button>
    </div>
  </div>

  <div class="view" id="view-accounts">
  <div class="card">
    <div class="card-header-row">
      <h2 style="margin:0;">Danh sách tài khoản quản trị</h2>
      <button class="btn" id="openAddAccountBtn" style="margin:0;width:auto;padding:10px 20px;">+ Thêm tài khoản</button>
    </div>
    <div class="count" id="accountCount"></div>
    <div id="accountTableHolder"></div>
  </div>
  </div>

  <div class="modal-overlay" id="accountModalOverlay">
    <div class="modal-box" style="max-width:480px;">
      <div class="modal-header">
        <div>
          <h2 id="accountFormTitle" style="margin:0;">🔑 Thêm tài khoản</h2>
          <div class="modal-subtitle">Lưu trữ tài khoản quản trị mạng xã hội, email, sàn TMĐT</div>
        </div>
        <button class="modal-close" id="closeAccountModal" type="button">✕</button>
      </div>
      <label for="acName">Nền tảng / Tài nguyên</label>
      <select id="acName">
        <option value="EMAIL">EMAIL</option>
        <option value="FACEBOOK">FACEBOOK</option>
        <option value="ZALO">ZALO</option>
        <option value="SP EXPRESS">SP EXPRESS</option>
        <option value="SHOPEE">SHOPEE</option>
        <option value="TIKTOK">TIKTOK</option>
        <option value="WEBSITE">WEBSITE</option>
        <option value="KHAC">Khác...</option>
      </select>
      <input id="acNameCustom" placeholder="Nhập tên tài nguyên" style="display:none;margin-top:8px;">
      <div class="field-row">
        <div>
          <label for="acUser">Tên đăng nhập / Email</label>
          <input id="acUser" placeholder="VD: vigenfood26@gmail.com">
        </div>
        <div>
          <label for="acPass">Mật khẩu</label>
          <input id="acPass" placeholder="VD: Vigenfood@2026">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelAccountEditBtn" type="button">Hủy</button>
        <button class="btn" id="addAccountBtn" type="button">Lưu tài khoản</button>
      </div>
    </div>
  </div>


  <!-- MODAL XEM & IN HÓA ĐƠN BÁN HÀNG (PDF) -->
  <div class="modal-overlay" id="invoiceModalOverlay">
    <div class="modal-box modal-box-large invoice-modal-box">
      <div class="modal-header no-print">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2 id="invoiceModalTitle" style="margin:0;">🧾 Hóa đơn bán hàng</h2>
          <span class="tag tag-revenue" style="font-size:11.5px;">Vị Nguyên Food</span>
        </div>
        <button class="modal-close" id="closeInvoiceModal" type="button">✕</button>
      </div>

      <div id="invoiceContentArea" style="background:#ffffff;padding:8px 4px;max-height:70vh;overflow-y:auto;"></div>

      <div class="modal-footer no-print" style="margin-top:14px;">
        <button class="btn btn-secondary" id="closeInvoiceBtn" type="button">Đóng</button>
        <button class="btn btn-secondary" id="exportPdfBtnBottom" type="button" style="margin:0;width:auto;display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:700;border:1.5px solid #2563eb;color:#2563eb;background:#eff6ff;">
          📥 Xuất file PDF (Không chữ ký)
        </button>
        <button class="btn" id="printInvoiceBtnBottom" type="button" style="margin:0;width:auto;display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:700;background:#2563eb;">
          🖨️ In hóa đơn (Có chữ ký)
        </button>
      </div>
    </div>
  </div>

</div>

`;

export default bodyMarkup;
