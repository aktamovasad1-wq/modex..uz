const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

let session = JSON.parse(
  localStorage.getItem("modex_session") || "null"
);

let ordersCache = [];
let productsCache = [];

/* =========================
   ELEMENTLAR
========================= */

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");

const productForm = document.getElementById("productForm");
const editProductId = document.getElementById("editProductId");
const productSubmitBtn = document.getElementById("productSubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");


/* =========================
   YORDAMCHI FUNKSIYALAR
========================= */

function money(value) {
  return (
    new Intl.NumberFormat("uz-UZ").format(
      Number(value || 0)
    ) + " so‘m"
  );
}

function esc(text = "") {
  return String(text).replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
  );
}


/* =========================
   SUPABASE REQUEST
========================= */

async function request(
  url,
  options = {},
  token = session?.access_token
) {
  const response = await fetch(url, {
    ...options,

    headers: {
      apikey: SUPABASE_KEY,

      ...(token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {
            Authorization: `Bearer ${SUPABASE_KEY}`
          }),

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

async function api(path, options = {}) {
  return request(
    `${REST}/${path}`,
    options
  );
}


/* =========================
   ADMIN ROLINI TEKSHIRISH
========================= */

async function getProfile() {
  const rows = await api(
    `profiles?select=role,name,active&id=eq.${session.user.id}&limit=1`
  );

  return rows?.[0];
}

async function showAdmin() {
  try {
    const profile = await getProfile();

    if (
      profile?.role !== "admin" ||
      profile?.active === false
    ) {
      throw new Error("Admin huquqi yo‘q");
    }

    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");

    document.getElementById(
      "adminEmail"
    ).textContent = session.user.email || "";

    await loadAll();

  } catch (error) {
    console.error(error);

    localStorage.removeItem("modex_session");

    session = null;

    showLogin();

    document.getElementById(
      "loginMessage"
    ).textContent =
      "Bu akkaunt administrator emas.";
  }
}

function showLogin() {
  loginView.classList.remove("hidden");
  adminView.classList.add("hidden");
}


/* =========================
   LOGIN
========================= */

document.getElementById(
  "loginForm"
).onsubmit = async event => {

  event.preventDefault();

  const message =
    document.getElementById(
      "loginMessage"
    );

  message.textContent =
    "Kirilmoqda...";

  message.className =
    "form-message";

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",

        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          email:
            document
              .getElementById("email")
              .value
              .trim(),

          password:
            document
              .getElementById("password")
              .value
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        await response.text()
      );
    }

    session = await response.json();

    localStorage.setItem(
      "modex_session",
      JSON.stringify(session)
    );

    await showAdmin();

  } catch (error) {
    console.error(error);

    message.textContent =
      "Email, parol yoki admin huquqi noto‘g‘ri.";

    message.className =
      "form-message error";
  }
};


/* =========================
   LOGOUT
========================= */

document.getElementById(
  "logoutBtn"
).onclick = () => {

  localStorage.removeItem(
    "modex_session"
  );

  session = null;

  showLogin();
};


/* =========================
   YANGILASH
========================= */

document.getElementById(
  "refreshBtn"
).onclick = loadAll;

async function loadAll() {
  await Promise.all([
    loadOrders(),
    loadProductsAdmin(),
    loadOperators(),
    loadSupport()
  ]);
}


/* =========================
   BUYURTMALAR
========================= */

async function loadOrders() {
  const message =
    document.getElementById(
      "ordersMessage"
    );

  try {
    ordersCache = await api(
      "orders?select=*&order=created_at.desc"
    );

    document.getElementById(
      "aOrders"
    ).textContent =
      ordersCache.length;

    document.getElementById(
      "aNew"
    ).textContent =
      ordersCache.filter(
        order =>
          order.status === "new"
      ).length;

    message.textContent = "";

    renderOrders();

  } catch (error) {
    console.error(error);

    message.textContent =
      "Buyurtmalarni yuklab bo‘lmadi.";

    message.className =
      "form-message error";
  }
}

function statusText(status) {
  const statuses = {
    new: "Yangi",

    called:
      "Qo‘ng‘iroq qilindi",

    confirmed:
      "Tasdiqlandi",

    done:
      "Yakunlandi",

    cancelled:
      "Bekor qilindi"
  };

  return (
    statuses[status] ||
    status ||
    "Yangi"
  );
}

function renderOrders() {
  const search =
    document
      .getElementById(
        "adminOrderSearch"
      )
      .value
      .toLowerCase()
      .trim();

  const body =
    document.getElementById(
      "ordersBody"
    );

  body.innerHTML = "";

  const filtered =
    ordersCache.filter(order => {

      const text = `
        ${order.name || ""}
        ${order.surname || ""}
        ${order.phone || ""}
        ${order.product || ""}
        ${order.region || ""}
        ${order.address || ""}
      `.toLowerCase();

      return text.includes(search);
    });

  filtered.forEach(order => {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>#${esc(order.id)}</td>

      <td>
        ${
          new Date(
            order.created_at
          ).toLocaleString("uz-UZ")
        }
      </td>

      <td>
        ${esc(order.name || "")}
        ${esc(order.surname || "")}
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
        ${esc(order.region || "-")}
      </td>

      <td>
        ${esc(order.utm_source || "sayt")}
      </td>

      <td>
        <span class="badge ${esc(order.status || "new")}">
          ${statusText(order.status)}
        </span>
      </td>
    `;

    body.appendChild(row);
  });
}

document.getElementById(
  "adminOrderSearch"
).oninput = renderOrders;


/* =========================
   RASM YUKLASH
========================= */

async function uploadImage(file) {

  if (!file) return null;

  const extension =
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  const path =
    `${Date.now()}-` +
    `${Math.random()
      .toString(36)
      .slice(2, 8)}.` +
    extension;

  await request(
    `${SUPABASE_URL}/storage/v1/object/product-images/${path}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          file.type ||
          "application/octet-stream"
      },

      body: file
    }
  );

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `product-images/${path}`
  );
}


