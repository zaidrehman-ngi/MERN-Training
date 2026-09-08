const aisha = {
  id: "m-4471",
  name: { first: "Aisha", last: "Khan" },
  membership: { tier: "gold", joined: 2021 },
  borrowed: ["Dune", "Neuromancer", "Snow Crash"],
  contact: { email: "aisha@lib.pk" },
};

const omar = {
  id: "m-9002",
  name: { first: "Omar", last: "Sethi" },
  borrowed: [],
  contact: {},
};

// Task 1
const { first: firstName, last: lastName } = aisha.name;
console.log(firstName);
console.log(lastName);

// Task 2
// const { tier } = aisha.membership;
// console.log(tier);

// const { tier } = omar.membership;
// console.log(tier);

function getTier(member) {
  const { tier = "basic" } = member.membership || {};
  return tier;
}
console.log(getTier(aisha));
console.log(getTier(omar));

// Task 3
function getPhone(member) {
  const { phone = "none on file" } = member.contact;
  return phone;
}
console.log(getPhone(aisha));
console.log(getPhone(omar));

// Task 4
const [firstBook, ...otherBooks] = aisha.borrowed;

console.log(firstBook);
console.log(otherBooks);

// Task 5 and Task 6
function printCard({
  id,
  name,
  membership: { tier = "basic" } = {},
  borrowed,
  contact: { email = "none on file", phone = "none on file" },
}) {
  const [latest = "none"] = borrowed;

  console.log(`CARD ${id}`);
  console.log(`${name.first} ${name.last} (${tier})`);
  console.log(`Books out: ${borrowed.length} — latest: ${latest}`);
  console.log(`Contact: ${email} / ${phone}`);
}

printCard(aisha);
printCard(omar);

// Task 7
const updatedAisha = structuredClone(aisha);
updatedAisha.membership.tier = "platinum";

console.log(updatedAisha);
console.log(aisha);

// Task 8
function countBooks(...titles) {
  return titles.length;
}

console.log(countBooks(...aisha.borrowed));
