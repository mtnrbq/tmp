/*
FindMeHome.js
Microsoft grants you the right to use these script files for the sole purpose of either (i) interacting through your browser with the website or online service, subject to the applicable licensing or use terms; or (ii) using the files as included with a Microsoft product subject to that product’s license terms. Microsoft reserves all other rights to the files not expressly granted by Microsoft, whether by implication, estoppel or otherwise. The notices and licenses below are for informational purposes only.
*/
var levelSummaryUrl = null;
var meetingRoomsUrl = null;
var yammerNetworkDomain = null;

$(document).ready(function () {

    $("#findList").focus();

    $("#findButton").click(function () {
        findButtonClick();
    });

    InitialiseNameCtrlAndAttachEvents();

});

function redirectHashUrl() {
    if (location.hash != null && location.hash != '') {
        location.href = mapUrl + location.hash.substring(1, location.hash.length);
    }
}

function findButtonClick() {

    if ($('#findList').val() == '') {
        return;
    }

    var userId = $('#findList').val();

    userId = userId + "/";

    location.replace(mapUrl + userId);


}

function showMeetingRooms(currentBuilding) {
    if (currentBuilding == null) {
        $('#meetingRoomsInCurrentBuilding').hide();
        $('#meetingRoomInfo').show();
    } else {

        $('#meetingRoomsInCurrentBuilding').empty();
        var url = serviceLocation + '/MeetingRooms/BuildingLevelsWithMeetingRooms/' + currentBuilding;

        $.getJSON(url, function (levels) {
            for (var level in levels) {
                var thisLevel = levels[level];
                $('#meetingRoomsInCurrentBuilding').append('<li><a href="' + meetingRoomsUrl +  thisLevel.Building + '/' + thisLevel.Level + '">' + thisLevel.Building + '/' + thisLevel.Level + ' (' + thisLevel.Online + ' Rooms)</a></li>')
            }
            $('#findUser').css({ 'height': $('#bookMeeting').height() });
        });
    }
}

function ProcessCurrentBuilding(currentBuilding, staticWhatsOnPane) {
    // Called by SetUserMessages
    if (!showPeopleUI) {
        $('.peopleUI').addClass("hidden");
        $('#bookMeeting').addClass("tileFullWidth")
    }
    showMeetingRooms(currentBuilding);
    showWhatsOn(staticWhatsOnPane,currentBuilding);
    showFavourites(currentBuilding);
    showIntroMap(currentBuilding);
}

function showWhatsOn(staticWhatsOnPane,currentBuilding) {

    if (staticWhatsOnPane != null)
    {
        $('#whatsOn').show();
        $('#whatsOnYammer').hide();
        $('body').removeClass('homeNarrowMode');
    }
    else
    {
        if (currentBuilding == null) {
            $('#whatsOn').hide();
            $('body').addClass('homeNarrowMode');
        } else {
            $('#whatsOn').show();
            $('body').removeClass('homeNarrowMode');
            var url = serviceLocation + '/buildings/get/' + currentBuilding;
            $.getJSON(url, function (buildingResult) {
                $('#buildingName').text(currentBuilding);
                if (buildingResult.BuildingInfoUrl == null) {
                    $('#facilitiesInfo').hide();
                } else {
                    $('#facilitiesInfoLink').attr('href', buildingResult.BuildingInfoUrl)
                    $('#facilitiesInfo').show();
                }
                if (buildingResult.YammerGroupId == null) {
                    $('#yammerFeed').hide();
                    $('#noYammerFeed').show();
                } else {
                    yam.connect.embedFeed({
                        container: "#yammerFeed",
                        network: yammerNetworkDomain,
                        feedType: "group",
                        feedId: buildingResult.YammerGroupId,
                        config: {
                            use_sso: true,
                            header: false,
                            footer: true
                        }
                    });
                    $('#yammerFeed').show();
                }
            });
        }
     }
}

