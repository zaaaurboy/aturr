// main.js

// Utility functions for localStorage handling
const STORAGE_KEYS = {
  RAW_MATERIALS: 'aturAja_rawMaterials',
  PRODUCTS: 'aturAja_products',
  SIMULATION_REPORTS: 'aturAja_simulationReports',
  USER_SESSION: 'aturAja_userSession'
};

// Save data to localStorage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Load data from localStorage
function loadData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// Clear user session (logout)
function clearUserSession() {
  localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
}

// Check if user is logged in
function isUserLoggedIn() {
  return !!loadData(STORAGE_KEYS.USER_SESSION);
}

// Set user session (simulate login)
function setUserSession(user) {
  saveData(STORAGE_KEYS.USER_SESSION, user);
}

// =======================
// Form Validation Helpers
// =======================

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateLoginForm(form) {
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  if (!email || !validateEmail(email)) {
    alert('Mohon masukkan email yang valid.');
    return false;
  }
  if (!password) {
    alert('Mohon masukkan password.');
    return false;
  }
  return true;
}

function validateRegisterForm(form) {
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const confirmPassword = form.confirmPassword.value.trim();
  if (!email || !validateEmail(email)) {
    alert('Mohon masukkan email yang valid.');
    return false;
  }
  if (!password) {
    alert('Mohon masukkan password.');
    return false;
  }
  if (password !== confirmPassword) {
    alert('Password dan konfirmasi password tidak cocok.');
    return false;
  }
  return true;
}

// =======================
// User Authentication Logic
// =======================

// For demo purposes, user data is stored in localStorage (not secure for production)
function registerUser(email, password) {
  let users = loadData('aturAja_users') || [];
  if (users.find(u => u.email === email)) {
    alert('Email sudah terdaftar.');
    return false;
  }
  users.push({ email, password });
  saveData('aturAja_users', users);
  alert('Registrasi berhasil. Silakan login.');
  return true;
}

function loginUser(email, password) {
  let users = loadData('aturAja_users') || [];
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    setUserSession({ email });
    return true;
  }
  alert('Email atau password salah.');
  return false;
}

// =======================
// Dashboard Logic
// =======================

