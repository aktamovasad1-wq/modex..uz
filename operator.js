/* =========================================
   MODEX.UZ OPERATOR PANEL
========================================= */

const CONFIG = window.MODEX_CONFIG || {};

const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_KEY = CONFIG.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  alert("config.js noto‘g‘ri yoki topilmadi.");
  throw new Error("MODEX_CONFIG topilmadi.");
}

const AUTH = `${SUPABASE_URL}/auth/v1`;
const REST = `${SUPABASE_URL}/rest/v1`;

let token = "";
let currentUser = null;
let currentProfile = null;

let orders = [];
let products = [];

let currentFilter = "all";


/* =========================================
   ELEMENTLAR
========================================= */

const operatorLoginView =
  document.getElementById("operatorLoginView");

const operatorView =
  document.getElementById("operatorView");

const operatorLoginForm =
  document.getElementById("operatorLoginForm");

const operatorEmail =
  document.getElementById("operatorEmail");

const operatorPassword =
  document.getElementById("operatorPassword");

const operatorLoginMessage =
  document.getElementById("operatorLoginMessage");

const operatorUserName =
  document.getElementById("operatorUserName");

const operatorRefreshBtn =
  document.getElementById("operatorRefreshBtn");

const operatorLogoutBtn =
  document.getElementById("operatorLogoutBtn");

const operatorNewCount =
  document.getElementById("operatorNewCount");

const operatorTalkedCount =
  document.getElementById("operatorTalkedCount");

const operatorConfirmedCount =
  document.getElementById("operatorConfirmedCount");

const operatorDoneCount =
  document.getElementById("operatorDoneCount");

const operatorOrderSearch =
  document.getElementById("operatorOrderSearch");

const operatorClearSearch =
  document.getElementById("operatorClearSearch");

const operatorVisibleCount =
  document.getElementById("operatorVisibleCount");

const operatorOrders =
  document.getElementById("operatorOrders");

const operatorOrdersMessage =
  document.getElementById("operatorOrdersMessage");

const operatorMobileNav =
  document.getElementById("operatorMobileNav");


/* MODAL */

const operatorOrderDialog =
  document.getElementById("operatorOrderDialog");

const operatorCloseOrder =
  document.getElementById("operatorCloseOrder");

const operatorOrderTitle =
  document.getElementById("operatorOrderTitle");

const operatorOrderForm =
  document.getElementById("operatorOrderForm");

const operatorEditOrderId =
  document.getElementById("operatorEditOrderId");

const operatorEditName =
  document.getElementById("operatorEditName");

const operatorEditSurname =
  document.getElementById("operatorEditSurname");

const operatorEditPhone =
  document.getElementById("operatorEditPhone");

const operatorEditProduct =
  document.getElementById("operatorEditProduct");

const operatorEditQuantity =
  document.getElementById("operatorEditQuantity");

const operatorEditSize =
  document.getElementById("operatorEditSize");

const operatorEditColor =
  document.getElementById("operatorEditColor");

const operatorEditRegion =
  document.getElementById("operatorEditRegion");

const operatorEditAddress =
  document.getElementById("operatorEditAddress");

const operatorEditNote =
  document.getElementById("operatorEditNote");

const operatorEditStatus =
  document.getElementById("operatorEditStatus");

const operatorCallCustomer =
  document.getElementById("operatorCallCustomer");

const operatorQrBtn =
  document.getElementById("operatorQrBtn");

const operatorOrderMessage =
  document.getElementById("operatorOrderMessage");


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


function showLogin() {
  operatorLoginView.classList.remove("hidden");
  operatorView.classList.add("hidden");
  operatorMobileNav.classList.add("hidden");
}


function showOperator() {
  operatorLoginView.classList.add("hidden");
  operatorView.classList.remove("hidden");
  operatorMobileNav.classList.remove("hidden");
}


/* =========================================
   AUTH
========================================= */

