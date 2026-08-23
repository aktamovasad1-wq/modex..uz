(() => {
  "use strict";

  const config = window.MODEX_CONFIG || {};
  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  const $ = id => document.getElementById(id);

  /* =========================================================
     ELEMENTS
  ========================================================= */

  const productsGrid = $("productsGrid");
  const productCount = $("productCount");
  const emptyState = $("emptyState");

  const searchInput = $("searchInput");
  const mobileSearchInput = $("mobileSearchInput");

  const categoryButtons = $("categoryButtons");
  const categorySelect = $("categorySelect");
  const sortSelect = $("sortSelect");

  const favoritesBtn = $("favoritesBtn");
  const cartBtn = $("cartBtn");

  const mobileFavoritesBtn = $("mobileFavoritesBtn");
  const mobileCartBtn = $("mobileCartBtn");

  const favoritesDrawer = $("favoritesDrawer");
  const cartDrawer = $("cartDrawer");

  const closeFavorites = $("closeFavorites");
  const closeCart = $("closeCart");

  const favoritesList = $("favoritesList");
  const cartList = $("cartList");

  const orderDialog = $("orderDialog");
  const closeDialog = $("closeDialog");
  const orderForm = $("orderForm");

  const selectedProductTitle = $("selectedProductTitle");
  const productInput = $("productInput");
  const productIdInput = $("productIdInput");

  const nameInput = $("nameInput");
  const phoneInput = $("phoneInput");
  const quantityInput = $("quantityInput");
  const sizeInput = $("sizeInput");
  const colorInput = $("colorInput");

  const submitOrder = $("submitOrder");
  const formMessage = $("formMessage");
  const quickTrackLink = $("quickTrackLink");

  const supportForm = $("supportForm");
  const supportName = $("supportName");
  const supportPhone = $("supportPhone");
  const supportMessage = $("supportMessage");
  const supportFormMessage = $("supportFormMessage");

  /* =========================================================
     STATE
  ========================================================= */

  let allProducts = [];
  let activeCategory = "all";
  let selectedProduct = null;

  let favorites =
    JSON.parse(
      localStorage.getItem("modex_favorites") || "[]"
    );

  let cart =
    JSON.parse(
      localStorage.getItem("modex_cart") || "[]"
    );

  /* =========================================================
     HELPERS
  ========================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPrice(value) {
    return (
      new Intl.NumberFormat("uz-UZ")
        .format(Number(value || 0)) +
      " so‘m"
    );
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function saveFavorites() {
    localStorage.setItem(
      "modex_favorites",
      JSON.stringify(favorites)
    );
  }

  function saveCart() {
    localStorage.setItem(
      "modex_cart",
      JSON.stringify(cart)
    );
  }

  function showMessage(
    element,
    text,
    type = ""
  ) {
    if (!element) return;

    element.textContent = text;

    element.style.color =
      type === "error"
        ? "#d7353c"
        : type === "success"
          ? "#159759"
          : "#777784";
  }

  /* =========================================================
     API
  ========================================================= */

  async function apiRequest(
    path,
    options = {}
  ) {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY
    ) {
      throw new Error(
        "Supabase config topilmadi."
      );
    }

    const response =
      await fetch(
        `${SUPABASE_URL}/${path}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${SUPABASE_KEY}`,

            ...(options.headers || {})
          }
        }
      );

    if (!response.ok) {
      let message =
        `Server xatosi (${response.status})`;

      try {
        const data =
          await response.json();

        message =
          data?.message ||
          data?.error ||
          message;

      } catch (_) {}

      throw new Error(message);
    }

    if (
      response.status === 204
    ) {
      return null;
    }

    const text =
      await response.text();

    return text
      ? JSON.parse(text)
      : null;
  }

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  async function loadProducts() {
    if (!productsGrid) return;

    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:35px;
        color:#777784;
      ">
        Mahsulotlar yuklanmoqda...
      </div>
    `;

    try {
      const data =
        await apiRequest(
          "rest/v1/products?select=*&active=eq.true&order=id.desc",
          {
            method: "GET"
          }
        );

      allProducts =
        Array.isArray(data)
          ? data
          : [];

      renderCategories();
      renderProducts();

    } catch (error) {
      console.error(error);

      productsGrid.innerHTML = `
        <div style="
          grid-column:1/-1;
          text-align:center;
          padding:35px;
          color:#d7353c;
        ">
          ${escapeHtml(
            error.message ||
            "Mahsulotlarni yuklab bo‘lmadi."
          )}
        </div>
      `;
    }
  }

  /* =========================================================
     CATEGORIES
  ========================================================= */

  function getCategories() {
    const values =
      allProducts
        .map(
          product =>
            String(
              product.category || ""
            ).trim()
        )
        .filter(Boolean);

    return [
      ...new Set(values)
    ];
  }

  function renderCategories() {
    const categories =
      getCategories();

    if (categoryButtons) {
      categoryButtons.innerHTML = `
        <button
          class="category-btn ${
            activeCategory === "all"
              ? "active"
              : ""
          }"
          type="button"
          data-category="all"
        >
          Barchasi
        </button>
      `;

      categories.forEach(category => {
        const button =
          document.createElement(
            "button"
          );

        button.type = "button";
        button.className =
          "category-btn";

        if (
          activeCategory === category
        ) {
          button.classList.add(
            "active"
          );
        }

        button.dataset.category =
          category;

        button.textContent =
          category;

        categoryButtons
          .appendChild(button);
      });

      categoryButtons
        .querySelectorAll(
          ".category-btn"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              setCategory(
                button.dataset.category
              );
            }
          );
        });
    }

    if (categorySelect) {
      categorySelect.innerHTML = `
        <option value="all">
          Barcha kategoriyalar
        </option>
      `;

      categories.forEach(category => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          category;

        option.textContent =
          category;

        categorySelect
          .appendChild(option);
      });

      categorySelect.value =
        activeCategory;
    }
  }

  function setCategory(category) {
    activeCategory =
      category || "all";

    if (categorySelect) {
      categorySelect.value =
        activeCategory;
    }

    document
      .querySelectorAll(
        ".category-btn"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.category ===
            activeCategory
        );
      });

    renderProducts();
  }

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  function getSearchQuery() {
    return normalizeText(
      searchInput?.value ||
      mobileSearchInput?.value ||
      ""
    );
  }

  function getFilteredProducts() {
    let list =
      [...allProducts];

    if (
      activeCategory !== "all"
    ) {
      list =
        list.filter(
          product =>
            product.category ===
            activeCategory
        );
    }

    const query =
      getSearchQuery();

    if (query) {
      list =
        list.filter(product => {
          const text =
            normalizeText(`
              ${product.name || ""}
              ${product.category || ""}
              ${product.description || ""}
            `);

          return text.includes(
            query
          );
        });
    }

    const sort =
      sortSelect?.value ||
      "newest";

    if (sort === "price-asc") {
      list.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );
    }

    if (sort === "price-desc") {
      list.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );
    }

    if (sort === "newest") {
      list.sort(
        (a, b) =>
          Number(b.id || 0) -
          Number(a.id || 0)
      );
    }

    return list;
  }

  /* =========================================================
     PRODUCTS
  ========================================================= */

  function renderProducts() {
    if (!productsGrid) return;

    const list =
      getFilteredProducts();

    productsGrid.innerHTML =
      "";

    if (productCount) {
      productCount.textContent =
        list.length;
    }

    if (!list.length) {
      emptyState
        ?.classList.remove("hidden");

      return;
    }

    emptyState
      ?.classList.add("hidden");

    list.forEach(product => {
      const card =
        document.createElement(
          "article"
        );

      card.className =
        "product-card";

      const image =
        product.image_url ||
        product.image ||
        "";

      const oldPrice =
        Number(
          product.old_price || 0
        );

      const price =
        Number(
          product.price || 0
        );

      const stock =
        Number(
          product.stock || 0
        );

      const discount =
        Number(
          product.discount_percent || 0
        );

      const isFavorite =
        favorites.includes(
          Number(product.id)
        );

      card.innerHTML = `

        <div class="product-image-wrap">

          ${
            image
              ? `
                <img
                  class="product-image"
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(product.name)}"
                  loading="lazy"
                >
              `
              : `
                <div style="
                  width:100%;
                  height:100%;
                  display:grid;
                  place-items:center;
                  color:#aaa;
                ">
                  Rasm yo‘q
                </div>
              `
          }

          ${
            discount > 0
              ? `
                <span class="product-discount">
                  -${discount}%
                </span>
              `
              : ""
          }

          <button
            type="button"
            class="product-favorite"
            data-favorite="${product.id}"
            aria-label="Sevimlilarga qo‘shish"
          >
            ${isFavorite ? "♥" : "♡"}
          </button>

        </div>


        <div class="product-body">

          <span class="product-category">
            ${escapeHtml(
              product.category ||
              "Mahsulot"
            )}
          </span>


          <h3 class="product-name">
            ${escapeHtml(
              product.name ||
              "Mahsulot"
            )}
          </h3>


          ${
            oldPrice > price &&
            oldPrice > 0

              ? `
                <span class="product-old-price">
                  ${formatPrice(oldPrice)}
                </span>
              `

              : ""
          }


          <strong class="product-price">
            ${formatPrice(price)}
          </strong>


          <div class="product-stock">
            ${
              stock > 0
                ? `Omborda: ${stock} dona`
                : "Tugagan"
            }
          </div>


          <div class="product-actions">

            <button
              class="product-buy-btn"
              type="button"
              data-buy="${product.id}"
              ${stock <= 0 ? "disabled" : ""}
            >
              ${
                stock > 0
                  ? "Buyurtma berish"
                  : "Tugagan"
              }
            </button>


            <button
              class="product-cart-btn"
              type="button"
              data-cart="${product.id}"
              ${stock <= 0 ? "disabled" : ""}
            >
              🛒
            </button>

          </div>

        </div>
      `;

      productsGrid
        .appendChild(card);
    });

    attachProductEvents();
  }

  function attachProductEvents() {
    document
      .querySelectorAll(
        "[data-buy]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            openOrderDialog(
              Number(
                button.dataset.buy
              )
            );
          }
        );
      });

    document
      .querySelectorAll(
        "[data-favorite]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            toggleFavorite(
              Number(
                button.dataset.favorite
              )
            );
          }
        );
      });

    document
      .querySelectorAll(
        "[data-cart]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            addToCart(
              Number(
                button.dataset.cart
              )
            );
          }
        );
      });
  }

  /* =========================================================
     FAVORITES
  ========================================================= */

  function toggleFavorite(id) {
    if (
      favorites.includes(id)
    ) {
      favorites =
        favorites.filter(
          item =>
            item !== id
        );

    } else {
      favorites.push(id);
    }

    saveFavorites();
    renderProducts();
    renderFavorites();
  }

  function renderFavorites() {
    if (!favoritesList) return;

    const list =
      allProducts.filter(
        product =>
          favorites.includes(
            Number(product.id)
          )
      );

    favoritesList.innerHTML =
      "";

    if (!list.length) {
      favoritesList.innerHTML = `
        <p style="color:#777784;">
          Sevimli mahsulotlar yo‘q.
        </p>
      `;

      return;
    }

    list.forEach(product => {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "drawer-item";

      const image =
        product.image_url ||
        product.image ||
        "";

      item.innerHTML = `
        ${
          image
            ? `
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name)}"
              >
            `
            : ""
        }

        <div style="flex:1;">

          <strong>
            ${escapeHtml(product.name)}
          </strong>

          <p style="
            margin:5px 0;
            font-size:12px;
          ">
            ${formatPrice(product.price)}
          </p>

          <button
            type="button"
            data-favorite-buy="${product.id}"
          >
            Buyurtma
          </button>

        </div>
      `;

      favoritesList
        .appendChild(item);
    });

    favoritesList
      .querySelectorAll(
        "[data-favorite-buy]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            closeFavoritesDrawer();

            openOrderDialog(
              Number(
                button.dataset.favoriteBuy
              )
            );
          }
        );
      });
  }

  function openFavoritesDrawer() {
    renderFavorites();

    favoritesDrawer
      ?.classList.remove("hidden");
  }

  function closeFavoritesDrawer() {
    favoritesDrawer
      ?.classList.add("hidden");
  }

  /* =========================================================
     CART
  ========================================================= */

  function addToCart(id) {
    const existing =
      cart.find(
        item =>
          Number(item.product_id) === id
      );

    if (existing) {
      existing.quantity =
        Number(existing.quantity || 1) + 1;

    } else {
      cart.push({
        product_id: id,
        quantity: 1
      });
    }

    saveCart();
    renderCart();
    openCartDrawer();
  }

  function removeFromCart(id) {
    cart =
      cart.filter(
        item =>
          Number(item.product_id) !== id
      );

    saveCart();
    renderCart();
  }

  function renderCart() {
    if (!cartList) return;

    cartList.innerHTML =
      "";

    if (!cart.length) {
      cartList.innerHTML = `
        <p style="color:#777784;">
          Savat bo‘sh.
        </p>
      `;

      return;
    }

    cart.forEach(cartItem => {
      const product =
        allProducts.find(
          item =>
            Number(item.id) ===
            Number(cartItem.product_id)
        );

      if (!product) {
        return;
      }

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "drawer-item";

      const image =
        product.image_url ||
        product.image ||
        "";

      item.innerHTML = `
        ${
          image
            ? `
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name)}"
              >
            `
            : ""
        }

        <div style="flex:1;">

          <strong>
            ${escapeHtml(product.name)}
          </strong>

          <p style="
            margin:5px 0;
            font-size:12px;
          ">
            ${cartItem.quantity} dona
          </p>

          <p style="
            margin:5px 0;
            font-weight:850;
          ">
            ${formatPrice(
              Number(product.price || 0) *
              Number(cartItem.quantity || 1)
            )}
          </p>

          <button
            type="button"
            data-cart-buy="${product.id}"
          >
            Buyurtma
          </button>

          <button
            type="button"
            data-cart-remove="${product.id}"
          >
            O‘chirish
          </button>

        </div>
      `;

      cartList
        .appendChild(item);
    });

    cartList
      .querySelectorAll(
        "[data-cart-buy]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const id =
              Number(
                button.dataset.cartBuy
              );

            const cartItem =
              cart.find(
                item =>
                  Number(item.product_id) === id
              );

            closeCartDrawer();

            openOrderDialog(
              id,
              Number(
                cartItem?.quantity || 1
              )
            );
          }
        );
      });

    cartList
      .querySelectorAll(
        "[data-cart-remove]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            removeFromCart(
              Number(
                button.dataset.cartRemove
              )
            );
          }
        );
      });
  }

  function openCartDrawer() {
    renderCart();

    cartDrawer
      ?.classList.remove("hidden");
  }

  function closeCartDrawer() {
    cartDrawer
      ?.classList.add("hidden");
  }

  /* =========================================================
     QUICK ORDER
  ========================================================= */

  function openOrderDialog(
    productId,
    quantity = 1
  ) {
    const product =
      allProducts.find(
        item =>
          Number(item.id) ===
          Number(productId)
      );

    if (!product) {
      return;
    }

    selectedProduct =
      product;

    if (selectedProductTitle) {
      selectedProductTitle.textContent =
        product.name;
    }

    if (productInput) {
      productInput.value =
        product.name || "";
    }

    if (productIdInput) {
      productIdInput.value =
        product.id;
    }

    if (quantityInput) {
      quantityInput.value =
        Math.max(
          1,
          Number(quantity || 1)
        );
    }

    if (sizeInput) {
      sizeInput.value = "";
    }

    if (colorInput) {
      colorInput.value = "";
    }

    showMessage(
      formMessage,
      ""
    );

    quickTrackLink
      ?.classList.add("hidden");

    if (
      typeof orderDialog?.showModal ===
      "function"
    ) {
      orderDialog.showModal();

    } else {
      orderDialog?.setAttribute(
        "open",
        ""
      );
    }
  }

  function closeOrderDialog() {
    if (
      typeof orderDialog?.close ===
      "function"
    ) {
      orderDialog.close();

    } else {
      orderDialog?.removeAttribute(
        "open"
      );
    }

    selectedProduct = null;
  }

  async function submitOrderForm(
    event
  ) {
    event.preventDefault();

    if (!selectedProduct) {
      showMessage(
        formMessage,
        "Mahsulot tanlanmagan.",
        "error"
      );

      return;
    }

    const name =
      nameInput?.value.trim();

    const phone =
      phoneInput?.value.trim();

    const quantity =
      Math.max(
        1,
        Number(
          quantityInput?.value || 1
        )
      );

    const size =
      sizeInput?.value.trim() ||
      null;

    const color =
      colorInput?.value.trim() ||
      null;

    if (!name) {
      showMessage(
        formMessage,
        "Ismingizni kiriting.",
        "error"
      );

      return;
    }

    if (!phone) {
      showMessage(
        formMessage,
        "Telefon raqamingizni kiriting.",
        "error"
      );

      return;
    }

    if (
      quantity >
      Number(selectedProduct.stock || 0)
    ) {
      showMessage(
        formMessage,
        "Omborda buncha mahsulot yo‘q.",
        "error"
      );

      return;
    }

    if (submitOrder) {
      submitOrder.disabled =
        true;
    }

    showMessage(
      formMessage,
      "Buyurtma yuborilmoqda..."
    );

    try {
      const payload = {
        name,
        phone,
        product:
          selectedProduct.name,

        product_id:
          selectedProduct.id,

        quantity,
        size,
        color,

        status:
          "new",

        stock_adjusted:
          false
      };

      const data =
        await apiRequest(
          "rest/v1/orders?select=*",
          {
            method: "POST",

            headers: {
              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      const order =
        Array.isArray(data)
          ? data[0]
          : null;

      if (!order?.id) {
        throw new Error(
          "Buyurtma ID olinmadi."
        );
      }

      showMessage(
        formMessage,
        `✅ Buyurtma qabul qilindi. ID: #${order.id}`,
        "success"
      );

      if (quickTrackLink) {
        quickTrackLink.href =
          `./track.html?id=${encodeURIComponent(order.id)}&phone=${encodeURIComponent(phone)}`;

        quickTrackLink
          .classList.remove(
            "hidden"
          );
      }

      cart =
        cart.filter(
          item =>
            Number(item.product_id) !==
            Number(
              selectedProduct.id
            )
        );

      saveCart();

    } catch (error) {
      console.error(error);

      showMessage(
        formMessage,
        error.message ||
        "Buyurtma yuborilmadi.",
        "error"
      );

    } finally {
      if (submitOrder) {
        submitOrder.disabled =
          false;
      }
    }
  }

  /* =========================================================
     SUPPORT
  ========================================================= */

  async function submitSupport(
    event
  ) {
    event.preventDefault();

    const name =
      supportName?.value.trim() ||
      null;

    const phone =
      supportPhone?.value.trim();

    const messageText =
      supportMessage?.value.trim() ||
      null;

    if (!phone) {
      showMessage(
        supportFormMessage,
        "Telefon raqamingizni kiriting.",
        "error"
      );

      return;
    }

    showMessage(
      supportFormMessage,
      "Yuborilmoqda..."
    );

    try {
      await apiRequest(
        "rest/v1/support_requests",
        {
          method: "POST",

          headers: {
            Prefer:
              "return=minimal"
          },

          body:
            JSON.stringify({
              name,
              phone,
              message:
                messageText
            })
        }
      );

      supportForm?.reset();

      showMessage(
        supportFormMessage,
        "✅ So‘rov yuborildi.",
        "success"
      );

    } catch (error) {
      console.error(error);

      showMessage(
        supportFormMessage,
        error.message ||
        "So‘rov yuborilmadi.",
        "error"
      );
    }
  }

  /* =========================================================
     SEARCH SYNC
  ========================================================= */

  function handleDesktopSearch() {
    if (
      mobileSearchInput
    ) {
      mobileSearchInput.value =
        searchInput?.value || "";
    }

    renderProducts();
  }

  function handleMobileSearch() {
    if (
      searchInput
    ) {
      searchInput.value =
        mobileSearchInput?.value || "";
    }

    renderProducts();
  }

  /* =========================================================
     EVENTS
  ========================================================= */

  searchInput
    ?.addEventListener(
      "input",
      handleDesktopSearch
    );

  mobileSearchInput
    ?.addEventListener(
      "input",
      handleMobileSearch
    );

  categorySelect
    ?.addEventListener(
      "change",
      () => {
        setCategory(
          categorySelect.value
        );
      }
    );

  sortSelect
    ?.addEventListener(
      "change",
      renderProducts
    );

  favoritesBtn
    ?.addEventListener(
      "click",
      openFavoritesDrawer
    );

  mobileFavoritesBtn
    ?.addEventListener(
      "click",
      openFavoritesDrawer
    );

  cartBtn
    ?.addEventListener(
      "click",
      openCartDrawer
    );

  mobileCartBtn
    ?.addEventListener(
      "click",
      openCartDrawer
    );

  closeFavorites
    ?.addEventListener(
      "click",
      closeFavoritesDrawer
    );

  closeCart
    ?.addEventListener(
      "click",
      closeCartDrawer
    );

  closeDialog
    ?.addEventListener(
      "click",
      closeOrderDialog
    );

  orderForm
    ?.addEventListener(
      "submit",
      submitOrderForm
    );

  supportForm
    ?.addEventListener(
      "submit",
      submitSupport
    );

  /* =========================================================
     INIT
  ========================================================= */

  async function init() {
    renderFavorites();
    renderCart();

    await loadProducts();
  }

  init();

})();
