import { outputMessage } from "./helpers";

// Settings
require('dotenv').config()
const express = require('express')
const bodyParser= require('body-parser')
const app = express()
// Deshabilitamos CORS
const cors = require('cors')

// Todos pueden acceder a express
app.use(cors({
  origin: '*'
}));

// Usamos body-parser para obtener contenidos enviados
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Definimos el path estatico para express (para servir los assets)
app.use(express.static('public'))
// Levantamos el servidor
app.listen(process.env.SERVER_PORT, () => {
  console.log('Server listening on http://localhost:' + process.env.SERVER_PORT)
})

/// Ruta inicial
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const JSON2SELECTJS= (json,term?) => {

  let opcionesFiltradas;
  // Filtramos el JSON usando el texto provisto
  if (term)
    opcionesFiltradas = json.filter(item =>
      item.name.toLowerCase().includes(term)
    );
  else
    opcionesFiltradas= json;

  // Cambiamos el formato a lo que espera Select2
  const mapeoSelect2 = opcionesFiltradas.map(item => ({
    id: item.id,
    text: item.name,
    system: item?.system
  }));

  return mapeoSelect2;
}

// Listado de Obras Sociales y Prepagas
app.get('/coberturas', (req, res) => {

  const jsonData= require('./data/coberturas.json')
  const textoBuscado = req.query.term.toLowerCase();

  res.json({results:JSON2SELECTJS(jsonData,textoBuscado)});
});

// Listado de Planes
app.get('/planes', (req, res) => {

  const jsonData= require('./data/planes.json')
  const textoBuscado = req.query.term.toLowerCase();

  res.json({results:JSON2SELECTJS(jsonData,textoBuscado)});
});

// Listado de Sexos biologicos
app.get('/sexos', (req, res) => {

  const jsonData= require('./data/sexos.json')

  res.json({results:JSON2SELECTJS(jsonData)});
});

// Listado de medicaciones
app.get('/medicaciones', async (req, res) => {

  let medicaciones= require('./data/medicaciones_comerciales.json')

  if (req.query.medicationType=="g")
    medicaciones= require('./data/medicaciones_genericas.json')

    const textoBuscado = req.query.term.toLowerCase();
    res.json({results:JSON2SELECTJS(medicaciones,textoBuscado)});
});

// Listado de motivos de la prescripcion
app.get('/motivos_medicacion', async (req, res) => {

  const motivosMedicacion= require('./data/motivos_medicacion.json')

    const textoBuscado = req.query.term.toLowerCase();
    res.json({results:JSON2SELECTJS(motivosMedicacion,textoBuscado)});
});

// Listado de Unidades de tiempo
app.get('/unidades_tiempo', (req, res) => {

  const jsonData= require('./data/unidades_tiempo.json')

  res.json({results:JSON2SELECTJS(jsonData)});
});


