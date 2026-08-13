const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('modex_cart') || '[]');

const grid = document.getElementById('productsGrid');
const empty = document.getElementById('emptyState');
const count = document.getElementById('productCount');
const dialog = document.getElementById('orderDialog');
const form = document.getElementById('orderForm');

function money(v){
  return new Intl.NumberFormat('uz-UZ').format(Number(v || 0)) + " so‘m";
}

function esc(s=''){
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[m]));
}

async function api(path, options={}){
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...(options.headers || {})
  };

  const res = await fetch(`${REST}/${path}`, {
    ...options,
    headers
  });

  if(!res.ok) throw new Error(await res.text());
  if(res.status === 204) return null;

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadProducts(){
  try{
    allProducts = await api(
      'products?select=*&active=eq.true&order=id.desc'
    );

    buildCategories();
    renderProducts();
  }catch(e){
    console.error(e);
    empty.classList.remove('hidden');
    empty.textContent = 'Mahsulotlarni yuklab bo‘lmadi.';
  }
}

function buildCategories(){
  const cats = [...new Set(
    allProducts
      .map(p => p.category)
      .filter(Boolean)
  )];

  const list = document.getElementById('categoryList');
  const select = document.getElementById('categoryFilter');

  list.innerHTML = '';
  select.innerHTML = '<option value="">Barcha kategoriyalar</option>';

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-chip';
    btn.textContent = cat;

    btn.onclick = () => {
      select.value = cat;
      renderProducts();
      document.getElementById('products').scrollIntoView({
        behavior:'smooth'
      });
    };

    list.appendChild(btn);

    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function renderProducts(){
  const q = document.getElementById('searchInput')
    .value.toLowerCase().trim();

  const cat = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortSelect').value;

  let products = allProducts.filter(p => {
    const text = `${p.name || ''} ${p.description || ''} ${p.category || ''}`
      .toLowerCase();

    return text.includes(q) && (!cat || p.category === cat);
  });

  if(sort === 'cheap'){
    products.sort((a,b) => Number(a.price) - Number(b.price));
  }

  if(sort === 'expensive'){
    products.sort((a,b) => Number(b.price) - Number(a.price));
  }

  if(sort === 'new'){
    products.sort((a,b) => Number(b.id) - Number(a.id));
  }

  grid.innerHTML = '';
  count.textContent = `${products.length} ta mahsulot`;
  empty.classList.toggle('hidden', products.length > 0);

  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';

    card.innerHTML = `
      <a href="product.html?id=${p.id}" class="product-image-link">
        <img
          src="${esc(p.image_url || '')}"
          alt="${esc(p.name || '')}"
          loading="lazy"
        >
      </a>

      <div class="product-body">
        <span class="product-category">
          ${esc(p.category || 'Mahsulot')}
        </span>

        <h3>
          <a href="product.html?id=${p.id}">
            ${esc(p.name || '')}
          </a>
        </h3>

        <div class="desc">
          ${esc(p.description || '')}
        </div>

        <div class="price">
          ${money(p.price)}
        </div>

        <div class="product-actions">
          <button class="btn primary order-btn">
            Buyurtma berish
          </button>

          <button class="small-btn cart-add">
            Savatchaga
          </button>
        </div>
      </div>
    `;

    card.querySelector('.order-btn').onclick = () => openOrder(p);
    card.querySelector('.cart-add').onclick = () => addToCart(p);

    grid.appendChild(card);
  });
}

document.getElementById('searchInput').oninput = renderProducts;
document.getElementById('categoryFilter').onchange = renderProducts;
document.getElementById('sortSelect').onchange = renderProducts;

function openOrder(product){
  document.getElementById('selectedProductTitle').textContent = product.name;
  document.getElementById('productInput').value = product.name;
  document.getElementById('quantityInput').value = 1;
  document.getElementById('formMessage').textContent = '';
  dialog.showModal();
}

document.getElementById('closeDialog').onclick = () => dialog.close();

