const CAMPUS_STALLS = [
    { code: 'JSEC', label: 'JSEC', hint: 'Challenge' },
    { code: 'GONZAGA', label: 'GONZAGA', hint: 'Cafeteria' },
    { code: 'MVP', label: 'MVP', hint: 'Roofdeck' },
    { code: 'ISO', label: 'ISO', hint: 'Complex' },
    { code: 'ARETE', label: 'ARETE', hint: 'Hub' }
];

const VALID_STALL_CODES = CAMPUS_STALLS.map(s => s.code);
const DRINK_CATEGORIES = ['COFFEE', 'TEA', 'NON_COFFEE'];
const MODIFIER_TYPES = ['MILK', 'SYRUP', 'TOPPING', 'SHOT'];
const ORDER_STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
const CUP_SIZES = ['REGULAR', 'LARGE'];
const ICE_LEVELS = ['NONE', 'LESS', 'NORMAL', 'EXTRA'];
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];

let appMode = 'mock';
let inspectorOpen = false;
let currentMainTab = 'student';
let currentAdminEntity = 'Customer';

let db = {
    nextIds: { customer: 4, drink: 6, modifier: 6, order: 2, orderItem: 2 },
    customers: [
        { id: 1, memberCode: '221409', name: 'Lorenzo Reyes', phoneNumber: '+639175550142' },
        { id: 2, memberCode: '214882', name: 'Mikaela Santos', phoneNumber: '+639178880921' },
        { id: 3, memberCode: '231045', name: 'Hanzo Castillo', phoneNumber: '+639171234567' }
    ],
    drinks: [
        { id: 1, name: 'Signature Spanish Latte', category: 'COFFEE', basePrice: 130.00, available: true },
        { id: 2, name: 'JSEC Rush Cold Brew', category: 'COFFEE', basePrice: 120.00, available: true },
        { id: 3, name: 'Gonzaga Uji Matcha Cloud', category: 'TEA', basePrice: 145.00, available: true },
        { id: 4, name: 'Blue Eagle Dark Cocoa', category: 'NON_COFFEE', basePrice: 125.00, available: true },
        { id: 5, name: 'Arete Iced Americano', category: 'COFFEE', basePrice: 100.00, available: true }
    ],
    modifiers: [
        { id: 1, name: 'Sub Oat Milk', type: 'MILK', extraCost: 35.00, inStock: true },
        { id: 2, name: 'Sub Soy Milk', type: 'MILK', extraCost: 25.00, inStock: true },
        { id: 3, name: 'Extra Espresso Shot', type: 'SHOT', extraCost: 30.00, inStock: true },
        { id: 4, name: 'Vanilla Bean Syrup', type: 'SYRUP', extraCost: 20.00, inStock: true },
        { id: 5, name: 'Sea Salt Cream Foam', type: 'TOPPING', extraCost: 30.00, inStock: true }
    ],
    orders: [
        {
            id: 1,
            customer: { id: 1, memberCode: '221409', name: 'Lorenzo Reyes', phoneNumber: '+639175550142' },
            pickupLocation: 'JSEC',
            status: 'PREPARING',
            totalAmount: 185.00,
            createdAt: localIso(new Date(Date.now() - 8 * 60000)),
            readyAt: null,
            reminderSent: false
        }
    ],
    orderItems: [
        {
            id: 1,
            orderId: 1,
            baseDrink: { id: 1, name: 'Signature Spanish Latte', category: 'COFFEE', basePrice: 130.00, available: true },
            modifiers: [
                { id: 1, name: 'Sub Oat Milk', type: 'MILK', extraCost: 35.00, inStock: true }
            ],
            size: 'LARGE',
            iceLevel: 'LESS',
            sugarLevel: '75%',
            cupNotes: 'Pick up before 11am class',
            subtotal: 185.00
        }
    ]
};

let studentState = {
    selectedMemberCode: '221409',
    pickupLocation: 'JSEC',
    categoryFilter: 'ALL',
    selectedDrinkId: 1,
    size: 'REGULAR',
    iceLevel: 'NORMAL',
    sugarLevel: '75%',
    selectedModifierIds: [],
    tray: []
};

let baristaState = {
    statusFilter: 'ALL'
};

let smsFeed = [];
let restLogs = [];


function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatPHP(val) {
    const num = Number(val || 0);
    return '₱' + num.toFixed(2);
}

function formatTimestamp(isoStr) {
    if (!isoStr) return '—';
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
        return isoStr;
    }
}

function localIso(date = new Date()) {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 19);
}

function roundMoney(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function apiErr(res, fallback) {
    const d = (res && res.data) || {};
    if (d.message) return d.message + (Array.isArray(d.details) && d.details.length ? ` (${d.details.join('; ')})` : '');
    return d.error || fallback;
}

function getLiveBaseUrl() {
    const raw = (document.getElementById('live-base-url').value || '/api').trim();
    return raw.replace(/\/+$/, '');
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('is-leaving');
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

const ICON_PATHS = {
    cup: '<path d="M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5c-.6.9.6 1.6 0 2.5M12 2.5c-.6.9.6 1.6 0 2.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    db: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9l3 3-3 3M12.5 15H17"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/>',
    userplus: '<circle cx="9.5" cy="8" r="3.5"/><path d="M3 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5"/><path d="M19 8v6M16 11h6"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    pin: '<path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l7-7"/>',
    cookie: '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="14.5" cy="9" r=".9" fill="currentColor"/><circle cx="13" cy="14.5" r=".9" fill="currentColor"/><circle cx="9" cy="15" r=".9" fill="currentColor"/>',
    sms: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" stroke-width="2.6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'
};
function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => {
        el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
        el.removeAttribute('data-icon');
    });
}

function setModeDot(state) {
    document.getElementById('mode-dot').className = 'status-dot' + (state ? ` is-${state}` : '');
}

function copyTextFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Copied to Clipboard', 'JSON payload copied.', 'info');
    } catch (err) {
        showToast('Copy Failed', 'Could not copy text automatically.', 'error');
    }
    document.body.removeChild(textarea);
}


async function apiCall(method, path, body = null) {
    
    const fullDisplayPath = `/api${path}`;

    if (appMode === 'live') {
        const url = `${getLiveBaseUrl()}${path}`;
        const options = {
            method,
            headers: { 'Accept': 'application/json' }
        };
        if (body !== null) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (_) {
                data = { rawResponse: text };
            }
            recordRestLog(method, fullDisplayPath, res.status, body, data, 'LIVE');
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            const errPayload = { error: `Network / CORS error connecting to ${url}: ${err.message}` };
            recordRestLog(method, fullDisplayPath, 0, body, errPayload, 'LIVE');
            return { ok: false, status: 0, data: errPayload };
        }
    }

    const result = executeMockApi(method, path, body);

    recordRestLog(method, fullDisplayPath, result.status, body, result.data, 'MOCK');
    return result;

}

