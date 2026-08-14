const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

let accessToken = "";
let refreshToken = "";
let currentUser = null;

let products = [];
let orders = [];
let operators = [];
let supportRequests = [];

let currentOrderStatus = "all";


/* =========================================
   ELEMENTLAR
========================================= */

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");
const refreshAdminBtn = document.getElementById("refreshAdminBtn");


/* PRODUCT */

const productForm = document.getElementById("productForm");
const productFormTitle = document.getElementById("productFormTitle");

const editProductId = document.getElementById("editProductId");

const pName = document.getElementById("pName");
const pCategory = document.getElementById("pCategory");

const pPrice = document.getElementById("pPrice");
const pOldPrice = document.getElementById("pOldPrice");

const pDiscount = document.getElementById("pDiscount");
const pStock = document.getElementById("pStock");

const pDesc = document.getElementById("pDesc");
const pImage = document.getElementById("pImage");

const productSubmitBtn = document.getElementById("productSubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const productMessage = document.getElementById("productMessage");
const adminProducts = document.getElementById("adminProducts");


/* OPERATOR */

const operatorCreateForm = document.getElementById("operatorCreateForm");

const opName = document.getElementById("opName");
const newOpEmail = document.getElementById("newOpEmail");
const newOpPassword = document.getElementById("newOpPassword");

const operatorCreateMessage =
  document.getElementById("operatorCreateMessage");

const operatorsList =
  document.getElementById("operatorsList");


/* ORDERS */

const adminOrderSearch =
  document.getElementById("adminOrderSearch");

const clearOrderSearch =
  document.getElementById("clearOrderSearch");

const ordersBody =
  document.getElementById("ordersBody");

const mobileOrders =
  document.getElementById("mobileOrders");

const ordersMessage =
  document.getElementById("ordersMessage");

const visibleOrderCount =
  document.getElementById("visibleOrderCount");


/* SUPPORT */

const adminSupportList =
  document.getElementById("adminSupportList");


/* STATISTIKA */

const aProducts = document.getElementById("aProducts");
const aOrders = document.getElementById("aOrders");
const aNew = document.getElementById("aNew");
const aOperators = document.getElementById("aOperators");

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


/* =========================================
   HELPERS
========================================= */

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}


function money(value) {
  return (
    new Intl.NumberFormat("uz-UZ")
      .format(Number(value || 0))
    + " so‘m"
  );
}


function setMessage(element, text, type = "") {
  if (!element) return;

  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}


function normalizePhone(phone = "") {
  return String(phone).replace(/[^\d+]/g, "");
}


function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("uz-UZ");
  } catch {
    return "-";
  }
}


function isToday(value) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}


function productLink(id) {
  const path = location.pathname.replace(/admin\.html.*$/, "");

  return `${location.origin}${path}product.html?id=${id}`;
}


/* =========================================
   SESSION
========================================= */

function saveSession(auth) {
  accessToken = auth.access_token || "";
  refreshToken = auth.refresh_token || "";

  localStorage.setItem(
    "modex_admin_session",
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  );
}


function loadSavedSession() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("modex_admin_session") || "{}"
    );

    accessToken = saved.access_token || "";
    refreshToken = saved.refresh_token || "";

  } catch {
    accessToken = "";
    refreshToken = "";
  }
}


function clearSession() {
  accessToken = "";
  refreshToken = "";
  currentUser = null;

  localStorage.removeItem("modex_admin_session");
  localStorage.removeItem("modex_admin_token");
}


/* =========================================
   AUTH
========================================= */

async function signIn(email, password) {
  const response = await fetch(
    `${AUTH}/token?grant_type=password`,
    {
      method: "POST",

      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
      data.msg ||
      data.message ||
      "Email yoki parol noto‘g‘ri."
    );
  }

  return data;
}


