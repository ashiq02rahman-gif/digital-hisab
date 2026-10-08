// ==========================================
// ১. অনুমোদিত দোকানদারদের তালিকা (এখানে ৫টি স্যাম্পল ইউজার-পাস দেওয়া আছে)
// ==========================================
const ALLOWED_SHOPS = {
    "01711111111": { shopName: "ভাই ভাই স্টোর", password: "123" },
    "01722222222": { shopName: "মা ডিজিটাল টেলিকম", password: "456" },
    "01733333333": { shopName: "আল মদিনা ভ্যারাইটিজ", password: "789" },
    "01744444444": { shopName: "সোহাগ এন্টারপ্রাইজ", password: "321" },
    "01755555555": { shopName: "বিশ্বাস স্টোর", password: "654" }
};

// ==========================================
// ২. বিল বাকি থাকা বা ব্লক করা দোকানদারদের তালিকা (এখানে ৫টি স্যাম্পল ব্লক নম্বর দেওয়া আছে)
// বিল পরিশোধ করলে এখান থেকে নম্বর মুছে দেবেন, না দিলে ব্লক থাকবে।
// ==========================================
const BLOCKED_NUMBERS = [
    "01800000001", // স্যাম্পল ব্লক ১
    "01800000001", // স্যাম্পল ব্লক ২
    "01800000001", // স্যাম্পল ব্লক ৩
    "01800000002", // স্যাম্পল ব্লক ৪
    "01800000003"  // স্যাম্পল ব্লক ৫
];

let selectedCustomerForPaid = null;
let currentLoggedInPhone = null;

function isValidBDPhone(phone) {
    return /^01[3-9]\d{8}$/.test(phone);
}

function getTodayDateStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

window.onload = function() {
    checkAuthAndBlockStatus();
    document.getElementById('due-date').value = getTodayDateStr();
    document.getElementById('paid-date').value = getTodayDateStr();
}

function checkAuthAndBlockStatus() {
    const savedUser = localStorage.getItem('sohel_digital_hisab_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        currentLoggedInPhone = user.phone;
        
        if (BLOCKED_NUMBERS.includes(user.phone) || !ALLOWED_SHOPS[user.phone]) {
            document.getElementById('server-offline-screen').classList.remove('hidden');
            localStorage.removeItem('sohel_digital_hisab_user');
            return;
        }

        document.getElementById('display-shop-name').innerText = user.shopName;
        document.getElementById('display-phone').innerText = "হিসাব আইডি: " + user.phone;

        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        
        document.getElementById('filter-date').value = getTodayDateStr();
        renderData();
    }
}

function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if(!phone || !password) {
        alert('নম্বর ও পাসওয়ার্ড দিন!');
        return;
    }

    if(!isValidBDPhone(phone)) {
        alert('সঠিক ১১ ডিজিটের বাংলাদেশি নম্বর দিন!');
        return;
    }

    if (BLOCKED_NUMBERS.includes(phone)) {
        document.getElementById('server-offline-screen').classList.remove('hidden');
        return;
    }

    if (ALLOWED_SHOPS[phone] && ALLOWED_SHOPS[phone].password === password) {
        const shopData = { phone, shopName: ALLOWED_SHOPS[phone].shopName };
        localStorage.setItem('sohel_digital_hisab_user', JSON.stringify(shopData));
        checkAuthAndBlockStatus();
    } else {
        alert('ভুল নম্বর অথবা পাসওয়ার্ড!');
    }
}

function logout() {
    localStorage.removeItem('sohel_digital_hisab_user');
    location.reload();
}

// Modals
function openAddDueModal() {
    document.getElementById('due-name').value = '';
    document.getElementById('due-phone').value = '';
    document.getElementById('due-amount').value = '';
    document.getElementById('due-date').value = getTodayDateStr();

    document.getElementById('modal-due').classList.remove('hidden');
}

function openPaidModal() {
    selectedCustomerForPaid = null;
    document.getElementById('paid-search').value = '';
    document.getElementById('paid-amount').value = '';
    document.getElementById('paid-date').value = getTodayDateStr();
    document.getElementById('selected-customer-box').classList.add('hidden');
    document.getElementById('btn-confirm-paid').classList.add('hidden');
    document.getElementById('modal-paid').classList.remove('hidden');
    renderDueCustomerList();
}

