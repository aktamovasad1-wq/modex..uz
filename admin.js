(() => {
  "use strict";

  /* =========================================================
     MODEX.UZ — ADMIN PANEL
     PRODUCTS + ORDERS + OPERATORS + DAILY ACTIVITY
  ========================================================= */

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;


  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = id =>
    document.getElementById(id);


  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function formatPrice(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat(
      "uz-UZ"
    ).format(number) + " so‘m";
  }


  function formatDate(value) {
    if (!value) return "—";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const now =
      new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
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


  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }


  /* =========================================================
     DOM
  ========================================================= */

  const adminLoginView =
    $("adminLoginView");

  const adminView =
    $("adminView");

  const adminLoginForm =
    $("adminLoginForm");

  const adminEmail =
    $("adminEmail");

  const adminPassword =
    $("adminPassword");

  const adminLoginMessage =
    $("adminLoginMessage");

  const adminUserName =
    $("adminUserName");

  const adminRefreshBtn =
    $("adminRefreshBtn");

  const adminLogoutBtn =
    $("adminLogoutBtn");


  /* STATS */

  const adminProductCount =
    $("adminProductCount");

  const adminOrderCount =
    $("adminOrderCount");

  const adminNewOrderCount =
    $("adminNewOrderCount");

  const adminOperatorCount =
    $("adminOperatorCount");

  const adminConfirmedCount =
    $("adminConfirmedCount");

  const adminDeliveryCount =
    $("adminDeliveryCount");

  const adminDoneCount =
    $("adminDoneCount");

  const adminCancelledCount =
    $("adminCancelledCount");


  /* DAILY OPERATOR */

  const todayOperatorsTotal =
    $("todayOperatorsTotal");

  const operatorDailyStats =
    $("operatorDailyStats");


  /* PRODUCTS */

  const productForm =
    $("productForm");

  const pId =
    $("pId");

  const pName =
    $("pName");

  const pCategory =
    $("pCategory");

  const pPrice =
    $("pPrice");

  const pOldPrice =
    $("pOldPrice");

  const pDiscount =
    $("pDiscount");

  const pStock =
    $("pStock");

  const pDescription =
    $("pDescription");

  const pImage =
    $("pImage");

  const pActive =
    $("pActive");

  const productSaveBtn =
    $("productSaveBtn");

  const productCancelBtn =
    $("productCancelBtn");

  const productMessage =
    $("productMessage");

  const adminProducts =
    $("adminProducts");


  /* OPERATORS */

  const operatorCreateForm =
    $("operatorCreateForm");

  const newOperatorName =
    $("newOperatorName");

  const newOperatorEmail =
    $("newOperatorEmail");

  const newOperatorPassword =
    $("newOperatorPassword");

  const operatorCreateMessage =
    $("operatorCreateMessage");

  const adminOperators =
    $("adminOperators");


  /* ORDERS */

  const adminOrderSearch =
    $("adminOrderSearch");

  const adminOrderFilter =
    $("adminOrderFilter");

  const adminOrders =
    $("adminOrders");

  const adminMobileOrders =
    $("adminMobileOrders");

  const adminOrdersMessage =
    $("adminOrdersMessage");


  /* SUPPORT */

  const adminSupport =
    $("adminSupport");

  const adminSupportMessage =
    $("adminSupportMessage");


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

            "apikey":
              SUPABASE_KEY,

            "Authorization":
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

        if (data?.message) {
          message = data.message;
        }

        if (data?.details) {
          message +=
            ` — ${data.details}`;
        }

        if (data?.hint) {
          message +=
            ` — ${data.hint}`;
        }

        if (data?.error_description) {
          message =
            data.error_description;
        }
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

    sessionStorage.setItem(
      "modex_admin_refresh",
      session.refresh_token || ""
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

    sessionStorage.removeItem(
      "modex_admin_refresh"
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

    return data;
  }


  async function loadCurrentUser() {
    const token =
      getToken();

    if (!token) {
      throw new Error(
        "Sessiya topilmadi."
      );
    }

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
        "Foydalanuvchi aniqlanmadi."
      );
    }

    currentUser = user;

    return user;
  }


  async function loadAdminProfile() {
    const token =
      getToken();

    const data =
      await apiRequest(
        `rest/v1/profiles?id=eq.${encodeURIComponent(currentUser.id)}&select=*`,
        {
          method: "GET"
        },
        token
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

    if (
      profile.role !== "admin"
    ) {
      throw new Error(
        "Bu hisob admin emas."
      );
    }

    if (
      profile.active !== true
    ) {
      throw new Error(
        "Admin hisobi bloklangan."
      );
    }

    currentProfile =
      profile;

    return profile;
  }


  /* =========================================================
     OPEN PANEL
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
      loadSupport(),
      loadActivity()
    ]);

    updateGlobalStats();

    renderProducts();

    renderOrders();

    renderOperators();

    renderSupport();

    renderDailyOperatorStats();
  }


  /* =========================================================
     PRODUCTS
  ========================================================= */

  async function loadProducts() {
    const token =
      getToken();

    const data =
      await apiRequest(
        "rest/v1/products?select=*&order=id.desc",
        {
          method: "GET"
        },
        token
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

    adminProducts.innerHTML =
      "";

    if (
      allProducts.length === 0
    ) {
      adminProducts.innerHTML = `
        <p>Mahsulotlar yo‘q.</p>
      `;

      return;
    }

    allProducts.forEach(product => {
      const card =
        document.createElement("article");

      card.className =
        "admin-product-card";

      const image =
        product.image_url ||
        product.image ||
        "";

      card.innerHTML = `
        ${
          image
            ? `
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name)}"
                class="admin-product-image"
              >
            `
            : ""
        }

        <div class="admin-product-body">

          <strong>
            ${escapeHtml(product.name)}
          </strong>

          <span>
            ${escapeHtml(product.category || "—")}
          </span>

          <p>
            ${formatPrice(product.price)}
          </p>

          <small>
            Ombor:
            <b>${Number(product.stock || 0)}</b>
          </small>

          ${
            Number(product.stock || 0) <= 3
              ? `
                <div class="low-stock-warning">
                  ⚠️ Kam qoldi
                </div>
              `
              : ""
          }

          <div class="admin-product-actions">

            <button
              type="button"
              data-edit-product="${product.id}"
            >
              Tahrirlash
            </button>

            <button
              type="button"
              data-delete-product="${product.id}"
            >
              O‘chirish
            </button>

          </div>

        </div>
      `;

      adminProducts.appendChild(card);
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


  function resetProductForm() {
    if (!productForm) return;

    productForm.reset();

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

    showMessage(
      productMessage,
      ""
    );
  }


  function editProduct(id) {
    const product =
      allProducts.find(
        item =>
          Number(item.id) ===
          Number(id)
      );

    if (!product) {
      return;
    }

    if (pId) {
      pId.value =
        product.id;
    }

    if (pName) {
      pName.value =
        product.name || "";
    }

    if (pCategory) {
      pCategory.value =
        product.category || "";
    }

    if (pPrice) {
      pPrice.value =
        product.price || "";
    }

    if (pOldPrice) {
      pOldPrice.value =
        product.old_price || "";
    }

    if (pDiscount) {
      pDiscount.value =
        product.discount_percent || "";
    }

    if (pStock) {
      pStock.value =
        product.stock || 0;
    }

    if (pDescription) {
      pDescription.value =
        product.description || "";
    }

    if (pActive) {
      pActive.checked =
        product.active !== false;
    }

    if (productSaveBtn) {
      productSaveBtn.textContent =
        "Saqlash";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  async function saveProduct(event) {
    event.preventDefault();

    const token =
      getToken();

    const id =
      Number(pId?.value || 0);

    const payload = {
      name:
        pName?.value.trim() || "",

      category:
        pCategory?.value.trim() || null,

      price:
        Number(pPrice?.value || 0),

      old_price:
        pOldPrice?.value
          ? Number(pOldPrice.value)
          : null,

      discount_percent:
        pDiscount?.value
          ? Number(pDiscount.value)
          : 0,

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
        "Mahsulot nomini kiriting.",
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
          token
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
          token
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
        error.message ||
        "Mahsulot saqlanmadi.",
        "error"
      );
    }
  }


  async function deleteProduct(id) {
    const product =
      allProducts.find(
        item =>
          Number(item.id) ===
          Number(id)
      );

    if (!product) {
      return;
    }

    const ok =
      confirm(
        `"${product.name}" mahsulotini o‘chirasizmi?`
      );

    if (!ok) {
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
      alert(
        error.message ||
        "Mahsulot o‘chirilmadi."
      );
    }
  }


  /* =========================================================
     ORDERS
  ========================================================= */

  async function loadOrders() {
    const token =
      getToken();

    const data =
      await apiRequest(
        "rest/v1/orders?select=*&order=id.desc",
        {
          method: "GET"
        },
        token
      );

    allOrders =
      Array.isArray(data)
        ? data
        : [];
  }


  function getFilteredOrders() {
    let list =
      [...allOrders];

    const status =
      adminOrderFilter?.value ||
      "all";

    if (
      status !== "all"
    ) {
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


  function statusName(status) {
    const map = {
      new: "🔴 Yangi",
      talked: "🟠 Gaplashildi",
      confirmed: "🔵 Qadoqlanmoqda",
      delivery: "🟣 Yo‘lda",
      done: "🟢 Yetkazildi",
      cancelled: "⚪ Bekor"
    };

    return (
      map[status] ||
      status ||
      "—"
    );
  }


  function renderOrders() {
    const list =
      getFilteredOrders();

    if (adminOrders) {
      adminOrders.innerHTML =
        "";

      if (
        list.length === 0
      ) {
        adminOrders.innerHTML = `
          <tr>
            <td colspan="9">
              Buyurtmalar yo‘q.
            </td>
          </tr>
        `;
      }

      list.forEach(order => {
        const tr =
          document.createElement("tr");

        tr.innerHTML = `
          <td>#${escapeHtml(order.id)}</td>

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

        adminOrders.appendChild(tr);
      });
    }


    if (adminMobileOrders) {
      adminMobileOrders.innerHTML =
        "";

      list.forEach(order => {
        const card =
          document.createElement("article");

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
          Number(item.id) ===
          Number(id)
      );

    if (!order) {
      return;
    }

    const ok =
      confirm(
        `Buyurtma #${id} o‘chirilsinmi?`
      );

    if (!ok) {
      return;
    }

    try {
      /*
        Agar stock oldin kamaygan bo‘lsa,
        buyurtmani o‘chirishdan oldin
        mahsulot stockini qaytaramiz.
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
          const newStock =
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
                  stock:
                    newStock
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
      alert(
        error.message ||
        "Buyurtma o‘chirilmadi."
      );
    }
  }


  /* =========================================================
     PROFILES / OPERATORS
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

    adminOperators.innerHTML =
      "";

    if (
      operators.length === 0
    ) {
      adminOperators.innerHTML = `
        <p>Operatorlar yo‘q.</p>
      `;

      return;
    }


    operators.forEach(operator => {
      const card =
        document.createElement("article");

      card.className =
        "admin-operator-card";

      card.innerHTML = `
        <div>
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
        </div>
      `;

      adminOperators.appendChild(
        card
      );
    });
  }


  async function createOperator(
    event
  ) {
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
        "Barcha maydonlarni to‘ldiring.",
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

              "apikey":
                SUPABASE_KEY,

              "Authorization":
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


      operatorCreateForm?.reset();


      await loadProfiles();

      renderOperators();

      updateGlobalStats();


      showMessage(
        operatorCreateMessage,
        "✅ Operator yaratildi.",
        "success"
      );

    } catch (error) {
      console.error(error);

      showMessage(
        operatorCreateMessage,
        error.message ||
        "Operator yaratilmadi.",
        "error"
      );
    }
  }


  /* =========================================================
     ORDER ACTIVITY
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
          isToday(
            item.created_at
          )
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


    const rows =
      operators.map(operator => {
        const items =
          today.filter(
            item =>
              item.operator_id ===
              operator.id
          );


        return {
          operator,

          talked:
            items.filter(
              item =>
                item.status === "talked"
            ).length,

          confirmed:
            items.filter(
              item =>
                item.status === "confirmed"
            ).length,

          delivery:
            items.filter(
              item =>
                item.status === "delivery"
            ).length,

          done:
            items.filter(
              item =>
                item.status === "done"
            ).length,

          cancelled:
            items.filter(
              item =>
                item.status === "cancelled"
            ).length,

          total:
            items.length
        };
      });


    rows.sort(
      (a, b) =>
        b.total - a.total
    );


    operatorDailyStats.innerHTML =
      "";


    if (
      rows.length === 0
    ) {
      operatorDailyStats.innerHTML = `
        <p>
          Operatorlar topilmadi.
        </p>
      `;

      return;
    }


    rows.forEach(row => {
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
                row.operator.name ||
                "Operator"
              )}
            </strong>

            <small>
              ${
                row.operator.active
                  ? "🟢 Faol"
                  : "🔴 Bloklangan"
              }
            </small>

          </div>


          <span class="operator-daily-number">
            ${row.total}
          </span>

        </div>


        <div class="operator-daily-grid">

          <div>
            <span>🟠 Gaplashildi</span>
            <strong>${row.talked}</strong>
          </div>

          <div>
            <span>🔵 Qadoqlanmoqda</span>
            <strong>${row.confirmed}</strong>
          </div>

          <div>
            <span>🟣 Yo‘lda</span>
            <strong>${row.delivery}</strong>
          </div>

          <div>
            <span>🟢 Yetkazildi</span>
            <strong>${row.done}</strong>
          </div>

          <div>
            <span>⚪ Bekor</span>
            <strong>${row.cancelled}</strong>
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

    adminSupport.innerHTML =
      "";

    if (
      allSupport.length === 0
    ) {
      adminSupport.innerHTML = `
        <p>
          Support so‘rovlari yo‘q.
        </p>
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
        profile =>
          profile.role === "operator"
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
            order.status ===
            "confirmed"
        ).length;
    }


    if (adminDeliveryCount) {
      adminDeliveryCount.textContent =
        allOrders.filter(
          order =>
            order.status ===
            "delivery"
        ).length;
    }


    if (adminDoneCount) {
      adminDoneCount.textContent =
        allOrders.filter(
          order =>
            order.status ===
            "done"
        ).length;
    }


    if (adminCancelledCount) {
      adminCancelledCount.textContent =
        allOrders.filter(
          order =>
            order.status ===
            "cancelled"
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
          console.error(error);

          clearSession();

          showMessage(
            adminLoginMessage,
            error.message ||
            "Email yoki parol noto‘g‘ri.",
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
          ?.classList.add(
            "hidden"
          );

        adminLoginView
          ?.classList.remove(
            "hidden"
          );
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
          console.error(error);

          alert(
            error.message ||
            "Yangilashda xatolik."
          );
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
        ?.classList.remove(
          "hidden"
        );

      adminView
        ?.classList.add(
          "hidden"
        );

      return;
    }


    try {
      await openAdminPanel();

    } catch (error) {
      console.error(error);

      clearSession();

      adminView
        ?.classList.add(
          "hidden"
        );

      adminLoginView
        ?.classList.remove(
          "hidden"
        );

      showMessage(
        adminLoginMessage,
        "Qayta login qiling.",
        "error"
      );
    }
  }


  init();

})();
