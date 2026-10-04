import "./brand-cube.css";

export function BrandCube() {
  return (
    <span className="brand-cube-stage" aria-hidden="true">
      <span className="brand-cube">
        <span className="brand-cube-face front" />
        <span className="brand-cube-face back" />
        <span className="brand-cube-face right" />
        <span className="brand-cube-face left" />
        <span className="brand-cube-face top" />
        <span className="brand-cube-face bottom" />
      </span>
    </span>
  );
}
