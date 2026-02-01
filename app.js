// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Theme toggle (guarded in case the button was removed from HTML)
const themeBtn = document.getElementById('themeBtn');
function getCurrentTheme(){
  return document.documentElement.getAttribute('data-theme');
}

function toggleTheme(){
  const cur = getCurrentTheme();
  if(cur === 'dark'){
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('chuyunju-theme');
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    localStorage.setItem('chuyunju-theme','dark');
  }
}

// Initialize theme from storage
if(localStorage.getItem('chuyunju-theme') === 'dark'){
  document.documentElement.setAttribute('data-theme','dark');
}

if(themeBtn){
  themeBtn.addEventListener('click', toggleTheme);
}

// Share button (guarded)
const shareBtn = document.getElementById('shareBtn');
if(shareBtn){
  shareBtn.addEventListener('click', async ()=>{
    const shareData = {
      title: document.title,
      text: '来看一个简单的 H5 页面模板',
      url: location.href
    };
    if(navigator.share){
      try{ await navigator.share(shareData); }
      catch(err){ console.warn('分享取消或失败', err); }
    } else {
      try{ await navigator.clipboard.writeText(location.href); alert('已复制页面链接到剪贴板'); }
      catch(err){ alert('无法复制链接，请手动分享: ' + location.href); }
    }
  });
}

/* --- Product data and rendering --- */
// Products: using the three products you specified. Each product points to an images subfolder
const products = [
  {
    id: 'chabing',
    title: '17年冰岛生茶(茶饼)',
    subtitle: '17年冰岛普洱茶饼(357g标准茶饼)',
    price: 1200,
    unit: '一件(1片)',
    folder: 'images/chabing',
    note: '2017冰岛生茶357g茶饼，口感偏甜，回甘明显'
  },
  {
    id: 'sancha',
    title: '普洱散茶(两罐装)',
    subtitle: '忙肺古树熟茶+梅子箐锅底寨生茶',
    price: 880,
    unit: '一件(2罐)',
    folder: 'images/sancha',
    note: '一罐忙肺古树熟茶+一罐梅子箐锅底寨生茶，散茶两罐装'
  },
  {
    id: 'longzhu',
    title: '冰岛生茶(龙珠)',
    subtitle: '21年冰岛手工龙珠',
    price: 660,
    unit: '一件(28粒)',
    folder: 'images/longzhu',
    note: '21年冰岛龙珠，手工龙珠，条梭清晰，冲泡方便'
  }
];

const productsEl = document.getElementById('products');