function executeMockApi(method, pathWithQuery, body) {

    const [path, queryString] = pathWithQuery.split('?');
    const params = new URLSearchParams(queryString || '');

    const ok = (data) => ({ ok: true, status: 200, data });
    const bad = (msg) => ({ ok: false, status: 400, data: { status: 400, error: 'Bad Request', message: msg, details: [] } });
    const conflict = (msg) => ({ ok: false, status: 409, data: { status: 409, error: 'Conflict', message: msg, details: [] } });
    const notFound = (msg) => ({ ok: false, status: 404, data: { status: 404, error: 'Not Found', message: msg, details: [] } });

    if (method === 'GET' && path === '/customers') {
        const code = params.get('memberCode');
        if (code) {
            const found = db.customers.filter(c => c.memberCode === code);
            if (!found.length) return notFound(`Customer with memberCode ${code} not found`);
            return ok(found);
        }
        return ok([...db.customers]);
    }
    if (method === 'POST' && path === '/customers') {
        if (!body || !/^\d{6}$/.test(body.memberCode || '')) {
            return bad('Validation failed: memberCode must be 6 digits');
        }
        if (!body.name || body.name.trim().length < 2) {
            return bad('Validation failed: name cannot be blank');
        }
        if (!/^\+639\d{9}$/.test(body.phoneNumber || '')) {
            return bad('Validation failed: phoneNumber must match +639XXXXXXXXX');
        }
        if (db.customers.some(c => c.memberCode === body.memberCode)) {
            return conflict(`memberCode ${body.memberCode} is already registered`);
        }
        const created = {
            id: db.nextIds.customer++,
            memberCode: body.memberCode.trim(),
            name: body.name.trim(),
            phoneNumber: body.phoneNumber.trim()
        };
        db.customers.push(created);
        return ok(created);
    }
    if (method === 'POST' && path === '/customers/delete') {
        const id = Number(params.get('id'));
        const idx = db.customers.findIndex(c => c.id === id);
        if (idx === -1) return notFound(`Customer ID ${id} does not exist`);
        const custOrderIds = db.orders.filter(o => o.customer.id === id).map(o => o.id);
        db.orderItems = db.orderItems.filter(i => !custOrderIds.includes(i.orderId));
        db.orders = db.orders.filter(o => o.customer.id !== id);
        db.customers.splice(idx, 1);
        return ok({ status: 'DELETED', entity: 'Customer', id });
    }

    if (method === 'GET' && path === '/drinks') {
        const category = params.get('category');
        if (category) {
            const upper = category.toUpperCase();
            if (!DRINK_CATEGORIES.includes(upper)) {
                return bad('Invalid category filter. Allowed: COFFEE, TEA, NON_COFFEE');
            }
            return ok(db.drinks.filter(d => d.category === upper));
        }
        return ok([...db.drinks]);
    }
    if (method === 'POST' && path === '/drinks') {
        if (!body || !body.name || !body.name.trim()) {
            return bad('Validation failed: name cannot be blank');
        }
        const cat = (body.category || '').toUpperCase();
        if (!DRINK_CATEGORIES.includes(cat)) {
            return bad('Validation failed: category must be COFFEE, TEA, or NON_COFFEE');
        }
        const price = Number(body.basePrice);
        if (isNaN(price) || price < 50) {
            return bad('Validation failed: basePrice must be at least 50.00');
        }
        if (db.drinks.some(d => d.name.toLowerCase() === body.name.trim().toLowerCase())) {
            return conflict(`A drink named '${body.name.trim()}' already exists`);
        }
        const created = {
            id: db.nextIds.drink++,
            name: body.name.trim(),
            category: cat,
            basePrice: roundMoney(price),
            available: body.available !== undefined ? Boolean(body.available) : true
        };
        db.drinks.push(created);
        return ok(created);
    }
    if (method === 'POST' && path === '/drinks/delete') {
        const id = Number(params.get('id'));
        const idx = db.drinks.findIndex(d => d.id === id);
        if (idx === -1) return notFound(`BaseDrink ID ${id} does not exist`);
        db.drinks.splice(idx, 1);
        return ok({ status: 'DELETED', entity: 'BaseDrink', id });
    }

    if (method === 'GET' && path === '/modifiers') {
        const type = params.get('type');
        if (type) {
            const upper = type.toUpperCase();
            if (!MODIFIER_TYPES.includes(upper)) {
                return bad('Invalid modifier type. Allowed: MILK, SYRUP, TOPPING, SHOT');
            }
            return ok(db.modifiers.filter(m => m.type === upper));
        }
        return ok([...db.modifiers]);
    }
    if (method === 'POST' && path === '/modifiers') {
        if (!body || !body.name || !body.name.trim()) {
            return bad('Validation failed: modifier name cannot be blank');
        }
        const type = (body.type || '').toUpperCase();
        if (!MODIFIER_TYPES.includes(type)) {
            return bad('Validation failed: type must be MILK, SYRUP, TOPPING, or SHOT');
        }
        const cost = Number(body.extraCost);
        if (isNaN(cost) || cost < 0) {
            return bad('Validation failed: extraCost must be >= 0.00');
        }
        const created = {
            id: db.nextIds.modifier++,
            name: body.name.trim(),
            type,
            extraCost: roundMoney(cost),
            inStock: body.inStock !== undefined ? Boolean(body.inStock) : true
        };
        db.modifiers.push(created);
        return ok(created);
    }
    if (method === 'POST' && path === '/modifiers/delete') {
        const id = Number(params.get('id'));
        const idx = db.modifiers.findIndex(m => m.id === id);
        if (idx === -1) return notFound(`Modifier ID ${id} does not exist`);
        db.modifiers.splice(idx, 1);
        return ok({ status: 'DELETED', entity: 'Modifier', id });
    }


    if (method === 'GET' && path === '/orders') {
        const status = params.get('status');
        const code = params.get('memberCode');
        let list = [...db.orders];
        if (status) list = list.filter(o => o.status === status.toUpperCase());
        if (code) list = list.filter(o => o.customer && o.customer.memberCode === code);
        return ok(list);
    }
    if (method === 'POST' && path === '/orders') {
        if (!body || !body.memberCode) return bad('Validation failed: memberCode is required');
        const customer = db.customers.find(c => c.memberCode === body.memberCode);
        if (!customer) return notFound(`Member code ${body.memberCode} is not registered`);
        const stall = (body.pickupLocation || '').toUpperCase();
        if (!VALID_STALL_CODES.includes(stall)) {
            return bad('Validation failed: pickupLocation must be JSEC, GONZAGA, MVP, ISO, or ARETE');
        }
        const created = {
            id: db.nextIds.order++,
            customer: { ...customer },
            pickupLocation: stall,
            status: 'PENDING',
            totalAmount: 0.00,
            createdAt: localIso(),
            readyAt: null,
            reminderSent: false
        };
        db.orders.push(created);
        return ok(created);
    }
    if (method === 'POST' && path === '/orders/status') {
        const orderId = Number(params.get('orderId'));
        const newStatus = (params.get('status') || '').toUpperCase();
        if (!ORDER_STATUSES.includes(newStatus)) {
            return bad('Invalid status. Allowed: PENDING, PREPARING, READY, COMPLETED, CANCELLED');
        }
        const order = db.orders.find(o => o.id === orderId);
        if (!order) return notFound(`Order ID ${orderId} not found`);

        order.status = newStatus;
        if (newStatus === 'READY') {
            order.readyAt = localIso();
            const smsBody = `[BeanLinked Ateneo] Hi ${order.customer.name} (ID: ${order.customer.memberCode})! Your custom drink order #${order.id} (PHP ${order.totalAmount.toFixed(2)}) is READY for pickup at ${order.pickupLocation}!`;
            addSmsToFeed(order.customer.phoneNumber, smsBody, 'READY Alert');
        }
        return ok({ ...order });
    }
    if (method === 'POST' && path === '/orders/delete') {
        const id = Number(params.get('id'));
        const idx = db.orders.findIndex(o => o.id === id);
        if (idx === -1) return notFound(`Order ID ${id} not found`);
        db.orderItems = db.orderItems.filter(i => i.orderId !== id);
        db.orders.splice(idx, 1);
        return ok({ status: 'DELETED', entity: 'CoffeeOrder', id });
    }


    if (method === 'GET' && path === '/order-items') {
        const orderIdParam = params.get('orderId');
        if (orderIdParam) {
            const orderId = Number(orderIdParam);
            const exists = db.orders.some(o => o.id === orderId);
            if (!exists) return notFound(`Order ID ${orderId} not found`);
            return ok(db.orderItems.filter(i => i.orderId === orderId));
        }
        return ok([...db.orderItems]);
    }
    if (method === 'POST' && path === '/order-items') {
        const order = db.orders.find(o => o.id === Number(body.orderId));
        if (!order) return notFound(`Parent CoffeeOrder ID ${body.orderId} not found`);
        const drink = db.drinks.find(d => d.id === Number(body.baseDrinkId));
        if (!drink) return notFound(`BaseDrink ID ${body.baseDrinkId} not found`);
        if (!drink.available) return conflict(`'${drink.name}' is currently unavailable`);

        const modIds = Array.isArray(body.modifierIds) ? body.modifierIds.map(Number) : [];
        const selectedMods = [];
        let modSum = 0;
        for (const mId of modIds) {
            const mod = db.modifiers.find(m => m.id === mId);
            if (!mod || !mod.inStock) {
                return bad('Requested base drink or modifier is currently out of stock');
            }
            selectedMods.push({ ...mod });
            modSum += mod.extraCost;
        }

        if (!CUP_SIZES.includes(body.size)) return bad('Invalid size. Allowed: REGULAR, LARGE');
        if (!ICE_LEVELS.includes(body.iceLevel)) return bad('Invalid iceLevel');
        if (!SUGAR_LEVELS.includes(body.sugarLevel)) return bad('Invalid sugarLevel');

        const sizeUpcharge = body.size === 'LARGE' ? 20.00 : 0.00;
        const subtotal = roundMoney(drink.basePrice + sizeUpcharge + modSum);

        const item = {
            id: db.nextIds.orderItem++,
            orderId: order.id,
            baseDrink: { ...drink },
            modifiers: selectedMods,
            size: body.size,
            iceLevel: body.iceLevel,
            sugarLevel: body.sugarLevel,
            cupNotes: (body.cupNotes || '').trim().slice(0, 120),
            subtotal
        };
        db.orderItems.push(item);

        order.totalAmount = roundMoney(
            db.orderItems
                .filter(i => i.orderId === order.id)
                .reduce((acc, cur) => acc + cur.subtotal, 0)
        );

        return ok(item);
    }
    if (method === 'POST' && path === '/order-items/delete') {
        const id = Number(params.get('id'));
        const idx = db.orderItems.findIndex(i => i.id === id);
        if (idx === -1) return notFound(`OrderItem ID ${id} not found`);
        const removed = db.orderItems.splice(idx, 1)[0];
        const parentOrder = db.orders.find(o => o.id === removed.orderId);
        if (parentOrder) {
            parentOrder.totalAmount = roundMoney(
                db.orderItems
                    .filter(i => i.orderId === parentOrder.id)
                    .reduce((acc, cur) => acc + cur.subtotal, 0)
            );
        }
        return ok({ status: 'DELETED', entity: 'OrderItem', id });
    }

    return notFound(`Unknown endpoint ${method} ${path}`);

}

