(() => {
  const phone=document.getElementById('tracePhone'), ip=document.getElementById('traceIp');
  const status=document.getElementById('traceStatus'), results=document.getElementById('traceResults'), mapBox=document.getElementById('traceMap');
  const ipBtn=document.getElementById('traceIpButton'), gpsBtn=document.getElementById('traceGpsButton');
  if(!phone||!ip||!status||!results||!mapBox||!ipBtn||!gpsBtn)return;
  let map, marker;
  const say=s=>status.textContent=s;
  function fields(data){results.replaceChildren();Object.entries(data).forEach(([k,v])=>{if(v==null||v==='')return;const d=document.createElement('div'),b=document.createElement('strong'),s=document.createElement('span');d.className='location-result-item';b.textContent=k;s.textContent=String(v);d.append(b,s);results.append(d);});}
  async function draw(lat,lon,label){
    if(!window.L){await new Promise((ok,no)=>{const c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.append(c);const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=ok;s.onerror=()=>no(Error('Map could not load. Check internet connection.'));document.head.append(s);});}
    mapBox.replaceChildren();
    if(!map){map=L.map(mapBox).setView([lat,lon],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);}else map.setView([lat,lon],11);
    if(marker)marker.remove();marker=L.marker([lat,lon]).addTo(map).bindPopup(label).openPopup();setTimeout(()=>map.invalidateSize(),100);
  }
  phone.addEventListener('blur',()=>{phone.setCustomValidity(phone.value.trim()&&!/^\+?[0-9() .-]{7,20}$/.test(phone.value.trim())?'Check phone number format.':'');});
  ipBtn.addEventListener('click',async()=>{
    const value=ip.value.trim();if(!value){say('ENTER AN IP ADDRESS FIRST');ip.focus();return;}
    if(!/^[0-9a-fA-F:.]+$/.test(value)||value.length>45){say('CHECK IP ADDRESS FORMAT');return;}
    say('LOOKING UP APPROXIMATE IP LOCATION…');fields({});
    try{
      const res=await fetch('https://ipapi.co/'+encodeURIComponent(value)+'/json/');if(!res.ok)throw Error('IP lookup service unavailable.');
      const d=await res.json();if(d.error||!Number.isFinite(Number(d.latitude))||!Number.isFinite(Number(d.longitude)))throw Error(d.reason||'No public location data found.');
      fields({'IP ADDRESS':d.ip||value,'CITY':d.city,'REGION':d.region,'COUNTRY':d.country_name,'POSTAL CODE':d.postal,'ISP / ORGANIZATION':d.org,'TIME ZONE':d.timezone,'LOCATION TYPE':'Approximate network location'});
      await draw(Number(d.latitude),Number(d.longitude),'Approximate IP location');say('IP LOCATION FOUND — APPROXIMATE ONLY');
    }catch(e){say(e.message||'IP LOOKUP FAILED');}
  });
  gpsBtn.addEventListener('click',()=>{
    if(!navigator.geolocation){say('DEVICE LOCATION NOT SUPPORTED');return;}
    say('WAITING FOR YOUR LOCATION PERMISSION…');
    navigator.geolocation.getCurrentPosition(async p=>{
      const c=p.coords;fields({'LOCATION SOURCE':'Your device — permission granted','LATITUDE':c.latitude.toFixed(6),'LONGITUDE':c.longitude.toFixed(6),'ESTIMATED ACCURACY':Math.round(c.accuracy)+' meters'});
      try{await draw(c.latitude,c.longitude,'Your shared device location');say('YOUR DEVICE LOCATION IS DISPLAYED');}catch(e){say(e.message);}
    },e=>say(({1:'LOCATION PERMISSION DENIED',2:'DEVICE LOCATION UNAVAILABLE',3:'LOCATION REQUEST TIMED OUT'})[e.code]||'COULD NOT GET DEVICE LOCATION'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  });
})();