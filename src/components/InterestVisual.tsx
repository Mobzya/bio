export default function InterestVisual({ type }: { type: string }) {
  if (type === "math")
    return (
      <svg
        className="interest-visual math-visual"
        viewBox="0 0 360 200"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="math-clip">
            <rect x="20" y="10" width="320" height="180" />
          </clipPath>
        </defs>
        <g clipPath="url(#math-clip)" fill="none">
          {Array.from({ length: 22 }, (_, i) => (
            <ellipse
              key={i}
              className="math-ring"
              style={
                {
                  "--ring-index": i,
                  "--ring-angle": `${i * 8.2}deg`,
                } as React.CSSProperties
              }
              cx="180"
              cy="104"
              rx={34 + i * 4.8}
              ry={64}
              transform={`rotate(${i * 8.2} 180 104)`}
              stroke="currentColor"
              strokeWidth="0.65"
              opacity={0.3 + (i % 4) * 0.15}
            />
          ))}
          <path
            d="M30 104H330M180 10V194"
            stroke="currentColor"
            opacity=".16"
            strokeDasharray="2 5"
          />
        </g>
        <circle cx="180" cy="104" r="3" fill="currentColor" />
      </svg>
    );
  if (type === "cs") {
    const nodes = [
      { x: 180, y: 35 },
      { x: 108, y: 84 },
      { x: 252, y: 84 },
      { x: 66, y: 140 },
      { x: 145, y: 140 },
      { x: 214, y: 140 },
      { x: 294, y: 140 },
    ];
    return (
      <svg
        className="interest-visual cs-visual"
        viewBox="0 0 360 200"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth=".8">
          {[
            [0, 1],
            [0, 2],
            [1, 3],
            [1, 4],
            [2, 5],
            [2, 6],
          ].map(([a, b], i) => (
            <path
              key={i}
              className="tree-edge"
              style={{ animationDelay: `${i * 0.16}s` }}
              d={`M${nodes[a].x} ${nodes[a].y}V${nodes[a].y + 22}H${nodes[b].x}V${nodes[b].y}`}
            />
          ))}
        </g>
        {nodes.map((node, i) => (
          <g
            key={i}
            className="tree-node"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            <rect
              x={node.x - 13}
              y={node.y - 13}
              width="26"
              height="26"
              rx="3"
              fill="#0d0d0d"
              stroke="currentColor"
              strokeWidth=".7"
            />
            <text
              x={node.x}
              y={node.y + 3.5}
              textAnchor="middle"
              fill="currentColor"
              fontSize="9"
              fontFamily="monospace"
            >
              {i === 0 ? "λ" : ["0", "1", "00", "01", "10", "11"][i - 1]}
            </text>
          </g>
        ))}
        <path
          d="M38 177H322"
          stroke="currentColor"
          opacity=".18"
          strokeDasharray="2 5"
        />
        <text
          x="180"
          y="187"
          textAnchor="middle"
          fill="currentColor"
          opacity=".4"
          fontSize="8"
          fontFamily="monospace"
        >
          INPUT → STRUCTURE → OUTPUT
        </text>
      </svg>
    );
  }
  const layers = [3, 5, 5, 2];
  const node = (layer: number, index: number) => ({
    x: 52 + layer * 85,
    y: 100 + (index - (layers[layer] - 1) / 2) * 29,
  });
  return (
    <svg
      className="interest-visual ml-visual"
      viewBox="0 0 360 200"
      aria-hidden="true"
    >
      {layers
        .slice(0, -1)
        .flatMap((count, layer) =>
          Array.from({ length: count }, (_, a) =>
            Array.from({ length: layers[layer + 1] }, (_, b) => {
              const from = node(layer, a),
                to = node(layer + 1, b);
              return (
                <line
                  key={`${layer}-${a}-${b}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="currentColor"
                  strokeWidth=".6"
                  opacity={(a + b) % 3 === 0 ? ".6" : ".14"}
                  className={`neural-link ${(a + b) % 3 === 0 ? "neural-edge" : ""}`}
                  style={{
                    animationDelay: `${layer * 0.2 + a * 0.08 + b * 0.04}s`,
                  }}
                />
              );
            }),
          ),
        )
        .flat()}
      {layers.flatMap((count, layer) =>
        Array.from({ length: count }, (_, i) => {
          const position = node(layer, i);
          return (
            <circle
              key={`${layer}-${i}`}
              cx={position.x}
              cy={position.y}
              r="5"
              fill="#111"
              stroke="currentColor"
              strokeWidth=".8"
              className="neural-node"
              style={{ animationDelay: `${layer * 0.3 + i * 0.1}s` }}
            />
          );
        }),
      )}
      <g fill="currentColor" opacity=".4" fontFamily="monospace" fontSize="8">
        <text x="52" y="185" textAnchor="middle">
          x
        </text>
        <text x="180" y="185" textAnchor="middle">
          hidden layers
        </text>
        <text x="307" y="185" textAnchor="middle">
          ŷ
        </text>
      </g>
    </svg>
  );
}
