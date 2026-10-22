// Public API. We use 3 endpoints:
//   /character   /location   /episode
// The endpoints are nested: the data of one request gives the URLs
// (location.url, residents, episode, characters) used by the next request.
const API_URL = 'https://rickandmortyapi.com/api/';

// Which endpoint is being used right now
let currentType = 'character';

// Time the search takes to show results (4000 ms = 4 seconds)
const WAIT_TIME = 4000;

// Get the elements from the HTML
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const message = document.getElementById('message');
const cardsContainer = document.getElementById('cards');

const popup = document.getElementById('popup');
const popupImage = document.getElementById('popup-image');
const popupName = document.getElementById('popup-name');
const popupDescription = document.getElementById('popup-description');
const popupExtra = document.getElementById('popup-extra');
const closeButton = document.getElementById('close-button');
const backButton = document.getElementById('back-button');
const tabs = document.querySelectorAll('.tab');

// The API returns the status in English, we show it in Spanish
const statusText = {
  Alive: 'vivo',
  Dead: 'muerto',
  unknown: 'desconocido'
};

// Ask the API for the data of the current endpoint and show it.
// name = text to search ("" shows all), wait = true adds the 4 seconds delay
async function loadData(name, wait) {
  // Show the loading message and clear the old cards
  cardsContainer.innerHTML = '';
  message.textContent = 'Cargando...';
  searchButton.disabled = true;

  // Only when searching: wait 4 seconds before loading the results
  if (wait) {
    await new Promise(function (resolve) {
      setTimeout(resolve, WAIT_TIME);
    });
  }

  try {
    // Ask the API: https://rickandmortyapi.com/api/character?name=rick
    const response = await fetch(API_URL + currentType + '?name=' + encodeURIComponent(name));

    if (response.status === 404) {
      // The API answers 404 when nothing matches
      message.textContent = 'No se encontraron resultados.';
    } else if (!response.ok) {
      message.textContent = 'Error de la API: ' + response.status;
    } else {
      const data = await response.json();
      message.textContent = '';
      showCards(data.results);
    }
  } catch (error) {
    message.textContent = 'No se pudo conectar con la API. Revisa tu internet.';
  }

  searchButton.disabled = false;
}

// When the user presses "Buscar" (or Enter): load with the 4 seconds delay
searchForm.addEventListener('submit', function (event) {
  event.preventDefault(); // do not reload the page
  loadData(searchInput.value.trim(), true);
});

// When a tab is clicked: change the endpoint and load it (no delay)
for (const tab of tabs) {
  tab.addEventListener('click', function () {
    currentType = tab.dataset.type;

    for (const other of tabs) {
      other.classList.remove('active');
    }
    tab.classList.add('active');

    searchInput.value = '';
    loadData('', false);
  });
}

// When the page opens: load the first characters right away (no delay)
loadData('', false);

// Create one card for each item (character, location or episode)
function showCards(items) {
  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'card';

    // Only the characters have an image
    if (item.image) {
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.name;
      card.appendChild(image);
    }

    const title = document.createElement('h3');
    title.textContent = item.name;
    card.appendChild(title);

    // Small text under the title (locations and episodes)
    if (currentType === 'location') {
      const subtitle = document.createElement('p');
      subtitle.textContent = item.type;
      card.appendChild(subtitle);
    } else if (currentType === 'episode') {
      const subtitle = document.createElement('p');
      subtitle.textContent = item.episode;
      card.appendChild(subtitle);
    }

    // Open the pop up when the card is clicked
    card.addEventListener('click', function () {
      openPopup(item);
    });

    cardsContainer.appendChild(card);
  }
}