async function signIn(email, password) {
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


async function getCurrentUser() {
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
   REST
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
   OPERATOR ROLE CHECK
========================================= */

async function checkOperator(uid) {
  const rows = await api(
    `profiles?select=id,name,role,active&id=eq.${encodeURIComponent(uid)}&limit=1`
  );

  const profile = rows?.[0];

  if (!profile) {
    throw new Error("Operator profili topilmadi.");
  }

  if (profile.role !== "operator") {
    throw new Error("Bu akkaunt operator emas.");
  }

  if (profile.active !== true) {
    throw new Error("Operator akkaunti bloklangan.");
  }

  return profile;
}


/* =========================================
   LOGIN FORM
========================================= */

operatorLoginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const button =
    operatorLoginForm.querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = "Kirilmoqda...";

  setMessage(
    operatorLoginMessage,
    "Tekshirilmoqda..."
  );

  try {
    const auth = await signIn(
      operatorEmail.value.trim(),
      operatorPassword.value
    );

    token = auth.access_token;
    currentUser = auth.user;

    currentProfile =
      await checkOperator(currentUser.id);

    sessionStorage.setItem(
      "modex_operator_token",
      token
    );

    operatorUserName.textContent =
      currentProfile.name ||
      currentUser.email ||
      "Operator";

    setMessage(
      operatorLoginMessage,
      ""
    );

    showOperator();

    await loadAll();

  } catch (error) {
    console.error("OPERATOR LOGIN:", error);

    token = "";
    currentUser = null;
    currentProfile = null;

    sessionStorage.removeItem(
      "modex_operator_token"
    );

    showLogin();

    setMessage(
      operatorLoginMessage,
      error.message ||
      "Operator panelga kirib bo‘lmadi.",
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
      "modex_operator_token"
    );

  if (!saved) {
    showLogin();
    return;
  }

  token = saved;

  try {
    currentUser =
      await getCurrentUser();

    currentProfile =
      await checkOperator(
        currentUser.id
      );

    operatorUserName.textContent =
      currentProfile.name ||
      currentUser.email ||
      "Operator";

    showOperator();

    await loadAll();

  } catch (error) {
    console.error("OPERATOR SESSION:", error);

    token = "";
    currentUser = null;
    currentProfile = null;

    sessionStorage.removeItem(
      "modex_operator_token"
    );

    showLogin();
  }
}


/* =========================================
   LOGOUT
========================================= */

operatorLogoutBtn.addEventListener(
  "click",
  async () => {

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
    currentUser = null;
    currentProfile = null;

    sessionStorage.removeItem(
      "modex_operator_token"
    );

    operatorEmail.value = "";
    operatorPassword.value = "";

    showLogin();
  }
);


/* =========================================
   LOAD ALL
========================================= */

async function loadAll() {
  await Promise.all([
    loadProducts(),
    loadOrders()
  ]);

  updateStats();
}


operatorRefreshBtn.addEventListener(
  "click",
  async () => {

    operatorRefreshBtn.disabled = true;
    operatorRefreshBtn.textContent = "⏳";

    try {
      await loadAll();

    } finally {
      operatorRefreshBtn.disabled = false;
      operatorRefreshBtn.textContent = "🔄";
    }
  }
);


/* =========================================
   PRODUCTS
========================================= */

async function loadProducts() {
  try {
    products = await api(
      "products?select=id,name,stock&order=id.desc"
    );

  } catch (error) {
    console.error("PRODUCTS:", error);
    products = [];
  }
}


/* =========================================
   ORDERS
========================================= */

async function loadOrders() {
  try {
    orders = await api(
      "orders?select=*&order=id.desc"
    );

    renderOrders();

  } catch (error) {
    console.error("ORDERS:", error);

    orders = [];

    setMessage(
      operatorOrdersMessage,
      "Buyurtmalarni yuklab bo‘lmadi.",
      "error"
    );
  }
}


/* =========================================
   STATUS
========================================= */

function statusInfo(status = "new") {
  const map = {
    new: {
      text: "Yangi",
      icon: "🔴",
      className: "status-new"
    },

    talked: {
      text: "Gaplashildi",
      icon: "🟠",
      className: "status-talked"
    },

    confirmed: {
      text: "Tasdiqlandi",
      icon: "🔵",
      className: "status-confirmed"
    },

    delivery: {
      text: "Yetkazishda",
      icon: "🟣",
      className: "status-delivery"
    },

    done: {
      text: "Yakunlandi",
      icon: "🟢",
      className: "status-done"
    },

    cancelled: {
      text: "Bekor qilindi",
      icon: "⚪",
      className: "status-cancelled"
    }
  };

  return map[status] || map.new;
}


function usesStock(status) {
  return [
    "confirmed",
    "delivery",
    "done"
  ].includes(status);
}


/* =========================================
   FILTER
========================================= */

function filteredOrders() {
  const search =
    operatorOrderSearch.value
      .trim()
      .toLowerCase();

  return orders.filter(order => {
    const status =
      order.status || "new";

    const filterOk =
      currentFilter === "all" ||
      status === currentFilter;

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
      filterOk &&
      text.includes(search)
    );
  });
}


/* =========================================
   STATS
========================================= */

function updateStats() {
  operatorNewCount.textContent =
    orders.filter(
      order =>
        (order.status || "new") === "new"
    ).length;

  operatorTalkedCount.textContent =
    orders.filter(
      order =>
        order.status === "talked"
    ).length;

  operatorConfirmedCount.textContent =
    orders.filter(
      order =>
        order.status === "confirmed"
    ).length;

  operatorDoneCount.textContent =
    orders.filter(
      order =>
        order.status === "done"
    ).length;
}


/* =========================================
   ORDER CARDS
========================================= */

function renderOrders() {
  const list =
    filteredOrders();

  operatorVisibleCount.textContent =
    `${list.length} ta`;

  if (!list.length) {
    operatorOrders.innerHTML = `
      <div class="drawer-empty">
        Zayavka topilmadi.
      </div>
    `;

    return;
  }

  operatorOrders.innerHTML =
    list.map(order => {

      const info =
        statusInfo(
          order.status || "new"
        );

      return `
        <article
          class="operator-order-card ${info.className}"
        >

          <div class="operator-order-top">

            <div>
              <span class="operator-order-id">
                #${order.id}
              </span>

              <strong class="operator-order-name">
                ${esc(order.name || "Mijoz")}
                ${esc(order.surname || "")}
              </strong>
            </div>

            <span
              class="operator-order-status ${info.className}"
            >
              ${info.icon}
              ${info.text}
            </span>

          </div>


          <div class="operator-product-box">

            <span>
              Mahsulot
            </span>

            <strong>
              ${esc(order.product || "-")}
            </strong>

          </div>


          <div class="operator-order-info-grid">

            <div>
              <span>Soni</span>
              <strong>
                ${Number(order.quantity || 1)}
              </strong>
            </div>

            <div>
              <span>Razmer</span>
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


          ${
            order.region
              ? `
                <div class="operator-location">
                  📍 ${esc(order.region)}
                </div>
              `
              : ""
          }


          <a
            href="tel:${esc(phoneClean(order.phone))}"
            class="operator-call-btn"
          >
            📞 ${esc(order.phone || "Telefon yo‘q")}
          </a>


          <button
            class="operator-edit-order-btn"
            data-id="${order.id}"
            type="button"
          >
            ✏️ Zayavkani ochish
          </button>


          <small class="operator-order-date">
            ${esc(formatDate(order.created_at))}
          </small>

        </article>
      `;
    }).join("");

  connectOrderCards();
}


/* =========================================
   CONNECT CARDS
========================================= */

function connectOrderCards() {
  document
    .querySelectorAll(
      ".operator-edit-order-btn"
    )
    .forEach(button => {

      button.onclick = () => {
        openOrderDialog(
          button.dataset.id
        );
      };

    });
}


/* =========================================
   OPEN MODAL
========================================= */

function openOrderDialog(id) {
  const order =
    orders.find(
      item =>
        Number(item.id) === Number(id)
    );

  if (!order) return;

  operatorEditOrderId.value =
    order.id;

  operatorEditName.value =
    order.name || "";

  operatorEditSurname.value =
    order.surname || "";

  operatorEditPhone.value =
    order.phone || "";

  operatorEditProduct.value =
    order.product || "";

  operatorEditQuantity.value =
    Math.max(
      1,
      Number(order.quantity || 1)
    );

  operatorEditSize.value =
    order.size || "";

  operatorEditColor.value =
    order.color || "";

  operatorEditRegion.value =
    order.region || "";

  operatorEditAddress.value =
    order.address || "";

  operatorEditNote.value =
    order.note || "";

  operatorEditStatus.value =
    order.status || "new";

  operatorOrderTitle.textContent =
    `Buyurtma #${order.id}`;

  operatorCallCustomer.href =
    `tel:${phoneClean(order.phone)}`;

  setMessage(
    operatorOrderMessage,
    ""
  );

  updateModalStatusColor();

  operatorOrderDialog.showModal();
}


/* =========================================
   CLOSE MODAL
========================================= */

operatorCloseOrder.addEventListener(
  "click",
  () => {
    operatorOrderDialog.close();
  }
);


operatorOrderDialog.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      operatorOrderDialog
    ) {
      operatorOrderDialog.close();
    }
  }
);


