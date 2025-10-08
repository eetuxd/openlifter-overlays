const urlParams = new URLSearchParams(window.location.search);
const rotationTimeSeconds = parseInt(urlParams.get("rotation") || 15);
const authRequired = JSON.parse(urlParams.get("auth") || "true");
const entriesPerTable = parseInt(urlParams.get("entries_per_table") || 100);
const entriesGrouping = urlParams.get("entries_grouping") || "points";
const apiUrl = urlParams.get("apiurl") || "http://localhost:8080/theonlyway/Openlifter/1.0.0";
const apiKey = urlParams.get("apikey") || "441b6244-8a4f-4e0f-8624-e5c665ecc901";
const refreshTimeSeconds = parseInt(urlParams.get("refresh") || 1);

//uncomment this to make the table english
//var tableHeaders = ["Rank", "Lifter", "Class", /*"Body weight", "Age",*/ "Squat", "Bench", "Deadlift", "Total", "Points", "Prognosis"];
//uncomment this to make the table finnish
//var tableHeaders = ["Sijoitus", "Nostaja", "Painoluokka", "Kyykky", "Penkki", "Maastaveto", "Yhteistulos", "Pisteet", "Ennuste"];
var tableHeaders = [/*"Pisteet",*/ "Nostaja", "Kyykky", "Penkki", "Maastaveto", "Yhteistulos", "Pisteet"];

var inKgs = true; // default; will be updated by API response

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
  
  const coefficients = {
        "M": {
          "Sleeves": {
            "SBD": [1199.72839, 1025.18162, 0.009210],
            "B": [320.98041, 281.40258, 0.01008]
          },
          "Single-ply": {
            "SBD": [1236.25115, 1449.21864, 0.01644],
            "B": [381.22073, 733.79378, 0.02398]
          }
        },
        "F": {
          "Sleeves": {
            "SBD": [610.32796, 1045.59282, 0.03048],
            "B": [142.40398, 442.52671, 0.04724]
          },
          "Single-ply": {
            "SBD": [758.63878, 949.31382, 0.02435],
            "B": [221.82209, 357.00377, 0.02937]
          }
        }
      };

  
function getGL(bw, total, sex, equipment){
    //hardcoded to only work on SBD meets.
  var params = coefficients[sex][equipment]["SBD"];
  var denom = params[0] - (params[1] * Math.exp(-1.0 * params[2] * bw))
  var glp = (denom === 0) ? 0 : Math.max(0, total * 100.0 / denom)
  if (isNaN(glp) || bw < 35) {
    glp = 0;
  }
  return glp.toFixed(2);

}

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
    generateTable();
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
    //rare sight
    return 0;
  }
}

function kgToLbs(kgs) {
  return Math.floor(kgs * 2.20462);
}

function generateTableHead(table, headers) {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of headers) {
    let th = document.createElement("th");
    th.textContent = key;
    row.appendChild(th);
  }
}

function getMaxAttempt(lifts, status) {
  let max = 0;
  for(let i = 0; i < lifts.length; i++){
    if(lifts[i] > max && status[i] != -1){
      max = lifts[i];
    }
  }
  return max;
}