/* =========================
   MAHSULOT QO‘SHISH
   VA TAHRIRLASH
========================= */

productForm.onsubmit =
  async event => {

    event.preventDefault();

    const message =
      document.getElementById(
        "productMessage"
      );

    const id =
      editProductId.value;

    productSubmitBtn.disabled =
      true;

    productSubmitBtn.textContent =
      id
        ? "Saqlanmoqda..."
        : "Qo‘shilmoqda...";

    try {
      const file =
        document.getElementById(
          "pImage"
        ).files[0];

      let imageUrl = null;

      if (file) {
        imageUrl =
          await uploadImage(file);
      }

      const data = {
        name:
          document
            .getElementById("pName")
            .value
            .trim(),

        category:
          document
            .getElementById(
              "pCategory"
            )
            .value
            .trim(),

        price:
          Number(
            document
              .getElementById(
                "pPrice"
              )
              .value
          ),

        description:
          document
            .getElementById(
              "pDesc"
            )
            .value
            .trim(),

        active: true
      };

      if (imageUrl) {
        data.image_url =
          imageUrl;
      }

      /* TAHRIRLASH */

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
              JSON.stringify(data)
          }
        );

        message.textContent =
          "Mahsulot yangilandi.";

      }

      /* YANGI MAHSULOT */

      else {

        if (!imageUrl) {
          throw new Error(
            "Rasm tanlanmagan"
          );
        }

        data.image_url =
          imageUrl;

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
              JSON.stringify(data)
          }
        );

        message.textContent =
          "Mahsulot qo‘shildi.";
      }

      message.className =
        "form-message success";

      resetProductForm();

      await loadProductsAdmin();

    } catch (error) {
      console.error(error);

      message.textContent =
        id
          ? "Mahsulotni yangilab bo‘lmadi."
          : "Mahsulotni qo‘shib bo‘lmadi.";

      message.className =
        "form-message error";

    } finally {

      productSubmitBtn.disabled =
        false;

      productSubmitBtn.textContent =
        editProductId.value
          ? "O‘zgarishlarni saqlash"
          : "Mahsulot qo‘shish";
    }
  };


