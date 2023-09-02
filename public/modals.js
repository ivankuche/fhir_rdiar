function showModalAlert(type, title, message) {
    var buttons = {
      OK: function() {
        $(this).dialog("close");
      }
    };

    if (type === "confirm") {
      buttons = {
        Yes: function() {
          $(this).dialog("close");
          // Handle the confirmation action here
        },
        No: function() {
          $(this).dialog("close");
          // Handle the rejection action here
        }
      };
    }

    $("<div>")
      .html(message)
      .dialog({
        modal: true,
        title: title,
        buttons: buttons,
        width:'auto'
      });
  }