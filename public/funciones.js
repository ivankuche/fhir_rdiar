// Setea datepickers
function setupDatePicker(datePicker)
{
    $(datePicker).datepicker({
      regional: "es",
      showOtherMonths: true,
      selectOtherMonths: true,
      changeMonth: true,
      changeYear: true,
      yearRange: "1900:2030"
    });
}


// Instancia los componentes (autocompletes, datepickers, etc)
function setComponents() {

  // Select de Sexo Biologico
  $("#PatientGender").select2({
    language: "es",
    minimumResultsForSearch: -1,
    ajax: {
      url: "http://localhost:3000/sexos",
      dataType: "json"
    }
  });    

  // Autocomplete de OS/Prepagas
  $("#CoverageID").select2({
    language: "es",
    minimumInputLength: 3,
    ajax: {
      url: "http://localhost:3000/coberturas",
      dataType: "json"
    }
  });    

  // Select de Planes
  $("#CoveragePlan").select2({
    language: "es",
    minimumInputLength: 3,
    ajax: {
      url: "http://localhost:3000/planes",
      dataType: "json"
    }
  });    

  // Autocomplete de Medicamentos genericos y comerciales
  $("#MedicationFormMedicationGeneric,#MedicationFormMedicationCommercial").select2({
    language: "es",
    minimumInputLength: 3,
    width: "90%",
    ajax: {
      url: "http://localhost:3000/medicaciones",
      dataType: "json",
      data: function (term) {
        return {
            term: term.term,
            medicationType: $(this).prev().attr("medication-type")
        };
      }
    }
  });

  // Cuando se selecciona una medicacion grabamos su system en el campo hidden
  $('#MedicationFormMedicationGeneric').on("select2:select", function(e) {
    $("#MedicationFormMedicationSystemGeneric").val(e.params.data.system);
 });
 $('#MedicationFormMedicationCommercial').on("select2:select", function(e) {
  $("#MedicationFormMedicationSystemCommercial").val(e.params.data.system);
});

  // Autocomplete del motivo de medicacion
  $("#MedicationFormReason").select2({
    language: "es",
    minimumInputLength: 3,
    ajax: {
      url: "http://localhost:3000/motivos_medicacion",
      dataType: "json"
    }
  });

  // Cuando se selecciona un motivo de medicacion grabamos su system
  $('#MedicationFormReason').on("select2:select", function(e) { 
    $("#MedicationFormReasonSystem").val(e.params.data.system);
  });

  // Select de unidad de duracion
  $("#MedicationFormDurationUnit").select2({
    language: "es",
    minimumResultsForSearch: -1,
    ajax: {
      url: "http://localhost:3000/unidades_tiempo",
      dataType: "json"
    }
  });

  // Select de unidad de repeticion
  $("#MedicationFormFrequencyUnit").select2({
    language: "es",
    minimumResultsForSearch: -1,
    ajax: {
      url: "http://localhost:3000/unidades_tiempo",
      dataType: "json"
    }
  });

  // Regionalización del datepicker
  $.datepicker.setDefaults($.datepicker.regional['es']);

  // Datepicker de fecha de nacimiento de paciente
  setupDatePicker("#PatientBirthdate");

  // Modal de loading
  $("#loadingDialog").dialog({
    autoOpen: false,
    modal: true,
    resizable: false,
    draggable: false,
    backdrop: 'static', 
    keyboard: false,
    closeOnEscape: false,
    width: 'auto'
  });
}

// Envio del form para la generacion del recurso FHIR
function submitReceta() {
  let formData= $("form").serializeArray();

  // Agregamos el nombre de la cobertura
  formData.push({name:"CoverageName", value:$('#CoverageID').select2('data')[0].text});
  // Agregamos el nombre del plan de la cobertura
  formData.push({name:"CoveragePlanName", value:$('#CoveragePlan').select2('data')[0].text});

  $.ajax({
    url: "http://localhost:3000/generarReceta", // Replace with your API endpoint
    method: "post",
    data: formData,
    success: function(data) {
      $("#recursoFHIR").html(JSON.stringify(data,null,'  '));
      $('#recursoFHIR').autogrow({vertical: true, horizontal: false});
      $("#validateFHIR").show();
      $("#submitFHIR").show();
    },
    error: function (xhr,error,status)
    {
      const errorText= "Error " + xhr.status + ": " + xhr.statusText + "<br/>" + xhr.responseText;
      showModalAlert("Info","Error generando la receta",errorText)
    }
  });

}

// Generacion del recurso FHIR cuando se envia el formulario global
$("form").on("submit", function (e) {
  e.preventDefault();

  if ($("#medicationsTable tbody tr").length==1)
    showModalAlert(null,"Falta agregar medicación","Se debe agregar al menos una medicación");
  else
    submitReceta();

  return false;
})