async function handleModeChange(newMode) {

    appMode = newMode;
    const liveUrlBar = document.getElementById('live-url-bar');
    const modeLabel = document.getElementById('inspector-mode-label');
    const schedBtn = document.getElementById('btn-simulate-scheduler');

    if (appMode === 'live') {
        liveUrlBar.classList.remove('hidden');
        modeLabel.textContent = `Mode: live (${getLiveBaseUrl()})`;
        schedBtn.innerHTML = `${icon('clock')}<span>Scheduler runs on the server</span>`;
        schedBtn.className = 'btn btn-soft';
        setModeDot('connecting');
        await syncFromLiveBackend(true);
    } else {
        liveUrlBar.classList.add('hidden');
        modeLabel.textContent = 'Mode: demo data';
        schedBtn.innerHTML = `${icon('clock')}<span>Run scheduler now</span>`;
        schedBtn.className = 'btn btn-caramel';
        setModeDot(null);
        showToast('Using demo data', 'Changes stay in this browser tab and reset on reload.', 'info');
        renderAllViews();
    }
}

async function syncFromLiveBackend(announce = false) {

    document.getElementById('inspector-mode-label').textContent = `Mode: live (${getLiveBaseUrl()})`;

    const [cRes, dRes, mRes, oRes] = await Promise.all([
        apiCall('GET', '/customers'),
        apiCall('GET', '/drinks'),
        apiCall('GET', '/modifiers'),
        apiCall('GET', '/orders')
    ]);

    if (!cRes.ok && cRes.status === 0) {
        setModeDot('down');
        showToast('Can\'t reach the server', `Start BeanLinked in Eclipse, then press sync. Tried ${getLiveBaseUrl()}.`, 'error');
        return;
    }
    setModeDot(null);

    if (cRes.ok && Array.isArray(cRes.data)) db.customers = cRes.data;
    if (dRes.ok && Array.isArray(dRes.data)) db.drinks = dRes.data;
    if (mRes.ok && Array.isArray(mRes.data)) db.modifiers = mRes.data;
    if (oRes.ok && Array.isArray(oRes.data)) db.orders = oRes.data;


    const mappedItems = [];
    for (const order of db.orders) {
        const itemsRes = await apiCall('GET', `/order-items?orderId=${order.id}`);
        if (itemsRes.ok && Array.isArray(itemsRes.data)) {
            for (const item of itemsRes.data) mappedItems.push({ ...item, orderId: order.id });
        }
    }
    db.orderItems = mappedItems;

    if (db.customers.length && !db.customers.some(c => c.memberCode === studentState.selectedMemberCode)) {
        studentState.selectedMemberCode = db.customers[0].memberCode;
    }
    if (db.drinks.length && !db.drinks.some(d => d.id === studentState.selectedDrinkId)) {
        studentState.selectedDrinkId = db.drinks[0].id;
    }

    if (announce) showToast('Connected to the live server', `Loaded ${db.customers.length} customers, ${db.drinks.length} drinks, ${db.orders.length} orders.`, 'success');
    renderAllViews();
}

function toggleInspector(forceState) {
    inspectorOpen = typeof forceState === 'boolean' ? forceState : !inspectorOpen;
    document.getElementById('inspector-drawer').classList.toggle('is-open', inspectorOpen);
    document.getElementById('inspector-backdrop').classList.toggle('hidden', !inspectorOpen);
}

function recordRestLog(method, endpoint, status, requestBody, responseBody, modeTag) {
    const entry = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        method,
        endpoint,
        status,
        requestBody,
        responseBody,
        modeTag
    };
    restLogs.unshift(entry);
    if (restLogs.length > 60) restLogs.pop();
    renderRestLogs();
}

function clearRestLogs() {
    restLogs = [];
    renderRestLogs();
}

function renderRestLogs() {
    const list = document.getElementById('rest-log-list');
    document.getElementById('inspector-count-badge').textContent = restLogs.length;
    document.getElementById('inspector-total-calls').textContent = `${restLogs.length} call${restLogs.length === 1 ? '' : 's'} logged`;

    if (!restLogs.length) {
        list.innerHTML = `<p style="text-align:center;color:#7d7067;padding:40px 0">No requests yet. Use any tab and they show up here.</p>`;
        return;
    }

    list.innerHTML = restLogs.map((log, idx) => {
        let codeClass = 'code-ok', codeText = `${log.status} OK`;
        if (log.status === 400) { codeClass = 'code-warn'; codeText = '400 Bad Request'; }
        else if (log.status === 409) { codeClass = 'code-warn'; codeText = '409 Conflict'; }
        else if (log.status === 404) { codeClass = 'code-bad'; codeText = '404 Not Found'; }
        else if (log.status >= 500 || log.status === 0) { codeClass = 'code-bad'; codeText = log.status ? `${log.status} Error` : 'Network error'; }

        const reqJson = log.requestBody !== null ? JSON.stringify(log.requestBody, null, 2) : null;
        const resJson = JSON.stringify(log.responseBody, null, 2);
        return `
            <div class="log-entry">
                <div class="log-top">
                    <span><span class="method method-${log.method}">${log.method}</span><span class="path">${escapeHtml(log.endpoint)}</span></span>
                    <span class="code-badge ${codeClass}">${codeText}</span>
                </div>
                <div class="log-sub"><span>${log.time} · ${log.modeTag}</span><button type="button" onclick="copyRestLog(${idx})">${icon('copy')} Copy response</button></div>
                ${reqJson ? `<div class="log-label">Request body</div><pre>${escapeHtml(reqJson)}</pre>` : ''}
                <div class="log-label res" style="margin-top:6px">Response</div><pre>${escapeHtml(resJson)}</pre>
            </div>`;
    }).join('');
}