app.post('/generarReceta',async (req, res) => {

  // Cargamos las funciones de cada recurso
  const {recetaFHIR}= require('./FHIR/Receta');
  const {MedicationRequest}= require('./FHIR/MedicationRequest');
  const {Patient}= require('./FHIR/Patient');
  const {Coverage}= require('./FHIR/Coverage');
  const {Practitioner}= require('./FHIR/Practitioner');
  const {Location}= require('./FHIR/Location');

  // Transformamos el request en JSON
  const sentValues= JSON.parse(JSON.stringify(req.body)); 

  // Generacion de los UUID
  const {v5} = require('uuid');

  const {PatientDataSet}= require('./FHIR/Patient');
  const {CoverageDataSet}= require('./FHIR/Coverage');
  const {PractitionerDataSet}= require('./FHIR/Practitioner');
  const {LocationDataSet}= require('./FHIR/Location');

  sentValues.PatientUUID= v5(Object.entries(PatientDataSet(sentValues)),process.env.NAMESPACE_UUID);
  sentValues.CoveraegeUUID= v5(Object.entries(CoverageDataSet(sentValues)),process.env.NAMESPACE_UUID);
  sentValues.PractitionerUUID= v5(Object.entries(PractitionerDataSet(sentValues)),process.env.NAMESPACE_UUID);
  sentValues.LocationUUID= v5(Object.entries(LocationDataSet(sentValues)),process.env.NAMESPACE_UUID);

  // UUIDs al azar: grupo de medicamentos y bundle
  const crypto = require('crypto');
  const BundleID= crypto.randomUUID();
  sentValues.MedicationGroupUUID= crypto.randomUUID();

  const medications= Object.entries(sentValues).filter((item)=> {
    if (item[0]=='Medication[]')
      return true;
  })

  let medicationRequestedList= [];

  // Si hay 1 sola medicacion la transformamos en array
  if (typeof medications[0][1]=="string")
    medications[0][1]= Array(medications[0][1]);

  Object.values(medications[0][1]).forEach(element => {
    element= JSON.parse(element);
    element.medicationRequestUUID= crypto.randomUUID();
    element.medicationUUID= crypto.randomUUID();

    medicationRequestedList.push(MedicationRequest(sentValues,element));
  });

  // Persistencia de los recursos enviados
  const rs= require('rocket-store');
  const path = require('path');

  await rs.options({
    data_storage_area : path.join(__dirname,path.sep,'data',path.sep,'storage'),
    data_format       : rs._FORMAT_JSON,
  });

  const PatientFHIR= Patient(sentValues);
  let resultadoRS= await rs.post("pacientes",sentValues.PatientUUID,PatientFHIR);

  const CoverageFHIR= Coverage(sentValues);
  resultadoRS= await rs.post("coberturas",sentValues.CoveraegeUUID,CoverageFHIR);

  const PractitionerFHIR= Practitioner(sentValues);
  resultadoRS= await rs.post("profesionales",sentValues.PractitionerUUID,PractitionerFHIR);

  const LocationFHIR= Location(sentValues);
  resultadoRS= await rs.post("establecimientos",sentValues.LocationUUID ,LocationFHIR);


  const RecetaFHIR= recetaFHIR(
    BundleID,
    medicationRequestedList,
    PatientFHIR,
    CoverageFHIR,
    PractitionerFHIR,
    LocationFHIR
  );

  console.log(RecetaFHIR);

  resultadoRS= await rs.post("recetas",BundleID ,RecetaFHIR);

  res.send(RecetaFHIR);

});

// Validación de receta
app.post('/validarReceta',async (req, res) => {


  const axios = require('axios');
  const request = require('request')
  
  axios.post(
    process.env.RDIAR_SERVER + "/Bundle/$validate",
    req.body,
    {
      "Content-type": "application/json"
    }
  ).then(respuesta => {
    res.send(JSON.stringify(respuesta.data));
  }).catch(e => {
    res.status(e.response.status).send(e.response.data.text.div);
  });
});

app.post('/enviarReceta',async (req, res) => {


  const axios = require('axios');
  const request = require('request')
  
  axios.post(
    process.env.RDIAR_SERVER,// + "/Bundle/$validate",
    req.body,
    {
      "Content-type": "application/json"
    }
  ).then(respuesta => {
    res.send(JSON.stringify(respuesta.data));
  }).catch(e => {
    res.status(e.response.status).send(e.response.data.text.div);
  });
  

//  console.log(JSON.parse(JSON.stringify(req.body)));
//  res.send("po");
//  outputMessage(null,Object(req.body).resourceType);
  /*
  const bundle=  JSON.parse(req.body);

  outputMessage(null,bundle);

  console.log(bundle.resourceType);
*/
//  console.log(bundle[0]);
  /*
  // Prueba del bundle
  const {recetaFHIR}= require('./FHIR/Receta');
  const {MedicationRequest}= require('./FHIR/MedicationRequest');
  const {Patient}= require('./FHIR/Patient');
  const {Coverage}= require('./FHIR/Coverage');
  const {Practitioner}= require('./FHIR/Practitioner');
  const {Location}= require('./FHIR/Location');

//  outputMessage("Carlo",req.body);

  const sentValues= JSON.parse(JSON.stringify(req.body)); 

  // PatientUUID generation
  const crypto = require('crypto');
  sentValues.PatientUUID= crypto.randomUUID();
  sentValues.CoveraegeUUID= crypto.randomUUID();
  sentValues.PractitionerUUID= crypto.randomUUID();
  sentValues.LocationUUID= crypto.randomUUID();
  sentValues.MedicationGroupUUID= crypto.randomUUID();

  const medications= Object.entries(sentValues).filter((item)=> {
    if (item[0]=='Medication[]')
      return true;
  })

  let medicationRequestedList= [];

  // Si hay 1 sola medicacion la transformamos en array
  if (typeof medications[0][1]=="string")
    medications[0][1]= Array(medications[0][1]);

  Object.values(medications[0][1]).forEach(element => {
    element= JSON.parse(element);
    element.medicationRequestUUID= crypto.randomUUID();
    element.medicationUUID= crypto.randomUUID();

    medicationRequestedList.push(MedicationRequest(sentValues,element));

    console.log("medik");
  });


  res.send(recetaFHIR(
    medicationRequestedList,
    Patient(sentValues),
    Coverage(sentValues),
    Practitioner(sentValues),
    Location(sentValues)
  ));

  */

//  await new Promise(resolve => setTimeout(()=>{res.send("SIII");}, 1000));  

});
  