function loadDashboardSummary() {
  const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
  const products = loadData(STORAGE_KEYS.PRODUCTS) || [];

  // Calculate total production cost (sum of all raw materials cost * stock)
  let totalCost = 0;
  rawMaterials.forEach(mat => {
    totalCost += mat.price * mat.stock;
  });

  // Calculate total profit and product profit/loss
  let totalProfit = 0;
  let productProfits = products.map(product => {
    // Calculate cost of materials per product
    let costPerProduct = 0;
    if (product.materials && product.materials.length > 0) {
      product.materials.forEach(mat => {
        // Find material price
        const matData = rawMaterials.find(rm => rm.name === mat.name);
        if (matData) {
          costPerProduct += matData.price * (mat.quantity || 1);
        }
      });
    }
    const profit = product.price - costPerProduct;
    totalProfit += profit;
    return { name: product.name, profit };
  });

  // Find most profitable and least profitable products
  let mostProfitProduct = null;
  let leastProfitProduct = null;
  if (productProfits.length > 0) {
    mostProfitProduct = productProfits.reduce((a, b) => (a.profit > b.profit ? a : b));
    leastProfitProduct = productProfits.reduce((a, b) => (a.profit < b.profit ? a : b));
  }

  // Update dashboard elements if present
  const totalCostEl = document.getElementById('totalCost');
  const totalProfitEl = document.getElementById('totalProfit');
  const mostProfitEl = document.getElementById('mostProfitProduct');
  const leastProfitEl = document.getElementById('leastProfitProduct');
  const profitChartEl = document.getElementById('profitChart');

  if (totalCostEl) totalCostEl.textContent = `Rp ${totalCost.toLocaleString('id-ID')}`;
  if (totalProfitEl) totalProfitEl.textContent = `Rp ${totalProfit.toLocaleString('id-ID')}`;
  if (mostProfitEl) mostProfitEl.textContent = mostProfitProduct ? `${mostProfitProduct.name} (Rp ${mostProfitProduct.profit.toLocaleString('id-ID')})` : '-';
  if (leastProfitEl) leastProfitEl.textContent = leastProfitProduct ? `${leastProfitProduct.name} (Rp ${leastProfitProduct.profit.toLocaleString('id-ID')})` : '-';

  // Render profit chart if canvas exists and Chart.js is loaded
  if (profitChartEl && window.Chart) {
    const ctx = profitChartEl.getContext('2d');
    const labels = productProfits.map(p => p.name);
    const data = productProfits.map(p => p.profit);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Keuntungan per Produk',
          data,
          backgroundColor: 'rgba(51, 153, 255, 0.7)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

// =======================
// Input Data Logic
// =======================

// Updated saveRawMaterial to include dailyUsage and safetyStock
function saveRawMaterial(name, price, stock, leadTime, dailyUsage, safetyStock) {
  let rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
  const index = rawMaterials.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
  if (index >= 0) {
    rawMaterials[index] = { name, price, stock, leadTime, dailyUsage, safetyStock };
  } else {
    rawMaterials.push({ name, price, stock, leadTime, dailyUsage, safetyStock });
  }
  saveData(STORAGE_KEYS.RAW_MATERIALS, rawMaterials);
}

function saveProduct(name, price, materials) {
  let products = loadData(STORAGE_KEYS.PRODUCTS) || [];
  // Check if product exists, update if yes
  const index = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  if (index >= 0) {
    products[index].price = price;
    products[index].materials = materials;
  } else {
    products.push({ name, price, materials });
  }
  saveData(STORAGE_KEYS.PRODUCTS, products);
}

// =======================
// Simulation Logic
// =======================

function runSimulationByTargetProfit(targetProfit) {
  const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
  const products = loadData(STORAGE_KEYS.PRODUCTS) || [];

  if (products.length === 0 || rawMaterials.length === 0) {
    alert('Data bahan baku atau produk belum lengkap.');
    return null;
  }

  // Simple heuristic: calculate how many products to produce to reach target profit
  // For each product, calculate profit margin per unit
  const productMargins = products.map(product => {
    let costPerProduct = 0;
    product.materials.forEach(mat => {
      const matData = rawMaterials.find(rm => rm.name === mat.name);
      if (matData) {
        costPerProduct += matData.price * (mat.quantity || 1);
      }
    });
    const margin = product.price - costPerProduct;
    return { product, margin, costPerProduct };
  }).filter(pm => pm.margin > 0);

  if (productMargins.length === 0) {
    alert('Tidak ada produk dengan margin keuntungan positif.');
    return null;
  }

  // Sort products by margin descending
  productMargins.sort((a, b) => b.margin - a.margin);

  // Try to produce products starting from highest margin until target profit reached or materials exhausted
  let totalProfit = 0;
  let totalCost = 0;
  let totalRevenue = 0;
  let productCounts = {};
  let remainingMaterials = {};

  // Initialize remaining materials stock
  rawMaterials.forEach(mat => {
    remainingMaterials[mat.name] = mat.stock;
  });

  for (const pm of productMargins) {
    productCounts[pm.product.name] = 0;
  }

  while (totalProfit < targetProfit) {
    let producedAny = false;
    for (const pm of productMargins) {
      // Check if enough materials to produce one unit
      let canProduce = true;
      for (const mat of pm.product.materials) {
        if (!remainingMaterials[mat.name] || remainingMaterials[mat.name] < (mat.quantity || 1)) {
          canProduce = false;
          break;
        }
      }
      if (!canProduce) continue;

      // Produce one unit
      for (const mat of pm.product.materials) {
        remainingMaterials[mat.name] -= (mat.quantity || 1);
      }
      productCounts[pm.product.name]++;
      totalCost += pm.costPerProduct;
      totalRevenue += pm.product.price;
      totalProfit = totalRevenue - totalCost;
      producedAny = true;

      if (totalProfit >= targetProfit) break;
    }
    if (!producedAny) break; // no more production possible
  }

  return {
    productCounts,
    totalCost,
    totalRevenue,
    totalProfit,
    remainingMaterials
  };
}

function runSimulationByAvailableMaterials() {
  const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
  const products = loadData(STORAGE_KEYS.PRODUCTS) || [];

  if (products.length === 0 || rawMaterials.length === 0) {
    alert('Data bahan baku atau produk belum lengkap.');
    return null;
  }

  // Calculate max number of products that can be produced based on available materials
  let productCounts = {};
  let remainingMaterials = {};

  // Initialize remaining materials stock
  rawMaterials.forEach(mat => {
    remainingMaterials[mat.name] = mat.stock;
  });

  // Initialize product counts
  products.forEach(p => {
    productCounts[p.name] = 0;
  });

  // Simple heuristic: produce products in order of highest margin first until materials exhausted
  const productMargins = products.map(product => {
    let costPerProduct = 0;
    product.materials.forEach(mat => {
      const matData = rawMaterials.find(rm => rm.name === mat.name);
      if (matData) {
        costPerProduct += matData.price * (mat.quantity || 1);
      }
    });
    const margin = product.price - costPerProduct;
    return { product, margin, costPerProduct };
  }).filter(pm => pm.margin > 0);

  if (productMargins.length === 0) {
    alert('Tidak ada produk dengan margin keuntungan positif.');
    return null;
  }

  productMargins.sort((a, b) => b.margin - a.margin);

  let totalCost = 0;
  let totalRevenue = 0;

  let canProduceMore = true;
  while (canProduceMore) {
    canProduceMore = false;
    for (const pm of productMargins) {
      // Check if enough materials to produce one unit
      let canProduce = true;
      for (const mat of pm.product.materials) {
        if (!remainingMaterials[mat.name] || remainingMaterials[mat.name] < (mat.quantity || 1)) {
          canProduce = false;
          break;
        }
      }
      if (!canProduce) continue;

      // Produce one unit
      for (const mat of pm.product.materials) {
        remainingMaterials[mat.name] -= (mat.quantity || 1);
      }
      productCounts[pm.product.name]++;
      totalCost += pm.costPerProduct;
      totalRevenue += pm.product.price;
      canProduceMore = true;
    }
  }

  const totalProfit = totalRevenue - totalCost;

  return {
    productCounts,
    totalCost,
    totalRevenue,
    totalProfit,
    remainingMaterials
  };
}

// =======================
// Report Handling
// =======================

function saveSimulationReport(report) {
  let reports = loadData(STORAGE_KEYS.SIMULATION_REPORTS) || [];
  reports.push(report);
  saveData(STORAGE_KEYS.SIMULATION_REPORTS, reports);
}

function loadSimulationReports() {
  return loadData(STORAGE_KEYS.SIMULATION_REPORTS) || [];
}

// Export reports to Excel using SheetJS (XLSX)
function exportReportsToExcel() {
  const reports = loadSimulationReports();
  if (reports.length === 0) {
    alert('Tidak ada laporan untuk diekspor.');
    return;
  }

  // Prepare worksheet data
  const wsData = [
    ['Tanggal', 'Input', 'Hasil Simulasi', 'Total Biaya', 'Total Pendapatan', 'Keuntungan', 'Sisa Bahan']
  ];

  reports.forEach(report => {
    wsData.push([
      report.date,
      report.input,
      JSON.stringify(report.simulationResult),
      report.totalCost,
      report.totalRevenue,
      report.profit,
      JSON.stringify(report.remainingMaterials)
    ]);
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Simulasi');

  // Save file
  XLSX.writeFile(wb, 'laporan_simulasi_atur_aja.xlsx');
}

// =======================
// Dynamic Content Loading
// =======================

function populateRawMaterialsSelect(selectElement) {
  const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
  selectElement.innerHTML = '';
  rawMaterials.forEach((mat, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = `${mat.name} (Stok: ${mat.stock})`;
    selectElement.appendChild(option);
  });
}

function populateProductsList(containerElement) {
  const products = loadData(STORAGE_KEYS.PRODUCTS) || [];
  containerElement.innerHTML = '';
  if (products.length === 0) {
    containerElement.textContent = 'Belum ada produk yang diinput.';
    return;
  }
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>Harga Jual: Rp ${product.price.toLocaleString('id-ID')}</p>
      <p>Bahan:</p>
      <ul>
        ${product.materials.map(mat => `<li>${mat.name} (Jumlah: ${mat.quantity || 1})</li>`).join('')}
      </ul>
    `;
    containerElement.appendChild(div);
  });
}

function populateReportsTable(tableBodyElement) {
  const reports = loadSimulationReports();
  tableBodyElement.innerHTML = '';
  if (reports.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.textContent = 'Belum ada laporan simulasi.';
    tr.appendChild(td);
    tableBodyElement.appendChild(tr);
    return;
  }
  reports.forEach((report, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${report.date}</td>
      <td>${report.input}</td>
      <td>${JSON.stringify(report.simulationResult)}</td>
      <td>Rp ${report.totalCost.toLocaleString('id-ID')}</td>
      <td>Rp ${report.totalRevenue.toLocaleString('id-ID')}</td>
      <td>Rp ${report.profit.toLocaleString('id-ID')}</td>
      <td>${JSON.stringify(report.remainingMaterials)}</td>
    `;
    tableBodyElement.appendChild(tr);
  });
}

// =======================
// Event Listeners for Pages
// =======================

// Login page
function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateLoginForm(loginForm)) return;

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();

    if (loginUser(email, password)) {
      window.location.href = 'dashboard.html';
    }
  });
}