async function refreshSession() {
  if (!refreshToken) {
    throw new Error("Sessiya mavjud emas.");
  }

  const response = await fetch(
    `${AUTH}/token?grant_type=refresh_token`,
    {
      method: "POST",

      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        refresh_token: refreshToken
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Sessiya tugagan.");
  }

  saveSession(data);

  return data;
}


async function getCurrentUser() {
  const response = await fetch(
    `${AUTH}/user`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 401 && refreshToken) {
    await refreshSession();

    return getCurrentUser();
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Sessiya topilmadi."
    );
  }

  return data;
}


/* =========================================
   REST API
========================================= */

async function api(path, options = {}, retry = true) {
  const response = await fetch(
    `${REST}/${path}`,
    {
      ...options,

      headers: {
        apikey: SUPABASE_KEY,

        Authorization:
          `Bearer ${accessToken || SUPABASE_KEY}`,

        ...(options.headers || {})
      }
    }
  );

  if (
    response.status === 401 &&
    retry &&
    refreshToken
  ) {
    await refreshSession();

    return api(path, options, false);
  }

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      text || `HTTP ${response.status}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text
    ? JSON.parse(text)
    : null;
}


/* =========================================
   ADMIN ROLE
========================================= */

async function checkAdminRole(userId) {
  const rows = await api(
    `profiles?select=id,name,role,active&id=eq.${encodeURIComponent(userId)}&limit=1`
  );

  const profile = rows?.[0];

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
      "Admin akkaunti faol emas."
    );
  }

  return profile;
}


/* =========================================
   VIEW
========================================= */

function showLogin() {
  loginView.classList.remove("hidden");
  adminView.classList.add("hidden");
}


function showAdmin() {
  loginView.classList.add("hidden");
  adminView.classList.remove("hidden");
}


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const button =
    loginForm.querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = "Tekshirilmoqda...";

  setMessage(
    loginMessage,
    "Kirish tekshirilmoqda..."
  );

  try {
    const auth = await signIn(
      emailInput.value.trim(),
      passwordInput.value
    );

    saveSession(auth);

    currentUser = auth.user;

    await checkAdminRole(currentUser.id);

    adminEmail.textContent =
      currentUser.email || "";

    setMessage(loginMessage, "");

    showAdmin();

    await loadAdminData();

  } catch (error) {
    console.error("LOGIN XATO:", error);

    clearSession();
    showLogin();

    setMessage(
      loginMessage,
      error.message ||
      "Admin panelga kirib bo‘lmadi.",
      "error"
    );

  } finally {
    button.disabled = false;
    button.textContent = "Kirish";
  }
});


/* =========================================
   SESSION RESTORE
========================================= */

async function restoreSession() {
  loadSavedSession();

  /* oldingi versiyadagi token bo‘lsa ham sinaymiz */
  if (!accessToken) {
    const oldToken =
      localStorage.getItem("modex_admin_token");

    if (oldToken) {
      accessToken = oldToken;
    }
  }

  if (!accessToken) {
    showLogin();
    return;
  }

  try {
    currentUser = await getCurrentUser();

    await checkAdminRole(currentUser.id);

    adminEmail.textContent =
      currentUser.email || "";

    showAdmin();

    await loadAdminData();

  } catch (error) {
    console.error("SESSION XATO:", error);

    clearSession();
    showLogin();
  }
}


/* =========================================
   LOGOUT
========================================= */

logoutBtn.addEventListener("click", async () => {
  try {
    if (accessToken) {
      await fetch(
        `${AUTH}/logout`,
        {
          method: "POST",

          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
    }
  } catch (error) {
    console.error(error);
  }

  clearSession();

  emailInput.value = "";
  passwordInput.value = "";

  showLogin();
});


/* =========================================
   LOAD ADMIN DATA
========================================= */

async function loadAdminData() {
  await Promise.allSettled([
    loadProducts(),
    loadOrders(),
    loadOperators(),
    loadSupport()
  ]);

  updateStats();
  updateOrderStats();
}


refreshAdminBtn.addEventListener(
  "click",
  async () => {
    refreshAdminBtn.disabled = true;
    refreshAdminBtn.textContent =
      "Yangilanmoqda...";

    try {
      await loadAdminData();

    } finally {
      refreshAdminBtn.disabled = false;
      refreshAdminBtn.textContent =
        "🔄 Yangilash";
    }
  }
);


/* =========================================
   STATS
========================================= */

function updateStats() {
  aProducts.textContent =
    products.length;

  aOrders.textContent =
    orders.length;

  aNew.textContent =
    orders.filter(
      order =>
        (order.status || "new") === "new"
    ).length;

  aOperators.textContent =
    operators.length;
}


function updateOrderStats() {
  todayOrdersCount.textContent =
    orders.filter(
      order => isToday(order.created_at)
    ).length;

  newOrdersCount.textContent =
    orders.filter(
      order =>
        (order.status || "new") === "new"
    ).length;

  talkedOrdersCount.textContent =
    orders.filter(
      order => order.status === "talked"
    ).length;

  confirmedOrdersCount.textContent =
    orders.filter(
      order => order.status === "confirmed"
    ).length;

  deliveryOrdersCount.textContent =
    orders.filter(
      order => order.status === "delivery"
    ).length;

  doneOrdersCount.textContent =
    orders.filter(
      order => order.status === "done"
    ).length;
}


/* =========================================
   IMAGE UPLOAD
========================================= */

async function uploadImage(file) {
  if (!file) return null;

  const extension =
    file.name.split(".").pop().toLowerCase();

  const filename =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/products/${filename}`,
    {
      method: "POST",

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,

        "Content-Type":
          file.type ||
          "application/octet-stream",

        "x-upsert": "false"
      },

      body: file
    }
  );

  if (!response.ok) {
    throw new Error(
      await response.text()
    );
  }

  return (
    `${SUPABASE_URL}/storage/v1/object/public/products/${filename}`
  );
}