/*
const {test}= require('./snomedFuncs')

const testSNOMED= async ()=> {

  await test();

  return "capo";
}

testSNOMED();
/*



const axios = require('axios');
const request = require('request')


axios.post(
  "snowstorm-test.msal.gob.ar",
  {},
  {
    "Content-type": "application/json"
  }
).then(datos => {
  console.log("per")
  console.log(datos)
}).catch(e => {
  console.error(e)
});



process.exit(0)






import { OAuthConfig } from './oAuthConfig';

const authUrl = `${OAuthConfig.authorizationUrl}?client_id=${OAuthConfig.clientId}&redirect_uri=${OAuthConfig.redirectUri}&response_type=code`;
console.log(authUrl)
axios.get(authUrl).then(resp => {
  console.log(resp)
})

axios.get('https://authorization-server.com/authorize?response_type=code&client_id=kmLY0aeXCqsHYBSTXTYpX0ko&redirect_uri=https://www.oauth.com/playground/authorization-code.html&scope=photo+offline_access&state=jHkG_qcgq1dkci79').then(resp => {
  console.log("cpao");
  console.log(OAuthConfig);
  //    console.log(resp.data);

  /*
  var xml = fhir.objToXml(resp.data);
  console.log(xml.id);
  /*
  var json = fhir.xmlToJson(xml);
  var obj = fhir.xmlToObj(xml);
  console.log(obj);
  console.log(obj.id);
  /*
  var results = fhir.validate(xml, { errorOnUnexpected: true });
  results = fhir.validate(obj, {});
  fhir.generateSnapshot(SnapshotGenerator.createBundle(sd1, sd2, sd3));

  CERRAR ACA EL COMMENT
});


app.get('/login', (req, res) => {

  const authEndpoint = process.env.AUTH_ENDPOINT;

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI
  })


  const authUrl = `${authEndpoint}?${queryParams}`

  console.log(authUrl)

  res.redirect(authUrl)
})

app.get('/callback', async (req, res) => {
  const tokenEndpoint = 'https://oauth2-provider.com/token'

  const { code } = req.query

  const requestBody = {
    grant_type: 'authorization_code',
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI
  }

  const options = {
    method: 'POST',
    uri: tokenEndpoint,
    form: requestBody,
    json: true
  }

  try {
    const response = await request(options)

    req.session.accessToken = response.access_token
    req.session.refreshToken = response.refresh_token

    res.redirect('/user')

  } catch (err) {
    res.send('Error retrieving access token')
  }
});

app.get('/user', async (req, res) => {
  const userEndpoint = 'https://oauth2-provider.com/userinfo'

  /*
  const options = {
    headers: {
      Authorization: Bearer ${ reqa.session.accessToken }
},
  json: true
}

try {
  const response = await request.get(userEndpoint, options)
  res.send(response)
} catch (err) {
  res.send('Error retrieving user info')
}

CERRAR ACA EL COMMENT
})

/*


import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
*/