//save data
let searchedCities = [];

//one call api key
let oneCallApiKey = "c271cbbc5f9e0287d1957ce5750e8ccf";

//variables
let currentCity = "";
let date = luxon.DateTime.local();
//form
let formInputEl = $("#city-input");
let searchBtnEl = $("#search-button");
//search history
let searchHistoryEl = $("#search-history");
//current weather
let currentWeatherEl = $("#current-weather");
//forecast
let forecastContainerEl = $("#forecast-container");

//handles getting the entered city
let citySearchHandler = (event) => {
  //prevent page from reloading
  event.preventDefault();

  //get typed-in city
  let city = formInputEl.val();

  //assigning the lowercase city to a temp string
  let tempStr = city.toLowerCase().slice();
  //creating an array with each word typed
  const tempArr = tempStr.split(" ");
  //loop to capitalize the first letter of each word
  for (let i = 0; i < tempArr.length; i++) {
    tempArr[i] = tempArr[i].charAt(0).toUpperCase() + tempArr[i].slice(1);
  }
  //returning the words in the array to a single string
  city = tempArr.join(" ");

  //sets current city for dashboard
  currentCity = city;
  //reset form
  formInputEl.val("");

  //updates the search history
  searchHistoryHandler(city);
  //send a request for city geolocation data
  fetchCityGeolocation(city);
};

//handles searching by clicking a city in the history
let historicSearch = (event) => {
  //gets what is being clicked
  let target = $(event.target);
  //ensures the target is a button
  if (target.is("button")) {
    //gets the inner text (city name)
    currentCity = target[0].innerText;
    //adds to the search history and sends to the geolocator
    if (currentCity !== searchedCities[0]) {
      searchHistoryHandler(currentCity);
    }
    fetchCityGeolocation(currentCity);
  }
};

//keeps an array of the past 8 searches
let searchHistoryHandler = (city) => {
  //adds the city to the start of the array
  searchedCities.unshift(city);
  //slices newest 8 searches
  searchedCities = searchedCities.slice(0, 8);
  //saves to local and updates search history
  saveSearchHistory();
  createSearchHistory();
};

//creates search history
//seperated from handler to load in without adding the last city to the list again
let createSearchHistory = () => {
  searchHistoryEl.empty();

  //creates the search history as buttons
  for (let i = 0; i < searchedCities.length; i++) {
    let cityButton = $(
      "<button class='btn btn-secondary'>" + searchedCities[i] + "</button>"
    );
    searchHistoryEl.append(cityButton);
  }
};

//uses geolocation api to get the coordinates of typed in city
let fetchCityGeolocation = (city) => {
  //variable to hold api for fetch
  let geolocationApi =
    "https://api.openweathermap.org/geo/1.0/direct?q=" +
    city +
    "&appid=" +
    oneCallApiKey;

  //fetches the data
  fetch(geolocationApi).then(function (response) {
    //checks whether the fetch was successful
    if (response.ok) {
      response.json().then(function (data) {
        //checks to ensure there is data returned
        if (data.length === 0) {
          alert("Error: City Not Found");
          return;
        }
        //assigns the latitude and longitude
        let longitude = data[0].lon;
        let latitude = data[0].lat;
        fetchCityWeather(latitude, longitude);
      });
    } else {
      alert("Error: Unable to Fetch Data");
      return;
    }
  });
};

let fetchCityWeather = (cityLat, cityLon) => {
  let lat = cityLat;
  let lon = cityLon;

  //plugs in lat and lon to the weather api
  let oneCallWeatherApi =
    "https://api.openweathermap.org/data/2.5/onecall?lat=" +
    lat +
    "&lon=" +
    lon +
    "&units=imperial" +
    "&appid=" +
    oneCallApiKey;

  //fetches the data with the weather api
  fetch(oneCallWeatherApi).then(function (response) {
    if (response.ok) {
      response.json().then(function (data) {
        createWeatherPanel(data);
      });
    } else {
      alert("Error: Unable to Fetch Data");
    }
  });
};

