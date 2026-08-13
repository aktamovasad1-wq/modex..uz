const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

let session = JSON.parse(localStorage.getItem('modex_session') || 'null');
let ordersCache = [];
let productsCache = [];

const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');

function money(v) {
  return new Intl.NumberFormat('uz-UZ').format(Number(v || 0)) + " so‘m";
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

async function request(url, options = {}, token = session?.access_token) {
  const r = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${SUPABASE_KEY}` }),
      ...(options.headers || {})
    }
  });

  if (!r.ok) {
    throw new Error(await r.text());
  }

  if (r.status === 204) return null;

  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function api(path, options = {}) {
  return request(`${REST}/${path}`, options);
}

async function getRole() {
  const rows = await api(
    `profiles?select=role,name,active&id=eq.${session.user.id}&limit=1`
  );

  return rows?.[0];
}

async function showAdmin() {
  try {
    const p = await getRole();

    if (p?.role !== 'admin' || p?.active === false) {
      throw new Error('Admin emas');
    }

    loginView.classList.add('hidden');
    adminView.classList.remove('hidden');

    document.getElementById('adminEmail').textContent =
      session?.user?.email || '';

    await loadAll();
  } catch (e) {
    localStorage.removeItem('modex_session');
    session = null;
    showLogin();

    document.getElementById('loginMessage').textContent =
      'Bu akkaunt administrator emas.';
  }
}

function showLogin() {
  loginView.classList.remove('hidden');
  adminView.classList.add('hidden');
}

document.getElementById('loginForm').onsubmit = async e => {
  e.preventDefault();

  const message = document.getElementById('loginMessage');

  message.textContent = 'Kirilmoqda...';
  message.className = 'form-message';

  try {
    const r = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value
        })
      }
    );

    if (!r.ok) throw new Error(await r.text());

    session = await r.json();

    localStorage.setItem(
      'modex_session',
      JSON.stringify(session)
    );

    await showAdmin();
  } catch (err) {
    console.error(err);

    message.textContent =
      'Login, parol yoki admin huquqi noto‘g‘ri.';

    message.className = 'form-message error';
  }
};

document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('modex_session');
  session = null;
  showLogin();
};

document.getElementById('refreshBtn').onclick = loadAll;

async function loadAll() {
  await Promise.all([
    loadOrders(),
    loadProductsAdmin(),
    loadOperators(),
    loadSupport()
  ]);
}

/* =========================
   BUYURTMALAR
========================= */

async function loadOrders() {
  const ordersMessage =
    document.getElementById('ordersMessage');

  try {
    ordersCache = await api(
      'orders?select=*&order=created_at.desc'
    );

    renderOrders();

    document.getElementById('aOrders').textContent =
      ordersCache.length;

    document.getElementById('aNew').textContent =
      ordersCache.filter(o => o.status === 'new').length;

    ordersMessage.textContent = '';
  } catch (e) {
    console.error(e);
    ordersMessage.textContent =
      'Buyurtmalarni yuklab bo‘lmadi.';
    ordersMessage.className = 'form-message error';
  }
}

function renderOrders() {
  const q =
    document.getElementById('adminOrderSearch')
      .value
      .toLowerCase()
      .trim();

  const body =
    document.getElementById('ordersBody');

  body.innerHTML = '';

  const filtered = ordersCache.filter(o => {
    const text = `
      ${o.name || ''}
      ${o.surname || ''}
      ${o.phone || ''}
      ${o.product || ''}
      ${o.region || ''}
      ${o.address || ''}
    `.toLowerCase();

    return text.includes(q);
  });

  filtered.forEach(o => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>#${esc(o.id)}</td>

      <td>
        ${new Date(o.created_at).toLocaleString('uz-UZ')}
      </td>

      <td>
        ${esc(o.name || '')}
        ${esc(o.surname || '')}
      </td>

      <td>
        <a href="tel:${esc(o.phone || '')}">
          ${esc(o.phone || '')}
        </a>
      </td>

      <td>${esc(o.product || '')}</td>

      <td>${esc(o.region || '-')}</td>

      <td>${esc(o.utm_source || 'sayt')}</td>

      <td>
        <span class="badge ${esc(o.status || 'new')}">
          ${statusText(o.status)}
        </span>
      </td>
    `;

    body.appendChild(tr);
  });
}

function statusText(status) {
  const map = {
    new: 'Yangi',
    called: 'Qo‘ng‘iroq qilindi',
    confirmed: 'Tasdiqlandi',
    done: 'Yakunlandi',
    cancelled: 'Bekor qilindi'
  };

  return map[status] || status || 'Yangi';
}

document.getElementById('adminOrderSearch').oninput =
  renderOrders;

/* =========================
   RASM YUKLASH
========================= */

