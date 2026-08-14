const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

let accessToken = "";
let currentUser = null;

let products = [];
let orders = [];
let operators = [];
let supportRequests = [];

let currentOrderStatus = "all";

/* ==========================================
   ELEMENTLAR
========================================== */

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const logoutBtn = document.getElementById("logoutBtn");
const refreshAdminBtn = document.getElementById("refreshAdminBtn");

const adminEmail = document.getElementById("adminEmail");

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

/* MAIN STATS */

const aProducts =
  document.getElementById("aProducts");

const aOrders =
  document.getElementById("aOrders");

const aNew =
  document.getElementById("aNew");

const aOperators =
  document.getElementById("aOperators");

/* ORDER STATS */

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


/* ==========================================
   YORDAMCHI FUNKSIYALAR
========================================== */

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

  element.className =
    `form-message ${type}`.trim();
}

function productLink(id) {
  const path =
    location.pathname.replace(
      /admin\.html.*$/,
      ""
    );

  return (
    `${location.origin}${path}product.html?id=${id}`
  );
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value)
      .toLocaleString("uz-UZ");
  } catch {
    return "-";
  }
}

function normalizePhone(phone = "") {
  return String(phone)
    .replace(/[^\d+]/g, "");
}


/* ==========================================
   STATUS
========================================== */

function statusInfo(status) {

  switch (status) {

    case "new":
      return {
        text: "Yangi",
        icon: "🔴",
        className: "status-new"
      };

    case "talked":
      return {
        text: "Gaplashildi",
        icon: "🟠",
        className: "status-talked"
      };

    case "confirmed":
      return {
        text: "Tasdiqlandi",
        icon: "🔵",
        className: "status-confirmed"
      };

    case "delivery":
      return {
        text: "Yetkazishda",
        icon: "🟣",
        className: "status-delivery"
      };

    case "done":
      return {
        text: "Yakunlandi",
        icon: "🟢",
        className: "status-done"
      };

    case "cancelled":
      return {
        text: "Bekor qilindi",
        icon: "⚪",
        className: "status-cancelled"
      };

    default:
      return {
        text: status || "Yangi",
        icon: "•",
        className: ""
      };
  }
}


/* ==========================================
   API
========================================== */

