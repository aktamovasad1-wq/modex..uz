(() => {
  "use strict";

  /* =========================================================
     MODEX.UZ — ADMIN PANEL
  ========================================================= */

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  const $ = id => document.getElementById(id);


  /* =========================================================
     STATE
  ========================================================= */

  let currentUser = null;
  let currentProfile = null;

  let allProducts = [];
  let allOrders = [];
  let allProfiles = [];
  let allSupport = [];
  let allActivity = [];


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const adminLoginView = $("adminLoginView");
  const adminView = $("adminView");

  const adminLoginForm = $("adminLoginForm");
  const adminEmail = $("adminEmail");
  const adminPassword = $("adminPassword");
  const adminLoginMessage = $("adminLoginMessage");

  const adminUserName = $("adminUserName");
  const adminRefreshBtn = $("adminRefreshBtn");
  const adminLogoutBtn = $("adminLogoutBtn");


  /* STATS */

  const adminProductCount = $("adminProductCount");
  const adminOrderCount = $("adminOrderCount");
  const adminNewOrderCount = $("adminNewOrderCount");
  const adminOperatorCount = $("adminOperatorCount");

  const adminConfirmedCount = $("adminConfirmedCount");
  const adminDeliveryCount = $("adminDeliveryCount");
  const adminDoneCount = $("adminDoneCount");
  const adminCancelledCount = $("adminCancelledCount");


  /* DAILY OPERATOR */

  const todayOperatorsTotal = $("todayOperatorsTotal");
  const operatorDailyStats = $("operatorDailyStats");


  /* PRODUCTS */

  const productForm = $("productForm");

  const pId = $("pId");
  const pName = $("pName");
  const pCategory = $("pCategory");
  const pPrice = $("pPrice");
  const pOldPrice = $("pOldPrice");
  const pDiscount = $("pDiscount");
  const pStock = $("pStock");
  const pDescription = $("pDescription");
  const pActive = $("pActive");

  const productSaveBtn = $("productSaveBtn");
  const productCancelBtn = $("productCancelBtn");
  const productMessage = $("productMessage");

  const adminProducts = $("adminProducts");


  /* OPERATORS */

  const operatorCreateForm = $("operatorCreateForm");

  const newOperatorName = $("newOperatorName");
  const newOperatorEmail = $("newOperatorEmail");
  const newOperatorPassword = $("newOperatorPassword");

  const operatorCreateMessage = $("operatorCreateMessage");
  const adminOperators = $("adminOperators");


  /* ORDERS */

  const adminOrderSearch = $("adminOrderSearch");
  const adminOrderFilter = $("adminOrderFilter");

  const adminOrders = $("adminOrders");
  const adminMobileOrders = $("adminMobileOrders");


  /* SUPPORT */

  const adminSupport = $("adminSupport");


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


  function formatDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "uz-UZ",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }


  function isToday(value) {

    if (!value) return false;

    const date = new Date(value);
    const now = new Date();

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }


  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }


  function showMessage(
    element,
    text,
    type = ""
  ) {

    if (!element) return;

    element.textContent = text;

    element.className =
      "admin-message";

    if (type) {
      element.classList.add(type);
    }
  }


  /* =========================================================
     API
  ========================================================= */

  async function apiRequest(
    path,
    options = {},
    token = SUPABASE_KEY
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
              `Bearer ${token}`,

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
          data?.error_description ||
          data?.error ||
          message;

      } catch (_) {}


      throw new Error(message);
    }


    if (response.status === 204) {
      return null;
    }


    const text =
      await response.text();


    if (!text) {
      return null;
    }


    return JSON.parse(text);
  }


  /* =========================================================
     SESSION
  ========================================================= */

  function saveSession(session) {

    if (!session?.access_token) {
      return;
    }

    sessionStorage.setItem(
      "modex_admin_token",
      session.access_token
    );
  }


  function getToken() {

    return sessionStorage.getItem(
      "modex_admin_token"
    );
  }


  function clearSession() {

    sessionStorage.removeItem(
      "modex_admin_token"
    );

    currentUser = null;
    currentProfile = null;

    allProducts = [];
    allOrders = [];
    allProfiles = [];
    allSupport = [];
    allActivity = [];
  }


  /* =========================================================
     LOGIN
  ========================================================= */

  async function login(
    email,
    password
  ) {

    const data =
      await apiRequest(
        "auth/v1/token?grant_type=password",
        {
          method: "POST",

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );


    if (!data?.access_token) {
      throw new Error(
        "Login amalga oshmadi."
      );
    }


    saveSession(data);
  }


  async function loadCurrentUser() {

    const token = getToken();


    const user =
      await apiRequest(
        "auth/v1/user",
        {
          method: "GET"
        },
        token
      );


    if (!user?.id) {
      throw new Error(
        "Admin aniqlanmadi."
      );
    }


    currentUser = user;
  }


  async function loadAdminProfile() {

    const data =
      await apiRequest(
        `rest/v1/profiles?id=eq.${currentUser.id}&select=*`,
        {
          method: "GET"
        },
        getToken()
      );


    const profile =
      Array.isArray(data)
        ? data[0]
        : null;


    if (!profile) {
      throw new Error(
        "Admin profili topilmadi."
      );
    }


    if (profile.role !== "admin") {
      throw new Error(
        "Bu hisob admin emas."
      );
    }


    if (profile.active !== true) {
      throw new Error(
        "Admin bloklangan."
      );
    }


    currentProfile = profile;
  }


  /* =========================================================
     OPEN ADMIN
  ========================================================= */

  async function openAdminPanel() {

    await loadCurrentUser();

    await loadAdminProfile();


    adminLoginView
      ?.classList.add("hidden");


    adminView
      ?.classList.remove("hidden");


    if (adminUserName) {

      adminUserName.textContent =
        currentProfile.name ||
        currentUser.email ||
        "Admin";
    }


    await loadEverything();
  }


  /* =========================================================
     LOAD EVERYTHING
  ========================================================= */

  async function loadEverything() {

    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadProfiles(),
      loadActivity(),
      loadSupport()
    ]);


    renderProducts();
    renderOrders();
    renderOperators();
    renderDailyOperatorStats();
    renderSupport();

    updateGlobalStats();
  }


  /* =========================================================
     PRODUCTS
  ========================================================= */

  async function loadProducts() {

    const data =
      await apiRequest(
        "rest/v1/products?select=*&order=id.desc",
        {
          method: "GET"
        },
        getToken()
      );


    allProducts =
      Array.isArray(data)
        ? data
        : [];
  }


  function renderProducts() {

    if (!adminProducts) {
      return;
    }


    adminProducts.innerHTML = "";


    if (!allProducts.length) {

      adminProducts.innerHTML = `
        <p>Mahsulotlar yo‘q.</p>
      `;

      return;
    }


    allProducts.forEach(product => {

      const stock =
        Number(product.stock || 0);


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-product-card";


      if (stock === 0) {

        card.classList.add(
          "stock-zero"
        );

      } else if (stock <= 3) {

        card.classList.add(
          "stock-low"
        );
      }


      const image =
        product.image_url ||
        product.image ||
        "";


      let stockWarning = "";


      if (stock === 0) {

        stockWarning = `
          <div class="stock-out">
            ❌ TUGAGAN — 0 dona
          </div>
        `;

      } else if (stock <= 3) {

        stockWarning = `
          <div class="low-stock-warning">
            ⚠️ KAM QOLDI — ${stock} dona
          </div>
        `;

      } else if (stock <= 10) {

        stockWarning = `
          <div class="stock-watch">
            👀 NAZORAT — ${stock} dona
          </div>
        `;
      }


      card.innerHTML = `

        ${
          image
            ? `
              <img
                class="admin-product-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name)}"
              >
            `
            : ""
        }


        <div class="admin-product-body">

          <strong>
            ${escapeHtml(product.name)}
          </strong>


          <span>
            ${escapeHtml(
              product.category || "—"
            )}
          </span>


          <p>
            ${formatPrice(product.price)}
          </p>


          <small>
            Omborda:
            <b>${stock} dona</b>
          </small>


          ${stockWarning}


          <div class="admin-product-actions">

            <button
              type="button"
              data-edit-product="${product.id}"
            >
              ✏️ Tahrirlash
            </button>


            <button
              type="button"
              data-delete-product="${product.id}"
            >
              🗑 O‘chirish
            </button>

          </div>

        </div>
      `;


      adminProducts.appendChild(
        card
      );
    });


    document
      .querySelectorAll(
        "[data-edit-product]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            editProduct(
              Number(
                button.dataset.editProduct
              )
            );
          }
        );
      });


    document
      .querySelectorAll(
        "[data-delete-product]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            deleteProduct(
              Number(
                button.dataset.deleteProduct
              )
            );
          }
        );
      });
  }


  /* =========================================================
     PRODUCT FORM
  ========================================================= */

  function resetProductForm() {

    productForm?.reset();


    if (pId) {
      pId.value = "";
    }


    if (pActive) {
      pActive.checked = true;
    }


    if (productSaveBtn) {

      productSaveBtn.textContent =
        "Mahsulot qo‘shish";
    }
  }


  function editProduct(id) {

    const product =
      allProducts.find(
        item =>
          Number(item.id) === id
      );


    if (!product) {
      return;
    }


    pId.value = product.id;
    pName.value = product.name || "";
    pCategory.value = product.category || "";
    pPrice.value = product.price || "";
    pOldPrice.value = product.old_price || "";
    pDiscount.value = product.discount_percent || 0;
    pStock.value = product.stock || 0;
    pDescription.value = product.description || "";

    if (pActive) {
      pActive.checked =
        product.active !== false;
    }


    productSaveBtn.textContent =
      "O‘zgarishni saqlash";


    productForm?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  async function saveProduct(event) {

    event.preventDefault();


    const id =
      Number(pId?.value || 0);


    const payload = {

      name:
        pName?.value.trim(),

      category:
        pCategory?.value.trim() ||
        null,

      price:
        Number(
          pPrice?.value || 0
        ),

      old_price:
        pOldPrice?.value
          ? Number(pOldPrice.value)
          : null,

      discount_percent:
        Number(
          pDiscount?.value || 0
        ),

      stock:
        Math.max(
          0,
          Number(pStock?.value || 0)
        ),

      description:
        pDescription?.value.trim() ||
        null,

      active:
        pActive
          ? pActive.checked
          : true
    };


    if (!payload.name) {

      showMessage(
        productMessage,
        "Mahsulot nomini yozing.",
        "error"
      );

      return;
    }


    showMessage(
      productMessage,
      "Saqlanmoqda..."
    );


    try {

      if (id) {

        await apiRequest(
          `rest/v1/products?id=eq.${id}`,
          {
            method: "PATCH",

            headers: {
              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(
                payload
              )
          },
          getToken()
        );

      } else {

        await apiRequest(
          "rest/v1/products",
          {
            method: "POST",

            headers: {
              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(
                payload
              )
          },
          getToken()
        );
      }


      await loadProducts();

      renderProducts();

      updateGlobalStats();

      resetProductForm();


      showMessage(
        productMessage,
        "✅ Mahsulot saqlandi.",
        "success"
      );


    } catch (error) {

      console.error(error);

      showMessage(
        productMessage,
        error.message,
        "error"
      );
    }
  }


  async function deleteProduct(id) {

    const product =
      allProducts.find(
        item =>
          Number(item.id) === id
      );


    if (!product) return;


    if (
      !confirm(
        `${product.name} o‘chirilsinmi?`
      )
    ) {
      return;
    }


    try {

      await apiRequest(
        `rest/v1/products?id=eq.${id}`,
        {
          method: "DELETE"
        },
        getToken()
      );


      await loadProducts();

      renderProducts();

      updateGlobalStats();


    } catch (error) {

      alert(error.message);
    }
  }


  /* =========================================================
     ORDERS
  ========================================================= */

  async function loadOrders() {

    const data =
      await apiRequest(
        "rest/v1/orders?select=*&order=id.desc",
        {
          method: "GET"
        },
        getToken()
      );


    allOrders =
      Array.isArray(data)
        ? data
        : [];
  }


  function statusName(status) {

    const map = {

      new:
        "🔴 Yangi",

      talked:
        "🟠 Gaplashildi",

      confirmed:
        "🔵 Qadoqlanmoqda",

      delivery:
        "🟣 Yo‘lda",

      done:
        "🟢 Yetkazildi",

      cancelled:
        "⚪ Bekor"
    };


    return (
      map[status] ||
      status ||
      "—"
    );
  }


  function getFilteredOrders() {

    let list =
      [...allOrders];


    const status =
      adminOrderFilter?.value ||
      "all";


    if (status !== "all") {

      list =
        list.filter(
          order =>
            order.status === status
        );
    }


    const query =
      normalizeText(
        adminOrderSearch?.value
      );


    if (query) {

      list =
        list.filter(order => {

          const text =
            normalizeText(`
              ${order.id}
              ${order.name}
              ${order.surname}
              ${order.phone}
              ${order.product}
              ${order.region}
              ${order.address}
            `);


          return text.includes(
            query
          );
        });
    }


    return list;
  }


  function renderOrders() {

    const list =
      getFilteredOrders();


    if (adminOrders) {

      adminOrders.innerHTML = "";


      if (!list.length) {

        adminOrders.innerHTML = `
          <tr>
            <td colspan="9">
              Buyurtmalar yo‘q.
            </td>
          </tr>
        `;
      }


      list.forEach(order => {

        const row =
          document.createElement("tr");


        row.innerHTML = `

          <td>
            #${escapeHtml(order.id)}
          </td>

          <td>
            ${escapeHtml(order.name || "—")}
          </td>

          <td>
            ${escapeHtml(order.phone || "—")}
          </td>

          <td>
            ${escapeHtml(order.product || "—")}
          </td>

          <td>
            ${escapeHtml(order.quantity || 1)}
          </td>

          <td>
            ${statusName(order.status)}
          </td>

          <td>
            ${escapeHtml(order.region || "—")}
          </td>

          <td>
            ${formatDate(order.created_at)}
          </td>

          <td>

            <button
              type="button"
              data-delete-order="${order.id}"
            >
              O‘chirish
            </button>

          </td>
        `;


        adminOrders.appendChild(
          row
        );
      });
    }


    if (adminMobileOrders) {

      adminMobileOrders.innerHTML = "";


      list.forEach(order => {

        const card =
          document.createElement(
            "article"
          );


        card.className =
          "admin-mobile-order-card";


        card.innerHTML = `

          <strong>
            #${escapeHtml(order.id)}
            —
            ${escapeHtml(order.name || "Mijoz")}
          </strong>

          <p>
            ${escapeHtml(order.product || "Mahsulot")}
          </p>

          <span>
            ${statusName(order.status)}
          </span>

          <small>
            ${escapeHtml(order.phone || "—")}
          </small>

          <button
            type="button"
            data-delete-order="${order.id}"
          >
            O‘chirish
          </button>
        `;


        adminMobileOrders.appendChild(
          card
        );
      });
    }


    document
      .querySelectorAll(
        "[data-delete-order]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            deleteOrder(
              Number(
                button.dataset.deleteOrder
              )
            );
          }
        );
      });
  }


  async function deleteOrder(id) {

    const order =
      allOrders.find(
        item =>
          Number(item.id) === id
      );


    if (!order) return;


    if (
      !confirm(
        `Buyurtma #${id} o‘chirilsinmi?`
      )
    ) {
      return;
    }


    try {

      /*
        Agar stock kamaygan bo‘lsa,
        o‘chirishdan oldin stockni qaytaramiz.
      */

      if (
        order.stock_adjusted === true &&
        order.product_id
      ) {

        const product =
          allProducts.find(
            item =>
              Number(item.id) ===
              Number(order.product_id)
          );


        if (product) {

          const stock =
            Number(product.stock || 0) +
            Math.max(
              1,
              Number(order.quantity || 1)
            );


          await apiRequest(
            `rest/v1/products?id=eq.${product.id}`,
            {
              method: "PATCH",

              headers: {
                Prefer:
                  "return=minimal"
              },

              body:
                JSON.stringify({
                  stock
                })
            },
            getToken()
          );
        }
      }


      await apiRequest(
        `rest/v1/orders?id=eq.${id}`,
        {
          method: "DELETE"
        },
        getToken()
      );


      await Promise.all([
        loadOrders(),
        loadProducts(),
        loadActivity()
      ]);


      renderOrders();
      renderProducts();
      renderDailyOperatorStats();
      updateGlobalStats();


    } catch (error) {

      alert(error.message);
    }
  }


  /* =========================================================
     OPERATORS
  ========================================================= */

  async function loadProfiles() {

    const data =
      await apiRequest(
        "rest/v1/profiles?select=*&order=name.asc",
        {
          method: "GET"
        },
        getToken()
      );


    allProfiles =
      Array.isArray(data)
        ? data
        : [];
  }


  function renderOperators() {

    if (!adminOperators) {
      return;
    }


    const operators =
      allProfiles.filter(
        profile =>
          profile.role === "operator"
      );


    adminOperators.innerHTML = "";


    if (!operators.length) {

      adminOperators.innerHTML = `
        <p>Operator yo‘q.</p>
      `;

      return;
    }


    operators.forEach(operator => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-operator-card";


      card.innerHTML = `

        <strong>
          ${escapeHtml(
            operator.name ||
            "Operator"
          )}
        </strong>

        <span>
          ${
            operator.active
              ? "🟢 Faol"
              : "🔴 Bloklangan"
          }
        </span>
      `;


      adminOperators.appendChild(
        card
      );
    });
  }


  async function createOperator(event) {

    event.preventDefault();


    const name =
      newOperatorName?.value.trim();

    const email =
      newOperatorEmail?.value.trim();

    const password =
      newOperatorPassword?.value;


    if (
      !name ||
      !email ||
      !password
    ) {

      showMessage(
        operatorCreateMessage,
        "Barcha maydonni to‘ldiring.",
        "error"
      );

      return;
    }


    showMessage(
      operatorCreateMessage,
      "Operator yaratilmoqda..."
    );


    try {

      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/smart-endpoint`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              apikey:
                SUPABASE_KEY,

              Authorization:
                `Bearer ${getToken()}`
            },

            body:
              JSON.stringify({
                name,
                email,
                password
              })
          }
        );


      const data =
        await response.json()
          .catch(() => ({}));


      if (!response.ok) {

        throw new Error(
          data?.message ||
          data?.error ||
          "Operator yaratilmadi."
        );
      }


      operatorCreateForm.reset();


      await loadProfiles();

      renderOperators();

      updateGlobalStats();


      showMessage(
        operatorCreateMessage,
        "✅ Operator yaratildi.",
        "success"
      );


    } catch (error) {

      showMessage(
        operatorCreateMessage,
        error.message,
        "error"
      );
    }
  }


  /* =========================================================
     ACTIVITY
  ========================================================= */

  async function loadActivity() {

    const data =
      await apiRequest(
        "rest/v1/order_activity?select=*&order=created_at.desc",
        {
          method: "GET"
        },
        getToken()
      );


    allActivity =
      Array.isArray(data)
        ? data
        : [];
  }


  function renderDailyOperatorStats() {

    if (!operatorDailyStats) {
      return;
    }


    const today =
      allActivity.filter(
        item =>
          isToday(item.created_at)
      );


    if (todayOperatorsTotal) {

      todayOperatorsTotal.textContent =
        today.length;
    }


    const operators =
      allProfiles.filter(
        profile =>
          profile.role === "operator"
      );


    operatorDailyStats.innerHTML = "";


    operators.forEach(operator => {

      const activity =
        today.filter(
          item =>
            item.operator_id ===
            operator.id
        );


      const talked =
        activity.filter(
          item =>
            item.status === "talked"
        ).length;


      const confirmed =
        activity.filter(
          item =>
            item.status === "confirmed"
        ).length;


      const delivery =
        activity.filter(
          item =>
            item.status === "delivery"
        ).length;


      const done =
        activity.filter(
          item =>
            item.status === "done"
        ).length;


      const cancelled =
        activity.filter(
          item =>
            item.status === "cancelled"
        ).length;


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "operator-daily-card";


      card.innerHTML = `

        <div class="operator-daily-head">

          <div>

            <strong>
              ${escapeHtml(
                operator.name ||
                "Operator"
              )}
            </strong>

            <small>
              ${
                operator.active
                  ? "🟢 Faol"
                  : "🔴 Bloklangan"
              }
            </small>

          </div>


          <span class="operator-daily-number">
            ${activity.length}
          </span>

        </div>


        <div class="operator-daily-grid">

          <div>
            <span>🟠 Gaplashildi</span>
            <strong>${talked}</strong>
          </div>

          <div>
            <span>🔵 Qadoq</span>
            <strong>${confirmed}</strong>
          </div>

          <div>
            <span>🟣 Yo‘lda</span>
            <strong>${delivery}</strong>
          </div>

          <div>
            <span>🟢 Yetkazildi</span>
            <strong>${done}</strong>
          </div>

          <div>
            <span>⚪ Bekor</span>
            <strong>${cancelled}</strong>
          </div>

        </div>
      `;


      operatorDailyStats.appendChild(
        card
      );
    });
  }


  /* =========================================================
     SUPPORT
  ========================================================= */

  async function loadSupport() {

    try {

      const data =
        await apiRequest(
          "rest/v1/support_requests?select=*&order=id.desc",
          {
            method: "GET"
          },
          getToken()
        );


      allSupport =
        Array.isArray(data)
          ? data
          : [];


    } catch (error) {

      console.error(error);

      allSupport = [];
    }
  }


  function renderSupport() {

    if (!adminSupport) {
      return;
    }


    adminSupport.innerHTML = "";


    if (!allSupport.length) {

      adminSupport.innerHTML = `
        <p>So‘rovlar yo‘q.</p>
      `;

      return;
    }


    allSupport.forEach(item => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-support-card";


      card.innerHTML = `

        <strong>
          ${escapeHtml(
            item.name ||
            "Mijoz"
          )}
        </strong>

        <p>
          📞
          ${escapeHtml(
            item.phone ||
            "—"
          )}
        </p>

        <p>
          ${escapeHtml(
            item.message ||
            item.note ||
            "—"
          )}
        </p>

        <small>
          ${formatDate(
            item.created_at
          )}
        </small>
      `;


      adminSupport.appendChild(
        card
      );
    });
  }


  /* =========================================================
     GLOBAL STATS
  ========================================================= */

  function updateGlobalStats() {

    const operators =
      allProfiles.filter(
        item =>
          item.role === "operator"
      );


    if (adminProductCount) {

      adminProductCount.textContent =
        allProducts.length;
    }


    if (adminOrderCount) {

      adminOrderCount.textContent =
        allOrders.length;
    }


    if (adminNewOrderCount) {

      adminNewOrderCount.textContent =
        allOrders.filter(
          order =>
            order.status === "new"
        ).length;
    }


    if (adminOperatorCount) {

      adminOperatorCount.textContent =
        operators.length;
    }


    if (adminConfirmedCount) {

      adminConfirmedCount.textContent =
        allOrders.filter(
          order =>
            order.status === "confirmed"
        ).length;
    }


    if (adminDeliveryCount) {

      adminDeliveryCount.textContent =
        allOrders.filter(
          order =>
            order.status === "delivery"
        ).length;
    }


    if (adminDoneCount) {

      adminDoneCount.textContent =
        allOrders.filter(
          order =>
            order.status === "done"
        ).length;
    }


    if (adminCancelledCount) {

      adminCancelledCount.textContent =
        allOrders.filter(
          order =>
            order.status === "cancelled"
        ).length;
    }
  }


  /* =========================================================
     EVENTS
  ========================================================= */

  adminLoginForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        showMessage(
          adminLoginMessage,
          "Kirilmoqda..."
        );


        try {

          await login(
            adminEmail.value.trim(),
            adminPassword.value
          );


          await openAdminPanel();


          adminLoginForm.reset();


          showMessage(
            adminLoginMessage,
            ""
          );


        } catch (error) {

          clearSession();


          showMessage(
            adminLoginMessage,
            error.message,
            "error"
          );
        }
      }
    );


  adminLogoutBtn
    ?.addEventListener(
      "click",
      () => {

        clearSession();


        adminView
          ?.classList.add("hidden");


        adminLoginView
          ?.classList.remove("hidden");
      }
    );


  adminRefreshBtn
    ?.addEventListener(
      "click",
      async () => {

        adminRefreshBtn.disabled =
          true;


        try {

          await loadEverything();

        } catch (error) {

          alert(error.message);

        } finally {

          adminRefreshBtn.disabled =
            false;
        }
      }
    );


  productForm
    ?.addEventListener(
      "submit",
      saveProduct
    );


  productCancelBtn
    ?.addEventListener(
      "click",
      resetProductForm
    );


  operatorCreateForm
    ?.addEventListener(
      "submit",
      createOperator
    );


  adminOrderSearch
    ?.addEventListener(
      "input",
      renderOrders
    );


  adminOrderFilter
    ?.addEventListener(
      "change",
      renderOrders
    );


  /* =========================================================
     INIT
  ========================================================= */

  async function init() {

    const token =
      getToken();


    if (!token) {

      adminLoginView
        ?.classList.remove("hidden");


      adminView
        ?.classList.add("hidden");


      return;
    }


    try {

      await openAdminPanel();


    } catch (error) {

      console.error(error);


      clearSession();


      adminView
        ?.classList.add("hidden");


      adminLoginView
        ?.classList.remove("hidden");


      showMessage(
        adminLoginMessage,
        "Qayta login qiling.",
        "error"
      );
    }
  }


  init();

})();
