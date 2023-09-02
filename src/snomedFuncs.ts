
const test= async() => {
    
    const axios= require('axios');

    console.log("ehh");

    await axios.post(
        "http://snowstorm-test.msal.gob.ar/branches",
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
}

export {test}

