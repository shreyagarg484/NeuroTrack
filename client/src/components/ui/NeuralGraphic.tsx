export default function NeuralGraphic() {
  return (
    <div className="neural-graphic" aria-hidden="true">
      <div className="neural-halo halo-one" />
      <div className="neural-halo halo-two" />
      <svg viewBox="0 0 440 280">
        <g className="neural-lines">
          <path d="M85 157 L161 91 L247 139 L330 78" />
          <path d="M85 157 L196 205 L247 139 L353 191" />
          <path d="M161 91 L196 205" />
          <path d="M247 139 L330 78 L353 191" />
          <path d="M161 91 L330 78" />
          <path d="M196 205 L353 191" />
        </g>
        <g className="neural-nodes">
          <circle cx="85" cy="157" r="7" />
          <circle cx="161" cy="91" r="11" />
          <circle cx="247" cy="139" r="15" />
          <circle cx="330" cy="78" r="8" />
          <circle cx="196" cy="205" r="8" />
          <circle cx="353" cy="191" r="10" />
          <circle cx="119" cy="112" r="4" />
          <circle cx="289" cy="202" r="4" />
        </g>
        <g className="neural-pulse">
          <circle cx="247" cy="139" r="29" />
          <circle cx="161" cy="91" r="22" />
        </g>
      </svg>
      <div className="graphic-label label-top">SIGNAL / 04</div>
      <div className="graphic-label label-bottom">
        COGNITIVE MAP <span>●</span>
      </div>
    </div>
  );
}

