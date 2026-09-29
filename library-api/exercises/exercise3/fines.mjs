export function calculateLateFine(daysLate) {
  return daysLate * 20;
}

export function formatRupees(amount) {
  return `Rs ${amount}`;
}
