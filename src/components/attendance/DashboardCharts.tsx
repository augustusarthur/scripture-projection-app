"use client";

import type {
  AttendanceAnalytics,
  GroupAnalytics,
  WeekAnalytics,
} from "@/lib/attendance-roster";

function shortDate(date: string) {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

function ChartLegend({
  items,
}: {
  items: { color: string; label: string }[];
}) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className="swatch" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function StatusDonut({ week }: { week: WeekAnalytics }) {
  const segments = [
    { key: "present", value: week.present, color: "var(--present)" },
    { key: "absent", value: week.absent, color: "var(--absent)" },
    { key: "unmarked", value: week.unmarked, color: "#cfc6b0" },
  ];
  const total = Math.max(week.total, 1);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="chart-panel">
      <div className="chart-panel-head">
        <h3>This week’s mix</h3>
        <p>Present, absent, and not yet marked</p>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 140 140" className="donut-chart" aria-hidden="true">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#efe9d8"
            strokeWidth="16"
          />
          {segments.map((segment) => {
            const length = (segment.value / total) * circumference;
            const node = (
              <circle
                key={segment.key}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
                className="donut-segment"
              />
            );
            offset += length;
            return node;
          })}
        </svg>
        <div className="donut-center">
          <strong>{week.rate}%</strong>
          <span>rate</span>
        </div>
      </div>
      <ChartLegend
        items={[
          { color: "var(--present)", label: `Present · ${week.present}` },
          { color: "var(--absent)", label: `Absent · ${week.absent}` },
          { color: "#cfc6b0", label: `Unmarked · ${week.unmarked}` },
        ]}
      />
    </div>
  );
}

export function TrendLineChart({ weeks }: { weeks: WeekAnalytics[] }) {
  const width = 320;
  const height = 160;
  const padX = 28;
  const padY = 18;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const points = weeks.map((week, index) => {
    const x =
      weeks.length <= 1
        ? padX + innerW / 2
        : padX + (index / (weeks.length - 1)) * innerW;
    const y = padY + innerH - (week.rate / 100) * innerH;
    return { x, y, week };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area =
    points.length > 0
      ? `${padX},${padY + innerH} ${line} ${padX + innerW},${padY + innerH}`
      : "";

  return (
    <div className="chart-panel">
      <div className="chart-panel-head">
        <h3>Attendance trend</h3>
        <p>Weekly rate across recent weeks</p>
      </div>
      {weeks.length === 0 ? (
        <p className="chart-empty">No week history yet.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="trend-chart"
            role="img"
            aria-label="Attendance rate trend"
          >
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = padY + innerH - (tick / 100) * innerH;
              return (
                <g key={tick}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={padX + innerW}
                    y2={y}
                    className="chart-gridline"
                  />
                  <text x={4} y={y + 3} className="chart-axis">
                    {tick}
                  </text>
                </g>
              );
            })}
            {area ? <polygon points={area} className="trend-area" /> : null}
            {line ? <polyline points={line} className="trend-line" /> : null}
            {points.map((point) => (
              <g key={point.week.date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  className="trend-dot"
                />
                <text
                  x={point.x}
                  y={height - 2}
                  textAnchor="middle"
                  className="chart-axis"
                >
                  {shortDate(point.week.date)}
                </text>
              </g>
            ))}
          </svg>
          <ChartLegend
            items={[{ color: "var(--forest)", label: "Attendance rate %" }]}
          />
        </>
      )}
    </div>
  );
}

