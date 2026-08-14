const CONFIG = window.MODEX_CONFIG || {};

const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_KEY = CONFIG.SUPABASE_KEY;

const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const REST_URL = `${SUPABASE_URL}/rest/v1`;

const loginView = document.getElementById("operatorLoginView");
const operatorView = document.getElementById("operatorView");

const loginForm = document.getElementById("operatorLoginForm");

const emailInput = document.getElementById("operatorEmail");
const passwordInput = document.getElementById("operatorPassword");

const message = document.getElementById("operatorLoginMessage");

const operatorUserName = document.getElementById("operatorUserName");

const logoutBtn = document.getElementById("operatorLogoutBtn");

let token = "";


function showLogin() {
  loginView.classList.remove("hidden");
  operatorView.classList.add("hidden");
}


function showPanel() {
  loginView.classList.add("hidden");
  operatorView.classList.remove("hidden");
}


async function loginOperator(email, password) {

  const response = await fetch(
    `${AUTH_URL}/token?grant_type=password`,
    {
      method: "POST",

      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email: email,
        password: password
      })
    }
  );


  const data = await response.json();


  if (!response.ok) {

    throw new Error(
      data.msg ||
      data.error_description ||
      data.message ||
      "Email yoki parol noto‘g‘ri"
    );

  }


  return data;
}


async function getOperatorProfile(userId) {

  const response = await fetch(
    `${REST_URL}/profiles?select=id,name,role,active&id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`
      }
    }
  );


  const data = await response.json();


  if (!response.ok) {

    throw new Error(
      "Profilni tekshirib bo‘lmadi"
    );

  }


  return data?.[0];
}


loginForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    message.textContent = "Tekshirilmoqda...";
    message.className = "form-message";


    try {

      const auth = await loginOperator(
        emailInput.value.trim(),
        passwordInput.value
      );


      token = auth.access_token;


      const profile = await getOperatorProfile(
        auth.user.id
      );


      if (!profile) {

        throw new Error(
          "Operator profili topilmadi"
        );

      }


      if (profile.role !== "operator") {

        throw new Error(
          "Bu akkaunt operator emas"
        );

      }


      if (profile.active !== true) {

        throw new Error(
          "Operator bloklangan"
        );

      }


      sessionStorage.setItem(
        "modex_operator_token",
        token
      );


      operatorUserName.textContent =
        profile.name || auth.user.email;


      message.textContent = "";


      showPanel();


    } catch (error) {

      console.error(error);

      message.textContent =
        error.message ||
        "Kirishda xato";

      message.className =
        "form-message error";

    }

  }
);


logoutBtn.addEventListener(
  "click",
  function() {

    sessionStorage.removeItem(
      "modex_operator_token"
    );

    token = "";

    showLogin();

  }
);


showLogin();
