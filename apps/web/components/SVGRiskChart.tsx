"use client";

import React from "react";

interface SVGRiskChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
}

export default function SVGRiskChart({ data, title = "Recovery Trend", color = "#635bff" }: SVGRiskChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 100);
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 20;

  // Compute points
  const points = data.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (data.length - 1 || 1);
    const y = chartHeight - padding - (d.value / maxValue) * (chartHeight - padding * 2);
    return { x, y, label: d.label, val: d.value };
  });

  // Create SVG path string (curved line)
  const pathD = points.reduce((acc, p, index) => {
    if (index === 0) return `M ${p.x} ${p.y}`;
    const prev = points[index - 1];
    // Smooth control points
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, "");

  // Create area fill path
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : "";

  return (
    <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] font-bold text-[#6b7c93] font-mono">₹ Minor unit minor values</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + ratio * (chartHeight - padding * 2);
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#e6ebf1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill={`url(#area-gradient-${title.replace(/\s+/g, "")})`}
              opacity="0.1"
            />
          )}

          {/* Line Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                className="transition-all hover:r-6"
              />
              {/* Tooltip on Hover */}
              <rect
                x={p.x - 30}
                y={p.y - 28}
                width="60"
                height="18"
                rx="4"
                fill="#32325d"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <text
                x={p.x}
                y={p.y - 16}
                fill="white"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                className="opacity-0 group-hover:opacity-100 transition-opacity font-sans"
              >
                ₹{p.val >= 1000 ? `${(p.val / 1000).toFixed(1)}k` : p.val}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={chartHeight - 4}
              fill="#6b7c93"
              fontSize="8"
              textAnchor="middle"
              className="font-mono font-bold"
            >
              {p.label}
            </text>
          ))}

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id={`area-gradient-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