dialog.addEventListener('click', e => {
  if(e.target === dialog) dialog.close();
});

form.onsubmit = async e => {
  e.preventDefault();

  const btn = document.getElementById('submitOrder');
  const msg = document.getElementById('formMessage');

  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const product = document.getElementById('productInput').value;
  const quantity = Number(document.getElementById('quantityInput').value || 1);
  const size = document.getElementById('sizeInput').value;
  const color = document.getElementById('colorInput').value.trim();

  const digits = phone.replace(/\D/g,'');

  if(name.length < 2 || digits.length < 9){
    msg.textContent = 'Ism va telefon raqamini to‘g‘ri kiriting.';
    msg.className = 'form-message error';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Yuborilmoqda...';

  try{
    const params = new URLSearchParams(location.search);

    await api('orders', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Prefer':'return=minimal'
      },
      body:JSON.stringify({
        name,
        phone,
        product,
        quantity,
        size,
        color,
        status:'new',
        utm_source: params.get('utm_source') || 'sayt',
        utm_campaign: params.get('utm_campaign') || ''
      })
    });

    msg.textContent = 'Buyurtmangiz qabul qilindi.';
    msg.className = 'form-message success';

    form.reset();

    setTimeout(() => dialog.close(), 1500);
  }catch(err){
    console.error(err);
    msg.textContent = 'Buyurtmani yuborib bo‘lmadi.';
    msg.className = 'form-message error';
  }finally{
    btn.disabled = false;
    btn.textContent = 'Buyurtma yuborish';
  }
};

/* SAVATCHA */

function addToCart(product){
  const found = cart.find(x => x.id === product.id);

  if(found){
    found.quantity += 1;
  }else{
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
}

function saveCart(){
  localStorage.setItem('modex_cart', JSON.stringify(cart));
  document.getElementById('cartCount').textContent =
    cart.reduce((s,x) => s + x.quantity, 0);
}

function renderCart(){
  const wrap = document.getElementById('cartItems');

  if(!cart.length){
    wrap.innerHTML = '<p class="muted">Savatcha bo‘sh.</p>';
  }else{
    wrap.innerHTML = cart.map((x,i) => `
      <div class="cart-item">
        <img src="${esc(x.image_url || '')}" alt="">
        <div>
          <strong>${esc(x.name)}</strong>
          <span>${x.quantity} × ${money(x.price)}</span>
        </div>
        <button class="small-btn remove-cart" data-i="${i}">
          ×
        </button>
      </div>
    `).join('');
  }

  wrap.querySelectorAll('.remove-cart').forEach(btn => {
    btn.onclick = () => {
      cart.splice(Number(btn.dataset.i), 1);
      saveCart();
      renderCart();
    };
  });

  const total = cart.reduce(
    (s,x) => s + x.price * x.quantity,
    0
  );

  document.getElementById('cartTotal').textContent = money(total);
}

document.getElementById('cartBtn').onclick = () => {
  document.getElementById('cartDrawer').classList.remove('hidden');
  renderCart();
};

document.getElementById('closeCart').onclick = () => {
  document.getElementById('cartDrawer').classList.add('hidden');
};

/* YORDAM XIZMATI */

document.getElementById('supportForm').onsubmit = async e => {
  e.preventDefault();

  const msg = document.getElementById('supportFormMessage');

  try{
    await api('support_requests', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Prefer':'return=minimal'
      },
      body:JSON.stringify({
        name: document.getElementById('supportName').value.trim(),
        phone: document.getElementById('supportPhone').value.trim(),
        message: document.getElementById('supportMessage').value.trim(),
        status:'new'
      })
    });

    msg.textContent = 'Murojaatingiz yuborildi.';
    msg.className = 'form-message success';

    e.target.reset();
  }catch(err){
    console.error(err);
    msg.textContent = 'Murojaatni yuborib bo‘lmadi.';
    msg.className = 'form-message error';
  }
};

saveCart();
renderCart();
loadProducts();