// Register page
function setupRegisterPage() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateRegisterForm(registerForm)) return;

    const email = registerForm.email.value.trim();
    const password = registerForm.password.value.trim();

    if (registerUser(email, password)) {
      window.location.href = 'login.html';
    }
  });
}

// Dashboard page
function setupDashboardPage() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  loadDashboardSummary();

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearUserSession();
      window.location.href = 'login.html';
    });
  }
}

// Input Data page
function setupInputPage() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Raw material form
  const rawMaterialForm = document.getElementById('rawMaterialForm');
  if (rawMaterialForm) {
    rawMaterialForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = rawMaterialForm.rawMaterialName.value.trim();
      const price = parseFloat(rawMaterialForm.rawMaterialPrice.value);
      const stock = parseInt(rawMaterialForm.rawMaterialStock.value);
      const leadTime = parseInt(rawMaterialForm.rawMaterialLeadTime.value);
      const dailyUsage = parseInt(rawMaterialForm.rawMaterialDailyUsage.value);
      const safetyStock = parseInt(rawMaterialForm.rawMaterialSafetyStock.value);

      if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0 || isNaN(leadTime) || leadTime < 0 || isNaN(dailyUsage) || dailyUsage < 0 || isNaN(safetyStock) || safetyStock < 0) {
        alert('Mohon isi data bahan baku dengan benar.');
        return;
      }

      saveRawMaterial(name, price, stock, leadTime, dailyUsage, safetyStock);
      alert(`Bahan baku "${name}" berhasil disimpan.`);
      rawMaterialForm.reset();
      updateMaterialOptions();
    });
  }

  // Product form
  const productForm = document.getElementById('productForm');
  if (productForm) {
    const materialSelect = document.getElementById('productMaterials');
    function updateMaterialOptions() {
      const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
      materialSelect.innerHTML = '';
      rawMaterials.forEach((mat, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `${mat.name} (Stok: ${mat.stock})`;
        materialSelect.appendChild(option);
      });
    }
    updateMaterialOptions();

    productForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = productForm.productName.value.trim();
      const price = parseFloat(productForm.productPrice.value);
      const selectedOptions = Array.from(materialSelect.selectedOptions);
      if (!name || isNaN(price) || price < 0 || selectedOptions.length === 0) {
        alert('Mohon isi data produk dengan benar dan pilih bahan yang digunakan.');
        return;
      }

      // Collect selected materials with quantity (default 1)
      const materials = selectedOptions.map(opt => {
        const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
        const mat = rawMaterials[opt.value];
        return { name: mat.name, quantity: 1 };
      });

      saveProduct(name, price, materials);
      alert(`Produk "${name}" berhasil disimpan.`);
      productForm.reset();
    });
  }

  // Bahan Baku form
  const bahanBakuForm = document.getElementById('bahanBakuForm');
  if (bahanBakuForm) {
    bahanBakuForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const nama = document.getElementById('bahanNama').value.trim();
      const stok = parseInt(document.getElementById('bahanStok').value, 10);
      const leadTime = parseInt(document.getElementById('bahanLeadTime').value, 10);
      const harga = parseFloat(document.getElementById('bahanHarga').value);
      const dailyUsage = parseInt(document.getElementById('bahanDailyUsage').value, 10);
      const safetyStock = parseInt(document.getElementById('bahanSafetyStock').value, 10);

      if (!nama || isNaN(stok) || isNaN(leadTime) || isNaN(harga) || isNaN(dailyUsage) || isNaN(safetyStock)) {
        alert('Mohon isi semua data dengan benar.');
        return;
      }

      // Simpan data ke localStorage atau proses lebih lanjut
      const bahanBaku = { nama, stok, leadTime, harga, dailyUsage, safetyStock };
      console.log('Bahan Baku Disimpan:', bahanBaku);
      alert('Bahan baku berhasil disimpan!');
      event.target.reset();
    });
  }
}

