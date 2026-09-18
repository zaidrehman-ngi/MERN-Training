import useToggle from "../hooks/useToggle";

function TogglePanel() {
  const [isOpen, toggle] = useToggle(false);

  return (
    <div>
      <button onClick={toggle}>{isOpen ? "Close Panel" : "Open Panel"}</button>

      {isOpen && <p>This is the second toggle component.</p>}
    </div>
  );
}

export default TogglePanel;
