
/* ================= MAP INITIALIZATION ================= */

const map = L.map("map").setView([20, 0], 2);

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
});

const street = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19, attribution: "Tiles © Esri" }
);

const hybrid = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19, attribution: "Tiles © Esri" }
);

let currentBaseLayer = osm;
currentBaseLayer.addTo(map);

/* ================= GLOBAL STATE ================= */

let selectedCountry = null;
let countryLookup = {};
let currentCountryCode = null;
let currentCapitalLat = null;
let currentCapitalLng = null;
let currentCountryName = null;

/* ================= LAYERS ================= */

const cityLayer = L.layerGroup();
const airportLayer = L.layerGroup();

function clearLayers() {
  cityLayer.clearLayers();
  airportLayer.clearLayers();
}

/* ================= COUNTRY STYLES ================= */

const styles = {
  default: { color: "#555", weight: 1, fillOpacity: 0.2 },
  hover: { color: "#00ffff", weight: 2, fillOpacity: 0.5 },
  selected: { color: "#ff7800", weight: 2, fillOpacity: 0.6 },
};

/* ================= COUNTRY HANDLER ================= */

function onEachCountry(feature, layer) {
  const name =
    feature.properties.ADMIN ||
    feature.properties.NAME ||
    feature.properties.name;

  if (!name) return;

  countryLookup[name.toLowerCase()] = layer;

  layer.on({
    mouseover: () => layer.setStyle(styles.hover),
    mouseout: () => layer !== selectedCountry && layer.setStyle(styles.default),
    click: () => selectCountry(name.toLowerCase()),
  });
}

/* ================= LOAD COUNTRIES ================= */

fetch("data/countries.geo.json")
  .then((r) => r.json())
  .then((data) => {
    L.geoJSON(data, {
      style: styles.default,
      onEachFeature: onEachCountry,
    }).addTo(map);
    populateDropdown();
  });

/* ================= DROPDOWN ================= */

function populateDropdown() {
  const select = document.getElementById("countrySelect");
  select.innerHTML = `<option value="">-- Select Country --</option>`;

  Object.keys(countryLookup)
    .sort()
    .forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c.toUpperCase();
      select.appendChild(opt);
    });

  select.addEventListener("change", (e) => {
    if (e.target.value) selectCountry(e.target.value);
  });
}

/* ================= SELECT COUNTRY ================= */

function selectCountry(name) {
  if (selectedCountry) selectedCountry.setStyle(styles.default);

  clearLayers();

  const layer = countryLookup[name];
  if (!layer) return;

  selectedCountry = layer;
  layer.setStyle(styles.selected);
  map.fitBounds(layer.getBounds());

  fetchCountryInfo(name);
}

/* ================= COUNTRY INFO ================= */

function fetchCountryInfo(name) {
  fetch(`php/getCountryInfo.php?country=${encodeURIComponent(name)}`)
    .then((r) => r.json())
    .then(([c]) => {
      currentCountryCode = c.cca2;
      currentCapitalLat = c.capitalInfo?.latlng?.[0];
      currentCapitalLng = c.capitalInfo?.latlng?.[1];
      currentCountryName = c.name.common;

      countryName.textContent = c.name.common;
      countryFlag.src = c.flags.png;
      capital.textContent = c.capital?.[0] || "—";
      population.textContent = c.population.toLocaleString();

      enableButtons();
    });
}

/* ================= UNIVERSAL MODAL ================= */

