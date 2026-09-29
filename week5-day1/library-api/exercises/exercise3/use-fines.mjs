import { calculateLateFine, formatRupees } from "./fines.mjs";

const fine = calculateLateFine(5);

console.log(formatRupees(fine));
