/* =========================================
   MODEX.UZ ADMIN PANEL
========================================= */

const CONFIG = window.MODEX_CONFIG || {};

const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_KEY = CONFIG.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  alert("config.js topilmadi yoki noto‘g‘ri.");
  throw new Error("MODEX_CONFIG topilmadi.");
}

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

let token = "";
let user = null;

let products = [];
let orders = [];
let operators = [];
let supportRequests = [];

let orderFilter = "all";


/* =========================================
   ELEMENTLAR
========================================= */

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");

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
const operatorCreateMessage = document.getElementById("operatorCreateMessage");
const operatorsList = document.getElementById("operatorsList");


/* ORDERS */

const adminOrderSearch = document.getElementById("adminOrderSearch");
const clearOrderSearch = document.getElementById("clearOrderSearch");

const ordersBody = document.getElementById("ordersBody");
const mobileOrders = document.getElementById("mobileOrders");
const ordersMessage = document.getElementById("ordersMessage");
const visibleOrderCount = document.getElementById("visibleOrderCount");


/* SUPPORT */

const adminSupportList = document.getElementById("adminSupportList");


/* STATS */

const aProducts = document.getElementById("aProducts");
const aOrders = document.getElementById("aOrders");
const aNew = document.getElementById("aNew");
const aOperators = document.getElementById("aOperators");

const todayOrdersCount = document.getElementById("todayOrdersCount");
const newOrdersCount = document.getElementById("newOrdersCount");
const talkedOrdersCount = document.getElementById("talkedOrdersCount");
const confirmedOrdersCount = document.getElementById("confirmedOrdersCount");
const deliveryOrdersCount = document.getElementById("deliveryOrdersCount");
const doneOrdersCount = document.getElementById("doneOrdersCount");


/* =========================================
   HELPERS
========================================= */

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[ch]);
}


function setMessage(el, text, type = "") {
  if (!el) return;

  el.textContent = text;
  el.className = `form-message ${type}`.trim();
}


function money(value) {
  return (
    new Intl.NumberFormat("uz-UZ").format(Number(value || 0))
    + " so‘m"
  );
}


function phoneClean(value = "") {
  return String(value).replace(/[^\d+]/g, "");
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

  const d = new Date(value);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}


function showLogin() {
  loginView.classList.remove("hidden");
  adminView.classList.add("hidden");
}


function showAdmin() {
  loginView.classList.add("hidden");
  adminView.classList.remove("hidden");
}


/* =========================================
   AUTH LOGIN
========================================= */

async function login(email, password) {
  const res = await fetch(
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error_description ||
      data.msg ||
      data.message ||
      "Email yoki parol noto‘g‘ri."
    );
  }

  return data;
}


async function getUser() {
  const res = await fetch(
    `${AUTH}/user`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Sessiya tugagan.");
  }

  return data;
}


/* =========================================
   REST API
========================================= */

async function api(path, options = {}) {
  const res = await fetch(
    `${REST}/${path}`,
    {
      ...options,

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    }
  );

  if (!res.ok) {
    const text = await res.text();

    throw new Error(
      text || `HTTP ${res.status}`
    );
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();

  return text ? JSON.parse(text) : null;
}


/* =========================================
   ADMIN ROLE
========================================= */

async function checkAdmin(uid) {
  const rows = await api(
    `profiles?select=id,name,role,active&id=eq.${encodeURIComponent(uid)}&limit=1`
  );

  const profile = rows?.[0];

  if (!profile) {
    throw new Error("Admin profili topilmadi.");
  }

  if (profile.role !== "admin") {
    throw new Error("Bu akkaunt admin emas.");
  }

  if (profile.active !== true) {
    throw new Error("Admin akkaunti faol emas.");
  }

  return profile;
}


/* =========================================
   LOGIN FORM
========================================= */

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const button =
    loginForm.querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = "Kirilmoqda...";

  setMessage(
    loginMessage,
    "Tekshirilmoqda..."
  );

  try {

    const auth = await login(
      emailInput.value.trim(),
      passwordInput.value
    );

    token = auth.access_token;
    user = auth.user;

    await checkAdmin(user.id);

    sessionStorage.setItem(
      "modex_admin_token",
      token
    );

    adminEmail.textContent =
      user.email || "";

    showAdmin();

    setMessage(loginMessage, "");

    await loadAll();

  } catch (error) {

    console.error("LOGIN:", error);

    token = "";
    user = null;

    sessionStorage.removeItem(
      "modex_admin_token"
    );

    showLogin();

    setMessage(
      loginMessage,
      error.message,
      "error"
    );

  } finally {

    button.disabled = false;
    button.textContent = "Kirish";

  }
});