function copyRestLog(index) {
    const log = restLogs[index];
    if (!log) return;
    copyTextFallback(JSON.stringify(log.responseBody, null, 2));
}

function addSmsToFeed(phone, message, badge = 'READY Alert') {
    smsFeed.unshift({
        id: Date.now() + Math.random(),
        phone,
        message,
        badge,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    renderSmsFeed();
}

function renderSmsFeed() {
    const container = document.getElementById('twilio-sms-feed');
    document.getElementById('sms-count-badge').textContent = `${smsFeed.length} sent`;

    if (!smsFeed.length) {
        container.innerHTML = `<div class="sms-empty"><strong>No texts sent yet</strong>Mark an order READY or run the scheduler, and the text shows up here.</div>`;
        return;
    }
    container.innerHTML = smsFeed.map(sms => `
        <div class="sms-bubble">
            <div class="sms-top">
                <span class="to num">To ${escapeHtml(sms.phone)}</span>
                <span class="sms-kind ${sms.badge.includes('Reminder') ? 'is-reminder' : ''}">${escapeHtml(sms.badge)}</span>
            </div>
            <p>${escapeHtml(sms.message)}</p>
            <div class="sms-foot"><span>via fakeTwilio</span><span>${sms.time}</span></div>
        </div>`).join('');
}


function switchMainTab(tab) {
    currentMainTab = tab;
    ['student', 'barista', 'admin'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tab);
        document.getElementById(`nav-tab-${t}`).classList.toggle('is-active', t === tab);
    });
    if (tab === 'barista') renderBaristaQueue();
    if (tab === 'admin') renderAdminManager();
}

function updateHeaderQueueBadge() {
    const activeCount = db.orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY').length;
    document.getElementById('nav-active-queue-badge').textContent = activeCount;
}


function toggleInlineRegForm() {
    const panel = document.getElementById('inline-reg-panel');
    panel.classList.toggle('hidden');
    document.getElementById('inline-reg-error').classList.add('hidden');
}

async function handleInlineRegistration(e) {
    e.preventDefault();
    const errEl = document.getElementById('inline-reg-error');
    errEl.classList.add('hidden');

    const payload = {
        memberCode: document.getElementById('reg-memberCode').value.trim(),
        name: document.getElementById('reg-name').value.trim(),
        phoneNumber: document.getElementById('reg-phone').value.trim()
    };

    const res = await apiCall('POST', '/customers', payload);
    if (!res.ok) {
        errEl.textContent = apiErr(res, 'Registration failed. Check format.');
        errEl.classList.remove('hidden');
        return;
    }

    if (appMode === 'live') {
        await syncFromLiveBackend();
    }
    studentState.selectedMemberCode = res.data.memberCode;
    document.getElementById('inline-reg-form').reset();
    document.getElementById('reg-phone').value = '+63917';
    toggleInlineRegForm();
    renderStudentView();
    showToast('Ateneo Student Registered', `${res.data.name} (${res.data.memberCode}) is now selected.`, 'success');
}

function selectStudent(memberCode) {
    studentState.selectedMemberCode = memberCode;
    renderTray();
}

function selectPickupStall(code) {
    studentState.pickupLocation = code;
    renderStallSelector();
    renderTray();
}

function renderStallSelector() {
    document.getElementById('stall-selector').innerHTML = CAMPUS_STALLS.map(stall => `
        <button type="button" class="chip chip-tile ${studentState.pickupLocation === stall.code ? 'is-active' : ''}"
                onclick="selectPickupStall('${stall.code}')" aria-pressed="${studentState.pickupLocation === stall.code}">
            <span>${stall.label}</span><span class="chip-sub">${stall.hint}</span>
        </button>`).join('');
}

function setDrinkCategoryFilter(cat) {
    studentState.categoryFilter = cat;
    renderDrinkCategoryFilters();
    renderDrinkCards();
}

function renderDrinkCategoryFilters() {
    document.getElementById('drink-category-filters').innerHTML = ['ALL', ...DRINK_CATEGORIES].map(c => `
        <button type="button" class="${studentState.categoryFilter === c ? 'is-active' : ''}" onclick="setDrinkCategoryFilter('${c}')">
            ${{ ALL: 'All', COFFEE: 'Coffee', TEA: 'Tea', NON_COFFEE: 'Non-coffee' }[c]}
        </button>`).join('');
}

