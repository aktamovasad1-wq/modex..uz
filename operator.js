(() => {
  "use strict";

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  const $ = id => document.getElementById(id);

  /* =========================================
     ELEMENTS
  ========================================= */

  const loginView = $("operatorLoginView");
  const operatorView = $("operatorView");

  const loginForm = $("operatorLoginForm");
  const emailInput = $("operatorEmail");
  const passwordInput = $("operatorPassword");
  const loginMessage = $("operatorLoginMessage");

  const operatorUserName = $("operatorUserName");
  const refreshBtn = $("operatorRefreshBtn");
  const logoutBtn = $("operatorLogoutBtn");

  const newCount = $("operatorNewCount");
  const talkedCount = $("operatorTalkedCount");
  const confirmedCount = $("operatorConfirmedCount");
  const doneCount = $("operatorDoneCount");

  const searchInput = $("operatorOrderSearch");
  const clearSearch = $("operatorClearSearch");

  const ordersContainer = $("operatorOrders");
  const ordersMessage = $("operatorOrdersMessage");
  const visibleCount = $("operatorVisibleCount");

  const dialog = $("operatorOrderDialog");
  const closeDialogBtn = $("operatorCloseOrder");
  const orderTitle = $("operatorOrderTitle");

  const orderForm = $("operatorOrderForm");

  const editOrderId = $("operatorEditOrderId");
  const editName = $("operatorEditName");
  const editSurname = $("operatorEditSurname");
  const editPhone = $("operatorEditPhone");
  const editProduct = $("operatorEditProduct");
  const editQuantity = $("operatorEditQuantity");
  const editSize = $("operatorEditSize");
  const editColor = $("operatorEditColor");
  const editRegion = $("operatorEditRegion");
  const editAddress = $("operatorEditAddress");
  const editNote = $("operatorEditNote");
  const editStatus = $("operatorEditStatus");

  const callCustomer = $("operatorCallCustomer");
  const qrBtn = $("operatorQrBtn");
  const orderMessage = $("operatorOrderMessage");

  const mobileNav = $("operatorMobileNav");


  /* =========================================
     STATE
  ========================================= */

  let currentUser = null;
  let currentProfile = null;

  let allOrders = [];
  let activeFilter = "all";

  let currentEditingOrder = null;


  /* =========================================
     STATUS
  ========================================= */

  const statusMap = {
    new: "🔴 Yangi",
    talked: "🟠 Gaplashildi",
    confirmed: "🔵 Qadoqlanmoqda",
    delivery: "🟣 Yo‘lda",
    done: "🟢 Yetkazildi",
    cancelled: "⚪ Bekor"
  };


  /* =========================================
     HELPERS
  ========================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function normalizePhone(value) {
    return String(value || "")
      .replace(/[^\d+]/g, "");
  }


  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

    const date = new Date(value);
    const now = new Date();

    if (Number.isNaN(date.getTime())) {
      return false;
    }

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
    element.className = "operator-message";

    if (type) {
      element.classList.add(type);
    }
  }


  /* =========================================
     API
  ========================================= */

  async function apiRequest(
    path,
    options = {},
    token = SUPABASE_KEY
  ) {
    const response = await fetch(
      `${SUPABASE_URL}/${path}`,
      {
        ...options,

        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${token}`,
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

        message =
          data?.message ||
          data?.error_description ||
          data?.error ||
          message;

      } catch (_) {}

      throw new Error(message);
    }


    if (response.status === 204) {
      return null;
    }


    const text =
      await response.text();

    return text
      ? JSON.parse(text)
      : null;
  }


  /* =========================================
     SESSION
  ========================================= */

  function saveSession(session) {
    sessionStorage.setItem(
      "modex_operator_token",
      session.access_token
    );
  }


  function getToken() {
    return sessionStorage.getItem(
      "modex_operator_token"
    );
  }


  function clearSession() {
    sessionStorage.removeItem(
      "modex_operator_token"
    );

    currentUser = null;
    currentProfile = null;
    allOrders = [];
  }


  /* =========================================
     LOGIN
  ========================================= */

  async function login(email, password) {
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
        "Login amalga oshmadi."
      );
    }


    saveSession(data);
  }


  /* =========================================
     USER
  ========================================= */

  async function loadCurrentUser() {
    currentUser =
      await apiRequest(
        "auth/v1/user",
        {
          method: "GET"
        },
        getToken()
      );


    if (!currentUser?.id) {
      throw new Error(
        "Operator aniqlanmadi."
      );
    }
  }


  async function loadProfile() {
    const data =
      await apiRequest(
        `rest/v1/profiles?id=eq.${currentUser.id}&select=*`,
        {
          method: "GET"
        },
        getToken()
      );


    const profile =
      Array.isArray(data)
        ? data[0]
        : null;


    if (!profile) {
      throw new Error(
        "Operator profili topilmadi."
      );
    }


    if (
      profile.role !== "operator" ||
      profile.active !== true
    ) {
      throw new Error(
        "Operator ruxsati yo‘q."
      );
    }


    currentProfile = profile;
  }


  /* =========================================
     PANEL
  ========================================= */

  async function openOperatorPanel() {
    await loadCurrentUser();
    await loadProfile();

    loginView?.classList.add("hidden");
    operatorView?.classList.remove("hidden");
    mobileNav?.classList.remove("hidden");

    if (operatorUserName) {
      operatorUserName.textContent =
        currentProfile.name ||
        currentUser.email ||
        "Operator";
    }

    await loadOrders();
  }


  /* =========================================
     ORDERS
  ========================================= */

  async function loadOrders() {
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
          getToken()
        );


      allOrders =
        Array.isArray(data)
          ? data
          : [];


      updateStats();
      renderOrders();

      showMessage(
        ordersMessage,
        ""
      );

    } catch (error) {
      showMessage(
        ordersMessage,
        error.message,
        "error"
      );
    }
  }


  function talkedTodayByMe(order) {
    return (
      currentUser &&
      order.operator_id === currentUser.id &&
      isToday(order.talked_at)
    );
  }


  /* =========================================
     STATS
  ========================================= */

  function updateStats() {
    if (newCount) {
      newCount.textContent =
        allOrders.filter(
          order =>
            order.status === "new"
        ).length;
    }


    if (talkedCount) {
      talkedCount.textContent =
        allOrders.filter(
          talkedTodayByMe
        ).length;
    }


    if (confirmedCount) {
      confirmedCount.textContent =
        allOrders.filter(
          order =>
            order.status === "confirmed"
        ).length;
    }


    if (doneCount) {
      doneCount.textContent =
        allOrders.filter(
          order =>
            order.status === "done"
        ).length;
    }
  }


  /* =========================================
     FILTER
  ========================================= */

  function getFilteredOrders() {
    let list = [...allOrders];


    if (activeFilter === "talked") {
      list =
        list.filter(
          talkedTodayByMe
        );

    } else if (activeFilter !== "all") {
      list =
        list.filter(
          order =>
            order.status === activeFilter
        );
    }


    const query =
      String(
        searchInput?.value || ""
      )
        .trim()
        .toLowerCase();


    if (query) {
      list =
        list.filter(order => {
          const text = `
            ${order.id}
            ${order.name}
            ${order.surname}
            ${order.phone}
            ${order.product}
            ${order.region}
            ${order.address}
          `.toLowerCase();

          return text.includes(query);
        });
    }


    return list;
  }


  /* =========================================
     RENDER
  ========================================= */

  function renderOrders() {
    if (!ordersContainer) return;

    const list =
      getFilteredOrders();


    if (visibleCount) {
      visibleCount.textContent =
        `${list.length} ta`;
    }


    ordersContainer.innerHTML = "";


    if (!list.length) {
      ordersContainer.innerHTML = `
        <div style="
          padding:30px;
          text-align:center;
          color:#777;
        ">
          Buyurtmalar yo‘q.
        </div>
      `;

      return;
    }


    list.forEach(order => {
      const card =
        document.createElement(
          "article"
        );

      card.className =
        `operator-order-card status-${order.status || "new"}`;


      card.innerHTML = `

        <div class="operator-order-top">

          <div>
            <span class="operator-order-id">
              BUYURTMA #${escapeHtml(order.id)}
            </span>

            <strong class="operator-order-name">
              ${escapeHtml(order.name || "Mijoz")}
              ${escapeHtml(order.surname || "")}
            </strong>
          </div>

          <span class="operator-order-status">
            ${statusMap[order.status] || order.status}
          </span>

        </div>


        <div class="operator-product-box">
          <span>MAHSULOT</span>

          <strong>
            ${escapeHtml(order.product || "Mahsulot")}
          </strong>
        </div>


        <div class="operator-order-info-grid">

          <div>
            <span>SONI</span>
            <strong>${order.quantity || 1}</strong>
          </div>

          <div>
            <span>RAZMER</span>
            <strong>${escapeHtml(order.size || "—")}</strong>
          </div>

          <div>
            <span>RANG</span>
            <strong>${escapeHtml(order.color || "—")}</strong>
          </div>

        </div>


        ${
          order.region || order.address
            ? `
              <div class="operator-location">
                📍
                ${escapeHtml(order.region || "")}
                ${order.address ? " — " + escapeHtml(order.address) : ""}
              </div>
            `
            : ""
        }


        ${
          order.phone
            ? `
              <a
                class="operator-call-btn"
                href="tel:${normalizePhone(order.phone)}"
              >
                📞 ${escapeHtml(order.phone)}
              </a>
            `
            : ""
        }


        <button
          type="button"
          class="operator-edit-order-btn"
          data-order-id="${order.id}"
        >
          Zayavkani ochish
        </button>


        <small class="operator-order-date">
          ${formatDate(order.created_at)}
        </small>
      `;


      ordersContainer.appendChild(
        card
      );
    });


    document
      .querySelectorAll(
        ".operator-edit-order-btn"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            openOrder(
              Number(
                button.dataset.orderId
              )
            );
          }
        );
      });
  }


  /* =========================================
     OPEN ORDER
  ========================================= */

  function openOrder(id) {
    const order =
      allOrders.find(
        item =>
          Number(item.id) ===
          Number(id)
      );


    if (!order) return;


    currentEditingOrder = order;


    editOrderId.value = order.id;
    editName.value = order.name || "";
    editSurname.value = order.surname || "";
    editPhone.value = order.phone || "";
    editProduct.value = order.product || "";
    editQuantity.value = order.quantity || 1;
    editSize.value = order.size || "";
    editColor.value = order.color || "";
    editRegion.value = order.region || "";
    editAddress.value = order.address || "";
    editNote.value = order.note || "";
    editStatus.value = order.status || "new";


    if (orderTitle) {
      orderTitle.textContent =
        `Buyurtma #${order.id}`;
    }


    if (callCustomer) {
      callCustomer.href =
        order.phone
          ? `tel:${normalizePhone(order.phone)}`
          : "#";
    }


    if (editQuantity) {
      editQuantity.disabled =
        order.stock_adjusted === true;
    }


    showMessage(
      orderMessage,
      ""
    );


    if (
      typeof dialog?.showModal ===
      "function"
    ) {
      dialog.showModal();
    } else {
      dialog?.setAttribute(
        "open",
        ""
      );
    }
  }


  function closeOrderDialog() {
    if (
      typeof dialog?.close ===
      "function"
    ) {
      dialog.close();
    } else {
      dialog?.removeAttribute(
        "open"
      );
    }

    currentEditingOrder = null;

    if (editQuantity) {
      editQuantity.disabled = false;
    }
  }


  /* =========================================
     SAVE ORDER
  ========================================= */

  async function saveOrder(event) {
    event.preventDefault();

    if (
      !currentEditingOrder ||
      !currentUser
    ) {
      return;
    }


    const orderId =
      Number(editOrderId.value);


    const oldStatus =
      currentEditingOrder.status ||
      "new";


    const newStatus =
      editStatus.value ||
      "new";


    showMessage(
      orderMessage,
      "Saqlanmoqda..."
    );


    try {

      const payload = {
        name:
          editName.value.trim(),

        surname:
          editSurname.value.trim() || null,

        phone:
          editPhone.value.trim(),

        quantity:
          Math.max(
            1,
            Number(editQuantity.value || 1)
          ),

        size:
          editSize.value.trim() || null,

        color:
          editColor.value.trim() || null,

        region:
          editRegion.value.trim() || null,

        address:
          editAddress.value.trim() || null,

        note:
          editNote.value.trim() || null,

        updated_at:
          new Date().toISOString()
      };


      await apiRequest(
        `rest/v1/orders?id=eq.${orderId}`,
        {
          method: "PATCH",

          headers: {
            Prefer: "return=minimal"
          },

          body:
            JSON.stringify(payload)
        },
        getToken()
      );


      if (oldStatus !== newStatus) {
        await apiRequest(
          "rest/v1/rpc/update_order_status_with_stock",
          {
            method: "POST",

            body:
              JSON.stringify({
                p_order_id: orderId,
                p_new_status: newStatus,
                p_operator_id:
                  newStatus === "talked"
                    ? currentUser.id
                    : null
              })
          },
          getToken()
        );
      }


      await loadOrders();


      showMessage(
        orderMessage,
        "✅ Saqlandi",
        "success"
      );


      setTimeout(
        closeOrderDialog,
        500
      );


    } catch (error) {
      showMessage(
        orderMessage,
        error.message,
        "error"
      );
    }
  }


  /* =========================================
     QR LABEL
  ========================================= */

  function createQrLabel() {
    if (!currentEditingOrder) {
      return;
    }


    const order =
      currentEditingOrder;


    const trackingUrl =
      `${location.origin}${location.pathname.replace("operator.html", "track.html")}` +
      `?id=${encodeURIComponent(order.id)}` +
      `&phone=${encodeURIComponent(order.phone || "")}`;


    const labelWindow =
      window.open(
        "",
        "_blank",
        "width=520,height=760"
      );


    if (!labelWindow) {
      alert(
        "Popup bloklangan. Brauzerda popupga ruxsat bering."
      );

      return;
    }


    labelWindow.document.write(`
<!doctype html>

<html lang="uz">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
  MODEX.UZ #${escapeHtml(order.id)}
</title>


<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  padding:20px;
  font-family:Arial,sans-serif;
  background:#f4f4f6;
  color:#111;
}

.label{
  width:100%;
  max-width:420px;
  margin:0 auto;
  background:#fff;
  border:2px solid #111;
  border-radius:14px;
  padding:18px;
}

.logo{
  font-size:25px;
  font-weight:900;
  margin-bottom:4px;
}

.logo span{
  color:#713cf0;
}

.order-id{
  font-size:28px;
  font-weight:900;
  margin:15px 0;
}

.section{
  border-top:1px dashed #aaa;
  padding-top:11px;
  margin-top:11px;
}

.title{
  font-size:10px;
  color:#777;
  font-weight:800;
  margin-bottom:4px;
}

.value{
  font-size:15px;
  font-weight:700;
  line-height:1.4;
}

.grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.qr-wrap{
  display:flex;
  justify-content:center;
  margin-top:18px;
}

#qr{
  padding:8px;
  background:#fff;
}

.tip{
  text-align:center;
  font-size:10px;
  color:#666;
  margin-top:7px;
}

.print-btn{
  width:100%;
  margin-top:18px;
  border:none;
  padding:13px;
  border-radius:10px;
  background:#713cf0;
  color:#fff;
  font-weight:800;
  cursor:pointer;
}

@media print{

  body{
    padding:0;
    background:#fff;
  }

  .label{
    border:1px solid #111;
    max-width:none;
  }

  .print-btn{
    display:none;
  }

}

</style>

</head>


<body>

<div class="label">

  <div class="logo">
    MODEX<span>.UZ</span>
  </div>

  <div class="order-id">
    #${escapeHtml(order.id)}
  </div>


  <div class="section">

    <div class="title">
      MIJOZ
    </div>

    <div class="value">
      ${escapeHtml(order.name || "")}
      ${escapeHtml(order.surname || "")}
    </div>

  </div>


  <div class="section">

    <div class="title">
      HUDUD / MANZIL
    </div>

    <div class="value">
      ${escapeHtml(order.region || "—")}
      <br>
      ${escapeHtml(order.address || "—")}
    </div>

  </div>


  <div class="section">

    <div class="title">
      MAHSULOT
    </div>

    <div class="value">
      ${escapeHtml(order.product || "Mahsulot")}
    </div>

  </div>


  <div class="section grid">

    <div>
      <div class="title">
        SONI
      </div>

      <div class="value">
        ${escapeHtml(order.quantity || 1)}
      </div>
    </div>

    <div>
      <div class="title">
        RAZMER
      </div>

      <div class="value">
        ${escapeHtml(order.size || "—")}
      </div>
    </div>

    <div>
      <div class="title">
        RANG
      </div>

      <div class="value">
        ${escapeHtml(order.color || "—")}
      </div>
    </div>

    <div>
      <div class="title">
        STATUS
      </div>

      <div class="value">
        ${escapeHtml(
          statusMap[order.status] ||
          order.status ||
          "—"
        )}
      </div>
    </div>

  </div>


  <div class="qr-wrap">
    <div id="qr"></div>
  </div>

  <div class="tip">
    QR orqali buyurtma holatini tekshirish mumkin
  </div>


  <button
    class="print-btn"
    onclick="window.print()"
  >
    🖨 Etiketkani chiqarish
  </button>

</div>


<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>

<script>

new QRCode(
  document.getElementById("qr"),
  {
    text: ${JSON.stringify(trackingUrl)},
    width: 150,
    height: 150
  }
);

<\/script>

</body>

</html>
    `);


    labelWindow.document.close();
  }


  /* =========================================
     FILTER BUTTONS
  ========================================= */

  function setFilter(status) {
    activeFilter =
      status || "all";


    document
      .querySelectorAll(
        ".operator-filter-btn"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.status === activeFilter
        );
      });


    document
      .querySelectorAll(
        ".operator-mobile-nav-btn"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.mobileFilter === activeFilter
        );
      });


    renderOrders();
  }


  /* =========================================
     EVENTS
  ========================================= */

  loginForm?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      showMessage(
        loginMessage,
        "Kirilmoqda..."
      );

      try {
        await login(
          emailInput.value.trim(),
          passwordInput.value
        );

        await openOperatorPanel();

        loginForm.reset();

        showMessage(
          loginMessage,
          ""
        );

      } catch (error) {
        clearSession();

        showMessage(
          loginMessage,
          error.message,
          "error"
        );
      }
    }
  );


  logoutBtn?.addEventListener(
    "click",
    () => {
      clearSession();

      operatorView
        ?.classList.add("hidden");

      loginView
        ?.classList.remove("hidden");

      mobileNav
        ?.classList.add("hidden");
    }
  );


  refreshBtn?.addEventListener(
    "click",
    async () => {
      refreshBtn.disabled = true;

      try {
        await loadOrders();
      } finally {
        refreshBtn.disabled = false;
      }
    }
  );


  searchInput?.addEventListener(
    "input",
    renderOrders
  );


  clearSearch?.addEventListener(
    "click",
    () => {
      searchInput.value = "";
      renderOrders();
    }
  );


  document
    .querySelectorAll(
      ".operator-filter-btn"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          setFilter(
            button.dataset.status
          );
        }
      );
    });


  document
    .querySelectorAll(
      ".operator-mobile-nav-btn"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          setFilter(
            button.dataset.mobileFilter
          );
        }
      );
    });


  closeDialogBtn?.addEventListener(
    "click",
    closeOrderDialog
  );


  orderForm?.addEventListener(
    "submit",
    saveOrder
  );


  qrBtn?.addEventListener(
    "click",
    createQrLabel
  );


  /* =========================================
     INIT
  ========================================= */

  async function init() {
    const token =
      getToken();


    if (!token) {
      loginView?.classList.remove(
        "hidden"
      );

      operatorView?.classList.add(
        "hidden"
      );

      mobileNav?.classList.add(
        "hidden"
      );

      return;
    }


    try {
      await openOperatorPanel();

    } catch (error) {
      clearSession();

      operatorView?.classList.add(
        "hidden"
      );

      loginView?.classList.remove(
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