async function uploadImage(file) {
  if (!file) return null;

  const ext =
    (file.name.split('.').pop() || 'jpg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const path =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

  await request(
    `${SUPABASE_URL}/storage/v1/object/product-images/${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          file.type || 'application/octet-stream'
      },
      body: file
    }
  );

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

/* =========================
   MAHSULOT QO‘SHISH / TAHRIRLASH
========================= */

const productForm =
  document.getElementById('productForm');

const editProductId =
  document.getElementById('editProductId');

const productSubmitBtn =
  document.getElementById('productSubmitBtn');

const cancelEditBtn =
  document.getElementById('cancelEditBtn');

productForm.onsubmit = async e => {
  e.preventDefault();

  const message =
    document.getElementById('productMessage');

  const id = editProductId.value;

  productSubmitBtn.disabled = true;

  productSubmitBtn.textContent =
    id ? 'Saqlanmoqda...' : 'Qo‘shilmoqda...';

  try {
    let imageUrl = null;

    const file =
      document.getElementById('pImage').files[0];

    if (file) {
      imageUrl = await uploadImage(file);
    }

    const data = {
      name:
        document.getElementById('pName')
          .value.trim(),

      category:
        document.getElementById('pCategory')
          .value.trim(),

      price:
        Number(
          document.getElementById('pPrice').value
        ),

      description:
        document.getElementById('pDesc')
          .value.trim(),

      active: true
    };

    if (imageUrl) {
      data.image_url = imageUrl;
    }

    if (id) {
      await api(
        `products?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },

          body: JSON.stringify(data)
        }
      );

      message.textContent =
        'Mahsulot muvaffaqiyatli yangilandi.';
    } else {
      if (!imageUrl) {
        throw new Error('Rasm tanlang');
      }

      data.image_url = imageUrl;

      await api('products', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },

        body: JSON.stringify(data)
      });

      message.textContent =
        'Mahsulot muvaffaqiyatli qo‘shildi.';
    }

    message.className =
      'form-message success';

    resetProductForm();

    await loadProductsAdmin();
  } catch (err) {
    console.error(err);

    message.textContent =
      editProductId.value
        ? 'Mahsulotni yangilab bo‘lmadi.'
        : 'Mahsulotni qo‘shib bo‘lmadi.';

    message.className =
      'form-message error';
  } finally {
    productSubmitBtn.disabled = false;

    productSubmitBtn.textContent =
      editProductId.value
        ? 'O‘zgarishlarni saqlash'
        : 'Mahsulot qo‘shish';
  }
};

