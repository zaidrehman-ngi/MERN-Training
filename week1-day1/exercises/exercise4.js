const DB = {
  members: { "m-1": { id: "m-1", name: "Aisha", branchId: "br-2" } },
  loans: { "m-1": ["Dune", "Neuromancer"] },
  fines: { "m-1": 170 },
  branches: { "br-2": "Clifton Branch" },
};

function get(store, key) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const value = DB[store][key];
      if (value === undefined)
        return reject(new Error(`${store}: ${key} not found`));
      resolve(value);
    }, 200);
  });
}

// Task 1

// async function loadCheckout(memberId) {
//   const member = await get("members", memberId);
//   const loans = await get("loans", member.id);
//   const fines = await get("fines", member.id);
//   const branch = await get("branches", member.branchId);

//   console.log(
//     `${member.name} - ${loans.length} books out, Rs ${fines} due, ${branch}`,
//   );
// }

// loadCheckout("m-1");

// Task 2

// async function loadCheckout(memberId) {
//   console.time("checkout");

//   const member = await get("members", memberId);
//   const loans = await get("loans", member.id);
//   const fines = await get("fines", member.id);
//   const branch = await get("branches", member.branchId);

//   console.log(
//     `${member.name} - ${loans.length} books out, Rs ${fines} due, ${branch}`,
//   );

//   console.timeEnd("checkout");
// }

// loadCheckout("m-1");

// Task 3

// function loadCheckout(memberId) {
//   return get("members", memberId)
//     .then((member) => {
//       return get("loans", member.id).then((loans) => {
//         return get("fines", member.id).then((fines) => {
//           return get("branches", member.branchId).then((branch) => {
//             console.log(
//               `${member.name} - ${loans.length} books out, Rs ${fines} due, ${branch}`,
//             );
//           });
//         });
//       });
//     })
//     .catch((err) => {
//       console.log(err.message);
//     });
// }

// loadCheckout("m-1");

// Task 5

// async function loadCheckout(memberId) {
//     console.time("checkout");

//     const member = await get("members", memberId);

//     const [loans, fines, branch] = await Promise.all([
//         get("loans", member.id),
//         get("fines", member.id),
//         get("branches", member.branchId)
//     ]);

//     console.log(
//         `${member.name} - ${loans.length} books out, Rs ${fines} due, ${branch}`
//     );

//     console.timeEnd("checkout");
// }

// loadCheckout("m-1");

// Task 7

// loadCheckout("m-404");

// Task 8

async function loadCheckout(memberId) {
  try {
    const member = await get("members", memberId);

    const [loans, fines, branch] = await Promise.all([
      get("loans", member.id),
      get("fines", member.id),
      get("branches", member.branchId),
    ]);

    console.log(
      `${member.name} - ${loans.length} books out, Rs ${fines} due, ${branch}`,
    );
  } catch (err) {
    console.log(`Could not load: ${err.message}`);
  }
}

loadCheckout("m-404");
