const { calculateLateFine, formatRupees } = require("./fines.cjs");

const fine = calculateLateFine(5);

console.log(formatRupees(fine));
