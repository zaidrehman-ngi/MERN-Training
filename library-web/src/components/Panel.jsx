function Panel({ title, children }) {
  console.log(children);

  return (
    <div className="panel">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export default Panel;
