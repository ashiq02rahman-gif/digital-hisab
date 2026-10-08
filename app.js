// ==========================================
// অনুমোদিত দোকানদার বা ক্লায়েন্টদের তালিকা (অ্যাডমিন হিসেবে আপনি এখানে ইউজার যোগ বা বাদ দেবেন)
// ==========================================
const ALLOWED_SHOPS = {
    "01712345678": { shopName: "ভাই ভাই স্টোর", password: "123" },
    "01812345678": { shopName: "মা ডিজিটাল টেলিকম", password: "456" }
    // নতুন দোকানদার যুক্ত করতে চাইলে নিচে এভাবে কমা দিয়ে যুক্ত করবেন:
    // "মোবাইল_নম্বর": { shopName: "দোকানের নাম", password: "পাসওয়ার্ড" }
};

// ==========================================
// যাদের বিল বাকি বা সাময়িকভাবে ব্লক রাখতে চান তাদের নম্বর
// ==========================================
const BLOCKED_NUMBERS = [
    // "01812345678" // উদাহরণস্বরূপ ব্লক লিস্ট
];

let selectedCustomerForPaid = null;

function isValidBDPhone(phone) {
    const regex = /^01[3-9]\d{8}$/;
    return regex.test(phone);
}

window.onload = function() {
    checkAuthAndBlockStatus();
    document.getElementById('due-date').valueAsDate = new Date();
    document.getElementById('paid-date').valueAsDate = new Date();
}

function checkAuthAndBlockStatus() {
    const savedUser = localStorage.getItem('sohel_digital_hisab_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        
        // Instant check if blocked
        if (BLOCKED_NUMBERS.includes(user.phone) || !ALLOWED_SHOPS[user.phone]) {
            document.getElementById('server-offline-screen').classList.remove('hidden');
            localStorage.removeItem('sohel_digital_hisab_user');
            return;
        }

        document.getElementById('display-shop-name').innerText = user.shopName;
        document.getElementById('display-phone').innerText = "হিসাব আইডি: " + user.phone;

        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        renderData();
    }
}

function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if(!phone || !password) {
        alert('দয়া করে মোবাইল নম্বর ও পাসওয়ার্ড দিন!');
        return;
    }

    if(!isValidBDPhone(phone)) {
        alert('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন!');
        return;
    }

    // Check if blocked
    if (BLOCKED_NUMBERS.includes(phone)) {
        document.getElementById('server-offline-screen').classList.remove('hidden');
        return;
    }

    // Check if allowed in system database
    if (ALLOWED_SHOPS[phone] && ALLOWED_SHOPS[phone].password === password) {
        const shopData = { phone, shopName: ALLOWED_SHOPS[phone].shopName };
        localStorage.setItem('sohel_digital_hisab_user', JSON.stringify(shopData));
        checkAuthAndBlockStatus();
    } else {
        alert('ভুল নম্বর অথবা পাসওয়ার্ড! আপনার একাউন্টের অ্যাক্সেস নেই বা তথ্য ভুল দেওয়া হয়েছে।');
    }
}

function logout() {
    localStorage.removeItem('sohel_digital_hisab_user');
    location.reload();
}

// Modals Control
function openAddDueModal() {
    document.getElementById('modal-due').classList.remove('hidden');
}

function openPaidModal() {
    selectedCustomerForPaid = null;
    document.getElementById('selected-customer-box').classList.add('hidden');
    document.getElementById('btn-confirm-paid').classList.add('hidden');
    document.getElementById('modal-paid').classList.remove('hidden');
    renderDueCustomerList();
}

function closeModals() {
    document.getElementById('modal-due').classList.add('hidden');
    document.getElementById('modal-paid').classList.add('hidden');
    document.getElementById('due-name').value = '';
    document.getElementById('due-phone').value = '';
    document.getElementById('due-amount').value = '';
    document.getElementById('paid-amount').value = '';
}

// Save Due Transaction
function saveDueTransaction() {
    const name = document.getElementById('due-name').value.trim();
    const phone = document.getElementById('due-phone').value.trim();
    const amount = parseFloat(document.getElementById('due-amount').value);
    const date = document.getElementById('due-date').value;

    if(!name || !amount || !date || !phone) {
        alert('সবগুলো ঘর সঠিকভাবে পূরণ করুন!');
        return;
    }

    if(!isValidBDPhone(phone)) {
        alert('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন!');
        return;
    }

    let transactions = JSON.parse(localStorage.getItem('sohel_digital_hisab_trans') || '[]');
    transactions.push({ id: Date.now(), type: 'due', name, phone, amount, date });
    localStorage.setItem('sohel_digital_hisab_trans', JSON.stringify(transactions));

    closeModals();
    renderData();
}