//handles dynamic creation of weather dashboard
let createWeatherPanel = (cityData) => {
  //clear the current weather element
  currentWeatherEl.empty();

  //data for the current weather element
  let currentDate = " (" + date.toLocaleString() + ")";
  let currentIcon = cityData.current.weather[0].icon;
  let currentTemp = cityData.current.temp + "&#176;F";
  let currentWindSpeed = cityData.current.wind_speed + " MPH";
  let currentHumidity = cityData.current.humidity + " %";
  let currentUvi = cityData.current.uvi;
  //selects the container to appent to
  let containerEl = $("#current-weather");
  //appends the h2 containing city, date, and image
  containerEl.append(
    "<h2 class='col-12'>" +
      currentCity +
      currentDate +
      "<img src='https://openweathermap.org/img/wn/" +
      currentIcon +
      "@2x.png' />" +
      "</h2>"
  );
  //appends the container to the current weather div
  containerEl.append(containerEl);
  //appends the current weather data to the weather div
  containerEl.append("<p class='col-12'>Temp: " + currentTemp + "</p>");
  containerEl.append("<p class='col-12'>Wind: " + currentWindSpeed + "</p>");
  containerEl.append("<p class='col-12'>Humidity: " + currentHumidity + "</p>");

  //assigns the class based on the uv index
  let indexSeverity = "";
  if (currentUvi <= 2.5) {
    indexSeverity = "bg-success";
  } else if (currentUvi <= 5.5) {
    indexSeverity = "bg-warning";
  } else {
    indexSeverity = "bg-danger";
  }
  //appends the uvi with the appropriate bg to the weather div
  containerEl.append(
    "<p class='col-12'>UV Index: " +
      `<span class="uvi badge ${indexSeverity}">` +
      currentUvi +
      "</span>"
  );

  //five day forecast
  //empties the element
  forecastContainerEl.empty();
  //for loop to add the next five days
  for (let i = 1; i <= 5; i++) {
    //creates the container
    let dayContainerEl = $(
      "<div class='row col-12 col-lg mb-2 mr-2 forecast-day'></div>"
    );

    //does not include right margin on the final column
    if (i === 5) {
      dayContainerEl = $(
        "<div class='row col-12 col-lg mb-2 forecast-day'></div>"
      );
    }

    //variables with data from fetched object and date calculations
    let forecastDate = date.plus({ day: i }).toLocaleString();
    let forecastIcon = cityData.daily[i].weather[0].icon;
    let forecastMaxTemp = cityData.daily[i].temp.max;
    let forecastMinTemp = cityData.daily[i].temp.min;
    let forecastWindSpeed = cityData.daily[i].wind_speed;
    let forecastHumidity = cityData.daily[i].humidity;
    //variable for classes for paragraphs
    let paragraphClasses = "col-5 col-md-3 col-lg-12 p-1";

    //appending all of the data to each forecast day
    //h4 containting the date
    dayContainerEl.append("<h4 class='col-12 p-1'>" + forecastDate + "</h4>");
    //div to hold image element
    dayContainerEl.append(
      "<div class='col-12 p-1'>" +
        "<img src='https://openweathermap.org/img/wn/" +
        forecastIcon +
        "@2x.png' />" +
        "</div>"
    );
    //max temp
    dayContainerEl.append(
      `<p class='${paragraphClasses}'>High: ` + forecastMaxTemp + "&#176;F</p>"
    );
    //min temp
    dayContainerEl.append(
      `<p class='${paragraphClasses}'>Low: ` + forecastMinTemp + "&#176;F</p>"
    );
    //wind speed
    dayContainerEl.append(
      `<p class='${paragraphClasses}'>Wind: ` + forecastWindSpeed + " MPH</p>"
    );
    //humidity
    dayContainerEl.append(
      `<p class='${paragraphClasses}'>Humidity: ` + forecastHumidity + "%</p>"
    );

    //appending each day to the 5-day container
    forecastContainerEl.append(dayContainerEl);
  }
};

//saves the search history to local storage
let saveSearchHistory = () => {
  //turns the array into a string
  localStorage.setItem("history", JSON.stringify(searchedCities));
};

//loads the search history from local storage
let loadSearchHistory = () => {
  //returns the data from its stringified version
  searchedCities = JSON.parse(localStorage.getItem("history"));

  //if there is nothing in localstorage, it stops here
  if (!searchedCities) {
    //starts with a clean array
    searchedCities = [];
    return;
  }

  //takes the previously searched city and displays it on the page
  currentCity = searchedCities[0];
  fetchCityGeolocation(currentCity);
  createSearchHistory();
};

//event handlers
searchBtnEl.on("click", citySearchHandler);
searchHistoryEl.on("click", historicSearch);

//initial load from local storage
loadSearchHistory();