function startEditProduct(product) {
  editProductId.value = product.id;

  document.getElementById('pName').value =
    product.name || '';

  document.getElementById('pCategory').value =
    product.category || '';

  document.getElementById('pPrice').value =
    product.price || 0;

  document.getElementById('pDesc').value =
    product.description || '';

  document.getElementById('pImage').required = false;

  document.getElementById(
    'productFormTitle'
  ).textContent = 'Mahsulotni tahrirlash';

  productSubmitBtn.textContent =
    'O‘zgarishlarni saqlash';

  cancelEditBtn.classList.remove('hidden');

  document.getElementById(
    'productMessage'
  ).textContent =
    'Rasmni o‘zgartirmoqchi bo‘lmasangiz, yangi rasm tanlamang.';

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function resetProductForm() {
  productForm.reset();

  editProductId.value = '';

  document.getElementById('pImage').required = false;

  document.getElementById(
    'productFormTitle'
  ).textContent = 'Mahsulot qo‘shish';

  productSubmitBtn.textContent =
    'Mahsulot qo‘shish';

  cancelEditBtn.classList.add('hidden');
}

cancelEditBtn.onclick = () => {
  resetProductForm();

  document.getElementById(
    'productMessage'
  ).textContent = '';
};

/* =========================
   MAHSULOTLAR RO‘YXATI
========================= */

async function loadProductsAdmin() {
  try {
    productsCache = await api(
      'products?select=id,name,price,description,image_url,category,active&order=id.desc'
    );

    document.getElementById('aProducts').textContent =
      productsCache.length;

    const wrap =
      document.getElementById('adminProducts');

    wrap.innerHTML = '';

    productsCache.forEach(p => {
      const el = document.createElement('div');

      el.className = 'product-admin-item';

      el.innerHTML = `
        <img
          src="${esc(p.image_url || '')}"
          alt="${esc(p.name || '')}"
        >

        <div class="product-admin-info">
          <strong>${esc(p.name)}</strong>

          <span>
            ${esc(p.category || 'Kategoriyasiz')}
            ·
            ${money(p.price)}
          </span>

          <small class="target-link">
            product.html?id=${p.id}
          </small>
        </div>

        <div class="product-admin-actions">
          <button
            class="small-btn edit-product"
            type="button"
          >
            Tahrirlash
          </button>

          <button
            class="small-btn delete-product"
            type="button"
          >
            O‘chirish
          </button>
        </div>
      `;

      el.querySelector('.edit-product').onclick = () => {
        startEditProduct(p);
      };

      el.querySelector('.delete-product').onclick =
        async () => {
          const ok = confirm(
            `"${p.name}" mahsuloti o‘chirilsinmi?`
          );

          if (!ok) return;

          try {
            await api(
              `products?id=eq.${encodeURIComponent(p.id)}`,
              {
                method: 'DELETE',
                headers: {
                  Prefer: 'return=minimal'
                }
              }
            );

            if (String(editProductId.value) === String(p.id)) {
              resetProductForm();
            }

            await loadProductsAdmin();
          } catch (err) {
            console.error(err);
            alert('Mahsulotni o‘chirib bo‘lmadi.');
          }
        };

      wrap.appendChild(el);
    });
  } catch (e) {
    console.error(e);
  }
}

/* =========================
   OPERATOR YARATISH
========================= */

document.getElementById(
  'operatorCreateForm'
).onsubmit = async e => {
  e.preventDefault();

  const message =
    document.getElementById(
      'operatorCreateMessage'
    );

  message.textContent =
    'Operator yaratilmoqda...';

  message.className =
    'form-message';

  try {
    const r = await fetch(
      `${SUPABASE_URL}/functions/v1/create-operator`,
      {
        method: 'POST',

        headers: {
          apikey: SUPABASE_KEY,
          Authorization:
            `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          name:
            document.getElementById('opName')
              .value.trim(),

          email:
            document.getElementById('newOpEmail')
              .value.trim(),

          password:
            document.getElementById('newOpPassword')
              .value
        })
      }
    );

    if (!r.ok) {
      throw new Error(await r.text());
    }

    message.textContent =
      'Operator muvaffaqiyatli yaratildi.';

    message.className =
      'form-message success';

    e.target.reset();

    await loadOperators();
  } catch (err) {
    console.error(err);

    message.textContent =
      'Operator yaratilmadi. Edge Function sozlanganini tekshiring.';

    message.className =
      'form-message error';
  }
};

/* =========================
   OPERATORLAR
========================= */

async function loadOperators() {
  try {
    const ops = await api(
      'profiles?select=id,name,role,active,created_at&role=eq.operator&order=created_at.desc'
    );

    document.getElementById('aOperators').textContent =
      ops.length;

    const list =
      document.getElementById('operatorsList');

    if (!ops.length) {
      list.innerHTML =
        '<p class="muted">Hozircha operator yo‘q.</p>';
      return;
    }

    list.innerHTML = ops.map(o => `
      <div class="support-item">
        <div>
          <strong>
            ${esc(o.name || 'Operator')}
          </strong>

          <span>
            ${o.active ? 'Faol' : 'Bloklangan'}
          </span>
        </div>

        <button
          class="small-btn toggle-op"
          data-id="${esc(o.id)}"
          data-active="${o.active}"
        >
          ${o.active
            ? 'Bloklash'
            : 'Faollashtirish'}
        </button>
      </div>
    `).join('');

    list
      .querySelectorAll('.toggle-op')
      .forEach(btn => {
        btn.onclick = async () => {
          try {
            await api(
              `profiles?id=eq.${encodeURIComponent(btn.dataset.id)}`,
              {
                method: 'PATCH',

                headers: {
                  'Content-Type':
                    'application/json',
                  Prefer: 'return=minimal'
                },

                body: JSON.stringify({
                  active:
                    btn.dataset.active !== 'true'
                })
              }
            );

            await loadOperators();
          } catch (err) {
            console.error(err);
            alert(
              'Operator holatini o‘zgartirib bo‘lmadi.'
            );
          }
        };
      });
  } catch (e) {
    console.error(e);
  }
}

/* =========================
   YORDAM XIZMATI
========================= */

async function loadSupport() {
  const list =
    document.getElementById('adminSupportList');

  try {
    const xs = await api(
      'support_requests?select=*&order=created_at.desc&limit=50'
    );

    if (!xs.length) {
      list.innerHTML =
        '<p class="muted">Hozircha murojaat yo‘q.</p>';
      return;
    }

    list.innerHTML = xs.map(x => `
      <div class="support-item">
        <div>
          <strong>
            ${esc(x.name || '')}
            ·
            <a href="tel:${esc(x.phone || '')}">
              ${esc(x.phone || '')}
            </a>
          </strong>

          <span>
            ${esc(x.message || '')}
          </span>
        </div>

        <span class="badge">
          ${esc(x.status || 'new')}
        </span>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

/* =========================
   START
========================= */

if (session?.access_token) {
  showAdmin();
} else {
  showLogin();
}
