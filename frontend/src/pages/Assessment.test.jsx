import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Assessment from "./Assessment";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ user: { id: "learner" } }) }));
jest.mock("react-router-dom", () => ({ Link: ({ children }) => <span>{children}</span> }), { virtual: true });
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("recharts", () => {
  const Wrap = ({ children }) => <div>{children}</div>;
  return { Radar: Wrap, RadarChart: Wrap, PolarGrid: Wrap, PolarAngleAxis: Wrap, PolarRadiusAxis: Wrap, ResponsiveContainer: Wrap };
});
jest.mock("@/components/assessment/MentalRotation", () => ({ onDone }) => <button onClick={() => onDone(.8)}>Finish spatial</button>);
jest.mock("@/components/assessment/Vigilance", () => ({ onDone }) => <button onClick={() => onDone(.9)}>Finish attention</button>);
jest.mock("@/components/assessment/Trainability", () => ({ label, onDone }) => <button onClick={() => onDone(label.includes("1 of") ? 10 : 8)}>Finish {label}</button>);

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  api.get.mockResolvedValue({ data: { missions_completed: 0 } });
  api.post.mockResolvedValue({ data: { recommendedTrack: { trackId: "track-foundations", title: "Foundations", reason: "Practice" } } });
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.clearAllMocks(); });
async function click(text) {
  await act(async () => {
    const button = [...container.querySelectorAll("button")].find(b => b.textContent.includes(text));
    expect(button).toBeDefined(); button.click();
  });
}
test("uses the actual second attempt and never fabricates unmeasured domains", async () => {
  await act(async () => root.render(<Assessment />));
  await click("Begin"); await click("Finish spatial"); await click("Finish attention");
  await click("Finish Attempt 1"); await click("Try again"); await click("Finish Attempt 2");
  expect(api.post).toHaveBeenCalledWith("/assessment/submit", expect.objectContaining({
    trainability_slope: .2, psychomotor: null, higher_order: null, dispositional: null,
  }));
  expect(container.textContent).toContain("+20%");
});