// Simulation page
function setupSimulationPage() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  const targetProfitInput = document.getElementById('targetProfitInput');
  const runSimulationBtn = document.getElementById('runSimulationBtn');
  const simulationResult = document.getElementById('simulationResult');
  const simulationDetails = document.getElementById('simulationDetails');
  const availableMaterialsBtn = document.getElementById('availableMaterialsBtn');

  function displaySimulationResult(result) {
    if (!result) {
      simulationResult.style.display = 'none';
      return;
    }
    simulationDetails.innerHTML = '';

    // Show product counts
    const productCounts = result.productCounts;
    const ulProducts = document.createElement('ul');
    for (const [productName, count] of Object.entries(productCounts)) {
      const li = document.createElement('li');
      li.textContent = `${productName}: ${count} unit`;
      ulProducts.appendChild(li);
    }
    simulationDetails.appendChild(ulProducts);

    // Show summary
    const summary = document.createElement('ul');
    summary.innerHTML = `
      <li>Total biaya bahan: Rp ${result.totalCost.toLocaleString('id-ID')}</li>
      <li>Total pendapatan: Rp ${result.totalRevenue.toLocaleString('id-ID')}</li>
      <li>Estimasi keuntungan: Rp ${result.totalProfit.toLocaleString('id-ID')}</li>
      <li>Sisa bahan: ${Object.entries(result.remainingMaterials).map(([name, qty]) => `${name}: ${qty}`).join(', ')}</li>
    `;
    simulationDetails.appendChild(summary);

    simulationResult.style.display = 'block';
  }

  if (runSimulationBtn) {
    runSimulationBtn.addEventListener('click', () => {
      const targetProfit = parseFloat(targetProfitInput.value);
      if (isNaN(targetProfit) || targetProfit < 0) {
        alert('Mohon masukkan target keuntungan yang valid.');
        return;
      }
      const result = runSimulationByTargetProfit(targetProfit);
      if (result) {
        displaySimulationResult(result);
        // Save report
        const report = {
          date: new Date().toLocaleString('id-ID'),
          input: `Target Keuntungan: Rp ${targetProfit.toLocaleString('id-ID')}`,
          simulationResult: result.productCounts,
          totalCost: result.totalCost,
          totalRevenue: result.totalRevenue,
          profit: result.totalProfit,
          remainingMaterials: result.remainingMaterials
        };
        saveSimulationReport(report);
      }
    });
  }

  if (availableMaterialsBtn) {
    availableMaterialsBtn.addEventListener('click', () => {
      const result = runSimulationByAvailableMaterials();
      if (result) {
        displaySimulationResult(result);
        // Save report
        const report = {
          date: new Date().toLocaleString('id-ID'),
          input: 'Jumlah Bahan Tersedia',
          simulationResult: result.productCounts,
          totalCost: result.totalCost,
          totalRevenue: result.totalRevenue,
          profit: result.totalProfit,
          remainingMaterials: result.remainingMaterials
        };
        saveSimulationReport(report);
      }
    });
  }
}