// Validacion del formulario de medicamentos
function setMedicationFormValidation() {
  $("form").validate({
    rules: {
      MedicationFormMedicationGeneric: {
        required: true
      },
      MedicationFormReason: {
        required: true
      },
      MedicationFormDuration: {
        required: true,
        number: true,
        min: 1,
      },
      MedicationFormMaximumDuration: {
        required: true,
        number: true,
        min: 1,
      },
      MedicationFormFrequency: {
        required: true,
        number: true,
        min: 1,
      },
      MedicationFormPeriod: {
        required: true,
        number: true,
        min: 1,
      },
      MedicationFormAmountOfUnit: {
        required: true,
        number: true,
        min: 1,
      }
    },
    messages: {
      MedicationFormMedicationGeneric: {
        required: "Campo requerido",
      },
      MedicationFormReason: {
        required: "Campo requerido",
      },
      MedicationFormDuration: {
        required: "Campo requerido",
        number: "Debe ser numérico",
        min: "Debe ser mayor o igual a 1"
      },
      MedicationFormMaximumDuration: {
        required: "Campo requerido",
        number: "Debe ser numérico",
        min: "Debe ser mayor o igual a 1"
      },
      MedicationFormFrequency: {
        required: "Campo requerido",
        number: "Debe ser numérico",
        min: "Debe ser mayor o igual a 1"
      },
      MedicationFormPeriod: {
        required: "Campo requerido",
        number: "Debe ser numérico",
        min: "Debe ser mayor o igual a 1"
      },
      MedicationFormAmountOfUnit: {
        required: "Campo requerido",
        number: "Debe ser numérico",
        min: "Debe ser mayor o igual a 1"
      }
    },
    errorPlacement: function(error, element) {
      if ((element.attr("id")=="MedicationFormMedicationGeneric") || (element.attr("id")=="MedicationFormReason"))
        error.insertAfter(element.next("span"));
      else
        error.insertAfter(element);
    }    
  });  
}

// Transforma el texto de las unidades de tiempo a singular
function duracionUnitaria(duracion,plural,idUnidad)
{
  let nameForDuration= plural;

  if (duracion==1)
  {
    let caracteresABorrar= 1;

    if (idUnidad=="mo")
      caracteresABorrar= 2;

    nameForDuration= plural.substring(0,plural.length-caracteresABorrar);
  }

  return nameForDuration;
}


