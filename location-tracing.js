(() => {
  const ip=document.getElementById('traceIp');
  const status=document.getElementById('traceStatus');
  const results=document.getElementById('traceResults');
  const mapBox=document.getElementById('traceMap');
  const ipBtn=document.getElementById('traceIpButton');
  const codeInput=document.getElementById('mapAccessCode');
  const activateBtn=document.getElementById('mapActivateButton');
  const activation=document.getElementById('mapActivation');
  const tools=document.getElementById('locationMapTools');
  const activationStatus=document.getElementById('mapActivationStatus');
  if(!ip||!mapBox||!ipBtn||!codeInput||!activateBtn||!activation||!tools)return;
  const ACCESS_CODE='MAP-7264';
  let map,marker,busy=false;
  const say=s=>{if(status)status.textContent=s;if(activationStatus&&activation.hidden===false)activationStatus.textContent=s;};
  function fields(data){results.replaceChildren();Object.entries(data).forEach(([k,v])=>{if(v==null||v==='')return;const d=document.createElement('div'),b=document.createElement('strong'),s=document.createElement('span');d.className='location-result-item';b.textContent=k;s.textContent=String(v);d.append(b,s);results.append(d);});}
  function activate(){
    if(activation.hidden)return;
    const entered=codeInput.value.trim().toUpperCase();
    if(entered!==ACCESS_CODE){
      if(activationStatus)activationStatus.textContent='INVALID ACTIVATION CODE — CHECK THE CODE AND TRY AGAIN.';
      codeInput.setAttribute('aria-invalid','true');
      codeInput.focus();
      return;
    }
    codeInput.removeAttribute('aria-invalid');
    if(activationStatus)activationStatus.textContent='ACCESS GRANTED — OPENING LOCATION TOOLS…';
    activateBtn.disabled=true;
    activation.hidden=true;
    tools.hidden=false;
    say('TRACING SYSTEM READY — ENTER AN IP ADDRESS');
    tools.scrollIntoView?.({behavior:'smooth',block:'start'});
  }
  // A single native click handler supports mouse, Android touch and keyboard activation.
  // Expose a named fallback so the button can still invoke activation if WebView event
  // delegation behaves differently; the hidden-state guard prevents duplicate activation.
  activateBtn.type='button';
  activateBtn.disabled=false;
  activateBtn.style.pointerEvents='auto';
  activateBtn.style.touchAction='manipulation';
  window.activateMapAccess=activate;
  activateBtn.onclick=activate;
  codeInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();activate();}});
  codeInput.addEventListener('input',()=>{codeInput.removeAttribute('aria-invalid');if(activationStatus)activationStatus.textContent='ENTER THE ACTIVATION CODE TO CONTINUE.';});
  async function draw(lat,lon,label){
    if(!window.L){await new Promise((ok,no)=>{const c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.append(c);const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=ok;s.onerror=()=>no(Error('Map could not load. Check internet connection.'));document.head.append(s);});}
    if(!map){
      // Clear the initial placeholder only when creating Leaflet for the first time.
      // Clearing mapBox on later searches would detach Leaflet's panes and leave a blank map.
      mapBox.replaceChildren();
      map=L.map(mapBox,{preferCanvas:true}).setView([lat,lon],11);
      const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'© OpenStreetMap contributors'
      });
      tiles.on('tileerror',()=>say('MAP TILE ERROR — CHECK INTERNET CONNECTION OR TRY AGAIN'));
      tiles.addTo(map);
    }else{
      map.setView([lat,lon],11);
      map.invalidateSize(true);
    }
    if(marker)marker.remove();
    const pulseIcon=L.divIcon({className:'trace-pulse-icon',html:'<span class="trace-pulse-core"></span><span class="trace-pulse-ring"></span>',iconSize:[34,34],iconAnchor:[17,17]});
    marker=L.marker([lat,lon],{icon:pulseIcon}).addTo(map).bindPopup(label).openPopup();
    let liveTag=mapBox.querySelector('.trace-live-tag');if(!liveTag){liveTag=document.createElement('div');liveTag.className='trace-live-tag';mapBox.append(liveTag);}liveTag.textContent=label.toLowerCase().includes('live location')?'LIVE DEVICE GPS · OWNER CONSENT':'MAP DISPLAY · '+label.toUpperCase();
    let sweep=mapBox.querySelector('.trace-map-sweep');if(!sweep){sweep=document.createElement('div');sweep.className='trace-map-sweep';sweep.setAttribute('aria-hidden','true');mapBox.append(sweep);}
    setTimeout(()=>{if(map){map.invalidateSize(true);}},250);
  }

  // Coordinate target: show a real OpenStreetMap view for coordinates supplied by the user.
  const coordPanel=document.createElement('div');
  coordPanel.className='coordinate-target-panel';
  coordPanel.innerHTML='<div class="coordinate-target-heading">TARGET COORDINATES</div><div class="coordinate-target-fields"><label class="field">LATITUDE<input id="targetLatitude" type="number" min="-90" max="90" step="any" inputmode="decimal" placeholder="e.g. 14.5995"></label><label class="field">LONGITUDE<input id="targetLongitude" type="number" min="-180" max="180" step="any" inputmode="decimal" placeholder="e.g. 120.9842"></label></div><button class="button button-primary" id="showCoordinateMap" type="button">SHOW TARGET ON MAP</button><p class="coordinate-target-hint">Enter coordinates shared with you by the device owner. The map shows that coordinate, not a phone's live location.</p>';
  tools.insertBefore(coordPanel,tools.firstChild);

  // Consent-based location sharing for a device owner using social media or phone contact.
  // A social handle or phone number is never queried for a person's location.
  const sharePanel=document.createElement('section');
  sharePanel.className='coordinate-target-panel';
  sharePanel.innerHTML='<div class="coordinate-target-heading">CONSENT-BASED LIVE DEVICE LOCATION</div><p class="coordinate-target-hint">Use this only on the device whose owner is sharing its location. Press START LIVE LOCATION and approve the browser location prompt. The map marker updates as that device moves. Phone numbers and social usernames cannot be used to locate someone.</p><button class="button button-primary" id="getSharedDeviceLocation" type="button">START LIVE LOCATION</button><button class="button button-secondary" id="stopSharedDeviceLocation" type="button" disabled>STOP SHARING</button><p class="coordinate-target-hint" id="sharedLocationStatus" role="status" aria-live="polite">NOT SHARING — DEVICE OWNER PERMISSION REQUIRED.</p>';
  tools.insertBefore(sharePanel,coordPanel.nextSibling);
  const liveStart=sharePanel.querySelector('#getSharedDeviceLocation');
  const liveStop=sharePanel.querySelector('#stopSharedDeviceLocation');
  const liveStatus=sharePanel.querySelector('#sharedLocationStatus');
  let liveWatchId=null;
  liveStop.addEventListener('click',()=>{
    if(liveWatchId!==null)navigator.geolocation.clearWatch(liveWatchId);
    liveWatchId=null;liveStart.disabled=false;liveStart.textContent='START LIVE LOCATION';liveStop.disabled=true;
    liveStatus.textContent='LIVE LOCATION SHARING STOPPED ON THIS DEVICE.';
    say('LIVE LOCATION SHARING STOPPED');
  });
  liveStart.addEventListener('click',()=>{
    if(!navigator.geolocation){liveStatus.textContent='LOCATION PERMISSION IS NOT AVAILABLE. Use a supported browser over HTTPS.';return;}
    if(liveWatchId!==null)return;
    liveStart.disabled=true;liveStart.textContent='WAITING FOR PERMISSION…';
    liveStatus.textContent='WAITING FOR THE DEVICE OWNER TO APPROVE LOCATION ACCESS…';
    liveWatchId=navigator.geolocation.watchPosition(async position=>{
      const lat=position.coords.latitude,lon=position.coords.longitude;
      latInput.value=lat.toFixed(6);lonInput.value=lon.toFixed(6);
      try{
        await draw(lat,lon,'Live location shared by this device');
        fields({'LOCATION SOURCE':'Live GPS — device owner permission','LATITUDE':lat.toFixed(6),'LONGITUDE':lon.toFixed(6),'GPS ACCURACY':Math.round(position.coords.accuracy)+' meters','LAST UPDATED':new Date(position.timestamp).toLocaleTimeString()});
        liveStatus.textContent='● LIVE — THIS DEVICE IS SHARING ITS LOCATION. GPS accuracy: about '+Math.round(position.coords.accuracy)+' m. Last update: '+new Date(position.timestamp).toLocaleTimeString()+'.';
        liveStart.textContent='LIVE LOCATION ACTIVE';
        liveStop.disabled=false;
        say('LIVE DEVICE LOCATION — CONSENTED GPS UPDATE RECEIVED');
      }catch(error){liveStatus.textContent=(error.message||'MAP COULD NOT LOAD.')+' GPS sharing is still active; stop it when finished.';liveStart.disabled=true;liveStart.textContent='LIVE LOCATION ACTIVE';liveStop.disabled=false;}
    },error=>{
      const messages={1:'LOCATION PERMISSION DENIED. The device owner must allow location access.',2:'DEVICE LOCATION IS UNAVAILABLE. Check GPS and try again.',3:'LOCATION REQUEST TIMED OUT. Waiting for another GPS update may help.'};
      liveStatus.textContent=messages[error.code]||'COULD NOT GET DEVICE LOCATION.';
      if(liveWatchId!==null)navigator.geolocation.clearWatch(liveWatchId);
      liveWatchId=null;liveStart.disabled=false;liveStart.textContent='START LIVE LOCATION';liveStop.disabled=true;
    },{enableHighAccuracy:true,timeout:25000,maximumAge:0});
  });
  const latInput=coordPanel.querySelector('#targetLatitude');
  const lonInput=coordPanel.querySelector('#targetLongitude');
  coordPanel.querySelector('#showCoordinateMap').addEventListener('click',async()=>{
    const lat=Number(latInput.value),lon=Number(lonInput.value);
    if(latInput.value.trim()===''||lonInput.value.trim()===''||!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180){
      say('ENTER VALID LATITUDE (-90 TO 90) AND LONGITUDE (-180 TO 180)');
      (!latInput.value.trim()||!Number.isFinite(lat)||lat < -90||lat > 90?latInput:lonInput).focus();
      return;
    }
    if(busy)return;
    busy=true;
    const coordinateButton=coordPanel.querySelector('#showCoordinateMap');
    coordinateButton.disabled=true;
    coordinateButton.textContent='LOADING MAP…';
    try{
      say('LOADING MAP FOR THE COORDINATES YOU ENTERED…');
      fields({'TARGET LATITUDE':lat,'TARGET LONGITUDE':lon,'MAP RESULT':'User-supplied coordinates','LOCATION SOURCE':'Coordinates entered manually'});
      say('LOADING MAP TILES…');
      await draw(lat,lon,'User-supplied target coordinates');
      
      say('MAP READY — SHOWING THE ENTERED COORDINATE');
    }catch(e){say(e.message||'MAP COULD NOT LOAD');}
    finally{busy=false;coordinateButton.disabled=false;coordinateButton.textContent='SHOW TARGET ON MAP';}
  });

  ipBtn.addEventListener('click',async()=>{
    if(busy)return;
    const value=ip.value.trim();
    if(!value){say('ENTER AN IP ADDRESS FIRST');ip.focus();return;}
    if(!/^[0-9a-fA-F:.]+$/.test(value)||value.length>45){say('INVALID IP ADDRESS FORMAT');ip.focus();return;}
    busy=true;ipBtn.disabled=true;ipBtn.textContent='LOOKING UP…';results.replaceChildren();
    try{
      say('QUERYING PUBLIC IP GEOLOCATION SERVICE…');
      const res=await fetch('https://ipapi.co/'+encodeURIComponent(value)+'/json/');if(!res.ok)throw Error('IP lookup service unavailable.');
      const d=await res.json();if(d.error||!Number.isFinite(Number(d.latitude))||!Number.isFinite(Number(d.longitude)))throw Error(d.reason||'No public location data found.');
      say('IP LOOKUP RECEIVED — PREPARING APPROXIMATE MAP…');
      fields({'IP ADDRESS':d.ip||value,'CITY':d.city,'REGION':d.region,'COUNTRY':d.country_name,'POSTAL CODE':d.postal,'ISP / ORGANIZATION':d.org,'TIME ZONE':d.timezone,'TRACE RESULT':'Approximate network location'});
      say('LOADING APPROXIMATE IP LOCATION MAP…');
      await draw(Number(d.latitude),Number(d.longitude),'Approximate IP location');say('IP LOOKUP COMPLETE — APPROXIMATE NETWORK LOCATION ONLY');
    }catch(e){say(e.message||'IP LOOKUP FAILED');}
    finally{busy=false;ipBtn.disabled=false;ipBtn.textContent='START IP TRACE';}
  });
})();