// Render Due Customers List for Paid Modal
function renderDueCustomerList() {
    const transactions = JSON.parse(localStorage.getItem('sohel_digital_hisab_trans') || '[]');
    const search = document.getElementById('paid-search').value.toLowerCase();
    const listContainer = document.getElementById('due-customer-list');
    listContainer.innerHTML = '';

    let customerDueMap = {};
    transactions.forEach(t => {
        let key = t.phone + "_" + t.name;
        if(!customerDueMap[key]) {
            customerDueMap[key] = { name: t.name, phone: t.phone, due: 0 };
        }
        if(t.type === 'due') customerDueMap[key].due += t.amount;
        if(t.type === 'paid') customerDueMap[key].due -= t.amount;
    });

    let activeDueList = Object.values(customerDueMap).filter(c => c.due > 0);

    if(search) {
        activeDueList = activeDueList.filter(c => c.name.toLowerCase().includes(search) || c.phone.includes(search));
    }

    if(activeDueList.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">কোনো বকেয়া গ্রাহক পাওয়া যায়নি</p>`;
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
    document.getElementById('sel-cust-info').innerText = `গ্রাহক: ${name} (${phone}) | বর্তমান বাকি: ৳ ${currentDue}`;
    document.getElementById('selected-customer-box').classList.remove('hidden');
    document.getElementById('btn-confirm-paid').classList.remove('hidden');
}

// Save Paid Transaction (Reduces Due)
function savePaidTransaction() {
    const paidAmount = parseFloat(document.getElementById('paid-amount').value);
    const date = document.getElementById('paid-date').value;

    if(!paidAmount || paidAmount <= 0 || !date) {
        alert('সঠিক টাকার পরিমাণ দিন!');
        return;
    }

    if(paidAmount > selectedCustomerForPaid.currentDue) {
        alert('পরিশোধের পরিমাণ মোট বকেয়ার চেয়ে বেশি হতে পারে না!');
        return;
    }

    let transactions = JSON.parse(localStorage.getItem('sohel_digital_hisab_trans') || '[]');
    transactions.push({ 
        id: Date.now(), 
        type: 'paid', 
        name: selectedCustomerForPaid.name, 
        phone: selectedCustomerForPaid.phone, 
        amount: paidAmount, 
        date 
    });
    localStorage.setItem('sohel_digital_hisab_trans', JSON.stringify(transactions));

    closeModals();
    renderData();
    alert('বাকি পরিশোধ সফলভাবে রেকর্ড করা হয়েছে!');
}

// Render Dashboard Data with Search & Totals
function renderData() {
    const transactions = JSON.parse(localStorage.getItem('sohel_digital_hisab_trans') || '[]');
    const keyword = document.getElementById('search-keyword').value.trim().toLowerCase();
    const searchDate = document.getElementById('search-date').value;
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
        let matchKeyword = true;
        let matchDate = true;

        if(keyword) {
            matchKeyword = t.name.toLowerCase().includes(keyword) || t.phone.includes(keyword);
        }
        if(searchDate) {
            matchDate = t.date === searchDate;
        }
        return matchKeyword && matchDate;
    });

    if(filtered.length === 0) {
        listEl.innerHTML = `<p class="text-center text-xs text-gray-400 py-6">কোনো হিসাব পাওয়া যায়নি</p>`;
        return;
    }

    filtered.reverse().forEach(t => {
        const isDue = t.type === 'due';
        const badgeObjectColor = isDue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100';
        const tagText = isDue ? 'বাকি (Due)' : 'পরিশোধ (Paid)';
        const amountSign = isDue ? '+ ৳ ' : '- ৳ ';

        listEl.innerHTML += `
            <div class="p-3.5 rounded-2xl border ${badgeObjectColor} flex justify-between items-center shadow-sm">
                <div>
                    <h4 class="font-bold text-sm text-gray-800">${t.name}</h4>
                    <p class="text-xs text-gray-500">${t.phone} • ${t.date}</p>
                </div>
                <div class="text-right">
                    <span class="font-extrabold text-sm">${amountSign}${t.amount}</span>
                    <div class="text-[10px] uppercase font-semibold mt-0.5 tracking-wider">${tagText}</div>
                </div>
            </div>
        `;
    });
}
