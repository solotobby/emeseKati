$(function () {

  $("#divisonButton").click(function () {

    var lat = $("#soslat").val();

    var lng = $("#lng").val();
console.log(lat);
    $.ajax({
      type: "GET",
      url: "libs/php/getCountrySubdivision.php",
      data: { lat: lat, lng: lng },

      success: function (data) {

        console.log(data);
        $("#subdivisionresult").html('')
        $("#subdivisionresult").html(data.countryName);

      },

    });

  });

});