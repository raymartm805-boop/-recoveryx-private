(() => {
  const tools = document.getElementById('locationMapTools');
  const mapBox = document.getElementById('traceMap');
  const status = document.getElementById('traceStatus');
  const results = document.getElementById('traceResults');
  if (!tools || !mapBox || !status || !results) return;

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

  function showMap(lat, lon) {
    const latitudeSpan = 0.0035;
    const longitudeSpan = 0.0040;
    const bbox = [
      (lon - longitudeSpan).toFixed(6),
      (lat - latitudeSpan).toFixed(6),
      (lon + longitudeSpan).toFixed(6),
      (lat + latitudeSpan).toFixed(6)
    ].join(',');

    const frame = document.createElement('iframe');
    frame.className = 'street-map-frame';
    frame.title = 'OpenStreetMap street map at entered coordinates';
    frame.loading = 'eager';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' +
      encodeURIComponent(bbox) + '&layer=mapnik&marker=' +
      encodeURIComponent(lat.toFixed(6) + ',' + lon.toFixed(6));
    frame.addEventListener('load', () => {
      say('STREET MAP FRAME LOADED — CHECK THE MAP AND MARKER.');
    });
    frame.addEventListener('error', () => {
      say('MAP DID NOT LOAD. CHECK INTERNET, THEN USE OPEN STREET MAP IN BROWSER.');
    });

    mapBox.replaceChildren(frame);
    mapBox.style.display = 'block';

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
    external.href = 'https://www.openstreetmap.org/?mlat=' + encodeURIComponent(lat) +
      '&mlon=' + encodeURIComponent(lon) + '#map=18/' +
      encodeURIComponent(lat) + '/' + encodeURIComponent(lon);
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

  button.addEventListener('click', () => {
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
    button.textContent = 'OPENING STREET MAP…';
    try {
      say('OPENING OPENSTREETMAP…');
      showCoordinates(lat, lon);
      showMap(lat, lon);
      say('MAP REQUEST SENT — WAIT FOR STREET MAP TO LOAD.');
    } catch (error) {
      say('MAP ERROR: ' + (error.message || 'PLEASE CHECK YOUR INTERNET CONNECTION.'));
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