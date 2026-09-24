function KeyboardAccessibleRow() {
  const handleRowClick = () => {
    console.log("opening detail page");
  };

  const handleBorrow = (e) => {
    e.stopPropagation();
    console.log("borrowing book");
  };

  const handleRowKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleRowClick();
    }
  };

  return (
    <div>
      <h2>Keyboard Accessible Row</h2>

      <div onClick={handleRowClick} onKeyDown={handleRowKeyDown} tabIndex={0}>
        <h3>Dune</h3>

        <button onClick={handleBorrow}>Borrow</button>
      </div>
    </div>
  );
}

export default KeyboardAccessibleRow;