function renderDrinkCards() {
    const grid = document.getElementById('drink-cards-grid');
    const filtered = db.drinks.filter(d => studentState.categoryFilter === 'ALL' || d.category === studentState.categoryFilter);

    if (!filtered.length) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${icon('cup')}<strong>Nothing in this category yet</strong>Add a drink from the Admin tab.</div>`;
    } else {
        const catIcon = { COFFEE: 'cup', TEA: 'leaf', NON_COFFEE: 'cookie' };
        const catName = { COFFEE: 'Coffee', TEA: 'Tea', NON_COFFEE: 'Non-coffee' };
        grid.innerHTML = filtered.map(drink => {
            const selected = drink.id === studentState.selectedDrinkId;
            const unavailable = !drink.available;
            return `
                <button type="button" class="drink-card ${selected ? 'is-selected' : ''}" ${unavailable ? 'disabled' : `onclick="selectDrink(${drink.id})"`} aria-pressed="${selected}">
                    <div>
                        <div class="drink-top">
                            <span class="cat-tag">${icon(catIcon[drink.category] || 'cup')}${catName[drink.category] || drink.category}</span>
                            <span class="price num">${formatPHP(drink.basePrice)}</span>
                        </div>
                        <h3>${escapeHtml(drink.name)}</h3>
                    </div>
                    <div class="drink-foot">
                        <span class="num">#${drink.id}</span>
                        ${unavailable ? '<span class="is-out">Sold out</span>' : (selected ? `<span class="is-on">${icon('check')} Selected</span>` : '<span>Tap to choose</span>')}
                    </div>
                </button>`;
        }).join('');
    }

    const currentDrink = db.drinks.find(d => d.id === studentState.selectedDrinkId);
    document.getElementById('active-drink-pill').innerHTML = currentDrink
        ? `${icon('cup')} ${escapeHtml(currentDrink.name)} · ${formatPHP(currentDrink.basePrice)}`
        : 'Pick a drink first';
    updateLiveCupSubtotal();
}

function selectDrink(id) {
    studentState.selectedDrinkId = id;
    renderDrinkCards();
}

function setCupOption(field, value) {
    studentState[field] = value;
    renderCustomizerOptions();
    updateLiveCupSubtotal();
}

function toggleModifierSelection(modId) {
    const idx = studentState.selectedModifierIds.indexOf(modId);
    if (idx >= 0) studentState.selectedModifierIds.splice(idx, 1);
    else studentState.selectedModifierIds.push(modId);
    renderModifiersGrouped();
    updateLiveCupSubtotal();
}

function renderCustomizerOptions() {
    const chips = (field, values, sub) => values.map(v => `
        <button type="button" class="chip ${studentState[field] === v ? 'is-active' : ''}" onclick="setCupOption('${field}', '${v}')" aria-pressed="${studentState[field] === v}">
            <span>${v.charAt(0) + v.slice(1).toLowerCase()}</span>${sub ? `<span class="chip-sub">${sub(v)}</span>` : ''}
        </button>`).join('');
    document.getElementById('size-options').innerHTML = chips('size', CUP_SIZES, v => v === 'LARGE' ? '+₱20' : 'included');
    document.getElementById('ice-options').innerHTML = chips('iceLevel', ICE_LEVELS);
    document.getElementById('sugar-options').innerHTML = chips('sugarLevel', SUGAR_LEVELS);
}

function renderModifiersGrouped() {
    const typeName = { MILK: 'Milk', SYRUP: 'Syrup', TOPPING: 'Topping', SHOT: 'Extra shot' };
    document.getElementById('modifiers-grouped-container').innerHTML = MODIFIER_TYPES.map(type => {
        const mods = db.modifiers.filter(m => m.type === type);
        return `
            <div class="subpanel">
                <div class="subpanel-title"><span>${typeName[type]}</span><span class="muted tiny">${mods.length} option${mods.length === 1 ? '' : 's'}</span></div>
                ${mods.length ? mods.map(m => {
                    const checked = studentState.selectedModifierIds.includes(m.id);
                    const out = !m.inStock;
                    return `
                        <label class="mod-option ${checked ? 'is-checked' : ''} ${out ? 'is-out' : ''}">
                            <span><input type="checkbox" ${checked ? 'checked' : ''} ${out ? 'disabled' : ''} onchange="toggleModifierSelection(${m.id})">${escapeHtml(m.name)}${out ? ' (sold out)' : ''}</span>
                            <span class="mod-cost num">+${formatPHP(m.extraCost)}</span>
                        </label>`;
                }).join('') : `<p class="muted small">None available right now.</p>`}
            </div>`;
    }).join('');
}

function updateNotesCounter(val) {
    document.getElementById('cup-notes-counter').textContent = `${val.length} / 120`;
}

function computeCurrentCupSubtotal() {
    const drink = db.drinks.find(d => d.id === studentState.selectedDrinkId);
    if (!drink) return 0;
    const sizeCost = studentState.size === 'LARGE' ? 20.00 : 0.00;
    const modsCost = studentState.selectedModifierIds.reduce((sum, id) => {
        const mod = db.modifiers.find(m => m.id === id && m.inStock);
        return sum + (mod ? mod.extraCost : 0);
    }, 0);
    return roundMoney(drink.basePrice + sizeCost + modsCost);
}

function updateLiveCupSubtotal() {
    document.getElementById('live-cup-subtotal').textContent = formatPHP(computeCurrentCupSubtotal());
}

function addCupToTray() {
    const drink = db.drinks.find(d => d.id === studentState.selectedDrinkId);
    if (!drink || !drink.available) {
        showToast('Select an Available Drink', 'Please pick an available base drink first.', 'warning');
        return;
    }
    const mods = db.modifiers.filter(m => studentState.selectedModifierIds.includes(m.id) && m.inStock);
    const notes = document.getElementById('cup-notes-input').value.trim();
    const subtotal = computeCurrentCupSubtotal();

    studentState.tray.push({
        draftId: Date.now() + Math.random(),
        baseDrink: { ...drink },
        modifiers: mods.map(m => ({ ...m })),
        modifierIds: mods.map(m => m.id),
        size: studentState.size,
        iceLevel: studentState.iceLevel,
        sugarLevel: studentState.sugarLevel,
        cupNotes: notes,
        subtotal
    });


    studentState.selectedModifierIds = [];
    document.getElementById('cup-notes-input').value = '';
    updateNotesCounter('');
    renderModifiersGrouped();
    updateLiveCupSubtotal();
    renderTray();
    const cupEl = document.getElementById('tray-cup');
    cupEl.classList.remove('bubbling'); void cupEl.getBoundingClientRect(); cupEl.classList.add('bubbling');
    showToast('Added to tray', `${drink.name} (${studentState.size}) — ${formatPHP(subtotal)}`, 'success');
}

function removeCupFromTray(draftId) {
    studentState.tray = studentState.tray.filter(c => c.draftId !== draftId);
    renderTray();
}

function renderTray() {
    const student = db.customers.find(c => c.memberCode === studentState.selectedMemberCode);
    const count = studentState.tray.length;
    const total = roundMoney(studentState.tray.reduce((sum, c) => sum + c.subtotal, 0));

    document.getElementById('tray-count-pill').textContent = `${count} cup${count === 1 ? '' : 's'}`;
    const cup = document.getElementById('tray-cup');
    cup.style.setProperty('--fill', Math.min(count, 5) / 5 * 0.82);
    cup.classList.toggle('has-items', count > 0);
    document.getElementById('tray-total-php').textContent = formatPHP(total);
    document.getElementById('btn-place-order').disabled = count === 0 || !student;

    document.getElementById('tray-meta-summary').innerHTML = `
        <span class="who">${icon('user')} ${student ? `${escapeHtml(student.name)} · <span class="num">${student.memberCode}</span>` : 'Pick or register an ID'}</span>
        <span class="stall-badge">${icon('pin')}${studentState.pickupLocation}</span>`;

    const container = document.getElementById('tray-items-container');
    if (!count) {
        container.innerHTML = `<div class="empty">${icon('cup')}<strong>Your tray is empty</strong>Build a cup, then tap Add to tray.</div>`;
        return;
    }
    container.innerHTML = studentState.tray.map(cupItem => `
        <div class="tray-item">
            <div style="min-width:0">
                <h4>${escapeHtml(cupItem.baseDrink.name)}</h4>
                <div class="tags">
                    <span class="tag tag-blue">${cupItem.size === 'LARGE' ? 'Large' : 'Regular'}</span>
                    <span class="tag">${cupItem.iceLevel.toLowerCase()} ice</span>
                    <span class="tag">${cupItem.sugarLevel} sugar</span>
                </div>
                ${cupItem.modifiers.length ? `<p class="small">+ ${cupItem.modifiers.map(m => escapeHtml(m.name)).join(', ')}</p>` : ''}
                ${cupItem.cupNotes ? `<p class="small muted"><em>“${escapeHtml(cupItem.cupNotes)}”</em></p>` : ''}
            </div>
            <div class="tray-item-side">
                <span class="price num">${formatPHP(cupItem.subtotal)}</span>
                <button type="button" class="btn btn-berry btn-icon" onclick="removeCupFromTray(${cupItem.draftId})" aria-label="Remove ${escapeHtml(cupItem.baseDrink.name)}">${icon('trash')}</button>
            </div>
        </div>`).join('');
}

async function placeOrderFromTray() {

    if (!studentState.tray.length) return;
    const student = db.customers.find(c => c.memberCode === studentState.selectedMemberCode);
    if (!student) {
        showToast('Missing Student', 'Please select or register an Ateneo student.', 'error');
        return;
    }

    const btn = document.getElementById('btn-place-order');
    btn.disabled = true;

    const orderRes = await apiCall('POST', '/orders', {
        memberCode: student.memberCode,
        pickupLocation: studentState.pickupLocation
    });
    if (!orderRes.ok) {
        showToast('Order Creation Failed', apiErr(orderRes, 'Could not create order header.'), 'error');
        btn.disabled = false;
        return;
    }
    const createdOrder = orderRes.data;

    let failed = 0;
    for (const cup of studentState.tray) {
        const itemRes = await apiCall('POST', '/order-items', {
            orderId: createdOrder.id,
            baseDrinkId: cup.baseDrink.id,
            modifierIds: cup.modifierIds,
            size: cup.size,
            iceLevel: cup.iceLevel,
            sugarLevel: cup.sugarLevel,
            cupNotes: cup.cupNotes || null
        });
        if (!itemRes.ok) {
            failed++;
            showToast(`Couldn't add ${cup.baseDrink.name}`, apiErr(itemRes, 'The server rejected this cup.'), 'warning');
        }
    }

    const sendToPreparing = document.getElementById('chk-submit-preparing').checked && failed === 0;
    if (sendToPreparing) {
        const stRes = await apiCall('POST', `/orders/status?orderId=${createdOrder.id}&status=PREPARING`);
        if (!stRes.ok) showToast('Order saved but not sent', apiErr(stRes, 'Could not send it to the barista.'), 'warning');
    }

    const cupCount = studentState.tray.length;
    studentState.tray = [];

    if (appMode === 'live') {
        await syncFromLiveBackend();
    } else {
        renderAllViews();
    }

    showToast(
        `Order #${createdOrder.id} placed`,
        `${cupCount} cup${cupCount > 1 ? 's' : ''} sent to ${createdOrder.pickupLocation} (${sendToPreparing ? 'PREPARING' : 'PENDING'}).`,
        'success'
    );


}


