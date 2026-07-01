const API_URL = "http://localhost:5000";

// Auth Toggle
function toggleAuth() {
    const isLogin = document.getElementById('authTitle').innerText === 'Login';
    document.getElementById('authTitle').innerText = isLogin ? 'Signup' : 'Login';
    document.getElementById('authToggleText').innerText = isLogin ? 'Login' : 'Signup';
}

// Login/Signup
async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    const isLogin = document.getElementById('authTitle').innerText === 'Login';
    
    const res = await fetch(`${API_URL}${isLogin ? '/api/login' : '/api/signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (isLogin) {
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadLeads();
        } else { alert("Login failed!"); }
    } else {
        res.status === 201 ? alert("Registered! Login now.") : alert("Signup failed!");
    }
}

// Lead Submit (Fix: Page reload nahi hoga)
document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const newLead = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        source: document.getElementById('source').value
    };

    await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newLead)
    });
    document.getElementById('leadForm').reset();
    loadLeads();
});

// Load Leads
async function loadLeads() {
    const res = await fetch(`${API_URL}/api/leads`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) return; 
    const leads = await res.json();
    document.getElementById('leadsTableBody').innerHTML = leads.map(l => `
        <tr>
            <td>${l.name}</td><td>${l.email}</td><td>${l.phone}</td><td>${l.source}</td>
            <td>${l.dateTime}</td>
            <td><select onchange="updateStatus('${l.id}', this.value)">
                <option ${l.status === 'New' ? 'selected' : ''}>New</option>
                <option ${l.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                <option ${l.status === 'Converted' ? 'selected' : ''}>Converted</option>
            </select></td>
            <td><button class="delete-btn" onclick="deleteLead('${l.id}')">Delete</button></td>
        </tr>`).join('');
}

async function updateStatus(id, status) {
    await fetch(`${API_URL}/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status })
    });
    loadLeads();
}

async function deleteLead(id) {
    await fetch(`${API_URL}/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadLeads();
}