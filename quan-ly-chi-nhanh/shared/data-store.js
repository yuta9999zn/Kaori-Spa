/**
 * AuraDB — localStorage data layer for Aura Spa Management System
 * Version: 2.1
 *
 * All screens in quan-ly-chi-nhanh/ read/write through this module.
 * Data is scoped to the current browser session (localStorage).
 *
 * Keys:
 *   aura_transactions       — payment records (service + product sales)
 *   aura_inventory_moves    — stock in/out movements
 *   aura_daily_entries      — manual cash/expense entries
 *   aura_combos             — combo session packs + multi-service packages
 *   aura_combo_sessions     — individual session usage events
 */

const AuraDB = (() => {

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    function load(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); }
        catch (e) { return []; }
    }

    function save(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); }
        catch (e) { console.warn('AuraDB: localStorage write failed', e); }
    }

    function uid(prefix) {
        return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    function today() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    // ─── TRANSACTIONS (Thanh toan) ────────────────────────────────────────────

    /**
     * Record a completed payment.
     * @param {Object} tx
     * @param {string} tx.type       — "dv" (service) | "mp" (cosmetics/product)
     * @param {string} tx.method     — "tm" | "the" | "ck-loc" | "ck-cty"
     * @param {number} tx.amount     — VND
     * @param {string} [tx.bookingId]
     * @param {string} [tx.customer]
     * @param {string} [tx.service]
     * @param {string} [tx.date]     — YYYY-MM-DD, defaults to today
     */
    function addTransaction(tx) {
        const list = load('aura_transactions');
        list.push({
            id: uid('tx'),
            date: tx.date || today(),
            type: tx.type || 'dv',
            method: tx.method || 'tm',
            amount: Number(tx.amount) || 0,
            bookingId: tx.bookingId || '',
            customer: tx.customer || '',
            service: tx.service || '',
            createdAt: Date.now(),
        });
        save('aura_transactions', list);
    }

    /**
     * Get all transactions, optionally filtered by date.
     * @param {string} [date] — YYYY-MM-DD or omit for all
     */
    function getTransactions(date) {
        const list = load('aura_transactions');
        if (!date) return list;
        return list.filter(tx => tx.date === date);
    }

    /**
     * Get a monthly P&L summary.
     * @param {number} year
     * @param {number} month  — 1-based
     * @returns {{ dv, mp, total, byDay, byMethod }}
     */
    function getMonthlyReport(year, month) {
        const prefix = year + '-' + String(month).padStart(2, '0');
        const txs = load('aura_transactions').filter(tx => tx.date.startsWith(prefix));
        const byDay = {}, byMethod = { tm: 0, the: 0, 'ck-loc': 0, 'ck-cty': 0 };
        let dv = 0, mp = 0;
        txs.forEach(tx => {
            if (tx.type === 'dv') dv += tx.amount;
            else mp += tx.amount;
            byDay[tx.date] = (byDay[tx.date] || 0) + tx.amount;
            if (byMethod[tx.method] !== undefined) byMethod[tx.method] += tx.amount;
        });
        return { dv, mp, total: dv + mp, byDay, byMethod };
    }

    // ─── INVENTORY MOVES (Kho) ────────────────────────────────────────────────

    /**
     * Record an inventory movement.
     * @param {Object} mv
     * @param {string} mv.productId  — NB product ID (e.g. "NB-001")
     * @param {number} mv.delta      — positive = stock in, negative = stock out
     * @param {string} [mv.type]     — "nhap" | "xuat"
     * @param {string} [mv.note]
     * @param {string} [mv.receipt]  — invoice/receipt number
     * @param {string} [mv.date]     — YYYY-MM-DD
     */
    function addInventoryMove(mv) {
        const list = load('aura_inventory_moves');
        list.push({
            id: uid('mv'),
            productId: mv.productId || '',
            delta: Number(mv.delta) || 0,
            type: mv.type || (mv.delta > 0 ? 'nhap' : 'xuat'),
            note: mv.note || '',
            receipt: mv.receipt || '',
            date: mv.date || today(),
            createdAt: Date.now(),
        });
        save('aura_inventory_moves', list);
    }

    /**
     * Calculate current stock for a product.
     * @param {string} productId
     * @param {number} baseStock  — the hardcoded starting quantity in INVENTORY[]
     * @returns {number}
     */
    function getStock(productId, baseStock) {
        const moves = load('aura_inventory_moves').filter(m => m.productId === productId);
        const delta = moves.reduce((s, m) => s + m.delta, 0);
        return (Number(baseStock) || 0) + delta;
    }

    /**
     * Get all moves for a product (for history log).
     * @param {string} [productId] — omit for all products
     */
    function getInventoryMoves(productId) {
        const list = load('aura_inventory_moves');
        if (!productId) return list;
        return list.filter(m => m.productId === productId);
    }

    // ─── DAILY ENTRIES (Ghi thu cong) ─────────────────────────────────────────

    /**
     * Add a manual daily entry (opening cash, petty expense, etc.)
     * @param {Object} entry
     * @param {string} entry.type    — "opening" | "expense" | "other"
     * @param {number} entry.amount
     * @param {string} [entry.note]
     * @param {string} [entry.date]
     */
    function addDailyEntry(entry) {
        const list = load('aura_daily_entries');
        list.push({
            id: uid('de'),
            type: entry.type || 'other',
            amount: Number(entry.amount) || 0,
            note: entry.note || '',
            date: entry.date || today(),
            createdAt: Date.now(),
        });
        save('aura_daily_entries', list);
    }

    function getDailyEntries(date) {
        const list = load('aura_daily_entries');
        if (!date) return list;
        return list.filter(e => e.date === date);
    }

    // ─── COMBOS (Lieu Trinh + Goi Combo) ──────────────────────────────────────

    /**
     * Create a new combo.
     * @param {Object} combo
     * @param {string} combo.kind         — "session" | "package"
     * @param {string} combo.customerId   — customer code e.g. "24D11001"
     *
     * For kind="session":
     * @param {string} combo.serviceId    — service key e.g. "nach"
     * @param {number} combo.totalSessions
     * @param {number} combo.unitPrice
     *
     * For kind="package":
     * @param {string} combo.packageId    — package name/ID
     * @param {Array}  combo.items        — [{ serviceId, sessions, unitPrice }]
     */
    function addCombo(combo) {
        const list = load('aura_combos');
        list.push({
            id: combo.id || uid('cb'),
            kind: combo.kind || 'session',
            customerId: combo.customerId || '',
            purchaseDate: combo.purchaseDate || today(),
            createdAt: Date.now(),
            // session-specific
            serviceId: combo.serviceId || '',
            totalSessions: combo.totalSessions || 0,
            unitPrice: combo.unitPrice || 0,
            // package-specific
            packageId: combo.packageId || '',
            items: combo.items || [],
        });
        save('aura_combos', list);
    }

    function getCombos(customerId) {
        const list = load('aura_combos');
        if (!customerId) return list;
        return list.filter(c => c.customerId === customerId);
    }

    /**
     * Record one session usage against a combo.
     * @param {string} comboId
     * @param {string} [serviceId]  — required when combo.kind === "package"
     * @param {string} [date]       — YYYY-MM-DD
     */
    function recordComboSession(comboId, serviceId, date) {
        const list = load('aura_combo_sessions');
        list.push({
            id: uid('cs'),
            comboId: comboId || '',
            serviceId: serviceId || '',
            date: date || today(),
            createdAt: Date.now(),
        });
        save('aura_combo_sessions', list);
    }

    /**
     * Get session usage for a combo.
     * @param {string} comboId
     * @returns {Array} sessions used
     */
    function getComboSessions(comboId) {
        return load('aura_combo_sessions').filter(s => s.comboId === comboId);
    }

    /**
     * Count remaining sessions for a session-type combo.
     * @param {string} comboId
     * @param {number} totalSessions  — total purchased
     * @returns {number}
     */
    function getComboRemaining(comboId, totalSessions) {
        const used = getComboSessions(comboId).length;
        return Math.max(Number(totalSessions) - used, 0);
    }

    // ─── EXPENSES (Chi phi ngay) ──────────────────────────────────────────────

    function addExpense(exp) {
        const list = load('aura_expenses');
        list.push({
            id: uid('exp'),
            date: exp.date || today(),
            code: exp.code || '6422-KH',
            name: exp.name || '',
            amount: Number(exp.amount) || 0,
            createdAt: Date.now(),
        });
        save('aura_expenses', list);
    }

    function getExpenses(date) {
        const list = load('aura_expenses');
        if (!date) return list;
        return list.filter(e => e.date === date);
    }

    function deleteExpense(id) {
        const list = load('aura_expenses').filter(e => e.id !== id);
        save('aura_expenses', list);
    }

    /** Sum expenses for a month. Returns array of { code, name, amount }. */
    function getMonthlyExpenses(year, month) {
        const prefix = year + '-' + String(month).padStart(2, '0');
        return load('aura_expenses').filter(e => e.date.startsWith(prefix));
    }

    // ─── OPENING CASH ─────────────────────────────────────────────────────────

    function getOpeningCash(date) {
        try {
            const obj = JSON.parse(localStorage.getItem('aura_opening_cash') || '{}');
            return obj[date] || 0;
        } catch (e) { return 0; }
    }

    function setOpeningCash(date, amount) {
        try {
            const obj = JSON.parse(localStorage.getItem('aura_opening_cash') || '{}');
            obj[date] = Number(amount) || 0;
            localStorage.setItem('aura_opening_cash', JSON.stringify(obj));
        } catch (e) { console.warn('AuraDB: setOpeningCash failed', e); }
    }

    // ─── DAILY REPORT ─────────────────────────────────────────────────────────

    /**
     * Aggregate all transactions for a single day into a report object.
     * @param {string} dateStr  — YYYY-MM-DD
     * @returns {{ dv, mp, byMethod, total, count, transactions }}
     */
    function getDailyReport(dateStr) {
        const txns = getTransactions(dateStr);
        const dv  = { tm: 0, the: 0, 'ck-loc': 0, 'ck-cty': 0, total: 0 };
        const mp  = { tm: 0, the: 0, 'ck-loc': 0, 'ck-cty': 0, total: 0 };
        const byMethod = { tm: 0, the: 0, 'ck-loc': 0, 'ck-cty': 0 };

        txns.forEach(tx => {
            const bucket = tx.type === 'mp' ? mp : dv;
            if (bucket[tx.method] !== undefined) bucket[tx.method] += tx.amount;
            if (byMethod[tx.method] !== undefined) byMethod[tx.method] += tx.amount;
        });

        dv.total = dv.tm + dv.the + dv['ck-loc'] + dv['ck-cty'];
        mp.total = mp.tm + mp.the + mp['ck-loc'] + mp['ck-cty'];

        return {
            dv,
            mp,
            byMethod,
            total: dv.total + mp.total,
            count: txns.length,
            transactions: txns,
        };
    }

    // ─── FAKE DATA SEEDER ──────────────────────────────────────────────────────

    /**
     * Seed realistic fake transactions + expenses into localStorage.
     * Only runs once — skipped if data already exists.
     */
    function seedFakeData() {
        if (load('aura_transactions').length > 0) return;

        const services = [
            { name: 'Trị liệu da mặt cơ bản', min: 350000, max: 550000 },
            { name: 'Massage thư giãn 60 phút', min: 280000, max: 420000 },
            { name: 'Tẩy tế bào chết toàn thân', min: 400000, max: 600000 },
            { name: 'Chăm sóc da chuyên sâu', min: 500000, max: 800000 },
            { name: 'Gội đầu dưỡng sinh', min: 150000, max: 250000 },
            { name: 'Facial nâng cơ RF', min: 600000, max: 900000 },
            { name: 'Massage đá nóng', min: 350000, max: 550000 },
            { name: 'Triệt lông vùng nhỏ', min: 200000, max: 400000 },
        ];
        const products = [
            { name: 'Serum dưỡng trắng Aura', price: 850000 },
            { name: 'Kem dưỡng ẩm ban đêm', price: 620000 },
            { name: 'Toner cân bằng da', price: 480000 },
            { name: 'Mặt nạ collagen hộp 5 miếng', price: 320000 },
        ];
        const customers = ['Nguyễn Thị Mai', 'Trần Thị Hoa', 'Lê Thị Lan', 'Phạm Thị Yến',
                           'Hoàng Thị Thu', 'Vũ Thị Bích', 'Đặng Thị Nhung', 'Bùi Thị Linh',
                           'Đỗ Thị Hằng', 'Ngô Thị Kim', 'Phan Thị Tuyết', 'Lý Thị Duyên'];
        const methods = ['tm', 'tm', 'tm', 'ck-loc', 'ck-loc', 'ck-cty', 'the'];

        function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function dateStr(daysAgo) {
            const d = new Date('2026-04-14');
            d.setDate(d.getDate() - daysAgo);
            return d.toISOString().slice(0, 10);
        }

        const txns = [];

        // Generate last 10 days of transactions (skip rest days = every 4th day roughly)
        for (let ago = 0; ago <= 13; ago++) {
            if (ago === 3 || ago === 7 || ago === 11) continue; // rest days
            const date = dateStr(ago);
            const count = rnd(6, 12);
            for (let i = 0; i < count; i++) {
                const svc = pick(services);
                const amount = Math.round(rnd(svc.min, svc.max) / 10000) * 10000;
                txns.push({
                    id: 'tx_seed_' + ago + '_' + i,
                    date,
                    type: 'dv',
                    method: pick(methods),
                    amount,
                    bookingId: 'BK' + date.replace(/-/g,'') + String(i+1).padStart(2,'0'),
                    customer: pick(customers),
                    service: svc.name,
                    createdAt: Date.now() - ago * 86400000 + i * 60000,
                });
            }
            // Occasional product sale (30% chance per day)
            if (Math.random() < 0.3) {
                const prod = pick(products);
                txns.push({
                    id: 'tx_seed_mp_' + ago,
                    date,
                    type: 'mp',
                    method: pick(methods),
                    amount: prod.price,
                    bookingId: '',
                    customer: pick(customers),
                    service: prod.name,
                    createdAt: Date.now() - ago * 86400000 + 7200000,
                });
            }
        }
        save('aura_transactions', txns);

        // Seed expenses for today and yesterday
        const expenses = [
            { id:'exp_seed_1', date:'2026-04-14', code:'6422-VT', name:'Khăn bông loại A (10 cái)',   amount:180000, createdAt: Date.now() },
            { id:'exp_seed_2', date:'2026-04-14', code:'6422-VT', name:'Tinh dầu massage',              amount:250000, createdAt: Date.now() },
            { id:'exp_seed_3', date:'2026-04-14', code:'6422-KH',  name:'Nước uống khách hàng',         amount:60000,  createdAt: Date.now() },
            { id:'exp_seed_4', date:'2026-04-13', code:'6422-VT', name:'Vật tư tiêu hao ngày 13',       amount:120000, createdAt: Date.now() - 86400000 },
            { id:'exp_seed_5', date:'2026-04-12', code:'6422-KHĐ', name:'Khăn lau mặt (hộp)',           amount:95000,  createdAt: Date.now() - 172800000 },
        ];
        save('aura_expenses', expenses);

        // Seed opening cash
        try {
            const oc = { '2026-04-14': 500000, '2026-04-13': 450000, '2026-04-12': 500000 };
            localStorage.setItem('aura_opening_cash', JSON.stringify(oc));
        } catch(e) {}

        console.info('AuraDB: fake data seeded.');
    }

    // ─── DEV UTILITIES ────────────────────────────────────────────────────────

    /** Clear all AuraDB data (dev/reset only). */
    function clearAll() {
        ['aura_transactions', 'aura_inventory_moves', 'aura_daily_entries',
         'aura_combos', 'aura_combo_sessions', 'aura_expenses', 'aura_opening_cash']
            .forEach(k => localStorage.removeItem(k));
        console.info('AuraDB: all data cleared.');
    }

    /** Dump all stored data to console (debugging). */
    function dump() {
        const keys = ['aura_transactions', 'aura_inventory_moves', 'aura_daily_entries',
                      'aura_combos', 'aura_combo_sessions', 'aura_expenses'];
        keys.forEach(k => console.log(k, load(k)));
    }

    // ─── PUBLIC API ───────────────────────────────────────────────────────────
    return {
        // Transactions
        addTransaction,
        getTransactions,
        getMonthlyReport,
        getDailyReport,
        // Inventory
        addInventoryMove,
        getStock,
        getInventoryMoves,
        // Daily entries
        addDailyEntry,
        getDailyEntries,
        // Expenses
        addExpense,
        getExpenses,
        deleteExpense,
        getMonthlyExpenses,
        // Opening cash
        getOpeningCash,
        setOpeningCash,
        // Combos
        addCombo,
        getCombos,
        recordComboSession,
        getComboSessions,
        getComboRemaining,
        // Dev / seeding
        seedFakeData,
        clearAll,
        dump,
    };
})();
