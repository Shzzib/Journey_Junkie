// Fixed script - restores original UI behavior with working map and auth
// Initialize map
let map;
try {
  map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
} catch (e) { console.error(e); }

const markersLayer = L.layerGroup();
if (map) markersLayer.addTo(map);

let destinations = JSON.parse(localStorage.getItem('destinations') || '[]');

function updateProgress() {
  const total = destinations.length;
  const visited = destinations.filter(d => d.status === 'visited').length;
  const remaining = total - visited;
  const budget = destinations.filter(d => d.status === 'visited').reduce((s,d)=>s+Number(d.budget||0),0);
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('totalPlaces', total); setText('visitedPlaces', visited); setText('remainingPlaces', remaining); setText('budgetSpent', budget); setText('completionRate', total?Math.round((visited/total)*100)+'%':'0%');
}

function addDestinationMarker(d){
  if (!map || !d || !d.lat || !d.lng) return;
  const c = d.status==='visited' ? '#2e8b57' : '#1e90ff';
  const m = L.circleMarker([d.lat,d.lng], { radius:7, fillColor:c, color:'#fff', weight:1, fillOpacity:0.95 }).addTo(markersLayer);
  m.bindPopup(`<strong>${escapeHtml(d.city||'')}, ${escapeHtml(d.country||'')}</strong><br>Budget: $${escapeHtml(d.budget||'')}<br>Status: ${escapeHtml(d.status||'')}`);
}

function refreshMarkers(){
  if (!map) return;
  markersLayer.clearLayers();
  destinations.forEach(addDestinationMarker);
  const pts = destinations.filter(x=>x.lat&&x.lng).map(x=>[x.lat,x.lng]);
  if (pts.length===1) map.setView(pts[0],6);
  else if (pts.length>1) map.fitBounds(L.latLngBounds(pts).pad(0.2));
}

function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function renderWishlist(filter='all', search='') {
  const list = document.getElementById('destinations'); if(!list) return;
  list.innerHTML='';
  let items = destinations.slice();
  if (filter==='want') items = items.filter(d=>d.status==='want');
  if (filter==='visited') items = items.filter(d=>d.status==='visited');
  if (search) { const s=search.toLowerCase(); items = items.filter(d=> (d.city||'').toLowerCase().includes(s) || (d.country||'').toLowerCase().includes(s) || (d.notes||'').toLowerCase().includes(s)); }
  items.forEach(d=>{
    const col = document.createElement('div'); col.className='col-md-4 mb-3';
    const card = document.createElement('div'); card.className='card p-2';
    card.innerHTML = `
      <img src="${d.image || 'images/dest1.jpg'}" class="card-img-top" style="border-radius:8px; height:200px; object-fit:cover;">

      <div class="card-body">
        <h5 class="card-title">${escapeHtml(d.city||'')}, ${escapeHtml(d.country||'')}</h5>
        <p class="card-text">Budget: ₹ ${escapeHtml(d.budget||'')}</p>
        <p class="card-text">Priority: ${escapeHtml(d.priority||'')}</p>
        <p class="card-text">${escapeHtml(d.notes||'')}</p>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-success btn-mark-visited">${d.status==='visited'?'Visited':'Mark Visited'}</button>
          <button class="btn btn-sm btn-outline-danger btn-delete ms-auto">Delete</button>
        </div>
      </div>`;
    col.appendChild(card); list.appendChild(col);
    const mark = card.querySelector('.btn-mark-visited'); if(mark) mark.addEventListener('click', ()=>{ d.status='visited'; localStorage.setItem('destinations', JSON.stringify(destinations)); renderWishlist(currentFilter, currentSearch); refreshMarkers(); });
    const del = card.querySelector('.btn-delete'); if(del) del.addEventListener('click', ()=>{ if(!confirm('Delete this destination?')) return; destinations = destinations.filter(x=>x!==d); localStorage.setItem('destinations', JSON.stringify(destinations)); renderWishlist(currentFilter,currentSearch); refreshMarkers(); });
  });
  updateProgress();
}

// map click -> reverse geocode and fill city/country
if (map) {
  map.on('click', async function(e){
    const {lat,lng} = e.latlng;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || '';
        const country = data.address?.country || '';
        const cityEl = document.getElementById('city'); const countryEl = document.getElementById('country');
        if (cityEl) cityEl.value = city; if (countryEl) countryEl.value = country;
      }
    } catch (e) { console.warn('reverse geocode failed', e); }
  });
}