/* =========================================
   PRODUCTS LOAD
========================================= */

async function loadProducts() {
  try {
    products = await api(
      "products?select=*&order=id.desc"
    );

    renderAdminProducts();

  } catch (error) {
    console.error("PRODUCTS:", error);

    setMessage(
      productMessage,
      "Mahsulotlarni yuklab bo‘lmadi.",
      "error"
    );
  }
}


/* =========================================
   PRODUCT SAVE
========================================= */

productForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const editingId =
      editProductId.value.trim();

    const price =
      Number(pPrice.value || 0);

    const oldPrice =
      pOldPrice.value
        ? Number(pOldPrice.value)
        : null;

    let discount =
      Number(pDiscount.value || 0);

    const stock =
      Math.max(
        0,
        Math.floor(
          Number(pStock.value || 0)
        )
      );


    if (
      oldPrice &&
      oldPrice > price &&
      discount === 0
    ) {
      discount = Math.round(
        ((oldPrice - price) / oldPrice) * 100
      );

      pDiscount.value = discount;
    }


    if (
      discount < 0 ||
      discount > 100
    ) {
      setMessage(
        productMessage,
        "Chegirma 0–100 oralig‘ida bo‘lishi kerak.",
        "error"
      );

      return;
    }


    productSubmitBtn.disabled = true;

    productSubmitBtn.textContent =
      editingId
        ? "Saqlanmoqda..."
        : "Qo‘shilmoqda...";


    try {
      let imageUrl = null;

      if (pImage.files?.[0]) {
        imageUrl =
          await uploadImage(
            pImage.files[0]
          );
      }


      const payload = {
        name:
          pName.value.trim(),

        category:
          pCategory.value.trim(),

        price,

        old_price:
          oldPrice,

        discount_percent:
          discount,

        stock,

        description:
          pDesc.value.trim(),

        active: true
      };


      if (imageUrl) {
        payload.image_url =
          imageUrl;
      }


      if (editingId) {
        await api(
          `products?id=eq.${encodeURIComponent(editingId)}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(payload)
          }
        );

        setMessage(
          productMessage,
          "Mahsulot yangilandi ✅",
          "success"
        );

      } else {
        await api(
          "products",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(payload)
          }
        );

        setMessage(
          productMessage,
          "Mahsulot qo‘shildi ✅",
          "success"
        );
      }


      resetProductForm();

      await loadProducts();

      updateStats();

    } catch (error) {
      console.error("PRODUCT SAVE:", error);

      setMessage(
        productMessage,
        "Mahsulotni saqlab bo‘lmadi.",
        "error"
      );

    } finally {
      productSubmitBtn.disabled =
        false;

      if (!editProductId.value) {
        productSubmitBtn.textContent =
          "Mahsulot qo‘shish";
      }
    }
  }
);


/* =========================================
   PRODUCT RESET
========================================= */

function resetProductForm() {
  productForm.reset();

  editProductId.value = "";
  pStock.value = 0;

  productFormTitle.textContent =
    "Mahsulot qo‘shish";

  productSubmitBtn.textContent =
    "Mahsulot qo‘shish";

  cancelEditBtn.classList.add(
    "hidden"
  );
}


cancelEditBtn.addEventListener(
  "click",
  () => {
    resetProductForm();
    setMessage(productMessage, "");
  }
);


/* =========================================
   EDIT PRODUCT
========================================= */

function editProduct(id) {
  const product = products.find(
    item =>
      Number(item.id) === Number(id)
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
    product.discount_percent || "";

  pStock.value =
    Number(product.stock || 0);

  pDesc.value =
    product.description || "";

  productFormTitle.textContent =
    "Mahsulotni tahrirlash";

  productSubmitBtn.textContent =
    "Saqlash";

  cancelEditBtn.classList.remove(
    "hidden"
  );

  productForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================
   DELETE PRODUCT
========================================= */

async function deleteProduct(id) {
  const product = products.find(
    item =>
      Number(item.id) === Number(id)
  );

  if (!product) return;

  if (
    !confirm(
      `"${product.name}" mahsulotini o‘chirasizmi?`
    )
  ) {
    return;
  }

  try {
    await api(
      `products?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",

        headers: {
          Prefer:
            "return=minimal"
        }
      }
    );

    await loadProducts();
    updateStats();

  } catch (error) {
    console.error(error);

    alert(
      "Mahsulotni o‘chirib bo‘lmadi."
    );
  }
}


