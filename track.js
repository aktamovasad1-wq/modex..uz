(() => {
  const config = window.MODEX_CONFIG || {};

  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_KEY = config.SUPABASE_KEY;

  const form = document.getElementById("trackForm");
  const orderIdInput = document.getElementById("orderId");
  const phoneInput = document.getElementById("phone");
  const message = document.getElementById("trackMessage");
  const result = document.getElementById("orderResult");
  const button = document.getElementById("trackBtn");

  const resultId = document.getElementById("resultId");
  const resultName = document.getElementById("resultName");
  const resultStatus = document.getElementById("resultStatus");
  const resultProduct = document.getElementById("resultProduct");
  const resultQuantity = document.getElementById("resultQuantity");
  const resultSize = document.getElementById("resultSize");
  const resultColor = document.getElementById("resultColor");

  const timeline = document.getElementById("orderTimeline");
  const cancelledBox = document.getElementById("cancelledBox");

  const statusInfo = {
    new: {
      label: "Buyurtma qabul qilindi",
      step: 1
    },

    talked: {
      label: "Operator tekshirmoqda",
      step: 2
    },

    confirmed: {
      label: "Qadoqlanmoqda",
      step: 3
    },

    delivery: {
      label: "Yo‘lda",
      step: 4
    },

    done: {
      label: "Yetkazildi",
      step: 5
    },

    cancelled: {
      label: "Bekor qilindi",
      step: 0
    }
  };


  function setMessage(text, type = "") {
    message.textContent = text;
    message.className = "message";

    if (type) {
      message.classList.add(type);
    }
  }


  function resetTimeline() {
    document.querySelectorAll(".step").forEach((step) => {
      step.classList.remove("done", "current");
    });
  }


  function renderTimeline(status) {
    resetTimeline();

    if (status === "cancelled") {
      timeline.classList.add("hidden");
      cancelledBox.classList.remove("hidden");
      return;
    }

    timeline.classList.remove("hidden");
    cancelledBox.classList.add("hidden");

    const info = statusInfo[status] || statusInfo.new;

    const steps = Array.from(
      document.querySelectorAll(".step")
    );

    steps.forEach((step, index) => {
      const number = index + 1;

      if (number <= info.step) {
        step.classList.add("done");
      }

      if (number === info.step) {
        step.classList.add("current");
      }
    });
  }


  function renderOrder(order) {
    const status = order.status || "new";
    const info = statusInfo[status] || statusInfo.new;

    resultId.textContent =
      `Buyurtma #${order.order_id}`;

    resultName.textContent =
      order.customer_name || "Mijoz";

    resultStatus.textContent =
      info.label;

    resultProduct.textContent =
      order.product_name || "Mahsulot";

    resultQuantity.textContent =
      order.quantity || 1;

    resultSize.textContent =
      order.size || "—";

    resultColor.textContent =
      order.color || "—";

    renderTimeline(status);

    result.classList.remove("hidden");

    result.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  async function trackOrder(orderId, phone) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        "Supabase config topilmadi."
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/track_order`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        },

        body: JSON.stringify({
          p_order_id: Number(orderId),
          p_phone: phone
        })
      }
    );

    if (!response.ok) {
      let errorText =
        "Buyurtmani tekshirishda xato.";

      try {
        const errorData = await response.json();

        if (errorData?.message) {
          errorText = errorData.message;
        }
      } catch (error) {}

      throw new Error(errorText);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  }


  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const orderId = orderIdInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!orderId || !phone) {
      setMessage(
        "Buyurtma raqami va telefon raqamini kiriting.",
        "error"
      );
      return;
    }

    button.disabled = true;
    button.textContent = "Tekshirilmoqda...";

    result.classList.add("hidden");

    setMessage("");

    try {
      const order = await trackOrder(
        orderId,
        phone
      );

      if (!order) {
        setMessage(
          "Buyurtma topilmadi. Buyurtma raqami yoki telefonni tekshiring.",
          "error"
        );
        return;
      }

      renderOrder(order);

    } catch (error) {
      console.error(error);

      setMessage(
        error.message || "Xatolik yuz berdi.",
        "error"
      );

    } finally {
      button.disabled = false;
      button.textContent =
        "Buyurtmani tekshirish";
    }
  });

})();
