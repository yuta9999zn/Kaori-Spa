/**
 * AURA Spa — Shared Sidebar Component  v3.0
 *
 * Usage:
 *   <div id="sidebar-root"></div>
 *   <script src="../shared/sidebar.js"></script>
 *   <script>AuraSidebar.init({ basePath: '../', active: 'dv-goidv' });</script>
 *
 * basePath: '../'  for pages inside subfolders  (booking/, phong/, bao-cao/, …)
 *           './'   for pages directly in quan-ly-chi-nhanh/ root  (check-in.html, index.html)
 *
 * Behaviour:
 *   • The group that contains the active key is expanded on load.
 *   • All other groups are collapsed.
 *   • Clicking any group header toggles open / closed.
 */
const AuraSidebar = (() => {

    // ─── NAV CONFIG ───────────────────────────────────────────────────────────
    // Each group has: group (display name), icon (lucide icon for the header),
    // and items[]. Each item has: key, icon, label, path.
    const NAV_CONFIG = [
        {
            group: 'Tong Quan',
            icon: 'layout-dashboard',
            items: [
                { key: 'dashboard',  icon: 'layout-dashboard', label: 'Dashboard Hom Nay',  path: 'index.html' },
                { key: 'check-in',   icon: 'user-check',       label: 'Check-in Khach',     path: 'check-in.html' },
            ]
        },
        {
            group: 'Booking & Lich',
            icon: 'calendar',
            items: [
                { key: 'lich-booking',  icon: 'calendar',       label: 'Lich Booking',       path: 'booking/lich-booking.html' },
                { key: 'tao-booking',   icon: 'plus-circle',    label: 'Tao Booking',         path: 'booking/tao-booking.html' },
                { key: 'chi-tiet',      icon: 'file-text',      label: 'Chi Tiet Booking',    path: 'booking/chi-tiet-booking.html' },
                { key: 'doi-lich',      icon: 'calendar-clock', label: 'Doi Lich',            path: 'booking/doi-lich.html' },
                { key: 'thanh-toan',    icon: 'credit-card',    label: 'Thanh Toan',          path: 'booking/thanh-toan.html' },
                { key: 'danh-sach-cho', icon: 'users',          label: 'Danh Sach Cho',       path: 'booking/danh-sach-cho.html' },
                { key: 'lich-su',       icon: 'history',        label: 'Lich Su Booking',     path: 'booking/lich-su.html' },
                { key: 'khung-gio',     icon: 'clock',          label: 'Quan Ly Khung Gio',   path: 'booking/khung-gio.html' },
                { key: 'quy-tac',       icon: 'shield',         label: 'Quy Tac Booking',     path: 'booking/quy-tac.html' },
                { key: 'xung-dot',      icon: 'alert-triangle', label: 'Xung Dot Lich',       path: 'booking/giai-quyet-xung-dot.html' },
                { key: 'phan-tich-bk',  icon: 'bar-chart-2',    label: 'Phan Tich Booking',   path: 'booking/phan-tich.html' },
            ]
        },
        {
            group: 'Nhan Vien',
            icon: 'users',
            items: [
                { key: 'nv-tongquan',    icon: 'users',          label: 'Tong Quan NV',        path: 'nhan-vien/tong-quan.html' },
                { key: 'nv-danhsach',    icon: 'list',           label: 'Danh Sach NV',        path: 'nhan-vien/danh-sach.html' },
                { key: 'nv-taosua',      icon: 'user-plus',      label: 'Them / Sua NV',       path: 'nhan-vien/tao-sua.html' },
                { key: 'nv-kynang',      icon: 'star',           label: 'Ky Nang & Dich Vu',   path: 'nhan-vien/ky-nang-dich-vu.html' },
                { key: 'nv-lichlamviec', icon: 'calendar-days',  label: 'Lich Lam Viec',       path: 'nhan-vien/lich-lam-viec.html' },
                { key: 'nv-hieusuat',    icon: 'trending-up',    label: 'Hieu Suat',           path: 'nhan-vien/hieu-suat.html' },
                { key: 'nv-luong',       icon: 'banknote',       label: 'Hoa Hong & Luong',    path: 'nhan-vien/hoa-hong-luong.html' },
            ]
        },
        {
            group: 'Khach Hang',
            icon: 'heart-handshake',
            items: [
                { key: 'kh-danhsach',   icon: 'users',          label: 'Danh Sach KH',        path: 'khach-hang/danh-sach.html' },
                { key: 'kh-taosua',     icon: 'user-plus',      label: 'Them Khach Hang',      path: 'khach-hang/tao-sua.html' },
                { key: 'kh-goitv',      icon: 'package',        label: 'Goi & Thanh Vien',    path: 'khach-hang/goi-thanh-vien.html' },
                { key: 'kh-diem',       icon: 'gift',           label: 'Diem Thuong',          path: 'khach-hang/diem-thuong.html' },
                { key: 'kh-suckhoe',    icon: 'heart',          label: 'Ghi Chu Suc Khoe',    path: 'khach-hang/ghi-chu-suc-khoe.html' },
                { key: 'kh-giaotiep',   icon: 'message-circle', label: 'Giao Tiep KH',         path: 'khach-hang/giao-tiep.html' },
                { key: 'kh-phantich',   icon: 'pie-chart',      label: 'Phan Tich KH',         path: 'khach-hang/phan-tich.html' },
            ]
        },
        {
            group: 'Dich Vu',
            icon: 'sparkles',
            items: [
                { key: 'dv-tongquan',   icon: 'sparkles',       label: 'Tong Quan DV',         path: 'dich-vu/tong-quan.html' },
                { key: 'dv-danhmuc',    icon: 'folder',         label: 'Danh Muc DV',          path: 'dich-vu/danh-muc.html' },
                { key: 'dv-danhsach',   icon: 'list',           label: 'Danh Sach DV',         path: 'dich-vu/danh-sach.html' },
                { key: 'dv-goidv',      icon: 'layers',         label: 'Goi Combo DV',         path: 'dich-vu/goi-dich-vu.html' },
                { key: 'dv-quy-tac',    icon: 'settings-2',     label: 'Quy Tac Kha Dung',    path: 'dich-vu/quy-tac-kha-dung.html' },
            ]
        },
        {
            group: 'Phong & Giuong',
            icon: 'door-open',
            items: [
                { key: 'phong',         icon: 'door-open',      label: 'Danh Sach Phong',      path: 'phong/index.html' },
                { key: 'lich-phong',    icon: 'calendar-range', label: 'Lich Phong',           path: 'phong/lich-phong.html' },
                { key: 'them-phong',    icon: 'plus-square',    label: 'Them / Sua Phong',    path: 'phong/them-phong.html' },
            ]
        },
        {
            group: 'Kho & Vat Tu',
            icon: 'package-2',
            items: [
                { key: 'kho',           icon: 'package-2',      label: 'Tong Quan Kho',        path: 'kho/index.html' },
                { key: 'nhap-kho',      icon: 'package-plus',   label: 'Nhap Kho',             path: 'kho/nhap-kho.html' },
                { key: 'xuat-kho',      icon: 'package-minus',  label: 'Xuat Kho',             path: 'kho/xuat-kho.html' },
            ]
        },
        {
            group: 'Bao Cao',
            icon: 'bar-chart-2',
            items: [
                { key: 'bc-ngay',       icon: 'clipboard-list', label: 'Bao Cao Ngay',         path: 'bao-cao/bao-cao-ngay.html' },
                { key: 'bc-chinhanh',   icon: 'bar-chart',      label: 'Tong Hop Thang',       path: 'bao-cao/bao-cao-chi-nhanh.html' },
                { key: 'bc-liet-trinh', icon: 'layers',         label: 'Theo Doi Lieu Trinh',  path: 'bao-cao/lieu-trinh.html' },
                { key: 'bc-booking',    icon: 'trending-up',    label: 'Phan Tich Booking',    path: 'bao-cao/phan-tich-booking.html' },
                { key: 'bc-khach',      icon: 'users',          label: 'Phan Tich KH',         path: 'bao-cao/phan-tich-khach.html' },
                { key: 'bc-nhanvien',   icon: 'award',          label: 'Hieu Suat NV',         path: 'bao-cao/hieu-suat-nv.html' },
            ]
        },
        {
            group: 'Noi Dung & SEO',
            icon: 'file-text',
            items: [
                { key: 'bai-viet',      icon: 'file-text',      label: 'Bai Viet',             path: 'noi-dung/bai-viet.html' },
                { key: 'tao-bai',       icon: 'edit-3',         label: 'Tao / Sua Bai',        path: 'noi-dung/tao-sua-bai.html' },
                { key: 'media',         icon: 'image',          label: 'Thu Vien Media',       path: 'noi-dung/thu-vien-media.html' },
                { key: 'seo',           icon: 'search',         label: 'Quan Ly SEO',          path: 'noi-dung/seo.html' },
            ]
        },
    ];

    // ─── STYLES ───────────────────────────────────────────────────────────────
    const STYLES = `<style id="aurora-sidebar-styles">
        #aurora-sidebar {
            width: 248px;
            min-width: 248px;
            background: white;
            border-right: 1px solid #F4EFEA;
            display: flex;
            flex-direction: column;
            z-index: 20;
            height: 100vh;
            overflow: hidden;
        }
        /* ── Logo bar ── */
        #aurora-sidebar .sb-logo {
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            border-bottom: 1px solid #F4EFEA;
            flex-shrink: 0;
        }
        #aurora-sidebar .sb-logo-inner {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #aurora-sidebar .sb-logo h1 {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            letter-spacing: .15em;
            color: #4A443E;
        }
        #aurora-sidebar .sb-icon-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px solid #F4EFEA;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            transition: background .15s;
            text-decoration: none;
            color: #8B837C;
        }
        #aurora-sidebar .sb-icon-btn:hover { background: #FAF9F6; color: #C9A87C; }
        #aurora-sidebar .sb-notif-dot {
            position: absolute;
            top: -2px; right: -2px;
            width: 7px; height: 7px;
            background: #D9B8B5;
            border-radius: 50%;
        }
        /* ── Nav scroll area ── */
        #aurora-sidebar nav {
            flex: 1;
            overflow-y: auto;
            padding: 8px 10px 12px;
        }
        #aurora-sidebar nav::-webkit-scrollbar { width: 3px; }
        #aurora-sidebar nav::-webkit-scrollbar-thumb { background: #D9B8B5; border-radius: 10px; }
        /* ── Accordion section ── */
        .sb-section { margin-bottom: 2px; }
        /* Section header button */
        .sb-section-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 7px 10px 7px 10px;
            border-radius: 10px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-family: 'Jost', sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: .06em;
            text-transform: uppercase;
            color: #8B837C;
            transition: background .15s, color .15s;
            text-align: left;
        }
        .sb-section-header:hover {
            background: #FAF9F6;
            color: #4A443E;
        }
        /* Active section header — contains the current page */
        .sb-section.active-section > .sb-section-header {
            color: #C9A87C;
        }
        .sb-section-header-left {
            display: flex;
            align-items: center;
            gap: 7px;
        }
        .sb-section-header-left svg {
            width: 13px; height: 13px; flex-shrink: 0;
        }
        /* Chevron rotation */
        .sb-chevron {
            width: 13px !important;
            height: 13px !important;
            flex-shrink: 0;
            transition: transform .22s ease;
            color: #C5BEB9;
        }
        .sb-section.open > .sb-section-header .sb-chevron {
            transform: rotate(180deg);
            color: #C9A87C;
        }
        /* Section body — accordion panel */
        .sb-section-body {
            overflow: hidden;
            max-height: 0;
            transition: max-height .28s ease, opacity .2s ease;
            opacity: 0;
        }
        .sb-section.open > .sb-section-body {
            max-height: 600px;   /* large enough for any group */
            opacity: 1;
        }
        /* ── Nav item ── */
        .sb-item {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 8px 10px 8px 28px; /* left indent under group icon */
            border-radius: 10px;
            font-size: 12.5px;
            color: #8B837C;
            text-decoration: none;
            transition: background .12s, color .12s;
            cursor: pointer;
            margin-bottom: 1px;
            font-family: 'Jost', sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sb-item:hover {
            background: #FAF9F6;
            color: #4A443E;
        }
        .sb-item.active {
            background: rgba(201,168,124,.13);
            color: #C9A87C;
            font-weight: 500;
        }
        .sb-item.active svg { color: #C9A87C; }
        .sb-item svg {
            width: 14px; height: 14px; flex-shrink: 0;
        }
        /* ── User footer ── */
        #aurora-sidebar .sb-user {
            padding: 12px;
            border-top: 1px solid #F4EFEA;
            flex-shrink: 0;
        }
        #aurora-sidebar .sb-user-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            border-radius: 10px;
            cursor: pointer;
            transition: background .15s;
        }
        #aurora-sidebar .sb-user-card:hover { background: #FAF9F6; }
        #aurora-sidebar .sb-avatar {
            width: 34px; height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, #D9B8B5, #C9A87C);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Cinzel', serif;
            font-size: 11px;
            flex-shrink: 0;
        }
    </style>`;

    // ─── BUILD HTML ───────────────────────────────────────────────────────────
    function buildSidebar(basePath, activeKey) {
        // Find which group index contains the active key
        const activeGroupIdx = NAV_CONFIG.findIndex(
            sec => sec.items.some(it => it.key === activeKey)
        );

        const navHTML = NAV_CONFIG.map((section, idx) => {
            const isOpen       = (idx === activeGroupIdx);
            const hasActive    = isOpen;
            const sectionId    = 'sb-body-' + idx;

            const itemsHTML = section.items.map(item => `
                <a href="${basePath}${item.path}"
                   class="sb-item${activeKey === item.key ? ' active' : ''}">
                    <i data-lucide="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>`).join('');

            return `
            <div class="sb-section${isOpen ? ' open' : ''}${hasActive ? ' active-section' : ''}">
                <button class="sb-section-header" onclick="auraSidebarToggle('${sectionId}')">
                    <span class="sb-section-header-left">
                        <i data-lucide="${section.icon}"></i>
                        <span>${section.group}</span>
                    </span>
                    <i data-lucide="chevron-down" class="sb-chevron"></i>
                </button>
                <div class="sb-section-body" id="${sectionId}">
                    ${itemsHTML}
                </div>
            </div>`;
        }).join('');

        return `
            ${STYLES}
            <aside id="aurora-sidebar">
                <div class="sb-logo">
                    <div class="sb-logo-inner">
                        <i data-lucide="flower-2" style="color:#C9A87C;width:18px;height:18px" stroke-width="1.5"></i>
                        <h1>AURA</h1>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                        <a href="${basePath}thong-bao/index.html" class="sb-icon-btn" title="Thong Bao">
                            <i data-lucide="bell" style="width:13px;height:13px"></i>
                            <span class="sb-notif-dot"></span>
                        </a>
                        <a href="${basePath}../index.html" class="sb-icon-btn" title="Chon Portal">
                            <i data-lucide="grid" style="width:13px;height:13px"></i>
                        </a>
                    </div>
                </div>
                <nav>${navHTML}</nav>
                <div class="sb-user">
                    <div class="sb-user-card">
                        <div class="sb-avatar">MG</div>
                        <div style="flex:1;min-width:0">
                            <p style="font-size:13px;font-weight:500;color:#4A443E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Minh Manager</p>
                            <p style="font-size:11px;color:#8B837C">Quan Ly Chi Nhanh Q.1</p>
                        </div>
                        <a href="${basePath}../index.html" title="Doi portal"
                           style="color:#8B837C;text-decoration:none;padding:4px;border-radius:8px;transition:color .15s;flex-shrink:0"
                           onmouseover="this.style.color='#C9A87C'" onmouseout="this.style.color='#8B837C'">
                            <i data-lucide="log-out" style="width:14px;height:14px"></i>
                        </a>
                    </div>
                </div>
            </aside>`;
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────
    function init(config) {
        const { basePath = '../', active = '' } = (config || {});
        const root = document.getElementById('sidebar-root');
        if (!root) {
            console.warn('[AuraSidebar] No element with id="sidebar-root" found.');
            return;
        }
        root.innerHTML = buildSidebar(basePath, active);
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lucide@latest';
            s.onload = () => lucide.createIcons();
            document.head.appendChild(s);
        }
    }

    return { init };
})();

// ─── GLOBAL TOGGLE (called from onclick in injected HTML) ─────────────────────
function auraSidebarToggle(sectionId) {
    const body = document.getElementById(sectionId);
    if (!body) return;
    const section = body.closest('.sb-section');
    if (section) section.classList.toggle('open');
}