/* =========================================
   RENDER PRODUCTS
========================================= */

function renderAdminProducts() {
  adminProducts.innerHTML = "";

  if (!products.length) {
    adminProducts.innerHTML = `
      <p class="drawer-empty">
        Hozircha mahsulot yo‘q.
      </p>
    `;

    return;
  }


  products.forEach(product => {
    const stock =
      Number(product.stock || 0);

    const item =
      document.createElement("div");

    item.className =
      "product-admin-item";


    item.innerHTML = `

      <img
        src="${esc(product.image_url || "")}"
        alt="${esc(product.name || "")}"
      >

      <div class="product-admin-info">

        <strong>
          ${esc(product.name || "")}
        </strong>

        <span>
          ${esc(product.category || "")}
        </span>

        <strong>
          ${money(product.price)}
        </strong>

        ${
          product.old_price &&
          Number(product.old_price) >
          Number(product.price)
            ? `
              <span style="text-decoration:line-through">
                ${money(product.old_price)}
              </span>
            `
            : ""
        }

        ${
          Number(product.discount_percent || 0) > 0
            ? `
              <span style="
                color:#6f35e8;
                font-weight:900;
              ">
                -${Number(product.discount_percent)}%
              </span>
            `
            : ""
        }

        ${
          stock > 0
            ? `
              <span style="
                color:#16835a;
                font-weight:900;
              ">
                Omborda: ${stock} dona
              </span>
            `
            : `
              <span style="
                color:#d6455d;
                font-weight:900;
              ">
                Tugagan
              </span>
            `
        }

      </div>


      <div class="product-admin-actions">

        <button
          class="small-btn edit-product-btn"
          data-id="${product.id}"
          type="button"
        >
          ✏️ Tahrirlash
        </button>

        <button
          class="small-btn copy-target-btn"
          data-id="${product.id}"
          type="button"
        >
          🔗 Link
        </button>

        <button
          class="small-btn delete-product-btn"
          data-id="${product.id}"
          type="button"
        >
          🗑 O‘chirish
        </button>

      </div>
    `;


    adminProducts.appendChild(
      item
    );
  });


  document
    .querySelectorAll(".edit-product-btn")
    .forEach(button => {
      button.onclick = () =>
        editProduct(
          button.dataset.id
        );
    });


  document
    .querySelectorAll(".delete-product-btn")
    .forEach(button => {
      button.onclick = () =>
        deleteProduct(
          button.dataset.id
        );
    });


  document
    .querySelectorAll(".copy-target-btn")
    .forEach(button => {
      button.onclick = async () => {
        const link =
          productLink(
            button.dataset.id
          );

        try {
          await navigator.clipboard
            .writeText(link);

          const old =
            button.textContent;

          button.textContent =
            "Nusxalandi ✅";

          setTimeout(() => {
            button.textContent =
              old;
          }, 1400);

        } catch {
          prompt(
            "Mahsulot linki:",
            link
          );
        }
      };
    });
}