function renderStudentView() {
    const select = document.getElementById('student-select');
    if (!db.customers.length) {
        select.innerHTML = `<option value="">No registered students</option>`;
    } else {
        if (!db.customers.some(c => c.memberCode === studentState.selectedMemberCode)) {
            studentState.selectedMemberCode = db.customers[0].memberCode;
        }
        select.innerHTML = db.customers.map(c =>
            `<option value="${escapeHtml(c.memberCode)}" ${c.memberCode === studentState.selectedMemberCode ? 'selected' : ''}>
                ${escapeHtml(c.memberCode)} — ${escapeHtml(c.name)} (${escapeHtml(c.phoneNumber)})
            </option>`
        ).join('');
    }
    renderStallSelector();
    renderDrinkCategoryFilters();
    renderDrinkCards();
    renderCustomizerOptions();
    renderModifiersGrouped();
    renderTray();
}

function setBaristaStatusFilter(status) {
    baristaState.statusFilter = status;
    renderBaristaQueue();
}

async function queryOrdersViaApi() {
    const searchId = document.getElementById('barista-search-id').value.trim();
    const qs = new URLSearchParams();
    if (baristaState.statusFilter !== 'ALL') qs.set('status', baristaState.statusFilter);
    if (searchId) qs.set('memberCode', searchId);
    const path = '/orders' + (qs.toString() ? `?${qs.toString()}` : '');

    const res = await apiCall('GET', path);
    if (appMode === 'live' && res.ok) {
        await syncFromLiveBackend();
    } else {
        renderBaristaQueue();
    }
    showToast('Queried Orders', `GET /api${path} (${res.ok && Array.isArray(res.data) ? res.data.length : 0} results)`, 'info');
}

async function updateOrderStatusAction(orderId, newStatus) {
    const res = await apiCall('POST', `/orders/status?orderId=${orderId}&status=${newStatus}`);
    if (!res.ok) {
        showToast('Status Update Failed', apiErr(res, 'Unable to update order.'), 'error');
        return;
    }

     if (appMode === 'live' && newStatus === 'READY' && res.data && res.data.customer) {
        const o = res.data;
        const smsBody = `[BeanLinked Ateneo] Hi ${o.customer.name} (ID: ${o.customer.memberCode})! Your custom drink order #${o.id} (PHP ${Number(o.totalAmount || 0).toFixed(2)}) is READY for pickup at ${o.pickupLocation}!`;
        addSmsToFeed(o.customer.phoneNumber, smsBody, 'Sent to fakeTwilio');
    }

    if (appMode === 'live') {
        await syncFromLiveBackend();
    } else {
        renderAllViews();
    }

    if (newStatus === 'READY') {
        showToast(`Order #${orderId} is READY`, 'Pickup text sent to the student.', 'success');
    } else {
        showToast(`Order #${orderId} Updated`, `Order status changed to ${newStatus}.`, 'info');
    }
}

function simulateScheduledTask() {
    if (appMode === 'live') {
        showToast('Server-Side Scheduler', 'In Live Mode, Spring @Scheduled(fixedRate = 60000) executes automatically inside OrderSchedulerComponent.', 'info');
        return;
    }

    let cancelledCount = 0;
    let remindersSent = 0;

    db.orders.forEach(order => {
        if (order.status === 'PENDING') {
            order.status = 'CANCELLED';
            cancelledCount++;
        } else if (order.status === 'READY' && !order.reminderSent) {
            order.reminderSent = true;
            remindersSent++;
            const msg = `[BeanLinked Ateneo Reminder] Hi ${order.customer.name} (ID: ${order.customer.memberCode})! Your custom drink order #${order.id} is still waiting for pickup at ${order.pickupLocation}!`;
            addSmsToFeed(order.customer.phoneNumber, msg, '@Scheduled Reminder');
        }
    });

    recordRestLog(
        'POST',
        '/internal/@Scheduled/OrderSchedulerComponent',
        200,
        { fixedRateMs: 60000, rules: ['Cancel PENDING carts', 'Remind unclaimed READY orders'] },
        { cancelledPendingOrders: cancelledCount, readyRemindersDispatched: remindersSent },
        'MOCK'
    );

    renderAllViews();
    showToast(
        '@Scheduled Task Executed',
        `Auto-cancelled ${cancelledCount} PENDING order(s) & sent ${remindersSent} READY pickup reminder(s).`,
        cancelledCount || remindersSent ? 'success' : 'info'
    );
}

function renderBaristaQueue() {
    document.getElementById('barista-status-filters').innerHTML = ['ALL', ...ORDER_STATUSES].map(st => {
        const count = st === 'ALL' ? db.orders.length : db.orders.filter(o => o.status === st).length;
        return `<button type="button" class="filter-chip ${baristaState.statusFilter === st ? 'is-active' : ''}" onclick="setBaristaStatusFilter('${st}')">
                    ${st === 'ALL' ? 'All' : st}<span class="n">${count}</span></button>`;
    }).join('');

    const searchCode = (document.getElementById('barista-search-id').value || '').trim();
    let visible = [...db.orders].sort((a, b) => b.id - a.id);
    if (baristaState.statusFilter !== 'ALL') visible = visible.filter(o => o.status === baristaState.statusFilter);
    if (searchCode) visible = visible.filter(o => o.customer && o.customer.memberCode.includes(searchCode));

    const grid = document.getElementById('barista-orders-grid');
    if (!visible.length) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1;background:var(--foam)">${icon('cup')}<strong>No orders here</strong>Try All, or place an order from the first tab.</div>`;
        return;
    }

    const actions = {
        PENDING:   o => `<button type="button" class="btn btn-primary btn-sm" onclick="updateOrderStatusAction(${o.id}, 'PREPARING')">Start preparing</button>`,
        PREPARING: o => `<button type="button" class="btn btn-matcha btn-sm" onclick="updateOrderStatusAction(${o.id}, 'READY')">${icon('bell')} Mark READY and text</button>`,
        READY:     o => `<button type="button" class="btn btn-dark btn-sm" onclick="updateOrderStatusAction(${o.id}, 'COMPLETED')">${icon('check')} Picked up</button>`
    };

    grid.innerHTML = visible.map(order => {
        const items = db.orderItems.filter(i => i.orderId === order.id);
        const act = actions[order.status];
        return `
            <article class="order-card">
                <div>
                    <div class="order-head">
                        <div class="row" style="gap:6px">
                            <span class="order-id num">#${order.id}</span>
                            <span class="stall-badge">${icon('pin')}${escapeHtml(order.pickupLocation)}</span>
                            <span class="status status-${order.status}">${order.status}</span>
                        </div>
                        <span class="price num">${formatPHP(order.totalAmount)}</span>
                    </div>
                    <div class="student-box" style="margin:12px 0">
                        <div><strong>${escapeHtml(order.customer?.name || 'Unknown')}</strong>
                        <span class="muted num">${escapeHtml(order.customer?.memberCode || '—')} · ${escapeHtml(order.customer?.phoneNumber || '—')}</span></div>
                        ${order.reminderSent ? '<span class="reminded">Reminded</span>' : ''}
                    </div>
                    ${items.length ? items.map(item => `
                        <div class="order-line">
                            <div class="line-top"><span>${escapeHtml(item.baseDrink?.name || 'Drink')}</span><span class="num">${formatPHP(item.subtotal)}</span></div>
                            <div class="muted">${item.size === 'LARGE' ? 'Large' : 'Regular'} · ${String(item.iceLevel).toLowerCase()} ice · ${item.sugarLevel} sugar</div>
                            ${item.modifiers && item.modifiers.length ? `<div class="mods">+ ${item.modifiers.map(m => escapeHtml(m.name)).join(', ')}</div>` : ''}
                            ${item.cupNotes ? `<div class="note">“${escapeHtml(item.cupNotes)}”</div>` : ''}
                        </div>`).join('') : '<p class="muted small">No drinks on this order yet.</p>'}
                </div>
                <div>
                    <div class="order-times num"><span>Placed ${formatTimestamp(order.createdAt)}</span><span>Ready ${formatTimestamp(order.readyAt)}</span></div>
                    <div class="order-actions" style="margin-top:10px">
                        ${act ? act(order) + `<button type="button" class="btn btn-berry btn-sm" onclick="updateOrderStatusAction(${order.id}, 'CANCELLED')">Cancel</button>`
                              : `<span class="finalized">Done · ${order.status.toLowerCase()}</span>`}
                    </div>
                </div>
            </article>`;
    }).join('');
}