async function api(path, options = {}) {

  const response =
    await fetch(
      `${REST}/${path}`,
      {
        ...options,

        headers: {

          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${
              accessToken ||
              SUPABASE_KEY
            }`,

          ...(options.headers || {})
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      await response.text()
    );
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


/* ==========================================
   AUTH
========================================== */

async function signIn(
  email,
  password
) {

  const response =
    await fetch(
      `${AUTH}/token?grant_type=password`,
      {
        method: "POST",

        headers: {
          apikey:
            SUPABASE_KEY,

          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            email,
            password
          })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.error_description ||
      data.msg ||
      "Kirishda xatolik"
    );
  }

  return data;
}


async function getCurrentUser() {

  const response =
    await fetch(
      `${AUTH}/user`,
      {
        headers: {

          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      "Sessiya tugagan"
    );
  }

  return data;
}


async function checkAdminRole(
  userId
) {

  const rows =
    await api(
      `profiles?select=id,name,role,active&id=eq.${encodeURIComponent(userId)}&limit=1`
    );

  const profile =
    rows?.[0];

  return (
    profile &&
    profile.role === "admin" &&
    profile.active === true
  );
}


function saveSession(token) {

  localStorage.setItem(
    "modex_admin_token",
    token
  );
}


function clearSession() {

  localStorage.removeItem(
    "modex_admin_token"
  );

  accessToken = "";
  currentUser = null;
}


function showLogin() {

  loginView
    .classList
    .remove("hidden");

  adminView
    .classList
    .add("hidden");
}


function showAdmin() {

  loginView
    .classList
    .add("hidden");

  adminView
    .classList
    .remove("hidden");
}


/* ==========================================
   LOGIN
========================================== */

loginForm.onsubmit =
  async event => {

    event.preventDefault();

    setMessage(
      loginMessage,
      "Tekshirilmoqda..."
    );

    try {

      const auth =
        await signIn(
          emailInput.value.trim(),
          passwordInput.value
        );

      accessToken =
        auth.access_token;

      currentUser =
        auth.user;


      const isAdmin =
        await checkAdminRole(
          currentUser.id
        );


      if (!isAdmin) {

        throw new Error(
          "Bu akkaunt admin emas."
        );
      }


      saveSession(
        accessToken
      );


      adminEmail.textContent =
        currentUser.email || "";


      setMessage(
        loginMessage,
        ""
      );


      showAdmin();

      await loadAdminData();

    } catch (error) {

      console.error(error);

      clearSession();

      setMessage(
        loginMessage,
        error.message ||
        "Kirishda xatolik",
        "error"
      );
    }
  };


/* ==========================================
   RESTORE SESSION
========================================== */

async function restoreSession() {

  accessToken =
    localStorage.getItem(
      "modex_admin_token"
    ) || "";


  if (!accessToken) {

    showLogin();
    return;
  }


  try {

    currentUser =
      await getCurrentUser();


    const isAdmin =
      await checkAdminRole(
        currentUser.id
      );


    if (!isAdmin) {

      throw new Error(
        "Admin huquqi yo‘q"
      );
    }


    adminEmail.textContent =
      currentUser.email || "";


    showAdmin();

    await loadAdminData();

  } catch (error) {

    console.error(error);

    clearSession();

    showLogin();
  }
}


/* ==========================================
   LOGOUT
========================================== */

logoutBtn.onclick = () => {

  clearSession();

  showLogin();

  emailInput.value = "";
  passwordInput.value = "";
};


/* ==========================================
   LOAD ADMIN
========================================== */

async function loadAdminData() {

  await Promise.all([
    loadProducts(),
    loadOrders(),
    loadOperators(),
    loadSupport()
  ]);

  updateStats();
  updateOrderStats();
}


refreshAdminBtn.onclick =
  async () => {

    refreshAdminBtn.disabled =
      true;

    refreshAdminBtn.textContent =
      "Yangilanmoqda...";

    try {

      await loadAdminData();

    } finally {

      refreshAdminBtn.disabled =
        false;

      refreshAdminBtn.textContent =
        "🔄 Yangilash";
    }
  };


/* ==========================================
   STATS
========================================== */

function updateStats() {

  aProducts.textContent =
    products.length;

  aOrders.textContent =
    orders.length;

  aNew.textContent =
    orders.filter(
      item =>
        item.status === "new"
    ).length;

  aOperators.textContent =
    operators.length;
}


function updateOrderStats() {

  const today =
    new Date();

  const todayString =
    today.toISOString()
      .slice(0, 10);


  const todays =
    orders.filter(order => {

      if (!order.created_at) {
        return false;
      }

      return (
        String(order.created_at)
          .slice(0, 10)
        === todayString
      );
    });


  todayOrdersCount.textContent =
    todays.length;


  newOrdersCount.textContent =
    orders.filter(
      item =>
        item.status === "new"
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


/* ==========================================
   IMAGE UPLOAD
========================================== */

async function uploadImage(file) {

  if (!file) {
    return null;
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const filename =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;


  const bucket =
    "products";


  const response =
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`,
      {
        method: "POST",

        headers: {

          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            file.type ||
            "application/octet-stream",

          "x-upsert":
            "false"
        },

        body:
          file
      }
    );


  if (!response.ok) {

    throw new Error(
      await response.text()
    );
  }


  return (
    `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`
  );
}


/* ==========================================
   PRODUCTS
========================================== */

async function loadProducts() {

  try {

    products =
      await api(
        "products?select=*&order=id.desc"
      );


    renderAdminProducts();

  } catch (error) {

    console.error(error);

    setMessage(
      productMessage,
      "Mahsulotlarni yuklab bo‘lmadi.",
      "error"
    );
  }
}


/* ==========================================
   PRODUCT SAVE
========================================== */

productForm.onsubmit =
  async event => {

    event.preventDefault();


    const editingId =
      editProductId.value.trim();


    const name =
      pName.value.trim();


    const category =
      pCategory.value.trim();


    const price =
      Number(
        pPrice.value || 0
      );


    const oldPrice =
      pOldPrice.value
        ? Number(
            pOldPrice.value
          )
        : null;


    let discount =
      Number(
        pDiscount.value || 0
      );


    const stock =
      Math.max(
        0,
        Math.floor(
          Number(
            pStock.value || 0
          )
        )
      );


    if (
      oldPrice &&
      oldPrice > price &&
      !discount
    ) {

      discount =
        Math.round(
          (
            (oldPrice - price) /
            oldPrice
          ) * 100
        );


      pDiscount.value =
        discount;
    }


    if (
      discount < 0 ||
      discount > 100
    ) {

      setMessage(
        productMessage,
        "Chegirma 0 dan 100 gacha bo‘lishi kerak.",
        "error"
      );

      return;
    }


    productSubmitBtn.disabled =
      true;


    productSubmitBtn.textContent =
      editingId
        ? "Saqlanmoqda..."
        : "Qo‘shilmoqda...";


    try {

      let imageUrl =
        null;


      if (
        pImage.files?.[0]
      ) {

        imageUrl =
          await uploadImage(
            pImage.files[0]
          );
      }


      const payload = {

        name,

        category,

        price,

        old_price:
          oldPrice,

        discount_percent:
          discount,

        stock,

        description:
          pDesc.value.trim(),

        active:
          true
      };


      if (imageUrl) {

        payload.image_url =
          imageUrl;
      }


      if (editingId) {

        await api(
          `products?id=eq.${encodeURIComponent(editingId)}`,
          {
            method:
              "PATCH",

            headers: {

              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(
                payload
              )
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
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(
                payload
              )
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

      console.error(error);

      setMessage(
        productMessage,
        "Mahsulotni saqlab bo‘lmadi.",
        "error"
      );

    } finally {

      productSubmitBtn.disabled =
        false;


      productSubmitBtn.textContent =
        editProductId.value
          ? "Saqlash"
          : "Mahsulot qo‘shish";
    }
  };


/* ==========================================
   PRODUCT RESET
========================================== */

function resetProductForm() {

  productForm.reset();

  editProductId.value = "";

  pStock.value = 0;

  productFormTitle.textContent =
    "Mahsulot qo‘shish";

  productSubmitBtn.textContent =
    "Mahsulot qo‘shish";

  cancelEditBtn
    .classList
    .add("hidden");
}


cancelEditBtn.onclick = () => {

  resetProductForm();

  setMessage(
    productMessage,
    ""
  );
};


/* ==========================================
   EDIT PRODUCT
========================================== */

function editProduct(id) {

  const product =
    products.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!product) {
    return;
  }


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
    Number(
      product.stock || 0
    );


  pDesc.value =
    product.description || "";


  productFormTitle.textContent =
    "Mahsulotni tahrirlash";


  productSubmitBtn.textContent =
    "Saqlash";


  cancelEditBtn
    .classList
    .remove("hidden");


  productForm.scrollIntoView({
    behavior:
      "smooth",

    block:
      "start"
  });
}


/* ==========================================
   DELETE PRODUCT
========================================== */

async function deleteProduct(id) {

  const product =
    products.find(
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

    await api(
      `products?id=eq.${encodeURIComponent(id)}`,
      {
        method:
          "DELETE",

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


/* ==========================================
   RENDER PRODUCTS
========================================== */

function renderAdminProducts() {

  adminProducts.innerHTML =
    "";


  if (!products.length) {

    adminProducts.innerHTML = `
      <p class="drawer-empty">
        Hozircha mahsulot yo‘q.
      </p>
    `;

    return;
  }


  products.forEach(
    product => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "product-admin-item";


      const stock =
        Number(
          product.stock || 0
        );


      const stockHtml =
        stock > 0
          ? `
            <span style="
              color:#16835a;
              font-weight:800;
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
          `;


      let discountHtml =
        "";


      if (
        product.old_price &&
        Number(
          product.old_price
        ) >
        Number(
          product.price
        )
      ) {

        discountHtml += `
          <span style="
            text-decoration:line-through;
          ">
            ${money(product.old_price)}
          </span>
        `;
      }


      if (
        Number(
          product.discount_percent
        ) > 0
      ) {

        discountHtml += `
          <span style="
            color:#6f35e8;
            font-weight:900;
          ">
            -${Number(product.discount_percent)}%
          </span>
        `;
      }


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

          ${discountHtml}

          ${stockHtml}

        </div>


        <div class="product-admin-actions">

          <button
            class="small-btn edit-product-btn"
            data-id="${product.id}"
          >
            ✏️ Tahrirlash
          </button>


          <button
            class="small-btn copy-target-btn"
            data-id="${product.id}"
          >
            🔗 Link
          </button>


          <button
            class="small-btn delete-product-btn"
            data-id="${product.id}"
          >
            🗑 O‘chirish
          </button>

        </div>
      `;


      adminProducts.appendChild(
        item
      );
    }
  );


  adminProducts
    .querySelectorAll(
      ".edit-product-btn"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            editProduct(
              button.dataset.id
            );
          };
      }
    );


  adminProducts
    .querySelectorAll(
      ".delete-product-btn"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            deleteProduct(
              button.dataset.id
            );
          };
      }
    );


  adminProducts
    .querySelectorAll(
      ".copy-target-btn"
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const link =
              productLink(
                button.dataset.id
              );


            try {

              await navigator
                .clipboard
                .writeText(
                  link
                );


              const old =
                button.textContent;


              button.textContent =
                "Nusxalandi ✅";


              setTimeout(
                () => {

                  button.textContent =
                    old;

                },
                1500
              );

            } catch {

              prompt(
                "Mahsulot linki:",
                link
              );
            }
          };
      }
    );
}


/* ==========================================
   LOAD ORDERS
========================================== */

async function loadOrders() {

  try {

    orders =
      await api(
        "orders?select=*&order=id.desc"
      );


    renderOrders();

    updateStats();
    updateOrderStats();

  } catch (error) {

    console.error(error);

    setMessage(
      ordersMessage,
      "Buyurtmalarni yuklab bo‘lmadi.",
      "error"
    );
  }
}


/* ==========================================
   FILTER ORDERS
========================================== */

function filteredOrders() {

  const search =
    adminOrderSearch.value
      .trim()
      .toLowerCase();


  return orders.filter(
    order => {

      const statusOk =
        currentOrderStatus === "all" ||
        order.status ===
          currentOrderStatus;


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


      const searchOk =
        text.includes(
          search
        );


      return (
        statusOk &&
        searchOk
      );
    }
  );
}


/* ==========================================
   RENDER ORDERS
========================================== */

function renderOrders() {

  const filtered =
    filteredOrders();


  visibleOrderCount.textContent =
    `${filtered.length} ta`;


  renderDesktopOrders(
    filtered
  );


  renderMobileOrders(
    filtered
  );
}


/* ==========================================
   DESKTOP ORDERS
========================================== */

function renderDesktopOrders(
  list
) {

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
    list.map(
      order => {

        const status =
          statusInfo(
            order.status
          );


        return `
          <tr
            class="order-row ${status.className}"
          >

            <td>
              #${order.id}
            </td>


            <td>

              <strong>
                ${esc(order.name || "")}
              </strong>

              ${
                order.created_at
                  ? `
                    <small style="
                      display:block;
                      margin-top:3px;
                      color:#888;
                    ">
                      ${esc(formatDate(order.created_at))}
                    </small>
                  `
                  : ""
              }

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

              <select
                class="order-status-select ${status.className}"
                data-id="${order.id}"
              >

                <option
                  value="new"
                  ${
                    order.status === "new"
                      ? "selected"
                      : ""
                  }
                >
                  🔴 Yangi
                </option>


                <option
                  value="talked"
                  ${
                    order.status === "talked"
                      ? "selected"
                      : ""
                  }
                >
                  🟠 Gaplashildi
                </option>


                <option
                  value="confirmed"
                  ${
                    order.status === "confirmed"
                      ? "selected"
                      : ""
                  }
                >
                  🔵 Tasdiqlandi
                </option>


                <option
                  value="delivery"
                  ${
                    order.status === "delivery"
                      ? "selected"
                      : ""
                  }
                >
                  🟣 Yetkazishda
                </option>


                <option
                  value="done"
                  ${
                    order.status === "done"
                      ? "selected"
                      : ""
                  }
                >
                  🟢 Yakunlandi
                </option>


                <option
                  value="cancelled"
                  ${
                    order.status === "cancelled"
                      ? "selected"
                      : ""
                  }
                >
                  ⚪ Bekor qilindi
                </option>

              </select>

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
                  order.status === "new"
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
      }
    ).join("");


  connectOrderButtons();
}


/* ==========================================
   MOBILE ORDER CARDS
========================================== */

function renderMobileOrders(
  list
) {

  if (!list.length) {

    mobileOrders.innerHTML = `
      <div class="drawer-empty">
        Buyurtma topilmadi.
      </div>
    `;

    return;
  }


  mobileOrders.innerHTML =
    list.map(
      order => {

        const status =
          statusInfo(
            order.status
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


            <select
              class="order-status-select mobile-status-select ${status.className}"
              data-id="${order.id}"
            >

              <option
                value="new"
                ${order.status === "new" ? "selected" : ""}
              >
                🔴 Yangi
              </option>

              <option
                value="talked"
                ${order.status === "talked" ? "selected" : ""}
              >
                🟠 Gaplashildi
              </option>

              <option
                value="confirmed"
                ${order.status === "confirmed" ? "selected" : ""}
              >
                🔵 Tasdiqlandi
              </option>

              <option
                value="delivery"
                ${order.status === "delivery" ? "selected" : ""}
              >
                🟣 Yetkazishda
              </option>

              <option
                value="done"
                ${order.status === "done" ? "selected" : ""}
              >
                🟢 Yakunlandi
              </option>

              <option
                value="cancelled"
                ${order.status === "cancelled" ? "selected" : ""}
              >
                ⚪ Bekor qilindi
              </option>

            </select>


            ${
              order.created_at
                ? `
                  <small class="mobile-order-date">
                    ${esc(formatDate(order.created_at))}
                  </small>
                `
                : ""
            }

          </article>
        `;
      }
    ).join("");


  connectOrderButtons();
}


/* ==========================================
   CONNECT STATUS BUTTONS
========================================== */

function connectOrderButtons() {

  document
    .querySelectorAll(
      ".order-status-select"
    )
    .forEach(
      select => {

        select.onchange =
          async () => {

            await changeOrderStatus(
              select.dataset.id,
              select.value
            );
          };
      }
    );


  document
    .querySelectorAll(
      ".quick-talked-btn"
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            await changeOrderStatus(
              button.dataset.id,
              "talked"
            );
          };
      }
    );
}


/* ==========================================
   CHANGE ORDER STATUS
========================================== */

async function changeOrderStatus(
  id,
  newStatus
) {

  try {

    const payload = {

      status:
        newStatus,

      updated_at:
        new Date()
          .toISOString()
    };


    if (
      newStatus === "talked"
    ) {

      payload.talked_at =
        new Date()
          .toISOString();
    }


    await api(
      `orders?id=eq.${encodeURIComponent(id)}`,
      {
        method:
          "PATCH",

        headers: {

          "Content-Type":
            "application/json",

          Prefer:
            "return=minimal"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );


    const order =
      orders.find(
        item =>
          Number(item.id) ===
          Number(id)
      );


    if (order) {

      order.status =
        newStatus;

      order.updated_at =
        payload.updated_at;


      if (
        newStatus === "talked"
      ) {

        order.talked_at =
          payload.talked_at;
      }
    }


    updateStats();

    updateOrderStats();

    renderOrders();

  } catch (error) {

    console.error(error);

    alert(
      "Statusni o‘zgartirib bo‘lmadi."
    );
  }
}


/* ==========================================
   STATUS FILTERS
========================================== */

document
  .querySelectorAll(
    ".order-filter-btn"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          currentOrderStatus =
            button.dataset.status;


          document
            .querySelectorAll(
              ".order-filter-btn"
            )
            .forEach(
              item =>
                item.classList
                  .remove("active")
            );


          button.classList.add(
            "active"
          );


          renderOrders();
        };
    }
  );


/* ==========================================
   SEARCH
========================================== */

adminOrderSearch
  .addEventListener(
    "input",
    renderOrders
  );


clearOrderSearch.onclick =
  () => {

    adminOrderSearch.value =
      "";

    renderOrders();

    adminOrderSearch.focus();
  };


/* ==========================================
   OPERATORS
========================================== */

async function loadOperators() {

  try {

    operators =
      await api(
        "profiles?select=id,name,role,active&role=eq.operator&order=name.asc"
      );


    renderOperators();

  } catch (error) {

    console.error(error);

    operators = [];

    renderOperators();
  }
}


function renderOperators() {

  operatorsList.innerHTML =
    "";


  if (!operators.length) {

    operatorsList.innerHTML = `
      <p class="drawer-empty">
        Operator yo‘q.
      </p>
    `;

    return;
  }


  operators.forEach(
    operator => {

      const box =
        document.createElement(
          "div"
        );


      box.className =
        "support-item";


      box.innerHTML = `

        <div>

          <strong>
            ${esc(operator.name || "Operator")}
          </strong>

          <div style="
            font-size:12px;
            margin-top:4px;
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
        >
          ${
            operator.active
              ? "Bloklash"
              : "Faollashtirish"
          }
        </button>
      `;


      operatorsList.appendChild(
        box
      );
    }
  );


  operatorsList
    .querySelectorAll(
      ".operator-toggle"
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const newActive =
              button.dataset.active !==
              "true";


            try {

              await api(
                `profiles?id=eq.${encodeURIComponent(button.dataset.id)}`,
                {
                  method:
                    "PATCH",

                  headers: {

                    "Content-Type":
                      "application/json",

                    Prefer:
                      "return=minimal"
                  },

                  body:
                    JSON.stringify({
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
      }
    );
}


/* ==========================================
   CREATE OPERATOR
========================================== */

operatorCreateForm.onsubmit =
  async event => {

    event.preventDefault();


    const button =
      operatorCreateForm
        .querySelector(
          'button[type="submit"]'
        );


    button.disabled =
      true;


    button.textContent =
      "Yaratilmoqda...";


    try {

      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/smart-endpoint`,
          {
            method:
              "POST",

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


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Operator yaratilmadi"
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

      console.error(error);

      setMessage(
        operatorCreateMessage,
        error.message ||
        "Operator yaratilmadi.",
        "error"
      );

    } finally {

      button.disabled =
        false;

      button.textContent =
        "Operator yaratish";
    }
  };


/* ==========================================
   SUPPORT
========================================== */

async function loadSupport() {

  try {

    supportRequests =
      await api(
        "support_requests?select=*&order=id.desc"
      );


    renderSupport();

  } catch (error) {

    console.error(error);

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
    supportRequests
      .map(
        item => `

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
        `
      )
      .join("");
}


/* ==========================================
   START
========================================== */

restoreSession();
