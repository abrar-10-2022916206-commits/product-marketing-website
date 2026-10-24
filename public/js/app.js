/**
 * AURAMARKET - Premium Product Marketing Platform
 * Customer Storefront Application Logic
 */

(function () {
  'use strict';

  // State Management
  let allProducts = [];
  let currentCategory = 'All';
  let currentSearch = '';
  let currentSort = 'featured';
  let cart = [];
  let activeCoupon = null; // e.g. { code: 'MARKETING20', rate: 0.20 }
  let singleProductSelected = null;
  let singleProductQty = 1;

  // DOM Elements
  const productsGrid = document.getElementById('productsGrid');
  const catalogSubtitle = document.getElementById('catalogSubtitle');
  const categoryPills = document.getElementById('categoryPills');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const cartCounter = document.getElementById('cartCounter');
  const btnOpenCart = document.getElementById('btnOpenCart');
  const btnCloseCart = document.getElementById('btnCloseCart');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartShippingEl = document.getElementById('cartShipping');
  const cartDiscountEl = document.getElementById('cartDiscount');
  const discountRow = document.getElementById('discountRow');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartCouponInput = document.getElementById('cartCouponInput');
  const btnApplyCoupon = document.getElementById('btnApplyCoupon');
  const btnProceedCartCheckout = document.getElementById('btnProceedCartCheckout');

  // Modals
  const singleOrderModal = document.getElementById('singleOrderModal');
  const btnCloseSingleModal = document.getElementById('btnCloseSingleModal');
  const singleItemPreview = document.getElementById('singleItemPreview');
  const singleOrderForm = document.getElementById('singleOrderForm');

  const cartCheckoutModal = document.getElementById('cartCheckoutModal');
  const btnCloseCartCheckoutModal = document.getElementById('btnCloseCartCheckoutModal');
  const cartOrderForm = document.getElementById('cartOrderForm');
  const cartModalItemCount = document.getElementById('cartModalItemCount');
  const cartModalTotal = document.getElementById('cartModalTotal');
  const cartModalItemsMini = document.getElementById('cartModalItemsMini');

  const quickViewModal = document.getElementById('quickViewModal');
  const btnCloseQuickView = document.getElementById('btnCloseQuickView');
  const quickViewContent = document.getElementById('quickViewContent');

  const trackingModal = document.getElementById('trackingModal');
  const btnOpenTracking = document.getElementById('btnOpenTracking');
  const btnCloseTrackingModal = document.getElementById('btnCloseTrackingModal');
  const trackInput = document.getElementById('trackInput');
  const btnSearchTracking = document.getElementById('btnSearchTracking');
  const trackingResultArea = document.getElementById('trackingResultArea');

  const confirmationModal = document.getElementById('confirmationModal');
  const btnCloseConfirmation = document.getElementById('btnCloseConfirmation');
  const confirmedOrderNumber = document.getElementById('confirmedOrderNumber');
  const confirmedOrderSummary = document.getElementById('confirmedOrderSummary');
  const btnCopyOrderId = document.getElementById('btnCopyOrderId');
  const btnTrackConfirmedOrder = document.getElementById('btnTrackConfirmedOrder');

  const promoBadge = document.getElementById('promoBadge');
  const toastContainer = document.getElementById('toastContainer');

  // 1. Toast Notification System
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // 2. Load Cart from LocalStorage
  function loadCart() {
    try {
      const stored = localStorage.getItem('auramarket_cart');
      cart = stored ? JSON.parse(stored) : [];
    } catch (e) {
      cart = [];
    }
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem('auramarket_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function calculateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 75 || subtotal === 0 ? 0 : 5.99;
    let discount = 0;
    if (activeCoupon && subtotal > 0) {
      discount = subtotal * activeCoupon.rate;
    }
    const total = Math.max(0, subtotal + shipping - discount);
    return { subtotal, shipping, discount, total };
  }

  function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounter.textContent = count;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <p>Your shopping cart is currently empty.</p>
          <p style="font-size: 0.8rem; margin-top: 6px; color: var(--text-dim);">Add signature items from our catalog!</p>
        </div>
      `;
      btnProceedCartCheckout.disabled = true;
      btnProceedCartCheckout.style.opacity = '0.5';
    } else {
      btnProceedCartCheckout.disabled = false;
      btnProceedCartCheckout.style.opacity = '1';
      cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
          <img src="${item.image || '/uploads/product1.png'}" alt="${item.title}" onerror="this.src='/uploads/product1.png'">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)} ($${item.price.toFixed(2)} each)</div>
            <div class="qty-control">
              <button class="qty-btn btn-cart-dec" data-index="${index}">-</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn btn-cart-inc" data-index="${index}">+</button>
            </div>
          </div>
          <button class="cart-item-remove btn-cart-remove" data-index="${index}" title="Remove item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `).join('');
    }

    const { subtotal, shipping, discount, total } = calculateCartTotals();
    cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    cartShippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (discount > 0) {
      discountRow.style.display = 'flex';
      cartDiscountEl.textContent = `-$${discount.toFixed(2)} (${activeCoupon.code})`;
    } else {
      discountRow.style.display = 'none';
    }
    cartTotalEl.textContent = `$${total.toFixed(2)}`;
  }

  function addToCart(product, quantity = 1) {
    const existingIndex = cart.findIndex(i => i.id === product.id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: quantity
      });
    }
    saveCart();
    showToast(`Added "${product.title}" to cart`, 'success');
  }

  // 3. Fetch Products from Backend API
  async function fetchProducts() {
    try {
      productsGrid.innerHTML = `
        <div class="empty-catalog">
          <p>Loading curated product collections...</p>
        </div>
      `;

      let url = `/api/products?sort=${encodeURIComponent(currentSort)}`;
      if (currentCategory && currentCategory !== 'All') {
        url += `&category=${encodeURIComponent(currentCategory)}`;
      }
      if (currentSearch) {
        url += `&search=${encodeURIComponent(currentSearch)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        allProducts = data.products;
        renderProducts(allProducts);
      } else {
        throw new Error(data.message || 'Failed to load products');
      }
    } catch (err) {
      console.error(err);
      productsGrid.innerHTML = `
        <div class="empty-catalog">
          <h3>Unable to load catalog</h3>
          <p>${err.message}</p>
          <button class="btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  // 4. Render Product Cards Grid
  function renderProducts(products) {
    if (!products || products.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-catalog">
          <h3>No products found</h3>
          <p>Try searching for a different keyword or resetting your filter category.</p>
          <button class="btn-secondary" id="btnResetFilter">Show All Products</button>
        </div>
      `;
      const btnReset = document.getElementById('btnResetFilter');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          currentCategory = 'All';
          currentSearch = '';
          searchInput.value = '';
          updateActiveCategoryPill('All');
          fetchProducts();
        });
      }
      catalogSubtitle.textContent = '0 items found matching your filter';
      return;
    }

    catalogSubtitle.textContent = `Showing ${products.length} exclusive items in ${currentCategory}`;

    productsGrid.innerHTML = products.map(product => {
      const discountPercent = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

      const badgeClass = (product.badge || '').toLowerCase().includes('best') ? 'gold'
        : (product.badge || '').toLowerCase().includes('hot') ? 'rose' : '';

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="card-image-box">
            <img src="${product.image || '/uploads/product1.png'}" alt="${product.title}" loading="lazy" onerror="this.src='/uploads/product1.png'">
            ${product.badge ? `<span class="card-badge ${badgeClass}">${product.badge}</span>` : ''}
            ${discountPercent ? `<span class="card-discount-tag">Save ${discountPercent}%</span>` : ''}
            <div class="card-quick-view-overlay">
              <button class="btn-quick-view" data-id="${product.id}">Quick View</button>
            </div>
          </div>

          <div class="card-content">
            <div class="card-category">${product.category || 'General'}</div>
            <h3 class="card-title" title="${product.title}">${product.title}</h3>

            <div class="card-rating-row">
              <span class="stars">★★★★★</span>
              <span class="rating-val">${product.rating || 5.0}</span>
              <span class="reviews-cnt">(${product.reviewsCount || 1} reviews)</span>
            </div>

            <p class="card-desc">${product.description || ''}</p>

            <div class="card-stock-pill">
              In Stock &bull; Ships within 24h
            </div>

            <div class="card-price-row">
              <span class="current-price">$${Number(product.price).toFixed(2)}</span>
              ${product.originalPrice && product.originalPrice > product.price ? `
                <span class="original-price">$${Number(product.originalPrice).toFixed(2)}</span>
              ` : ''}
            </div>

            <div class="card-actions-row">
              <button class="btn-add-cart" data-id="${product.id}" title="Add to shopping cart">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                </svg>
                Add to Cart
              </button>

              <button class="btn-buy-now" data-id="${product.id}" title="Order this single product directly">
                Buy Now
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function updateActiveCategoryPill(category) {
    document.querySelectorAll('.category-pill').forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // 5. Open Single Product Direct Checkout Modal
  function openSingleProductCheckout(product) {
    singleProductSelected = product;
    singleProductQty = 1;

    singleItemPreview.innerHTML = `
      <img src="${product.image || '/uploads/product1.png'}" alt="${product.title}">
      <div class="single-item-info">
        <h4>${product.title}</h4>
        <p id="singleModalUnitPrice">$${Number(product.price).toFixed(2)} each</p>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Quantity:</span>
          <div class="qty-control">
            <button type="button" class="qty-btn" id="btnSingleQtyDec">-</button>
            <span class="qty-display" id="singleQtyDisplay">1</span>
            <button type="button" class="qty-btn" id="btnSingleQtyInc">+</button>
          </div>
          <span id="singleModalTotalPrice" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-left: auto;">
            Total: $${Number(product.price).toFixed(2)}
          </span>
        </div>
      </div>
    `;

    // Wire up modal single qty buttons
    document.getElementById('btnSingleQtyDec').onclick = () => {
      if (singleProductQty > 1) {
        singleProductQty--;
        updateSingleModalPricing();
      }
    };
    document.getElementById('btnSingleQtyInc').onclick = () => {
      singleProductQty++;
      updateSingleModalPricing();
    };

    singleOrderModal.classList.add('open');
  }

  function updateSingleModalPricing() {
    document.getElementById('singleQtyDisplay').textContent = singleProductQty;
    const total = singleProductSelected.price * singleProductQty;
    document.getElementById('singleModalTotalPrice').textContent = `Total: $${total.toFixed(2)}`;
  }

  // 6. Open Cart Multi-Product Checkout Modal
  function openCartCheckout() {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    const { subtotal, shipping, discount, total } = calculateCartTotals();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartModalItemCount.textContent = `${count} ${count === 1 ? 'Item' : 'Items'} in Order`;
    cartModalTotal.textContent = `Total: $${total.toFixed(2)}`;
    cartModalItemsMini.innerHTML = cart.map(i => `${i.title} (${i.quantity}x)`).join(' • ');

    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    cartCheckoutModal.classList.add('open');
  }

  // 7. Open Quick View Lightbox Modal
  function openQuickView(product) {
    const featuresList = (product.features && product.features.length)
      ? product.features.map(f => `<li>${f}</li>`).join('')
      : `<li>100% genuine product guaranteed</li><li>Express delivery available</li>`;

    quickViewContent.innerHTML = `
      <div class="quick-view-layout">
        <div>
          <img class="qv-image" src="${product.image || '/uploads/product1.png'}" alt="${product.title}">
        </div>
        <div class="qv-details">
          <span class="card-category">${product.category}</span>
          <h3>${product.title}</h3>
          
          <div class="card-rating-row">
            <span class="stars">★★★★★</span>
            <span class="rating-val">${product.rating || 5.0}</span>
            <span class="reviews-cnt">(${product.reviewsCount || 1} verified customer reviews)</span>
          </div>

          <div class="card-price-row" style="margin: 14px 0;">
            <span class="current-price" style="font-size: 1.8rem;">$${Number(product.price).toFixed(2)}</span>
            ${product.originalPrice > product.price ? `
              <span class="original-price" style="font-size: 1.1rem;">$${Number(product.originalPrice).toFixed(2)}</span>
            ` : ''}
          </div>

          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
            ${product.description}
          </p>

          <h5 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-main); margin-bottom: 8px;">Key Highlights:</h5>
          <ul class="qv-features-list">
            ${featuresList}
          </ul>

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn-add-cart" id="btnQvAddToCart" style="flex: 1; padding: 12px;">
              Add to Cart
            </button>
            <button class="btn-buy-now" id="btnQvBuyNow" style="flex: 1; padding: 12px;">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnQvAddToCart').onclick = () => {
      addToCart(product, 1);
      quickViewModal.classList.remove('open');
    };

    document.getElementById('btnQvBuyNow').onclick = () => {
      quickViewModal.classList.remove('open');
      openSingleProductCheckout(product);
    };

    quickViewModal.classList.add('open');
  }

  // 8. Order Placement Submission
  async function submitOrder(orderPayload) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to place order');
      }

      // Close open modals
      singleOrderModal.classList.remove('open');
      cartCheckoutModal.classList.remove('open');

      // Show confirmation
      confirmedOrderNumber.textContent = data.order.orderNumber;
      confirmedOrderSummary.innerHTML = `
        <strong>Customer:</strong> ${data.order.customerName} (${data.order.customerPhone})<br>
        <strong>Items:</strong> ${data.order.items.map(i => `${i.title} x${i.quantity}`).join(', ')}<br>
        <strong>Total Amount:</strong> $${Number(data.order.total).toFixed(2)} (${data.order.paymentMethod})<br>
        <strong>Status:</strong> <span style="color: var(--accent-amber); font-weight: 700;">${data.order.status}</span>
      `;

      btnCopyOrderId.onclick = () => {
        navigator.clipboard.writeText(data.order.orderNumber);
        showToast(`Copied ${data.order.orderNumber} to clipboard!`, 'success');
      };

      btnTrackConfirmedOrder.onclick = () => {
        confirmationModal.classList.remove('open');
        trackInput.value = data.order.orderNumber;
        openTrackingModal();
        performTrackOrder(data.order.orderNumber);
      };

      confirmationModal.classList.add('open');
      showToast('Order received successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  }

  // 9. Order Tracking Timeline
  function openTrackingModal() {
    trackingModal.classList.add('open');
    trackingResultArea.innerHTML = '';
  }

  async function performTrackOrder(identifier) {
    if (!identifier) {
      showToast('Please enter an order ID or phone number', 'error');
      return;
    }

    trackingResultArea.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem;">Locating order information...</p>`;

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();
      if (!data.success || !data.order) {
        trackingResultArea.innerHTML = `
          <div class="tracking-not-found">
            No order found matching "<strong>${identifier}</strong>". Please check your reference code or registered phone number.
          </div>
        `;
        return;
      }

      const order = data.order;
      const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
      const currentIndex = statuses.indexOf(order.status);
      const isCancelled = order.status === 'Cancelled';

      let stepperHtml = '';
      if (!isCancelled) {
        stepperHtml = `
          <div class="tracking-stepper">
            ${statuses.map((step, idx) => {
              let cls = '';
              if (idx < currentIndex) cls = 'completed';
              else if (idx === currentIndex) cls = 'active';
              return `
                <div class="step-node ${cls}">
                  <div class="step-circle">${idx < currentIndex ? '✓' : idx + 1}</div>
                  <div class="step-label">${step}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        stepperHtml = `
          <div class="tracking-cancelled-banner">
            This order has been Cancelled.
          </div>
        `;
      }

      trackingResultArea.innerHTML = `
        <div class="tracking-result-card">
          <div class="tracking-result-header">
            <div>
              <span class="tracking-label">ORDER REF</span>
              <h4 class="tracking-ref-code">${order.orderNumber}</h4>
            </div>
            <div>
              <span class="status-badge ${order.status}">
                ${order.status}
              </span>
            </div>
          </div>

          ${stepperHtml}

          <div class="tracking-info-grid">
            <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
            <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Order Placed:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          </div>

          <div class="tracking-items-box">
            <strong>Items:</strong>
            <ul class="tracking-items-list">
              ${order.items.map(i => `
                <li>
                  <span>${i.title} &times; ${i.quantity}</span>
                  <span>$${(i.price * i.quantity).toFixed(2)}</span>
                </li>
              `).join('')}
            </ul>
            <div class="tracking-total-line">
              <span>Total Paid:</span>
              <span>$${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      trackingResultArea.innerHTML = `<p style="color: var(--accent-rose);">Error checking order status.</p>`;
    }
  }

  // 10. Event Listeners Initialization
  function setupEventListeners() {
    // Category pills filter
    categoryPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-pill');
      if (!btn) return;
      currentCategory = btn.dataset.category;
      updateActiveCategoryPill(currentCategory);
      fetchProducts();
    });

    // Search input with debounce
    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        fetchProducts();
      }, 300);
    });

    // Sort select
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      fetchProducts();
    });

    // Grid Event Delegation (Quick view, Add to Cart, Buy Now)
    productsGrid.addEventListener('click', (e) => {
      const btnQuickView = e.target.closest('.btn-quick-view');
      const btnAddCart = e.target.closest('.btn-add-cart');
      const btnBuyNow = e.target.closest('.btn-buy-now');

      if (btnQuickView) {
        const id = btnQuickView.dataset.id;
        const prod = allProducts.find(p => p.id === id);
        if (prod) openQuickView(prod);
      } else if (btnAddCart) {
        const id = btnAddCart.dataset.id;
        const prod = allProducts.find(p => p.id === id);
        if (prod) addToCart(prod, 1);
      } else if (btnBuyNow) {
        const id = btnBuyNow.dataset.id;
        const prod = allProducts.find(p => p.id === id);
        if (prod) openSingleProductCheckout(prod);
      }
    });

    // Cart Drawer Open/Close
    btnOpenCart.addEventListener('click', () => {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
    });

    btnCloseCart.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    });

    cartOverlay.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    });

    // Cart Items modification (+ / - / remove)
    cartItemsContainer.addEventListener('click', (e) => {
      const btnInc = e.target.closest('.btn-cart-inc');
      const btnDec = e.target.closest('.btn-cart-dec');
      const btnRemove = e.target.closest('.btn-cart-remove');

      if (btnInc) {
        const idx = parseInt(btnInc.dataset.index, 10);
        if (cart[idx]) {
          cart[idx].quantity++;
          saveCart();
        }
      } else if (btnDec) {
        const idx = parseInt(btnDec.dataset.index, 10);
        if (cart[idx]) {
          if (cart[idx].quantity > 1) {
            cart[idx].quantity--;
          } else {
            cart.splice(idx, 1);
          }
          saveCart();
        }
      } else if (btnRemove) {
        const idx = parseInt(btnRemove.dataset.index, 10);
        if (cart[idx]) {
          const title = cart[idx].title;
          cart.splice(idx, 1);
          saveCart();
          showToast(`Removed "${title}"`, 'info');
        }
      }
    });

    // Apply Coupon
    btnApplyCoupon.addEventListener('click', () => {
      const code = cartCouponInput.value.trim().toUpperCase();
      if (!code) {
        showToast('Please enter a coupon code', 'error');
        return;
      }
      if (code === 'MARKETING20') {
        activeCoupon = { code: 'MARKETING20', rate: 0.20 };
        showToast('20% Flash Marketing Discount applied!', 'success');
        updateCartUI();
      } else if (code === 'WELCOME10') {
        activeCoupon = { code: 'WELCOME10', rate: 0.10 };
        showToast('10% Welcome Discount applied!', 'success');
        updateCartUI();
      } else {
        showToast('Invalid coupon code. Try MARKETING20', 'error');
      }
    });

    promoBadge.addEventListener('click', () => {
      navigator.clipboard.writeText('MARKETING20');
      showToast('Copied code "MARKETING20" to clipboard!', 'success');
      cartCouponInput.value = 'MARKETING20';
    });

    // Cart Checkout trigger
    btnProceedCartCheckout.addEventListener('click', openCartCheckout);

    // Modal Close Buttons
    btnCloseSingleModal.addEventListener('click', () => singleOrderModal.classList.remove('open'));
    btnCloseCartCheckoutModal.addEventListener('click', () => cartCheckoutModal.classList.remove('open'));
    btnCloseQuickView.addEventListener('click', () => quickViewModal.classList.remove('open'));
    btnCloseTrackingModal.addEventListener('click', () => trackingModal.classList.remove('open'));
    btnCloseConfirmation.addEventListener('click', () => confirmationModal.classList.remove('open'));

    btnOpenTracking.addEventListener('click', openTrackingModal);
    document.getElementById('footerTrackLink').addEventListener('click', (e) => {
      e.preventDefault();
      openTrackingModal();
    });

    btnSearchTracking.addEventListener('click', () => {
      performTrackOrder(trackInput.value);
    });

    trackInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performTrackOrder(trackInput.value);
      }
    });

    // Payment label selection styling
    document.querySelectorAll('.payment-card-label').forEach(label => {
      label.addEventListener('click', () => {
        const form = label.closest('form');
        form.querySelectorAll('.payment-card-label').forEach(l => l.classList.remove('selected'));
        label.classList.add('selected');
      });
    });

    // Single Product Order Form Submit
    singleOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!singleProductSelected) return;

      const formData = new FormData(singleOrderForm);
      const subtotal = singleProductSelected.price * singleProductQty;
      const shipping = subtotal > 75 ? 0 : 5.99;
      const total = subtotal + shipping;

      const orderPayload = {
        orderType: 'single',
        customerName: formData.get('customerName'),
        customerPhone: formData.get('customerPhone'),
        customerEmail: formData.get('customerEmail'),
        shippingAddress: formData.get('shippingAddress'),
        notes: formData.get('notes'),
        paymentMethod: formData.get('paymentMethod'),
        items: [
          {
            productId: singleProductSelected.id,
            title: singleProductSelected.title,
            price: singleProductSelected.price,
            image: singleProductSelected.image,
            quantity: singleProductQty
          }
        ],
        subtotal,
        shipping,
        discount: 0,
        total
      };

      submitOrder(orderPayload);
    });

    // Cart Order Form Submit
    cartOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (cart.length === 0) return;

      const formData = new FormData(cartOrderForm);
      const { subtotal, shipping, discount, total } = calculateCartTotals();

      const orderPayload = {
        orderType: 'cart',
        customerName: formData.get('customerName'),
        customerPhone: formData.get('customerPhone'),
        customerEmail: formData.get('customerEmail'),
        shippingAddress: formData.get('shippingAddress'),
        notes: formData.get('notes'),
        paymentMethod: formData.get('paymentMethod'),
        items: cart.map(item => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          image: item.image,
          quantity: item.quantity
        })),
        subtotal,
        shipping,
        discount,
        total
      };

      submitOrder(orderPayload).then(() => {
        cart = [];
        saveCart();
      });
    });

    // Footer Category links
    document.querySelectorAll('.footer-cat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.cat;
        currentCategory = cat;
        updateActiveCategoryPill(cat);
        fetchProducts();
        document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Init
  loadCart();
  setupEventListeners();
  fetchProducts();

})();
