
const { SUPABASE_URL, SUPABASE_KEY } = window.MODEX_CONFIG;
const REST = `${SUPABASE_URL}/rest/v1`;

const grid = document.getElementById('productsGrid');
const empty = document.getElementById('emptyState');
const count = document.getElementById('productCount');
const dialog = document.getElementById('orderDialog');
const form = document.getElementById('orderForm');
const msg = document.getElementById('formMessage');

function money(v){
  return new Intl.NumberFormat('uz-UZ').format(Number(v || 0)) + " so‘m";
}
function escapeHtml(s=''){
  return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));
}

async function api(path, options={}){
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    ...(options.headers || {})
  };
  const res = await fetch(`${REST}/${path}`, {...options, headers});
  if(!res.ok) throw new Error(await res.text());
  if(res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadProducts(){
  try{
    const products = await api('products?select=id,name,price,description,image_url,active&active=eq.true&order=id.desc');
    grid.innerHTML = '';
    count.textContent = `${products.length} ta mahsulot`;
    empty.classList.toggle('hidden', products.length > 0);
    products.forEach(p=>{
      const card = document.createElement('article');
      card.className = 'product-card';
      const img = p.image_url || 'https://placehold.co/800x600?text=MODEX.UZ';
      card.innerHTML = `
        <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy">
        <div class="product-body">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="desc">${escapeHtml(p.description || '')}</div>
          <div class="price">${money(p.price)}</div>
          <button class="btn primary order-btn">Buyurtma berish</button>
        </div>`;
      card.querySelector('.order-btn').addEventListener('click', ()=>openOrder(p));
      grid.appendChild(card);
    });
  }catch(e){
    empty.classList.remove('hidden');
    empty.textContent = 'Mahsulotlarni yuklab bo‘lmadi. Admin paneldan mahsulot qo‘shilganini tekshiring.';
    console.error(e);
  }
}

function openOrder(product){
  document.getElementById('selectedProductTitle').textContent = product.name;
  document.getElementById('productInput').value = product.name;
  document.getElementById('quantityInput').value = 1;
  msg.textContent = '';
  msg.className = 'form-message';
  dialog.showModal();
}
document.getElementById('closeDialog').addEventListener('click', ()=>dialog.close());
dialog.addEventListener('click', (e)=>{ if(e.target === dialog) dialog.close(); });

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const btn = document.getElementById('submitOrder');
  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const product = document.getElementById('productInput').value;
  const quantity = Number(document.getElementById('quantityInput').value || 1);

  const digits = phone.replace(/\D/g,'');
  if(name.length < 2 || digits.length < 9){
    msg.textContent = 'Ism va telefon raqamini to‘g‘ri kiriting.';
    msg.className = 'form-message error';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Yuborilmoqda...';
  try{
    await api('orders', {
      method:'POST',
      headers:{'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({name, phone, product, quantity})
    });
    msg.textContent = 'Buyurtmangiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.';
    msg.className = 'form-message success';
    form.reset();
    setTimeout(()=>dialog.close(), 1800);
  }catch(err){
    console.error(err);
    msg.textContent = 'Xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.';
    msg.className = 'form-message error';
  }finally{
    btn.disabled = false;
    btn.textContent = 'Buyurtma yuborish';
  }
});

loadProducts();