const modalEl = document.getElementById("infoModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

const infoModal = new bootstrap.Modal(modalEl, {
  backdrop: true,
  keyboard: true,
});

window.openModal = (title, html) => {
  modalTitle.innerHTML = title;
  modalBody.innerHTML = html;
  infoModal.show();
};

/* ================= BUTTON ENABLE ================= */

function enableButtons() {
  ["wikiBtn", "weatherBtn", "breakingNewsBtn", "landmarkBtn"].forEach(
    (id) => (document.getElementById(id).disabled = false)
  );
}

/* ================= INFO BUTTON ================= */

infoBtn.onclick = () => {
  if (!currentCountryName) return;
  openModal(
    "Country Information",
    `
    <img src="${countryFlag.src}" width="300" class="mb-3">
    <p><b>Country:</b> ${countryName.textContent}</p>
    <p><b>Capital:</b> ${capital.textContent}</p>
    <p><b>Population:</b> ${population.textContent}</p>
  `
  );
};

/* ================= WEATHER ================= */

weatherBtn.onclick = () => {
  if (!currentCapitalLat || !currentCapitalLng) return;

  fetch(`php/getWeather.php?lat=${currentCapitalLat}&lon=${currentCapitalLng}`)
    .then((r) => {
      if (!r.ok) throw new Error("Weather request failed");
      return r.json();
    })
    .then((d) => {
      if (!d || !d.current_weather) {
        throw new Error("Weather data unavailable");
      }

      // Find current hour index safely
      let hourIndex = 0;
      if (d.hourly?.time) {
        const now = new Date().toISOString().slice(0, 13);
        hourIndex = d.hourly.time.findIndex(t => t.startsWith(now));
        if (hourIndex === -1) hourIndex = 0;
      }

      // Helper for safe access
      const safe = (value, unit = "") =>
        value !== undefined && value !== null ? `${value}${unit}` : "N/A";

      openModal(
        "Weather",
        `
        <p><b>Temperature:</b> ${safe(d.current_weather.temperature, "°C")}</p>
        <p><b>Feels Like:</b> ${safe(d.hourly?.apparent_temperature?.[hourIndex], "°C")}</p>
        <p><b>Humidity:</b> ${safe(d.hourly?.relativehumidity_2m?.[hourIndex], "%")}</p>
        <p><b>Wind:</b> ${safe(d.current_weather.windspeed, " km/h")}</p>
        <p><b>Wind Direction:</b> ${safe(d.current_weather.winddirection, "°")}</p>
        <p><b>Cloud Cover:</b> ${safe(d.hourly?.cloudcover?.[hourIndex], "%")}</p>
        <p><b>Precipitation:</b> ${safe(d.hourly?.precipitation?.[hourIndex], " mm")}</p>
        <p><b>Sunrise:</b> ${safe(d.daily?.sunrise?.[0])}</p>
        <p><b>Sunset:</b> ${safe(d.daily?.sunset?.[0])}</p>
        `
      );
    })
    .catch((err) => {
      console.error(err);
      openModal(
        "Weather",
        `<p>⚠️ Weather data is currently unavailable.</p>`
      );
    });
};


/* ================= WIKIPEDIA ================= */

wikiBtn.onclick = () =>
  fetch(`php/getWiki.php?country=${encodeURIComponent(currentCountryName)}`)
    .then((r) => r.json())
    .then((d) =>
      openModal(
        "Wikipedia",
        `<h5>${d.title}</h5><p>${d.extract}</p>
        <a href="${d.url}" target="_blank">Read more →</a>`
      )
    );

/* ================= NEWS ================= */

breakingNewsBtn.onclick = () => {
  fetch(`php/getNews.php?country=${encodeURIComponent(currentCountryCode)}`)
    .then(r => r.json())
    .then(d => {
       
      if (!d.articles || !d.articles.length) {
        openModal("Breaking News", "<p>No news availablem at the moment</p>");
        return;
      }

     


      openModal(
        "Breaking News",
        d.articles
          .map(n => `
            <div class="news-item">
              ${n.urlToImage 
                ? `<img src="${n.urlToImage}" alt="News image" class="news-img">`
                : ''
              }
              <h6>${n.title || "No title available"}</h6>
              <p>${n.description || "No description available."}</p>
            </div>
            <hr>
          `)
          .join("")
      );
    })
    .catch(() => {
      openModal("Breaking News", "<p>Failed to load news.</p>");
    });
};


/* ================= LANDMARKS ================= */

landmarkBtn.onclick = () =>
  fetch(`php/getLandmark.php?country=${encodeURIComponent(currentCountryName)}`)
    .then((r) => r.json())
    .then((d) =>
      openModal(
        "Landmarks",
        d.landmarks
          .map(
            (l) =>
              `<h6>${l.title}</h6><p>${l.description}</p><hr>`
          )
          .join("")
      )
    );

/* ================= HOSPITALS ================= */

    hospitalBtn.onclick = () => {
  if (!currentCapitalLat || !currentCapitalLng) return;

  openModal("Hospitals", "<p>Loading hospitals...</p>");

  fetch(`php/getHospitals.php?lat=${currentCapitalLat}&lng=${currentCapitalLng}`)
    .then((r) => {
      if (!r.ok) throw new Error("Hospital request failed");
      return r.json();
    })
    .then((d) => {
      if (!d.elements || d.elements.length === 0) {
        openModal("Hospitals", "<p>No hospitals found.</p>");
        return;
      }

      const hospitalsHtml = d.elements
        .slice(0, 10) // limit results for UI
        .map((h) => {
          const name = h.tags?.name || " Hospital Name Redacted";
          const lat = h.lat;
          const lon = h.lon;

          // Static map image (OpenStreetMap via Mapbox-free source)
          const mapImg = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=300,200&z=14&l=map&pt=${lon},${lat},pm2rdm`;

          return `
            <div class="mb-3">
              <img src="${mapImg}" width="300" class="mb-2 rounded">
              <p><b>${name}</b></p>
              <p>Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}</p>
            </div>
          `;
        })
        .join("");

      openModal(
        "Hospitals",
        `
        <p><b>Hospitals near ${capital.textContent}</b></p>
        ${hospitalsHtml}
        `
      );
    })
    .catch((err) => {
      console.error(err);
      openModal(
        "Hospitals",
        "<p>⚠️ Unable to load hospital data.</p>"
      );
    });
};

/* ================= UNIVERSITY ================= */

universityBtn.onclick = () => {
  if (!currentCountryName) return;

  openModal("Universities", "<p>Loading universities...</p>");

  fetch(`php/getUniversities.php?country=${encodeURIComponent(currentCountryName)}`)
    .then(r => {
      if (!r.ok) throw new Error("Failed to fetch universities");
      return r.json();
    })
    .then(data => {
      if (!data.length) {
        openModal("Universities", "<p>No universities found.</p>");
        return;
      }

      const html = data
        .slice(0, 20)
        .map(u => `
          <p>
            🎓 <b>${u.name}</b><br>
            <small>${u.country}</small><br>
            ${u.web_pages?.[0] ? `<a href="${u.web_pages[0]}" target="_blank">Website</a>` : ''}
          </p>
        `)
        .join("");

      openModal(
        "Universities",
        `
        <p><b>Universities in ${currentCountryName}</b></p>
        ${html}
        `
      );
    })
    .catch(err => {
      console.error(err);
      openModal("Universities", "<p>⚠️ Unable to load universities.</p>");
    });
};

/* ================= AIRPORTS ================= */

// airportBtn.onclick = () => {
//   if (!currentCountryName) return;
//     console.log(currentCountryName);
//   openModal("Airports", "<p>Loading airports...</p>");

//   fetch(`php/getAirport.php?country=${encodeURIComponent(currentCountryName)}`)
//     .then((r) => {
//       if (!r.ok) throw new Error("Failed to fetch airports");
//       return r.text(); // CSV
//     })
//     .then((csv) => {
//       const lines = csv.split("\n");
//       const headers = lines[0].split(",");

//       const countryIndex = headers.indexOf("iso_country");
//       const nameIndex = headers.indexOf("name");
//       const typeIndex = headers.indexOf("type");
//       const latIndex = headers.indexOf("latitude_deg");
//       const lonIndex = headers.indexOf("longitude_deg");

//       if (countryIndex === -1) {
//         throw new Error("Invalid CSV format");
//       }

//       const countryCode = currentCountryCode; // e.g. "US", "GB", "NG"

//       const airports = lines
//         .slice(1)
//         .map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/))
//         .filter(row => row[countryIndex] === countryCode)
//         .slice(0, 20); // limit for UI

//       if (!airports.length) {
//         openModal("Airports", "<p>No airports found.</p>");
//         return;
//       }

//       const html = airports
//         .map(a => {
//           const name = a[nameIndex] || "Unnamed Airport";
//           const type = a[typeIndex] || "N/A";
//           const lat = a[latIndex];
//           const lon = a[lonIndex];

//           const mapImg = lat && lon
//             ? `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=300,180&l=map&pt=${lon},${lat},pm2blm`
//             : "";

//           return `
//             <div class="mb-3">
//               ${mapImg ? `<img src="${mapImg}" width="300" class="mb-2 rounded">` : ""}
//               <p class="mb-1">
//                 ✈️ <b>${name}</b>
//               </p>
//               <small>Type: ${type.replace("_", " ")}</small>
//             </div>
//           `;
//         })
//         .join("");

//       openModal(
//         "Airports",
//         `
//         <p><b>Airports in ${currentCountryName}</b></p>
//         ${html}
//         `
//       );
//     })
//     .catch((err) => {
//       console.error(err);
//       openModal("Airports", "<p>Unable to load airport data.</p>");
//     });
// };


airportBtn.onclick = () => {
  if (!currentCountryName) return;

  openModal("Airports", "<p>Loading airports...</p>");

  fetch(`php/getAirport.php?country=${encodeURIComponent(currentCountryName)}`)
    .then(r => {
      if (!r.ok) throw new Error("Failed to fetch airports");
      return r.json();
    })
    .then(airports => {
      if (!airports.length) {
        openModal("Airports", "<p>No airports found.</p>");
        return;
      }

      const html = airports.map(a => {
        const mapImg = a.lat && a.lon
          ? `https://static-maps.yandex.ru/1.x/?ll=${a.lon},${a.lat}&z=6&size=300,180&l=map&pt=${a.lon},${a.lat},pm2blm`
          : "";

        return `
          <div class="mb-3">
            ${mapImg ? `<img src="${mapImg}" width="300" class="mb-2 rounded">` : ""}
            <p class="mb-1">✈️ <b>${a.name}</b></p>
            <small>Type: ${a.type.replace("_", " ")}</small>
          </div>
        `;
      }).join("");

      openModal("Airports", `<p><b>Airports in ${currentCountryName}</b></p>${html}`);
    })
    .catch(err => {
      console.error(err);
      openModal("Airports", "<p>⚠️ Unable to load airport data.</p>");
    });
};


/* ================= MUSEUMS================= */

museumBtn.onclick = () => {
  // Ensure we have capital coordinates
  if (!currentCapitalLat || !currentCapitalLng) return;

  openModal("Museums", "<p>Loading museums...</p>");

  fetch(`php/getMuseums.php?lat=${currentCapitalLat}&lng=${currentCapitalLng}`)
    .then(r => {
      if (!r.ok) throw new Error("Failed to fetch museums");
      return r.json();
    })
    .then(data => {
      if (!data.elements || !data.elements.length) {
        openModal("Museums", "<p>No museums found nearby.</p>");
        return;
      }

      // Limit to 20 for modal
      const museums = data.elements.slice(0, 20);

      const html = museums.map(m => {
        const name = m.tags?.name || "Unnamed Museum";
        const lat = m.lat;
        const lon = m.lon;

        // Map preview image (optional)
        const mapImg = lat && lon
          ? `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=14&size=300,180&l=map&pt=${lon},${lat},pm2blm`
          : "";

        return `
          <div class="mb-3">
            ${mapImg ? `<img src="${mapImg}" width="300" class="mb-2 rounded">` : ""}
            <p class="mb-1">🏛 <b>${name}</b></p>
            ${m.tags?.tourism ? `<small>Type: ${m.tags.tourism}</small>` : ""}
          </div>
        `;
      }).join("");

      openModal("Museums", `<p><b>Museums near ${capital.textContent}</b></p>${html}`);
    })
    .catch(err => {
      console.error(err);
      openModal("Museums", "<p>⚠️ Unable to load museums.</p>");
    });
};



/* ================= MAP TYPE SWITCH ================= */

document
  .querySelectorAll('input[name="mapType"]')
  .forEach((radio) =>
    radio.addEventListener("change", (e) => {
      map.removeLayer(currentBaseLayer);
      currentBaseLayer =
        e.target.value === "google"
          ? street
          : e.target.value === "hybrid"
          ? hybrid
          : osm;
      currentBaseLayer.addTo(map);
    })
  );