export function LeaderCompareChart({
  groups,
  onOpen,
}: {
  groups: GroupAnalytics[];
  onOpen?: (group: string) => void;
}) {
  const max = Math.max(
    1,
    ...groups.map((row) => Math.max(row.present + row.absent + row.unmarked, 1)),
  );

  return (
    <div className="chart-panel wide">
      <div className="chart-panel-head">
        <h3>Leaders compared</h3>
        <p>Present vs absent vs unmarked this week</p>
      </div>
      <div className="compare-chart" role="list">
        {groups.map((row) => {
          const presentH = (row.present / max) * 100;
          const absentH = (row.absent / max) * 100;
          const unmarkedH = (row.unmarked / max) * 100;
          return (
            <button
              type="button"
              className="compare-col"
              key={row.group}
              role="listitem"
              onClick={() => onOpen?.(row.group)}
              title={`${row.label}: ${row.present} present, ${row.absent} absent`}
            >
              <div className="compare-bars">
                <span
                  className="stack present"
                  style={{ height: `${presentH}%` }}
                />
                <span
                  className="stack absent"
                  style={{ height: `${absentH}%` }}
                />
                <span
                  className="stack unmarked"
                  style={{ height: `${unmarkedH}%` }}
                />
              </div>
              <strong>{row.rate}%</strong>
              <em>{row.label}</em>
            </button>
          );
        })}
      </div>
      <ChartLegend
        items={[
          { color: "var(--present)", label: "Present" },
          { color: "var(--absent)", label: "Absent" },
          { color: "#cfc6b0", label: "Unmarked" },
        ]}
      />
    </div>
  );
}

export function SubmissionGauge({ week }: { week: WeekAnalytics }) {
  const pct = week.totalGroups
    ? Math.round((week.submittedGroups / week.totalGroups) * 100)
    : 0;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;

  return (
    <div className="chart-panel">
      <div className="chart-panel-head">
        <h3>Submissions</h3>
        <p>Leaders finished for this week</p>
      </div>
      <div className="donut-wrap compact">
        <svg viewBox="0 0 120 120" className="donut-chart" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#efe9d8"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="12"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className="donut-segment"
          />
        </svg>
        <div className="donut-center">
          <strong>
            {week.submittedGroups}/{week.totalGroups}
          </strong>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

export function IcuChart({ groups }: { groups: GroupAnalytics[] }) {
  const total = groups.reduce((sum, row) => sum + row.icu, 0);
  const max = Math.max(1, ...groups.map((row) => row.icu));

  return (
    <div className="chart-panel wide">
      <div className="chart-panel-head">
        <h3>ICU by leader</h3>
        <p>
          {total
            ? `${total} member${total === 1 ? "" : "s"} set aside for follow-up`
            : "No one in ICU right now"}
        </p>
      </div>
      {total === 0 ? (
        <p className="chart-empty">ICU is empty across all groups.</p>
      ) : (
        <div className="icu-bars">
          {groups
            .filter((row) => row.icu > 0)
            .map((row) => (
              <div className="icu-bar-row" key={row.group}>
                <span className="icu-bar-label">{row.label}</span>
                <div className="icu-bar-track">
                  <span
                    className="icu-bar-fill"
                    style={{ width: `${(row.icu / max) * 100}%` }}
                  />
                </div>
                <strong>{row.icu}</strong>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function DashboardChartGrid({
  analytics,
  onOpenLeader,
}: {
  analytics: AttendanceAnalytics;
  onOpenLeader?: (group: string) => void;
}) {
  return (
    <div className="chart-grid">
      <StatusDonut week={analytics.thisWeek} />
      <SubmissionGauge week={analytics.thisWeek} />
      <TrendLineChart weeks={analytics.trendWeeks} />
      <LeaderCompareChart
        groups={analytics.byGroup}
        onOpen={onOpenLeader}
      />
      <IcuChart groups={analytics.byGroup} />
    </div>
  );
}

export function OverviewSparkBars({
  groups,
  onOpen,
}: {
  groups: GroupAnalytics[];
  onOpen?: (group: string) => void;
}) {
  return (
    <div className="overview-spark">
      <div className="chart-panel-head">
        <h3>Week at a glance</h3>
        <p>Tap a leader bar to open their group</p>
      </div>
      <div className="spark-row">
        {groups.map((row) => (
          <button
            type="button"
            key={row.group}
            className="spark-item"
            onClick={() => onOpen?.(row.group)}
          >
            <div className="spark-track" aria-hidden="true">
              <span style={{ height: `${Math.max(row.rate, 4)}%` }} />
            </div>
            <em>{row.label}</em>
            <strong>{row.rate}%</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
