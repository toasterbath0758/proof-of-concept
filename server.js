import express from "express";

import { Liquid } from "liquidjs";

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

const engine = new Liquid();
app.engine("liquid", engine.express());

app.set("views", "./views");

app.get("/", async function (request, response) {
  const apiResponse = await fetch(
    "https://fdnd-agency.directus.app/items/into_golf_golfers",
  );
  const apiData = await apiResponse.json();
  // Handicap afronden
  const golfers = apiData.data.map((golfer) => ({
    ...golfer,
    handicap: parseFloat(golfer.handicap).toFixed(1),
  }));

  console.log(golfers[0].handicap);
  response.render("index.liquid", { golfers: golfers });
});

// functie maandrankings route + sort
app.get("/golfer/:id", async function (request, response) {
  // http://items/into_golf_rounds?filter[golfer_id][_eq]=1&sort=-date&limit=5

  try {
    let URLgolfers = "https://fdnd-agency.directus.app/items/into_golf_golfers"; // [1, 2, 3, 4] ?sort=-nummer -> [4, 3, 2, 1]
    let URLrondes = "https://fdnd-agency.directus.app/items/into_golf_rounds"; // [A, B, C, D]

    // https://fdnd-agency.directus.app/items/into_golf_rounds?filter[golfer_id][_eq]=1&sort=-date&limit=5

    // [[A,B,C,D], [1,2,3,4]] -> [[A,B,C,D], [4, 3, 2, 1]]
    // We halen alle data op en we voegen de data samen op basis van het unieke id van een golfer
    // positie 1 hoort bij 1 in de andere set enzo voorts
    // golfer [A, 1] golfer 2 [B, 2] golfer 3 [C, 3] golfer 4 [D, 4] -> golfer 1 [A, 4]
    if (
      // Als de query parameter sort bestaat dan vangen die hier af en zetten we hem door naar de api
      // Maar als de query parameter "?sort=aantalRondes" is dan moeten we die NIET doorzetten, hier deze vangen we later
      // op een andere manier af
      // ergo zet de sort uit als je moet sorteren op aantalRondes^^^ <- 🤓
      request.query.sort !== undefined &&
      request.query.sort !== "aantalRondes"
    ) {
      URLgolfers = URLgolfers + "?sort=" + request.query.sort;
    }

    // fetch 1 - de golfer
    const golferResponse = await fetch(URLgolfers);
    const golferData = await golferResponse.json();

    // fetch 2 rondes
    const rondesResponse = await fetch(URLrondes);
    const rondesData = await rondesResponse.json();

    // golfersMetRondesObject is het object waar we de sets gaan "samenvoegen"
    // golfer.id wijst naar een nummer en wordt de key per golfer value in het nieuwe object
    // {["2" (golfer.id)]: {id: 2, aantalRondes: 0, name: Karrie webdevelopr, handicap:...}(gehele golfer object met nieuwe aantalrondes property in golfersMetRondesObject) }
    // aantalRondes is een nieuwe property om de hoeveelheid gevonden rondes (per golfer) in op te slaan
    const golfersMetRondesObject = {};

    // Per golfer voegen we een nieuwe key toe aan het object hierboven en voegen we een nieuwe aantalRondes property toe.
    for (const golfer of golferData.data) {
      golfersMetRondesObject[golfer.id] = golfer;
      // {
      // ["2"]: golfer // {id: 2,name: Karrie webdevelopr, handicap:...}
      // }
      golfersMetRondesObject[golfer.id].aantalRondes = 0;
      // {
      // ["2"]: golfer // {id: 2, aantalRondes: 0, name: Karrie webdevelopr, handicap:...}
      // }
    }

    for (const ronde of rondesData.data) {
      // als het golfer_id bestaat in het golfersMetRondesObject object dan tel je er 1 bij aantalRondes op (zie regel 79)
      if (ronde.golfer_id in golfersMetRondesObject) {
        // {
        // ["2"]: golfer // {id: 2, aantalRondes: 0, name: Karrie webdevelopr, handicap:...}
        // }
        golfersMetRondesObject[ronde.golfer_id].aantalRondes =
          golfersMetRondesObject[ronde.golfer_id].aantalRondes + 1;
        // {
        // ["2"]: golfer // {id: 2, aantalRondes: 1, name: Karrie webdevelopr, handicap:...}
        // }
      }
    }

    // Om te sorteren en voor de frontend maken we er weer een lijst van
    // we hebben nu nog een lege lijst
    // {[key1]: value1, [key2]: value2}
    // ["a", "b", "c"] || [{[key1]: value1}, {[key1]: value2}]
    //
    // je loopt door de originele lijst van de api heen => vervolgens in de juiste volgorde zoeken we per golfer id het juiste (golfersMetRondesObject)object op =>
    const golfersMetRondesLijst = golferData.data.map((golfer) => {
      const golferMetRondes = golfersMetRondesObject[golfer.id];
      // vervolgens maakt het een nieuwe lijst met die juiste volgorde.
      return golferMetRondes;
    });

    if (request.query.sort === "aantalRondes") {
      // [golfer1, golfer2, golfer3, golfer4]
      // golferA = golfer1, golferB = golfer2
      // // javascript ingebouwde sorteer, checkt 2 items in een array en sorteert op basis van
      golfersMetRondesLijst.sort((golferA, golferB) => {
        if (golferA.aantalRondes > golferB.aantalRondes) return -1;
        if (golferA.aantalRondes < golferB.aantalRondes) return 1;
        return 0;
      });
    }

    //////////////////////////////
    // einde functie maandrankings route + sort

    // fetch 3 - handicap geschiedenis
    const handicapResponse = await fetch(
      `https://fdnd-agency.directus.app/items/into_golf_handicap_history`,
    );
    const handicapData = await handicapResponse.json();

    // fetch 4 - milestones
    const milestonesResponse = await fetch(
      `https://fdnd-agency.directus.app/items/into_golf_milestones`,
    );
    const milestonesData = await milestonesResponse.json();

    // fetch 5 - ranking
    const rankingResponse = await fetch(
      `https://fdnd-agency.directus.app/items/into_golf_monthly_ranking`,
    );
    const rankingData = await rankingResponse.json();

    // ranking JSON parsen naar een array
    const ranking = rankingData.data.map((item) => ({
      ...item,
      rankings: JSON.parse(item.rankings),
    }));

    // console.log("query:", request.query.sort, URLgolfers);
    // const a = golferData.data.map(({ id }) => id);
    // const b = golfersMetRondesLijst.map(({ id }) => id);
    // console.log("data volgorde", a, b, JSON.stringify(a) === JSON.stringify(b));

    response.render("golfer.liquid", {
      activeGolfer: Number(request.params.id),
      activeSort: request.query.sort,
      golfers: golfersMetRondesLijst,
      rondes: rondesData.data,
      history: handicapData.data,
      milestones: milestonesData.data,
      ranking: ranking,
    });
  } catch (error) {
    response.status(500).render("error.liquid", {
      statusCode: 500,
      message: "Kon de data niet ophalen, probeer het later opnieuw.",
    });
  }
});