// Agregado de nueva medicacion a la receta
$("#addMedication").on("click",function(e) {
  e.preventDefault();
  if ($("form").valid())
  {
    $("#sinMedicacion").hide();
    
    const cantidadUnidades= $("#MedicationFormAmountOfUnit").val();

    const medicamentoNombreGeneric= $("#MedicationFormMedicationGeneric").select2("data")[0].text;
    const medicamentoIDGeneric= $("#MedicationFormMedicationGeneric").select2("data")[0].id;
    const medicamentoSystemGeneric= $("#MedicationFormMedicationSystemGeneric").val();

    const medicamentoNombreCommercial= $("#MedicationFormMedicationCommercial").select2("data")[0]?.text;
    const medicamentoIDCommercial= $("#MedicationFormMedicationCommercial").select2("data")[0]?.id;
    const medicamentoSystemCommercial= $("#MedicationFormMedicationSystemCommercial").val();


    let medicamentoDisplay= "<i>Genérico:</i> " + medicamentoNombreGeneric;
    if (medicamentoNombreCommercial)
      medicamentoDisplay+= "<br/><i>Comercial:</i> " + medicamentoNombreCommercial;


    const motivoNombre= $("#MedicationFormReason").select2("data")[0].text;
    const motivoID= $("#MedicationFormReason").select2("data")[0].id;
    const motivoSystem= $("#MedicationFormReasonSystem").val();

    const medicamentoDuration= $("#MedicationFormDuration").val();
    const medicamentoMaximumDuration= $("#MedicationFormMaximumDuration").val();
    const medicamentoDurationName= $("#MedicationFormDurationUnit").select2("data")[0].text;
    const medicamentoDurationID= $("#MedicationFormDurationUnit").select2("data")[0].id;

    const nameForDuration= duracionUnitaria(medicamentoDuration,medicamentoDurationName,medicamentoDurationID);
    const nameForMaximum= duracionUnitaria(medicamentoMaximumDuration,medicamentoDurationName,medicamentoDurationID);

    const medicamentoDurationDisplay= medicamentoDuration + " " + nameForDuration.toLowerCase();
    const medicamentoMaximumDurationDisplay= medicamentoMaximumDuration + " " + nameForMaximum.toLowerCase();





    const medicamentoFrequency= $("#MedicationFormFrequency").val();
    const medicamentoPeriod= $("#MedicationFormPeriod").val();
    const medicamentoFrequencyDurationName= $("#MedicationFormFrequencyUnit").select2("data")[0].text;
    const medicamentoFrequencyDurationID= $("#MedicationFormFrequencyUnit").select2("data")[0].id;

    const nameForPeriodDuration= duracionUnitaria(medicamentoPeriod,medicamentoFrequencyDurationName,medicamentoFrequencyDurationID);

    const veces= (medicamentoFrequency==1?"vez":"veces")

    const medicamentoFrequencyDisplay= medicamentoFrequency + " " + veces + " cada " + medicamentoPeriod + " " + nameForPeriodDuration.toLowerCase();

    const dosage= "Usar " + medicamentoDurationDisplay + ", máximo " + medicamentoMaximumDurationDisplay + ". Repetir " + medicamentoFrequencyDisplay + ".";

    let narrativo= medicamentoNombreGeneric;
    if (medicamentoIDCommercial)
      narrativo+= " (Marca comercial: " + medicamentoNombreCommercial + ")";

    const medicacionJSON= {
      amount: cantidadUnidades,

      nameGeneric: medicamentoNombreGeneric,
      idGeneric: medicamentoIDGeneric,
      systemGeneric: medicamentoSystemGeneric,

      nameCommercial: medicamentoNombreCommercial,
      idCommercial: medicamentoIDCommercial,
      systemCommercial: medicamentoSystemCommercial,


      reasonName: motivoNombre,
      reasonID: motivoID,
      reasonSystem: motivoSystem,
      duration: medicamentoDuration,
      maximumDuration: medicamentoMaximumDuration,
      durationUnit: medicamentoDurationID,
      frequency: medicamentoFrequency,
      period: medicamentoPeriod,
      frequencyUnit: medicamentoFrequencyDurationID,
      narrative: narrativo + ". " + dosage +  " Motivo de prescripción: " + motivoNombre,
      dosage: dosage
    };


    var ultimaColumna= "<button class='borrarFila'>Borrar</button>";
    ultimaColumna+= "<input type='hidden' name='Medication[]' value='" + JSON.stringify(medicacionJSON) + "' />";

    const newRow = $("<tr>");
    newRow.append($("<td>" + cantidadUnidades + "</td>"));
    newRow.append($("<td>" + medicamentoDisplay + "</td>"));
    newRow.append($("<td>" + motivoNombre + "</td>"));
    newRow.append($("<td>" + medicamentoDurationDisplay + "</td>"));
    newRow.append($("<td>" + medicamentoMaximumDurationDisplay + "</td>"));
    newRow.append($("<td>" + medicamentoFrequencyDisplay + "</td>"));
    newRow.append($("<td>").html(ultimaColumna));
    
    $("#medicationsTable tbody").append(newRow);
  }
});

// Conducta del boton de borrado de filas para la lista de medicacion
$(document).on("click", ".borrarFila", function() {
  $(this).closest("tr").remove();

  // Mostramos el cartel de "No hay medicaciones cargadsa"
  if ($("#medicationsTable tbody tr").length==1)
    $("#sinMedicacion").show();
});

// Autofocus en el search de Select2
$(document).on('select2:open', () => {
  document.querySelector('.select2-search__field').focus();
});

$("#limpiarFormulario").on("click", function () {
  $("#MedicationFormAmountOfUnit").val("")
  $("#MedicationFormMedicationGeneric").empty();
  $("#MedicationFormMedicationSystemGeneric").val("");
  $("#MedicationFormMedicationCommercial").empty();
  $("#MedicationFormMedicationSystemCommercial").val("");
  $("#MedicationFormReason").empty();
  $("#MedicationFormReasonSystem").val("");
  $("#MedicationFormDuration").val("")
  $("#MedicationFormMaximumDuration").val("")
  $("#MedicationFormDurationUnit").prop('selectedIndex', 0).change();
  $("#MedicationFormFrequency").val("")
  $("#MedicationFormPeriod").val("")
  $("#MedicationFormFrequencyUnit").prop('selectedIndex', 0).change();

  $(".borrarFila").each(function (i,element) {
    element.click();
  })
})

// Validacion del recurso FHIR
$("#validateFHIR").on("click",function (e) {
  e.preventDefault();
  showLoading();
  $.ajax({
    type: 'POST',
    url: "http://localhost:3000/validarReceta",
    contentType: "application/json",
    dataType: "json",
    data: $("#recursoFHIR").val(),
    success: function (data) {
      hideLoading();
      showModalAlert("Info","Receta enviada exitosamente",data.text.div)
    },
    error: function (xhr,error,status)
    {
      hideLoading();
      const errorText= "Error " + xhr.status + ": " + xhr.statusText + "<br/>" + xhr.responseText;
      showModalAlert("Info","Error generando la receta",errorText)
    }
  });
})

