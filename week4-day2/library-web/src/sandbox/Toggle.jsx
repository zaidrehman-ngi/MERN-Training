import useToggle from "../hooks/useToggle";

function Toggle() {
  const [isOpen, toggle] = useToggle(false);
  // const [isOpen, toggle, panel] = useToggle(false);

  return (
    <div>
      <button onClick={toggle}>{isOpen ? "Hide Panel" : "Show Panel"}</button>

      {isOpen && <p>This is the toggle panel.</p>}
      {/* {panel} */}
    </div>
  );
}

export default Toggle;
