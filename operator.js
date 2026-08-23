<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width,initial-scale=1,viewport-fit=cover"
  >

  <title>MODEX.UZ — Operator</title>

  <style>
    :root{
      --bg:#f6f7fb;
      --card:#fff;
      --text:#17171d;
      --muted:#777784;
      --line:#e7e7ef;
      --primary:#713cf0;
      --primary-soft:#efe9ff;
      --red:#e5484d;
      --orange:#f59e0b;
      --blue:#4f7cff;
      --purple:#8b5cf6;
      --green:#20ad68;
    }

    *{
      box-sizing:border-box;
    }

    body{
      margin:0;
      font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
      background:var(--bg);
      color:var(--text);
    }

    button,
    input,
    select,
    textarea{
      font:inherit;
    }

    button{
      cursor:pointer;
    }

    .hidden{
      display:none !important;
    }

    .message{
      min-height:18px;
      margin:8px 0 0;
      font-size:12px;
      color:var(--muted);
    }

    .message.error{
      color:#d63238;
    }

    .message.success{
      color:#16965a;
    }

    /* LOGIN */

    .login-page{
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:22px;
      background:
        radial-gradient(circle at top left,#eee8ff,transparent 38%),
        var(--bg);
    }

    .login-card{
      width:100%;
      max-width:420px;
      padding:28px;
      background:#fff;
      border:1px solid var(--line);
      border-radius:24px;
      box-shadow:0 15px 50px rgba(20,20,35,.09);
    }

    .logo{
      font-size:26px;
      font-weight:950;
      letter-spacing:-1px;
    }

    .logo span{
      color:var(--primary);
    }

    .label{
      display:inline-block;
      margin-top:7px;
      font-size:10px;
      font-weight:900;
      color:var(--primary);
      letter-spacing:.12em;
    }

    .login-card h1{
      margin:9px 0 6px;
      font-size:29px;
    }

    .login-card p{
      color:var(--muted);
      line-height:1.5;
    }

    .login-form{
      display:grid;
      gap:13px;
      margin-top:20px;
    }

    .login-form label,
    .edit-form label{
      display:grid;
      gap:6px;
      font-size:12px;
      font-weight:800;
    }

    input,
    select,
    textarea{
      width:100%;
      border:1px solid var(--line);
      border-radius:12px;
      padding:11px 12px;
      outline:none;
      background:#fff;
    }

    input:focus,
    select:focus,
    textarea:focus{
      border-color:var(--primary);
      box-shadow:0 0 0 4px var(--primary-soft);
    }

    textarea{
      min-height:85px;
      resize:vertical;
    }

    .primary-btn{
      border:0;
      border-radius:13px;
      padding:13px;
      background:var(--primary);
      color:#fff;
      font-weight:900;
    }

    /* PANEL */

    .shell{
      width:min(1280px,calc(100% - 28px));
      margin:0 auto;
      padding:22px 0 100px;
    }

    .header{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:16px;
      margin-bottom:18px;
    }

    .header h1{
      margin:4px 0;
      font-size:30px;
    }

    .header p{
      margin:0;
      color:var(--muted);
    }

    .header-actions{
      display:flex;
      gap:8px;
    }

    .secondary-btn{
      border:1px solid var(--line);
      border-radius:11px;
      padding:10px 13px;
      background:#fff;
      font-weight:800;
    }

    /* STATS */

    .stats{
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:10px;
      margin-bottom:15px;
    }

    .stat{
      background:#fff;
      border:1px solid var(--line);
      border-radius:16px;
      padding:15px;
    }

    .stat span{
      display:block;
      font-size:10px;
      font-weight:850;
      color:var(--muted);
      margin-bottom:5px;
    }

    .stat strong{
      font-size:27px;
    }

    .stat.new{
      border-top:4px solid var(--red);
    }

    .stat.talked{
      border-top:4px solid var(--orange);
    }

    .stat.confirmed{
      border-top:4px solid var(--blue);
    }

    .stat.done{
      border-top:4px solid var(--green);
    }

    /* SEARCH */

    .tools{
      background:#fff;
      border:1px solid var(--line);
      border-radius:17px;
      padding:12px;
      margin-bottom:14px;
    }

    .search{
      display:flex;
      gap:7px;
      margin-bottom:10px;
    }

    .search input{
      flex:1;
    }

    .search button{
      width:43px;
      border:0;
      border-radius:11px;
      background:#f0f0f5;
      font-size:19px;
    }

    .filters{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
    }

    .filter-btn{
      border:1px solid var(--line);
      border-radius:999px;
      padding:9px 12px;
      background:#fff;
      font-size:11px;
      font-weight:850;
    }

    .filter-btn.active{
      background:var(--primary);
      color:#fff;
      border-color:var(--primary);
    }

    /* ORDERS */

    .orders-section{
      background:#fff;
      border:1px solid var(--line);
      border-radius:19px;
      padding:15px;
    }

    .orders-head{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:13px;
    }

    .orders-head h2{
      margin:0;
    }

    .count{
      background:var(--primary-soft);
      color:var(--primary);
      padding:7px 10px;
      border-radius:999px;
      font-size:11px;
      font-weight:900;
    }

    .orders{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:11px;
    }

    .order-card{
      border:1px solid var(--line);
      border-radius:15px;
      padding:13px;
      background:#fff;
    }

    .order-top{
      display:flex;
      justify-content:space-between;
      gap:8px;
      margin-bottom:10px;
    }

    .order-id{
      display:block;
      font-size:9px;
      font-weight:900;
      color:var(--muted);
      margin-bottom:4px;
    }

    .order-name{
      font-size:14px;
    }

    .status{
      font-size:9px;
      font-weight:850;
      background:#f3f3f8;
      padding:6px 8px;
      border-radius:999px;
      white-space:nowrap;
    }

    .product-box{
      border-radius:11px;
      background:#f8f8fc;
      padding:10px;
      margin-bottom:8px;
    }

    .product-box small{
      display:block;
      color:var(--muted);
      font-size:8px;
      font-weight:900;
      margin-bottom:3px;
    }

    .info-grid{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:6px;
      margin-bottom:8px;
    }

    .info-grid div{
      background:#f8f8fc;
      border-radius:9px;
      padding:7px;
    }

    .info-grid span{
      display:block;
      color:var(--muted);
      font-size:8px;
      font-weight:900;
    }

    .info-grid strong{
      font-size:11px;
    }

    .location{
      font-size:11px;
      line-height:1.4;
      margin:8px 0;
    }

    .call-btn{
      display:block;
      text-align:center;
      text-decoration:none;
      padding:10px;
      margin-bottom:7px;
      border-radius:10px;
      background:#eaf9f1;
      color:#168650;
      font-size:11px;
      font-weight:900;
    }

    .open-btn{
      width:100%;
      border:0;
      border-radius:10px;
      padding:10px;
      background:var(--primary);
      color:#fff;
      font-size:11px;
      font-weight:900;
    }

    .date{
      display:block;
      margin-top:7px;
      font-size:9px;
      color:var(--muted);
    }

    /* MODAL */

    dialog{
      width:min(700px,calc(100% - 20px));
      padding:0;
      border:0;
      border-radius:20px;
      background:transparent;
    }

    dialog::backdrop{
      background:rgba(15,15,22,.58);
      backdrop-filter:blur(3px);
    }

    .modal{
      position:relative;
      padding:20px;
      background:#fff;
      border-radius:20px;
      max-height:90vh;
      overflow:auto;
    }

    .close{
      position:absolute;
      right:12px;
      top:12px;
      width:36px;
      height:36px;
      border:0;
      border-radius:50%;
      background:#f0f0f5;
      font-size:20px;
    }

    .modal h2{
      margin:7px 0 17px;
    }

    .edit-form{
      display:grid;
      gap:11px;
    }

    .two{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
    }

    .three{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:8px;
    }

    .form-title{
      border-top:1px solid var(--line);
      padding-top:9px;
      margin-top:3px;
      font-size:11px;
      font-weight:900;
    }

    .big-call{
      display:block;
      text-align:center;
      text-decoration:none;
      border-radius:11px;
      padding:11px;
      background:#eaf9f1;
      color:#168650;
      font-weight:900;
      font-size:12px;
    }

    .actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
    }

    .qr-btn{
      border:0;
      border-radius:12px;
      background:#f0f0f5;
      font-weight:900;
    }

    @media(max-width:900px){
      .orders{
        grid-template-columns:repeat(2,1fr);
      }
    }

    @media(max-width:650px){
      .shell{
        width:calc(100% - 16px);
        padding-top:12px;
      }

      .header{
        flex-direction:column;
      }

      .header-actions{
        width:100%;
      }

      .header-actions button{
        flex:1;
      }

      .stats{
        grid-template-columns:repeat(2,1fr);
        gap:7px;
      }

      .stat{
        padding:12px;
      }

      .orders{
        grid-template-columns:1fr;
      }

      .filters{
        flex-wrap:nowrap;
        overflow-x:auto;
      }

      .filter-btn{
        flex:none;
      }

      .two{
        grid-template-columns:1fr;
      }

      .three{
        grid-template-columns:1fr 1fr;
      }

      .actions{
        grid-template-columns:1fr;
      }

      .qr-btn{
        min-height:44px;
      }
    }
  </style>
