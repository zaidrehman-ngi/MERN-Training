function ConditionalBadge() {
  const status = "available";

  return (
    <div>
      <h2>1. &&</h2>
      {status === "available" && <p>Available</p>}
      {status === "overdue" && <p>Overdue</p>}
      {status === "out" && <p>Out of stock</p>}

      <h2>2. Ternary</h2>
      <p>
        {status === "available"
          ? "Available"
          : status === "overdue"
            ? "Overdue"
            : "Out of stock"}
      </p>

      <h2>3. Early Return</h2>
      <EarlyReturnBadge status={status} />

      <h2>4. JSX Variable</h2>
      <VariableBadge status={status} />
    </div>
  );
}

function EarlyReturnBadge({ status }) {
  if (status === "available") {
    return <p>Available</p>;
  }

  if (status === "overdue") {
    return <p>Overdue</p>;
  }

  return <p>Out of stock</p>;
}

function VariableBadge({ status }) {
  let badge;

  if (status === "available") {
    badge = <p>Available</p>;
  } else if (status === "overdue") {
    badge = <p>Overdue</p>;
  } else {
    badge = <p>Out of stock</p>;
  }

  return badge;
}

export default ConditionalBadge;
