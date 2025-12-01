let ids;
let currentIds = [];

let currentNews = [];
let indiceBatch = 0;

let listaPresa = false;

let titolo;
let link;
let data;

let notizia = 1;

async function recuperaListaIdNews() {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
    if (!res.ok) throw new Error('Errore nel recupero degli ID');

    ids = await res.json();
    return ids;
}

async function prendiBatch() {

    if (!listaPresa) {
        await recuperaListaIdNews();
        listaPresa = true;
    }

    currentIds = [];


    const batch = ids.slice(indiceBatch, indiceBatch + 10);


    indiceBatch += 10;


    currentIds.push(...batch);
}

async function ottieniNews(idNotizie) {
    const richieste = idNotizie.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(r => r.json())
    );

    const results = await Promise.all(richieste);
    currentNews.push(...results);
}


function getBadge(notizia) {
    switch (true) {
        case notizia >= 2 && notizia <= 3:
            return { label: "TOP STORY", classes: "card-badge" };

        case notizia >= 4 && notizia <= 6:
            return { label: "TRENDING NEW", classes: "card-badge badge-red" };

        case notizia >= 7 && notizia <= 9:
            return { label: "MOST READ", classes: "card-badge badge-blue" };

        default:
            return { label: "ARTICLE", classes: "card-badge badge-yellow" };
    }
}

async function cercaImmagine(titolo) {
    const query = encodeURIComponent(titolo);

    try {
        const res = await fetch(
            `https://white-fire-26d3.desienagaetano646.workers.dev/?q=${query}`
        );

        const data = await res.json();

        if (data.results?.length > 0) {
            const foto = data.results[0];

            return {
                url: foto.urls.regular,
                photographer: foto.user.name,
                photographerLink: foto.user.links.html,
                photoLink: foto.links.html
            };
        }
    } catch (error) {
        console.warn("Proxy Unsplash error:", error);
    }

    return {
        url: `https://picsum.photos/seed/${query}/400/250`,
        photographer: "Unknown",
        photographerLink: "#",
        photoLink: "#"
    };
}


let grid = document.querySelector(".grid");

async function creaCards() {

    const hero = document.querySelector(".hero");

    
    if (notizia === 1) {
        hero.innerHTML = `<div class="loader"></div>`;
    }

    
    await prendiBatch();
    await ottieniNews(currentIds);

    
    const imagePromises = currentNews.map(n =>
        cercaImmagine(n.title || "Untitled Article")
    );

    
    const images = await Promise.all(imagePromises);

    
    for (let i = 0; i < currentNews.length; i++) {

        const j = currentNews[i];
        const imageObj = images[i];

        const titolo = j.title || "Untitled Article";
        const link = j.url || "#";
        const data = new Date(j.time * 1000);

        const formattedDate = data.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

        
        if (notizia === 1) {

            hero.innerHTML = `
                <div class="hero-media">
                    <img src="${imageObj.url}" alt="">
                    <div class="hero-overlay"></div>
                    <span class="hero-badge">TOP STORY</span>
                </div>

                <div class="hero-content">
                    <h1 class="hero-title">N°${notizia}, ${titolo}</h1>
                    <p class="hero-date">${formattedDate}</p>
                    <a href="${link}" target="_blank" class="btn hero-btn">Read Full Story</a>

                    <p class="photo-credit">
                        Photo by
                        <a href="${imageObj.photographerLink}" target="_blank">
                            ${imageObj.photographer}
                        </a>
                        on
                        <a href="${imageObj.photoLink}" target="_blank">Unsplash</a>
                    </p>
                </div>
            `;

        } else {
            
            const { label, classes } = getBadge(notizia);

            const card = document.createElement("article");
            card.classList.add("card");

            card.innerHTML = `
                <div class="card-thumb">
                    <img src="${imageObj.url}" alt="">
                </div>

                <span class="${classes}">${label}</span>
                <h3 class="card-title">N°${notizia}, ${titolo}</h3>
                <p class="card-date">${formattedDate}</p>

                <a href="${link}" target="_blank" class="card-more">Read more</a>

                <p class="photo-credit">
                    Photo by
                    <a href="${imageObj.photographerLink}" target="_blank">
                        ${imageObj.photographer}
                    </a>
                    on
                    <a href="${imageObj.photoLink}" target="_blank">Unsplash</a>
                </p>
            `;

            grid.append(card);
        }

        notizia++;
    }

    
    currentNews = [];
}





function caricaDiPiù() {

    const caricaBtn = document.querySelector(".load-more-btn");

    caricaBtn.addEventListener("click", async () => {


        caricaBtn.disabled = true;
        caricaBtn.innerHTML = `<div class="loader-small"></div>`;

        await creaCards();


        caricaBtn.disabled = false;
        caricaBtn.textContent = "LOAD MORE";
    });
}

const searchBtn = document.querySelector(".search-btn");

function cercaNotizie() {


    const query = document.querySelector(".search-input").value.trim().toLowerCase();
    const cards = document.querySelectorAll(".grid .card");


    if (query === "") {
        cards.forEach(card => {
            card.style.display = "flex";
        });
        return;
    }


    cards.forEach(card => {

        const title = card.querySelector(".card-title")?.textContent.toLowerCase() || "";


        if (title.includes(query)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

searchBtn.addEventListener("click", cercaNotizie);

document.querySelector(".search-input")
  .addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
          cercaNotizie();
      }
  });



function main() {

    currentNews = [];

    creaCards();

    caricaDiPiù();
}

main();