function closeModals() {
    document.getElementById('modal-due').classList.add('hidden');
    document.getElementById('modal-paid').classList.add('hidden');
}

function getStoreTransKey() {
    return 'sohel_trans_' + currentLoggedInPhone;
}

// Save Due
function saveDueTransaction() {
    const name = document.getElementById('due-name').value.trim();
    const phone = document.getElementById('due-phone').value.trim();
    const amount = parseFloat(document.getElementById('due-amount').value);
    const date = document.getElementById('due-date').value;

    if(!name || !amount || !date || !phone) {
        alert('সবগুলো ঘর পূরণ করুন!');
        return;
    }

    if(!isValidBDPhone(phone)) {
        alert('সঠিক ১১ ডিজিটের গ্রাহকের নম্বর দিন!');
        return;
    }

    const key = getStoreTransKey();
    let transactions = JSON.parse(localStorage.getItem(key) || '[]');
    const newTx = { id: Date.now(), type: 'due', name, phone, amount, date };
    transactions.push(newTx);
    localStorage.setItem(key, JSON.stringify(transactions));

    closeModals();
    renderData();
    showVoucher(newTx);
}

// Render Due Customers for Paid Modal
function renderDueCustomerList() {
    const key = getStoreTransKey();
    const transactions = JSON.parse(localStorage.getItem(key) || '[]');
    const search = document.getElementById('paid-search').value.toLowerCase();
    const listContainer = document.getElementById('due-customer-list');
    listContainer.innerHTML = '';

    let customerDueMap = {};
    transactions.forEach(t => {
        let mapKey = t.phone + "_" + t.name;
        if(!customerDueMap[mapKey]) {
            customerDueMap[mapKey] = { name: t.name, phone: t.phone, due: 0 };
        }
        if(t.type === 'due') customerDueMap[mapKey].due += t.amount;
        if(t.type === 'paid') customerDueMap[mapKey].due -= t.amount;
    });

    let activeDueList = Object.values(customerDueMap).filter(c => c.due > 0);
    if(search) {
        activeDueList = activeDueList.filter(c => c.name.toLowerCase().includes(search) || c.phone.includes(search));
    }

    if(activeDueList.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">কোনো বকেয়া গ্রাহক নেই</p>`;
        return;
    }

    activeDueList.forEach(cust => {
        listContainer.innerHTML += `
            <div onclick="selectCustomerForPaid('${cust.phone}', '${cust.name}', ${cust.due})" class="p-3 border rounded-xl hover:bg-blue-50 cursor-pointer flex justify-between items-center transition">
                <div>
                    <h4 class="font-bold text-sm text-gray-800">${cust.name}</h4>
                    <p class="text-xs text-gray-500">${cust.phone}</p>
                </div>
                <div class="text-right">
                    <span class="font-extrabold text-sm text-red-600">বাকি: ৳ ${cust.due}</span>
                </div>
            </div>
        `;
    });
}

function selectCustomerForPaid(phone, name, currentDue) {
    selectedCustomerForPaid = { phone, name, currentDue };
    document.getElementById('sel-cust-info').innerText = `গ্রাহক: ${name} (${phone}) | বাকি: ৳ ${currentDue}`;
    document.getElementById('selected-customer-box').classList.remove('hidden');
    document.getElementById('btn-confirm-paid').classList.remove('hidden');
}

// Save Paid
function savePaidTransaction() {
    const paidAmount = parseFloat(document.getElementById('paid-amount').value);
    const date = document.getElementById('paid-date').value;

    if(!paidAmount || paidAmount <= 0 || !date) {
        alert('সঠিক পরিমাণ দিন!');
        return;
    }

    if(paidAmount > selectedCustomerForPaid.currentDue) {
        alert('বকেয়ার চেয়ে বেশি পরিশোধ সম্ভব নয়!');
        return;
    }

    const key = getStoreTransKey();
    let transactions = JSON.parse(localStorage.getItem(key) || '[]');
    const newTx = { 
        id: Date.now(), 
        type: 'paid', 
        name: selectedCustomerForPaid.name, 
        phone: selectedCustomerForPaid.phone, 
        amount: paidAmount, 
        date 
    };
    transactions.push(newTx);
    localStorage.setItem(key, JSON.stringify(transactions));

    closeModals();
    renderData();
    showVoucher(newTx);
}