</head>

<body>

<!-- LOGIN -->

<section id="loginView" class="login-page">

  <div class="login-card">

    <div class="logo">
      MODEX<span>.UZ</span>
    </div>

    <span class="label">
      OPERATOR PANEL
    </span>

    <h1>Kirish</h1>

    <p>
      Buyurtmalar bilan ishlash uchun operator hisobingizga kiring.
    </p>

    <form id="loginForm" class="login-form">

      <label>
        Email

        <input
          id="email"
          type="email"
          autocomplete="email"
          required
        >
      </label>

      <label>
        Parol

        <input
          id="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </label>

      <button class="primary-btn" type="submit">
        Kirish
      </button>

      <div id="loginMessage" class="message"></div>

    </form>

  </div>

</section>


<!-- PANEL -->

<section id="panelView" class="hidden">

  <div class="shell">

    <header class="header">

      <div>

        <span class="label">
          MODEX.UZ
        </span>

        <h1>Operator Panel</h1>

        <p>
          Operator:
          <strong id="operatorName">—</strong>
        </p>

      </div>

      <div class="header-actions">

        <button
          id="refreshBtn"
          class="secondary-btn"
          type="button"
        >
          🔄 Yangilash
        </button>

        <button
          id="logoutBtn"
          class="secondary-btn"
          type="button"
        >
          Chiqish
        </button>

      </div>

    </header>


    <section class="stats">

      <div class="stat new">
        <span>🔴 YANGI</span>
        <strong id="newCount">0</strong>
      </div>

      <div class="stat talked">
        <span>🟠 BUGUN GAPLASHILDI</span>
        <strong id="talkedCount">0</strong>
      </div>

      <div class="stat confirmed">
        <span>🔵 QADOQLANMOQDA</span>
        <strong id="confirmedCount">0</strong>
      </div>

      <div class="stat done">
        <span>🟢 YETKAZILDI</span>
        <strong id="doneCount">0</strong>
      </div>

    </section>


    <section class="tools">

      <div class="search">

        <input
          id="searchInput"
          type="search"
          placeholder="Ism, telefon, mahsulot, hudud..."
        >

        <button
          id="clearSearch"
          type="button"
        >
          ×
        </button>

      </div>


      <div class="filters">

        <button
          class="filter-btn active"
          data-status="all"
        >
          Barchasi
        </button>

        <button
          class="filter-btn"
          data-status="new"
        >
          🔴 Yangi
        </button>

        <button
          class="filter-btn"
          data-status="talked"
        >
          🟠 Bugun gaplashildi
        </button>

        <button
          class="filter-btn"
          data-status="confirmed"
        >
          🔵 Qadoq
        </button>

        <button
          class="filter-btn"
          data-status="delivery"
        >
          🟣 Yo‘lda
        </button>

        <button
          class="filter-btn"
          data-status="done"
        >
          🟢 Yetkazildi
        </button>

        <button
          class="filter-btn"
          data-status="cancelled"
        >
          ⚪ Bekor
        </button>

      </div>

    </section>


    <section class="orders-section">

      <div class="orders-head">

        <h2>Buyurtmalar</h2>

        <span id="visibleCount" class="count">
          0 ta
        </span>

      </div>

      <div id="orders" class="orders"></div>

      <div id="ordersMessage" class="message"></div>

    </section>

  </div>

