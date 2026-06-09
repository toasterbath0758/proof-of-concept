console.log('Hier komt je server voor Sprint 12.')
import express from 'express'

import { Liquid } from 'liquidjs';

const app = express()

app.use(express.urlencoded({ extended: true }))

app.use(express.static('public'))

const engine = new Liquid();
app.engine('liquid', engine.express());

app.set('views', './views')


// load de home
app.get('/', async function (request, response) {
// Haal de data uit de directus API 
   let URLgolfers = 'https://fdnd-agency.directus.app/items/into_golf_golfers'
   let URLrondes = 'https://fdnd-agency.directus.app/items/into_golf_rounds'

   if(request.query.sort!==undefined){
      URLgolfers = URLgolfers+"?sort="+request.query.sort
   }

   if(request.query.filter!==undefined) {
      URLrondes = URLrondes+"?filter="+request.query.filter
   }

   const golferResponse = await fetch(URLgolfers)
   const rondesResponse = await fetch(URLrondes)

   // En haal daarvan de JSON op
   const golferResponseJSON = await golferResponse.json()
   const rondesResponseJSON = await rondesResponse.json()

   response.render('index.liquid', { golfers: golferResponseJSON.data, rondes: rondesResponseJSON.data }) 
    console.log(request.query, rondesResponseJSON.data)
})


// // load de home
// app.get('/', async function (request, response) {
// // Haal de data uit de directus API op
//       const handicapResponse = await fetch(`/items/into_golf_rounds?sort=handicap`)
//    // En haal daarvan de JSON op
//    const golferResponseJSON = await rondesResponse.json()
//    response.render('index.liquid', { handicaps: golferResponseJSON.data }) 
    
// })
// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000, als dit ergens gehost wordt, is het waarschijnlijk poort 80
app.set('port', process.env.PORT || 8000)

// Start Express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
   // Toon een bericht in de console en geef het poortnummer door
   console.log(`Application started on http://localhost:${app.get('port')}`)
})

