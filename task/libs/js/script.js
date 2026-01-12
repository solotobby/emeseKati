
	$(function () {

  $("#ButtonClick").click(function () {

    var lat = $("#lat").val();

    var long = $("#long").val();

    $.ajax({
      type: "GET",
      url: "libs/php/getCountryCode.php",
      data: { lat: lat, long: long },

      success: function (data) {

        console.log(data);
        $("#result").html('')
        $("#result").html(data);

      },

    });

  });

});
		