// Report page
function setupReportPage() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  const reportTableBody = document.getElementById('reportTableBody');
  const exportExcelBtn = document.getElementById('exportExcelBtn');

  if (reportTableBody) {
    populateReportsTable(reportTableBody);
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      exportReportsToExcel();
    });
  }
}

// =======================
// Reorder Point Logic
// =======================

// Function to calculate reorder point
function calculateReorderPoint(dailyUsage, leadTime, safetyStock = 0) {
  return (dailyUsage * leadTime) + safetyStock;
}

// Function to check stock and recommend reorder
function checkReorderPoints() {
  const rawMaterials = loadData(STORAGE_KEYS.RAW_MATERIALS) || [];
  return rawMaterials.map(material => {
    const reorderPoint = calculateReorderPoint(material.dailyUsage, material.leadTime, material.safetyStock);
    return {
      name: material.name,
      currentStock: material.stock,
      reorderPoint,
      needsReorder: material.stock <= reorderPoint
    };
  });
}

// =======================
// Initialization
// =======================

document.addEventListener('DOMContentLoaded', () => {
  // Determine page by body id or other marker
  const bodyId = document.body.id;

  switch (bodyId) {
    case 'loginPage':
      setupLoginPage();
      break;
    case 'registerPage':
      setupRegisterPage();
      break;
    case 'dashboardPage':
      setupDashboardPage();
      break;
    case 'inputPage':
      setupInputPage();
      break;
    case 'simulationPage':
      setupSimulationPage();
      break;
    case 'reportPage':
      setupReportPage();
      break;
    default:
      // No specific setup
      break;
  }
});