</section>


<!-- ORDER MODAL -->

<dialog id="orderDialog">

  <div class="modal">

    <button
      id="closeDialog"
      class="close"
      type="button"
    >
      ×
    </button>

    <span class="label">
      ZAYAVKA
    </span>

    <h2 id="modalTitle">
      Buyurtma
    </h2>


    <form id="orderForm" class="edit-form">

      <input
        id="editId"
        type="hidden"
      >


      <div class="form-title">
        👤 Mijoz
      </div>


      <div class="two">

        <label>
          Ism
          <input id="editName">
        </label>

        <label>
          Familiya
          <input id="editSurname">
        </label>

      </div>


      <label>
        Telefon
        <input id="editPhone" type="tel">
      </label>


      <a
        id="callBtn"
        class="big-call"
        href="#"
      >
        📞 Mijozga qo‘ng‘iroq
      </a>


      <div class="form-title">
        📦 Mahsulot
      </div>


      <label>
        Mahsulot
        <input
          id="editProduct"
          readonly
        >
      </label>


      <div class="three">

        <label>
          Soni
          <input
            id="editQuantity"
            type="number"
            min="1"
          >
        </label>

        <label>
          Razmer
          <input id="editSize">
        </label>

        <label>
          Rang
          <input id="editColor">
        </label>

      </div>


      <div class="form-title">
        🚚 Yetkazish
      </div>


      <label>
        Viloyat / shahar
        <input id="editRegion">
      </label>


      <label>
        Manzil
        <textarea id="editAddress"></textarea>
      </label>


      <div class="form-title">
        📝 Izoh
      </div>


      <label>
        Operator izohi
        <textarea id="editNote"></textarea>
      </label>


      <div class="form-title">
        📌 Status
      </div>


      <label>
        Buyurtma holati

        <select id="editStatus">

          <option value="new">
            🔴 Yangi
          </option>

          <option value="talked">
            🟠 Gaplashildi
          </option>

          <option value="confirmed">
            🔵 Qadoqlanmoqda
          </option>

          <option value="delivery">
            🟣 Yo‘lda
          </option>

          <option value="done">
            🟢 Yetkazildi
          </option>

          <option value="cancelled">
            ⚪ Bekor
          </option>

        </select>
      </label>


      <div class="actions">

        <button
          class="primary-btn"
          type="submit"
        >
          💾 Saqlash
        </button>

        <button
          id="qrBtn"
          class="qr-btn"
          type="button"
        >
          QR etiketka
        </button>

      </div>


      <div id="orderMessage" class="message"></div>

    </form>

  </div>

