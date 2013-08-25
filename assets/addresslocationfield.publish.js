var field = null,
    map = null,
    marker = {},
    lat = null,
    lng = null,
    geocoder = new google.maps.Geocoder();

(function ($) {
    "use strict";

    function SetLatLng(latlng) {

        field = $('div.field-addresslocation');
        lat = field.find('label.latitude input');
        lng = field.find('label.longitude input');
        lat.val(latlng.lat().toFixed(7));
        lng.val(latlng.lng().toFixed(7));
    }

    function SetMarker(latlng) {
        if ($.isEmptyObject(marker)) {
            marker = new google.maps.Marker({
                "clickable": false,
                "draggable": true,
                "position": latlng,
                "animation": google.maps.Animation.DROP,
                "map": map
            });
        } else {
            marker.setPosition(latlng);
            marker.setMap(map);
        }

        map.setZoom(16);
        map.setCenter(marker.getPosition());
        SetLatLng(latlng);

        google.maps.event.addListener(marker, "dragend", function () {
            SetLatLng(marker.getPosition());
            map.setCenter(marker.getPosition());
        });
    }


    /**
     * Used to populate any empty fields.
     *
     * @param data
     */
    function SetFields(data) {

        /**
         * Used to get the array position of the current address_component
         *
         * @param mapData
         * @param filter
         * @returns {null || number}
         */
        function getArrayPosition(mapData, filter) {

            var i = 0,
                position = null;

            for (i; i < mapData.length; i = i + 1) {
                if (mapData[i].types[0] === filter) {
                    position = i;
                }
            }

            return position;

        }


        //City
        if (field.find("label.city input").val() === "") {
            if (getArrayPosition(data.address_components, "locality") !== null) {
                field.find("label.city input").val(data.address_components[getArrayPosition(data.address_components, "locality")].long_name);
            }
        }

        //Region
        if (field.find("label.region input").val() === "") {
            if (getArrayPosition(data.address_components, "administrative_area_level_1") !== null) {
                field.find("label.region input").val(data.address_components[getArrayPosition(data.address_components, "administrative_area_level_1")].long_name);
            }
        }

        //Postcode
        if (field.find("label.postal-code input").val() === "") {
            if (getArrayPosition(data.address_components, "postal_code") !== null) {
                field.find("label.postal-code input").val(data.address_components[getArrayPosition(data.address_components, "postal_code")].long_name);
            }
        }

        //Country
        if (field.find("label.country input").val() === "") {
            if (getArrayPosition(data.address_components, "country") !== null) {
                field.find("label.country input").val(data.address_components[getArrayPosition(data.address_components, "country")].long_name);
            }
        }
    }

    function addresslocationField() {

        var a,
            latlng,
            map =  new google.maps.Map($('div.field-addresslocation div.map')[0], {
                center: new google.maps.LatLng(0, 0),
                zoom: 1,
                MapTypeId: google.maps.MapTypeId.ROADMAP
            });

        field = $('div.field-addresslocation');
        lat = field.find('label.latitude input');
        lng = field.find('label.longitude input');

        if (lat.val() && lng.val()) {
            latlng = new google.maps.LatLng(lat.val(), lng.val());
            map.setCenter(latlng);
            map.setZoom(16);
            SetMarker(latlng);
            field.find('label.locate input[name="locate"]').attr('disabled', 'disabled');
        } else {
            field.find('label.locate input[name="clear"]').attr('disabled', 'disabled');
        }

        field.find('label.locate input[name="clear"]').click(function (ev) {

            ev.preventDefault();

            var fields = field.find('label.street input, label.city input, label.region input, label.postal-code input, label.country input, label.latitude input, label.longitude input');

            fields.val('');

            marker.setMap(null);
            map.setCenter(new google.maps.LatLng(0, 0));
            map.setZoom(1);

            field.find('label.locate input[name="locate"]').removeAttr('disabled');

        });

        if (field.find('div.address').hasClass('sidebar')) {

            a = $('<a class="mapswitch" href="#">[-] Hide Map</a>').appendTo('label.locate');

            field.delegate('label.locate a.mapswitch', 'click', function (ev) {

                ev.preventDefault();
                map = field.find('div.map');
                if (map.hasClass('open')) {
                    map.slideUp().removeClass('open').addClass('closed');
                    $(this).text('[+] Show Map');
                } else if (map.hasClass('closed')) {
                    map.slideDown().removeClass('closed').addClass('open');
                    $(this).text('[+] Hide Map');
                }
            });
        }

        field.find('label.locate input[name="locate"]').click(function (ev) {

            //Reassign field to stop mime warning/error
            var address = '',
                field = $('div.field-addresslocation'),
                button = $(this),
                button_value = button.val(),
                street = field.find('label.street input').val(),
                city = field.find('label.city input').val(),
                region = field.find('label.region input').val(),
                postalcode = field.find('label.postal-code input').val(),
                country = field.find('label.country input').val();

            button.val('Geocoding...').attr('disabled', 'disabled');
            button.parent('label').find('i').remove();

            ev.preventDefault();

            if (street) {
                address += street;
            }
            if (city) {
                address += ', ' + city;
            }
            if (region) {
                address += ', ' + region;
            }
            if (postalcode) {
                address += ', ' + postalcode;
            }
            if (country) {
                address += ', ' + country;
            }

            GeocodeAddress(address, function (result) {
                button.val(button_value);
                SetMarker(result.geometry.location);
                SetFields(result);
            }, function () {
                button.val(button_value).removeAttr('disabled');
                button.parent('label').append('<i>Address not found</i>');
            });
        });
    }

    function GeocodeAddress(address, success, fail) {
        geocoder.geocode({"address": address}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                success(results[0]);
            } else {
                fail();
            }
        });
    }

    $(document).ready(function () {
        addresslocationField();
    });
}(jQuery));
