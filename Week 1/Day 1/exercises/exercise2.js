const FINE_PER_DAY = 20;

const loans = [
  { title: "Dune", daysLate: 3, tier: "gold", damaged: false },
  { title: "Neuromancer", daysLate: 0, tier: "basic", damaged: false },
  { title: "Snow Crash", daysLate: 7, tier: "basic", damaged: false },
  { title: "Foundation", daysLate: 2, tier: "staff", damaged: false },
  { title: "Hyperion", daysLate: 5, tier: "gold", damaged: true },
  { title: "Ubik", daysLate: 1, tier: "basic", damaged: false },
];

// Task 1
function multiplier(tier) {
  switch (tier) {
    case "gold":
      return 0.5;
    case "staff":
      return 0;
    case "basic":
      return 1;
    default:
      console.log("Warning!!! Unknown tier:", tier);
      return 1;
  }
}

// Task 2
for (let i = 0; i < loans.length; i++) {
  if (loans[i].daysLate === 0) {
    continue;
  }

  console.log(loans[i].title);
}

// Task 3
for (let i = 0; i < loans.length; i++) {
  if (loans[i].damaged) {
    console.log(loans[i].title, "-- needs manual review!!");
    break;
  }
}

// Task 4
let total = 0;

for (let i = 0; i < loans.length; i++) {
  if (loans[i].daysLate === 0) {
    continue;
  }

  if (loans[i].damaged) {
    console.log("STOPPED — needs review:", loans[i].title);
    break;
  }

  let fine = loans[i].daysLate * FINE_PER_DAY * multiplier(loans[i].tier);
  console.log(loans[i].title, ": Rs", fine);
  total += fine;
}

console.log("Total: Rs " + total);

// Task 6
function multiplier(tier) {
  if (tier === "gold") {
    return 0.5;
  } else if (tier === "staff") {
    return 0;
  } else if (tier === "basic") {
    return 1;
  } else {
    console.log("Warning!!! Unknown tier:", tier);
    return 1;
  }
}