const ADMIN_ENTITIES = ['Customer', 'BaseDrink', 'Modifier', 'CoffeeOrder', 'OrderItem'];

function switchAdminEntity(entity) {
    currentAdminEntity = entity;
    renderAdminManager();
}

async function refreshCurrentCrudEntity() {

    const paths = {
        Customer: '/customers',
        BaseDrink: '/drinks',
        Modifier: '/modifiers',
        CoffeeOrder: '/orders',
        OrderItem: '/order-items'
    };
    const res = await apiCall('GET', paths[currentAdminEntity]);
    if (appMode === 'live' && res.ok) {
        await syncFromLiveBackend();
    } else {
        renderAdminManager();
    }
    showToast(`Refreshed ${currentAdminEntity}`, `GET /api${paths[currentAdminEntity]}`, 'info');

}

async function deleteEntityRow(entity, id) {
    const paths = {
        Customer: `/customers/delete?id=${id}`,
        BaseDrink: `/drinks/delete?id=${id}`,
        Modifier: `/modifiers/delete?id=${id}`,
        CoffeeOrder: `/orders/delete?id=${id}`,
        OrderItem: `/order-items/delete?id=${id}`
    };
    const res = await apiCall('POST', paths[entity]);
    if (!res.ok) {
        showToast('Delete Failed', apiErr(res, `Could not delete ${entity} #${id}`), 'error');
        return;
    }
    if (appMode === 'live') {
        await syncFromLiveBackend();
    } else {
        renderAllViews();
    }
    showToast(`${entity} Deleted`, `Removed ${entity} ID #${id} at runtime.`, 'warning');
}

async function handleAdminCreateSubmit(e, entity) {
    e.preventDefault();
    const errBox = document.getElementById('admin-form-error');
    if (errBox) errBox.classList.add('hidden');

    let path = '';
    let payload = {};

    if (entity === 'Customer') {
        path = '/customers';
        payload = {
            memberCode: document.getElementById('crud-c-code').value.trim(),
            name: document.getElementById('crud-c-name').value.trim(),
            phoneNumber: document.getElementById('crud-c-phone').value.trim()
        };
    } else if (entity === 'BaseDrink') {
        path = '/drinks';
        payload = {
            name: document.getElementById('crud-d-name').value.trim(),
            category: document.getElementById('crud-d-cat').value,
            basePrice: Number(document.getElementById('crud-d-price').value),
            available: document.getElementById('crud-d-avail').checked
        };
    } else if (entity === 'Modifier') {
        path = '/modifiers';
        payload = {
            name: document.getElementById('crud-m-name').value.trim(),
            type: document.getElementById('crud-m-type').value,
            extraCost: Number(document.getElementById('crud-m-cost').value),
            inStock: document.getElementById('crud-m-stock').checked
        };
    } else if (entity === 'CoffeeOrder') {
        path = '/orders';
        payload = {
            memberCode: document.getElementById('crud-o-code').value,
            pickupLocation: document.getElementById('crud-o-stall').value
        };
    } else if (entity === 'OrderItem') {
        path = '/order-items';
        const checkedMods = Array.from(document.querySelectorAll('.crud-oi-mod:checked')).map(el => Number(el.value));
        payload = {
            orderId: Number(document.getElementById('crud-oi-order').value),
            baseDrinkId: Number(document.getElementById('crud-oi-drink').value),
            modifierIds: checkedMods,
            size: document.getElementById('crud-oi-size').value,
            iceLevel: document.getElementById('crud-oi-ice').value,
            sugarLevel: document.getElementById('crud-oi-sugar').value,
            cupNotes: document.getElementById('crud-oi-notes').value.trim()
        };
    }

    const res = await apiCall('POST', path, payload);
    if (!res.ok) {
        if (errBox) {
            errBox.textContent = apiErr(res, 'Validation failed.');
            errBox.classList.remove('hidden');
        }
        showToast('Validation / API Error', apiErr(res, 'Could not create row.'), 'error');
        return;
    }

    if (appMode === 'live') {
        await syncFromLiveBackend();
    } else {
        renderAllViews();
    }
    showToast(`${entity} Created`, `Successfully created new ${entity} row (#${res.data.id || 'OK'}).`, 'success');
}

