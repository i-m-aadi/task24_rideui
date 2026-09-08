const defaultLocation = [28.6139, 77.2090];

const map = L.map("map").setView(defaultLocation, 13);


// OpenStreetMap tiles
L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map);

let pickup = null;
let destination = null;

let pickupMarker = null;
let destinationMarker = null;

let driverMarker = null;

let selectedRide = {
    type: "Bike",
    rate: 8
};


const pickupText =
    document.getElementById("pickupText");

const dropText =
    document.getElementById("dropText");

const instruction =
    document.getElementById("instruction");

const distanceElement =
    document.getElementById("distance");

const fareElement =
    document.getElementById("fare");

const durationElement =
    document.getElementById("duration");

const bookRideBtn =
    document.getElementById("bookRideBtn");

const statusCard =
    document.getElementById("statusCard");

const driverName =
    document.getElementById("driverName");

const driverVehicle =
    document.getElementById("driverVehicle");

const rideStatus =
    document.getElementById("rideStatus");

const statusDot =
    document.getElementById("statusDot");

const etaElement =
    document.getElementById("eta");

const locationBtn =
    document.getElementById("locationBtn");

const themeToggle =
    document.getElementById("themeToggle");

const themeIcon =
    themeToggle.querySelector(".theme-icon");

const themeLabel =
    themeToggle.querySelector(".theme-label");


/* =========================
   THEME
========================= */

function setTheme(theme) {

    const isDark = theme === "dark";

    document.body.dataset.theme = isDark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
    );
    themeIcon.textContent = isDark ? "☀" : "☾";
    themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
}


const savedTheme = localStorage.getItem("ridego-theme");

setTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", function () {

    const nextTheme =
        document.body.dataset.theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("ridego-theme", nextTheme);

});


/* =========================
   CUSTOM MARKER ICONS
========================= */

const pickupIcon = L.divIcon({

    className: "custom-marker",

    html: `
        <div style="
            background:#16a34a;
            width:22px;
            height:22px;
            border-radius:50%;
            border:4px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
        "></div>
    `,

    iconSize: [22, 22],

    iconAnchor: [11, 11]
});


const destinationIcon = L.divIcon({

    className: "custom-marker",

    html: `
        <div style="
            background:#dc2626;
            width:22px;
            height:22px;
            border-radius:50%;
            border:4px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
        "></div>
    `,

    iconSize: [22, 22],

    iconAnchor: [11, 11]
});


const driverIcon = L.divIcon({

    className: "driver-marker",

    html: `
        <div style="
            background:#2563eb;
            width:40px;
            height:40px;
            border-radius:50%;
            border:4px solid white;
            box-shadow:0 3px 10px rgba(0,0,0,.3);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:20px;
        ">
            🚗
        </div>
    `,

    iconSize: [40, 40],

    iconAnchor: [20, 20]
});


/* =========================
   MAP CLICK
========================= */

map.on("click", function (event) {

    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;


    // First click = pickup
    if (!pickup) {

        pickup = {
            lat: latitude,
            lng: longitude
        };


        pickupMarker = L.marker(
            [latitude, longitude],
            {
                icon: pickupIcon
            }
        )
        .addTo(map)
        .bindPopup("Pickup Location")
        .openPopup();


        pickupText.value =
            formatCoordinates(latitude, longitude);


        instruction.textContent =
            "Now click the map to select drop-off location";


        return;
    }


    // Second click = destination
    if (!destination) {

        destination = {
            lat: latitude,
            lng: longitude
        };


        destinationMarker = L.marker(
            [latitude, longitude],
            {
                icon: destinationIcon
            }
        )
        .addTo(map)
        .bindPopup("Drop-off Location")
        .openPopup();


        dropText.value =
            formatCoordinates(latitude, longitude);


        instruction.textContent =
            "Pickup and drop-off selected ✓";


        calculateRide();


        return;
    }


    // Third click resets destination
    resetDestination();

    destination = {
        lat: latitude,
        lng: longitude
    };


    destinationMarker = L.marker(
        [latitude, longitude],
        {
            icon: destinationIcon
        }
    )
    .addTo(map)
    .bindPopup("New Drop-off Location")
    .openPopup();


    dropText.value =
        formatCoordinates(latitude, longitude);


    instruction.textContent =
        "Pickup and drop-off selected ✓";


    calculateRide();

});


/* =========================
   FORMAT COORDINATES
========================= */

function formatCoordinates(lat, lng) {

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

}


/* =========================
   HAVERSINE DISTANCE
========================= */