/* =========================================
   ORDER STATUS INFO
========================================= */

function statusInfo(status) {
  switch (status) {
    case "talked":
      return {
        text: "Gaplashildi",
        icon: "🟠",
        className:
          "status-talked"
      };

    case "confirmed":
      return {
        text: "Tasdiqlandi",
        icon: "🔵",
        className:
          "status-confirmed"
      };

    case "delivery":
      return {
        text: "Yetkazishda",
        icon: "🟣",
        className:
          "status-delivery"
      };

    case "done":
      return {
        text: "Yakunlandi",
        icon: "🟢",
        className:
          "status-done"
      };

    case "cancelled":
      return {
        text: "Bekor qilindi",
        icon: "⚪",
        className:
          "status-cancelled"
      };

    default:
      return {
        text: "Yangi",
        icon: "🔴",
        className:
          "status-new"
      };
  }
}


function statusUsesStock(status) {
  return [
    "confirmed",
    "delivery",
    "done"
  ].includes(status);
}


/* =========================================
   ORDERS LOAD
========================================= */

async function loadOrders() {
  try {
    orders = await api(
      "orders?select=*&order=id.desc"
    );

    renderOrders();

  } catch (error) {
    console.error("ORDERS:", error);

    setMessage(
      ordersMessage,
      "Buyurtmalarni yuklab bo‘lmadi.",
      "error"
    );
  }
}


/* =========================================
   FILTER ORDERS
========================================= */

function filteredOrders() {
  const search =
    adminOrderSearch.value
      .trim()
      .toLowerCase();

  return orders.filter(order => {
    const status =
      order.status || "new";

    const statusOk =
      currentOrderStatus === "all" ||
      status === currentOrderStatus;

    const text = `
      ${order.id || ""}
      ${order.name || ""}
      ${order.surname || ""}
      ${order.phone || ""}
      ${order.product || ""}
      ${order.size || ""}
      ${order.color || ""}
      ${order.region || ""}
      ${order.address || ""}
    `.toLowerCase();

    return (
      statusOk &&
      text.includes(search)
    );
  });
}


/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders() {
  const list =
    filteredOrders();

  visibleOrderCount.textContent =
    `${list.length} ta`;

  renderDesktopOrders(list);
  renderMobileOrders(list);
}


/* =========================================
   DESKTOP ORDERS
========================================= */