/* =========================================
   MODAL STATUS COLOR
========================================= */

function updateModalStatusColor() {
  operatorEditStatus.classList.remove(
    "status-new",
    "status-talked",
    "status-confirmed",
    "status-delivery",
    "status-done",
    "status-cancelled"
  );

  operatorEditStatus.classList.add(
    statusInfo(
      operatorEditStatus.value
    ).className
  );
}


operatorEditStatus.addEventListener(
  "change",
  updateModalStatusColor
);


/* =========================================
   SAVE ORDER
========================================= */

operatorOrderForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const id =
      operatorEditOrderId.value;

    const order =
      orders.find(
        item =>
          Number(item.id) === Number(id)
      );

    if (!order) {
      setMessage(
        operatorOrderMessage,
        "Buyurtma topilmadi.",
        "error"
      );

      return;
    }

    const saveButton =
      operatorOrderForm.querySelector(
        'button[type="submit"]'
      );

    saveButton.disabled = true;
    saveButton.textContent =
      "Saqlanmoqda...";

    try {
      const newStatus =
        operatorEditStatus.value;

      const newQuantity =
        Math.max(
          1,
          Number(
            operatorEditQuantity.value || 1
          )
        );

      /*
        Quantity o‘zgarsa va stock oldin
        kamaytirilgan bo‘lsa, avval eski
        miqdorni stockka qaytaramiz.
      */

      let stockAdjusted =
        order.stock_adjusted === true;

      if (
        stockAdjusted &&
        order.product_id &&
        Number(order.quantity || 1) !== newQuantity
      ) {
        const pRows = await api(
          `products?select=id,stock&id=eq.${encodeURIComponent(order.product_id)}&limit=1`
        );

        const product =
          pRows?.[0];

        if (product) {
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

              body: JSON.stringify({
                stock:
                  Number(product.stock || 0) +
                  Number(order.quantity || 1)
              })
            }
          );

          stockAdjusted = false;
        }
      }

      stockAdjusted =
        await syncStockForStatus(
          {
            ...order,
            quantity: newQuantity,
            stock_adjusted:
              stockAdjusted
          },
          newStatus
        );

      const payload = {
        name:
          operatorEditName.value.trim(),

        surname:
          operatorEditSurname.value.trim(),

        phone:
          operatorEditPhone.value.trim(),

        quantity:
          newQuantity,

        size:
          operatorEditSize.value.trim(),

        color:
          operatorEditColor.value.trim(),

        region:
          operatorEditRegion.value.trim(),

        address:
          operatorEditAddress.value.trim(),

        note:
          operatorEditNote.value.trim(),

        status:
          newStatus,

        stock_adjusted:
          stockAdjusted,

        updated_at:
          new Date().toISOString()
      };

      if (
        newStatus === "talked" &&
        !order.talked_at
      ) {
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

      setMessage(
        operatorOrderMessage,
        "Zayavka saqlandi ✅",
        "success"
      );

      await Promise.all([
        loadOrders(),
        loadProducts()
      ]);

      updateStats();

      setTimeout(() => {
        operatorOrderDialog.close();
      }, 500);

    } catch (error) {
      console.error("ORDER SAVE:", error);

      setMessage(
        operatorOrderMessage,
        error.message ||
        "Zayavkani saqlab bo‘lmadi.",
        "error"
      );

    } finally {
      saveButton.disabled = false;
      saveButton.textContent =
        "💾 Saqlash";
    }
  }
);