// Fill the pop up with the item data and open it
function openPopup(item) {
  popupName.textContent = item.name;

  // The API has no description, so we build one with its data
  if (currentType === 'character') {
    popupImage.style.display = 'block';
    popupImage.src = item.image;
    popupImage.alt = item.name;
    popupDescription.textContent =
      item.name + ' es un personaje de especie ' + item.species +
      ', género ' + item.gender + '. ' +
      'Su estado es ' + statusText[item.status] + '. ' +
      'Su origen es ' + item.origin.name + ' y su última ubicación es ' +
      item.location.name + '. ' +
      'Aparece en ' + item.episode.length + ' episodios.';
  } else if (currentType === 'location') {
    popupImage.style.display = 'none'; // locations have no image
    popupDescription.textContent =
      item.name + ' es un lugar de tipo ' + item.type +
      ' que está en la dimensión ' + item.dimension + '. ' +
      'Tiene ' + item.residents.length + ' residentes.';
  } else {
    popupImage.style.display = 'none'; // episodes have no image
    popupDescription.textContent =
      'El episodio ' + item.episode + ' se llama "' + item.name + '". ' +
      'Se estrenó el ' + item.air_date + ' y aparecen ' +
      item.characters.length + ' personajes.';
  }

  popup.showModal();

  // Nested requests: use the URLs inside this item to ask for more data
  loadRelated(item);
}

// Ask the API for any URL and return the JSON
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('API error ' + response.status);
  }
  return response.json();
}

// Ask for several characters at once using the URLs the API gave us.
// Example urls: ".../character/1", ".../character/2"  ->  /character/1,2
async function getCharacters(urls, max) {
  if (urls.length === 0) {
    return [];
  }
  const ids = urls.slice(0, max).map(function (url) {
    return url.split('/').pop();
  });
  const data = await fetchJson(API_URL + 'character/' + ids.join(','));
  // With only one id the API returns an object instead of a list
  return Array.isArray(data) ? data : [data];
}

// Join the names of a list of characters in one text
function joinNames(characters) {
  return characters.map(function (character) {
    return character.name;
  }).join(', ');
}

// Counter to ignore old answers if the user opens another pop up quickly
let lastRequest = 0;

// Request 1 (list) -> Request 2 (URL inside the item) -> Request 3 (URL inside the answer 2)
async function loadRelated(item) {
  lastRequest++;
  const myRequest = lastRequest;

  popupExtra.innerHTML = '';
  addLine('Cargando datos relacionados...');

  const lines = [];

  try {
    if (currentType === 'character') {
      // Request 2: the character has the URL of its last location
      if (item.location.url) {
        const place = await fetchJson(item.location.url);
        lines.push('Última ubicación: ' + place.name + ' (' + place.type + ', ' + place.dimension + ')');

        // Request 3: the location has the URLs of its residents (other characters)
        const residents = await getCharacters(place.residents, 6);
        const others = residents.filter(function (character) {
          return character.id !== item.id;
        });
        if (others.length > 0) {
          lines.push('Otros residentes de ese lugar: ' + joinNames(others));
        }
      }

      // Request 2 (other branch): the character has the URLs of its episodes
      const episode = await fetchJson(item.episode[0]);
      lines.push('Primera aparición: ' + episode.episode + ' - ' + episode.name + ' (' + episode.air_date + ')');

    } else if (currentType === 'location') {
      // Request 2: the location has the URLs of its residents
      const residents = await getCharacters(item.residents, 8);
      lines.push(residents.length > 0
        ? 'Residentes: ' + joinNames(residents)
        : 'Este lugar no tiene residentes.');

    } else {
      // Request 2: the episode has the URLs of its characters
      const characters = await getCharacters(item.characters, 8);
      lines.push('Personajes: ' + joinNames(characters));
    }
  } catch (error) {
    lines.push('No se pudieron cargar los datos relacionados.');
  }

  // Show the answer only if the pop up was not changed in the meantime
  if (myRequest === lastRequest) {
    popupExtra.innerHTML = '';
    for (const line of lines) {
      addLine(line);
    }
  }
}

// Add one line to the related data list of the pop up
function addLine(text) {
  const li = document.createElement('li');
  li.textContent = text;
  popupExtra.appendChild(li);
}

// Close the pop up with the X button
closeButton.addEventListener('click', function () {
  popup.close();
});

// Close the pop up with the "Regresar" button
backButton.addEventListener('click', function () {
  popup.close();
});


