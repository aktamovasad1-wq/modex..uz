(() => {
  "use strict";

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  /* =====================================================
     ELEMENTLAR
  ===================================================== */

  const loginView =
    document.getElementById("operatorLoginView");

  const operatorView =
    document.getElementById("operatorView");

  const loginForm =
    document.getElementById("operatorLoginForm");

  const emailInput =
    document.getElementById("operatorEmail");

  const passwordInput =
    document.getElementById("operatorPassword");

  const loginMessage =
    document.getElementById("operatorLoginMessage");

  const operatorUserName =
    document.getElementById("operatorUserName");

  const refreshBtn =
    document.getElementById("operatorRefreshBtn");

  const logoutBtn =
    document.getElementById("operatorLogoutBtn");

  const newCount =
    document.getElementById("operatorNewCount");

  const talkedCount =
    document.getElementById("operatorTalkedCount");

  const confirmedCount =
    document.getElementById("operatorConfirmedCount");

  const doneCount =
    document.getElementById("operatorDoneCount");

  const searchInput =
    document.getElementById("operatorOrderSearch");

  const clearSearch =
    document.getElementById("operatorClearSearch");

  const ordersContainer =
    document.getElementById("operatorOrders");

  const ordersMessage =
    document.getElementById("operatorOrdersMessage");

  const visibleCount =
    document.getElementById("operatorVisibleCount");

  const dialog =
    document.getElementById("operatorOrderDialog");

  const closeDialog =
    document.getElementById("operatorCloseOrder");

  const orderTitle =
    document.getElementById("operatorOrderTitle");

  const orderForm =
    document.getElementById("operatorOrderForm");

  const editOrderId =
    document.getElementById("operatorEditOrderId");

  const editName =
    document.getElementById("operatorEditName");

  const editSurname =
    document.getElementById("operatorEditSurname");

  const editPhone =
    document.getElementById("operatorEditPhone");

  const editProduct =
    document.getElementById("operatorEditProduct");

  const editQuantity =
    document.getElementById("operatorEditQuantity");

  const editSize =
    document.getElementById("operatorEditSize");

  const editColor =
    document.getElementById("operatorEditColor");

  const editRegion =
    document.getElementById("operatorEditRegion");

  const editAddress =
    document.getElementById("operatorEditAddress");

  const editNote =
    document.getElementById("operatorEditNote");

  const editStatus =
    document.getElementById("operatorEditStatus");

  const callCustomer =
    document.getElementById("operatorCallCustomer");

  const qrBtn =
    document.getElementById("operatorQrBtn");

  const orderMessage =
    document.getElementById("operatorOrderMessage");

  const mobileNav =
    document.getElementById("operatorMobileNav");


  /* =====================================================
     STATE
  ===================================================== */

  let currentUser = null;
  let currentProfile = null;

  let allOrders = [];

  let activeFilter = "all";

  let currentEditingOrder = null;


  /* =====================================================
     STATUS
  ===================================================== */

  const statusMap = {
    new: {
      text: "🔴 Yangi"
    },

    talked: {
      text: "🟠 Gaplashildi"
    },

    confirmed: {
      text: "🔵 Tasdiqlandi"
    },

    delivery: {
      text: "🟣 Yetkazishda"
    },

    done: {
      text: "🟢 Yakunlandi"
    },

    cancelled: {
      text: "⚪ Bekor"
    }
  };


  /* =====================================================
     YORDAMCHI FUNKSIYALAR
  ===================================================== */

  function showMessage(element, text, type = "") {
    if (!element) return;

    element.textContent = text;

    element.className =
      element === loginMessage
        ? "operator-message"
        : "form-message";

    if (type) {
      element.classList.add(type);
    }
  }


  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHtml(value);
  }


  function formatDate(value) {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleString(
        "uz-UZ",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      );
    } catch (_) {
      return "—";
    }
  }


  function normalizePhone(phone) {
    return String(phone || "")
      .replace(/[^\d+]/g, "");
  }


  /* =====================================================
     BUGUNMI?
  ===================================================== */

  function isToday(value) {
    if (!value) {
      return false;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }


  /* =====================================================
     SUPABASE REQUEST
  ===================================================== */

  async function apiRequest(
    path,
    options = {},
    token = SUPABASE_KEY
  ) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        "Supabase config topilmadi."
      );
    }

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
        const errorData =
          await response.json();

        if (errorData?.message) {
          message = errorData.message;
        }

        if (errorData?.details) {
          message +=
            ` — ${errorData.details}`;
        }

      } catch (_) {}

      throw new Error(message);
    }

    if (response.status === 204) {
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
     TOKEN
  ===================================================== */

  function saveSession(session) {
    if (!session) return;

    sessionStorage.setItem(
      "modex_operator_token",
      session.access_token
    );

    sessionStorage.setItem(
      "modex_operator_refresh",
      session.refresh_token || ""
    );
  }


  function clearSession() {
    sessionStorage.removeItem(
      "modex_operator_token"
    );

    sessionStorage.removeItem(
      "modex_operator_refresh"
    );

    currentUser = null;
    currentProfile = null;
  }


  function getToken() {
    return sessionStorage.getItem(
      "modex_operator_token"
    );
  }


  /* =====================================================
     LOGIN
  ===================================================== */

  async function login(email, password) {
    const data = await apiRequest(
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


  /* =====================================================
     USERNI OLISH
  ===================================================== */

  async function loadCurrentUser() {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Operator sessiyasi topilmadi."
      );
    }

    const user = await apiRequest(
      "auth/v1/user",
      {
        method: "GET"
      },
      token
    );

    if (!user?.id) {
      throw new Error(
        "Operator aniqlanmadi."
      );
    }

    currentUser = user;

    return user;
  }


  /* =====================================================
     PROFILE
  ===================================================== */

  async function loadProfile() {
    const token = getToken();

    const data = await apiRequest(
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
        "Operator profili topilmadi."
      );
    }

    if (profile.role !== "operator") {
      throw new Error(
        "Bu akkaunt operator emas."
      );
    }

    if (profile.active !== true) {
      throw new Error(
        "Operator bloklangan."
      );
    }

    currentProfile = profile;

    return profile;
  }


  /* =====================================================
     PANELNI OCHISH
  ===================================================== */

  async function openOperatorPanel() {
    await loadCurrentUser();
    await loadProfile();

    loginView.classList.add("hidden");
    operatorView.classList.remove("hidden");

    if (mobileNav) {
      mobileNav.classList.remove("hidden");
    }

    operatorUserName.textContent =
      currentProfile.name ||
      currentUser.email ||
      "Operator";

    await loadOrders();
  }


  /* =====================================================
     BUYURTMALARNI YUKLASH
  ===================================================== */

  async function loadOrders() {
    const token = getToken();

    showMessage(
      ordersMessage,
      "Buyurtmalar yuklanmoqda..."
    );

    try {
      const data = await apiRequest(
        "rest/v1/orders?select=*&order=id.desc",
        {
          method: "GET"
        },
        token
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
      console.error(error);

      showMessage(
        ordersMessage,
        error.message ||
        "Buyurtmalarni yuklab bo‘lmadi.",
        "error"
      );
    }
  }


  /* =====================================================
     STATISTIKA
  ===================================================== */

  function updateStats() {
    const newOrders =
      allOrders.filter(
        order => order.status === "new"
      );

    /*
      MUHIM:
      Gaplashildi faqat BUGUNGI talked_at
    */
    const todayTalked =
      allOrders.filter(
        order =>
          order.status === "talked" &&
          isToday(order.talked_at)
      );

    const confirmedOrders =
      allOrders.filter(
        order =>
          order.status === "confirmed"
      );

    const doneOrders =
      allOrders.filter(
        order =>
          order.status === "done"
      );

    newCount.textContent =
      newOrders.length;

    talkedCount.textContent =
      todayTalked.length;

    confirmedCount.textContent =
      confirmedOrders.length;

    doneCount.textContent =
      doneOrders.length;
  }


  /* =====================================================
     FILTER
  ===================================================== */

  function getFilteredOrders() {
    let orders =
      [...allOrders];

    /*
      Gaplashildi filteri:
      faqat bugungi gaplashilganlar
    */
    if (activeFilter === "talked") {
      orders =
        orders.filter(
          order =>
            order.status === "talked" &&
            isToday(order.talked_at)
        );

    } else if (
      activeFilter !== "all"
    ) {
      orders =
        orders.filter(
          order =>
            order.status === activeFilter
        );
    }


    const query =
      searchInput?.value
        ?.trim()
        ?.toLowerCase() || "";


    if (query) {
      orders =
        orders.filter(order => {
          const text = `
            ${order.id || ""}
            ${order.name || ""}
            ${order.surname || ""}
            ${order.phone || ""}
            ${order.product || ""}
            ${order.region || ""}
            ${order.address || ""}
          `.toLowerCase();

          return text.includes(query);
        });
    }

    return orders;
  }


  /* =====================================================
     ORDER CARD
  ===================================================== */

  function renderOrders() {
    const orders =
      getFilteredOrders();

    visibleCount.textContent =
      `${orders.length} ta`;

    ordersContainer.innerHTML = "";

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div style="
          padding:35px 15px;
          text-align:center;
          color:#777783;
          border:1px dashed #dddde6;
          border-radius:15px;
          grid-column:1/-1;
        ">
          Hozircha buyurtma yo‘q.
        </div>
      `;

      return;
    }


    orders.forEach(order => {
      const status =
        order.status || "new";

      const statusInfo =
        statusMap[status] ||
        statusMap.new;

      const phone =
        normalizePhone(order.phone);

      const card =
        document.createElement("article");

      card.className =
        `operator-order-card status-${status}`;

      card.innerHTML = `

        <div class="operator-order-top">

          <div>

            <span class="operator-order-id">
              BUYURTMA #${escapeHtml(order.id)}
            </span>

            <strong class="operator-order-name">
              ${escapeHtml(order.name || "Mijoz")}
              ${order.surname
                ? escapeHtml(" " + order.surname)
                : ""
              }
            </strong>

          </div>

          <span class="operator-order-status">
            ${statusInfo.text}
          </span>

        </div>


        <div class="operator-product-box">

          <span>
            MAHSULOT
          </span>

          <strong>
            ${escapeHtml(
              order.product || "Mahsulot"
            )}
          </strong>

        </div>


        <div class="operator-order-info-grid">

          <div>
            <span>SONI</span>
            <strong>
              ${escapeHtml(
                order.quantity || 1
              )}
            </strong>
          </div>

          <div>
            <span>RAZMER</span>
            <strong>
              ${escapeHtml(
                order.size || "—"
              )}
            </strong>
          </div>

          <div>
            <span>RANG</span>
            <strong>
              ${escapeHtml(
                order.color || "—"
              )}
            </strong>
          </div>

        </div>


        ${
          order.region || order.address
            ? `
              <div class="operator-location">
                📍
                ${escapeHtml(order.region || "")}
                ${order.address
                  ? " — " +
                    escapeHtml(order.address)
                  : ""
                }
              </div>
            `
            : ""
        }


        ${
          phone
            ? `
              <a
                href="tel:${escapeAttribute(phone)}"
                class="operator-call-btn"
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

      ordersContainer.appendChild(card);
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
              Number(button.dataset.orderId)
            );
          }
        );
      });
  }


  /* =====================================================
     MODALNI OCHISH
  ===================================================== */

  function openOrder(orderId) {
    const order =
      allOrders.find(
        item =>
          Number(item.id) === Number(orderId)
      );

    if (!order) {
      return;
    }

    currentEditingOrder = order;

    editOrderId.value =
      order.id;

    orderTitle.textContent =
      `Buyurtma #${order.id}`;

    editName.value =
      order.name || "";

    editSurname.value =
      order.surname || "";

    editPhone.value =
      order.phone || "";

    editProduct.value =
      order.product || "";

    editQuantity.value =
      order.quantity || 1;

    editSize.value =
      order.size || "";

    editColor.value =
      order.color || "";

    editRegion.value =
      order.region || "";

    editAddress.value =
      order.address || "";

    editNote.value =
      order.note || "";

    editStatus.value =
      order.status || "new";


    if (order.phone) {
      callCustomer.href =
        `tel:${normalizePhone(order.phone)}`;

      callCustomer.classList.remove(
        "hidden"
      );

    } else {
      callCustomer.href = "#";

      callCustomer.classList.add(
        "hidden"
      );
    }


    showMessage(
      orderMessage,
      ""
    );


    if (
      typeof dialog.showModal ===
      "function"
    ) {
      dialog.showModal();

    } else {
      dialog.setAttribute(
        "open",
        ""
      );
    }
  }


  /* =====================================================
     MODALNI YOPISH
  ===================================================== */

  function closeOrderDialog() {
    if (!dialog) return;

    if (
      typeof dialog.close ===
      "function"
    ) {
      dialog.close();

    } else {
      dialog.removeAttribute(
        "open"
      );
    }

    currentEditingOrder = null;
  }


  /* =====================================================
     BUYURTMANI SAQLASH
  ===================================================== */

  async function saveOrder(event) {
    event.preventDefault();

    if (
      !currentEditingOrder ||
      !currentUser
    ) {
      return;
    }


    const token =
      getToken();

    const orderId =
      Number(editOrderId.value);

    const oldStatus =
      currentEditingOrder.status || "new";

    const newStatus =
      editStatus.value || "new";


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

      status:
        newStatus,

      updated_at:
        new Date().toISOString()
    };


    /*
      ===============================
      GAPLAShILDI
      ===============================

      Status Gaplashildi bo‘lsa:
      kim gaplashgani + vaqt yoziladi.
    */

    if (newStatus === "talked") {

      /*
        Agar boshqa statusdan
        Gaplashildiga o‘tayotgan bo‘lsa
      */
      if (
        oldStatus !== "talked" ||
        !currentEditingOrder.talked_at ||
        !currentEditingOrder.operator_id
      ) {
        payload.talked_at =
          new Date().toISOString();

        payload.operator_id =
          currentUser.id;
      }

    }


    showMessage(
      orderMessage,
      "Saqlanmoqda..."
    );


    try {
      const updated =
        await apiRequest(
          `rest/v1/orders?id=eq.${orderId}`,
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


      const savedOrder =
        Array.isArray(updated)
          ? updated[0]
          : updated;


      if (!savedOrder) {
        throw new Error(
          "Buyurtma yangilanmadi."
        );
      }


      showMessage(
        orderMessage,
        "✅ Saqlandi",
        "success"
      );


      /*
        Local arrayni ham yangilaymiz
      */

      allOrders =
        allOrders.map(order => {
          if (
            Number(order.id) ===
            orderId
          ) {
            return {
              ...order,
              ...savedOrder
            };
          }

          return order;
        });


      currentEditingOrder =
        savedOrder;


      updateStats();
      renderOrders();


      setTimeout(() => {
        closeOrderDialog();
      }, 500);


    } catch (error) {
      console.error(error);

      showMessage(
        orderMessage,
        error.message ||
        "Saqlashda xatolik.",
        "error"
      );
    }
  }


  /* =====================================================
     FILTER BUTTONS
  ===================================================== */

  function setFilter(status) {
    activeFilter = status;

    document
      .querySelectorAll(
        ".operator-filter-btn"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.status ===
            status
        );
      });


    document
      .querySelectorAll(
        ".operator-mobile-nav-btn"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.mobileFilter ===
            status
        );
      });


    renderOrders();
  }


  /* =====================================================
     LOGIN FORM
  ===================================================== */

  loginForm?.addEventListener(
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

        await openOperatorPanel();

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
     LOGOUT
  ===================================================== */

  logoutBtn?.addEventListener(
    "click",
    () => {
      clearSession();

      operatorView.classList.add(
        "hidden"
      );

      loginView.classList.remove(
        "hidden"
      );

      if (mobileNav) {
        mobileNav.classList.add(
          "hidden"
        );
      }

      allOrders = [];

      ordersContainer.innerHTML = "";
    }
  );


  /* =====================================================
     REFRESH
  ===================================================== */

  refreshBtn?.addEventListener(
    "click",
    loadOrders
  );


  /* =====================================================
     SEARCH
  ===================================================== */

  searchInput?.addEventListener(
    "input",
    renderOrders
  );


  clearSearch?.addEventListener(
    "click",
    () => {
      searchInput.value = "";

      renderOrders();

      searchInput.focus();
    }
  );


  /* =====================================================
     DESKTOP FILTER
  ===================================================== */

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


  /* =====================================================
     MOBILE FILTER
  ===================================================== */

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


  /* =====================================================
     MODAL
  ===================================================== */

  closeDialog?.addEventListener(
    "click",
    closeOrderDialog
  );


  orderForm?.addEventListener(
    "submit",
    saveOrder
  );


  dialog?.addEventListener(
    "click",
    event => {
      if (event.target === dialog) {
        closeOrderDialog();
      }
    }
  );


  /* =====================================================
     QR
  ===================================================== */

  qrBtn?.addEventListener(
    "click",
    () => {
      if (!currentEditingOrder) {
        return;
      }

      alert(
        `QR etiketka keyingi bosqichda ulanadi.\nBuyurtma #${currentEditingOrder.id}`
      );
    }
  );


  /* =====================================================
     SAHIFA OCHILGANDA SESSIONNI TEKSHIRISH
  ===================================================== */

  async function init() {
    const token = getToken();

    if (!token) {
      loginView.classList.remove(
        "hidden"
      );

      operatorView.classList.add(
        "hidden"
      );

      return;
    }


    try {
      await openOperatorPanel();

    } catch (error) {
      console.error(error);

      clearSession();

      operatorView.classList.add(
        "hidden"
      );

      loginView.classList.remove(
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
