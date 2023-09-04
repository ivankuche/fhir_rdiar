const narrative= (sentInfo) => {

    let text= "<div xmlns=\"http://www.w3.org/1999/xhtml\">";
    text+= sentInfo.PractitionerName + " - DNI: " + sentInfo.PractitionerDNI + " - MATRICULA: " + sentInfo.PractitionerNPI;
    text+= "</div>";

    return text;
}


const PractitionerDataSet= (sentInfo) => {

    return {
        id : sentInfo.PractitionerNPI,
        dni : sentInfo.PractitionerDNI,
        name : sentInfo.PractitionerName,
        telecom: sentInfo.PractitionerTelecom
    }
}



const Practitioner= (sentInfo) => {

    let profesional= {
        fullUrl : "urn:uuid:" + sentInfo.PractitionerUUID,
        resource : {
            resourceType : "Practitioner",
            id : sentInfo.PractitionerNPI,
            meta : {
                profile : ["http://fhir.msal.gob.ar/RDI/StructureDefinition/datosPrescriptorAR"]
            },
            text : {
                status : "additional",
                div : narrative(sentInfo),
            },
            identifier : [
                {
                    use : "usual",
                    system : "https://sisa.msal.gov.ar/REFEPS",
                    value : sentInfo.PractitionerNPI
                }
            ],
            name : [
                {
                    text : sentInfo.PractitionerName
                }
            ]
        },
        request : {
            method : "PUT",
            url : "Practitioner?identifier=https://sisa.msal.gov.ar/REFEPS|" + sentInfo.PractitionerNPI
        }
    };

    if (sentInfo.PractitionerDNI)
        profesional.resource.identifier.push(
            {
                use : "official",
                system : "http://www.renaper.gob.ar/dni",
                value : sentInfo.PractitionerDNI
            }
    );

    if (sentInfo.PractitionerTelecom)
    {
        profesional.resource['telecom']= [{
            system: "phone",
            value: sentInfo.PractitionerTelecom
        }];
    }

    return profesional;
}

export {Practitioner,PractitionerDataSet}