</dialog>


<!-- FAQAT CONFIG TASHQARIDA -->

<script src="./config.js?v=20260823-2300"></script>

<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>


<script>
(() => {
  "use strict";

  const config =
    window.MODEX_CONFIG || {};

  const URL =
    config.SUPABASE_URL;

  const KEY =
    config.SUPABASE_KEY;

  const $ =
    id => document.getElementById(id);


  let currentUser = null;
  let currentProfile = null;

  let orders = [];
  let activeFilter = "all";
  let currentOrder = null;


  const statusNames = {
    new: "🔴 Yangi",
    talked: "🟠 Gaplashildi",
    confirmed: "🔵 Qadoqlanmoqda",
    delivery: "🟣 Yo‘lda",
    done: "🟢 Yetkazildi",
    cancelled: "⚪ Bekor"
  };


  function token(){
    return sessionStorage.getItem(
      "modex_operator_token"
    );
  }


  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }


  function phone(value){
    return String(value || "")
      .replace(/[^\d+]/g,"");
  }


  function formatDate(value){

    if(!value){
      return "—";
    }

    const d =
      new Date(value);

    if(Number.isNaN(d.getTime())){
      return "—";
    }

    return d.toLocaleString(
      "uz-UZ",
      {
        day:"2-digit",
        month:"2-digit",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
      }
    );
  }


  function isToday(value){

    if(!value){
      return false;
    }

    const date =
      new Date(value);

    const now =
      new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }


  function message(
    element,
    text,
    type=""
  ){

    if(!element){
      return;
    }

    element.textContent =
      text;

    element.className =
      "message";

    if(type){
      element.classList.add(type);
    }
  }


  async function api(
    path,
    options={},
    accessToken=KEY
  ){

    if(!URL || !KEY){
      throw new Error(
        "config.js ichida Supabase sozlamasi topilmadi."
      );
    }

    const response =
      await fetch(
        `${URL}/${path}`,
        {
          ...options,

          headers:{
            "Content-Type":"application/json",
            "apikey":KEY,
            "Authorization":
              `Bearer ${accessToken}`,
            ...(options.headers || {})
          }
        }
      );


    if(!response.ok){

      let msg =
        `Server xatosi: ${response.status}`;

      try{

        const data =
          await response.json();

        msg =
          data.message ||
          data.error_description ||
          data.error ||
          msg;

      }catch(_){}

      throw new Error(msg);
    }


    if(response.status === 204){
      return null;
    }


    const text =
      await response.text();

    return text
      ? JSON.parse(text)
      : null;
  }


  /* LOGIN */

  async function login(
    email,
    password
  ){

    const data =
      await api(
        "auth/v1/token?grant_type=password",
        {
          method:"POST",

          body:JSON.stringify({
            email,
            password
          })
        }
      );


    if(!data?.access_token){
      throw new Error(
        "Login amalga oshmadi."
      );
    }


    sessionStorage.setItem(
      "modex_operator_token",
      data.access_token
    );
  }


  async function loadUser(){

    currentUser =
      await api(
        "auth/v1/user",
        {
          method:"GET"
        },
        token()
      );


    if(!currentUser?.id){
      throw new Error(
        "Operator aniqlanmadi."
      );
    }
  }


  async function loadProfile(){

    const data =
      await api(
        `rest/v1/profiles?id=eq.${encodeURIComponent(currentUser.id)}&select=*`,
        {
          method:"GET"
        },
        token()
      );


    currentProfile =
      Array.isArray(data)
        ? data[0]
        : null;


    if(!currentProfile){
      throw new Error(
        "Operator profili topilmadi."
      );
    }


    if(
      currentProfile.role !== "operator"
    ){
      throw new Error(
        "Bu hisob operator emas."
      );
    }


    if(
      currentProfile.active !== true
    ){
      throw new Error(
        "Operator bloklangan."
      );
    }
  }


  async function openPanel(){

    await loadUser();
    await loadProfile();


    $("loginView")
      .classList.add("hidden");


    $("panelView")
      .classList.remove("hidden");


    $("operatorName").textContent =
      currentProfile.name ||
      currentUser.email ||
      "Operator";


    await loadOrders();
  }


  /* ORDERS */

  async function loadOrders(){

    message(
      $("ordersMessage"),
      "Yuklanmoqda..."
    );


    const data =
      await api(
        "rest/v1/orders?select=*&order=id.desc",
        {
          method:"GET"
        },
        token()
      );


    orders =
      Array.isArray(data)
        ? data
        : [];


    updateStats();
    renderOrders();


    message(
      $("ordersMessage"),
      ""
    );
  }


  function talkedTodayByMe(order){

    return (
      order.operator_id === currentUser?.id &&
      isToday(order.talked_at)
    );
  }


  function updateStats(){

    $("newCount").textContent =
      orders.filter(
        o => o.status === "new"
      ).length;


    $("talkedCount").textContent =
      orders.filter(
        talkedTodayByMe
      ).length;


    $("confirmedCount").textContent =
      orders.filter(
        o => o.status === "confirmed"
      ).length;


    $("doneCount").textContent =
      orders.filter(
        o => o.status === "done"
      ).length;
  }


  function filteredOrders(){

    let list =
      [...orders];


    if(activeFilter === "talked"){

      list =
        list.filter(
          talkedTodayByMe
        );

    }else if(
      activeFilter !== "all"
    ){

      list =
        list.filter(
          o => o.status === activeFilter
        );
    }


    const q =
      $("searchInput")
        .value
        .trim()
        .toLowerCase();


    if(q){

      list =
        list.filter(order => {

          const text = `
            ${order.id}
            ${order.name || ""}
            ${order.surname || ""}
            ${order.phone || ""}
            ${order.product || ""}
            ${order.region || ""}
            ${order.address || ""}
          `.toLowerCase();


          return text.includes(q);
        });
    }


    return list;
  }


  function renderOrders(){

    const container =
      $("orders");

    const list =
      filteredOrders();


    $("visibleCount").textContent =
      `${list.length} ta`;


    container.innerHTML = "";


    if(!list.length){

      container.innerHTML = `
        <div style="
          grid-column:1/-1;
          text-align:center;
          padding:35px;
          color:#777;
        ">
          Buyurtmalar yo‘q.
        </div>
      `;

      return;
    }


    list.forEach(order => {

      const card =
        document.createElement("article");

      card.className =
        "order-card";


      card.innerHTML = `

        <div class="order-top">

          <div>

            <span class="order-id">
              BUYURTMA #${esc(order.id)}
            </span>

            <strong class="order-name">
              ${esc(order.name || "Mijoz")}
              ${esc(order.surname || "")}
            </strong>

          </div>

          <span class="status">
            ${
              statusNames[order.status] ||
              order.status ||
              "—"
            }
          </span>

        </div>


        <div class="product-box">

          <small>
            MAHSULOT
          </small>

          <strong>
            ${esc(order.product || "Mahsulot")}
          </strong>

        </div>


        <div class="info-grid">

          <div>
            <span>SONI</span>
            <strong>${esc(order.quantity || 1)}</strong>
          </div>

          <div>
            <span>RAZMER</span>
            <strong>${esc(order.size || "—")}</strong>
          </div>

          <div>
            <span>RANG</span>
            <strong>${esc(order.color || "—")}</strong>
          </div>

        </div>


        ${
          order.region || order.address

          ? `
            <div class="location">
              📍 ${esc(order.region || "")}
              ${
                order.address
                  ? " — " + esc(order.address)
                  : ""
              }
            </div>
          `

          : ""
        }


        ${
          order.phone

          ? `
            <a
              class="call-btn"
              href="tel:${esc(phone(order.phone))}"
            >
              📞 ${esc(order.phone)}
            </a>
          `

          : ""
        }


        <button
          class="open-btn"
          type="button"
          data-id="${order.id}"
        >
          Zayavkani ochish
        </button>


        <small class="date">
          ${formatDate(order.created_at)}
        </small>
      `;


      container.appendChild(card);
    });


    container
      .querySelectorAll(".open-btn")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            openOrder(
              Number(button.dataset.id)
            );
          }
        );
      });
  }


  /* MODAL */

  function openOrder(id){

    const order =
      orders.find(
        o =>
          Number(o.id) === Number(id)
      );


    if(!order){
      return;
    }


    currentOrder =
      order;


    $("modalTitle").textContent =
      `Buyurtma #${order.id}`;


    $("editId").value =
      order.id;

    $("editName").value =
      order.name || "";

    $("editSurname").value =
      order.surname || "";

    $("editPhone").value =
      order.phone || "";

    $("editProduct").value =
      order.product || "";

    $("editQuantity").value =
      order.quantity || 1;

    $("editSize").value =
      order.size || "";

    $("editColor").value =
      order.color || "";

    $("editRegion").value =
      order.region || "";

    $("editAddress").value =
      order.address || "";

    $("editNote").value =
      order.note || "";

    $("editStatus").value =
      order.status || "new";


    $("editQuantity").disabled =
      order.stock_adjusted === true;


    $("callBtn").href =
      order.phone
        ? `tel:${phone(order.phone)}`
        : "#";


    message(
      $("orderMessage"),
      ""
    );


    $("orderDialog").showModal();
  }


  function closeModal(){

    if(
      $("orderDialog").open
    ){
      $("orderDialog").close();
    }


    $("editQuantity").disabled =
      false;


    currentOrder = null;
  }


  /* SAVE */

  async function saveOrder(event){

    event.preventDefault();


    if(!currentOrder){
      return;
    }


    const id =
      Number($("editId").value);


    const oldStatus =
      currentOrder.status || "new";


    const newStatus =
      $("editStatus").value;


    const oldQty =
      Math.max(
        1,
        Number(
          currentOrder.quantity || 1
        )
      );


    const newQty =
      Math.max(
        1,
        Number(
          $("editQuantity").value || 1
        )
      );


    if(
      currentOrder.stock_adjusted === true &&
      newQty !== oldQty
    ){

      message(
        $("orderMessage"),
        "Tasdiqlangan buyurtmada sonini o‘zgartirib bo‘lmaydi.",
        "error"
      );

      return;
    }


    message(
      $("orderMessage"),
      "Saqlanmoqda..."
    );


    try{

      const details = {

        name:
          $("editName").value.trim(),

        surname:
          $("editSurname").value.trim() ||
          null,

        phone:
          $("editPhone").value.trim(),

        quantity:
          newQty,

        size:
          $("editSize").value.trim() ||
          null,

        color:
          $("editColor").value.trim() ||
          null,

        region:
          $("editRegion").value.trim() ||
          null,

        address:
          $("editAddress").value.trim() ||
          null,

        note:
          $("editNote").value.trim() ||
          null,

        updated_at:
          new Date().toISOString()
      };


      await api(
        `rest/v1/orders?id=eq.${id}`,
        {
          method:"PATCH",

          headers:{
            Prefer:"return=minimal"
          },

          body:JSON.stringify(details)
        },
        token()
      );


      if(oldStatus !== newStatus){

        await api(
          "rest/v1/rpc/update_order_status_with_stock",
          {
            method:"POST",

            body:JSON.stringify({
              p_order_id:id,
              p_new_status:newStatus,
              p_operator_id:currentUser.id
            })
          },
          token()
        );
      }


      await loadOrders();


      message(
        $("orderMessage"),
        "✅ Saqlandi",
        "success"
      );


      setTimeout(
        closeModal,
        450
      );


    }catch(error){

      console.error(error);


      message(
        $("orderMessage"),
        error.message ||
        "Saqlashda xatolik.",
        "error"
      );
    }
  }


  /* QR */

  function qrLabel(){

    if(!currentOrder){
      return;
    }


    const order =
      currentOrder;


    const base =
      location.href
        .split("operator.html")[0];


    const trackUrl =
      `${base}track.html` +
      `?id=${encodeURIComponent(order.id)}` +
      `&phone=${encodeURIComponent(order.phone || "")}`;


    const win =
      window.open(
        "",
        "_blank",
        "width=500,height=720"
      );


    if(!win){

      alert(
        "Popup bloklangan. Brauzerda popupga ruxsat bering."
      );

      return;
    }


    win.document.write(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">

<title>
MODEX.UZ #${esc(order.id)}
</title>

<style>
body{
  font-family:Arial,sans-serif;
  margin:0;
  padding:20px;
}

.label{
  max-width:400px;
  margin:auto;
  border:2px solid #111;
  border-radius:12px;
  padding:18px;
}

.logo{
  font-size:24px;
  font-weight:900;
}

.id{
  font-size:30px;
  font-weight:900;
  margin:12px 0;
}

.row{
  border-top:1px dashed #aaa;
  padding-top:9px;
  margin-top:9px;
}

small{
  display:block;
  color:#777;
  font-weight:700;
}

strong{
  display:block;
  margin-top:3px;
}

#qr{
  display:flex;
  justify-content:center;
  margin:18px 0;
}

button{
  width:100%;
  border:0;
  border-radius:10px;
  padding:12px;
  background:#713cf0;
  color:#fff;
  font-weight:800;
}

@media print{
  button{
    display:none;
  }

  body{
    padding:0;
  }
}
</style>
</head>

<body>

<div class="label">

  <div class="logo">
    MODEX.UZ
  </div>

  <div class="id">
    #${esc(order.id)}
  </div>

  <div class="row">
    <small>MIJOZ</small>
    <strong>
      ${esc(order.name || "")}
      ${esc(order.surname || "")}
    </strong>
  </div>

  <div class="row">
    <small>HUDUD / MANZIL</small>
    <strong>
      ${esc(order.region || "—")}<br>
      ${esc(order.address || "—")}
    </strong>
  </div>

  <div class="row">
    <small>MAHSULOT</small>
    <strong>
      ${esc(order.product || "Mahsulot")}
    </strong>
  </div>

  <div class="row">
    <small>SONI / RAZMER / RANG</small>
    <strong>
      ${esc(order.quantity || 1)}
      /
      ${esc(order.size || "—")}
      /
      ${esc(order.color || "—")}
    </strong>
  </div>

  <div id="qr"></div>

  <button onclick="window.print()">
    🖨 Chop etish
  </button>

</div>

<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>

<script>
window.addEventListener(
  "load",
  function(){

    if(window.QRCode){

      new QRCode(
        document.getElementById("qr"),
        {
          text:${JSON.stringify(trackUrl)},
          width:150,
          height:150
        }
      );

    }
  }
);
<\/script>

</body>
</html>
    `);


    win.document.close();
  }


  /* FILTER */

  function setFilter(status){

    activeFilter =
      status;


    document
      .querySelectorAll(".filter-btn")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.status === status
        );
      });


    renderOrders();
  }


  /* EVENTS */

  $("loginForm").addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      message(
        $("loginMessage"),
        "Kirilmoqda..."
      );


      try{

        await login(
          $("email").value.trim(),
          $("password").value
        );


        await openPanel();


        $("loginForm").reset();


        message(
          $("loginMessage"),
          ""
        );


      }catch(error){

        console.error(error);


        sessionStorage.removeItem(
          "modex_operator_token"
        );


        message(
          $("loginMessage"),
          error.message,
          "error"
        );
      }
    }
  );


  $("logoutBtn").addEventListener(
    "click",
    () => {

      sessionStorage.removeItem(
        "modex_operator_token"
      );


      location.reload();
    }
  );


  $("refreshBtn").addEventListener(
    "click",
    async () => {

      $("refreshBtn").disabled =
        true;


      try{

        await loadOrders();

      }catch(error){

        alert(error.message);

      }finally{

        $("refreshBtn").disabled =
          false;
      }
    }
  );


  $("searchInput").addEventListener(
    "input",
    renderOrders
  );


  $("clearSearch").addEventListener(
    "click",
    () => {

      $("searchInput").value =
        "";

      renderOrders();
    }
  );


  document
    .querySelectorAll(".filter-btn")
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


  $("closeDialog").addEventListener(
    "click",
    closeModal
  );


  $("orderForm").addEventListener(
    "submit",
    saveOrder
  );


  $("qrBtn").addEventListener(
    "click",
    qrLabel
  );


  /* INIT */

  async function init(){

    if(!token()){
      return;
    }


    try{

      await openPanel();

    }catch(error){

      console.error(error);


      sessionStorage.removeItem(
        "modex_operator_token"
      );


      message(
        $("loginMessage"),
        "Qayta login qiling.",
        "error"
      );
    }
  }


  init();

})();
</script>

</body>
</html>
