const api = "AIzaSyCnBj6vF2SHcbPUvqvnQa5v-r_Jfgbq0D4";


let lat = 0;
let lon = 0;

let temp = 0;
let rain = 0;
let wind = 0;
let name = "Location Not Found ";
var rainyChance = 0;
var sunnyChance = 0;

let nameElement = document.getElementById("mainItem0");
let timeElement = document.getElementById("mainItem4");
let tempElement = document.getElementById("mainItem1");
let rainElement = document.getElementById("mainItem2");
let windElement = document.getElementById("mainItem3");

const locationIcon = document.getElementById("location");
const tempIcon = document.getElementById("temp");
const rainIcon = document.getElementById("rain");
const windIcon = document.getElementById("wind");

let more_section = document.getElementById("more");

let temperatureTab = document.getElementById("temperature-tab");
let precipitationTab = document.getElementById("precipitation-tab");

let days = [];
let temps = [];
let rains = [];
let winds = [];
let rain_chance = [];

function myMap() {
    var mapProp= {
      center:new google.maps.LatLng(6.927119564978959, 79.8591225757864),
      zoom:9,
    };
    var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);

    google.maps.event.addListener(map, 'click', function(event) {
        placeMarker(map, event.latLng);
      });
      
    function placeMarker(map, location) {
        var marker = new google.maps.Marker({
          position: location,
          map: map
        });
        /* var infowindow = new google.maps.InfoWindow({
          content: 'Latitude: ' + location.lat() +
          '<br>Longitude: ' + location.lng()
        });
        infowindow.open(map,marker); */
        lat = location.lat();
        lon = location.lng();
        more_section.style.visibility = "hidden";
        getCurrentWeather();
    }
}


setInterval(function(){
  let today = new Date();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  timeElement.innerHTML = time;
},1000);

function getCurrentWeather(){
  days = [];
  temps = [];
  rains = [];
  winds = [];
  rain_chance = [];
  fetch(`http://api.weatherapi.com/v1/current.json?key=5936c69e951c4f53adf70011231108&q=${lat},${lon}&aqi=no`)
  .then((response) => response.json())
  .then((data) => {
    //console.log(json);
    temp = data.current.temp_c;
    rain = data.current.precip_mm;
    wind = data.current.wind_kph;
    name = data.location.name;
    cond = data.current.condition.text;

    nameElement.innerHTML = name;
    tempElement.innerHTML = temp+"°C";
    rainElement.innerHTML = rain+"mm";
    windElement.innerHTML = wind+"km/h";

    locationIcon.style.visibility = "visible";
    tempIcon.style.visibility = "visible";
    rainIcon.style.visibility = "visible";
    windIcon.style.visibility = "visible";
    
    setWeatherBackground(cond);
    getHistoryWeather();
    getForecastWeather();
    setActiveTab(temperatureTab);
    try {
      
      generateChart(days, temps, "red");
    } catch (error) {
      
      console.error("An error occurred while generating the chart:");
      
    }
    more_section.style.visibility = "visible";
})
.catch(error => {
  alert("Error at getting weather data");
});
}

function getForecastWeather(){

  fetch(`http://api.weatherapi.com/v1/forecast.json?key=5936c69e951c4f53adf70011231108&q=${lat},${lon}&days=3&aqi=no&alerts=no`)
  .then((response) => response.json())
  .then((data) => {
    data.forecast.forecastday.forEach(day => {
      days.push(day.date);
      temps.push(day.day.avgtemp_c);
      rains.push(day.day.totalprecip_mm);
      winds.push(day.day.maxwind_kph);
      rain_chance.push(Number(day.day.daily_chance_of_rain));
    })
    
    //console.log(rain_chance[0]);
    generateDonutChart(rain_chance);
  })
  .catch(error => {
    alert("Error at getting forecast");
  });
}