/* =========================================
   STOCK SYNC
========================================= */

async function syncStockForStatus(
  order,
  newStatus
) {
  const productId =
    order.product_id;

  let adjusted =
    order.stock_adjusted === true;

  if (!productId) {
    return adjusted;
  }

  const qty =
    Math.max(
      1,
      Number(order.quantity || 1)
    );

  const shouldUseStock =
    usesStock(newStatus);


  /* STOCK KAMAYTIRISH */

  if (
    shouldUseStock &&
    !adjusted
  ) {
    const rows = await api(
      `products?select=id,name,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
    );

    const product =
      rows?.[0];

    if (!product) {
      throw new Error(
        "Mahsulot topilmadi."
      );
    }

    const stock =
      Number(product.stock || 0);

    if (stock < qty) {
      throw new Error(
        `Omborda yetarli mahsulot yo‘q. Omborda ${stock} dona.`
      );
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
    !shouldUseStock &&
    adjusted
  ) {
    const rows = await api(
      `products?select=id,stock&id=eq.${encodeURIComponent(productId)}&limit=1`
    );

    const product =
      rows?.[0];

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

  return adjusted;
}


/* =========================================
   QR BUTTON
========================================= */

operatorQrBtn.addEventListener(
  "click",
  () => {

    const id =
      operatorEditOrderId.value;

    if (!id) return;

    alert(
      `QR etiketka keyingi bosqichda ulanadi.\nBuyurtma: #${id}`
    );
  }
);