function renderDesktopOrders(list) {
  if (!list.length) {
    ordersBody.innerHTML = `
      <tr>
        <td colspan="9">
          Buyurtma topilmadi.
        </td>
      </tr>
    `;

    return;
  }


  ordersBody.innerHTML =
    list.map(order => {
      const status =
        statusInfo(
          order.status || "new"
        );

      return `
        <tr class="order-row ${status.className}">

          <td>
            #${order.id}
          </td>

          <td>
            <strong>
              ${esc(order.name || "")}
            </strong>

            <small style="
              display:block;
              margin-top:3px;
              color:#888;
            ">
              ${esc(formatDate(order.created_at))}
            </small>
          </td>

          <td>
            <a
              href="tel:${esc(normalizePhone(order.phone))}"
              class="order-phone-link"
            >
              📞 ${esc(order.phone || "")}
            </a>
          </td>

          <td>
            ${esc(order.product || "")}
          </td>

          <td>
            ${Number(order.quantity || 1)}
          </td>

          <td>
            ${esc(order.size || "-")}
          </td>

          <td>
            ${esc(order.color || "-")}
          </td>

          <td>
            ${statusSelectHtml(order)}
          </td>

          <td>

            <div class="order-actions">

              <a
                href="tel:${esc(normalizePhone(order.phone))}"
                class="small-btn call-order-btn"
              >
                📞
              </a>

              ${
                (order.status || "new") === "new"
                  ? `
                    <button
                      class="small-btn quick-talked-btn"
                      data-id="${order.id}"
                      type="button"
                    >
                      Gaplashildi
                    </button>
                  `
                  : ""
              }

            </div>

          </td>

        </tr>
      `;
    }).join("");

  connectOrderButtons();
}


/* =========================================
   STATUS SELECT
========================================= */

function statusSelectHtml(order) {
  const status =
    statusInfo(order.status || "new");

  return `
    <select
      class="order-status-select ${status.className}"
      data-id="${order.id}"
    >

      <option value="new"
        ${(order.status || "new") === "new" ? "selected" : ""}
      >
        🔴 Yangi
      </option>

      <option value="talked"
        ${order.status === "talked" ? "selected" : ""}
      >
        🟠 Gaplashildi
      </option>

      <option value="confirmed"
        ${order.status === "confirmed" ? "selected" : ""}
      >
        🔵 Tasdiqlandi
      </option>

      <option value="delivery"
        ${order.status === "delivery" ? "selected" : ""}
      >
        🟣 Yetkazishda
      </option>

      <option value="done"
        ${order.status === "done" ? "selected" : ""}
      >
        🟢 Yakunlandi
      </option>

      <option value="cancelled"
        ${order.status === "cancelled" ? "selected" : ""}
      >
        ⚪ Bekor qilindi
      </option>

    </select>
  `;
}


/* =========================================
   MOBILE ORDERS
========================================= */

function renderMobileOrders(list) {
  if (!list.length) {
    mobileOrders.innerHTML = `
      <div class="drawer-empty">
        Buyurtma topilmadi.
      </div>
    `;

    return;
  }


  mobileOrders.innerHTML =
    list.map(order => {
      const status =
        statusInfo(
          order.status || "new"
        );

      return `
        <article
          class="mobile-order-card ${status.className}"
        >

          <div class="mobile-order-top">

            <div>
              <span class="mobile-order-id">
                #${order.id}
              </span>

              <strong>
                ${esc(order.name || "")}
              </strong>
            </div>

            <span
              class="mobile-status-badge ${status.className}"
            >
              ${status.icon}
              ${status.text}
            </span>

          </div>


          <div class="mobile-order-product">

            <span>
              Mahsulot
            </span>

            <strong>
              ${esc(order.product || "")}
            </strong>

          </div>


          <div class="mobile-order-grid">

            <div>
              <span>Soni</span>
              <strong>
                ${Number(order.quantity || 1)}
              </strong>
            </div>

            <div>
              <span>O‘lcham</span>
              <strong>
                ${esc(order.size || "-")}
              </strong>
            </div>

            <div>
              <span>Rang</span>
              <strong>
                ${esc(order.color || "-")}
              </strong>
            </div>

          </div>


          <a
            href="tel:${esc(normalizePhone(order.phone))}"
            class="mobile-order-phone"
          >
            📞 ${esc(order.phone || "")}
          </a>


          ${statusSelectHtml(order)}


          <small class="mobile-order-date">
            ${esc(formatDate(order.created_at))}
          </small>

        </article>
      `;
    }).join("");

  connectOrderButtons();
}


