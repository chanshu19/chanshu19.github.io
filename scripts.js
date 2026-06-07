const app = {
    members: [],
    expenses: [],
    qrCanvas: document.getElementById('qr-canvas'),
    qrContext: null,
};

function init() {
    app.qrContext = app.qrCanvas.getContext('2d');
    updateExpenseUI();
    drawPlaceholderQRCode();
    selectTool('expense');
}

function selectTool(toolKey) {
    const cards = document.querySelectorAll('.tool-selector .tool-card');
    const panels = document.querySelectorAll('.tool-panel .panel');

    cards.forEach(card => card.classList.toggle('active', card.id === `card-${toolKey}`));
    panels.forEach(panel => panel.classList.toggle('active', panel.id === `tool-${toolKey}`));

    if (toolKey === 'qr') {
        drawPlaceholderQRCode();
    }
}

function addMember() {
    const input = document.getElementById('member-name');
    const name = input.value.trim();
    if (!name) return;
    if (app.members.includes(name)) {
        alert('Member already exists.');
        return;
    }
    app.members.push(name);
    input.value = '';
    updateExpenseUI();
}

function addExpense() {
    const payer = document.getElementById('payer-select').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const desc = document.getElementById('desc').value.trim();

    if (!payer || !amount || amount <= 0) {
        alert('Choose a payer and enter a valid amount.');
        return;
    }

    app.expenses.push({ payer, amount, desc });
    document.getElementById('amount').value = '';
    document.getElementById('desc').value = '';
    updateExpenseUI();
}

function updateExpenseUI() {
    const list = document.getElementById('member-list');
    const select = document.getElementById('payer-select');
    const memberCount = document.getElementById('member-count');
    const expenseCount = document.getElementById('expense-count');
    const avgExpense = document.getElementById('avg-expense');

    if (app.members.length === 0) {
        list.innerHTML = '<span class="tag">No members added yet</span>';
        select.innerHTML = '<option value="">Select payer</option>';
    } else {
        list.innerHTML = app.members.map(name => `<span class="tag">${name}</span>`).join('');
        select.innerHTML = '<option value="">Select payer</option>' + app.members.map(name => `<option value="${name}">${name}</option>`).join('');
    }

    memberCount.textContent = app.members.length;
    expenseCount.textContent = app.expenses.length;
    avgExpense.textContent = `₹${calculateAverageExpense().toFixed(2)}`;

    const resultBox = document.getElementById('settle-results');
    if (!app.expenses.length) {
        resultBox.style.display = 'none';
        document.getElementById('transaction-list').innerHTML = '';
    }
}

function calculateAverageExpense() {
    if (!app.expenses.length) return 0;
    const total = app.expenses.reduce((sum, item) => sum + item.amount, 0);
    return total / app.expenses.length;
}

function calculateSettlement() {
    if (app.members.length < 2) {
        alert('Add at least 2 members to settle expenses.');
        return;
    }
    if (!app.expenses.length) {
        alert('Add at least one expense first.');
        return;
    }

    const balances = app.members.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
    const memberCount = app.members.length;

    app.expenses.forEach(expense => {
        const share = expense.amount / memberCount;
        app.members.forEach(name => {
            balances[name] += name === expense.payer ? expense.amount - share : -share;
        });
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([name, amount]) => {
        if (amount > 0.01) creditors.push({ name, amount });
        else if (amount < -0.01) debtors.push({ name, amount: -amount });
    });

    let i = 0;
    let j = 0;
    const transactions = [];
    while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].amount, creditors[j].amount);
        transactions.push(`${debtors[i].name} pays ₹${amount.toFixed(2)} to ${creditors[j].name}`);
        debtors[i].amount -= amount;
        creditors[j].amount -= amount;
        if (debtors[i].amount < 0.01) i += 1;
        if (creditors[j].amount < 0.01) j += 1;
    }

    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = transactions.length
        ? transactions.map(item => `<li>${item}</li>`).join('')
        : '<li>Everyone is already settled.</li>';
    document.getElementById('settle-results').style.display = 'block';
}

function createQRCode() {
    const input = document.getElementById('qr-input').value.trim();
    if (!input) {
        alert('Enter text or a URL to generate a QR code.');
        return;
    }
    drawQRCode(input);
}

function drawPlaceholderQRCode() {
    drawQRCode('SettleUp AI toolbox');
}

function drawQRCode(text) {
    const errorCorrectionLevel = 'M';
    const qr = qrcode(0, errorCorrectionLevel);
    qr.addData(text);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const scale = 8;
    const margin = 4;
    const size = moduleCount * scale + margin * 2;

    app.qrCanvas.width = size;
    app.qrCanvas.height = size;
    app.qrContext.fillStyle = '#ffffff';
    app.qrContext.fillRect(0, 0, size, size);

    app.qrContext.fillStyle = '#081f4b';
    for (let row = 0; row < moduleCount; row += 1) {
        for (let col = 0; col < moduleCount; col += 1) {
            if (qr.isDark(row, col)) {
                app.qrContext.fillRect(margin + col * scale, margin + row * scale, scale, scale);
            }
        }
    }
}

function downloadQR() {
    const link = document.createElement('a');
    link.download = 'source-qrcode.png';
    link.href = app.qrCanvas.toDataURL('image/png');
    link.click();
}

window.addEventListener('DOMContentLoaded', init);