// Individual Remove/Delete Transaction
function removeTransaction(id) {
    if(confirm('আপনি কি এই হিসাবটি মুছে ফেলতে চান?')) {
        const key = getStoreTransKey();
        let transactions = JSON.parse(localStorage.getItem(key) || '[]');
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem(key, JSON.stringify(transactions));
        renderData();
    }
}

// Filters
function filterToday() {
    document.getElementById('filter-date').value = getTodayDateStr();
    document.getElementById('btn-today').className = "flex-1 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white transition shadow-sm";
    renderData();
}

function filterByCustomDate() {
    document.getElementById('btn-today').className = "flex-1 py-1.5 text-xs font-bold rounded-lg bg-white text-gray-600 border transition";
    renderData();
}

// Render Dashboard & Lists
function renderData() {
    const key = getStoreTransKey();
    const transactions = JSON.parse(localStorage.getItem(key) || '[]');
    const keyword = document.getElementById('search-keyword').value.trim().toLowerCase();
    const selectedDate = document.getElementById('filter-date').value;
    const listEl = document.getElementById('transaction-list');
    
    let totalDue = 0;
    let totalPaid = 0;
    listEl.innerHTML = '';

    transactions.forEach(t => {
        if(t.type === 'due') totalDue += t.amount;
        if(t.type === 'paid') totalPaid += t.amount;
    });

    document.getElementById('total-due-amount').innerText = '৳ ' + (totalDue - totalPaid);
    document.getElementById('total-paid-amount').innerText = '৳ ' + totalPaid;

    const filtered = transactions.filter(t => {
        let matchDate = selectedDate ? t.date === selectedDate : true;
        let matchKeyword = keyword ? (t.name.toLowerCase().includes(keyword) || t.phone.includes(keyword)) : true;
        return matchDate && matchKeyword;
    });

    if(filtered.length === 0) {
        listEl.innerHTML = `<p class="text-center text-xs text-gray-400 py-6">এই তারিখে কোনো হিসাব নেই</p>`;
        return;
    }

    filtered.reverse().forEach(t => {
        const isDue = t.type === 'due';
        const badgeColor = isDue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100';
        const tagText = isDue ? 'বাকি (Due)' : 'পরিশোধ (Paid)';
        const amountSign = isDue ? '+ ৳ ' : '- ৳ ';

        listEl.innerHTML += `
            <div class="p-3.5 rounded-2xl border ${badgeColor} flex justify-between items-center shadow-sm">
                <div>
                    <h4 class="font-bold text-sm text-gray-800">${t.name}</h4>
                    <p class="text-xs text-gray-500">${t.phone} • ${t.date}</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <span class="font-extrabold text-sm">${amountSign}${t.amount}</span>
                        <div class="text-[10px] uppercase font-semibold mt-0.5 tracking-wider">${tagText}</div>
                    </div>
                    <button onclick="removeTransaction(${t.id})" class="text-gray-400 hover:text-red-600 p-1 text-xs" title="মুছে ফেলুন">❌</button>
                </div>
            </div>
        `;
    });
}

// Voucher Modal Display
function showVoucher(tx) {
    const savedUser = JSON.parse(localStorage.getItem('sohel_digital_hisab_user'));
    document.getElementById('v-shop-name').innerText = savedUser ? savedUser.shopName : "দোকানের নাম";
    document.getElementById('v-id').innerText = "REC-" + tx.id.toString().slice(-6);
    document.getElementById('v-date').innerText = tx.date;
    document.getElementById('v-cust-name').innerText = tx.name;
    document.getElementById('v-cust-phone').innerText = tx.phone;
    document.getElementById('v-type').innerText = tx.type === 'due' ? 'বাকি এন্ট্রি (Due)' : 'বাকি পরিশোধ (Paid)';
    document.getElementById('v-amount').innerText = '৳ ' + tx.amount;

    document.getElementById('modal-voucher').classList.remove('hidden');
}

function closeVoucherModal() {
    document.getElementById('modal-voucher').classList.add('hidden');
}