function calculateDistance(point1, point2) {

    const R = 6371;

    const lat1 =
        point1.lat * Math.PI / 180;

    const lat2 =
        point2.lat * Math.PI / 180;


    const deltaLat =
        (point2.lat - point1.lat)
        * Math.PI / 180;


    const deltaLng =
        (point2.lng - point1.lng)
        * Math.PI / 180;


    const a =
        Math.sin(deltaLat / 2) ** 2
        +
        Math.cos(lat1)
        *
        Math.cos(lat2)
        *
        Math.sin(deltaLng / 2) ** 2;


    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


/* =========================
   CALCULATE RIDE
========================= */

function calculateRide() {

    if (!pickup || !destination) {
        return;
    }


    const distance =
        calculateDistance(
            pickup,
            destination
        );


    const fare =
        Math.max(
            40,
            30 + distance * selectedRide.rate
        );


    const duration =
        Math.max(
            5,
            Math.ceil(distance * 3)
        );


    distanceElement.textContent =
        `${distance.toFixed(2)} km`;


    fareElement.textContent =
        `₹${Math.round(fare)}`;


    durationElement.textContent =
        `${duration} min`;


    bookRideBtn.disabled = false;

}


/* =========================
   RIDE TYPE SELECTION
========================= */

const rideOptions =
    document.querySelectorAll(".ride-option");


rideOptions.forEach(option => {

    option.addEventListener("click", function () {

        rideOptions.forEach(item => {
            item.classList.remove("active");
        });


        this.classList.add("active");


        selectedRide = {

            type:
                this.dataset.type,

            rate:
                Number(this.dataset.rate)

        };


        calculateRide();

    });

});


/* =========================
   BOOK RIDE
========================= */

bookRideBtn.addEventListener(
    "click",
    function () {

        if (!pickup || !destination) {
            return;
        }


        bookRideBtn.disabled = true;

        bookRideBtn.textContent =
            "Finding Driver...";


        statusCard.classList.remove(
            "hidden"
        );


        driverName.textContent =
            "Finding nearby driver...";


        driverVehicle.textContent =
            selectedRide.type;


        rideStatus.textContent =
            "Ride Requested";


        etaElement.textContent =
            "Searching";


        statusDot.style.background =
            "#f59e0b";


        simulateRide();

    }
);


/* =========================
   SIMULATE RIDE
========================= */

function simulateRide() {

    // Stage 1
    setTimeout(() => {

        driverName.textContent =
            "Rahul Sharma";

        driverVehicle.textContent =
            `${selectedRide.type} • DL 4C AB 1234`;

        rideStatus.textContent =
            "Driver Assigned";

        etaElement.textContent =
            "5 min";

        statusDot.style.background =
            "#2563eb";


        addDriverMarker();

    }, 2000);


    // Stage 2
    setTimeout(() => {

        rideStatus.textContent =
            "Driver is on the way";

        etaElement.textContent =
            "3 min";

    }, 5000);


    // Stage 3
    setTimeout(() => {

        rideStatus.textContent =
            "Driver Arrived";

        etaElement.textContent =
            "Now";

        statusDot.style.background =
            "#16a34a";

    }, 9000);


    // Stage 4
    setTimeout(() => {

        rideStatus.textContent =
            "Ride Started";

        etaElement.textContent =
            "12 min";

        statusDot.style.background =
            "#2563eb";

    }, 13000);


    // Stage 5
    setTimeout(() => {

        rideStatus.textContent =
            "Ride Completed";

        etaElement.textContent =
            "Completed";

        statusDot.style.background =
            "#16a34a";


        bookRideBtn.textContent =
            "Book Another Ride";


        bookRideBtn.disabled = false;


        bookRideBtn.onclick =
            resetRide;

    }, 18000);

}


/* =========================
   ADD DRIVER MARKER
========================= */

function addDriverMarker() {

    if (driverMarker) {
        map.removeLayer(driverMarker);
    }


    // Start driver near pickup
    const driverLat =
        pickup.lat + 0.005;

    const driverLng =
        pickup.lng + 0.005;


    driverMarker =
        L.marker(
            [driverLat, driverLng],
            {
                icon: driverIcon
            }
        )
        .addTo(map)
        .bindPopup("Your Driver");


    map.setView(
        [driverLat, driverLng],
        14
    );

}


/* =========================
   RESET DESTINATION
========================= */

function resetDestination() {

    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

        destinationMarker = null;

    }


    destination = null;

    dropText.value = "";

}


/* =========================
   RESET ENTIRE RIDE
========================= */

function resetRide() {

    if (pickupMarker) {

        map.removeLayer(
            pickupMarker
        );

        pickupMarker = null;

    }


    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

        destinationMarker = null;

    }


    if (driverMarker) {

        map.removeLayer(
            driverMarker
        );

        driverMarker = null;

    }


    pickup = null;
    destination = null;


    pickupText.value = "";
    dropText.value = "";


    distanceElement.textContent =
        "0 km";

    fareElement.textContent =
        "₹0";

    durationElement.textContent =
        "0 min";


    instruction.textContent =
        "Click the map to select pickup location";


    statusCard.classList.add(
        "hidden"
    );


    bookRideBtn.textContent =
        "Book Ride";


    bookRideBtn.disabled = true;


    bookRideBtn.onclick = null;


    map.setView(
        defaultLocation,
        13
    );

}


/* =========================
   USE CURRENT LOCATION
========================= */

locationBtn.addEventListener(
    "click",
    function () {

        if (!navigator.geolocation) {

            alert(
                "Geolocation is not supported by your browser."
            );

            return;

        }


        locationBtn.textContent =
            "📍 Detecting...";


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const lat =
                    position.coords.latitude;

                const lng =
                    position.coords.longitude;


                map.setView(
                    [lat, lng],
                    15
                );


                // If pickup is not selected,
                // use current position as pickup
                if (!pickup) {

                    pickup = {
                        lat: lat,
                        lng: lng
                    };


                    pickupMarker =
                        L.marker(
                            [lat, lng],
                            {
                                icon: pickupIcon
                            }
                        )
                        .addTo(map)
                        .bindPopup(
                            "Your Pickup Location"
                        )
                        .openPopup();


                    pickupText.value =
                        formatCoordinates(
                            lat,
                            lng
                        );


                    instruction.textContent =
                        "Now click the map to select drop-off location";

                }


                locationBtn.textContent =
                    "📍 Use My Location";

            },


            function (error) {

                console.log(error);


                alert(
                    "Unable to get your location. Please allow location access."
                );


                locationBtn.textContent =
                    "📍 Use My Location";

            },

            {
                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0
            }

        );

    }
);