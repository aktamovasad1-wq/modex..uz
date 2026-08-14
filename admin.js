const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

let accessToken = "";
let currentUser = null;

let products = [];
let orders = [];
let operators = [];
let supportRequests = [];

/* =========================
   ELEMENTLAR
========================= */

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const logoutBtn = document.getElementById("logoutBtn");
const refreshAdminBtn = document.getElementById("refreshAdminBtn");

const adminEmail = document.getElementById("adminEmail");

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

const operatorCreateForm = document.getElementById("operatorCreateForm");
const opName = document.getElementById("opName");
const newOpEmail = document.getElementById("newOpEmail");
const newOpPassword = document.getElementById("newOpPassword");
const operatorCreateMessage = document.getElementById("operatorCreateMessage");
const operatorsList = document.getElementById("operatorsList");

const adminOrderSearch = document.getElementById("adminOrderSearch");
const ordersBody = document.getElementById("ordersBody");
const ordersMessage = document.getElementById("ordersMessage");

const adminSupportList = document.getElementById("adminSupportList");

const aProducts = document.getElementById("aProducts");
const aOrders = document.getElementById("aOrders");
const aNew = document.getElementById("aNew");
const aOperators = document.getElementById("aOperators");

/* =========================
   HELPERS
========================= */

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
    new Intl.NumberFormat("uz-UZ").format(Number(value || 0))
    + " so‘m"
  );
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function productLink(id) {
  const path = location.pathname.replace(/admin\.html.*$/, "");
  return `${location.origin}${path}product.html?id=${id}`;
}

/* =========================
   API
========================= */