// Envio del recurso FHIR
$("#submitFHIR").on("click",function (e) {
  e.preventDefault();
  showLoading();
  $.ajax({
    type: 'POST',
    url: "http://localhost:3000/enviarReceta",
    contentType: "application/json",
    dataType: "json",
    data: $("#recursoFHIR").val(),
    success: function (data) {
      hideLoading();
      showModalAlert("Info","Receta enviada exitosamente",data.text.div)
    },
    error: function (xhr,error,status)
    {
      hideLoading();
      const errorText= "Error " + xhr.status + ": " + xhr.statusText + "<br/>" + xhr.responseText;
      showModalAlert("Info","Error generando la receta",errorText)
    }
  });
})


// METODOS PARA CARGA DE DUMMY DATA
function dummyDataGenero(PatientGender,PatientGenderCode) 
{
  var patientGenderSelect= $("#PatientGender");

  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/sexos"
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(PatientGender, PatientGenderCode, true, true);
    patientGenderSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    patientGenderSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });
  });
}

function dummyDataCoverage(CoverageName) 
{
  var coverageIDSelect = $('#CoverageID');
  
  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/coberturas?term=" + CoverageName,
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(data.results[0].text, data.results[0].id, true, true);
    coverageIDSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    coverageIDSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });
  });
}

function dummyDataPlan(CoveragePlan) 
{
  var coveragePlanSelect = $('#CoveragePlan');
  
  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/planes?term=" + CoveragePlan,
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(data.results[0].text, data.results[0].id, true, true);
    coveragePlanSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    coveragePlanSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });
  });
}

function dummyDataUnidadDuracion(UnidadTiempo,UnidadTiempoCodigo) 
{
  var unidadTiempoSelect= $("#MedicationFormDurationUnit");

  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/unidades_tiempo"
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(UnidadTiempo, UnidadTiempoCodigo, true, true);
    unidadTiempoSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    unidadTiempoSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });
  });
}

function dummyDataUnidadRepeticion(UnidadTiempo,UnidadTiempoCodigo) 
{
  var unidadTiempoSelect= $("#MedicationFormFrequencyUnit");

  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/unidades_tiempo"
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(UnidadTiempo, UnidadTiempoCodigo, true, true);
    unidadTiempoSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    unidadTiempoSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });
  });
}

function dummyDataMedicacion(MedicationType,MedicationName) 
{
  var medicationSelect = (MedicationType=="g"?$('#MedicationFormMedicationGeneric'):$('#MedicationFormMedicationCommercial'));
  
  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/medicaciones?medicationType=" + MedicationType + "&term=" + MedicationName,
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(data.results[0].text, data.results[0].id, true, true);
    medicationSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    medicationSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });

    if (MedicationType=="g")
      $("#MedicationFormMedicationSystemGeneric").val(data.results[0].system);
    else
      $("#MedicationFormMedicationSystemCommercial").val(data.results[0].system);
        

  });


}

function dummyDataMotivoMedicacion(MedicationReason) 
{
  var medicationReasonSelect = $('#MedicationFormReason');
  
  $.ajax({
    type: 'GET',
    url: "http://localhost:3000/motivos_medicacion?term=" + MedicationReason,
  }).then(function (data) {
    // create the option and append to Select2
    var option = new Option(data.results[0].text, data.results[0].id, true, true);
    medicationReasonSelect.append(option).trigger('change');

    // manually trigger the `select2:select` event
    medicationReasonSelect.trigger({
      type: 'select2:select',
      params: {
        data: data
      }
    });

    $("#MedicationFormReasonSystem").val(data.results[0].system);

  });

}

function showLoading()
{
  $("#loadingDialog").dialog("open");
}

function hideLoading()
{
  $("#loadingDialog").dialog("close");
}

// Document ready
$(document).ready(function() {

  // Iniciamos los componentes
  setComponents();

  // Aplicamos validacion al form de medicamentos
  setMedicationFormValidation();

  // Carga de dummy data
  dummyDataGenero("Masculino","male");
  dummyDataCoverage("OSECAC");
  dummyDataPlan("Familiar");
  dummyDataMedicacion("g","ibuprofeno");
//  dummyDataMedicacion("c","Dolorsyn");
  dummyDataMotivoMedicacion("cefalea");
  dummyDataUnidadDuracion("Días","d");
  dummyDataUnidadRepeticion("Horas","h")
});