function showFavourites(currentBuilding) {

    var userFavouritesUrl = serviceLocation + '/userfavourites/get/' + currentUserId + '?setToOrgChartIfNull=' + useOrgIfNoFavourites;

    if (currentBuilding == null) {
        $('#favouritesNotInThisBuildingHeader').hide();
    } else {
        $('#favouritesBuildingName').text(currentBuilding);
        $('#favouritesNotInThisBuildingHeader').show();
    }

    $.getJSON(userFavouritesUrl, function (userFavourites) {

        $('#favouritesInThisBuildingList').empty();
        $('#favouritesNotInThisBuildingList').empty();

        var locationsUrl = serviceLocation + '/objectlocation/users/' + userFavourites.Favourites + '?getExtendedData=true';

        $('#mapAllFavouritesLink').attr('href', mapUrl + userFavourites.Favourites)

        $.getJSON(locationsUrl, function (userLocations) {

            var foundInBuilding = 0;
            var foundNotInBuilding = 0;

            for (var index in userLocations) {
                var thisLocation = userLocations[index];

                if (thisLocation.Status == 'Located') {
                    var divForCurrentLocation;
                    if (currentBuilding != null && thisLocation.Coordinates != null && thisLocation.Coordinates.Building == currentBuilding) {
                        divForCurrentLocation = $('#favouritesInThisBuildingList');
                        foundInBuilding++;
                    } else {
                        divForCurrentLocation = $('#favouritesNotInThisBuildingList');
                        foundNotInBuilding++;
                    }

                    var userId = thisLocation.Alias.aliasEncode();
                    var presenceClass = getLyncPresence(thisLocation.ExtendedUserData.LyncSipAddress);

                    $('<div/>', {
                        id: 'favouritePerson_' + userId,
                        class: 'favouritePerson'
                    }).appendTo(divForCurrentLocation);

                    $('<div/>', {
                        id: 'personList_presence_' + userId,
                        class: 'personList_presence'
                    }).appendTo('#favouritePerson_' + userId);

                    $('#personList_presence_' + userId).addClass(presenceClass);

                    $('<div/>', {
                        id: 'personList_photo_container_' + userId,
                        class: 'personList_photo_container'
                    }).appendTo('#favouritePerson_' + userId);

                    $('<div/>', {
                        id: 'personList_photo_' + userId,
                        class: 'personList_photo home',
                        onmouseover: "showLyncPopUp('" + thisLocation.ExtendedUserData.LyncSipAddress + "', this)",
                        onmouseout: "hideLyncPopUp()",
                    }).appendTo('#personList_photo_container_' + userId);

                    $('#personList_photo_container_' + userId + ' .personList_photo').css('background-image', "url('" + userPhotosLocation + userId.aliasDecode() + "')");

                    $('<div/>', {
                        id: 'personList_text_' + userId,
                        class: 'personList_text home',
                        onmouseover: "showLyncPopUp('" + thisLocation.ExtendedUserData.LyncSipAddress + "', this)",
                        onmouseout: "hideLyncPopUp()",
                    }).appendTo('#favouritePerson_' + userId);

                    $('<span/>', {
                        id: 'sidebar-caption-' + userId
                    }).appendTo('#personList_text_' + userId);

                    $('<a/>', {
                        text: thisLocation.ExtendedUserData.DisplayName,
                        href: mapUrl + userId.aliasDecode(),
                    }).appendTo('#sidebar-caption-' + userId);

                   if (thisLocation.Coordinates != null) {
                        displayText = thisLocation.Coordinates.Building + '/' + thisLocation.Coordinates.Level;
                        if (thisLocation.Coordinates.LocationDescription != null)
                            displayText = displayText + ' ' + thisLocation.Coordinates.LocationDescription;
                    } else if (thisLocation.GPS != null) {
                        if (thisLocation.GPS.LocationDescription != null) {
                            displayText = thisLocation.GPS.LocationDescription;
                        } else {
                            displayText = 'External';
                        }
                    }

                    $('<span/>', {
                        text: displayText,
                        class: 'smallText'
                    }).appendTo('#personList_text_' + userId);
                }
            }

            if (foundInBuilding > 0) {
                $('#favouritesInThisBuildingSection').show();
            } else {
                $('#favouritesInThisBuildingSection').hide();
            }
 
            if (foundNotInBuilding > 0) {
                $('#favouritesNotInThisBuildingSection').show();
            } else {
                $('#favouritesNotInThisBuildingSection').hide();
            }

            if (foundInBuilding == 0 && foundNotInBuilding == 0) {
                $('#favouritesNotFound').show();
            }
        });
    });
}

var introMap = null;
function showIntroMap(currentBuilding) {

    if (introMap != null) {
        return;
    }
    var mapDiv = document.getElementById("mapIntro");
    try {
        var layer = new L.StamenTileLayer("terrain");
        mapIntro = new L.Map("mapIntro", {
            center: new L.LatLng(-26.097930, 28.079920),
            zoom: 11
        });
        mapIntro.addLayer(layer);


        var showBuildingLocationsUrl = serviceLocation + '/Summary/BuildingLocations';

        $.getJSON(showBuildingLocationsUrl, function (buildingLocations) {

            var findMeIcon = L.icon({
                    iconUrl: 'Scripts/images/marker-icon.png',
                    iconSize: [26, 48],
                    iconAnchor: [13, 48],
                    popupAnchor: [0, -5]
            });

            for (var index in buildingLocations) {

                var buildingLocation = buildingLocations[index];

                var marker = L.marker([buildingLocation.Latitude, buildingLocation.Longitude],
                    { title: buildingLocation.Building, icon:findMeIcon}
                    ).addTo(mapIntro);
                
                marker.on('click', function (e) {
                    var building = e.target.options.title;
                    var currentUser = $("#who").data("currentUser");
                    location.replace(meetingRoomsUrl + building + '/~');
                });

                if (buildingLocation.Building == currentBuilding)
                {
                    mapIntro.setView([buildingLocation.Latitude, buildingLocation.Longitude], 12);
                }


            }
        });
    }
    catch (ex) {
        return;
    }
}

function onLyncPresenceStatusChange(name, status, id) {
    var atPos = name.indexOf('@', 0);
    var userName = name.substring(0, atPos);

    var presenceClass = getLyncPresence(name);

    removePresenceClasses($('#personList_presence_' + userName));
    $('#personList_presence_' + userName).addClass(presenceClass);
}