/* =========================================
   CONNECT ORDER BUTTONS
========================================= */

function connectOrderButtons() {
  document
    .querySelectorAll(".order-status-select")
    .forEach(select => {
      select.onchange =
        async () => {
          await changeOrderStatus(
            select.dataset.id,
            select.value
          );
        };
    });


  document
    .querySelectorAll(".quick-talked-btn")
    .forEach(button => {
      button.onclick =
        async () => {
          await changeOrderStatus(
            button.dataset.id,
            "talked"
          );
        };
    });
}


/* =========================================
   STOCK + STATUS
========================================= */

async function changeOrderStatus(
  id,
  newStatus
) {
  try {
    const rows = await api(
      `orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
    );

    const order =
      rows?.[0];

    if (!order) {
      throw new Error(
        "Buyurtma topilmadi."
      );
    }


    const quantity =
      Math.max(
        1,
        Number(order.quantity || 1)
      );

    const productId =
      order.product_id;

    let stockAdjusted =
      order.stock_adjusted === true;

    const shouldUseStock =
      statusUsesStock(newStatus);


    /* STOCKNI KAMAYTIRISH */

    if (
      shouldUseStock &&
      !stockAdjusted &&
      productId
    ) {
      const productRows =
        await api(
          `products?select=id,name,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
        );

      const product =
        productRows?.[0];

      if (!product) {
        throw new Error(
          "Mahsulot topilmadi."
        );
      }

      const currentStock =
        Number(product.stock || 0);


      if (
        currentStock <
        quantity
      ) {
        alert(
          `Omborda yetarli mahsulot yo‘q.\nOmborda: ${currentStock} dona\nBuyurtma: ${quantity} dona`
        );

        renderOrders();
        return;
      }


      await api(
        `products?id=eq.${encodeURIComponent(productId)}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal"
          },

          body: JSON.stringify({
            stock:
              currentStock -
              quantity
          })
        }
      );


      stockAdjusted = true;
    }


    /* STOCKNI QAYTARISH */

    if (
      !shouldUseStock &&
      stockAdjusted &&
      productId
    ) {
      const productRows =
        await api(
          `products?select=id,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
        );

      const product =
        productRows?.[0];

      if (product) {
        const currentStock =
          Number(product.stock || 0);

        await api(
          `products?id=eq.${encodeURIComponent(productId)}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body: JSON.stringify({
              stock:
                currentStock +
                quantity
            })
          }
        );
      }

      stockAdjusted = false;
    }


    const payload = {
      status: newStatus,

      stock_adjusted:
        stockAdjusted,

      updated_at:
        new Date().toISOString()
    };


    if (newStatus === "talked") {
      payload.talked_at =
        new Date().toISOString();
    }


    await api(
      `orders?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Prefer:
            "return=minimal"
        },

        body:
          JSON.stringify(payload)
      }
    );


    await Promise.all([
      loadOrders(),
      loadProducts()
    ]);

    updateStats();
    updateOrderStats();

  } catch (error) {
    console.error(
      "STATUS XATO:",
      error
    );

    alert(
      error.message ||
      "Statusni o‘zgartirib bo‘lmadi."
    );

    renderOrders();
  }
}


/* =========================================
   ORDER FILTER
========================================= */

document
  .querySelectorAll(".order-filter-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {
        currentOrderStatus =
          button.dataset.status;

        document
          .querySelectorAll(".order-filter-btn")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        renderOrders();
      }
    );
  });


adminOrderSearch.addEventListener(
  "input",
  renderOrders
);


clearOrderSearch.addEventListener(
  "click",
  () => {
    adminOrderSearch.value = "";
    renderOrders();
    adminOrderSearch.focus();
  }
);


/* =========================================
   OPERATORS LOAD
========================================= */

async function loadOperators() {
  try {
    operators = await api(
      "profiles?select=id,name,role,active&role=eq.operator&order=name.asc"
    );

    renderOperators();

  } catch (error) {
    console.error("OPERATORS:", error);

    operators = [];
    renderOperators();
  }
}


