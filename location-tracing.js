(() => {
  const tools = document.getElementById('locationMapTools');
  const mapBox = document.getElementById('traceMap');
  const status = document.getElementById('traceStatus');
  const results = document.getElementById('traceResults');
  if (!tools || !mapBox || !status || !results) return;

  let map = null;
  let marker = null;
  let busy = false;

  const say = message => { status.textContent = message; };

  function showCoordinates(lat, lon) {
    results.replaceChildren();
    [
      ['LATITUDE', lat.toFixed(6)],
      ['LONGITUDE', lon.toFixed(6)],
      ['MAP SOURCE', 'OpenStreetMap'],
      ['MAP VIEW', 'Street map at coordinate']
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

  async function loadLeaflet() {
    if (window.L) return;
    await new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-location-leaflet]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.dataset.locationLeaflet = 'true';
        document.head.append(css);
      }
      const existing = document.querySelector('script[data-location-leaflet]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('Map library could not load. Check your internet connection.')), { once: true });
        if (window.L) resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.dataset.locationLeaflet = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Map library could not load. Check your internet connection.'));
      document.head.append(script);
    });
  }

  async function showMap(lat, lon) {
    await loadLeaflet();
    if (!map) {
      mapBox.replaceChildren();
      map = L.map(mapBox, { zoomControl: true, preferCanvas: true }).setView([lat, lon], 17);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 3,
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      L.control.scale({ imperial: false, metric: true }).addTo(map);
    } else {
      map.setView([lat, lon], 17);
      map.invalidateSize(true);
    }
    if (marker) marker.remove();
    marker = L.marker([lat, lon]).addTo(map)
      .bindPopup('Entered coordinates<br>' + lat.toFixed(6) + ', ' + lon.toFixed(6))
      .openPopup();
    setTimeout(() => map && map.invalidateSize(true), 200);
  }

  const panel = document.createElement('section');
  panel.className = 'coordinate-target-panel';
  panel.innerHTML = '<div class="coordinate-target-heading">ENTER MAP COORDINATES</div>' +
    '<div class="coordinate-target-fields">' +
    '<label class="field">LATITUDE<input id="targetLatitude" type="number" min="-90" max="90" step="any" inputmode="decimal" placeholder="e.g. 14.5995"></label>' +
    '<label class="field">LONGITUDE<input id="targetLongitude" type="number" min="-180" max="180" step="any" inputmode="decimal" placeholder="e.g. 120.9842"></label>' +
    '</div><button class="button button-primary" id="showCoordinateMap" type="button">SHOW ON STREET MAP</button>' +
    '<p class="coordinate-target-hint">Enter valid coordinates to place a marker on OpenStreetMap. The map displays the coordinates entered; it does not find or track another person or device.</p>';
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
      say('LOADING OPENSTREETMAP FOR THE COORDINATES YOU ENTERED…');
      showCoordinates(lat, lon);
      await showMap(lat, lon);
      say('MAP READY — MARKER PLACED AT THE ENTERED COORDINATES.');
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
})();