function getHistoryWeather() {
  
  let pastSevenDays = getPastSevenDays();
  let promises = pastSevenDays.map(date => {
      return fetch(`http://api.weatherapi.com/v1/history.json?key=5936c69e951c4f53adf70011231108&q=${lat},${lon}&dt=${date}`)
          .then(response => response.json())
          .then(data => {
              if (data.forecast && data.forecast.forecastday && data.forecast.forecastday.length > 0) {
                  return {
                      date: data.forecast.forecastday[0].date,
                      temp: data.forecast.forecastday[0].day.avgtemp_c,
                      rain: data.forecast.forecastday[0].day.totalprecip_mm,
                      wind: data.forecast.forecastday[0].day.maxwind_kph
                  };
              } else {
                  return null;
              }
          })
          .catch(error => {
              alert("Error at getting forecast");
              return null;
          });
  });

  Promise.all(promises)
      .then(results => {
          results.forEach(result => {
              if (result) {
                  days.push(result.date);
                  temps.push(result.temp);
                  rains.push(result.rain);
                  winds.push(result.wind);
              }
          });
      });
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    nameElement.innerHTML = "Location Not Found";
  }
}

function showPosition(position) {
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  more_section.style.visibility = "hidden";
  getCurrentWeather();
}

function setWeatherBackground(weatherCondition) {
  const weatherImg = document.getElementById('weatherImg');
  
  let imageUrl;
  if(weatherCondition.toLowerCase().includes('sun')){
    imageUrl = './img/sunny.jpg';
  }
  else if(weatherCondition.toLowerCase().includes('rain')){
    imageUrl = './img/rainy.jpg';
  }
  else if(weatherCondition.toLowerCase().includes('cloud')){
    imageUrl = './img/cloudy.jpg';
  }
  else if(weatherCondition.toLowerCase().includes('clear')){
    imageUrl = './img/clear.jpg';
  }
  else if(weatherCondition.toLowerCase().includes('sleet')){
    imageUrl = './img/sleet.jpg';
  }
  else if(weatherCondition.toLowerCase().includes('snow')){
    imageUrl = './img/snow.jpg';
  }
  else{
    imageUrl = './img/windy.jpg';
  }
  
  
  weatherImg.style.backgroundImage = `url(${imageUrl})`;
}

function generateChart(days,data_set,color){
  
  let xValues = days;

  new Chart("myChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{ 
        data: data_set,
        borderColor: color,
        fill: true,
        backgroundColor: getGradientColor("myChart", color)
      }]
    },
    options: {
      legend: {display: false}
    }
  })
  
}

function getPastSevenDays() {
  let pastDays = [];
  let today = new Date();

  for (let i = 6; i > 0; i--) {
      let pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      pastDays.push(pastDate.toISOString().slice(0, 10));
  }

  return pastDays;
}

function getGradientColor(chartId, color) {
  var ctx = document.getElementById(chartId).getContext("2d");
  var gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  return gradient;
}



temperatureTab.addEventListener("click", function() {
    
    try {
      setActiveTab(temperatureTab);
      generateChart(days, temps, "red");
    } catch (error) {
      
      console.error("An error occurred while generating the chart:");
      
    }
});

precipitationTab.addEventListener("click", function() {
    
    try {
      setActiveTab(precipitationTab);
      generateChart(days, rains, "blue");
    } catch (error) {
      
      console.error("An error occurred while generating the chart:");
    }
});


function setActiveTab(tab) {
    
    let navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(function(link) {
        link.classList.remove("active");
    });

    
    tab.classList.add("active");
}



function generateDonutChart(rain_chance){
  let today = new Date();
  rainyChance = Number(rain_chance[0]);
  sunnyChance = Number(100-rain_chance[0]);
  let day = today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate();
  let xValues = ["Sunny","Rainy"];
  let yValues = [sunnyChance,rainyChance];
  let barColors = [
    "#FF9933",
    "#3374FF"
  ];

  new Chart("myChart2", {
    type: "doughnut",
    data: {
      labels: xValues,
      datasets: [{
        backgroundColor: barColors,
        data: yValues
      }]
    },
    options: {
      title: {
        display: true,
        text: `Weather Probability of ${day}`
      }
    }
  });
}

