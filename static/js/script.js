let currentEditId = null;
let allSubscriptions = [];

async function loadSubscriptions() {
    try {
        const res = await fetch('/api/subscriptions');
        allSubscriptions = await res.json();
        renderTable(allSubscriptions);
        renderStats(allSubscriptions);
        document.getElementById('totalCount').textContent = `(${allSubscriptions.length})`;
    } catch (err) {
        console.error(err);
        alert('❌ MongoDB connect nahi ho raha. mongod running hai?');
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 opacity-75"><i class="bi bi-inbox display-4 d-block mb-2"></i>No subscriptions yet</td></tr>`;
        return;
    }

    data.forEach(sub => {
        const statusClass = {
            'Active': 'bg-success', 'Trial': 'bg-info',
            'Cancelled': 'bg-warning text-dark', 'Expired': 'bg-danger'
        }[sub.subscription_status] || 'bg-secondary';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-medium">${sub.user_name}</td>
            <td>${sub.plan_name}</td>
            <td><span class="badge bg-primary">${sub.billing_cycle}</span></td>
            <td class="fw-semibold">₹${parseFloat(sub.amount).toLocaleString('en-IN')}</td>
            <td><span class="badge ${statusClass}">${sub.subscription_status}</span></td>
            <td class="text-end">
                <button onclick="editSubscription('${sub._id}')" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i></button>
                <button onclick="deleteSubscription('${sub._id}')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
            </td>`;
        tbody.appendChild(row);
    });
}

function renderStats(data) {
    const active = data.filter(s => s.subscription_status === 'Active').length;
    const totalRevenue = data.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const monthly = data.filter(s => s.billing_cycle === 'Monthly').length;

    document.getElementById('statsRow').innerHTML = `
        <div class="col-md-4"><div class="card stats-card p-3 text-center"><div class="text-success fs-1 fw-bold">${active}</div><div class="text-light opacity-75">Active Subscriptions</div></div></div>
        <div class="col-md-4"><div class="card stats-card p-3 text-center"><div class="text-primary fs-1 fw-bold">₹${totalRevenue.toLocaleString('en-IN')}</div><div class="text-light opacity-75">Total Revenue</div></div></div>
        <div class="col-md-4"><div class="card stats-card p-3 text-center"><div class="text-warning fs-1 fw-bold">${monthly}</div><div class="text-light opacity-75">Monthly Plans</div></div></div>`;
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allSubscriptions.filter(s => 
        s.user_name.toLowerCase().includes(query) || s.plan_name.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add New Subscription';
    document.getElementById('subscriptionForm').reset();
    new bootstrap.Modal(document.getElementById('subscriptionModal')).show();
}

async function editSubscription(id) {
    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Update Subscription';
    const res = await fetch(`/api/subscriptions/${id}`);
    const sub = await res.json();

    document.getElementById('userName').value = sub.user_name;
    document.getElementById('planName').value = sub.plan_name;
    document.getElementById('billingCycle').value = sub.billing_cycle;
    document.getElementById('amount').value = sub.amount;
    document.getElementById('status').value = sub.subscription_status;

    new bootstrap.Modal(document.getElementById('subscriptionModal')).show();
}

async function saveSubscription() {
    const formData = {
        user_name: document.getElementById('userName').value.trim(),
        plan_name: document.getElementById('planName').value.trim(),
        billing_cycle: document.getElementById('billingCycle').value,
        amount: parseFloat(document.getElementById('amount').value),
        subscription_status: document.getElementById('status').value
    };

    if (!formData.user_name || !formData.plan_name || !formData.amount) {
        alert('Bhai sab fields bhar do!');
        return;
    }

    const url = currentEditId ? `/api/subscriptions/${currentEditId}` : '/api/subscriptions';
    const method = currentEditId ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('subscriptionModal')).hide();
        loadSubscriptions();
        alert(currentEditId ? '✅ Updated in MongoDB!' : '🎉 Saved in MongoDB!');
    }
}

async function deleteSubscription(id) {
    if (!confirm('Pakka delete karna hai MongoDB se?')) return;
    const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) loadSubscriptions();
}

window.onload = () => {
    loadSubscriptions();
    setInterval(() => { if (document.getElementById('searchInput').value === '') loadSubscriptions(); }, 10000);
    console.log('%c🚀 SaaS Subscription System Ready! MongoDB Live hai bhai!', 'color:#00d4ff; font-size:14px');
};