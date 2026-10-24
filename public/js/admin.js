/**
 * AURAMARKET - Admin Control Hub
 * Admin Dashboard Logic & API Client
 */

(function () {
  'use strict';

  // State
  let ordersList = [];
  let productsList = [];
  let activeStatusFilter = 'All';
  let activeProductCat = 'All';
  let orderSearchQuery = '';
  let productSearchQuery = '';

  // Topbar & Indicators
  const topbarHeading = document.getElementById('topbarHeading');
  const mongoDot = document.getElementById('mongoDot');
  const mongoLabel = document.getElementById('mongoLabel');
  const cloudDot = document.getElementById('cloudDot');
  const cloudLabel = document.getElementById('cloudLabel');
  const btnAdminRefresh = document.getElementById('btnAdminRefresh');

  // KPI Elements
  const statRevenue = document.getElementById('statRevenue');
  const statOrders = document.getElementById('statOrders');
  const statPending = document.getElementById('statPending');
  const statProducts = document.getElementById('statProducts');

  // Tabs
  const sidebarNav = document.querySelector('.sidebar-nav');
  const tabContents = document.querySelectorAll('.tab-content');

  // Orders DOM
  const ordersTableBody = document.getElementById('ordersTableBody');
  const orderSearchInput = document.getElementById('orderSearchInput');
  const orderStatusFilters = document.getElementById('orderStatusFilters');

  // Products DOM
  const productsTableBody = document.getElementById('productsTableBody');
  const productSearchInput = document.getElementById('productSearchInput');
  const productCategoryFilters = document.getElementById('productCategoryFilters');
  const btnOpenAddProductModal = document.getElementById('btnOpenAddProductModal');
  const btnReseedCatalog = document.getElementById('btnReseedCatalog');

  // Modals
  const productModal = document.getElementById('productModal');
  const btnCloseProductModal = document.getElementById('btnCloseProductModal');
  const productModalTitle = document.getElementById('productModalTitle');
  const productForm = document.getElementById('productForm');
  const editProductId = document.getElementById('editProductId');
  const pImageFile = document.getElementById('pImageFile');
  const pImageUrl = document.getElementById('pImageUrl');
  const pImagePreview = document.getElementById('pImagePreview');

  const quickPriceModal = document.getElementById('quickPriceModal');
  const btnCloseQuickPriceModal = document.getElementById('btnCloseQuickPriceModal');
  const quickPriceProdTitle = document.getElementById('quickPriceProdTitle');
  const quickPriceForm = document.getElementById('quickPriceForm');
  const qpProductId = document.getElementById('qpProductId');
  const qpNewPrice = document.getElementById('qpNewPrice');
  const qpOriginalPrice = document.getElementById('qpOriginalPrice');

  const invoiceModal = document.getElementById('invoiceModal');
  const btnCloseInvoiceModal = document.getElementById('btnCloseInvoiceModal');
  const invoiceModalBody = document.getElementById('invoiceModalBody');

  // Diagnostics DOM
  const mongoStatusBadge = document.getElementById('mongoStatusBadge');
  const cfgMongoDb = document.getElementById('cfgMongoDb');
  const cfgMongoUri = document.getElementById('cfgMongoUri');
  const cloudStatusBadge = document.getElementById('cloudStatusBadge');
  const cfgCloudName = document.getElementById('cfgCloudName');

  // 1. Toast Notification Helper
  function showAdminNotification(message, isSuccess = true) {
    const note = document.createElement('div');
    note.style.position = 'fixed';
    note.style.bottom = '24px';
    note.style.right = '24px';
    note.style.background = isSuccess ? '#065f46' : '#991b1b';
    note.style.color = '#fff';
    note.style.border = `1px solid ${isSuccess ? '#10b981' : '#f87171'}`;
    note.style.padding = '12px 20px';
    note.style.borderRadius = '8px';
    note.style.fontSize = '0.9rem';
    note.style.fontWeight = '600';
    note.style.zIndex = '9999';
    note.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    note.textContent = `${isSuccess ? '✓ ' : '⚠️ '}${message}`;
    document.body.appendChild(note);
    setTimeout(() => {
      note.style.opacity = '0';
      note.style.transition = 'opacity 0.3s ease';
      setTimeout(() => note.remove(), 300);
    }, 3000);
  }

  // 2. Fetch System Status
  async function fetchSystemStatus() {
    try {
      const res = await fetch('/api/system-status');
      const data = await res.json();
      if (!data.success) return;

      // MongoDB Status
      if (data.mongo.connected) {
        mongoDot.className = 'dot connected';
        mongoLabel.textContent = 'MongoDB Live';
        mongoStatusBadge.className = 'status-badge Delivered';
        mongoStatusBadge.textContent = 'Connected (Live)';
        cfgMongoDb.textContent = data.mongo.database;
        cfgMongoUri.textContent = 'Active (.env)';
      } else {
        mongoDot.className = 'dot';
        mongoLabel.textContent = 'Local DB Mode';
        mongoStatusBadge.className = 'status-badge Pending';
        mongoStatusBadge.textContent = 'Local Fallback Storage';
        cfgMongoDb.textContent = 'local_db.json';
        cfgMongoUri.textContent = data.mongo.uriConfigured ? 'URI present, server offline' : 'Not configured';
      }

      // Cloudinary Status
      if (data.cloudinary.configured) {
        cloudDot.className = 'dot connected';
        cloudLabel.textContent = 'Cloudinary CDN';
        cloudStatusBadge.className = 'status-badge Delivered';
        cloudStatusBadge.textContent = 'Cloudinary Active';
        cfgCloudName.textContent = data.cloudinary.cloudName;
      } else {
        cloudDot.className = 'dot';
        cloudLabel.textContent = 'Local Media';
        cloudStatusBadge.className = 'status-badge Pending';
        cloudStatusBadge.textContent = 'Local Uploads Folder';
        cfgCloudName.textContent = 'Local Storage Mode';
      }
    } catch (err) {
      console.warn('System status check failed:', err);
    }
  }

  // 3. Fetch Analytics Stats
  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        const stats = data.stats;
        statRevenue.textContent = `$${stats.totalRevenue.toFixed(2)}`;
        statOrders.textContent = stats.totalOrders;
        statPending.textContent = stats.pendingOrders;
        statProducts.textContent = stats.totalProducts;
      }
    } catch (err) {
      console.warn('Stats check failed:', err);
    }
  }

  // 4. Fetch Customer Orders
  async function fetchOrders() {
    try {
      ordersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Loading customer orders...</td></tr>`;
      let url = '/api/orders';
      if (activeStatusFilter !== 'All') {
        url += `?status=${encodeURIComponent(activeStatusFilter)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        ordersList = data.orders;
        renderOrders();
      }
    } catch (err) {
      ordersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f87171; padding:30px;">Error loading orders: ${err.message}</td></tr>`;
    }
  }

  function renderOrders() {
    let filtered = [...ordersList];
    if (orderSearchQuery) {
      const q = orderSearchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
            No customer orders found matching current criteria.
          </td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = filtered.map(order => {
      const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const itemsPreview = (order.items || []).map(i => `
        <div class="item-thumb-row" title="${i.title}">
          <img src="${i.image || '/uploads/product1.png'}" onerror="this.src='/uploads/product1.png'">
          <span class="item-title-qty">${i.title} &times; ${i.quantity}</span>
        </div>
      `).join('');

      return `
        <tr data-id="${order.id}">
          <td>
            <div class="order-id-cell">${order.orderNumber}</div>
            <div class="order-date">${dateFormatted}</div>
            <span style="font-size:0.7rem; color:var(--text-dim);">${order.orderType === 'single' ? '⚡ Direct Single Order' : '🛒 Cart Order'}</span>
          </td>
          <td>
            <div class="customer-info-box">
              <span class="cust-name">${order.customerName}</span>
              <span class="cust-contact">📞 ${order.customerPhone}</span>
              ${order.customerEmail ? `<span class="cust-contact">✉️ ${order.customerEmail}</span>` : ''}
              <span class="cust-address" title="${order.shippingAddress}">📍 ${order.shippingAddress}</span>
            </div>
          </td>
          <td>
            <div class="ordered-items-summary">
              ${itemsPreview}
            </div>
          </td>
          <td>
            <div class="order-total-cell">$${Number(order.total).toFixed(2)}</div>
            <span class="payment-badge">${order.paymentMethod}</span>
          </td>
          <td>
            <span class="status-badge ${order.status}">${order.status}</span>
          </td>
          <td>
            <select class="status-select" data-id="${order.id}">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <div class="table-actions-cell">
              <button class="btn-icon-action btn-view-invoice" data-id="${order.id}" title="View Detailed Invoice Receipt">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </button>
              <button class="btn-icon-action delete btn-delete-order" data-id="${order.id}" title="Delete Order">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 5. Fetch Products Catalog
  async function fetchProducts() {
    try {
      productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Loading catalog products...</td></tr>`;
      let url = '/api/products';
      if (activeProductCat !== 'All') {
        url += `?category=${encodeURIComponent(activeProductCat)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        productsList = data.products;
        renderProducts();
      }
    } catch (err) {
      productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f87171; padding:30px;">Error loading products: ${err.message}</td></tr>`;
    }
  }

  function renderProducts() {
    let filtered = [...productsList];
    if (productSearchQuery) {
      const q = productSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
            No products found in this category. Click "Add New Product" to expand your catalog.
          </td>
        </tr>
      `;
      return;
    }

    productsTableBody.innerHTML = filtered.map(prod => `
      <tr data-id="${prod.id}">
        <td>
          <div class="product-cell">
            <img src="${prod.image || '/uploads/product1.png'}" onerror="this.src='/uploads/product1.png'" alt="${prod.title}">
            <div class="product-meta">
              <h4 title="${prod.title}">${prod.title}</h4>
              <span>⭐ ${prod.rating || 5.0} (${prod.reviewsCount || 1} reviews)</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-weight:600; color:#c7d2fe;">${prod.category || 'General'}</span>
        </td>
        <td>
          <div class="price-display-cell">
            <span class="current">$${Number(prod.price).toFixed(2)}</span>
            ${prod.originalPrice > prod.price ? `<span class="orig">$${Number(prod.originalPrice).toFixed(2)}</span>` : ''}
          </div>
        </td>
        <td>
          <span style="color: ${prod.stock > 10 ? 'var(--admin-emerald)' : 'var(--admin-amber)'}; font-weight:700;">
            ${prod.stock} units
          </span>
        </td>
        <td>
          ${prod.badge ? `<span class="status-badge Shipped">${prod.badge}</span>` : '<span style="color:var(--text-dim);">-</span>'}
        </td>
        <td>
          <button class="btn-quick-price" data-id="${prod.id}" title="Quickly adjust product price">
            ✏️ Change Price
          </button>
        </td>
        <td>
          <div class="table-actions-cell">
            <button class="btn-icon-action btn-edit-product" data-id="${prod.id}" title="Edit Full Product Info">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="btn-icon-action delete btn-delete-product" data-id="${prod.id}" title="Delete Product">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 6. Quick Price Change Modal Handler (Specifically required by user)
  function openQuickPriceModal(product) {
    qpProductId.value = product.id;
    quickPriceProdTitle.textContent = product.title;
    qpNewPrice.value = product.price;
    qpOriginalPrice.value = product.originalPrice || '';
    quickPriceModal.classList.add('open');
  }

  async function handleQuickPriceSubmit(e) {
    e.preventDefault();
    const id = qpProductId.value;
    const price = parseFloat(qpNewPrice.value);
    const originalPrice = qpOriginalPrice.value ? parseFloat(qpOriginalPrice.value) : undefined;

    if (isNaN(price)) {
      showAdminNotification('Please enter a valid price', false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, originalPrice })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Price update failed');

      quickPriceModal.classList.remove('open');
      showAdminNotification(`Price updated to $${price.toFixed(2)} for ${data.product.title}`);
      fetchProducts();
      fetchStats();
    } catch (err) {
      showAdminNotification(err.message, false);
    }
  }

  // 7. Add / Edit Product Modal Handlers
  function openAddProductModal() {
    productForm.reset();
    editProductId.value = '';
    productModalTitle.textContent = 'Add New Product';
    pImagePreview.src = '/uploads/product1.png';
    productModal.classList.add('open');
  }

  function openEditProductModal(product) {
    productForm.reset();
    editProductId.value = product.id;
    productModalTitle.textContent = `Edit Product: ${product.title}`;

    document.getElementById('pTitle').value = product.title;
    document.getElementById('pCategory').value = product.category || 'Beauty & Cosmetics';
    document.getElementById('pBadge').value = product.badge || '';
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pOriginalPrice').value = product.originalPrice || '';
    document.getElementById('pStock').value = product.stock || 25;
    document.getElementById('pRating').value = product.rating || 4.9;
    document.getElementById('pImageUrl').value = product.image || '';
    pImagePreview.src = product.image || '/uploads/product1.png';
    document.getElementById('pDescription').value = product.description || '';
    document.getElementById('pFeatures').value = (product.features || []).join('\n');

    productModal.classList.add('open');
  }

  async function handleProductFormSubmit(e) {
    e.preventDefault();
    const isEdit = Boolean(editProductId.value);
    const formData = new FormData(productForm);

    const submitUrl = isEdit ? `/api/products/${editProductId.value}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(submitUrl, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to save product');

      productModal.classList.remove('open');
      showAdminNotification(isEdit ? 'Product updated successfully!' : 'Product added to catalog!');
      fetchProducts();
      fetchStats();
    } catch (err) {
      showAdminNotification(err.message, false);
    }
  }

  // 8. Order Status Change Handler
  async function handleStatusChange(orderId, newStatus) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Status update failed');

      showAdminNotification(`Order ${data.order.orderNumber} is now "${newStatus}"`);
      fetchOrders();
      fetchStats();
    } catch (err) {
      showAdminNotification(err.message, false);
    }
  }

  // 9. Order Invoice Printable Modal
  function showOrderInvoice(order) {
    const dateFormatted = new Date(order.createdAt).toLocaleString();
    const itemsRows = (order.items || []).map(i => `
      <tr>
        <td>
          <strong>${i.title}</strong>
        </td>
        <td style="text-align: center;">${i.quantity}</td>
        <td style="text-align: right;">$${Number(i.price).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700;">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    invoiceModalBody.innerHTML = `
      <div class="invoice-box">
        <div class="invoice-header">
          <div>
            <h2>AURAMARKET</h2>
            <p style="color: #64748b; font-size: 0.85rem;">Official Customer Sales Invoice</p>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 1.1rem; font-weight: 800;">${order.orderNumber}</div>
            <div style="font-size: 0.82rem; color: #64748b;">${dateFormatted}</div>
            <div style="margin-top: 4px; display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
              ${order.status}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 0.88rem; line-height: 1.5;">
          <div>
            <strong style="color: #475569; text-transform: uppercase; font-size: 0.75rem;">Customer Details</strong>
            <div><strong>${order.customerName}</strong></div>
            <div>Phone: ${order.customerPhone}</div>
            ${order.customerEmail ? `<div>Email: ${order.customerEmail}</div>` : ''}
          </div>
          <div>
            <strong style="color: #475569; text-transform: uppercase; font-size: 0.75rem;">Shipping Address</strong>
            <div>${order.shippingAddress}</div>
            <div style="margin-top: 4px; color: #64748b;">Payment: <strong>${order.paymentMethod}</strong></div>
            ${order.notes ? `<div style="font-style: italic; color: #64748b;">Notes: "${order.notes}"</div>` : ''}
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; font-size: 0.9rem; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <div>Subtotal: <strong>$${Number(order.subtotal || order.total).toFixed(2)}</strong></div>
          <div>Shipping: <strong>${order.shipping === 0 ? 'FREE' : `$${Number(order.shipping).toFixed(2)}`}</strong></div>
          ${order.discount ? `<div style="color: #059669;">Discount: <strong>-$${Number(order.discount).toFixed(2)}</strong></div>` : ''}
          <div style="font-size: 1.25rem; font-weight: 800; color: #1e1b4b; border-top: 2px solid #cbd5e1; padding-top: 6px; margin-top: 4px;">
            Total Amount: $${Number(order.total).toFixed(2)}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn-secondary" onclick="window.print()" style="color: #111; border-color: #cbd5e1;">
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    `;

    invoiceModal.classList.add('open');
  }

  // 10. Wire Up Event Listeners
  function setupEventListeners() {
    // Sidebar Tab Switching
    sidebarNav.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      item.classList.add('active');
      const tabId = item.dataset.tab;
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'tab-orders') {
        topbarHeading.textContent = 'Customer Orders Management';
        fetchOrders();
      } else if (tabId === 'tab-products') {
        topbarHeading.textContent = 'Products Catalog Management';
        fetchProducts();
      } else {
        topbarHeading.textContent = 'System & Cloudinary Diagnostics';
        fetchSystemStatus();
      }
    });

    // Refresh Sync button
    btnAdminRefresh.addEventListener('click', () => {
      fetchSystemStatus();
      fetchStats();
      fetchOrders();
      fetchProducts();
      showAdminNotification('Admin data refreshed from server');
    });

    // Orders Status Filter Pills
    orderStatusFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      orderStatusFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.status;
      fetchOrders();
    });

    // Orders Search input
    orderSearchInput.addEventListener('input', (e) => {
      orderSearchQuery = e.target.value.trim();
      renderOrders();
    });

    // Orders Table Action Delegation (Status change, invoice, delete)
    ordersTableBody.addEventListener('change', (e) => {
      if (e.target.classList.contains('status-select')) {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        handleStatusChange(orderId, newStatus);
      }
    });

    ordersTableBody.addEventListener('click', (e) => {
      const btnInvoice = e.target.closest('.btn-view-invoice');
      const btnDelete = e.target.closest('.btn-delete-order');

      if (btnInvoice) {
        const id = btnInvoice.dataset.id;
        const order = ordersList.find(o => o.id === id);
        if (order) showOrderInvoice(order);
      } else if (btnDelete) {
        const id = btnDelete.dataset.id;
        if (confirm('Are you sure you want to delete this order from the system?')) {
          fetch(`/api/orders/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(d => {
              if (d.success) {
                showAdminNotification('Order deleted');
                fetchOrders();
                fetchStats();
              }
            });
        }
      }
    });

    // Products Category Filter Pills
    productCategoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      productCategoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeProductCat = btn.dataset.category;
      fetchProducts();
    });

    // Products Search input
    productSearchInput.addEventListener('input', (e) => {
      productSearchQuery = e.target.value.trim();
      renderProducts();
    });

    // Products Table Action Delegation (Quick price, Edit, Delete)
    productsTableBody.addEventListener('click', (e) => {
      const btnPrice = e.target.closest('.btn-quick-price');
      const btnEdit = e.target.closest('.btn-edit-product');
      const btnDelete = e.target.closest('.btn-delete-product');

      if (btnPrice) {
        const id = btnPrice.dataset.id;
        const prod = productsList.find(p => p.id === id);
        if (prod) openQuickPriceModal(prod);
      } else if (btnEdit) {
        const id = btnEdit.dataset.id;
        const prod = productsList.find(p => p.id === id);
        if (prod) openEditProductModal(prod);
      } else if (btnDelete) {
        const id = btnDelete.dataset.id;
        if (confirm('Delete this product from catalog?')) {
          fetch(`/api/products/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(d => {
              if (d.success) {
                showAdminNotification('Product removed from catalog');
                fetchProducts();
                fetchStats();
              }
            });
        }
      }
    });

    // Quick Price Form Submit
    quickPriceForm.addEventListener('submit', handleQuickPriceSubmit);

    // Add Product Modal trigger
    btnOpenAddProductModal.addEventListener('click', openAddProductModal);

    // Reseed Default Catalog
    btnReseedCatalog.addEventListener('click', () => {
      if (confirm('Reset catalog to the default initial showcase products?')) {
        fetch('/api/products/seed', { method: 'POST' })
          .then(res => res.json())
          .then(d => {
            if (d.success) {
              showAdminNotification('Default catalog reseeded!');
              fetchProducts();
              fetchStats();
            }
          });
      }
    });

    // Image File Selection Preview
    pImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          pImagePreview.src = re.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    pImageUrl.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) pImagePreview.src = val;
    });

    // Product Form Submit
    productForm.addEventListener('submit', handleProductFormSubmit);

    // Modal Close buttons
    btnCloseProductModal.addEventListener('click', () => productModal.classList.remove('open'));
    btnCloseQuickPriceModal.addEventListener('click', () => quickPriceModal.classList.remove('open'));
    btnCloseInvoiceModal.addEventListener('click', () => invoiceModal.classList.remove('open'));
  }

  // Init
  setupEventListeners();
  fetchSystemStatus();
  fetchStats();
  fetchOrders();
  fetchProducts();

})();
