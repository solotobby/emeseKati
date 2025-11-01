$(function () {

  $("#findNearByButton").click(function () {

    var lat = $("#nearLat").val();

    var lng = $("#nearLng").val();
console.log(lng);
    $.ajax({
      type: "GET",
      url: "libs/php/findNearByPlaceName.php",
      data: { lat: lat, lng: lng },

      success: function (data) {

        console.log(data);
        $("#findNearByResult").html('')
        $("#findNearByResult").html(data.countryName);

      },

    });

  });

});