function renderAdminManager() {
    const counts = { Customer: db.customers.length, BaseDrink: db.drinks.length, Modifier: db.modifiers.length, CoffeeOrder: db.orders.length, OrderItem: db.orderItems.length };
    document.getElementById('admin-entity-tabs').innerHTML = ADMIN_ENTITIES.map(ent => `
        <button type="button" class="entity-tab ${currentAdminEntity === ent ? 'is-active' : ''}" onclick="switchAdminEntity('${ent}')">${ent}<span class="n">${counts[ent]}</span></button>`).join('');

    const formBox = document.getElementById('admin-create-form-container');
    const tableBox = document.getElementById('admin-table-container');
    const field = (label, control, extra = '') => `<div class="field ${extra}"><label>${label}</label>${control}</div>`;
    const opts = (arr, sel) => arr.map(v => `<option value="${v}" ${v === sel ? 'selected' : ''}>${v}</option>`).join('');
    const delBtn = (ent, id) => `<button type="button" class="btn btn-berry btn-sm" onclick="deleteEntityRow('${ent}', ${id})">Delete</button>`;
    const table = (heads, rows, empty) => `<table><thead><tr>${heads.map(h => `<th${h === '' ? ' class="right"' : ''}>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${heads.length}" class="muted" style="text-align:center;padding:24px">${empty}</td></tr>`}</tbody></table>`;
    const errLine = `<p id="admin-form-error" class="form-error span-all hidden"></p>`;

    if (currentAdminEntity === 'Customer') {
        formBox.innerHTML = `<h3>New customer <span class="muted small code">POST /api/customers</span></h3>
            <form class="create-form" onsubmit="handleAdminCreateSubmit(event, 'Customer')">
                ${field('Ateneo ID (6 digits)', '<input id="crud-c-code" class="input num" required pattern="^\\d{6}$" maxlength="6" placeholder="229988">')}
                ${field('Full name', '<input id="crud-c-name" class="input" required minlength="2" placeholder="Juan Paolo Gines">')}
                ${field('Mobile number', '<input id="crud-c-phone" class="input num" required pattern="^\\+639\\d{9}$" value="+63917">')}
                <button type="submit" class="btn btn-primary">${icon('plus')} Create customer</button>${errLine}
            </form>`;
        tableBox.innerHTML = table(['ID', 'Ateneo ID', 'Name', 'Phone', ''], db.customers.map(c => `
            <tr><td class="num">#${c.id}</td><td class="num"><strong>${escapeHtml(c.memberCode)}</strong></td><td>${escapeHtml(c.name)}</td>
            <td class="num">${escapeHtml(c.phoneNumber)}</td><td class="right">${delBtn('Customer', c.id)}</td></tr>`).join(''), 'No customers yet.');
    } else if (currentAdminEntity === 'BaseDrink') {
        formBox.innerHTML = `<h3>New drink <span class="muted small code">POST /api/drinks</span></h3>
            <form class="create-form" onsubmit="handleAdminCreateSubmit(event, 'BaseDrink')">
                ${field('Name', '<input id="crud-d-name" class="input" required placeholder="e.g. Dirty Horchata">')}
                ${field('Category', `<select id="crud-d-cat" class="select">${opts(DRINK_CATEGORIES)}</select>`)}
                ${field('Base price (min ₱50)', '<input id="crud-d-price" class="input num" type="number" required min="50" step="0.50" value="135.00">')}
                <label class="check"><input id="crud-d-avail" type="checkbox" checked> Available</label>
                <button type="submit" class="btn btn-primary">${icon('plus')} Create drink</button>${errLine}
            </form>`;
        tableBox.innerHTML = table(['ID', 'Name', 'Category', 'Base price', 'Available', ''], db.drinks.map(d => `
            <tr><td class="num">#${d.id}</td><td><strong>${escapeHtml(d.name)}</strong></td><td><span class="tag">${d.category}</span></td>
            <td class="num">${formatPHP(d.basePrice)}</td><td>${d.available ? '<span class="yes">Yes</span>' : '<span class="no">No</span>'}</td>
            <td class="right">${delBtn('BaseDrink', d.id)}</td></tr>`).join(''), 'No drinks yet.');
    } else if (currentAdminEntity === 'Modifier') {
        formBox.innerHTML = `<h3>New add-on <span class="muted small code">POST /api/modifiers</span></h3>
            <form class="create-form" onsubmit="handleAdminCreateSubmit(event, 'Modifier')">
                ${field('Name', '<input id="crud-m-name" class="input" required placeholder="e.g. Hazelnut Syrup">')}
                ${field('Type', `<select id="crud-m-type" class="select">${opts(MODIFIER_TYPES)}</select>`)}
                ${field('Extra cost (₱0 or more)', '<input id="crud-m-cost" class="input num" type="number" required min="0" step="0.50" value="20.00">')}
                <label class="check"><input id="crud-m-stock" type="checkbox" checked> In stock</label>
                <button type="submit" class="btn btn-primary">${icon('plus')} Create add-on</button>${errLine}
            </form>`;
        tableBox.innerHTML = table(['ID', 'Name', 'Type', 'Extra cost', 'In stock', ''], db.modifiers.map(m => `
            <tr><td class="num">#${m.id}</td><td><strong>${escapeHtml(m.name)}</strong></td><td><span class="tag">${m.type}</span></td>
            <td class="num">+${formatPHP(m.extraCost)}</td><td>${m.inStock ? '<span class="yes">Yes</span>' : '<span class="no">No</span>'}</td>
            <td class="right">${delBtn('Modifier', m.id)}</td></tr>`).join(''), 'No add-ons yet.');
    } else if (currentAdminEntity === 'CoffeeOrder') {
        formBox.innerHTML = `<h3>New order <span class="muted small code">POST /api/orders</span></h3>
            <form class="create-form" onsubmit="handleAdminCreateSubmit(event, 'CoffeeOrder')">
                ${field('Customer', `<select id="crud-o-code" class="select" required>${db.customers.map(c => `<option value="${escapeHtml(c.memberCode)}">${escapeHtml(c.memberCode)} · ${escapeHtml(c.name)}</option>`).join('')}</select>`)}
                ${field('Pickup stall', `<select id="crud-o-stall" class="select" required>${opts(VALID_STALL_CODES)}</select>`)}
                <button type="submit" class="btn btn-primary">${icon('plus')} Create PENDING order</button>${errLine}
            </form>`;
        tableBox.innerHTML = table(['Order', 'Customer', 'Stall', 'Status', 'Total', ''], db.orders.map(o => `
            <tr><td class="num">#${o.id}</td><td><strong>${escapeHtml(o.customer?.name || '—')}</strong> <span class="muted num">${escapeHtml(o.customer?.memberCode || '')}</span></td>
            <td><span class="tag tag-blue">${escapeHtml(o.pickupLocation)}</span></td><td><span class="status status-${o.status}">${o.status}</span></td>
            <td class="num">${formatPHP(o.totalAmount)}</td><td class="right">${delBtn('CoffeeOrder', o.id)}</td></tr>`).join(''), 'No orders yet.');
    } else if (currentAdminEntity === 'OrderItem') {
        formBox.innerHTML = `<h3>New order item <span class="muted small code">POST /api/order-items</span></h3>
            <form class="create-form" onsubmit="handleAdminCreateSubmit(event, 'OrderItem')">
                ${field('Order', `<select id="crud-oi-order" class="select" required>${db.orders.map(o => `<option value="${o.id}">#${o.id} · ${escapeHtml(o.customer?.memberCode || '')} at ${o.pickupLocation} (${o.status})</option>`).join('')}</select>`)}
                ${field('Drink', `<select id="crud-oi-drink" class="select" required>${db.drinks.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (${formatPHP(d.basePrice)})</option>`).join('')}</select>`)}
                ${field('Size', `<select id="crud-oi-size" class="select">${opts(CUP_SIZES)}</select>`)}
                ${field('Ice', `<select id="crud-oi-ice" class="select">${opts(ICE_LEVELS, 'NORMAL')}</select>`)}
                ${field('Sugar', `<select id="crud-oi-sugar" class="select">${opts(SUGAR_LEVELS, '75%')}</select>`)}
                ${field('Note (optional)', '<input id="crud-oi-notes" class="input" maxlength="120" placeholder="e.g. Less foam">')}
                <div class="span-all"><span class="label">Add-ons (optional)</span><div class="mod-checks">${db.modifiers.map(m => `
                    <label><input type="checkbox" value="${m.id}" class="crud-oi-mod"> ${escapeHtml(m.name)} (+${formatPHP(m.extraCost)})</label>`).join('')}</div></div>
                <button type="submit" class="btn btn-primary">${icon('plus')} Add order item</button>${errLine}
            </form>`;
        tableBox.innerHTML = table(['Item', 'Order', 'Drink', 'Add-ons', 'Subtotal', ''], db.orderItems.map(i => `
            <tr><td class="num">#${i.id}</td><td class="num">#${i.orderId}</td>
            <td><strong>${escapeHtml(i.baseDrink?.name || '—')}</strong><div class="muted small">${i.size} · ${i.iceLevel} ice · ${i.sugarLevel} sugar${i.cupNotes ? ` · “${escapeHtml(i.cupNotes)}”` : ''}</div></td>
            <td class="small">${i.modifiers && i.modifiers.length ? i.modifiers.map(m => escapeHtml(m.name)).join(', ') : '—'}</td>
            <td class="num">${formatPHP(i.subtotal)}</td><td class="right">${delBtn('OrderItem', i.id)}</td></tr>`).join(''), 'No order items yet.');
    }
}



function renderAllViews() {

    updateHeaderQueueBadge();
    renderStudentView();
    renderBaristaQueue();
    renderSmsFeed();
    renderAdminManager();
    renderRestLogs();

}

window.addEventListener('DOMContentLoaded', () => {
    hydrateIcons();
    renderAllViews();

    if (location.protocol.startsWith('http')) {

        document.getElementById('mode-select').value = 'live';
        handleModeChange('live');

    }
});