// form submit with geocode
const form = document.getElementById('destinationForm');
if (form) {
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const city = (document.getElementById('city')||{}).value || '';
    const country = (document.getElementById('country')||{}).value || '';
    const budget = (document.getElementById('budget')||{}).value || '';
    const priority = (document.getElementById('priority')||{}).value || '';
    const notes = (document.getElementById('notes')||{}).value || '';
    const status = document.getElementById('wantToggle') && document.getElementById('wantToggle').classList.contains('active') ? 'want' : 'visited';
    let lat=null,lng=null;
    try {
      const q = encodeURIComponent(`${city}, ${country}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
      if (res.ok) { const arr = await res.json(); if (arr && arr.length) { lat = parseFloat(arr[0].lat); lng = parseFloat(arr[0].lon); } }
    } catch (err) { console.warn('geocode failed', err); }
        // assign random offline image
    const randomImg = `images/dest${Math.floor(Math.random() * 8) + 1}.jpg`;

    destinations.push({
      city,
      country,
      budget,
      priority,
      notes,
      status,
      lat,
      lng,
      image: randomImg   // store the image too
    });

    localStorage.setItem('destinations', JSON.stringify(destinations));
    renderWishlist(currentFilter, currentSearch);
    refreshMarkers();
    e.target.reset();

  });
}

// toggles and search
let currentFilter='all', currentSearch='';
const searchBar = document.getElementById('searchBar'); if(searchBar) searchBar.addEventListener('input',(e)=>{ currentSearch=e.target.value; renderWishlist(currentFilter,currentSearch); });
const allToggle = document.getElementById('allToggle'), wantToggle = document.getElementById('wantToggle'), visitedToggle = document.getElementById('visitedToggle');
function setActive(id){ ['allToggle','wantToggle','visitedToggle'].forEach(x=>{ const el=document.getElementById(x); if(el) el.classList.remove('active'); }); const el=document.getElementById(id); if(el) el.classList.add('active'); }
if (allToggle) allToggle.addEventListener('click', ()=>{ currentFilter='all'; setActive('allToggle'); renderWishlist(currentFilter,currentSearch); });
if (wantToggle) wantToggle.addEventListener('click', ()=>{ currentFilter='want'; setActive('wantToggle'); renderWishlist(currentFilter,currentSearch); });
if (visitedToggle) visitedToggle.addEventListener('click', ()=>{ currentFilter='visited'; setActive('visitedToggle'); renderWishlist(currentFilter,currentSearch); });

// ensure coords for old entries
async function ensureCoordsForAll(){
  let updated=false;
  for (let d of destinations) {
    if (!d.lat || !d.lng) {
      try {
        const q = encodeURIComponent(`${d.city}, ${d.country}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
        if (res.ok) { const arr = await res.json(); if (arr && arr.length) { d.lat=parseFloat(arr[0].lat); d.lng=parseFloat(arr[0].lon); updated=true; } }
      } catch(e){}
      await new Promise(r=>setTimeout(r,600));
    }
  }
  if (updated) localStorage.setItem('destinations', JSON.stringify(destinations));
}

// AUTH using existing modals (localStorage)
function getUsers(){ return JSON.parse(localStorage.getItem('users')||'[]'); }
function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }
function signupUser(name,email,password){ if(!email||!password){ alert('enter email and password'); return false;} let users=getUsers(); if(users.find(x=>x.email===email)){ alert('email used'); return false;} users.push({name,email,password}); saveUsers(users); alert('signed up'); return true; }
function signinUser(email,password){ let users=getUsers(); let u=users.find(x=>x.email===email&&x.password===password); if(u){ localStorage.setItem('loggedInUser', email); showAppForUser(u); return true; } alert('invalid credentials'); return false; }
function signoutUser(){ localStorage.removeItem('loggedInUser'); location.reload(); }
function showAppForUser(u){ // reveal elements if hidden
  const els = ['map','wishlist','destinationForm']; els.forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display=''; });
  const navLogout = document.getElementById('navLogoutBtn'); if(navLogout) navLogout.style.display='inline-block';
  const badge = document.getElementById('userBadge'); if(badge){ badge.style.display='inline'; badge.textContent = u.name || u.email; }
  ensureCoordsForAll().then(()=>{ renderWishlist(); refreshMarkers(); });
}
function hideApp(){ const els=['map','wishlist','destinationForm']; els.forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; }); const navLogout = document.getElementById('navLogoutBtn'); if(navLogout) navLogout.style.display='none'; const badge=document.getElementById('userBadge'); if(badge) badge.style.display='none'; }

// wire modal buttons
const signupBtn = document.getElementById('signupBtn'); if(signupBtn) signupBtn.addEventListener('click', ()=>{ const name=(document.getElementById('signupName')||{}).value||''; const email=(document.getElementById('signupEmail')||{}).value||''; const pwd=(document.getElementById('signupPassword')||{}).value||''; if(signupUser(name,email,pwd)){ try{ const modal=bootstrap.Modal.getInstance(document.getElementById('signupModal')); if(modal) modal.hide(); }catch(e){} } });
const signinBtn = document.getElementById('signinBtn'); if(signinBtn) signinBtn.addEventListener('click', ()=>{ const email=(document.getElementById('signinEmail')||{}).value||''; const pwd=(document.getElementById('signinPassword')||{}).value||''; if(signinUser(email,pwd)){ try{ const modal=bootstrap.Modal.getInstance(document.getElementById('signinModal')); if(modal) modal.hide(); }catch(e){} } });
const navLogoutBtn = document.getElementById('navLogoutBtn'); if(navLogoutBtn) navLogoutBtn.addEventListener('click', ()=>{ signoutUser(); });

// on load: gate UI
(function(){ const logged=localStorage.getItem('loggedInUser'); if(logged){ const users=getUsers(); const u=users.find(x=>x.email===logged); if(u) showAppForUser(u); } else { try{ hideApp(); }catch(e){} } })();

// init
renderWishlist();
refreshMarkers();