// // load de data voor de maandelijkse rankings
// app.get('/golfer/:id', async function (request, response) {
// // Haal de data uit de directus API
//    let URLgolfers = 'https://fdnd-agency.directus.app/items/into_golf_golfers'
//    let URLrondes = 'https://fdnd-agency.directus.app/items/into_golf_rounds'

//    if(request.query.sort!==undefined){
//       URLgolfers = URLgolfers+"?sort="+request.query.sort
//    }

//    console.log(request.params.id)

//    if(request.query.filter!==undefined) {
//       URLrondes = URLrondes+"?filter="+request.query.filter
//    }

//    //    if(request.query.sort!==undefined) {
//    //    URLrondes = URLrondes+"?sort="+request.query.sort
//    // }
//    // data van rondes word niet gesorteerd... ik heb het al gezet van filter naar sort, hoezo werkt dit niet?
//    // het lijkt alleen gesorteerd te worden op name?? navragen!
//    // in iedergeval word er iets geladen...

//    const golferResponse = await fetch(URLgolfers)
//    const rondesResponse = await fetch(URLrondes)

//    // En haal daarvan de JSON op
//    const golferResponseJSON = await golferResponse.json()
//    const rondesResponseJSON = await rondesResponse.json()

//    response.render('golfer.liquid', { golfers: golferResponseJSON.data, rondes: rondesResponseJSON.data })
//     console.log(request.query, rondesResponseJSON.data)
// })

/////////////////////////////////////////////////
// POST + DELETE GEDEELTE

// POST RECENTE RONDES
app.post('/golfer/:id/score', async function (req, res){
  const id = req.params.id


  try {
    await fetch('https://fdnd-agency.directus.app/items/into_golf_rounds', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        golfer_id: id,
        date: req.body.date,
        course: req.body.course,
        differential: req.body.differential,
        type: req.body.type
      })
    })
    res.redirect(303, `/golfer/${id}?status=success`)
  } catch (error) {
    res.redirect(303, `/golfer/${id}?status=error`)
  }
})



// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000, als dit ergens gehost wordt, is het waarschijnlijk poort 80
app.set("port", process.env.PORT || 8000);

// Start Express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get("port"), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get("port")}`);
});