/* =========================================
   SESSION
========================================= */

async function restoreSession() {

  const saved =
    sessionStorage.getItem(
      "modex_admin_token"
    );

  if (!saved) {
    showLogin();
    return;
  }

  token = saved;

  try {

    user = await getUser();

    await checkAdmin(user.id);

    adminEmail.textContent =
      user.email || "";

    showAdmin();

    await loadAll();

  } catch (error) {

    console.error("SESSION:", error);

    token = "";
    user = null;

    sessionStorage.removeItem(
      "modex_admin_token"
    );

    showLogin();
  }
}


/* =========================================
   LOGOUT
========================================= */

logoutBtn.addEventListener("click", async () => {

  try {

    await fetch(
      `${AUTH}/logout`,
      {
        method: "POST",

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`
        }
      }
    );

  } catch {}

  token = "";
  user = null;

  sessionStorage.removeItem(
    "modex_admin_token"
  );

  showLogin();
});


/* =========================================
   LOAD ALL
========================================= */

async function loadAll() {

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

      await loadAll();

    } finally {

      refreshAdminBtn.disabled = false;
      refreshAdminBtn.textContent =
        "🔄 Yangilash";

    }
  }
);


/* =========================================
   PRODUCTS LOAD
========================================= */

async function loadProducts() {

  try {

    products = await api(
      "products?select=*&order=id.desc"
    );

    renderProducts();

  } catch (error) {

    console.error("PRODUCT:", error);

    products = [];

    setMessage(
      productMessage,
      "Mahsulotlar yuklanmadi.",
      "error"
    );

  }
}


/* =========================================
   PRODUCT RENDER
========================================= */

function renderProducts() {

  if (!products.length) {

    adminProducts.innerHTML = `
      <p class="drawer-empty">
        Mahsulot yo‘q.
      </p>
    `;

    return;
  }


  adminProducts.innerHTML =
    products.map(product => `

      <div class="product-admin-item">

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

          <span>
            Omborda:
            ${Number(product.stock || 0)}
            dona
          </span>

        </div>


        <div class="product-admin-actions">

          <button
            type="button"
            class="small-btn editProduct"
            data-id="${product.id}"
          >
            ✏️ Tahrirlash
          </button>

          <button
            type="button"
            class="small-btn deleteProduct"
            data-id="${product.id}"
          >
            🗑 O‘chirish
          </button>

        </div>

      </div>

    `).join("");


  document
    .querySelectorAll(".editProduct")
    .forEach(btn => {

      btn.onclick = () =>
        startEditProduct(
          btn.dataset.id
        );

    });


  document
    .querySelectorAll(".deleteProduct")
    .forEach(btn => {

      btn.onclick = () =>
        deleteProduct(
          btn.dataset.id
        );

    });
}


/* =========================================
   IMAGE UPLOAD
========================================= */

async function uploadImage(file) {

  if (!file) return null;

  const ext =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const name =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;


  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/products/${name}`,
    {
      method: "POST",

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type":
          file.type ||
          "application/octet-stream"
      },

      body: file
    }
  );


  if (!res.ok) {
    throw new Error(
      await res.text()
    );
  }


  return (
    `${SUPABASE_URL}/storage/v1/object/public/products/${name}`
  );
}


/* =========================================
   PRODUCT SAVE
========================================= */

productForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    productSubmitBtn.disabled = true;


    try {

      const id =
        editProductId.value;

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

        price:
          Number(pPrice.value || 0),

        old_price:
          pOldPrice.value
            ? Number(pOldPrice.value)
            : null,

        discount_percent:
          Math.max(
            0,
            Math.min(
              100,
              Number(pDiscount.value || 0)
            )
          ),

        stock:
          Math.max(
            0,
            Math.floor(
              Number(pStock.value || 0)
            )
          ),

        description:
          pDesc.value.trim(),

        active: true

      };


      if (imageUrl) {
        payload.image_url =
          imageUrl;
      }


      if (id) {

        await api(
          `products?id=eq.${encodeURIComponent(id)}`,
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

      console.error(
        "PRODUCT SAVE:",
        error
      );

      setMessage(
        productMessage,
        error.message ||
        "Mahsulot saqlanmadi.",
        "error"
      );

    } finally {

      productSubmitBtn.disabled =
        false;

    }
  }
);


/* =========================================
   PRODUCT EDIT
========================================= */

function startEditProduct(id) {

  const product =
    products.find(
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
    product.discount_percent || 0;

  pStock.value =
    product.stock || 0;

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
    behavior: "smooth"
  });
}


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
  resetProductForm
);


