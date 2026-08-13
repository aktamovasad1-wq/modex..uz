const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

const params = new URLSearchParams(location.search);
const productId = params.get("id");

let product = null;
let allProducts = [];

let cart = JSON.parse(
  localStorage.getItem("modex_cart") || "[]"
);

let favorites = JSON.parse(
  localStorage.getItem("modex_favorites") || "[]"
);

/* =========================
   YORDAMCHI
========================= */

function money(value) {
  return (
    new Intl.NumberFormat("uz-UZ").format(
      Number(value || 0)
    ) + " so‘m"
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

/* =========================
   MAHSULOTNI YUKLASH
========================= */

async function loadProduct() {
  try {
    if (!productId) {
      throw new Error("Mahsulot ID topilmadi");
    }

    const rows = await api(
      `products?select=*&id=eq.${encodeURIComponent(productId)}&limit=1`
    );

    product = rows?.[0];

    if (!product) {
      throw new Error("Mahsulot topilmadi");
    }

    renderProduct();

    await loadRelatedProducts();

  } catch (error) {
    console.error(error);

    document.querySelector(".product-page").innerHTML = `
      <div style="padding:50px;text-align:center;width:100%">
        <h2>Mahsulot topilmadi</h2>
        <p>Bu mahsulot mavjud emas yoki o‘chirilgan.</p>
        <a href="index.html" class="main-btn">
          Bosh sahifaga qaytish
        </a>
      </div>
    `;
  }
}

/* =========================
   MAHSULOTNI KO‘RSATISH
========================= */

function renderProduct() {
  document.title =
    `${product.name} — MODEX.UZ`;

  document.getElementById("productImage").src =
    product.image_url || "";

  document.getElementById("productImage").alt =
    product.name || "Mahsulot";

  document.getElementById("productCategory").textContent =
    product.category || "Mahsulot";

  document.getElementById("productName").textContent =
    product.name || "";

  document.getElementById("productPrice").textContent =
    money(product.price);

  document.getElementById("mobileProductPrice").textContent =
    money(product.price);

  document.getElementById("productDescription").textContent =
    product.description || "";

  document.getElementById("selectedProductTitle").textContent =
    product.name || "";

  document.getElementById("productInput").value =
    product.name || "";

  updateFavoriteButton();
}

/* =========================
   BUYURTMA OYNASI
========================= */

function openOrder() {
  document.getElementById("selectedProductTitle").textContent =
    product.name;

  document.getElementById("productInput").value =
    product.name;

  document.getElementById("sizeInput").value =
    document.getElementById("productSize").value.trim();

  document.getElementById("colorInput").value =
    document.getElementById("productColor").value.trim();

  document.getElementById("quantityInput").value =
    document.getElementById("productQuantity").value || 1;

  document.getElementById("formMessage").textContent = "";

  document.getElementById("orderDialog").showModal();
}

document.getElementById("buyNowBtn").onclick =
  openOrder;

document.getElementById("mobileBuyBtn").onclick =
  openOrder;

document.getElementById("closeDialog").onclick = () => {
  document.getElementById("orderDialog").close();
};

document.getElementById("orderDialog").addEventListener(
  "click",
  event => {
    if (
      event.target ===
      document.getElementById("orderDialog")
    ) {
      document.getElementById("orderDialog").close();
    }
  }
);

/* =========================
   BUYURTMA YUBORISH
========================= */

document.getElementById("orderForm").onsubmit =
  async event => {

    event.preventDefault();

    const button =
      document.getElementById("submitOrder");

    const message =
      document.getElementById("formMessage");

    const name =
      document.getElementById("nameInput").value.trim();

    const phone =
      document.getElementById("phoneInput").value.trim();

    const size =
      document.getElementById("sizeInput").value.trim();

    const color =
      document.getElementById("colorInput").value.trim();

    const quantity =
      Number(
        document.getElementById("quantityInput").value || 1
      );

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
      await api("orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },

        body: JSON.stringify({
          name,
          phone,
          product: product.name,
          quantity,
          size,
          color,
          status: "new",
          utm_source:
            params.get("utm_source") || "product",
          utm_campaign:
            params.get("utm_campaign") || ""
        })
      });

      message.textContent =
        "Buyurtmangiz qabul qilindi ✅";

      message.className =
        "form-message success";

      event.target.reset();

      setTimeout(() => {
        document.getElementById("orderDialog").close();
      }, 1600);

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
   SAVAT
========================= */

document.getElementById("addCartBtn").onclick = () => {

  if (!product) return;

  const existing =
    cart.find(
      item =>
        Number(item.id) ===
        Number(product.id)
    );

  const quantity =
    Number(
      document.getElementById("productQuantity").value || 1
    );

  if (existing) {
    existing.quantity += quantity;

  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url,
      quantity
    });
  }

  localStorage.setItem(
    "modex_cart",
    JSON.stringify(cart)
  );

  const button =
    document.getElementById("addCartBtn");

  const oldText =
    button.textContent;

  button.textContent =
    "Savatga qo‘shildi ✅";

  setTimeout(() => {
    button.textContent =
      oldText;
  }, 1500);
};

