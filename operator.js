(() => {
  "use strict";

  /* ======================================================
     MODEX.UZ — OPERATOR PANEL
     LOGIN + ORDERS + DAILY STATS + STOCK RPC
  ====================================================== */

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;


  /* ======================================================
     ELEMENTLAR
  ====================================================== */

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


  /* STATS */

  const newCount =
    document.getElementById("operatorNewCount");

  const talkedCount =
    document.getElementById("operatorTalkedCount");

  const confirmedCount =
    document.getElementById("operatorConfirmedCount");

  const doneCount =
    document.getElementById("operatorDoneCount");


  /* SEARCH */

  const searchInput =
    document.getElementById("operatorOrderSearch");

  const clearSearch =
    document.getElementById("operatorClearSearch");


  /* ORDERS */

  const ordersContainer =
    document.getElementById("operatorOrders");

  const ordersMessage =
    document.getElementById("operatorOrdersMessage");

  const visibleCount =
    document.getElementById("operatorVisibleCount");


  /* MODAL */

  const dialog =
    document.getElementById("operatorOrderDialog");

  const closeDialogBtn =
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


  /* MOBILE */

  const mobileNav =
    document.getElementById("operatorMobileNav");


  /* ======================================================
     STATE
  ====================================================== */

  let currentUser = null;

  let currentProfile = null;

  let allOrders = [];

  let activeFilter = "all";

  let currentEditingOrder = null;


  /* ======================================================
     STATUS NOMLARI
  ====================================================== */

  const statusMap = {

    new: {
      text: "🔴 Yangi"
    },

    talked: {
      text: "🟠 Gaplashildi"
    },

    confirmed: {
      text: "🔵 Qadoqlanmoqda"
    },

    delivery: {
      text: "🟣 Yo‘lda"
    },

    done: {
      text: "🟢 Yetkazildi"
    },

    cancelled: {
      text: "⚪ Bekor"
    }

  };


  /* ======================================================
     HELPERS
  ====================================================== */

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


  function normalizePhone(value) {

    return String(value || "")
      .replace(/[^\d+]/g, "");

  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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

    if (!value) {
      return false;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const now =
      new Date();

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

    if (!element) {
      return;
    }

    element.textContent =
      text;

    element.className =
      "operator-message";

    if (type) {
      element.classList.add(type);
    }

  }


  /* ======================================================
     API
  ====================================================== */

  async function apiRequest(
    path,
    options = {},
    token = SUPABASE_KEY
  ) {

    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY
    ) {
      throw new Error(
        "Supabase config topilmadi."
      );
    }


    const response =
      await fetch(
        `${SUPABASE_URL}/${path}`,
        {
          ...options,

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              `Bearer ${token}`,

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

        if (data?.message) {
          message =
            data.message;
        }

        if (data?.details) {
          message +=
            ` — ${data.details}`;
        }

        if (data?.hint) {
          message +=
            ` — ${data.hint}`;
        }

      } catch (_) {}


      throw new Error(
        message
      );
    }


    if (
      response.status === 204
    ) {
      return null;
    }


    const text =
      await response.text();


    if (!text) {
      return null;
    }


    return JSON.parse(
      text
    );

  }


  /* ======================================================
     SESSION
  ====================================================== */

  function saveSession(session) {

    if (!session?.access_token) {
      return;
    }


    sessionStorage.setItem(
      "modex_operator_token",
      session.access_token
    );


    sessionStorage.setItem(
      "modex_operator_refresh",
      session.refresh_token || ""
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

    sessionStorage.removeItem(
      "modex_operator_refresh"
    );


    currentUser =
      null;

    currentProfile =
      null;

    currentEditingOrder =
      null;

    allOrders =
      [];

  }


  /* ======================================================
     LOGIN
  ====================================================== */

  async function login(
    email,
    password
  ) {

    const data =
      await apiRequest(
        "auth/v1/token?grant_type=password",
        {
          method: "POST",

          body:
            JSON.stringify({
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


    saveSession(
      data
    );


    return data;

  }


  /* ======================================================
     CURRENT USER
  ====================================================== */

  async function loadCurrentUser() {

    const token =
      getToken();


    if (!token) {

      throw new Error(
        "Sessiya topilmadi."
      );

    }


    const user =
      await apiRequest(
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


    currentUser =
      user;


    return user;

  }


  /* ======================================================
     PROFILE
  ====================================================== */

  async function loadProfile() {

    const token =
      getToken();


    const data =
      await apiRequest(
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


    if (
      profile.role !== "operator"
    ) {

      throw new Error(
        "Bu hisob operator emas."
      );

    }


    if (
      profile.active !== true
    ) {

      throw new Error(
        "Operator bloklangan."
      );

    }


    currentProfile =
      profile;


    return profile;

  }


  /* ======================================================
     PANEL
  ====================================================== */

  async function openOperatorPanel() {

    await loadCurrentUser();

    await loadProfile();


    loginView
      ?.classList.add(
        "hidden"
      );


    operatorView
      ?.classList.remove(
        "hidden"
      );


    mobileNav
      ?.classList.remove(
        "hidden"
      );


    if (operatorUserName) {

      operatorUserName.textContent =
        currentProfile.name ||
        currentUser.email ||
        "Operator";

    }


    await loadOrders();

  }


  /* ======================================================
     ORDERS LOAD
  ====================================================== */

  async function loadOrders() {

    const token =
      getToken();


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

      console.error(
        error
      );


      showMessage(
        ordersMessage,
        error.message ||
        "Buyurtmalarni yuklab bo‘lmadi.",
        "error"
      );

    }

  }


  /* ======================================================
     BUGUN SHU OPERATOR GAPLASHGANMI
  ====================================================== */

  function wasTalkedTodayByMe(order) {

    if (!currentUser) {
      return false;
    }


    return (
      order.operator_id === currentUser.id &&
      isToday(order.talked_at)
    );

  }


  /* ======================================================
     STATS
  ====================================================== */

  function updateStats() {

    const newOrders =
      allOrders.filter(
        order =>
          order.status === "new"
      );


    /*
      MUHIM:
      Status hozir confirmed/delivery/done
      bo‘lib qolgan bo‘lsa ham, operator
      bugun gaplashgan bo‘lsa hisobda qoladi.
    */

    const todayTalked =
      allOrders.filter(
        wasTalkedTodayByMe
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


    if (newCount) {
      newCount.textContent =
        newOrders.length;
    }


    if (talkedCount) {
      talkedCount.textContent =
        todayTalked.length;
    }


    if (confirmedCount) {
      confirmedCount.textContent =
        confirmedOrders.length;
    }


    if (doneCount) {
      doneCount.textContent =
        doneOrders.length;
    }

  }


  /* ======================================================
     FILTER
  ====================================================== */

  function getFilteredOrders() {

    let list =
      [...allOrders];


    if (
      activeFilter === "talked"
    ) {

      /*
        Faqat BUGUN shu operator gaplashganlar.
        Status keyin o‘zgargan bo‘lishi mumkin.
      */

      list =
        list.filter(
          wasTalkedTodayByMe
        );

    } else if (
      activeFilter !== "all"
    ) {

      list =
        list.filter(
          order =>
            order.status === activeFilter
        );

    }


    const query =
      searchInput?.value
        ?.trim()
        ?.toLowerCase() || "";


    if (query) {

      list =
        list.filter(order => {

          const text = `

            ${order.id || ""}

            ${order.name || ""}

            ${order.surname || ""}

            ${order.phone || ""}

            ${order.product || ""}

            ${order.region || ""}

            ${order.address || ""}

          `.toLowerCase();


          return text.includes(
            query
          );

        });

    }


    return list;

  }


  /* ======================================================
     RENDER ORDERS
  ====================================================== */

  function renderOrders() {

    if (!ordersContainer) {
      return;
    }


    const list =
      getFilteredOrders();


    if (visibleCount) {

      visibleCount.textContent =
        `${list.length} ta`;

    }


    ordersContainer.innerHTML =
      "";


    if (
      list.length === 0
    ) {

      ordersContainer.innerHTML = `

        <div
          style="
            grid-column:1/-1;
            padding:35px 15px;
            text-align:center;
            color:#777783;
            border:1px dashed #dddde6;
            border-radius:15px;
          "
        >

          Hozircha buyurtma yo‘q.

        </div>
      `;

      return;
    }


    list.forEach(
      order => {

        const status =
          order.status || "new";


        const statusInfo =
          statusMap[status] ||
          statusMap.new;


        const phone =
          normalizePhone(
            order.phone
          );


        const card =
          document.createElement(
            "article"
          );


        card.className =
          `operator-order-card status-${status}`;


        card.innerHTML = `

          <div class="operator-order-top">

            <div>

              <span class="operator-order-id">
                BUYURTMA #${escapeHtml(order.id)}
              </span>

              <strong class="operator-order-name">

                ${escapeHtml(
                  order.name ||
                  "Mijoz"
                )}

                ${
                  order.surname
                    ? escapeHtml(
                        " " + order.surname
                      )
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
                order.product ||
                "Mahsulot"
              )}
            </strong>

          </div>


          <div class="operator-order-info-grid">

            <div>

              <span>
                SONI
              </span>

              <strong>
                ${escapeHtml(
                  order.quantity || 1
                )}
              </strong>

            </div>


            <div>

              <span>
                RAZMER
              </span>

              <strong>
                ${escapeHtml(
                  order.size || "—"
                )}
              </strong>

            </div>


            <div>

              <span>
                RANG
              </span>

              <strong>
                ${escapeHtml(
                  order.color || "—"
                )}
              </strong>

            </div>

          </div>


          ${
            order.region ||
            order.address

              ? `

                <div class="operator-location">

                  📍

                  ${escapeHtml(
                    order.region || ""
                  )}

                  ${
                    order.address

                      ? " — " +
                        escapeHtml(
                          order.address
                        )

                      : ""
                  }

                </div>

              `

              : ""
          }


          ${
            wasTalkedTodayByMe(order)

              ? `

                <div
                  style="
                    margin:8px 0;
                    padding:7px 9px;
                    border-radius:10px;
                    background:#fff6e9;
                    color:#b4680f;
                    font-size:10px;
                    font-weight:850;
                  "
                >

                  🟠 Bugun siz gaplashgansiz

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

            ${formatDate(
              order.created_at
            )}

          </small>

        `;


        ordersContainer.appendChild(
          card
        );

      }
    );


    document
      .querySelectorAll(
        ".operator-edit-order-btn"
      )
      .forEach(
        button => {

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

        }
      );

  }


  /* ======================================================
     OPEN ORDER
  ====================================================== */

  function openOrder(orderId) {

    const order =
      allOrders.find(
        item =>
          Number(item.id) ===
          Number(orderId)
      );


    if (!order) {
      return;
    }


    currentEditingOrder =
      order;


    if (editOrderId) {
      editOrderId.value =
        order.id;
    }


    if (orderTitle) {
      orderTitle.textContent =
        `Buyurtma #${order.id}`;
    }


    if (editName) {
      editName.value =
        order.name || "";
    }


    if (editSurname) {
      editSurname.value =
        order.surname || "";
    }


    if (editPhone) {
      editPhone.value =
        order.phone || "";
    }


    if (editProduct) {
      editProduct.value =
        order.product || "";
    }


    if (editQuantity) {

      editQuantity.value =
        order.quantity || 1;

      /*
        Stock allaqachon kamaygan bo‘lsa
        miqdorni o‘zgartirmaymiz.
      */

      editQuantity.disabled =
        order.stock_adjusted === true;

    }


    if (editSize) {
      editSize.value =
        order.size || "";
    }


    if (editColor) {
      editColor.value =
        order.color || "";
    }


    if (editRegion) {
      editRegion.value =
        order.region || "";
    }


    if (editAddress) {
      editAddress.value =
        order.address || "";
    }


    if (editNote) {
      editNote.value =
        order.note || "";
    }


    if (editStatus) {
      editStatus.value =
        order.status || "new";
    }


    if (
      callCustomer &&
      order.phone
    ) {

      callCustomer.href =
        `tel:${normalizePhone(order.phone)}`;

      callCustomer.classList.remove(
        "hidden"
      );

    } else if (
      callCustomer
    ) {

      callCustomer.href =
        "#";

      callCustomer.classList.add(
        "hidden"
      );

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


  /* ======================================================
     CLOSE ORDER
  ====================================================== */

  function closeOrderDialog() {

    if (!dialog) {
      return;
    }


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


    if (editQuantity) {

      editQuantity.disabled =
        false;

    }


    currentEditingOrder =
      null;

  }


  /* ======================================================
     SAVE ORDER
  ====================================================== */

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
      Number(
        editOrderId.value
      );


    const oldStatus =
      currentEditingOrder.status ||
      "new";


    const newStatus =
      editStatus.value ||
      "new";


    const oldQuantity =
      Math.max(
        1,
        Number(
          currentEditingOrder.quantity ||
          1
        )
      );


    const newQuantity =
      Math.max(
        1,
        Number(
          editQuantity.value ||
          oldQuantity
        )
      );


    /*
      Stock allaqachon kamaygan bo‘lsa
      quantity o‘zgarmasligi kerak.
    */

    if (
      currentEditingOrder.stock_adjusted === true &&
      newQuantity !== oldQuantity
    ) {

      showMessage(
        orderMessage,
        "Tasdiqlangan buyurtmada sonini o‘zgartirib bo‘lmaydi.",
        "error"
      );

      return;

    }


    showMessage(
      orderMessage,
      "Saqlanmoqda..."
    );


    try {

      /*
        ======================================
        1. BUYURTMA MA'LUMOTLARINI SAQLASH
        ======================================
      */

      const detailsPayload = {

        name:
          editName.value.trim(),

        surname:
          editSurname.value.trim() ||
          null,

        phone:
          editPhone.value.trim(),

        quantity:
          newQuantity,

        size:
          editSize.value.trim() ||
          null,

        color:
          editColor.value.trim() ||
          null,

        region:
          editRegion.value.trim() ||
          null,

        address:
          editAddress.value.trim() ||
          null,

        note:
          editNote.value.trim() ||
          null,

        updated_at:
          new Date().toISOString()

      };


      await apiRequest(
        `rest/v1/orders?id=eq.${orderId}`,
        {
          method: "PATCH",

          headers: {
            "Prefer":
              "return=minimal"
          },

          body:
            JSON.stringify(
              detailsPayload
            )
        },
        token
      );


      /*
        ======================================
        2. STATUS O'ZGARSA RPC
        ======================================

        operator_id FAQAT "talked"
        bo‘lganda yuboriladi.

        Shunda keyin boshqa operator
        Tasdiqlandi qilsa ham avval
        gaplashgan operator IDsi o‘chmaydi.
      */

      if (
        oldStatus !== newStatus
      ) {

        const talkedOperatorId =
          newStatus === "talked"
            ? currentUser.id
            : null;


        await apiRequest(
          "rest/v1/rpc/update_order_status_with_stock",
          {
            method: "POST",

            body:
              JSON.stringify({
                p_order_id:
                  orderId,

                p_new_status:
                  newStatus,

                p_operator_id:
                  talkedOperatorId
              })
          },
          token
        );

      }


      /*
        ======================================
        3. ORDERNI QAYTA OLISH
        ======================================
      */

      const updated =
        await apiRequest(
          `rest/v1/orders?id=eq.${orderId}&select=*`,
          {
            method: "GET"
          },
          token
        );


      const savedOrder =
        Array.isArray(updated)
          ? updated[0]
          : null;


      if (!savedOrder) {

        throw new Error(
          "Buyurtma yangilanmadi."
        );

      }


      allOrders =
        allOrders.map(
          order => {

            if (
              Number(order.id) ===
              orderId
            ) {

              return savedOrder;

            }

            return order;

          }
        );


      currentEditingOrder =
        savedOrder;


      updateStats();

      renderOrders();


      showMessage(
        orderMessage,
        "✅ Saqlandi",
        "success"
      );


      setTimeout(
        () => {

          closeOrderDialog();

        },
        500
      );


    } catch (error) {

      console.error(
        error
      );


      showMessage(
        orderMessage,
        error.message ||
        "Saqlashda xatolik.",
        "error"
      );

    }

  }


  /* ======================================================
     FILTER
  ====================================================== */

  function setFilter(status) {

    activeFilter =
      status || "all";


    document
      .querySelectorAll(
        ".operator-filter-btn"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.status ===
              activeFilter
          );

        }
      );


    document
      .querySelectorAll(
        ".operator-mobile-nav-btn"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.mobileFilter ===
              activeFilter
          );

        }
      );


    renderOrders();

  }


  /* ======================================================
     LOGIN FORM
  ====================================================== */

  loginForm
    ?.addEventListener(
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

          console.error(
            error
          );


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


  /* ======================================================
     LOGOUT
  ====================================================== */

  logoutBtn
    ?.addEventListener(
      "click",
      () => {

        clearSession();


        operatorView
          ?.classList.add(
            "hidden"
          );


        loginView
          ?.classList.remove(
            "hidden"
          );


        mobileNav
          ?.classList.add(
            "hidden"
          );


        if (
          ordersContainer
        ) {

          ordersContainer.innerHTML =
            "";

        }

      }
    );


  /* ======================================================
     REFRESH
  ====================================================== */

  refreshBtn
    ?.addEventListener(
      "click",
      async () => {

        refreshBtn.disabled =
          true;


        try {

          await loadOrders();

        } finally {

          refreshBtn.disabled =
            false;

        }

      }
    );


  /* ======================================================
     SEARCH
  ====================================================== */

  searchInput
    ?.addEventListener(
      "input",
      renderOrders
    );


  clearSearch
    ?.addEventListener(
      "click",
      () => {

        searchInput.value =
          "";


        renderOrders();


        searchInput.focus();

      }
    );


  /* ======================================================
     DESKTOP FILTER BUTTONS
  ====================================================== */

  document
    .querySelectorAll(
      ".operator-filter-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setFilter(
              button.dataset.status ||
              "all"
            );

          }
        );

      }
    );


  /* ======================================================
     MOBILE FILTER BUTTONS
  ====================================================== */

  document
    .querySelectorAll(
      ".operator-mobile-nav-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setFilter(
              button.dataset.mobileFilter ||
              "all"
            );

          }
        );

      }
    );


  /* ======================================================
     MODAL EVENTS
  ====================================================== */

  closeDialogBtn
    ?.addEventListener(
      "click",
      closeOrderDialog
    );


  orderForm
    ?.addEventListener(
      "submit",
      saveOrder
    );


  dialog
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target === dialog
        ) {

          closeOrderDialog();

        }

      }
    );


  /* ======================================================
     QR
  ====================================================== */

  qrBtn
    ?.addEventListener(
      "click",
      () => {

        if (
          !currentEditingOrder
        ) {

          return;

        }


        alert(
          `QR etiketka keyingi bosqichda ulanadi.\nBuyurtma #${currentEditingOrder.id}`
        );

      }
    );


  /* ======================================================
     INIT
  ====================================================== */

  async function init() {

    const token =
      getToken();


    if (!token) {

      loginView
        ?.classList.remove(
          "hidden"
        );


      operatorView
        ?.classList.add(
          "hidden"
        );


      mobileNav
        ?.classList.add(
          "hidden"
        );


      return;

    }


    try {

      await openOperatorPanel();

    } catch (error) {

      console.error(
        error
      );


      clearSession();


      operatorView
        ?.classList.add(
          "hidden"
        );


      loginView
        ?.classList.remove(
          "hidden"
        );


      mobileNav
        ?.classList.add(
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
