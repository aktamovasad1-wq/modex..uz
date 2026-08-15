(() => {
  "use strict";

  /* =====================================================
     MODEX.UZ — ADMIN PANEL
  ===================================================== */

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;


  /* =====================================================
     ELEMENTLAR
  ===================================================== */

  const loginView =
    document.getElementById("loginView");

  const adminView =
    document.getElementById("adminView");

  const loginForm =
    document.getElementById("loginForm");

  const emailInput =
    document.getElementById("email");

  const passwordInput =
    document.getElementById("password");

  const loginMessage =
    document.getElementById("loginMessage");

  const adminEmail =
    document.getElementById("adminEmail");

  const refreshAdminBtn =
    document.getElementById("refreshAdminBtn");

  const logoutBtn =
    document.getElementById("logoutBtn");


  /* STAT */

  const aProducts =
    document.getElementById("aProducts");

  const aOrders =
    document.getElementById("aOrders");

  const aNew =
    document.getElementById("aNew");

  const aOperators =
    document.getElementById("aOperators");


  const todayOrdersCount =
    document.getElementById("todayOrdersCount");

  const newOrdersCount =
    document.getElementById("newOrdersCount");

  const talkedOrdersCount =
    document.getElementById("talkedOrdersCount");

  const confirmedOrdersCount =
    document.getElementById("confirmedOrdersCount");

  const deliveryOrdersCount =
    document.getElementById("deliveryOrdersCount");

  const doneOrdersCount =
    document.getElementById("doneOrdersCount");


  /* OPERATOR DAILY */

  const operatorDailyStats =
    document.getElementById("operatorDailyStats");

  const todayOperatorsTotal =
    document.getElementById("todayOperatorsTotal");


  /* PRODUCT */

  const productForm =
    document.getElementById("productForm");

  const productFormTitle =
    document.getElementById("productFormTitle");

  const editProductId =
    document.getElementById("editProductId");

  const pName =
    document.getElementById("pName");

  const pCategory =
    document.getElementById("pCategory");

  const pPrice =
    document.getElementById("pPrice");

  const pOldPrice =
    document.getElementById("pOldPrice");

  const pDiscount =
    document.getElementById("pDiscount");

  const pStock =
    document.getElementById("pStock");

  const pDesc =
    document.getElementById("pDesc");

  const pImage =
    document.getElementById("pImage");

  const productSubmitBtn =
    document.getElementById("productSubmitBtn");

  const cancelEditBtn =
    document.getElementById("cancelEditBtn");

  const productMessage =
    document.getElementById("productMessage");

  const adminProducts =
    document.getElementById("adminProducts");


  /* OPERATOR CREATE */

  const operatorCreateForm =
    document.getElementById("operatorCreateForm");

  const opName =
    document.getElementById("opName");

  const newOpEmail =
    document.getElementById("newOpEmail");

  const newOpPassword =
    document.getElementById("newOpPassword");

  const operatorCreateMessage =
    document.getElementById("operatorCreateMessage");

  const operatorsList =
    document.getElementById("operatorsList");


  /* ORDERS */

  const ordersBody =
    document.getElementById("ordersBody");

  const mobileOrders =
    document.getElementById("mobileOrders");

  const ordersMessage =
    document.getElementById("ordersMessage");

  const visibleOrderCount =
    document.getElementById("visibleOrderCount");

  const adminOrderSearch =
    document.getElementById("adminOrderSearch");

  const clearOrderSearch =
    document.getElementById("clearOrderSearch");


  /* SUPPORT */

  const adminSupportList =
    document.getElementById("adminSupportList");


  /* =====================================================
     STATE
  ===================================================== */

  let currentUser = null;

  let products = [];
  let orders = [];
  let profiles = [];
  let supportRequests = [];

  let activeOrderFilter = "all";


  /* =====================================================
     HELPERS
  ===================================================== */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function formatMoney(value) {
    return Number(value || 0)
      .toLocaleString("uz-UZ") + " so‘m";
  }


  function formatDate(value) {
    if (!value) return "—";

    try {
      return new Date(value)
        .toLocaleString("uz-UZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

    } catch (_) {
      return "—";
    }
  }


  function showMessage(
    element,
    text,
    type = ""
  ) {
    if (!element) return;

    element.textContent = text;
    element.className = "form-message";

    if (type) {
      element.classList.add(type);
    }
  }


  function isToday(value) {
    if (!value) return false;

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const now = new Date();

    return (
      date.getFullYear() ===
        now.getFullYear() &&

      date.getMonth() ===
        now.getMonth() &&

      date.getDate() ===
        now.getDate()
    );
  }


  /* =====================================================
     TOKEN
  ===================================================== */

  function saveSession(session) {
    if (!session?.access_token) return;

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
  }


  /* =====================================================
     API
  ===================================================== */

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


  /* =====================================================
     LOGIN
  ===================================================== */

  async function login(
    email,
    password
  ) {
    const data =
      await apiRequest(
        "auth/v1/token?grant_type=password",
        {
          method: "POST",

          body: JSON.stringify({
            email,
            password
          })
        }
      );


    if (!data?.access_token) {
      throw new Error(
        "Login token olinmadi."
      );
    }

    saveSession(data);

    return data;
  }


  async function loadCurrentUser() {
    const token = getToken();

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
        "Admin aniqlanmadi."
      );
    }


    currentUser = user;

    return user;
  }


  async function checkAdmin() {
    const token = getToken();


    const data =
      await apiRequest(
        `rest/v1/profiles?id=eq.${encodeURIComponent(currentUser.id)}&select=id,name,role,active`,
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


    if (profile.role !== "admin") {
      throw new Error(
        "Bu akkaunt admin emas."
      );
    }


    if (profile.active !== true) {
      throw new Error(
        "Admin bloklangan."
      );
    }


    return profile;
  }


  /* =====================================================
     ADMIN PANELNI OCHISH
  ===================================================== */

  async function openAdmin() {
    await loadCurrentUser();

    await checkAdmin();


    loginView?.classList.add(
      "hidden"
    );

    adminView?.classList.remove(
      "hidden"
    );


    if (adminEmail) {
      adminEmail.textContent =
        currentUser.email || "";
    }


    await loadEverything();
  }


  /* =====================================================
     LOAD EVERYTHING
  ===================================================== */

  async function loadEverything() {
    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadProfiles(),
      loadSupport()
    ]);

    updateDashboard();
    renderOperatorDailyStats();
  }


  /* =====================================================
     PRODUCTS
  ===================================================== */

  async function loadProducts() {
    const token = getToken();

    try {
      const data =
        await apiRequest(
          "rest/v1/products?select=*&order=id.desc",
          {
            method: "GET"
          },
          token
        );


      products =
        Array.isArray(data)
          ? data
          : [];


      renderProducts();

    } catch (error) {
      console.error(error);

      showMessage(
        productMessage,
        error.message,
        "error"
      );
    }
  }


  function renderProducts() {
    if (!adminProducts) return;

    adminProducts.innerHTML = "";


    if (products.length === 0) {
      adminProducts.innerHTML =
        "<p>Mahsulot yo‘q.</p>";

      return;
    }


    products.forEach(product => {
      const item =
        document.createElement("article");

      item.className =
        "product-admin-item";


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
                alt=""
              >
            `
            : `
              <div
                style="
                  width:64px;
                  height:80px;
                  border-radius:10px;
                  background:#f1f1f5;
                "
              ></div>
            `
        }


        <div>

          <strong>
            ${escapeHtml(
              product.name ||
              "Mahsulot"
            )}
          </strong>

          <div
            style="
              margin-top:4px;
              color:#777783;
              font-size:11px;
            "
          >
            ${escapeHtml(
              product.category || ""
            )}
          </div>

          <div
            style="
              margin-top:5px;
              font-weight:900;
            "
          >
            ${formatMoney(
              product.price
            )}
          </div>

          <small>
            Omborda:
            ${Number(
              product.stock || 0
            )} dona
          </small>

        </div>


        <div class="product-admin-actions">

          <button
            class="small-btn"
            type="button"
            data-edit-product="${product.id}"
          >
            Tahrirlash
          </button>

          <button
            class="small-btn"
            type="button"
            data-delete-product="${product.id}"
          >
            O‘chirish
          </button>

        </div>
      `;


      adminProducts.appendChild(
        item
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
            startEditProduct(
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


  function startEditProduct(id) {
    const product =
      products.find(
        item =>
          Number(item.id) ===
          Number(id)
      );


    if (!product) return;


    editProductId.value =
      product.id;

    pName.value =
      product.name || "";

    pCategory.value =
      product.category || "";

    pPrice.value =
      product.price || "";

    pOldPrice.value =
      product.old_price || "";

    pDiscount.value =
      product.discount_percent || 0;

    pStock.value =
      product.stock || 0;

    pDesc.value =
      product.description || "";


    if (productFormTitle) {
      productFormTitle.textContent =
        "Mahsulotni tahrirlash";
    }


    if (productSubmitBtn) {
      productSubmitBtn.textContent =
        "Saqlash";
    }


    cancelEditBtn?.classList.remove(
      "hidden"
    );


    productForm?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  function resetProductForm() {
    productForm?.reset();

    if (editProductId) {
      editProductId.value = "";
    }


    if (productFormTitle) {
      productFormTitle.textContent =
        "Mahsulot qo‘shish";
    }


    if (productSubmitBtn) {
      productSubmitBtn.textContent =
        "Mahsulot qo‘shish";
    }


    cancelEditBtn?.classList.add(
      "hidden"
    );


    showMessage(
      productMessage,
      ""
    );
  }


  async function saveProduct(event) {
    event.preventDefault();

    const token =
      getToken();


    const id =
      Number(editProductId?.value || 0);


    const payload = {
      name:
        pName.value.trim(),

      category:
        pCategory.value.trim(),

      price:
        Number(pPrice.value || 0),

      old_price:
        pOldPrice.value
          ? Number(pOldPrice.value)
          : null,

      discount_percent:
        Number(pDiscount.value || 0),

      stock:
        Math.max(
          0,
          Number(pStock.value || 0)
        ),

      description:
        pDesc.value.trim() || null,

      active: true
    };


    if (
      !payload.name ||
      !payload.category ||
      payload.price <= 0
    ) {
      showMessage(
        productMessage,
        "Mahsulot nomi, kategoriya va narxni tekshiring.",
        "error"
      );

      return;
    }


    showMessage(
      productMessage,
      "Saqlanmoqda..."
    );


    try {

      /*
        Hozir rasm URL DB'da oldindan
        bo‘lsa saqlanadi.

        File upload uchun Storage alohida
        ulanishi kerak.
      */

      if (id) {
        await apiRequest(
          `rest/v1/products?id=eq.${id}`,
          {
            method: "PATCH",

            headers: {
              "Prefer":
                "return=representation"
            },

            body:
              JSON.stringify(payload)
          },
          token
        );

      } else {
        await apiRequest(
          "rest/v1/products",
          {
            method: "POST",

            headers: {
              "Prefer":
                "return=representation"
            },

            body:
              JSON.stringify(payload)
          },
          token
        );
      }


      showMessage(
        productMessage,
        "✅ Saqlandi",
        "success"
      );


      resetProductForm();

      await loadProducts();

      updateDashboard();


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
    const yes =
      confirm(
        "Mahsulotni o‘chirasizmi?"
      );

    if (!yes) return;


    try {
      await apiRequest(
        `rest/v1/products?id=eq.${id}`,
        {
          method: "DELETE"
        },
        getToken()
      );


      await loadProducts();

      updateDashboard();

    } catch (error) {
      alert(
        error.message ||
        "Mahsulotni o‘chirib bo‘lmadi."
      );
    }
  }


  /* =====================================================
     PROFILES / OPERATORS
  ===================================================== */

  async function loadProfiles() {
    const token =
      getToken();

    try {
      const data =
        await apiRequest(
          "rest/v1/profiles?select=id,name,role,active&order=name.asc",
          {
            method: "GET"
          },
          token
        );


      profiles =
        Array.isArray(data)
          ? data
          : [];


      renderOperators();

    } catch (error) {
      console.error(error);
    }
  }


  function getOperators() {
    return profiles.filter(
      profile =>
        profile.role === "operator"
    );
  }


  function renderOperators() {
    if (!operatorsList) return;


    const operatorProfiles =
      getOperators();


    if (
      operatorProfiles.length === 0
    ) {
      operatorsList.innerHTML =
        "<p>Operator yo‘q.</p>";

      return;
    }


    operatorsList.innerHTML =
      operatorProfiles
        .map(operator => `

          <div
            style="
              padding:12px;
              margin-top:8px;
              border:1px solid #e8e8ef;
              border-radius:13px;
              background:#fafafd;
            "
          >

            <strong>
              ${escapeHtml(
                operator.name ||
                "Operator"
              )}
            </strong>

            <div
              style="
                margin-top:4px;
                font-size:11px;
                color:${
                  operator.active
                    ? "#16835a"
                    : "#d6455d"
                };
              "
            >
              ${
                operator.active
                  ? "● Faol"
                  : "● Bloklangan"
              }
            </div>

          </div>

        `)
        .join("");
  }


  /* =====================================================
     OPERATOR YARATISH
  ===================================================== */

  async function createOperator(event) {
    event.preventDefault();


    const name =
      opName.value.trim();

    const email =
      newOpEmail.value.trim();

    const password =
      newOpPassword.value;


    if (
      !name ||
      !email ||
      password.length < 6
    ) {
      showMessage(
        operatorCreateMessage,
        "Ism, email va kamida 6 belgili parol kiriting.",
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


      operatorCreateForm.reset();


      showMessage(
        operatorCreateMessage,
        "✅ Operator yaratildi",
        "success"
      );


      await loadProfiles();

      updateDashboard();


    } catch (error) {
      console.error(error);

      showMessage(
        operatorCreateMessage,
        error.message,
        "error"
      );
    }
  }


  /* =====================================================
     ORDERS
  ===================================================== */

  async function loadOrders() {
    const token =
      getToken();


    showMessage(
      ordersMessage,
      "Buyurtmalar yuklanmoqda..."
    );


    try {
      const data =
        await apiRequest(
          "rest/v1/orders?select=*&order=id.desc",
          {
            method: "GET"
          },
          token
        );


      orders =
        Array.isArray(data)
          ? data
          : [];


      renderOrders();

      showMessage(
        ordersMessage,
        ""
      );


    } catch (error) {
      console.error(error);

      showMessage(
        ordersMessage,
        error.message,
        "error"
      );
    }
  }


  function getFilteredOrders() {
    let list =
      [...orders];


    if (
      activeOrderFilter !== "all"
    ) {
      list =
        list.filter(
          order =>
            order.status ===
            activeOrderFilter
        );
    }


    const query =
      adminOrderSearch?.value
        ?.trim()
        ?.toLowerCase() || "";


    if (query) {
      list =
        list.filter(order => {
          const text = `
            ${order.id || ""}
            ${order.name || ""}
            ${order.surname || ""}
            ${order.phone || ""}
            ${order.product || ""}
            ${order.region || ""}
          `.toLowerCase();


          return text.includes(
            query
          );
        });
    }


    return list;
  }


  function statusText(status) {
    const map = {
      new: "🔴 Yangi",
      talked: "🟠 Gaplashildi",
      confirmed: "🔵 Tasdiqlandi",
      delivery: "🟣 Yo‘lda",
      done: "🟢 Yakunlandi",
      cancelled: "⚪ Bekor"
    };

    return map[status] ||
      status ||
      "Yangi";
  }


  function renderOrders() {
    const list =
      getFilteredOrders();


    if (visibleOrderCount) {
      visibleOrderCount.textContent =
        `${list.length} ta`;
    }


    if (ordersBody) {
      ordersBody.innerHTML =
        list
          .map(order => `

            <tr>

              <td>
                #${escapeHtml(order.id)}
              </td>

              <td>
                ${escapeHtml(
                  order.name || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.phone || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.product || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.quantity || 1
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.size || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.color || "—"
                )}
              </td>

              <td>
                ${statusText(
                  order.status
                )}
              </td>

              <td>

                <button
                  class="small-btn"
                  data-delete-order="${order.id}"
                  type="button"
                >
                  O‘chirish
                </button>

              </td>

            </tr>

          `)
          .join("");
    }


    renderMobileOrders(list);


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


  function renderMobileOrders(list) {
    if (!mobileOrders) return;


    mobileOrders.innerHTML =
      list
        .map(order => `

          <article
            style="
              padding:13px;
              border:1px solid #e8e8ef;
              border-radius:15px;
              background:#fff;
            "
          >

            <small>
              Buyurtma #${escapeHtml(order.id)}
            </small>

            <h3
              style="
                margin:5px 0;
              "
            >
              ${escapeHtml(
                order.name || "Mijoz"
              )}
            </h3>

            <a
              href="tel:${escapeHtml(
                order.phone || ""
              )}"
              style="
                display:block;
                margin-bottom:7px;
              "
            >
              📞
              ${escapeHtml(
                order.phone || "—"
              )}
            </a>

            <strong>
              ${escapeHtml(
                order.product || "Mahsulot"
              )}
            </strong>

            <p>
              ${statusText(order.status)}
            </p>

            <button
              class="small-btn"
              data-delete-order="${order.id}"
              type="button"
            >
              O‘chirish
            </button>

          </article>

        `)
        .join("");
  }


  /* =====================================================
     ORDER DELETE
  ===================================================== */

  async function deleteOrder(id) {
    const order =
      orders.find(
        item =>
          Number(item.id) ===
          Number(id)
      );


    if (!order) return;


    const yes =
      confirm(
        `Buyurtma #${id} o‘chirilsinmi?`
      );

    if (!yes) return;


    try {

      /*
        Agar oldin stock kamaytirilgan
        bo‘lsa — mahsulotni qaytaramiz.
      */

      if (
        order.stock_adjusted === true &&
        order.product_id
      ) {
        const product =
          products.find(
            item =>
              Number(item.id) ===
              Number(order.product_id)
          );


        if (product) {
          const newStock =
            Number(product.stock || 0) +
            Number(order.quantity || 1);


          await apiRequest(
            `rest/v1/products?id=eq.${order.product_id}`,
            {
              method: "PATCH",

              body:
                JSON.stringify({
                  stock: newStock
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
        loadProducts()
      ]);


      updateDashboard();

      renderOperatorDailyStats();


    } catch (error) {
      alert(
        error.message ||
        "Buyurtmani o‘chirib bo‘lmadi."
      );
    }
  }


  /* =====================================================
     DASHBOARD STAT
  ===================================================== */

  function updateDashboard() {
    const operatorProfiles =
      getOperators();


    if (aProducts) {
      aProducts.textContent =
        products.length;
    }


    if (aOrders) {
      aOrders.textContent =
        orders.length;
    }


    if (aNew) {
      aNew.textContent =
        orders.filter(
          order =>
            order.status === "new"
        ).length;
    }


    if (aOperators) {
      aOperators.textContent =
        operatorProfiles.length;
    }


    if (todayOrdersCount) {
      todayOrdersCount.textContent =
        orders.filter(
          order =>
            isToday(order.created_at)
        ).length;
    }


    if (newOrdersCount) {
      newOrdersCount.textContent =
        orders.filter(
          order =>
            order.status === "new"
        ).length;
    }


    if (talkedOrdersCount) {
      talkedOrdersCount.textContent =
        orders.filter(
          order =>
            order.status === "talked"
        ).length;
    }


    if (confirmedOrdersCount) {
      confirmedOrdersCount.textContent =
        orders.filter(
          order =>
            order.status === "confirmed"
        ).length;
    }


    if (deliveryOrdersCount) {
      deliveryOrdersCount.textContent =
        orders.filter(
          order =>
            order.status === "delivery"
        ).length;
    }


    if (doneOrdersCount) {
      doneOrdersCount.textContent =
        orders.filter(
          order =>
            order.status === "done"
        ).length;
    }
  }


  /* =====================================================
     BUGUNGI OPERATOR NATIJALARI
  ===================================================== */

  function renderOperatorDailyStats() {
    if (
      !operatorDailyStats ||
      !todayOperatorsTotal
    ) {
      return;
    }


    const operators =
      getOperators();


    /*
      MUHIM:

      Bu yerda statusga qaramaymiz.

      Sababi operator bugun mijoz bilan
      gaplashdi, keyin buyurtmani
      Tasdiqlandi yoki Yo‘lda qilishi mumkin.

      talked_at va operator_id tarixni
      saqlab turadi.
    */

    const todayTalkedOrders =
      orders.filter(order =>
        order.operator_id &&
        isToday(order.talked_at)
      );


    todayOperatorsTotal.textContent =
      `${todayTalkedOrders.length} ta`;


    if (operators.length === 0) {
      operatorDailyStats.innerHTML =
        "<p>Operator topilmadi.</p>";

      return;
    }


    const stats =
      operators
        .map(operator => {

          const count =
            todayTalkedOrders
              .filter(order =>
                order.operator_id ===
                operator.id
              )
              .length;


          return {
            ...operator,
            count
          };

        })
        .sort(
          (a, b) =>
            b.count - a.count
        );


    operatorDailyStats.innerHTML =
      stats
        .map((operator, index) => `

          <article
            class="operator-daily-card"
          >

            <span>
              ${
                index === 0 &&
                operator.count > 0
                  ? "🏆 BUGUNGI NATIJA"
                  : "OPERATOR"
              }
            </span>

            <strong>
              ${escapeHtml(
                operator.name ||
                "Operator"
              )}
            </strong>

            <strong
              class="operator-daily-number"
            >
              ${operator.count}
            </strong>

            <small>
              ta mijoz bilan gaplashgan
            </small>

          </article>

        `)
        .join("");
  }


  /* =====================================================
     SUPPORT
  ===================================================== */

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


      supportRequests =
        Array.isArray(data)
          ? data
          : [];


      renderSupport();

    } catch (error) {
      console.error(error);
    }
  }


  function renderSupport() {
    if (!adminSupportList) return;


    if (
      supportRequests.length === 0
    ) {
      adminSupportList.innerHTML =
        "<p>Murojaatlar yo‘q.</p>";

      return;
    }


    adminSupportList.innerHTML =
      supportRequests
        .map(item => `

          <article
            style="
              padding:13px;
              margin-bottom:8px;
              border:1px solid #e8e8ef;
              border-radius:14px;
              background:#fafafd;
            "
          >

            <strong>
              ${escapeHtml(
                item.name || "Mijoz"
              )}
            </strong>

            <a
              href="tel:${escapeHtml(
                item.phone || ""
              )}"
              style="
                display:block;
                margin:5px 0;
                color:#713cf0;
                font-weight:800;
              "
            >
              📞
              ${escapeHtml(
                item.phone || "—"
              )}
            </a>

            <p
              style="
                margin:6px 0;
              "
            >
              ${escapeHtml(
                item.message || ""
              )}
            </p>

            <small>
              ${formatDate(
                item.created_at
              )}
            </small>

          </article>

        `)
        .join("");
  }


  /* =====================================================
     FILTER BUTTONS
  ===================================================== */

  document
    .querySelectorAll(
      ".order-filter-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          activeOrderFilter =
            button.dataset.status ||
            "all";


          document
            .querySelectorAll(
              ".order-filter-btn"
            )
            .forEach(btn => {

              btn.classList.toggle(
                "active",
                btn === button
              );

            });


          renderOrders();
        }
      );

    });


  /* =====================================================
     SEARCH
  ===================================================== */

  adminOrderSearch
    ?.addEventListener(
      "input",
      renderOrders
    );


  clearOrderSearch
    ?.addEventListener(
      "click",
      () => {

        adminOrderSearch.value = "";

        renderOrders();

        adminOrderSearch.focus();

      }
    );


  /* =====================================================
     FORMS
  ===================================================== */

  productForm
    ?.addEventListener(
      "submit",
      saveProduct
    );


  cancelEditBtn
    ?.addEventListener(
      "click",
      resetProductForm
    );


  operatorCreateForm
    ?.addEventListener(
      "submit",
      createOperator
    );


  /* =====================================================
     LOGIN FORM
  ===================================================== */

  loginForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          emailInput.value.trim();

        const password =
          passwordInput.value;


        showMessage(
          loginMessage,
          "Kirilmoqda..."
        );


        try {

          await login(
            email,
            password
          );


          await openAdmin();


          loginForm.reset();


          showMessage(
            loginMessage,
            ""
          );


        } catch (error) {

          console.error(error);

          clearSession();


          showMessage(
            loginMessage,
            error.message ||
            "Email yoki parol noto‘g‘ri.",
            "error"
          );

        }

      }
    );


  /* =====================================================
     REFRESH
  ===================================================== */

  refreshAdminBtn
    ?.addEventListener(
      "click",
      async () => {

        refreshAdminBtn.disabled =
          true;

        refreshAdminBtn.textContent =
          "⏳";


        try {

          await loadEverything();

        } finally {

          refreshAdminBtn.disabled =
            false;

          refreshAdminBtn.textContent =
            "🔄";

        }

      }
    );


  /* =====================================================
     LOGOUT
  ===================================================== */

  logoutBtn
    ?.addEventListener(
      "click",
      () => {

        clearSession();


        adminView
          ?.classList.add(
            "hidden"
          );


        loginView
          ?.classList.remove(
            "hidden"
          );


        products = [];
        orders = [];
        profiles = [];
        supportRequests = [];

      }
    );


  /* =====================================================
     INIT
  ===================================================== */

  async function init() {
    const token =
      getToken();


    if (!token) {

      loginView
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

      await openAdmin();

    } catch (error) {

      console.error(error);

      clearSession();


      adminView
        ?.classList.add(
          "hidden"
        );


      loginView
        ?.classList.remove(
          "hidden"
        );


      showMessage(
        loginMessage,
        "Qayta login qiling.",
        "error"
      );

    }
  }


  init();

})();