async function api(path, options = {}) {
  const response = await fetch(`${REST}/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_KEY}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/* =========================
   AUTH
========================= */

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
      "Kirishda xatolik"
    );
  }

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Sessiya topilmadi");
  }

  return data;
}

async function checkAdminRole(userId) {
  const rows = await api(
    `profiles?select=id,name,role,active&id=eq.${encodeURIComponent(userId)}&limit=1`
  );

  const profile = rows?.[0];

  return (
    profile &&
    profile.role === "admin" &&
    profile.active === true
  );
}

function saveSession(token) {
  localStorage.setItem("modex_admin_token", token);
}

function clearSession() {
  localStorage.removeItem("modex_admin_token");
  accessToken = "";
  currentUser = null;
}

function showLogin() {
  loginView.classList.remove("hidden");
  adminView.classList.add("hidden");
}

function showAdmin() {
  loginView.classList.add("hidden");
  adminView.classList.remove("hidden");
}

/* =========================
   LOGIN
========================= */

loginForm.onsubmit = async event => {
  event.preventDefault();

  setMessage(loginMessage, "Tekshirilmoqda...");

  try {
    const auth = await signIn(
      emailInput.value.trim(),
      passwordInput.value
    );

    accessToken = auth.access_token;
    currentUser = auth.user;

    const isAdmin = await checkAdminRole(currentUser.id);

    if (!isAdmin) {
      throw new Error("Bu akkauntda admin huquqi yo‘q.");
    }

    saveSession(accessToken);

    adminEmail.textContent = currentUser.email || "";

    setMessage(loginMessage, "");

    showAdmin();

    await loadAdminData();

  } catch (error) {
    console.error(error);

    clearSession();

    setMessage(
      loginMessage,
      error.message || "Kirishda xatolik",
      "error"
    );
  }
};

/* =========================
   RESTORE SESSION
========================= */

async function restoreSession() {
  accessToken =
    localStorage.getItem("modex_admin_token") || "";

  if (!accessToken) {
    showLogin();
    return;
  }

  try {
    currentUser = await getCurrentUser();

    const isAdmin = await checkAdminRole(currentUser.id);

    if (!isAdmin) {
      throw new Error("Admin huquqi yo‘q");
    }

    adminEmail.textContent = currentUser.email || "";

    showAdmin();

    await loadAdminData();

  } catch (error) {
    console.error(error);

    clearSession();
    showLogin();
  }
}

/* =========================
   LOGOUT
========================= */

logoutBtn.onclick = () => {
  clearSession();
  showLogin();

  emailInput.value = "";
  passwordInput.value = "";
};

/* =========================
   ADMIN DATA
========================= */

async function loadAdminData() {
  await Promise.all([
    loadProducts(),
    loadOrders(),
    loadOperators(),
    loadSupport()
  ]);

  updateStats();
}

refreshAdminBtn.onclick = async () => {
  refreshAdminBtn.disabled = true;
  refreshAdminBtn.textContent = "Yangilanmoqda...";

  try {
    await loadAdminData();
  } finally {
    refreshAdminBtn.disabled = false;
    refreshAdminBtn.textContent = "Yangilash";
  }
};

/* =========================
   STATS
========================= */

function updateStats() {
  aProducts.textContent = products.length;
  aOrders.textContent = orders.length;

  aNew.textContent = orders.filter(
    order => order.status === "new"
  ).length;

  aOperators.textContent = operators.length;
}

/* =========================
   IMAGE UPLOAD
========================= */

async function uploadImage(file) {
  if (!file) {
    return null;
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  const filename =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const bucket = "products";

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type":
          file.type || "application/octet-stream",
        "x-upsert": "false"
      },
      body: file
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
}

/* =========================
   PRODUCTS
========================= */

async function loadProducts() {
  try {
    products = await api(
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

/* =========================
   PRODUCT FORM
========================= */

productForm.onsubmit = async event => {
  event.preventDefault();

  const editingId = editProductId.value.trim();

  const name = pName.value.trim();
  const category = pCategory.value.trim();
  const price = Number(pPrice.value || 0);

  const oldPrice = pOldPrice.value
    ? Number(pOldPrice.value)
    : null;

  let discount = Number(pDiscount.value || 0);

  const stock = Math.max(
    0,
    Math.floor(Number(pStock.value || 0))
  );

  if (
    oldPrice &&
    oldPrice > price &&
    !discount
  ) {
    discount = Math.round(
      ((oldPrice - price) / oldPrice) * 100
    );

    pDiscount.value = discount;
  }

  if (discount < 0 || discount > 100) {
    setMessage(
      productMessage,
      "Chegirma 0 dan 100 gacha bo‘lishi kerak.",
      "error"
    );

    return;
  }

  productSubmitBtn.disabled = true;

  productSubmitBtn.textContent =
    editingId
      ? "Saqlanmoqda..."
      : "Qo‘shilmoqda...";

  setMessage(productMessage, "");

  try {
    let imageUrl = null;

    if (pImage.files?.[0]) {
      imageUrl = await uploadImage(
        pImage.files[0]
      );
    }

    const payload = {
      name,
      category,
      price,
      old_price: oldPrice,
      discount_percent: discount,
      stock,
      description: pDesc.value.trim(),
      active: true
    };

    if (imageUrl) {
      payload.image_url = imageUrl;
    }

    if (editingId) {
      await api(
        `products?id=eq.${encodeURIComponent(editingId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify(payload)
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
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify(payload)
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
    productSubmitBtn.disabled = false;

    productSubmitBtn.textContent =
      editProductId.value
        ? "Saqlash"
        : "Mahsulot qo‘shish";
  }
};

/* =========================
   PRODUCT RESET
========================= */

function resetProductForm() {
  productForm.reset();

  editProductId.value = "";
  pStock.value = 0;

  productFormTitle.textContent =
    "Mahsulot qo‘shish";

  productSubmitBtn.textContent =
    "Mahsulot qo‘shish";

  cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.onclick = () => {
  resetProductForm();
  setMessage(productMessage, "");
};

/* =========================
   PRODUCT EDIT
========================= */

function editProduct(id) {
  const product = products.find(
    item => Number(item.id) === Number(id)
  );

  if (!product) {
    return;
  }

  editProductId.value = product.id;

  pName.value = product.name || "";
  pCategory.value = product.category || "";
  pPrice.value = product.price || "";
  pOldPrice.value = product.old_price || "";
  pDiscount.value = product.discount_percent || "";
  pStock.value = Number(product.stock || 0);
  pDesc.value = product.description || "";

  productFormTitle.textContent =
    "Mahsulotni tahrirlash";

  productSubmitBtn.textContent =
    "Saqlash";

  cancelEditBtn.classList.remove("hidden");

  productForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================
   DELETE PRODUCT
========================= */

async function deleteProduct(id) {
  const product = products.find(
    item => Number(item.id) === Number(id)
  );

  if (!product) return;

  const ok = confirm(
    `"${product.name}" mahsulotini o‘chirasizmi?`
  );

  if (!ok) {
    return;
  }

  try {
    await api(
      `products?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          Prefer: "return=minimal"
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

/* =========================
   PRODUCT RENDER
========================= */

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
    const item = document.createElement("div");

    item.className = "product-admin-item";

    let priceHtml = `
      <strong>
        ${money(product.price)}
      </strong>
    `;

    if (
      product.old_price &&
      Number(product.old_price) >
      Number(product.price)
    ) {
      priceHtml += `
        <span style="
          text-decoration:line-through;
          color:#888;
        ">
          ${money(product.old_price)}
        </span>
      `;
    }

    if (
      Number(product.discount_percent) > 0
    ) {
      priceHtml += `
        <span style="
          color:#6d3df0;
          font-weight:900;
        ">
          -${Number(product.discount_percent)}%
        </span>
      `;
    }

    const stock = Number(product.stock || 0);

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

        ${priceHtml}

        ${stockHtml}

        <span>
          ${
            product.active === false
              ? "Faol emas"
              : "Faol"
          }
        </span>

      </div>

      <div class="product-admin-actions">

        <button
          class="small-btn edit-product-btn"
          data-id="${product.id}"
        >
          Tahrirlash
        </button>

        <button
          class="small-btn copy-target-btn"
          data-id="${product.id}"
        >
          🔗 Linkni nusxalash
        </button>

        <button
          class="small-btn delete-product-btn"
          data-id="${product.id}"
        >
          O‘chirish
        </button>

      </div>
    `;

    adminProducts.appendChild(item);
  });

  adminProducts
    .querySelectorAll(".edit-product-btn")
    .forEach(button => {
      button.onclick = () => {
        editProduct(button.dataset.id);
      };
    });

  adminProducts
    .querySelectorAll(".delete-product-btn")
    .forEach(button => {
      button.onclick = () => {
        deleteProduct(button.dataset.id);
      };
    });

  adminProducts
    .querySelectorAll(".copy-target-btn")
    .forEach(button => {
      button.onclick = async () => {
        const link = productLink(
          button.dataset.id
        );

        try {
          await navigator.clipboard.writeText(link);

          const old = button.textContent;

          button.textContent =
            "Nusxalandi ✅";

          setTimeout(() => {
            button.textContent = old;
          }, 1500);

        } catch {
          prompt(
            "Target link:",
            link
          );
        }
      };
    });
}

/* =========================
   ORDERS
========================= */

async function loadOrders() {
  try {
    orders = await api(
      "orders?select=*&order=id.desc"
    );

    renderOrders();

  } catch (error) {
    console.error(error);

    setMessage(
      ordersMessage,
      "Buyurtmalarni yuklab bo‘lmadi.",
      "error"
    );
  }
}

function renderOrders() {
  const search =
    adminOrderSearch.value
      .trim()
      .toLowerCase();

  const filtered = orders.filter(order => {
    const text = `
      ${order.name || ""}
      ${order.phone || ""}
      ${order.product || ""}
      ${order.size || ""}
      ${order.color || ""}
    `.toLowerCase();

    return text.includes(search);
  });

  ordersBody.innerHTML =
    filtered.map(order => `
      <tr>

        <td>${order.id}</td>

        <td>
          ${esc(order.name || "")}
        </td>

        <td>
          <a href="tel:${esc(order.phone || "")}">
            ${esc(order.phone || "")}
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
            class="order-status"
            data-id="${order.id}"
          >

            <option
              value="new"
              ${order.status === "new" ? "selected" : ""}
            >
              Yangi
            </option>

            <option
              value="confirmed"
              ${order.status === "confirmed" ? "selected" : ""}
            >
              Tasdiqlandi
            </option>

            <option
              value="delivery"
              ${order.status === "delivery" ? "selected" : ""}
            >
              Yetkazishda
            </option>

            <option
              value="done"
              ${order.status === "done" ? "selected" : ""}
            >
              Yakunlandi
            </option>

            <option
              value="cancelled"
              ${order.status === "cancelled" ? "selected" : ""}
            >
              Bekor qilindi
            </option>

          </select>

        </td>

      </tr>
    `).join("");

  ordersBody
    .querySelectorAll(".order-status")
    .forEach(select => {
      select.onchange = async () => {
        try {
          await api(
            `orders?id=eq.${encodeURIComponent(select.dataset.id)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Prefer: "return=minimal"
              },
              body: JSON.stringify({
                status: select.value
              })
            }
          );

          const order = orders.find(
            item =>
              Number(item.id) ===
              Number(select.dataset.id)
          );

          if (order) {
            order.status = select.value;
          }

          updateStats();

        } catch (error) {
          console.error(error);

          alert(
            "Statusni o‘zgartirib bo‘lmadi."
          );
        }
      };
    });
}

adminOrderSearch.addEventListener(
  "input",
  renderOrders
);

/* =========================
   OPERATORS
========================= */

async function loadOperators() {
  try {
    operators = await api(
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
  operatorsList.innerHTML = "";

  if (!operators.length) {
    operatorsList.innerHTML = `
      <p class="drawer-empty">
        Operator yo‘q.
      </p>
    `;

    return;
  }

  operators.forEach(operator => {
    const box = document.createElement("div");

    box.className = "support-item";

    box.innerHTML = `
      <div>

        <strong>
          ${esc(operator.name || "Operator")}
        </strong>

        <div style="
          font-size:12px;
          color:#777;
          margin-top:4px;
        ">
          ${
            operator.active
              ? "Faol"
              : "Bloklangan"
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

    operatorsList.appendChild(box);
  });

  operatorsList
    .querySelectorAll(".operator-toggle")
    .forEach(button => {
      button.onclick = async () => {
        const newActive =
          button.dataset.active !== "true";

        try {
          await api(
            `profiles?id=eq.${encodeURIComponent(button.dataset.id)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Prefer: "return=minimal"
              },
              body: JSON.stringify({
                active: newActive
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

/* =========================
   CREATE OPERATOR
========================= */

operatorCreateForm.onsubmit = async event => {
  event.preventDefault();

  const button =
    operatorCreateForm.querySelector(
      'button[type="submit"]'
    );

  button.disabled = true;
  button.textContent = "Yaratilmoqda...";

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
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: opName.value.trim(),
          email: newOpEmail.value.trim(),
          password: newOpPassword.value
        })
      }
    );

    const data = await response.json();

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
    button.disabled = false;
    button.textContent =
      "Operator yaratish";
  }
};

/* =========================
   SUPPORT
========================= */

async function loadSupport() {
  try {
    supportRequests = await api(
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

          <a href="tel:${esc(item.phone || "")}">
            ${esc(item.phone || "")}
          </a>

        </div>

        <span class="badge">
          ${esc(item.status || "new")}
        </span>

      </div>
    `).join("");
}

/* =========================
   START
========================= */

restoreSession();
