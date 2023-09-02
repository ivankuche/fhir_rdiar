const narrative= (sentInfo) => {

    let text= "<div xmlns=\"http://www.w3.org/1999/xhtml\">";
    text+= sentInfo.CoverageName + " - " + sentInfo.CoveragePlanName + " - " + sentInfo.CoverageBeneficiaryID;
    text+= "</div>";

    return text;
}

const CoverageDataSet= (sentInfo) => {
    return {
        id : sentInfo.CoverageID,
        beneficiary : sentInfo.PatientUUID,
        plan: sentInfo.CoveragePlan,
        number: sentInfo.CoverageBeneficiaryID
    }
}


const Coverage= (sentInfo) => {

    const cobertura= {
        fullUrl : "urn:uuid:" + sentInfo.CoveraegeUUID,
        resource : {
            resourceType : "Coverage",
            id : sentInfo.CoverageID,
            meta : {
                profile : ["http://fhir.msal.gob.ar/RDI/StructureDefinition/datosCoberturaAR"]
            },
            text : {
                status : "additional",
                div : narrative(sentInfo),
            },
            identifier : [
                {
                    system : "http://ssalud.gob.ar/coberturas-" + sentInfo.CoverageID + "-carnet",
                    value : sentInfo.CoverageBeneficiaryID.replace('/','-')
                }
            ],
            status : "active",
            beneficiary : {
                reference : "urn:uuid:" + sentInfo.PatientUUID,
            },
            payor : [
                {
                    identifier : {
                        system : "http://ssalud.gob.ar/coberturas",
                        value : sentInfo.CoverageID
                    },
                    display : sentInfo.CoverageName
                }
            ],
            class : [
                {
                    type : {
                        coding : [
                            {
                                system : "http://terminology.hl7.org/CodeSystem/coverage-class",
                                code : "plan",
                                display : "Plan"
                            }
                        ]
                    },
                    value : sentInfo.CoveragePlan,
                    name : sentInfo.CoveragePlanName
                }
            ]
        },
        request : {
            method : "PUT",
            url : "Coverage?identifier=http://ssalud.gob.ar/coberturas/" + sentInfo.CoverageID + "/carnet|" + sentInfo.CoverageBeneficiaryID
        }
    };

    return cobertura;
}

export {Coverage,CoverageDataSet}