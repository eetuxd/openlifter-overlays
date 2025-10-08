const urlParams = new URLSearchParams(window.location.search);
const refreshTimeSeconds = parseInt(urlParams.get("refresh") || 1);
const platform = parseInt(urlParams.get("platform") || 1);
const lifterType = urlParams.get("lifter") || "current";
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

function weightClassify(bw, sex, age){
  if(sex == 'M') {
    //Warning: code below does not take onto account that a lifter could be 23 but not a junior. 
    if(age <= 23 && bw <= 53){
      return "-53";
    }
    for (const maleClass of maleClasses) {
    if (bw <= maleClass.max) return maleClass.label;
    }
  }
  else if(sex == 'F') {
    //Warning: code below does not take onto account that a lifter could be 23 but not a junior. 
    if(age <= 23 && bw <= 43){
      return "-43";
    }
    for (const femaleClass of femaleClasses) {
    if (bw <= femaleClass.max) return femaleClass.label;
    }
  }
  else {
    return 0;
  }
}

function getMaxLift(kg, status){
  let maxlift = 0;
  for(let i = 0; i<3; i++) {
    if(status[i] == 1) {
      maxlift = kg[i];
    }
  }
  return maxlift;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function convertToPounds(kg) {
  return Math.round(kg * 2.2046);
}

function setAttemptColors(data) {
  var currentLiftElement = document.getElementById("lifterAttempt" + data.attempt);
  currentLiftElement.classList.add("currentLift");
  for (let i = 1; i <= 3; ++i) {
    element = document.getElementById("lifterAttempt" + i);
    element.classList.remove("goodLift");
    element.classList.remove("badLift");
    if (i !== data.attempt) {
      element = document.getElementById("lifterAttempt" + i);
      element.classList.remove("currentLift");
      switch (data.platformDetails.lift) {
        case "S":
          if (data.entry.squatStatus[i - 1] === 1) {
            element = document.getElementById("lifterAttempt" + i);
            element.classList.add("goodLift");
          } else {
            if (data.entry.squatKg[i - 1] !== 0) {
              element = document.getElementById("lifterAttempt" + i);
              element.classList.add("badLift");
            }
          }
          break;
        case "D":
          if (data.entry.deadliftStatus[i - 1] === 1) {
            element = document.getElementById("lifterAttempt" + i);
            element.classList.add("goodLift");
          } else {
            if (data.entry.deadliftKg[i - 1] !== 0) {
              element = document.getElementById("lifterAttempt" + i);
              element.classList.add("badLift");
            }
          }
          break;
        case "B":
          if (data.entry.benchStatus[i - 1] === 1) {
            element = document.getElementById("lifterAttempt" + i);
            element.classList.add("goodLift");
          } else {
            if (data.entry.benchKg[i] !== 0) {
              element = document.getElementById("lifterAttempt" + i);
              element.classList.add("badLift");
            }
          }
          break;
      }
    }
  }
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

      switch (data.platformDetails.lift) {
        case "S":
          lift = "Kyykky";
          lifterAttemptKgs1 = data.entry.squatKg[0] || "-";
          lifterAttemptKgs2 = data.entry.squatKg[1] || "-";
          lifterAttemptKgs3 = data.entry.squatKg[2] || "-";

          break;
        case "D":
          lift = "Maastaveto";
          lifterAttemptKgs1 = data.entry.deadliftKg[0] || "-";
          lifterAttemptKgs2 = data.entry.deadliftKg[1] || "-";
          lifterAttemptKgs3 = data.entry.deadliftKg[2] || "-";
          break;
        case "B":
          lift = "Penkkipunnerrus";
          lifterAttemptKgs1 = data.entry.benchKg[0] || "-";
          lifterAttemptKgs2 = data.entry.benchKg[1] || "-";
          lifterAttemptKgs3 = data.entry.benchKg[2] || "-";
          break;
      }

      let maxSquat = getMaxLift(data.entry.squatKg, data.entry.squatStatus);
      let maxBench = getMaxLift(data.entry.benchKg, data.entry.benchStatus);
      let maxDeadLift = getMaxLift(data.entry.deadliftKg, data.entry.deadliftStatus);
      let total = maxSquat + maxBench + maxDeadLift;

      document.getElementById("lifterName").innerHTML = data.entry.name;
      document.getElementById("lifterAttempt1").innerHTML = lifterAttemptKgs1;
      document.getElementById("lifterAttempt2").innerHTML = lifterAttemptKgs2;
      document.getElementById("lifterAttempt3").innerHTML = lifterAttemptKgs3;
      document.getElementById("lifterMaxWeightSquat").innerHTML = "Kyykky: " + maxSquat;
      document.getElementById("lifterMaxWeightBench").innerHTML = "Penkki: " + maxBench;
      document.getElementById("lifterMaxWeightDeadlift").innerHTML = "Maastaveto: " + maxDeadLift;
      //document.getElementById("lifterWeightClass").innerHTML = weightClassify(data.entry.bodyweightKg, data.entry.sex, data.entry.age) + "KG";
      document.getElementById("lifterDivisions").innerHTML = data.entry.instagram;
      document.getElementById("lifterResultTotal").innerHTML = data.entry.points;
      setAttemptColors(data);
    });
}
getCurrentLifter();
startTimer(refreshTimeSeconds);