function generateRows(table, weightClass = null, data, chunk) {
  var rank = entriesPerTable * chunk + 1;
  let tbody = table.tBodies[0];
  for (let element of data) {
    let row = tbody.insertRow();
    let successfulSquatLifts = [];
    let successfulBenchLifts = [];
    let successfulDeadliftLifts = [];
    total = 0;

    for (let header of tableHeaders) {
      let cell = row.insertCell();
      cell.className = header;

      switch (header) {
        case "Rank":
        case "Sijoitus":
          cell.textContent = rank++;
          break;
        case "Lifter":
        case "Nostaja":
          cell.textContent = element.name;
          break;
        case "Class":
        case "Painoluokka":
          cell.textContent = weightClassify(element.bodyweightKg, element.sex, element.age) + "KG";
          break;
        case "Body weight":
        case "Kehonpaino":
          cell.textContent = element.bodyweightKg || "";
          break;
        case "Age":
        case "Ikä":
          cell.textContent = element.age || "";
          break;
        case "Squat":
        case "Kyykky":
          successfulSquatLifts = [];
          for (let i = 0; i < (element.squatStatus || []).length; i++) {
            if (element.squatStatus[i] === 1) successfulSquatLifts.push(element.squatKg[i]);
          }
          cell.textContent = successfulSquatLifts.length ? Math.max(...successfulSquatLifts) : 0;
          break;
        case "Bench":
        case "Penkki":
          successfulBenchLifts = [];
          for (let i = 0; i < (element.benchStatus || []).length; i++) {
            if (element.benchStatus[i] === 1) successfulBenchLifts.push(element.benchKg[i]);
          }
          cell.textContent = successfulBenchLifts.length ? Math.max(...successfulBenchLifts) : 0;
          break;
        case "Deadlift":
        case "Maastaveto":
          successfulDeadliftLifts = [];
          for (let i = 0; i < (element.deadliftStatus || []).length; i++) {
            if (element.deadliftStatus[i] === 1) successfulDeadliftLifts.push(element.deadliftKg[i]);
          }
          cell.textContent = successfulDeadliftLifts.length ? Math.max(...successfulDeadliftLifts) : 0;
          break;
        case "Total":
        case "Yhteistulos":
          let squatTotal = successfulSquatLifts.length ? Math.max(...successfulSquatLifts) : 0;
          let benchTotal = successfulBenchLifts.length ? Math.max(...successfulBenchLifts) : 0;
          let deadliftTotal = successfulDeadliftLifts.length ? Math.max(...successfulDeadliftLifts) : 0;
          total = squatTotal + benchTotal + deadliftTotal;
          if (inKgs) {
            cell.textContent = `${total} kg`;
          } else {
            cell.textContent = `${kgToLbs(total)} lb | ${total} kg`;
          }
          break;
        case "Points":
        case "Pisteet":
          //cell.textContent = element.points || 0;
          cell.textContent = getGL(element.bodyweightKg, total, element.sex, element.equipment);
          break;
        case "Prognosis":
        case "Ennuste":
          let squatMax = getMaxAttempt(element.squatKg, element.squatStatus);
          let benchMax = getMaxAttempt(element.benchKg, element.benchStatus);
          let deadliftMax = getMaxAttempt(element.deadliftKg, element.deadliftStatus);
          cell.textContent = squatMax + benchMax + deadliftMax || 0;
          break;
        default:
          cell.textContent = "";
      }
    }
  }
}

function generateTitle(sex, weightClass = null) {
  
  let description;
  if (sex = "female"){
    description = document.getElementById("leaderboardDescriptionFemale");
  }
  if (sex = "male"){
    description = document.getElementById("leaderboardDescriptionMale");
  }
  if (entriesGrouping === "class") {
    description.textContent = `Sex: ${sex} | Class: ${weightClass}`;
  } else if (entriesGrouping === "points") {
    description.textContent = `${sex} by points`;
  } else {
    description.textContent = "";
  }
}

async function handleTableLoop(table, data, sex) {
  //grouping lifters by class does not currently work.
  if (entriesGrouping === "class") {
    for (const sex in data) {
      for (const index in data[sex]) {
        let sortedEntries = data[sex][index].entries.sort((a, b) => b.points - a.points);
        const chunkedData = chunkArray(sortedEntries, entriesPerTable);

        for (let chunk = 0; chunk < chunkedData.length; chunk++) {
          const chunkEntries = chunkedData[chunk];
          const newTable = document.createElement("table");
          generateTableHead(newTable, tableHeaders);
          newTable.createTBody();
          generateRows(newTable, data[sex][index].weightClass, chunkEntries, chunk);
          generateTitle(sex, data[sex][index].weightClass);

          table.replaceWith(newTable);
          table = newTable;
        }
      }
    }
  } else if (entriesGrouping === "points") {
      const combined = data["female"].concat(data["male"]);
      let sortedEntries = combined.sort((a, b) => b.points - a.points);
      const chunkedData = chunkArray(sortedEntries, entriesPerTable);
      for (let chunk = 0; chunk < chunkedData.length; chunk++) {
        const chunkEntries = chunkedData[chunk];
        const newTable = document.createElement("table");
        generateTableHead(newTable, tableHeaders);
        newTable.createTBody();
        generateRows(newTable, null, chunkEntries, chunk);
        newTable.id = table.id;
        //let d = document.getElementById("leaderboardDescription" + sex.charAt(0).toUpperCase() + sex.slice(1));
        //d.textContent = sex === "female" ? "Naiset" : "Miehet";
        table.replaceWith(newTable);
        table = newTable;
      }
    }
}

// Helper to chunk array into smaller arrays of given size
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateTable() {
  //var tableFemale = document.getElementById("leaderboardTableFemale");
  var tableMale = document.getElementById("leaderboardTableMale");
  let fetchHeaders = authRequired
    ? {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };

  try {
    const response = await fetch(apiUrl + "/lifter/results?entries_filter=" + entriesGrouping, {
      method: "GET",
      headers: fetchHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    inKgs = data.inKg ?? true;
    delete data["inKg"];

    //await handleTableLoop(tableFemale, data, "female");
    await handleTableLoop(tableMale, data, "male");
  } catch (error) {
    console.error("Failed to fetch or render leaderboard data:", error);
  }
}

// Start the table generation on page load
window.onload = () => {
  generateTable();
  startTimer(refreshTimeSeconds);
};
