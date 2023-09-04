const narrative= (sentInfo) => {

    let text= "<div xmlns=\"http://www.w3.org/1999/xhtml\">";

    text+= sentInfo.PatientSurnames + ", " + sentInfo.PatientNames + ". DNI: " + sentInfo.PatientDNI
    text+= "</div>";

    return text;
}

const PatientDataSet= (sentInfo) => {
    return {
        id : sentInfo.PatientID,
        dni : sentInfo.PatientDNI,
        system: sentInfo.SystemHCE,
        surname: sentInfo.PatientSurnames,
        name: sentInfo.PatientNames,
        gender: sentInfo.PatientGender,
        birthDate: sentInfo.PatientBirthdate,
    }
}

const Patient= (sentInfo) => {
    const moment= require('moment')

    let paciente= {
        fullUrl : "urn:uuid:" + sentInfo.PatientUUID,
        resource : {
            resourceType : "Patient",
            id : sentInfo.PatientID,
            meta : {
                profile : ["http://fhir.msal.gob.ar/RDI/StructureDefinition/datosPacienteAR"]
            },
            text : {
                status : "additional",
                div : narrative(sentInfo)
            },
            identifier : [
                {
                    use : "official",
                    system : "http://www.renaper.gob.ar/dni",
                    value : sentInfo.PatientDNI
                }
            ],
            name : [
                {
                    text : sentInfo.PatientSurnames + ", " + sentInfo.PatientNames,
                    family : sentInfo.PatientSurnames,
                    _family : {
                        extension : [
                            {
                                url : "http://hl7.org/fhir/StructureDefinition/humanname-fathers-family",
                                valueString : sentInfo.PatientSurnames.split(' ')[0]
                            }
                        ]
                    },
                    given : sentInfo.PatientNames.split(' '),
                }
            ],
            gender : sentInfo.PatientGender,
            birthDate : moment(sentInfo.PatientBirthdate, 'DD/MM/YYYY').format('YYYY-MM-DD')
        },
        request : {
            method : "PUT",
            url : "Patient?identifier=http://www.renaper.gob.ar/dni|" + sentInfo.PatientDNI
        }
    };


    if ((sentInfo.SystemHCE) && (sentInfo.PatientID))
        paciente.resource.identifier.push(
            {
                use : "secondary",
                system : sentInfo.SystemHCE,
                value : sentInfo.PatientID
            }
        );

    return paciente;
}

export {Patient,PatientDataSet}