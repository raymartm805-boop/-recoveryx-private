(() => {
  const tools = document.getElementById('locationMapTools');
  const mapBox = document.getElementById('traceMap');
  const status = document.getElementById('traceStatus');
  const results = document.getElementById('traceResults');
  if (!tools || !mapBox || !status || !results) return;

  let map = null;
  let marker = null;
  let tileLayer = null;
  let busy = false;

  const say = message => { status.textContent = message; };

  function showCoordinates(lat, lon) {
    results.replaceChildren();
    [
      ['LATITUDE', lat.toFixed(6)],
      ['LONGITUDE', lon.toFixed(6)],
      ['MAP SOURCE', 'OpenStreetMap'],
      ['MAP VIEW', 'Street map at entered coordinate']
    ].forEach(([label, value]) => {
      const item = document.createElement('div');
      const heading = document.createElement('strong');
      const content = document.createElement('span');
      item.className = 'location-result-item';
      heading.textContent = label;
      content.textContent = value;
      item.append(heading, content);
      results.append(item);
    });
  }

  function loadCss() {
    if (document.querySelector('link[data-location-leaflet-css]')?.sheet) return Promise.resolve();
    const urls = [
      'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    ];
    return urls.reduce((chain, url) => chain.catch(() => new Promise((resolve, reject) => {
      const old = document.querySelector('link[data-location-leaflet-css]');
      if (old) old.remove();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.locationLeafletCss = 'true';
      link.onload = resolve;
      link.onerror = () => { link.remove(); reject(new Error('Map styles could not load. Check your internet connection.')); };
      document.head.append(link);
    })), Promise.reject());
  }

  function loadScript() {
    if (window.L) return Promise.resolve();
    const urls = [
      'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    ];
    return urls.reduce((chain, url) => chain.catch(() => new Promise((resolve, reject) => {
      const old = document.querySelector('script[data-location-leaflet-js]');
      if (old) old.remove();
      const script = document.createElement('script');
      script.src = url;
      script.dataset.locationLeafletJs = 'true';
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error('Map library could not load. Check your internet connection.')); };
      document.head.append(script);
    })), Promise.reject());
  }

  async function loadLeaflet() {
    if (window.L) return;
    await Promise.all([loadCss(), loadScript()]);
    if (!window.L) throw new Error('Map library did not initialize. Please reload the app and try again.');
  }

  async function showMap(lat, lon) {
    await loadLeaflet();
    mapBox.replaceChildren();
    mapBox.style.display = 'block';
    if (!map) {
      map = L.map(mapBox, { zoomControl: true, preferCanvas: true }).setView([lat, lon], 18);
      tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 3,
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      });
      tileLayer.on('tileerror', () => say('MAP TILE ERROR — CHECK INTERNET CONNECTION. You can open the same coordinates in OpenStreetMap below.'));
      tileLayer.on('load', () => say('STREET MAP LOADED — MARKER PLACED AT THE ENTERED COORDINATES.'));
      tileLayer.addTo(map);
      L.control.scale({ imperial: false, metric: true }).addTo(map);
    } else {
      map.setView([lat, lon], 18);
      map.invalidateSize(true);
    }
    if (marker) marker.remove();
    marker = L.marker([lat, lon]).addTo(map)
      .bindPopup('Entered coordinates<br>' + lat.toFixed(6) + ', ' + lon.toFixed(6))
      .openPopup();

    let external = document.getElementById('openOsmFallback');
    if (!external) {
      external = document.createElement('a');
      external.id = 'openOsmFallback';
      external.className = 'button button-secondary';
      external.target = '_blank';
      external.rel = 'noopener noreferrer';
      external.textContent = 'OPEN STREET MAP IN BROWSER';
      external.style.display = 'inline-flex';
      external.style.margin = '0 0 12px';
      mapBox.insertAdjacentElement('afterend', external);
    }
    external.href = 'https://www.openstreetmap.org/?mlat=' + encodeURIComponent(lat) + '&mlon=' + encodeURIComponent(lon) + '#map=18/' + encodeURIComponent(lat) + '/' + encodeURIComponent(lon);
    requestAnimationFrame(() => map && map.invalidateSize(true));
  }

  const panel = document.createElement('section');
  panel.className = 'coordinate-target-panel';
  panel.innerHTML = '<div class="coordinate-target-heading">ENTER MAP COORDINATES</div>' +
    '<div class="coordinate-target-fields">' +
    '<label class="field">LATITUDE<input id="targetLatitude" type="number" min="-90" max="90" step="any" inputmode="decimal" placeholder="e.g. 14.715078"></label>' +
    '<label class="field">LONGITUDE<input id="targetLongitude" type="number" min="-180" max="180" step="any" inputmode="decimal" placeholder="e.g. 121.103241"></label>' +
    '</div><button class="button button-primary" id="showCoordinateMap" type="button">SHOW ON STREET MAP</button>' +
    '<p class="coordinate-target-hint">This map displays only the coordinates you enter. It does not locate or track another person or device.</p>';
  tools.replaceChildren(panel);
  const latitude = panel.querySelector('#targetLatitude');
  const longitude = panel.querySelector('#targetLongitude');
  const button = panel.querySelector('#showCoordinateMap');

  button.addEventListener('click', async () => {
    const latText = latitude.value.trim();
    const lonText = longitude.value.trim();
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!latText || !lonText || !Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      say('PLEASE ENTER A VALID LATITUDE (-90 TO 90) AND LONGITUDE (-180 TO 180).');
      (!latText || !Number.isFinite(lat) || lat < -90 || lat > 90 ? latitude : longitude).focus();
      return;
    }
    if (busy) return;
    busy = true;
    button.disabled = true;
    button.textContent = 'LOADING STREET MAP…';
    try {
      say('CONNECTING TO OPENSTREETMAP…');
      showCoordinates(lat, lon);
      await showMap(lat, lon);
      say('MAP READY — WAITING FOR STREET TILES.');
    } catch (error) {
      say(error.message || 'THE MAP COULD NOT LOAD. CHECK YOUR INTERNET CONNECTION.');
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = 'SHOW ON STREET MAP';
    }
  });

  [latitude, longitude].forEach(input => input.addEventListener('keydown', event => {
    if (event.key === 'Enter') button.click();
  }));

  window.addEventListener('hashchange', () => {
    if (location.hash === '#location-tracing' && map) requestAnimationFrame(() => map.invalidateSize(true));
  });
  window.addEventListener('resize', () => {
    if (map) map.invalidateSize(true);
  });
})();