/* =========================
   SEVIMLILAR
========================= */

function isFavorite() {
  return favorites.some(
    item =>
      Number(item.id) ===
      Number(product?.id)
  );
}

function updateFavoriteButton() {
  const button =
    document.getElementById("favoriteProductBtn");

  if (!button || !product) return;

  if (isFavorite()) {
    button.textContent =
      "♥ Sevimlilarda";

    button.classList.add(
      "favorite-active"
    );

  } else {
    button.textContent =
      "♡ Sevimlilar";

    button.classList.remove(
      "favorite-active"
    );
  }
}

document.getElementById("favoriteProductBtn").onclick = () => {

  if (!product) return;

  const index =
    favorites.findIndex(
      item =>
        Number(item.id) ===
        Number(product.id)
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

  updateFavoriteButton();
};

/* =========================
   LINKNI NUSXALASH
========================= */

document.getElementById("copyProductLinkBtn").onclick =
  async event => {

    const button =
      event.currentTarget;

    const link =
      location.href.split("&utm_")[0];

    try {
      await navigator.clipboard.writeText(link);

      const oldText =
        button.textContent;

      button.textContent =
        "Nusxalandi ✅";

      setTimeout(() => {
        button.textContent =
          oldText;
      }, 1500);

    } catch (error) {
      prompt(
        "Mahsulot linkini nusxalang:",
        link
      );
    }
  };

/* =========================
   O‘XSHASH MAHSULOTLAR
========================= */

async function loadRelatedProducts() {
  try {
    allProducts = await api(
      "products?select=id,name,price,image_url,category,active&active=eq.true&order=id.desc"
    );

    const related =
      allProducts
        .filter(
          item =>
            Number(item.id) !==
              Number(product.id) &&
            (
              item.category ===
                product.category ||
              !product.category
            )
        )
        .slice(0, 5);

    renderRelatedProducts(related);

  } catch (error) {
    console.error(error);
  }
}

function renderRelatedProducts(items) {
  const wrap =
    document.getElementById("relatedProducts");

  wrap.innerHTML = "";

  items.forEach(item => {
    const card =
      document.createElement("article");

    card.className =
      "market-product-card";

    card.innerHTML = `
      <div class="product-image-box">

        <a href="product.html?id=${item.id}">
          <img
            src="${esc(item.image_url || "")}"
            alt="${esc(item.name || "")}"
            loading="lazy"
          >
        </a>

      </div>

      <div class="market-product-info">

        <span class="market-category">
          ${esc(item.category || "Mahsulot")}
        </span>

        <a
          href="product.html?id=${item.id}"
          class="market-product-title"
        >
          ${esc(item.name || "")}
        </a>

        <div class="market-price">
          ${money(item.price)}
        </div>

        <a
          href="product.html?id=${item.id}"
          class="main-btn"
        >
          Ko‘rish
        </a>

      </div>
    `;

    wrap.appendChild(card);
  });
}

/* =========================
   SETTINGS
========================= */

async function loadSiteSettings() {
  try {
    const rows = await api(
      "site_settings?select=delivery_text&order=id.asc&limit=1"
    );

    const settings =
      rows?.[0];

    if (
      settings?.delivery_text
    ) {
      document.getElementById(
        "deliveryText"
      ).textContent =
        settings.delivery_text;
    }

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   START
========================= */

loadProduct();
loadSiteSettings();
