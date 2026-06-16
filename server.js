import express from 'express'

import { Liquid } from 'liquidjs';

const app = express()

app.use(express.urlencoded({ extended: true }))

app.use(express.static('public'))

const engine = new Liquid();
app.engine('liquid', engine.express());

app.set('views', './views')




app.get('/', async function (request, response) {
  const apiResponse = await fetch('https://fdnd-agency.directus.app/items/into_golf_golfers')
  const apiData = await apiResponse.json()
    // Handicap afronden
  const golfers = apiData.data.map(golfer => ({
    ...golfer,
    handicap: parseFloat(golfer.handicap).toFixed(1)
  }))


  console.log(golfers[0].handicap)
  response.render('index.liquid', { golfers: golfers })
 
})

app.get('/golfer/:id', async function (request, response) {
  const id = request.params.id

// http://items/into_golf_rounds?filter[golfer_id][_eq]=1&sort=-date&limit=5

  try {
    // fetch 1 - de golfer
    const golferResponse = await fetch(`https://fdnd-agency.directus.app/items/into_golf_golfers`)
    const golferData = await golferResponse.json()

    // fetch 2 rondes
    const rondesResponse = await fetch(`https://fdnd-agency.directus.app/items/into_golf_rounds`)
    const rondesData = await rondesResponse.json()


    // fetch 3 - handicap geschiedenis
    const handicapResponse = await fetch(`https://fdnd-agency.directus.app/items/into_golf_handicap_history`)
    const handicapData = await handicapResponse.json()


    // fetch 4 - milestones
    const milestonesResponse = await fetch(`https://fdnd-agency.directus.app/items/into_golf_milestones`)
    const milestonesData = await milestonesResponse.json()


    // fetch 5 - ranking
    const rankingResponse = await fetch(`https://fdnd-agency.directus.app/items/into_golf_monthly_ranking`)
    const rankingData = await rankingResponse.json()


    // ranking JSON parsen naar een array
    const ranking = rankingData.data.map(item => ({
      ...item,
      rankings: JSON.parse(item.rankings)
    }))


    const status = request.query.status
    console.log('status:', status)


    response.render('golfer.liquid', { 
      activeGolfer: request.params.id,
      golfers: golferData.data,
      rondes: rondesData.data,
      history: handicapData.data,
      milestones: milestonesData.data,
      ranking: ranking
    })


  } catch (error) {
    response.status(500).render('error.liquid', {
      statusCode: 500,
      message: 'Kon de data niet ophalen, probeer het later opnieuw.'
    })
  }
})


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
// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000, als dit ergens gehost wordt, is het waarschijnlijk poort 80
app.set('port', process.env.PORT || 8000)

// Start Express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
   // Toon een bericht in de console en geef het poortnummer door
   console.log(`Application started on http://localhost:${app.get('port')}`)
})

