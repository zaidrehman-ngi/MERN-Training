function calculateLateFine(daysLate) {
  return daysLate * 20;
}

function formatRupees(amount) {
  return `Rs ${amount}`;
}

module.exports = {
  calculateLateFine,
  formatRupees,
};