/* =========================================
   RENDER OPERATORS
========================================= */

function renderOperators() {
  if (!operators.length) {
    operatorsList.innerHTML = `
      <p class="drawer-empty">
        Operator yo‘q.
      </p>
    `;

    return;
  }


  operatorsList.innerHTML =
    operators.map(operator => `
      <div class="support-item">

        <div>

          <strong>
            ${esc(operator.name || "Operator")}
          </strong>

          <div style="
            margin-top:4px;
            font-size:12px;
            color:${
              operator.active
                ? "#16835a"
                : "#d6455d"
            };
          ">
            ${
              operator.active
                ? "● Faol"
                : "● Bloklangan"
            }
          </div>

        </div>


        <button
          class="small-btn operator-toggle"
          data-id="${operator.id}"
          data-active="${operator.active}"
          type="button"
        >
          ${
            operator.active
              ? "Bloklash"
              : "Faollashtirish"
          }
        </button>

      </div>
    `).join("");


  document
    .querySelectorAll(".operator-toggle")
    .forEach(button => {

      button.onclick =
        async () => {

          const newActive =
            button.dataset.active !== "true";

          try {
            await api(
              `profiles?id=eq.${encodeURIComponent(button.dataset.id)}`,
              {
                method: "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",

                  Prefer:
                    "return=minimal"
                },

                body: JSON.stringify({
                  active:
                    newActive
                })
              }
            );

            await loadOperators();

            updateStats();

          } catch (error) {
            console.error(error);

            alert(
              "Operator holatini o‘zgartirib bo‘lmadi."
            );
          }
        };
    });
}


/* =========================================
   CREATE OPERATOR
========================================= */

operatorCreateForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const button =
      operatorCreateForm.querySelector(
        'button[type="submit"]'
      );

    button.disabled = true;
    button.textContent =
      "Yaratilmoqda...";

    setMessage(
      operatorCreateMessage,
      ""
    );


    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/smart-endpoint`,
        {
          method: "POST",

          headers: {
            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name:
                opName.value.trim(),

              email:
                newOpEmail.value.trim(),

              password:
                newOpPassword.value
            })
        }
      );


      let data = {};

      try {
        data =
          await response.json();
      } catch {}


      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Operator yaratilmadi."
        );
      }


      setMessage(
        operatorCreateMessage,
        "Operator yaratildi ✅",
        "success"
      );

      operatorCreateForm.reset();

      await loadOperators();

      updateStats();

    } catch (error) {
      console.error(
        "CREATE OPERATOR:",
        error
      );

      setMessage(
        operatorCreateMessage,
        error.message ||
        "Operator yaratilmadi.",
        "error"
      );

    } finally {
      button.disabled = false;
      button.textContent =
        "Operator yaratish";
    }
  }
);


/* =========================================
   SUPPORT
========================================= */

async function loadSupport() {
  try {
    supportRequests = await api(
      "support_requests?select=*&order=id.desc"
    );

    renderSupport();

  } catch (error) {
    console.error("SUPPORT:", error);

    adminSupportList.innerHTML = `
      <p class="drawer-empty">
        Murojaatlarni yuklab bo‘lmadi.
      </p>
    `;
  }
}


function renderSupport() {
  if (!supportRequests.length) {
    adminSupportList.innerHTML = `
      <p class="drawer-empty">
        Hozircha murojaat yo‘q.
      </p>
    `;

    return;
  }


  adminSupportList.innerHTML =
    supportRequests.map(item => `
      <div class="support-item">

        <div>

          <strong>
            ${esc(item.name || "")}
          </strong>

          <p style="
            margin:6px 0;
            color:#666;
          ">
            ${esc(item.message || "")}
          </p>

          <a
            href="tel:${esc(normalizePhone(item.phone))}"
          >
            📞 ${esc(item.phone || "")}
          </a>

        </div>

        <span class="badge">
          ${esc(item.status || "new")}
        </span>

      </div>
    `).join("");
}


/* =========================================
   START
========================================= */

restoreSession();
