(() => {
  "use strict";

  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  const $ = id =>
    document.getElementById(id);


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const form =
    $("trackForm");

  const orderIdInput =
    $("orderId");

  const phoneInput =
    $("phone");

  const message =
    $("trackMessage");

  const result =
    $("trackResult");

  const resultOrderId =
    $("resultOrderId");

  const resultCustomer =
    $("resultCustomer");

  const resultProduct =
    $("resultProduct");

  const resultQuantity =
    $("resultQuantity");

  const resultSize =
    $("resultSize");

  const resultColor =
    $("resultColor");

  const resultStatus =
    $("resultStatus");

  const resultCreated =
    $("resultCreated");

  const resultUpdated =
    $("resultUpdated");


  /* =========================================================
     STATUS
  ========================================================= */

  const statusMap = {

    new: {
      text: "🔴 Buyurtma qabul qilindi",
      step: 1
    },

    talked: {
      text: "🟠 Operator tekshirmoqda",
      step: 2
    },

    confirmed: {
      text: "🔵 Qadoqlanmoqda",
      step: 3
    },

    delivery: {
      text: "🟣 Yo‘lda",
      step: 4
    },

    done: {
      text: "🟢 Yetkazildi",
      step: 5
    },

    cancelled: {
      text: "⚪ Bekor qilindi",
      step: 0
    }

  };


  /* =========================================================
     HELPERS
  ========================================================= */

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
      .replace(/\D/g, "");
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


  function showMessage(
    text,
    type = ""
  ) {

    if (!message) {
      return;
    }


    message.textContent =
      text;


    message.className =
      "track-message";


    if (type) {
      message.classList.add(
        type
      );
    }
  }


  function hideResult() {

    result?.classList.add(
      "hidden"
    );
  }


  function showResult() {

    result?.classList.remove(
      "hidden"
    );
  }


  /* =========================================================
     API
  ========================================================= */

  async function trackOrder(
    orderId,
    phone
  ) {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/track_order`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_KEY}`
          },

          body:
            JSON.stringify({
              p_order_id:
                Number(orderId),

              p_phone:
                phone
            })
        }
      );


    if (!response.ok) {

      let errorText =
        "Buyurtmani tekshirib bo‘lmadi.";


      try {

        const error =
          await response.json();


        errorText =
          error?.message ||
          errorText;


      } catch (_) {}


      throw new Error(
        errorText
      );
    }


    const data =
      await response.json();


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      return null;
    }


    return data[0];
  }


  /* =========================================================
     TIMELINE
  ========================================================= */

  function updateTimeline(status) {

    const info =
      statusMap[status] ||
      statusMap.new;


    document
      .querySelectorAll(
        "[data-track-step]"
      )
      .forEach(element => {

        const step =
          Number(
            element.dataset.trackStep
          );


        element.classList.remove(
          "active",
          "done",
          "cancelled"
        );


        if (
          status === "cancelled"
        ) {

          element.classList.add(
            "cancelled"
          );

          return;
        }


        if (
          step < info.step
        ) {

          element.classList.add(
            "done"
          );

        } else if (
          step === info.step
        ) {

          element.classList.add(
            "active"
          );

        }

      });

  }


  /* =========================================================
     RENDER RESULT
  ========================================================= */

  function renderOrder(order) {

    if (!order) {
      return;
    }


    const info =
      statusMap[
        order.status
      ] ||
      {
        text:
          order.status || "—",
        step: 1
      };


    if (resultOrderId) {

      resultOrderId.textContent =
        `#${order.order_id}`;

    }


    if (resultCustomer) {

      resultCustomer.textContent =
        order.customer_name ||
        "—";

    }


    if (resultProduct) {

      resultProduct.textContent =
        order.product_name ||
        "—";

    }


    if (resultQuantity) {

      resultQuantity.textContent =
        order.quantity || 1;

    }


    if (resultSize) {

      resultSize.textContent =
        order.size || "—";

    }


    if (resultColor) {

      resultColor.textContent =
        order.color || "—";

    }


    if (resultStatus) {

      resultStatus.textContent =
        info.text;

      resultStatus.setAttribute(
        "data-status",
        order.status || "new"
      );

    }


    if (resultCreated) {

      resultCreated.textContent =
        formatDate(
          order.created_at
        );

    }


    if (resultUpdated) {

      resultUpdated.textContent =
        formatDate(
          order.updated_at
        );

    }


    updateTimeline(
      order.status
    );


    showResult();

  }


  /* =========================================================
     SEARCH
  ========================================================= */

  async function handleTrack(
    event = null
  ) {

    event?.preventDefault();


    const orderId =
      orderIdInput?.value
        ?.trim();


    const phone =
      phoneInput?.value
        ?.trim();


    if (!orderId) {

      hideResult();

      showMessage(
        "Buyurtma ID raqamini kiriting.",
        "error"
      );

      orderIdInput?.focus();

      return;
    }


    if (!phone) {

      hideResult();

      showMessage(
        "Telefon raqamingizni kiriting.",
        "error"
      );

      phoneInput?.focus();

      return;
    }


    if (
      !Number.isFinite(
        Number(orderId)
      )
    ) {

      hideResult();

      showMessage(
        "Buyurtma ID noto‘g‘ri.",
        "error"
      );

      return;
    }


    if (
      normalizePhone(phone)
        .length < 7
    ) {

      hideResult();

      showMessage(
        "Telefon raqami noto‘g‘ri.",
        "error"
      );

      return;
    }


    hideResult();


    showMessage(
      "Buyurtma qidirilmoqda..."
    );


    try {

      const order =
        await trackOrder(
          orderId,
          phone
        );


      if (!order) {

        showMessage(
          "Buyurtma topilmadi. ID va telefon raqamini tekshiring.",
          "error"
        );

        return;
      }


      renderOrder(
        order
      );


      showMessage(
        "✅ Buyurtma topildi.",
        "success"
      );


    } catch (error) {

      console.error(
        error
      );


      hideResult();


      showMessage(
        error.message ||
        "Buyurtmani tekshirishda xatolik.",
        "error"
      );

    }

  }


  /* =========================================================
     URL PARAMS
  ========================================================= */

  function loadFromUrl() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const id =
      params.get("id");


    const phone =
      params.get("phone");


    let canAutoSearch =
      true;


    if (
      id &&
      orderIdInput
    ) {

      orderIdInput.value =
        id;

    } else {

      canAutoSearch =
        false;

    }


    if (
      phone &&
      phoneInput
    ) {

      phoneInput.value =
        phone;

    } else {

      canAutoSearch =
        false;

    }


    return canAutoSearch;
  }


  /* =========================================================
     URL UPDATE
  ========================================================= */

  function updateUrl() {

    const orderId =
      orderIdInput?.value
        ?.trim();


    const phone =
      phoneInput?.value
        ?.trim();


    if (
      !orderId ||
      !phone
    ) {
      return;
    }


    const url =
      new URL(
        window.location.href
      );


    url.searchParams.set(
      "id",
      orderId
    );


    url.searchParams.set(
      "phone",
      phone
    );


    window.history.replaceState(
      {},
      "",
      url
    );

  }


  /* =========================================================
     EVENTS
  ========================================================= */

  form?.addEventListener(
    "submit",
    async event => {

      updateUrl();

      await handleTrack(
        event
      );

    }
  );


  /* =========================================================
     INIT
  ========================================================= */

  async function init() {

    hideResult();


    const autoSearch =
      loadFromUrl();


    if (autoSearch) {

      /*
        QR yoki buyurtmadan kelgan link
        bo‘lsa avtomatik ochadi.
      */

      await handleTrack();

    }

  }


  init();

})();
