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
  const progressBar=document.getElementById('traceProgressBar');
  const percent=document.getElementById('tracePercent');
  const progress=document.querySelector('.trace-progress');
  const steps=document.getElementById('traceSteps');
  if(!ip||!mapBox||!ipBtn||!codeInput||!activateBtn||!activation||!tools)return;
  const ACCESS_CODE='MAP-7264';
  let map,marker,busy=false;
  const say=s=>{if(status)status.textContent=s;};
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function setProgress(value){if(progressBar)progressBar.style.width=value+'%';if(percent)percent.textContent=value+'%';if(progress)progress.setAttribute('aria-valuenow',String(value));}
  function setStep(name,state){const item=steps?.querySelector('[data-step="'+name+'"]');if(!item)return;item.classList.remove('is-active','is-done','is-error');if(state)item.classList.add('is-'+state);}
  function resetSteps(){['validate','lookup','coordinates','map'].forEach(n=>setStep(n,''));setProgress(0);}
  function fields(data){results.replaceChildren();Object.entries(data).forEach(([k,v])=>{if(v==null||v==='')return;const d=document.createElement('div'),b=document.createElement('strong'),s=document.createElement('span');d.className='location-result-item';b.textContent=k;s.textContent=String(v);d.append(b,s);results.append(d);});}
  function activate(){
    if(codeInput.value.trim()!==ACCESS_CODE){say('INVALID ACTIVATION CODE');codeInput.setCustomValidity('Incorrect activation code.');codeInput.reportValidity();return;}
    codeInput.setCustomValidity('');activation.hidden=true;tools.hidden=false;say('TRACING SYSTEM READY — ENTER AN IP ADDRESS');
  }
  activateBtn.addEventListener('click',activate);
  codeInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();activate();}});
  codeInput.addEventListener('input',()=>codeInput.setCustomValidity(''));
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
    let liveTag=mapBox.querySelector('.trace-live-tag');if(!liveTag){liveTag=document.createElement('div');liveTag.className='trace-live-tag';liveTag.textContent='LIVE MAP DISPLAY · APPROXIMATE IP POINT';mapBox.append(liveTag);}
    let sweep=mapBox.querySelector('.trace-map-sweep');if(!sweep){sweep=document.createElement('div');sweep.className='trace-map-sweep';sweep.setAttribute('aria-hidden','true');mapBox.append(sweep);}
    setTimeout(()=>{if(map){map.invalidateSize(true);}},250);
  }

  // Coordinate target: show a real OpenStreetMap view for coordinates supplied by the user.
  const coordPanel=document.createElement('div');
  coordPanel.className='coordinate-target-panel';
  coordPanel.innerHTML='<div class="coordinate-target-heading">TARGET COORDINATES</div><div class="coordinate-target-fields"><label class="field">LATITUDE<input id="targetLatitude" type="number" min="-90" max="90" step="any" inputmode="decimal" placeholder="e.g. 14.5995"></label><label class="field">LONGITUDE<input id="targetLongitude" type="number" min="-180" max="180" step="any" inputmode="decimal" placeholder="e.g. 120.9842"></label></div><button class="button button-primary" id="showCoordinateMap" type="button">SHOW TARGET ON MAP</button><p class="coordinate-target-hint">Enter coordinates shared with you by the device owner. The map shows that coordinate, not a phone's live location.</p>';
  tools.insertBefore(coordPanel,tools.firstChild);
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
    resetSteps();
    try{
      const started=Date.now();
      setStep('validate','active');say('VALIDATING TARGET COORDINATES…');setProgress(12);
      await wait(700);setStep('validate','done');
      setStep('lookup','active');say('PREPARING MAP REQUEST…');setProgress(38);
      await wait(900);setStep('lookup','done');
      setStep('coordinates','active');say('SETTING MAP CENTER…');setProgress(68);
      fields({'TARGET LATITUDE':lat,'TARGET LONGITUDE':lon,'MAP RESULT':'User-supplied coordinates','LOCATION SOURCE':'Coordinates entered manually'});
      await wait(700);setStep('coordinates','done');
      setStep('map','active');say('LOADING REAL MAP TILES…');setProgress(86);
      await draw(lat,lon,'User-supplied target coordinates');
      const remaining=30000-(Date.now()-started);
      if(remaining>0)await wait(remaining);
      setStep('map','done');setProgress(100);
      say('MAP READY — SHOWING THE ENTERED COORDINATE');
    }catch(e){say(e.message||'MAP COULD NOT LOAD');setStep('map','error');}
    finally{busy=false;coordinateButton.disabled=false;coordinateButton.textContent='SHOW TARGET ON MAP';}
  });

  ipBtn.addEventListener('click',async()=>{
    if(busy)return;
    const value=ip.value.trim();
    if(!value){say('ENTER AN IP ADDRESS FIRST');ip.focus();return;}
    if(!/^[0-9a-fA-F:.]+$/.test(value)||value.length>45){say('INVALID IP ADDRESS FORMAT');ip.focus();return;}
    busy=true;ipBtn.disabled=true;ipBtn.textContent='TRACING…';results.replaceChildren();resetSteps();
    try{
      setStep('validate','active');say('VALIDATING IP ADDRESS…');setProgress(12);await wait(250);setStep('validate','done');
      setStep('lookup','active');say('QUERYING PUBLIC GEOLOCATION DATA…');setProgress(38);
      const res=await fetch('https://ipapi.co/'+encodeURIComponent(value)+'/json/');if(!res.ok)throw Error('IP lookup service unavailable.');
      const d=await res.json();if(d.error||!Number.isFinite(Number(d.latitude))||!Number.isFinite(Number(d.longitude)))throw Error(d.reason||'No public location data found.');
      setStep('lookup','done');setStep('coordinates','active');say('RESOLVING APPROXIMATE COORDINATES…');setProgress(68);await wait(250);
      fields({'IP ADDRESS':d.ip||value,'CITY':d.city,'REGION':d.region,'COUNTRY':d.country_name,'POSTAL CODE':d.postal,'ISP / ORGANIZATION':d.org,'TIME ZONE':d.timezone,'TRACE RESULT':'Approximate network location'});
      setStep('coordinates','done');setStep('map','active');say('RENDERING APPROXIMATE MAP…');setProgress(86);
      await draw(Number(d.latitude),Number(d.longitude),'Approximate IP location');setStep('map','done');setProgress(100);say('TRACE COMPLETE — APPROXIMATE IP LOCATION ONLY');
    }catch(e){say(e.message||'IP TRACE FAILED');setStep('lookup','error');}
    finally{busy=false;ipBtn.disabled=false;ipBtn.textContent='START IP TRACE';}
  });
})();