/* =========================================
   SEARCH
========================================= */

operatorOrderSearch.addEventListener(
  "input",
  renderOrders
);


operatorClearSearch.addEventListener(
  "click",
  () => {

    operatorOrderSearch.value = "";

    renderOrders();

    operatorOrderSearch.focus();
  }
);


/* =========================================
   DESKTOP FILTERS
========================================= */

document
  .querySelectorAll(
    ".operator-filter-btn"
  )
  .forEach(button => {

    button.onclick = () => {

      currentFilter =
        button.dataset.status;

      document
        .querySelectorAll(
          ".operator-filter-btn"
        )
        .forEach(item =>
          item.classList.remove(
            "active"
          )
        );

      button.classList.add(
        "active"
      );

      syncMobileFilter();

      renderOrders();
    };
  });


/* =========================================
   MOBILE FILTERS
========================================= */

document
  .querySelectorAll(
    ".operator-mobile-nav-btn"
  )
  .forEach(button => {

    button.onclick = () => {

      currentFilter =
        button.dataset.mobileFilter;

      document
        .querySelectorAll(
          ".operator-mobile-nav-btn"
        )
        .forEach(item =>
          item.classList.remove(
            "active"
          )
        );

      button.classList.add(
        "active"
      );

      syncDesktopFilter();

      renderOrders();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };
  });


function syncMobileFilter() {
  document
    .querySelectorAll(
      ".operator-mobile-nav-btn"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.mobileFilter ===
        currentFilter
      );

    });
}


function syncDesktopFilter() {
  document
    .querySelectorAll(
      ".operator-filter-btn"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.status ===
        currentFilter
      );

    });
}


/* =========================================
   START
========================================= */

restoreSession();
