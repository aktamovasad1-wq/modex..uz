<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MODEX.UZ — Admin Panel</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>

  <!-- LOGIN -->
  <section id="loginView" class="login-wrap">
    <div class="login-box">
      <h2>Admin kirish</h2>

      <form id="loginForm">
        <label>
          Email
          <input
            id="email"
            type="email"
            required
            placeholder="admin@email.com"
          >
        </label>

        <label>
          Parol
          <input
            id="password"
            type="password"
            required
            placeholder="Parol"
          >
        </label>

        <button class="main-btn full-btn" type="submit">
          Kirish
        </button>

        <p id="loginMessage" class="form-message"></p>
      </form>
    </div>
  </section>


  <!-- ADMIN -->
  <section id="adminView" class="hidden">

    <div class="admin-shell">

      <div class="admin-head">

        <div>
          <span class="market-category">MODEX.UZ</span>
          <h1>Admin Panel</h1>
          <p id="adminEmail"></p>
        </div>

        <div class="admin-top-actions">
          <a href="index.html" class="small-btn">
            Sayt
          </a>

          <a href="settings.html" class="small-btn">
            Sozlamalar
          </a>

          <a href="operator.html" class="small-btn">
            Operator panel
          </a>

          <button id="refreshAdminBtn" class="small-btn">
            Yangilash
          </button>

          <button id="logoutBtn" class="small-btn">
            Chiqish
          </button>
        </div>

      </div>


      <!-- STATISTIKA -->
      <div class="stats-row">

        <div class="stat">
          <b id="aProducts">0</b>
          <span>Mahsulotlar</span>
        </div>

        <div class="stat">
          <b id="aOrders">0</b>
          <span>Buyurtmalar</span>
        </div>

        <div class="stat">
          <b id="aNew">0</b>
          <span>Yangi buyurtma</span>
        </div>

        <div class="stat">
          <b id="aOperators">0</b>
          <span>Operatorlar</span>
        </div>

      </div>


      <div class="admin-grid">

        <!-- MAHSULOT QO‘SHISH / TAHRIRLASH -->
        <section class="panel">

          <h2 id="productFormTitle">
            Mahsulot qo‘shish
          </h2>

          <form id="productForm" class="admin-form">

            <input
              id="editProductId"
              type="hidden"
            >

            <label>
              Mahsulot nomi
              <input
                id="pName"
                type="text"
                required
                placeholder="Masalan: Qizlar komplekti"
              >
            </label>

            <label>
              Kategoriya
              <input
                id="pCategory"
                type="text"
                required
                placeholder="Masalan: Bolalar kiyimi"
              >
            </label>

            <label>
              Asosiy narx
              <input
                id="pPrice"
                type="number"
                min="0"
                required
                placeholder="199000"
              >
            </label>

            <label>
              Eski narx
              <input
                id="pOldPrice"
                type="number"
                min="0"
                placeholder="249000"
              >
            </label>

            <label>
              Chegirma foizi
              <input
                id="pDiscount"
                type="number"
                min="0"
                max="100"
                placeholder="20"
              >
            </label>

            <label>
              Tavsif
              <textarea
                id="pDesc"
                rows="5"
                placeholder="Mahsulot haqida qisqacha..."
              ></textarea>
            </label>

            <label>
              Rasm
              <input
                id="pImage"
                type="file"
                accept="image/*"
              >
            </label>

            <div class="product-form-buttons">

              <button
                id="productSubmitBtn"
                class="main-btn"
                type="submit"
              >
                Mahsulot qo‘shish
              </button>

              <button
                id="cancelEditBtn"
                class="product-secondary-btn hidden"
                type="button"
              >
                Bekor qilish
              </button>

            </div>

            <p
              id="productMessage"
              class="form-message"
            ></p>

          </form>


          <div
            id="adminProducts"
            class="product-admin-list"
          ></div>

        </section>


        <!-- OPERATOR -->
        <section class="panel">

          <h2>Operator yaratish</h2>

          <form
            id="operatorCreateForm"
            class="admin-form"
          >

            <label>
              Operator ismi
              <input
                id="opName"
                required
                placeholder="Operator ismi"
              >
            </label>

            <label>
              Email
              <input
                id="newOpEmail"
                type="email"
                required
                placeholder="operator@email.com"
              >
            </label>

            <label>
              Parol
              <input
                id="newOpPassword"
                type="password"
                required
                minlength="6"
                placeholder="Kamida 6 ta belgi"
              >
            </label>

            <button
              class="main-btn"
              type="submit"
            >
              Operator yaratish
            </button>

            <p
              id="operatorCreateMessage"
              class="form-message"
            ></p>

          </form>

          <div id="operatorsList"></div>

        </section>

      </div>


      <!-- BUYURTMALAR -->
      <section class="panel wide-panel">

        <div class="section-title">
          <h2>Buyurtmalar</h2>

          <input
            id="adminOrderSearch"
            type="search"
            placeholder="Ism, telefon, mahsulot..."
          >
        </div>

        <div class="table-wrap">

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Mahsulot</th>
                <th>Soni</th>
                <th>O‘lcham</th>
                <th>Rang</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody id="ordersBody"></tbody>
          </table>

        </div>

        <p
          id="ordersMessage"
          class="form-message"
        ></p>

      </section>


      <!-- YORDAM MUROJAATLARI -->
      <section class="panel wide-panel">

        <h2>Yordam murojaatlari</h2>

        <div
          id="adminSupportList"
          class="support-list"
        ></div>

      </section>

    </div>

  </section>


  <script src="config.js"></script>
  <script src="admin.js"></script>

</body>
</html>
