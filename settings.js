const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

let session = JSON.parse(
  localStorage.getItem("modex_session") || "null"
);

let settingsId = null;

const loginView = document.getElementById("loginView");
const settingsView = document.getElementById("settingsView");

function showLogin() {
  loginView.classList.remove("hidden");
  settingsView.classList.add("hidden");
}

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
        ? { Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${SUPABASE_KEY}` }),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function api(path, options = {}) {
  return request(`${REST}/${path}`, options);
}

async function getProfile() {
  const rows = await api(
    `profiles?select=role,name,active&id=eq.${session.user.id}&limit=1`
  );

  return rows?.[0];
}

async function showSettings() {
  try {
    const profile = await getProfile();

    if (
      profile?.role !== "admin" ||
      profile?.active === false
    ) {
      throw new Error("Admin huquqi yo‘q");
    }

    loginView.classList.add("hidden");
    settingsView.classList.remove("hidden");

    document.getElementById("adminEmail").textContent =
      session?.user?.email || "";

    await loadSettings();

  } catch (error) {
    console.error(error);

    localStorage.removeItem("modex_session");
    session = null;

    showLogin();

    document.getElementById("loginMessage").textContent =
      "Bu akkaunt administrator emas.";
  }
}

document.getElementById("loginForm").onsubmit =
  async event => {

    event.preventDefault();

    const message =
      document.getElementById("loginMessage");

    message.textContent = "Kirilmoqda...";
    message.className = "form-message";

    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json"
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
        throw new Error(await response.text());
      }

      session = await response.json();

      localStorage.setItem(
        "modex_session",
        JSON.stringify(session)
      );

      await showSettings();

    } catch (error) {
      console.error(error);

      message.textContent =
        "Email, parol yoki admin huquqi noto‘g‘ri.";

      message.className =
        "form-message error";
    }
  };

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("modex_session");
  session = null;
  showLogin();
};

async function loadSettings() {
  const message =
    document.getElementById("settingsMessage");

  message.textContent = "";

  try {
    const rows = await api(
      "site_settings?select=*&order=id.asc&limit=1"
    );

    const settings = rows?.[0];

    if (!settings) {
      throw new Error("Sozlamalar topilmadi");
    }

    settingsId = settings.id;

    document.getElementById("siteName").value =
      settings.site_name || "MODEX.UZ";

    document.getElementById("phone").value =
      settings.phone || "";

    document.getElementById("instagramUrl").value =
      settings.instagram_url || "";

    document.getElementById("telegramUrl").value =
      settings.telegram_url || "";

    document.getElementById("heroTitle").value =
      settings.hero_title || "";

    document.getElementById("heroText").value =
      settings.hero_text || "";

    document.getElementById("deliveryText").value =
      settings.delivery_text || "";

    document.getElementById("primaryColor").value =
      settings.primary_color || "#6f35e8";

    document.getElementById("maintenanceMode").checked =
      !!settings.maintenance_mode;

  } catch (error) {
    console.error(error);

    message.textContent =
      "Sozlamalarni yuklab bo‘lmadi.";

    message.className =
      "form-message error";
  }
}

document.getElementById("settingsForm").onsubmit =
  async event => {

    event.preventDefault();

    const button =
      document.getElementById("saveSettingsBtn");

    const message =
      document.getElementById("settingsMessage");

    button.disabled = true;
    button.textContent = "Saqlanmoqda...";

    try {
      if (!settingsId) {
        throw new Error("Sozlamalar ID topilmadi");
      }

      const data = {
        site_name:
          document
            .getElementById("siteName")
            .value
            .trim(),

        phone:
          document
            .getElementById("phone")
            .value
            .trim(),

        instagram_url:
          document
            .getElementById("instagramUrl")
            .value
            .trim(),

        telegram_url:
          document
            .getElementById("telegramUrl")
            .value
            .trim(),

        hero_title:
          document
            .getElementById("heroTitle")
            .value
            .trim(),

        hero_text:
          document
            .getElementById("heroText")
            .value
            .trim(),

        delivery_text:
          document
            .getElementById("deliveryText")
            .value
            .trim(),

        primary_color:
          document
            .getElementById("primaryColor")
            .value,

        maintenance_mode:
          document
            .getElementById("maintenanceMode")
            .checked,

        updated_at:
          new Date().toISOString()
      };

      await api(
        `site_settings?id=eq.${encodeURIComponent(settingsId)}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },

          body: JSON.stringify(data)
        }
      );

      message.textContent =
        "Sozlamalar saqlandi ✅";

      message.className =
        "form-message success";

    } catch (error) {
      console.error(error);

      message.textContent =
        "Sozlamalarni saqlab bo‘lmadi.";

      message.className =
        "form-message error";

    } finally {
      button.disabled = false;
      button.textContent =
        "Sozlamalarni saqlash";
    }
  };

if (session?.access_token) {
  showSettings();
} else {
  showLogin();
}
