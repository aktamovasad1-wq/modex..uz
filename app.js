const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

let products = [];
let filteredProducts = [];

let cart = JSON.parse(localStorage.getItem("modex_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("modex_favorites") || "[]");

const productsGrid = document.getElementById("productsGrid");
const productCount = document.getElementById("productCount");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const mobileSearchInput = document.getElementById("mobileSearchInput");

const categoryList = document.getElementById("categoryList");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

const orderDialog = document.getElementById("orderDialog");
const orderForm = document.getElementById("orderForm");

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

const favoritesDrawer = document.getElementById("favoritesDrawer");
const favoritesOverlay = document.getElementById("favoritesOverlay");


/* =========================
   HELPERS
========================= */

function money(value) {
  return (
    new Intl.NumberFormat("uz-UZ").format(Number(value || 0))
    + " so‘m"
  );
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

async function api(path, options = {}) {
  const response = await fetch(`${REST}/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
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

function productLink(product) {
  const base =
    location.origin +
    location.pathname.replace(/index\.html.*$/, "");

  return `${base}product.html?id=${product.id}`;
}


/* =========================
   SETTINGS
========================= */

async function loadSiteSettings() {
  try {
    const rows = await api(
      "site_settings?select=*&order=id.asc&limit=1"
    );

    const settings = rows?.[0];
    if (!settings) return false;

    document.querySelectorAll(".brand").forEach(el => {
      const name = settings.site_name || "MODEX.UZ";

      if (name.toUpperCase().endsWith(".UZ")) {
        el.innerHTML =
          `${esc(name.slice(0, -3))}<span>.UZ</span>`;
      } else {
        el.textContent = name;
      }
    });

    const heroTitle = document.querySelector(".hero-text h1");
    const heroText = document.querySelector(".hero-text p");

    if (heroTitle && settings.hero_title) {
      heroTitle.textContent = settings.hero_title;
    }

    if (heroText && settings.hero_text) {
      heroText.textContent = settings.hero_text;
    }

    if (settings.primary_color) {
      document.documentElement.style.setProperty(
        "--brand",
        settings.primary_color
      );
    }

    if (settings.maintenance_mode) {
      document.body.innerHTML = `
        <div style="
          min-height:100vh;
          display:grid;
          place-items:center;
          padding:30px;
          text-align:center;
          background:#f6f7fb;
          font-family:Arial,sans-serif;
        ">
          <div>
            <h1>${esc(settings.site_name || "MODEX.UZ")}</h1>
            <p>Saytda texnik ishlar olib borilmoqda.</p>
            <p>Tez orada qaytamiz.</p>
          </div>
        </div>
      `;

      return true;
    }

    return false;

  } catch (error) {
    console.error("Settings xatosi:", error);
    return false;
  }
}


/* =========================
   PRODUCTS LOAD
========================= */

async function loadProducts() {
  try {
    products = await api(
      "products?select=*&active=eq.true&order=id.desc"
    );

    buildCategories();
    applyFilters();

  } catch (error) {
    console.error(error);

    emptyState.classList.remove("hidden");
    emptyState.textContent =
      "Mahsulotlarni yuklab bo‘lmadi.";
  }
}


/* =========================
   CATEGORIES
========================= */

function buildCategories() {
  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];

  categoryList.innerHTML = "";

  categoryFilter.innerHTML = `
    <option value="">
      Barcha kategoriyalar
    </option>
  `;

  categories.forEach(category => {
    const button = document.createElement("button");

    button.className = "category-card";

    button.innerHTML = `
      <span class="category-icon">🛍️</span>
      <strong>${esc(category)}</strong>
    `;

    button.onclick = () => {
      categoryFilter.value = category;
      applyFilters();

      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth"
        });
    };

    categoryList.appendChild(button);

    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;

    categoryFilter.appendChild(option);
  });
}


/* =========================
   SEARCH / FILTER
========================= */

function currentSearch() {
  return (
    searchInput?.value ||
    mobileSearchInput?.value ||
    ""
  )
    .toLowerCase()
    .trim();
}

function applyFilters() {
  const search = currentSearch();
  const category = categoryFilter.value;

  filteredProducts = products.filter(product => {
    const text = `
      ${product.name || ""}
      ${product.category || ""}
      ${product.description || ""}
    `.toLowerCase();

    const searchOk = text.includes(search);

    const categoryOk =
      !category ||
      product.category === category;

    return searchOk && categoryOk;
  });

  const sort = sortSelect.value;

  if (sort === "cheap") {
    filteredProducts.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  }

  else if (sort === "expensive") {
    filteredProducts.sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  }

  else {
    filteredProducts.sort(
      (a, b) => Number(b.id) - Number(a.id)
    );
  }

  renderProducts();
}

searchInput?.addEventListener("input", () => {
  if (mobileSearchInput) {
    mobileSearchInput.value = searchInput.value;
  }

  applyFilters();
});

mobileSearchInput?.addEventListener("input", () => {
  if (searchInput) {
    searchInput.value = mobileSearchInput.value;
  }

  applyFilters();
});

document
  .getElementById("searchBtn")
  ?.addEventListener("click", applyFilters);

document
  .getElementById("mobileSearchBtn")
  ?.addEventListener("click", applyFilters);

categoryFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

document
  .getElementById("allCategoriesBtn")
  ?.addEventListener("click", () => {
    categoryFilter.value = "";
    applyFilters();
  });


/* =========================
   CATALOG BUTTONS
========================= */

function scrollToCategories() {
  document
    .querySelector(".market-section")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

document
  .getElementById("catalogBtn")
  ?.addEventListener("click", scrollToCategories);

document
  .getElementById("mobileCatalogBtn")
  ?.addEventListener("click", scrollToCategories);


/* =========================
   DISCOUNT
========================= */

function getDiscount(product) {
  const price = Number(product.price || 0);
  const oldPrice = Number(product.old_price || 0);
  let discount = Number(product.discount_percent || 0);

  if (
    !discount &&
    oldPrice > price &&
    oldPrice > 0
  ) {
    discount = Math.round(
      ((oldPrice - price) / oldPrice) * 100
    );
  }

  return {
    oldPrice,
    discount
  };
}


/* =========================
   PRODUCT CARDS
========================= */

function renderProducts() {
  productsGrid.innerHTML = "";

  productCount.textContent =
    `${filteredProducts.length} ta mahsulot`;

  emptyState.classList.toggle(
    "hidden",
    filteredProducts.length > 0
  );

  filteredProducts.forEach(product => {
    const isFavorite = favorites.some(
      item =>
        Number(item.id) === Number(product.id)
    );

    const { oldPrice, discount } =
      getDiscount(product);

    const hasDiscount =
      oldPrice > Number(product.price) &&
      discount > 0;

    const card = document.createElement("article");
    card.className = "market-product-card";

    card.innerHTML = `
      <div class="product-image-box">

        <a href="product.html?id=${product.id}">
          <img
            src="${esc(product.image_url || "")}"
            alt="${esc(product.name || "")}"
            loading="lazy"
          >
        </a>

        ${
          hasDiscount
            ? `
              <span class="discount-badge" style="
                position:absolute;
                left:9px;
                top:9px;
              ">
                -${discount}%
              </span>
            `
            : ""
        }

        <button
          class="favorite-button ${
            isFavorite
              ? "favorite-active"
              : ""
          }"
          type="button"
        >
          ${isFavorite ? "♥" : "♡"}
        </button>

      </div>

      <div class="market-product-info">

        <span class="market-category">
          ${esc(product.category || "Mahsulot")}
        </span>

        <a
          href="product.html?id=${product.id}"
          class="market-product-title"
        >
          ${esc(product.name || "")}
        </a>

        <p class="market-description">
          ${esc(product.description || "")}
        </p>

        <div>

          <div class="market-price">
            ${money(product.price)}
          </div>

          ${
            hasDiscount
              ? `
                <div class="old-price">
                  ${money(oldPrice)}
                </div>
              `
              : ""
          }

        </div>

        <div class="market-card-buttons">

          <button
            class="main-btn quick-order"
            type="button"
          >
            Buyurtma
          </button>

          <button
            class="cart-circle add-cart"
            type="button"
          >
            🛒
          </button>

        </div>

        <button
          class="copy-product-link"
          type="button"
        >
          🔗 Linkni nusxalash
        </button>

      </div>
    `;

    card
      .querySelector(".quick-order")
      .onclick = () =>
        openOrder(product);

    card
      .querySelector(".add-cart")
      .onclick = () =>
        addToCart(product);

    card
      .querySelector(".favorite-button")
      .onclick = event => {
        event.preventDefault();

        toggleFavorite(product);
        renderProducts();
      };

    card
      .querySelector(".copy-product-link")
      .onclick = async event => {
        const button =
          event.currentTarget;

        const link =
          productLink(product);

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
            "Mahsulot linki:",
            link
          );
        }
      };

    productsGrid.appendChild(card);
  });
}


/* =========================
   ORDER
========================= */

function openOrder(product) {
  document.getElementById(
    "selectedProductTitle"
  ).textContent = product.name;

  document.getElementById(
    "productInput"
  ).value = product.name;

  document.getElementById(
    "quantityInput"
  ).value = 1;

  document.getElementById(
    "formMessage"
  ).textContent = "";

  orderDialog.showModal();
}

document.getElementById(
  "closeDialog"
).onclick = () => orderDialog.close();

orderDialog.addEventListener(
  "click",
  event => {
    if (event.target === orderDialog) {
      orderDialog.close();
    }
  }
);

orderForm.onsubmit = async event => {
  event.preventDefault();

  const button =
    document.getElementById("submitOrder");

  const message =
    document.getElementById("formMessage");

  const name =
    document.getElementById("nameInput").value.trim();

  const phone =
    document.getElementById("phoneInput").value.trim();

  const product =
    document.getElementById("productInput").value;

  const quantity =
    Number(
      document.getElementById("quantityInput").value || 1
    );

  const size =
    document.getElementById("sizeInput").value.trim();

  const color =
    document.getElementById("colorInput").value.trim();

  const digits =
    phone.replace(/\D/g, "");

  if (
    name.length < 2 ||
    digits.length < 9
  ) {
    message.textContent =
      "Ism va telefon raqamini to‘g‘ri kiriting.";

    message.className =
      "form-message error";

    return;
  }

  button.disabled = true;
  button.textContent =
    "Yuborilmoqda...";

  try {
    const urlParams =
      new URLSearchParams(location.search);

    await api("orders", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },

      body: JSON.stringify({
        name,
        phone,
        product,
        quantity,
        size,
        color,
        status: "new",

        utm_source:
          urlParams.get("utm_source") ||
          "sayt",

        utm_campaign:
          urlParams.get("utm_campaign") ||
          ""
      })
    });

    message.textContent =
      "Buyurtmangiz qabul qilindi ✅";

    message.className =
      "form-message success";

    orderForm.reset();

    setTimeout(() => {
      orderDialog.close();
    }, 1500);

  } catch (error) {
    console.error(error);

    message.textContent =
      "Buyurtmani yuborib bo‘lmadi.";

    message.className =
      "form-message error";

  } finally {
    button.disabled = false;
    button.textContent =
      "Buyurtma berish";
  }
};


/* =========================
   CART
========================= */

function addToCart(product) {
  const existing = cart.find(
    item =>
      Number(item.id) === Number(product.id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function saveCart() {
  localStorage.setItem(
    "modex_cart",
    JSON.stringify(cart)
  );

  updateCounters();
}

function renderCart() {
  const container =
    document.getElementById("cartItems");

  if (!cart.length) {
    container.innerHTML = `
      <div class="drawer-empty">
        Savatingiz hozircha bo‘sh.
      </div>
    `;
  } else {
    container.innerHTML = cart
      .map((item, index) => `
        <div class="drawer-product">

          <img
            src="${esc(item.image_url || "")}"
            alt=""
          >

          <div class="drawer-product-info">

            <strong>
              ${esc(item.name)}
            </strong>

            <span>
              ${money(item.price)}
            </span>

            <div class="quantity-buttons">

              <button
                class="minus-cart"
                data-index="${index}"
              >
                −
              </button>

              <b>${item.quantity}</b>

              <button
                class="plus-cart"
                data-index="${index}"
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove-cart"
            data-index="${index}"
          >
            ×
          </button>

        </div>
      `)
      .join("");
  }

  container
    .querySelectorAll(".plus-cart")
    .forEach(button => {
      button.onclick = () => {
        cart[
          Number(button.dataset.index)
        ].quantity++;

        saveCart();
        renderCart();
      };
    });

  container
    .querySelectorAll(".minus-cart")
    .forEach(button => {
      button.onclick = () => {
        const index =
          Number(button.dataset.index);

        cart[index].quantity--;

        if (cart[index].quantity <= 0) {
          cart.splice(index, 1);
        }

        saveCart();
        renderCart();
      };
    });

  container
    .querySelectorAll(".remove-cart")
    .forEach(button => {
      button.onclick = () => {
        cart.splice(
          Number(button.dataset.index),
          1
        );

        saveCart();
        renderCart();
      };
    });

  const total = cart.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity,
    0
  );

  document.getElementById(
    "cartTotal"
  ).textContent = money(total);
}

function openCart() {
  cartDrawer.classList.remove("hidden");
  cartOverlay.classList.remove("hidden");
  renderCart();
}

function closeCart() {
  cartDrawer.classList.add("hidden");
  cartOverlay.classList.add("hidden");
}

document.getElementById("cartBtn").onclick = openCart;
document.getElementById("mobileCartBtn").onclick = openCart;
document.getElementById("closeCart").onclick = closeCart;
cartOverlay.onclick = closeCart;


/* =========================
   FAVORITES
========================= */

function toggleFavorite(product) {
  const index = favorites.findIndex(
    item =>
      Number(item.id) === Number(product.id)
  );

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url
    });
  }

  localStorage.setItem(
    "modex_favorites",
    JSON.stringify(favorites)
  );

  updateCounters();
  renderFavorites();
}

function renderFavorites() {
  const container =
    document.getElementById("favoriteItems");

  if (!favorites.length) {
    container.innerHTML = `
      <div class="drawer-empty">
        Sevimlilar hozircha bo‘sh.
      </div>
    `;

    return;
  }

  container.innerHTML = favorites
    .map((item, index) => `
      <div class="drawer-product">

        <img
          src="${esc(item.image_url || "")}"
          alt=""
        >

        <div class="drawer-product-info">

          <strong>
            ${esc(item.name)}
          </strong>

          <span>
            ${money(item.price)}
          </span>

          <a
            class="drawer-open-product"
            href="product.html?id=${item.id}"
          >
            Ko‘rish
          </a>

        </div>

        <button
          class="remove-favorite"
          data-index="${index}"
        >
          ×
        </button>

      </div>
    `)
    .join("");

  container
    .querySelectorAll(".remove-favorite")
    .forEach(button => {
      button.onclick = () => {
        favorites.splice(
          Number(button.dataset.index),
          1
        );

        localStorage.setItem(
          "modex_favorites",
          JSON.stringify(favorites)
        );

        updateCounters();
        renderFavorites();
        renderProducts();
      };
    });
}

function openFavorites() {
  favoritesDrawer.classList.remove("hidden");
  favoritesOverlay.classList.remove("hidden");
  renderFavorites();
}

function closeFavorites() {
  favoritesDrawer.classList.add("hidden");
  favoritesOverlay.classList.add("hidden");
}

document.getElementById("favoritesBtn").onclick = openFavorites;
document.getElementById("mobileFavoritesBtn").onclick = openFavorites;
document.getElementById("closeFavorites").onclick = closeFavorites;
favoritesOverlay.onclick = closeFavorites;


/* =========================
   COUNTERS
========================= */

function updateCounters() {
  document.getElementById(
    "cartCount"
  ).textContent = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  document.getElementById(
    "favoriteCount"
  ).textContent = favorites.length;
}


/* =========================
   SUPPORT
========================= */

document.getElementById(
  "supportForm"
).onsubmit = async event => {
  event.preventDefault();

  const message =
    document.getElementById(
      "supportFormMessage"
    );

  try {
    await api("support_requests", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },

      body: JSON.stringify({
        name:
          document
            .getElementById("supportName")
            .value
            .trim(),

        phone:
          document
            .getElementById("supportPhone")
            .value
            .trim(),

        message:
          document
            .getElementById("supportMessage")
            .value
            .trim(),

        status: "new"
      })
    });

    message.textContent =
      "Murojaatingiz yuborildi ✅";

    message.className =
      "form-message success";

    event.target.reset();

  } catch (error) {
    console.error(error);

    message.textContent =
      "Murojaatni yuborib bo‘lmadi.";

    message.className =
      "form-message error";
  }
};


/* =========================
   START
========================= */

async function startApp() {
  const maintenance =
    await loadSiteSettings();

  if (maintenance) {
    return;
  }

  updateCounters();
  renderCart();
  renderFavorites();

  await loadProducts();
}

startApp();