async function renderProducts(){
  // For each product, attempt to find a cover image (suffix -1 with common extensions)
  const html = await Promise.all(products.map(async p => {
    const cover = await findCoverImage(p.folder, p.id);
    const coverSrc = cover || 'images/placeholder.svg';
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="imgwrap">
          <img src="${coverSrc}" alt="${p.title}" data-id="${p.id}" class="pimg">
        </div>
        <h3>${p.title}</h3>
        <div class="meta">${p.subtitle}</div>
        <div class="price-row">
          <div class="price">¥${p.price}</div>
          <div class="badge">${p.unit}</div>
        </div>
    
      </article>
    `;
  }));
  productsEl.innerHTML = html.join('');

  // bind listeners: clicking image opens product modal
  document.querySelectorAll('.pimg').forEach(img => img.addEventListener('click', onOpenImage));
}

// Helper: try to find cover image (basename -1) with common extensions
// include both lowercase and uppercase extensions to match files like `*.JPG`
const exts = ['.jpg','.jpeg','.png','.webp','.svg', '.JPG', '.JPEG', '.PNG', '.WEBP', '.SVG'];

function loadImage(url){
  return new Promise(resolve => {
    const i = new Image();
    i.onload = ()=> resolve(true);
    i.onerror = ()=> resolve(false);
    i.src = url;
  });
}

async function findCoverImage(folder, base){
  // Try several filename patterns: base-1, cover-1, <folder>-1
  const candidates = [
    `${folder}/${base}-1`,
    `${folder}/cover-1`,
    `${folder}/${base}1`,
    `${folder}/${base}`
  ];
  for(const c of candidates){
    for(const e of exts){
      const url = `${c}${e}`;
      // eslint-disable-next-line no-await-in-loop
      if(await loadImage(url)) return url;
    }
  }
  return null;
}

// Build gallery by probing suffixes -1..-8 and trying common extensions
async function buildGallery(folder, baseId, maxCount = 8){
  const imgs = [];
  for(let i=1;i<=maxCount;i++){
    let found = false;
    for(const e of exts){
      const url = `${folder}/${baseId}-${i}${e}`;
      // eslint-disable-next-line no-await-in-loop
      if(await loadImage(url)){
        imgs.push(url);
        found = true;
        break;
      }
    }
    if(!found){
      // try generic index without baseId
      for(const e of exts){
        const url = `${folder}/${i}${e}`;
        // eslint-disable-next-line no-await-in-loop
        if(await loadImage(url)){
          imgs.push(url);
          found = true;
          break;
        }
      }
    }
    if(!found) break; // stop if no image found for this index
  }
  return imgs;
}

// Cart functionality removed per request

/* Image modal */
const imgModal = document.getElementById('imgModal');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');
const modalCloseBtn = document.getElementById('modalCloseBtn');

function onOpenImage(e){
  const id = e.currentTarget.getAttribute('data-id');
  const p = products.find(x=>x.id===id);
  if(!p) return;
  openProductModal(p);
}

function onOpenProduct(e){
  const id = e.currentTarget.getAttribute('data-id');
  const p = products.find(x=>x.id===id);
  if(!p) return;
  openProductModal(p);
}

function closeModal(){
  imgModal.classList.remove('show');
  imgModal.setAttribute('aria-hidden','true');
}

modalClose.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', (ev)=>{ if(ev.key==='Escape') closeModal(); });

renderProducts();

/* --- Product modal & carousel logic --- */
const carouselTrack = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentGallery = [];
let currentIndex = 0;

async function openProductModal(p){
  // Build gallery from p.folder using base id
  currentGallery = await buildGallery(p.folder, p.id);
  if(currentGallery.length===0){
    // fallback: try cover
    const c = await findCoverImage(p.folder, p.id);
    if(c) currentGallery = [c];
  }
  carouselTrack.innerHTML = currentGallery.map(src=>`<img src="${src}" alt="">`).join('');
  currentIndex = 0;
  updateCarousel();
  modalCaption.textContent = p.title + ' · ' + p.note + ' · ¥' + p.price;
  imgModal.classList.add('show');
  imgModal.setAttribute('aria-hidden','false');
}

function updateCarousel(){
  const children = Array.from(carouselTrack.children);
  children.forEach((el,i)=>{
    el.style.display = (i===currentIndex)?'block':'none';
  });
}

prevBtn.addEventListener('click', ()=>{
  if(currentGallery.length===0) return;
  currentIndex = (currentIndex-1+currentGallery.length)%currentGallery.length;
  updateCarousel();
});
nextBtn.addEventListener('click', ()=>{
  if(currentGallery.length===0) return;
  currentIndex = (currentIndex+1)%currentGallery.length;
  updateCarousel();
});

// image click as well
document.addEventListener('click', (ev)=>{
  if(ev.target.classList.contains('pimg')){
    const id = ev.target.getAttribute('data-id');
    const p = products.find(x=>x.id===id);
    if(p) openProductModal(p);
  }
});

// load env images into envGallery
async function loadEnvGallery(){
  const envEl = document.getElementById('envGallery');
  const imgs = await buildGallery('images/env','env', 20);
  if(imgs.length===0) return;
  // render vertical list and add click handlers for zoom/modal
  envEl.innerHTML = imgs.map((s,i)=>`<img src="${s}" alt="env" class="env-img" data-index="${i}" loading="lazy">`).join('');
  // attach listeners to open gallery modal starting at clicked image
  Array.from(envEl.querySelectorAll('.env-img')).forEach(el=>{
    el.addEventListener('click', (ev)=>{
      const idx = Number(ev.currentTarget.getAttribute('data-index')) || 0;
      openGalleryModal(imgs, idx, '茶园与品质');
    });
  });
}

loadEnvGallery();

// Generic gallery modal opener for arbitrary image arrays
function openGalleryModal(imgs, startIndex = 0, caption = ''){
  if(!Array.isArray(imgs) || imgs.length===0) return;
  currentGallery = imgs.slice();
  carouselTrack.innerHTML = currentGallery.map(src=>`<img src="${src}" alt="">`).join('');
  currentIndex = Math.max(0, Math.min(startIndex, currentGallery.length-1));
  updateCarousel();
  modalCaption.textContent = caption;
  imgModal.classList.add('show');
  imgModal.setAttribute('aria-hidden','false');
}

