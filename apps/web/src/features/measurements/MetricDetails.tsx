import { useMemo, useState } from "react";
import type { MetricReading, Recommendation } from "@ahm/contracts";
import { formatTime, formatValue } from "../../lib/format";
import { TrendChart } from "../history/TrendChart";
import { HISTORY_PERIODS, dailyTrend, filterTrend, referenceTime, sortTrend, type PeriodId } from "../history/periods";
import { computeStatistics } from "../history/statistics";
import { MEASUREMENT_INFO } from "./measurementInfo";
import { Disclosure } from "../../components/Disclosure";
import { measurementContext } from "../../lib/measurementContext";
import "./metric-details.css";

const STATUS_TEXT: Record<MetricReading["status"], string> = {
  normal: "No demo alert", watch: "Check needed", alert: "Needs attention", unavailable: "No current reading",
};
export function MetricDetails({ reading, recommendations, fallbackAt, onCheckIn, onSensorCheck }: {
  reading: MetricReading; recommendations: Recommendation[]; fallbackAt: string; onCheckIn?: () => void; onSensorCheck?: () => void;
}) {
  const [periodId, setPeriodId] = useState<PeriodId>("all");
  const period = HISTORY_PERIODS.find(item => item.id === periodId)!;
  const trend = useMemo(() => sortTrend(reading.trend), [reading.trend]);
  const at = referenceTime(reading, fallbackAt);
  const dailyView = period.seconds !== null ? period.seconds >= 86400 : trend.length > 1 && Date.parse(trend.at(-1)!.at) - Date.parse(trend[0]!.at) >= 86400000;
  const points = useMemo(() => { const filtered = filterTrend(trend, period, at); return dailyView ? dailyTrend(filtered) : filtered; }, [trend, period, at, dailyView]);
  const stats = useMemo(() => computeStatistics(points), [points]);
  const multiDay = trend.length > 1 && Date.parse(trend.at(-1)!.at) - Date.parse(trend[0]!.at) >= 86400000;
  const continuous = ["heartRate", "respiratoryRate", "spo2"].includes(reading.metric);
  const periods = HISTORY_PERIODS.filter(item => continuous || item.seconds === null || (multiDay ? item.seconds >= 86400 : item.seconds < 86400));
  const guidance = recommendations.filter(item => item.severity !== "info" && item.metricIds?.includes(reading.metric));
  const info = MEASUREMENT_INFO[reading.metric];
  const contextUrl = ["heartRate", "temperature", "respiratoryRate", "systolicPressure", "diastolicPressure"].includes(reading.metric)
    ? "https://www.nasa.gov/wp-content/uploads/2023/04/ochmo-std-100.1a.pdf#page=38"
    : "https://www.nasa.gov/hrp/risks/";
  return <article className="metric-details">
    <header className="metric-details__hero">
      <div><h2 className="metric-details__label">{reading.label}</h2>
        <p className="metric-details__value"><span className="metric-details__number">{reading.value === null ? "—" : formatValue(reading.value)}</span>
          {reading.value !== null && <span className="metric-details__unit">{reading.unit}</span>}</p>
      </div>
      <div className="metric-details__meta">
        <span>{measurementContext(reading)}</span>
        <span className="metric-details__pill" data-status={reading.status}>{STATUS_TEXT[reading.status]}</span>
        <span>{reading.measuredAt ? `Measured at ${formatTime(reading.measuredAt)} UTC` : "No measurement timestamp"}</span>
      </div>
    </header>
    <p className="metric-details__caption">{continuous && reading.value !== null ? "Synthetic samples · updates every 5 seconds" : reading.caption.split(" Daily synthetic")[0]}</p>
    {reading.value === null && <div className="metric-details__warning"><p>{reading.metric === "wellbeing" ? "Your own rating supplies today's wellbeing value." : "No current measurement. Previous readings do not describe your current condition."}</p>{(reading.metric === "wellbeing" ? onCheckIn : reading.metric === "spo2" ? onSensorCheck : undefined) && <button type="button" className="next-action" onClick={reading.metric === "wellbeing" ? onCheckIn : onSensorCheck}>{reading.metric === "wellbeing" ? "Complete today's check-in" : "Check the sensor"}</button>}</div>}
    <section className="metric-details__block" aria-label="Measurement history">
      <div className="metric-details__block-head"><h3>History</h3>
        {trend.length > 1 && <div className="period-switch" data-expanded={continuous} role="group" aria-label="History period">
          {periods.map(item => <button key={item.id} type="button" aria-pressed={periodId === item.id} onClick={() => setPeriodId(item.id)}>{item.seconds === null ? "All" : item.label}</button>)}
        </div>}
      </div>
      {dailyView && <p className="metric-details__caption">Last available reading per UTC day. Use 1 min or 5 min for live samples.</p>}
      {points.length > 0 ? <TrendChart points={points} label={reading.label} unit={reading.unit} periodLabel={period.label} referenceAt={at} /> :
        <p className="metric-details__empty">No measurements recorded in this period.</p>}
      {stats && stats.count > 1 && <dl className="metric-details__stats">
        {[["Minimum", stats.min], ["Average", stats.average], ["Maximum", stats.max]].map(([label, value]) =>
          <div key={label}><dt>{label}</dt><dd>{formatValue(Number(value))}<small>{reading.unit}</small></dd></div>)}
      </dl>}
      {points.length === 1 && <p className="metric-details__caption">One measurement is available. More readings are needed to show a trend.</p>}
    </section>
    {guidance.length > 0 && <section className="metric-details__block" aria-label="Suggested next steps">
      <h3>Next steps</h3>{guidance.map(item => <div key={item.id}><h4>{item.title}</h4><p>{item.body}</p></div>)}
    </section>}
    <Disclosure title="About this measurement" className="measurement-source">
      <p><strong>What it means.</strong> {info.meaning}</p>
      <p><strong>Real measurement method.</strong> {info.method}</p>
      <p><strong>What it cannot tell you.</strong> {info.limit}</p>
      <p><strong>Reading the chart.</strong> Each point is one synthetic sample, not a daily clinical assessment. Hover, tap or use the arrow keys to inspect its value and UTC timestamp. Missing intervals are left unconnected.</p>
      <p><strong>Comparing readings.</strong> Compare measurements made with the same method and similar activity conditions. Symptoms, personal baseline and signal quality matter alongside the number.</p>
      <p><strong>Statistics.</strong> Daily views use the last reading of each UTC day. Minute views use the available live samples. Minimum, average and maximum use those same displayed points; the average is not time-weighted.</p>
      <p>Source: {reading.source}. Data quality: {reading.quality}. All displayed measurements are synthetic.</p>
      <p>Demo status labels are not clinical assessments. Real measurements require the appropriate device and a validated mission protocol.</p>
      <p><a href={contextUrl} target="_blank" rel="noreferrer">Measurement context from NASA</a></p>
    </Disclosure>
  </article>;
}