/* =========================
   TAHRIRLASHNI BOSHLASH
========================= */

function startEditProduct(product) {

  editProductId.value =
    product.id;

  document.getElementById(
    "pName"
  ).value =
    product.name || "";

  document.getElementById(
    "pCategory"
  ).value =
    product.category || "";

  document.getElementById(
    "pPrice"
  ).value =
    product.price || 0;

  document.getElementById(
    "pDesc"
  ).value =
    product.description || "";

  document.getElementById(
    "pImage"
  ).required = false;

  document.getElementById(
    "productFormTitle"
  ).textContent =
    "Mahsulotni tahrirlash";

  productSubmitBtn.textContent =
    "O‘zgarishlarni saqlash";

  cancelEditBtn.classList.remove(
    "hidden"
  );

  document.getElementById(
    "productMessage"
  ).textContent =
    "Rasmni almashtirmasangiz, yangi rasm tanlamang.";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   FORM RESET
========================= */

function resetProductForm() {

  productForm.reset();

  editProductId.value = "";

  document.getElementById(
    "pImage"
  ).required = false;

  document.getElementById(
    "productFormTitle"
  ).textContent =
    "Mahsulot qo‘shish";

  productSubmitBtn.textContent =
    "Mahsulot qo‘shish";

  cancelEditBtn.classList.add(
    "hidden"
  );
}

cancelEditBtn.onclick = () => {

  resetProductForm();

  document.getElementById(
    "productMessage"
  ).textContent = "";
};


/* =========================
   MAHSULOTLAR
========================= */

async function loadProductsAdmin() {

  try {

    productsCache = await api(
      "products?select=id,name,price,description,image_url,category,active&order=id.desc"
    );

    document.getElementById(
      "aProducts"
    ).textContent =
      productsCache.length;

    const wrap =
      document.getElementById(
        "adminProducts"
      );

    wrap.innerHTML = "";

    productsCache.forEach(product => {

      const item =
        document.createElement(
          "div"
        );

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
            ${esc(product.category || "Kategoriyasiz")}
            ·
            ${money(product.price)}
          </span>

          <small class="target-link">
            product.html?id=${product.id}
          </small>

        </div>


        <div class="product-admin-actions">

          <button
            class="small-btn edit-product"
            type="button"
          >
            Tahrirlash
          </button>

          <button
            class="small-btn copy-product-link"
            type="button"
          >
            🔗 Linkni nusxalash
          </button>

          <button
            class="small-btn delete-product"
            type="button"
          >
            O‘chirish
          </button>

        </div>
      `;


      /* TAHRIRLASH */

      item.querySelector(
        ".edit-product"
      ).onclick = () => {

        startEditProduct(
          product
        );
      };


      /* TARGET LINK */

      item.querySelector(
        ".copy-product-link"
      ).onclick = async () => {

        const link =
          `${location.origin}` +
          `${location.pathname.replace(/admin\.html.*$/, "")}` +
          `product.html?id=${product.id}`;

        const button =
          item.querySelector(
            ".copy-product-link"
          );

        try {

          await navigator.clipboard.writeText(
            link
          );

          button.textContent =
            "Nusxalandi ✅";

          setTimeout(() => {
            button.textContent =
              "🔗 Linkni nusxalash";
          }, 1500);

        } catch (error) {

          prompt(
            "Target linkni nusxalang:",
            link
          );
        }
      };


      /* O‘CHIRISH */

      item.querySelector(
        ".delete-product"
      ).onclick = async () => {

        const confirmDelete =
          confirm(
            `"${product.name}" o‘chirilsinmi?`
          );

        if (!confirmDelete) return;

        try {

          await api(
            `products?id=eq.${encodeURIComponent(product.id)}`,
            {
              method: "DELETE",

              headers: {
                Prefer:
                  "return=minimal"
              }
            }
          );

          await loadProductsAdmin();

        } catch (error) {

          console.error(error);

          alert(
            "Mahsulotni o‘chirib bo‘lmadi."
          );
        }
      };


      wrap.appendChild(item);
    });

  } catch (error) {

    console.error(error);
  }
}


/* =========================
   OPERATOR YARATISH
========================= */

document.getElementById(
  "operatorCreateForm"
).onsubmit =
  async event => {

    event.preventDefault();

    const message =
      document.getElementById(
        "operatorCreateMessage"
      );

    message.textContent =
      "Operator yaratilmoqda...";

    message.className =
      "form-message";

    try {

      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/smart-endpoint`,
          {
            method: "POST",

            headers: {
              apikey:
                SUPABASE_KEY,

              Authorization:
                `Bearer ${session.access_token}`,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                name:
                  document
                    .getElementById(
                      "opName"
                    )
                    .value
                    .trim(),

                email:
                  document
                    .getElementById(
                      "newOpEmail"
                    )
                    .value
                    .trim(),

                password:
                  document
                    .getElementById(
                      "newOpPassword"
                    )
                    .value
              })
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {

        throw new Error(
          result.error ||
          result.message ||
          "Operator yaratilmadi"
        );
      }

      message.textContent =
        "Operator yaratildi ✅";

      message.className =
        "form-message success";

      event.target.reset();

      await loadOperators();

    } catch (error) {

      console.error(error);

      message.textContent =
        "Operator yaratilmadi: " +
        error.message;

      message.className =
        "form-message error";
    }
  };


/* =========================
   OPERATORLAR
========================= */

async function loadOperators() {

  try {

    const operators =
      await api(
        "profiles?select=id,name,role,active,created_at&role=eq.operator&order=created_at.desc"
      );

    document.getElementById(
      "aOperators"
    ).textContent =
      operators.length;

    const list =
      document.getElementById(
        "operatorsList"
      );

    if (!operators.length) {

      list.innerHTML =
        '<p class="muted">Hozircha operator yo‘q.</p>';

      return;
    }

    list.innerHTML =
      operators
        .map(
          operator => `

          <div class="support-item">

            <div>

              <strong>
                ${esc(operator.name || "Operator")}
              </strong>

              <span>
                ${
                  operator.active
                    ? "Faol"
                    : "Bloklangan"
                }
              </span>

            </div>

            <button
              class="small-btn toggle-op"
              data-id="${esc(operator.id)}"
              data-active="${operator.active}"
            >

              ${
                operator.active
                  ? "Bloklash"
                  : "Faollashtirish"
              }

            </button>

          </div>
        `
        )
        .join("");


    list
      .querySelectorAll(
        ".toggle-op"
      )
      .forEach(button => {

        button.onclick =
          async () => {

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

                  body:
                    JSON.stringify({
                      active:
                        button.dataset.active !==
                        "true"
                    })
                }
              );

              await loadOperators();

            } catch (error) {

              console.error(error);

              alert(
                "Operator holatini o‘zgartirib bo‘lmadi."
              );
            }
          };
      });

  } catch (error) {

    console.error(error);
  }
}


/* =========================
   YORDAM MUROJAATLARI
========================= */

async function loadSupport() {

  const list =
    document.getElementById(
      "adminSupportList"
    );

  try {

    const requests =
      await api(
        "support_requests?select=*&order=created_at.desc&limit=50"
      );

    if (!requests.length) {

      list.innerHTML =
        '<p class="muted">Hozircha murojaat yo‘q.</p>';

      return;
    }

    list.innerHTML =
      requests
        .map(
          item => `

          <div class="support-item">

            <div>

              <strong>
                ${esc(item.name || "")}
                ·
                <a href="tel:${esc(item.phone || "")}">
                  ${esc(item.phone || "")}
                </a>
              </strong>

              <span>
                ${esc(item.message || "")}
              </span>

            </div>

            <span class="badge">
              ${esc(item.status || "new")}
            </span>

          </div>
        `
        )
        .join("");

  } catch (error) {

    console.error(error);
  }
}


/* =========================
   START
========================= */

if (
  session?.access_token
) {
  showAdmin();
} else {
  showLogin();
}
