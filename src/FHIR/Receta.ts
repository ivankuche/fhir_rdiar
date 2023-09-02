const recetaFHIR= (BundleID,MedicationRequest,Patient,Coverage,Practitioner,Location) => {

    const receta= {
        resourceType : "Bundle",
        id : BundleID,
        meta : {
            profile : ["http://fhir.msal.gob.ar/RDI/StructureDefinition/recetaDigitalRegistroRecetaAR"]
        },
        type: "transaction",
        timestamp : new Date(),//"2023-07-06T15:00:03.790+00:00",
        entry : [
            ...MedicationRequest,
            Patient,
            Coverage,
            Practitioner,
            Location
        ]
    };

    return receta;

}

module.exports= {recetaFHIR}