/* =========================================
   PRODUCT DELETE
========================================= */

async function deleteProduct(id) {

  if (
    !confirm(
      "Mahsulotni butunlay o‘chirasizmi?"
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
   ORDER STATUS
========================================= */

function statusInfo(status = "new") {

  const map = {

    new: [
      "🔴",
      "Yangi",
      "status-new"
    ],

    talked: [
      "🟠",
      "Gaplashildi",
      "status-talked"
    ],

    confirmed: [
      "🔵",
      "Tasdiqlandi",
      "status-confirmed"
    ],

    delivery: [
      "🟣",
      "Yetkazishda",
      "status-delivery"
    ],

    done: [
      "🟢",
      "Yakunlandi",
      "status-done"
    ],

    cancelled: [
      "⚪",
      "Bekor qilindi",
      "status-cancelled"
    ]
  };


  const item =
    map[status] || map.new;


  return {

    icon: item[0],

    text: item[1],

    className: item[2]

  };
}


function usesStock(status) {

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

    console.error(
      "ORDERS:",
      error
    );

    orders = [];

    setMessage(
      ordersMessage,
      "Buyurtmalar yuklanmadi.",
      "error"
    );

  }
}


/* =========================================
   ORDER FILTER
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
      orderFilter === "all" ||
      status === orderFilter;


    const text = `
      ${order.id || ""}
      ${order.name || ""}
      ${order.phone || ""}
      ${order.product || ""}
      ${order.size || ""}
      ${order.color || ""}
    `.toLowerCase();


    return (
      statusOk &&
      text.includes(search)
    );

  });
}


/* =========================================
   STATUS SELECT
========================================= */

function statusSelect(order) {

  const status =
    order.status || "new";

  const info =
    statusInfo(status);


  return `

    <select
      class="order-status-select ${info.className}"
      data-id="${order.id}"
    >

      <option
        value="new"
        ${status === "new" ? "selected" : ""}
      >
        🔴 Yangi
      </option>

      <option
        value="talked"
        ${status === "talked" ? "selected" : ""}
      >
        🟠 Gaplashildi
      </option>

      <option
        value="confirmed"
        ${status === "confirmed" ? "selected" : ""}
      >
        🔵 Tasdiqlandi
      </option>

      <option
        value="delivery"
        ${status === "delivery" ? "selected" : ""}
      >
        🟣 Yetkazishda
      </option>

      <option
        value="done"
        ${status === "done" ? "selected" : ""}
      >
        🟢 Yakunlandi
      </option>

      <option
        value="cancelled"
        ${status === "cancelled" ? "selected" : ""}
      >
        ⚪ Bekor qilindi
      </option>

    </select>

  `;
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

      const info =
        statusInfo(
          order.status || "new"
        );


      return `

        <tr
          class="order-row ${info.className}"
        >

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
              href="tel:${esc(phoneClean(order.phone))}"
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
            ${statusSelect(order)}
          </td>


          <td>

            <div class="order-actions">

              <a
                class="small-btn call-order-btn"
                href="tel:${esc(phoneClean(order.phone))}"
              >
                📞
              </a>


              <button
                class="small-btn delete-order-btn"
                data-id="${order.id}"
                type="button"
                title="Buyurtmani o‘chirish"
              >
                🗑
              </button>

            </div>

          </td>

        </tr>

      `;

    }).join("");


  connectOrderButtons();
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

      const info =
        statusInfo(
          order.status || "new"
        );


      return `

        <article
          class="mobile-order-card ${info.className}"
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
              class="mobile-status-badge ${info.className}"
            >
              ${info.icon}
              ${info.text}
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

              <span>
                Soni
              </span>

              <strong>
                ${Number(order.quantity || 1)}
              </strong>

            </div>


            <div>

              <span>
                O‘lcham
              </span>

              <strong>
                ${esc(order.size || "-")}
              </strong>

            </div>


            <div>

              <span>
                Rang
              </span>

              <strong>
                ${esc(order.color || "-")}
              </strong>

            </div>

          </div>


          <a
            href="tel:${esc(phoneClean(order.phone))}"
            class="mobile-order-phone"
          >
            📞 ${esc(order.phone || "")}
          </a>


          ${statusSelect(order)}


          <button
            class="small-btn delete-order-btn"
            data-id="${order.id}"
            type="button"
            style="
              width:100%;
              margin-top:8px;
              color:#d6455d;
            "
          >
            🗑 Buyurtmani o‘chirish
          </button>


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
    .querySelectorAll(
      ".order-status-select"
    )
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
    .querySelectorAll(
      ".delete-order-btn"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          await deleteOrder(
            button.dataset.id
          );

        };

    });
}


/* =========================================
   CHANGE ORDER STATUS
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


    const qty =
      Math.max(
        1,
        Number(order.quantity || 1)
      );


    const productId =
      order.product_id;


    let adjusted =
      order.stock_adjusted === true;


    const needStock =
      usesStock(newStatus);


    /* STOCK KAMAYTIRISH */

    if (
      needStock &&
      !adjusted &&
      productId
    ) {

      const pRows =
        await api(
          `products?select=id,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
        );


      const product =
        pRows?.[0];


      if (!product) {

        throw new Error(
          "Mahsulot topilmadi."
        );

      }


      const stock =
        Number(product.stock || 0);


      if (stock < qty) {

        alert(
          `Omborda yetarli mahsulot yo‘q.\n\nOmborda: ${stock} dona\nBuyurtma: ${qty} dona`
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

          body:
            JSON.stringify({
              stock:
                stock - qty
            })
        }
      );


      adjusted = true;
    }


    /* STOCK QAYTARISH */

    if (
      !needStock &&
      adjusted &&
      productId
    ) {

      const pRows =
        await api(
          `products?select=id,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
        );


      const product =
        pRows?.[0];


      if (product) {

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

            body:
              JSON.stringify({
                stock:
                  Number(product.stock || 0)
                  + qty
              })
          }
        );

      }


      adjusted = false;
    }


    const payload = {

      status:
        newStatus,

      stock_adjusted:
        adjusted,

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
      "STATUS:",
      error
    );


    alert(
      error.message ||
      "Status o‘zgarmadi."
    );


    renderOrders();

  }
}


/* =========================================
   DELETE ORDER
========================================= */

async function deleteOrder(id) {

  const order =
    orders.find(
      item =>
        Number(item.id) === Number(id)
    );


  if (!order) {

    alert(
      "Buyurtma topilmadi."
    );

    return;
  }


  const ok =
    confirm(
      `#${order.id} buyurtmani butunlay o‘chirasizmi?\n\nMijoz: ${order.name || "-"}\nTelefon: ${order.phone || "-"}\n\nBu amalni ortga qaytarib bo‘lmaydi.`
    );


  if (!ok) return;


  try {

    /*
      Agar stock oldin kamaygan bo‘lsa,
      o‘chirishdan oldin qaytaramiz.
    */

    if (
      order.stock_adjusted === true &&
      order.product_id
    ) {

      const productRows =
        await api(
          `products?select=id,stock&id=eq.${encodeURIComponent(order.product_id)}&limit=1`
        );


      const product =
        productRows?.[0];


      if (product) {

        const qty =
          Math.max(
            1,
            Number(order.quantity || 1)
          );


        await api(
          `products?id=eq.${encodeURIComponent(order.product_id)}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify({
                stock:
                  Number(product.stock || 0)
                  + qty
              })
          }
        );

      }
    }


    /* BUYURTMANI O‘CHIRISH */

    await api(
      `orders?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",

        headers: {
          Prefer:
            "return=minimal"
        }
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
      "ORDER DELETE:",
      error
    );


    alert(
      error.message ||
      "Buyurtmani o‘chirib bo‘lmadi."
    );

  }
}


/* =========================================
   ORDER FILTER BUTTONS
========================================= */

document
  .querySelectorAll(
    ".order-filter-btn"
  )
  .forEach(btn => {

    btn.onclick = () => {

      orderFilter =
        btn.dataset.status;


      document
        .querySelectorAll(
          ".order-filter-btn"
        )
        .forEach(item =>
          item.classList.remove(
            "active"
          )
        );


      btn.classList.add(
        "active"
      );


      renderOrders();

    };

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

  }
);


/* =========================================
   OPERATORS
========================================= */

async function loadOperators() {

  try {

    operators = await api(
      "profiles?select=id,name,role,active&role=eq.operator&order=name.asc"
    );


    renderOperators();

  } catch (error) {

    console.error(
      "OPERATORS:",
      error
    );


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
    operators.map(op => `

      <div class="support-item">

        <div>

          <strong>
            ${esc(op.name || "Operator")}
          </strong>

          <div style="
            margin-top:5px;
            color:${op.active ? "#16835a" : "#d6455d"};
          ">

            ${
              op.active
                ? "🟢 Faol"
                : "🔴 Bloklangan"
            }

          </div>

        </div>


        <button
          class="small-btn opToggle"
          data-id="${op.id}"
          data-active="${op.active}"
          type="button"
        >

          ${
            op.active
              ? "Bloklash"
              : "Faollashtirish"
          }

        </button>

      </div>

    `).join("");


  document
    .querySelectorAll(
      ".opToggle"
    )
    .forEach(btn => {

      btn.onclick =
        async () => {

          const active =
            btn.dataset.active !== "true";


          try {

            await api(
              `profiles?id=eq.${encodeURIComponent(btn.dataset.id)}`,
              {
                method: "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",

                  Prefer:
                    "return=minimal"
                },

                body:
                  JSON.stringify({
                    active
                  })
              }
            );


            await loadOperators();

            updateStats();


          } catch (error) {

            console.error(error);

            alert(
              "Operatorni o‘zgartirib bo‘lmadi."
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


    try {

      const res =
        await fetch(
          `${SUPABASE_URL}/functions/v1/smart-endpoint`,
          {
            method: "POST",

            headers: {
              apikey:
                SUPABASE_KEY,

              Authorization:
                `Bearer ${token}`,

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


      const data =
        await res
          .json()
          .catch(() => ({}));


      if (!res.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Operator yaratilmadi."
        );

      }


      operatorCreateForm.reset();


      setMessage(
        operatorCreateMessage,
        "Operator yaratildi ✅",
        "success"
      );


      await loadOperators();

      updateStats();


    } catch (error) {

      console.error(
        "OPERATOR CREATE:",
        error
      );


      setMessage(
        operatorCreateMessage,
        error.message,
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

    supportRequests =
      await api(
        "support_requests?select=*&order=id.desc"
      );


    renderSupport();


  } catch (error) {

    console.error(
      "SUPPORT:",
      error
    );


    supportRequests = [];


    adminSupportList.innerHTML = `

      <p class="drawer-empty">

        Murojaatlar yuklanmadi.

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

          <p>
            ${esc(item.message || "")}
          </p>

          <a
            href="tel:${esc(phoneClean(item.phone))}"
          >
            📞 ${esc(item.phone || "")}
          </a>

        </div>

      </div>

    `).join("");
}


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
      item =>
        (item.status || "new") === "new"
    ).length;


  aOperators.textContent =
    operators.length;

}


function updateOrderStats() {

  todayOrdersCount.textContent =
    orders.filter(
      item =>
        isToday(item.created_at)
    ).length;


  newOrdersCount.textContent =
    orders.filter(
      item =>
        (item.status || "new") === "new"
    ).length;


  talkedOrdersCount.textContent =
    orders.filter(
      item =>
        item.status === "talked"
    ).length;


  confirmedOrdersCount.textContent =
    orders.filter(
      item =>
        item.status === "confirmed"
    ).length;


  deliveryOrdersCount.textContent =
    orders.filter(
      item =>
        item.status === "delivery"
    ).length;


  doneOrdersCount.textContent =
    orders.filter(
      item =>
        item.status === "done"
    ).length;

}


/* =========================================
   START
========================================= */

restoreSession();
