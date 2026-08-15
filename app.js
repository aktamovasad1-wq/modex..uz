(() => {
  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  const productsGrid = document.getElementById("productsGrid");
  const categoryList = document.getElementById("categoryList");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");
  const productCount = document.getElementById("productCount");
  const emptyState = document.getElementById("emptyState");

  const searchInput = document.getElementById("searchInput");
  const mobileSearchInput = document.getElementById("mobileSearchInput");

  const orderDialog = document.getElementById("orderDialog");
  const orderForm = document.getElementById("orderForm");
  const closeDialog = document.getElementById("closeDialog");

  const selectedProductTitle =
    document.getElementById("selectedProductTitle");

  const productInput = document.getElementById("productInput");
  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");
  const sizeInput = document.getElementById("sizeInput");
  const colorInput = document.getElementById("colorInput");
  const quantityInput = document.getElementById("quantityInput");

  const formMessage = document.getElementById("formMessage");
  const submitOrder = document.getElementById("submitOrder");

  const supportForm = document.getElementById("supportForm");
  const supportName = document.getElementById("supportName");
  const supportPhone = document.getElementById("supportPhone");
  const supportMessage = document.getElementById("supportMessage");
  const supportFormMessage =
    document.getElementById("supportFormMessage");

  const favoriteCount = document.getElementById("favoriteCount");
  const cartCount = document.getElementById("cartCount");

  const favoritesBtn = document.getElementById("favoritesBtn");
  const cartBtn = document.getElementById("cartBtn");

  const mobileFavoritesBtn =
    document.getElementById("mobileFavoritesBtn");

  const mobileCartBtn =
    document.getElementById("mobileCartBtn");

  const favoritesDrawer =
    document.getElementById("favoritesDrawer");

  const cartDrawer =
    document.getElementById("cartDrawer");

  const favoritesOverlay =
    document.getElementById("favoritesOverlay");

  const cartOverlay =
    document.getElementById("cartOverlay");

  const closeFavorites =
    document.getElementById("closeFavorites");

  const closeCart =
    document.getElementById("closeCart");

  const favoriteItems =
    document.getElementById("favoriteItems");

  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");


  let allProducts = [];
  let currentProducts = [];

  let favorites =
    JSON.parse(localStorage.getItem("modex_favorites") || "[]");

  let cart =
    JSON.parse(localStorage.getItem("modex_cart") || "[]");


  function money(value) {
    const number = Number(value || 0);

    return number.toLocaleString("uz-UZ") + " so‘m";
  }


  function setFormMessage(text, type = "") {
    formMessage.textContent = text;
    formMessage.className = "form-message";

    if (type) {
      formMessage.classList.add(type);
    }
  }


  function setSupportMessage(text, type = "") {
    supportFormMessage.textContent = text;
    supportFormMessage.className = "form-message";

    if (type) {
      supportFormMessage.classList.add(type);
    }
  }


  async function supabaseRequest(path, options = {}) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase config topilmadi.");
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        ...options,

        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          ...(options.headers || {})
        }
      }
    );

    if (!response.ok) {
      let message = "Server xatosi.";

      try {
        const data = await response.json();

        if (data?.message) {
          message = data.message;
        }

        if (data?.details) {
          message += ` ${data.details}`;
        }
      } catch (_) {}

      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();

    if (!text) {
      return null;
    }

    return JSON.parse(text);
  }


  async function loadProducts() {
    try {
      const products = await supabaseRequest(
        "products?select=*&active=eq.true&order=id.desc"
      );

      allProducts = Array.isArray(products) ? products : [];

      buildCategories();
      applyFilters();

    } catch (error) {
      console.error(error);

      productsGrid.innerHTML = `
        <p style="color:#d6455d;font-weight:700;">
          Mahsulotlarni yuklab bo‘lmadi.
        </p>
      `;
    }
  }


  function buildCategories() {
    const categories = [
      ...new Set(
        allProducts
          .map(product => product.category)
          .filter(Boolean)
      )
    ];

    categoryList.innerHTML = "";

    categoryFilter.innerHTML = `
      <option value="">
        Barcha kategoriyalar
      </option>
    `;

    categories.forEach(category => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "category-card";

      card.innerHTML = `
        <span class="category-icon">▦</span>
        <strong>${escapeHtml(category)}</strong>
      `;

      card.addEventListener("click", () => {
        categoryFilter.value = category;
        applyFilters();

        document
          .getElementById("products")
          ?.scrollIntoView({
            behavior: "smooth"
          });
      });

      categoryList.appendChild(card);

      const option = document.createElement("option");

      option.value = category;
      option.textContent = category;

      categoryFilter.appendChild(option);
    });
  }


  function applyFilters() {
    const desktopSearch =
      searchInput?.value?.trim().toLowerCase() || "";

    const mobileSearch =
      mobileSearchInput?.value?.trim().toLowerCase() || "";

    const query = mobileSearch || desktopSearch;

    const category = categoryFilter?.value || "";
    const sort = sortSelect?.value || "new";

    let products = [...allProducts];

    if (query) {
      products = products.filter(product => {
        const text = `
          ${product.name || ""}
          ${product.category || ""}
          ${product.description || ""}
        `.toLowerCase();

        return text.includes(query);
      });
    }

    if (category) {
      products = products.filter(
        product => product.category === category
      );
    }

    if (sort === "cheap") {
      products.sort(
        (a, b) =>
          Number(a.price || 0) - Number(b.price || 0)
      );
    }

    if (sort === "expensive") {
      products.sort(
        (a, b) =>
          Number(b.price || 0) - Number(a.price || 0)
      );
    }

    if (sort === "new") {
      products.sort(
        (a, b) =>
          Number(b.id || 0) - Number(a.id || 0)
      );
    }

    currentProducts = products;

    renderProducts();
  }


  function renderProducts() {
    productsGrid.innerHTML = "";

    productCount.textContent =
      `${currentProducts.length} ta mahsulot`;

    if (currentProducts.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    currentProducts.forEach(product => {
      const card = document.createElement("article");

      card.className = "market-product-card";

      const stock = Number(product.stock || 0);
      const isFavorite = favorites.includes(product.id);

      const oldPrice =
        Number(product.old_price || 0);

      const discount =
        Number(product.discount_percent || 0);

      card.innerHTML = `
        <div class="product-image-box">

          <img
            src="${escapeAttribute(product.image_url || product.image || "")}"
            alt="${escapeAttribute(product.name || "Mahsulot")}"
            loading="lazy"
            onerror="this.style.display='none'"
          >

          <button
            class="favorite-button"
            type="button"
            data-favorite-id="${product.id}"
          >
            ${isFavorite ? "♥" : "♡"}
          </button>

        </div>

        <div class="market-product-info">

          <span class="market-category">
            ${escapeHtml(product.category || "Mahsulot")}
          </span>

          <a
            href="./product.html?id=${product.id}"
            class="market-product-title"
          >
            ${escapeHtml(product.name || "Mahsulot")}
          </a>

          ${
            product.description
              ? `
                <p class="market-description">
                  ${escapeHtml(product.description)}
                </p>
              `
              : ""
          }

          ${
            discount > 0
              ? `
                <span class="discount-badge">
                  -${discount}%
                </span>
              `
              : ""
          }

          ${
            oldPrice > 0
              ? `
                <span class="old-price">
                  ${money(oldPrice)}
                </span>
              `
              : ""
          }

          <strong class="market-price">
            ${money(product.price)}
          </strong>

          <small
            style="
              color:${stock > 0 ? "#16835a" : "#d6455d"};
              font-weight:800;
            "
          >
            ${
              stock > 0
                ? `Omborda ${stock} dona`
                : "Omborda yo‘q"
            }
          </small>

          <div class="market-card-buttons">

            <button
              class="main-btn"
              type="button"
              data-order-id="${product.id}"
              ${stock <= 0 ? "disabled" : ""}
            >
              Buyurtma
            </button>

            <button
              class="cart-circle"
              type="button"
              data-cart-id="${product.id}"
              ${stock <= 0 ? "disabled" : ""}
            >
              🛒
            </button>

          </div>

        </div>
      `;

      productsGrid.appendChild(card);
    });

    bindProductButtons();
  }


  function bindProductButtons() {
    document
      .querySelectorAll("[data-order-id]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const id = Number(button.dataset.orderId);
          openOrder(id);
        });
      });


    document
      .querySelectorAll("[data-favorite-id]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const id = Number(button.dataset.favoriteId);
          toggleFavorite(id);
          applyFilters();
        });
      });


    document
      .querySelectorAll("[data-cart-id]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const id = Number(button.dataset.cartId);
          addToCart(id);
        });
      });
  }


  function openOrder(id) {
    const product = allProducts.find(
      item => Number(item.id) === Number(id)
    );

    if (!product) {
      return;
    }

    if (Number(product.stock || 0) <= 0) {
      alert("Bu mahsulot hozir omborda yo‘q.");
      return;
    }

    productInput.value = product.id;
    selectedProductTitle.textContent =
      product.name || "Mahsulot";

    quantityInput.value = 1;

    sizeInput.value = "";
    colorInput.value = "";

    setFormMessage("");

    if (typeof orderDialog.showModal === "function") {
      orderDialog.showModal();
    } else {
      orderDialog.setAttribute("open", "");
    }
  }


  async function createOrder(event) {
    event.preventDefault();

    const productId = Number(productInput.value);

    const product = allProducts.find(
      item => Number(item.id) === productId
    );

    if (!product) {
      setFormMessage(
        "Mahsulot topilmadi.",
        "error"
      );
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    const quantity =
      Math.max(
        1,
        Number(quantityInput.value || 1)
      );

    const size = sizeInput.value.trim();
    const color = colorInput.value.trim();

    if (!name || !phone) {
      setFormMessage(
        "Ism va telefon raqamini kiriting.",
        "error"
      );
      return;
    }

    if (quantity > Number(product.stock || 0)) {
      setFormMessage(
        "Omborda yetarli mahsulot yo‘q.",
        "error"
      );
      return;
    }

    submitOrder.disabled = true;
    submitOrder.textContent = "Yuborilmoqda...";

    setFormMessage("");

    try {
      const created = await supabaseRequest(
        "orders",
        {
          method: "POST",

          headers: {
            "Prefer": "return=representation"
          },

          body: JSON.stringify({
            name: name,
            phone: phone,
            product: product.name,
            product_id: product.id,
            quantity: quantity,
            size: size || null,
            color: color || null,
            status: "new",
            stock_adjusted: false
          })
        }
      );

      const order =
        Array.isArray(created)
          ? created[0]
          : created;

      if (!order?.id) {
        throw new Error(
          "Buyurtma yaratildi, lekin ID olinmadi."
        );
      }

      setFormMessage(
        `✅ Buyurtmangiz qabul qilindi! Buyurtma raqamingiz: #${order.id}`,
        "success"
      );

      const trackUrl =
        `./track.html?id=${encodeURIComponent(order.id)}&phone=${encodeURIComponent(phone)}`;

      const existingTrack =
        document.getElementById("quickTrackLink");

      if (existingTrack) {
        existingTrack.remove();
      }

      const trackLink =
        document.createElement("a");

      trackLink.id = "quickTrackLink";
      trackLink.href = trackUrl;

      trackLink.textContent =
        `📦 Buyurtma #${order.id} holatini kuzatish`;

      trackLink.style.display = "block";
      trackLink.style.marginTop = "10px";
      trackLink.style.padding = "12px";
      trackLink.style.textAlign = "center";
      trackLink.style.borderRadius = "12px";
      trackLink.style.background = "#f2edff";
      trackLink.style.color = "#6f35e8";
      trackLink.style.fontWeight = "900";

      formMessage.insertAdjacentElement(
        "afterend",
        trackLink
      );

      orderForm.reset();

      productInput.value = product.id;
      quantityInput.value = 1;

    } catch (error) {
      console.error(error);

      setFormMessage(
        error.message ||
        "Buyurtmani yuborishda xato.",
        "error"
      );

    } finally {
      submitOrder.disabled = false;
      submitOrder.textContent =
        "Buyurtma berish";
    }
  }


  function toggleFavorite(id) {
    const exists = favorites.includes(id);

    if (exists) {
      favorites = favorites.filter(
        item => item !== id
      );
    } else {
      favorites.push(id);
    }

    localStorage.setItem(
      "modex_favorites",
      JSON.stringify(favorites)
    );

    updateCounts();
    renderFavoriteDrawer();
  }


  function addToCart(id) {
    const product = allProducts.find(
      item => Number(item.id) === Number(id)
    );

    if (!product) {
      return;
    }

    const existing =
      cart.find(
        item => Number(item.id) === Number(id)
      );

    if (existing) {
      existing.quantity =
        Number(existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image:
          product.image_url ||
          product.image ||
          "",
        quantity: 1
      });
    }

    saveCart();
  }


  function saveCart() {
    localStorage.setItem(
      "modex_cart",
      JSON.stringify(cart)
    );

    updateCounts();
    renderCartDrawer();
  }


  function updateCounts() {
    favoriteCount.textContent =
      favorites.length;

    const cartQuantity =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 1),
        0
      );

    cartCount.textContent =
      cartQuantity;
  }


  function renderFavoriteDrawer() {
    if (!favoriteItems) {
      return;
    }

    const products =
      allProducts.filter(
        item => favorites.includes(item.id)
      );

    if (products.length === 0) {
      favoriteItems.innerHTML =
        "<p>Sevimlilar bo‘sh.</p>";
      return;
    }

    favoriteItems.innerHTML =
      products.map(product => `
        <div style="
          padding:10px 0;
          border-bottom:1px solid #eee;
        ">
          <strong>
            ${escapeHtml(product.name || "Mahsulot")}
          </strong>

          <div>
            ${money(product.price)}
          </div>
        </div>
      `).join("");
  }


  function renderCartDrawer() {
    if (!cartItems) {
      return;
    }

    if (cart.length === 0) {
      cartItems.innerHTML =
        "<p>Savat bo‘sh.</p>";

      cartTotal.textContent =
        "0 so‘m";

      return;
    }

    cartItems.innerHTML =
      cart.map(item => `
        <div style="
          padding:10px 0;
          border-bottom:1px solid #eee;
        ">
          <strong>
            ${escapeHtml(item.name || "Mahsulot")}
          </strong>

          <div>
            ${item.quantity} × ${money(item.price)}
          </div>

          <button
            type="button"
            data-remove-cart="${item.id}"
            style="margin-top:6px;"
          >
            Olib tashlash
          </button>
        </div>
      `).join("");

    const total =
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
          Number(item.quantity || 1),
        0
      );

    cartTotal.textContent =
      money(total);

    document
      .querySelectorAll("[data-remove-cart]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const id =
            Number(button.dataset.removeCart);

          cart =
            cart.filter(
              item =>
                Number(item.id) !== id
            );

          saveCart();
        });
      });
  }


  function openDrawer(drawer, overlay) {
    drawer?.classList.remove("hidden");
    overlay?.classList.remove("hidden");
  }


  function closeDrawer(drawer, overlay) {
    drawer?.classList.add("hidden");
    overlay?.classList.add("hidden");
  }


  async function createSupportRequest(event) {
    event.preventDefault();

    const name =
      supportName.value.trim();

    const phone =
      supportPhone.value.trim();

    const message =
      supportMessage.value.trim();

    if (!name || !phone || !message) {
      setSupportMessage(
        "Barcha maydonlarni to‘ldiring.",
        "error"
      );
      return;
    }

    setSupportMessage("Yuborilmoqda...");

    try {
      await supabaseRequest(
        "support_requests",
        {
          method: "POST",

          body: JSON.stringify({
            name,
            phone,
            message
          })
        }
      );

      supportForm.reset();

      setSupportMessage(
        "✅ Murojaatingiz yuborildi.",
        "success"
      );

    } catch (error) {
      console.error(error);

      setSupportMessage(
        error.message ||
        "Murojaatni yuborib bo‘lmadi.",
        "error"
      );
    }
  }


  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHtml(value);
  }


  searchInput?.addEventListener(
    "input",
    applyFilters
  );

  mobileSearchInput?.addEventListener(
    "input",
    applyFilters
  );

  categoryFilter?.addEventListener(
    "change",
    applyFilters
  );

  sortSelect?.addEventListener(
    "change",
    applyFilters
  );

  document
    .getElementById("searchBtn")
    ?.addEventListener(
      "click",
      applyFilters
    );

  document
    .getElementById("mobileSearchBtn")
    ?.addEventListener(
      "click",
      applyFilters
    );

  document
    .getElementById("allCategoriesBtn")
    ?.addEventListener(
      "click",
      () => {
        categoryFilter.value = "";
        applyFilters();
      }
    );


  closeDialog?.addEventListener(
    "click",
    () => orderDialog.close()
  );


  orderForm?.addEventListener(
    "submit",
    createOrder
  );


  supportForm?.addEventListener(
    "submit",
    createSupportRequest
  );


  favoritesBtn?.addEventListener(
    "click",
    () => {
      renderFavoriteDrawer();

      openDrawer(
        favoritesDrawer,
        favoritesOverlay
      );
    }
  );


  mobileFavoritesBtn?.addEventListener(
    "click",
    () => {
      renderFavoriteDrawer();

      openDrawer(
        favoritesDrawer,
        favoritesOverlay
      );
    }
  );


  cartBtn?.addEventListener(
    "click",
    () => {
      renderCartDrawer();

      openDrawer(
        cartDrawer,
        cartOverlay
      );
    }
  );


  mobileCartBtn?.addEventListener(
    "click",
    () => {
      renderCartDrawer();

      openDrawer(
        cartDrawer,
        cartOverlay
      );
    }
  );


  closeFavorites?.addEventListener(
    "click",
    () => {
      closeDrawer(
        favoritesDrawer,
        favoritesOverlay
      );
    }
  );


  favoritesOverlay?.addEventListener(
    "click",
    () => {
      closeDrawer(
        favoritesDrawer,
        favoritesOverlay
      );
    }
  );


  closeCart?.addEventListener(
    "click",
    () => {
      closeDrawer(
        cartDrawer,
        cartOverlay
      );
    }
  );


  cartOverlay?.addEventListener(
    "click",
    () => {
      closeDrawer(
        cartDrawer,
        cartOverlay
      );
    }
  );


  updateCounts();
  renderFavoriteDrawer();
  renderCartDrawer();

  loadProducts();

})();
