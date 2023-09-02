const narrative= (narrativeText) => {

    let text= "<div xmlns=\"http://www.w3.org/1999/xhtml\">";
    text+= narrativeText;// + " - DNI: " + sentInfo.PractitionerDNI + " - MATRICULA: " + sentInfo.PractitionerNPI;
    text+= "</div>";

    return text;
}
    /*
    Medicamento: ibuprofeno 400 mg por cada comprimido para administración oral</div>"
      */

const MedicationRequest= (sentInfo,medication) => {

    let medicacion= {
        fullUrl : "urn:uuid:" + medication.medicationRequestUUID,
        resource : {
            resourceType : "MedicationRequest",
            id : "Prescripcion-" + medication.medicationUUID,
            meta : {
                profile : ["http://fhir.msal.gob.ar/RDI/StructureDefinition/datosPrescripcionAR"]
            },
            text : {
                status : "additional",
                div : narrative(medication.narrative),
            },
            identifier : [
                {
                    system : sentInfo.SystemPrescriptor,
                    value : medication.medicationUUID,
                }
            ],
            status : "active",
            intent : "order",
            medicationCodeableConcept : {
                coding : [
                    {
                        system : medication.systemGeneric,
                        code : medication.idGeneric,
                        display : medication.nameGeneric
                    }
                ]
            },
            subject : {
                reference : "urn:uuid:" + sentInfo.PatientUUID,
                display : sentInfo.PatientSurnames + ", " + sentInfo.PatientNames
            },
            supportingInformation : [
                {
                    reference : "urn:uuid:" + sentInfo.LocationUUID,
                }
            ],
            authoredOn : new Date(),
            requester : {
                reference : "urn:uuid:" + sentInfo.PractitionerUUID,
                display : sentInfo.PractitionerName
            },
            reasonCode : [
                {
                    coding : [
                        {
                            system : medication.reasonSystem,
                            code : medication.reasonID,
                            display : medication.reasonName
                        }
                    ]
                }
            ],
            groupIdentifier : {
                system : sentInfo.SystemRepository,
                value : sentInfo.MedicationGroupUUID
            },
            insurance : [
                {
                    reference : "urn:uuid:" + sentInfo.CoveraegeUUID
                }   
            ],
            dosageInstruction : [
                {
                    text : medication.dosage,
                    timing : {
                        repeat : {
                            duration : parseInt(medication.duration),
                            durationMax : parseInt(medication.maximumDuration),
                            durationUnit : medication.durationUnit,
                            frequency : parseInt(medication.frequency),
                            period : parseInt(medication.period),
                            periodUnit : medication.frequencyUnit
                        }
                    }
                }
            ],
            dispenseRequest : {
                validityPeriod : {
                    start : new Date()
                },
                quantity : {
                    value : parseInt(medication.amount)
                }
            }
        },
        request : {
            method : "PUT",
            url : "MedicationRequest?identifier=" + medication.medicationUUID
        }
    };

    if (medication.idCommercial)
    {
        medicacion.resource.medicationCodeableConcept.coding.push({
            system : medication.systemCommercial,
            code : medication.idCommercial,
            display : medication.nameCommercial
        })
    }

    return medicacion;
}

export {MedicationRequest}