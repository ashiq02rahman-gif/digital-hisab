// ==========================================
// কাস্টম ইউজার ব্লক বা সাসপেন্ড লিস্ট (এখানে ব্লক করা দোকানদারের মোবাইল নম্বরগুলো বসাবেন)
// ==========================================
const BLOCKED_NUMBERS = [
    "01800000000" // উদাহরণ: এই নম্বরের দোকানদারের বিল বাকি থাকলে অ্যাপ কাজ করবে না
];

// Auto Load saved credentials on startup
window.onload = function() {
    const savedUser = localStorage.getItem('sohel_digital_hisab_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        
        // চেক করা হচ্ছে ইউজার ব্লক লিস্টে আছে কিনা
        if (BLOCKED_NUMBERS.includes(user.phone)) {
            document.getElementById('server-offline-screen').classList.remove('hidden');
            return;
        }

        document.getElementById('phone-input').value = user.phone;
        document.getElementById('password-input').value = user.password;
        document.getElementById('shop-name-input').value = user.shopName;
        handleAuth(true);
    }
    document.getElementById('cust-date').valueAsDate = new Date();
}

function handleAuth(isAuto = false) {
    const shopName = document.getElementById('shop-name-input').value.trim();
    const phone = document.getElementById('phone-input').value.trim();
    const password = document.getElementById('password-input').value.trim();

    if(!phone || !password || (!shopName && !isAuto)) {
        if(!isAuto) alert('দয়া করে দোকান নাম, নম্বর ও পাসওয়ার্ড দিন!');
        return;
    }

    // লগইন করার সময়ও চেক করবে নম্বরটি ব্লক লিস্টে আছে কিনা
    if (BLOCKED_NUMBERS.includes(phone)) {
        document.getElementById('server-offline-screen').classList.remove('hidden');
        return;
    }

    let userData = { shopName, phone, password };
    if (isAuto) {
        const existing = JSON.parse(localStorage.getItem('sohel_digital_hisab_user'));
        if(existing) userData = existing;
    } else {
        localStorage.setItem('sohel_digital_hisab_user', JSON.stringify(userData));
    }

    document.getElementById('display-shop-name').innerText = userData.shopName;
    document.getElementById('display-phone').innerText = "হিসাব আইডি: " + userData.phone;

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    renderData();
}

function logout() {
    localStorage.removeItem('sohel_digital_hisab_user');
    location.reload();
}

function openModal(type) {
    document.getElementById('modal-type').value = type;
    document.getElementById('modal-title').innerText = type === 'due' ? 'নতুন বাকি এন্ট্রি' : 'বাকি পরিশোধ (Due Paid)';
    document.getElementById('transaction-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-amount').value = '';
}

function saveTransaction() {
    const type = document.getElementById('modal-type').value;
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const amount = parseFloat(document.getElementById('cust-amount').value);
    const date = document.getElementById('cust-date').value;

    if(!name || !amount || !date) {
        alert('সবগুলো ঘর সঠিকভাবে পূরণ করুন!');
        return;
    }

    let transactions = JSON.parse(localStorage.getItem('sohel_digital_hisab_trans') || '[]');
    transactions.push({ id: Date.now(), type, name, phone, amount, date });
    localStorage.setItem('sohel_digital_hisab_trans', JSON.stringify(transactions));

    closeModal();
    renderData();
}

function renderData() {
    const transactions = JSON.parse(localStorage.getItem('sohel_digital_hisab_trans') || '[]');
    const searchDate = document.getElementById('search-date').value;
    const listEl = document.getElementById('transaction-list');
    
    let totalDue = 0;
    let totalPaid = 0;
    listEl.innerHTML = '';

    const filtered = transactions.filter(t => {
        if(t.type === 'due') totalDue += t.amount;
        if(t.type === 'paid') totalPaid += t.amount;
        if(searchDate) return t.date === searchDate;
        return true;
    });

    document.getElementById('total-due-amount').innerText = '৳ ' + totalDue;
    document.getElementById('total-paid-amount').innerText = '৳ ' + totalPaid;

    if(filtered.length === 0) {
        listEl.innerHTML = `<p class="text-center text-xs text-gray-400 py-6">কোনো হিসাব পাওয়া যায়নি</p>`;
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
                    <p class="text-xs text-gray-500">${t.phone || 'নম্বর নেই'} • ${t.date}</p>
                </div>
                <div class="text-right">
                    <span class="font-extrabold text-sm">${amountSign}${t.amount}</span>
                    <div class="text-[10px] uppercase font-semibold mt-0.5 tracking-wider">${tagText}</div>
                </div>
            </div>
        `;
    });
}
