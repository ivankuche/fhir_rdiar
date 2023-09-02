const narrative= (sentInfo) => {

    let text= "<div xmlns=\"http://www.w3.org/1999/xhtml\">";
    text+= sentInfo.LocationName + " - " + sentInfo.LocationLine + ", " + sentInfo.LocationCity + ", " + sentInfo.LocationState + ", CP: " + sentInfo.LocationPostalCode;
    text+= "</div>";

    return text;
}


const LocationDataSet= (sentInfo) => {
    return {
        refes: sentInfo.LocationREFES,
        name : sentInfo.LocationName,
        address : {
            line : [sentInfo.LocationLine],
            city : sentInfo.LocationCity,
            state : sentInfo.LocationState,
            postalCode : sentInfo.LocationPostalCode
        }
    }
}

const Location= (sentInfo) => {

    const ubicacion= {
        fullUrl : "urn:uuid:" + sentInfo.LocationUUID,
        resource : {
            resourceType : "Location",
            id : sentInfo.LocationREFES,
            meta : {
                profile : ["http://fhir.msal.gob.ar/RDI/StructureDefinition/datosLugarAR"]
            },
            "text" : {
                "status" : "additional",
                "div" : narrative(sentInfo)
            },
            identifier : [
                {
                    system : "http://refes.msal.gob.ar",
                    value : sentInfo.LocationREFES
                }
            ],
            name : sentInfo.LocationName,
            address : {
                line : [sentInfo.LocationLine],
                city : sentInfo.LocationCity,
                state : sentInfo.LocationState,
                postalCode : sentInfo.LocationPostalCode
            }
        },
        request : {
            method : "PUT",
            url : "Location?identifier=http://refes.msal.gob.ar|" + sentInfo.LocationREFES
        }
    };

    return ubicacion;
}

export {Location,LocationDataSet}