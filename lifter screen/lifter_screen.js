const urlParams = new URLSearchParams(window.location.search);
const refreshTimeSeconds = parseInt(urlParams.get("refresh") || 1);
const platform = parseInt(urlParams.get("platform") || 1);
const lifterType = urlParams.get("lifter") || "current";
const lifterTypeNext = urlParams.get("lifter") || "next";
const authRequired = JSON.parse(urlParams.get("auth") || true);
const apiUrl = urlParams.get("apiurl") || "http://localhost:8080/theonlyway/Openlifter/1.0.0";
const apiKey = urlParams.get("apikey") || "441b6244-8a4f-4e0f-8624-e5c665ecc901";

const femaleClasses = [
    { max: 47, label: "-47" },
    { max: 52, label: "-52" },
    { max: 57, label: "-57" },
    { max: 63, label: "-63" },
    { max: 69, label: "-69" },
    { max: 76, label: "-76" },
    { max: 84, label: "-84" },
    { max: Infinity, label: "+84" }
  ];

const maleClasses = [
    { max: 59, label: "-59" },
    { max: 66, label: "-66" },
    { max: 74, label: "-74" },
    { max: 83, label: "-83" },
    { max: 93, label: "-93" },
    { max: 105, label: "-105" },
    { max: 120, label: "-120" },
    { max: Infinity, label: "+120" }
];

const weightPlates=[
  {id: "kg25", weightKg: 25}, //comment this out if using 20s instead of 25s
  {id: "kg20", weightKg: 20},
  {id: "kg15", weightKg: 15},
  {id: "kg10", weightKg: 10},
  {id: "kg5", weightKg: 5},
  {id: "kg2p5", weightKg: 2.5},
  {id: "kg1p25", weightKg: 1.25},
  {id: "kg0p5", weightKg: 0.5},
  {id: "kg0p25", weightKg: 0.25},
];

var timeInSecs;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ticker;
var fetchHeaders = {};

function startTimer(secs) {
  timeInSecs = parseInt(secs);
  ticker = setInterval("tick()", 1000);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function tick() {
  var secs = timeInSecs;
  if (secs > 0) {
    timeInSecs--;
    console.log("Refresh in " + secs);
  } else {
    getCurrentLifter();
    console.log("Refreshed");
    timeInSecs = refreshTimeSeconds;
  }
}

var lift_timer_time = 60000;
var timerInterval;
var timerStarted = false;

function renderLiftTimer(){
  var time_in_minutes = Math.floor(lift_timer_time / 60000);
  var seconds_left = Math.floor((lift_timer_time % 60000) / 1000);
  let viewable_time;
  if (time_in_minutes < 10){
    viewable_time = "0" + time_in_minutes + ":";
  }
  else {
    time_in_minutes + " : ";
  }
  if (seconds_left < 10){
    viewable_time = viewable_time.concat("0" + seconds_left);
  }
  else {
    viewable_time = viewable_time.concat(seconds_left);
  }
  return viewable_time;
}

function startLiftTimer(){
  if (!timerStarted){ 
    timerStarted = true;
    //setInterval(function () {lift_timer_time = lift_timer_time - 1000}, 1000);
    let count = 0;
    timerInterval = setInterval(() => {
      console.log(count);
      lift_timer_time = lift_timer_time - 1000
      getLiftTimer();
      count++;
      if (count >= 60){
        clearInterval(timerInterval);
        lift_timer_time = 60000;
        timerStarted = false;
      }
    }, 1000);
  }
}

function getLiftTimer() {
  document.getElementById("liftTimer").innerHTML = renderLiftTimer();
}

function resetLiftTimer(){
  clearInterval(timerInterval);
  lift_timer_time = 60000;
  timerStarted = false;
  getLiftTimer();
}

function pauseLiftTimer(){
  clearInterval(timerInterval);
  timerStarted = false;
  getLiftTimer();
}

//Warning: code below does not take onto account that a lifter could be 23 but not a junior. 
function weightClassify(bw, sex, age){
  if(sex == 'M') { 
    if(age <= 23 && bw <= 53){
      return "-53";
    }
    for (const maleClass of maleClasses) {
    if (bw <= maleClass.max) return maleClass.label;
    }
  }
  else if(sex == 'F') {
    if(age <= 23 && bw <= 43){
      return "-43";
    }
    for (const femaleClass of femaleClasses) {
    if (bw <= femaleClass.max) return femaleClass.label;
    }
  }
  else {return 0;}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function convertToPounds(kg) {
  return Math.round(kg * 2.2046);
}

function addBar(){
  let b = document.createElement("div");
  b.classList.add("bar");
  document.getElementById("barLoad").appendChild(b);
}

function getBarLoad(weight){
  document.getElementById("barLoad").innerHTML = "";
  addBar();
  //How much weight is in each side
  let weight_left = (weight - 25) /2;
  for (var plate of weightPlates){
    //How many of this plate type
    let plates = Math.floor(weight_left / plate.weightKg);
    let remainder = weight_left % plate.weightKg;
    //Adds plates of plate type to the bar
    for (let i = 0; i < plates;  i++){
      let p = document.createElement("div");
      p.classList.add(plate.id);
      p.id = plate.id;
      p.textContent = plate.weightKg;
      document.getElementById("barLoad").appendChild(p);
    }
    weight_left = remainder;
  }
  let collar = document.createElement("div");
  collar.classList.add("collar");
  document.getElementById("barLoad").appendChild(collar);
  addBar();
}

function getCurrentLifter() {
  if (authRequired == true) {
    fetchHeaders = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };
  } else {
    fetchHeaders = {
      "Content-Type": "application/json",
    };
  }
  fetch(apiUrl + "/lifter/" + platform + "/" + lifterType, {
    method: "GET",
    headers: fetchHeaders,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched data:", data);
      var lift;
      var barweight;
      var rack="";
      switch (data.platformDetails.lift) {
        case "S":
          lift = "Kyykky";
          barweight = data.entry.squatKg[data.attempt-1];
          rack= "Rack: " + data.entry.squatRackInfo;
          break;
        case "D":
          lift = "Maastaveto";
          barweight = data.entry.deadliftKg[data.attempt-1];
          rack="";
          break;
        case "B":
          lift = "Penkkipunnerrus";
          barweight = data.entry.benchKg[data.attempt-1];
          rack="Rack: " + data.entry.benchRackInfo;
          break;
      }
      getBarLoad(barweight);
      document.getElementById("attemptWeight").innerHTML = barweight + "KG";
      document.getElementById("lifterName").innerHTML = data.entry.name;
      document.getElementById("lifterAttempt").innerHTML = lift + " " + data.attempt;
      document.getElementById("lifterInfo").innerHTML = data.entry.instagram;
      //weightClassify(data.entry.bodyweightKg, data.entry.sex, data.entry.age) + " " + data.entry.divisions.join(", ");
      document.getElementById("rackInfo").innerHTML = rack;
    });
}

getCurrentLifter();
startTimer(refreshTimeSeconds);
document.addEventListener("DOMContentLoaded", () => {
  getLiftTimer();
});

window.addEventListener("keydown", (event) => {    
    if (event.key === " ") {
      console.log("space");
      startLiftTimer();
    };

    if (event.key === "p") {
      pauseLiftTimer();
    };

    if (event.key === "r") {
      resetLiftTimer();
    };
  });
