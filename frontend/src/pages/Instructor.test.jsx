import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Instructor from "./Instructor";
import { api } from "@/lib/api";

let mockUser;
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mockUser, ready: true }) }));
jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatApiErrorDetail: detail => detail,
}));
jest.mock("react-router-dom", () => ({ Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });

const cohortA = { id: "a", name: "October explorers", join_code: "COHORT-A" };
const cohortB = { id: "b", name: "November explorers", join_code: "COHORT-B" };
let root, container;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockUser = { id: "instructor", role: "instructor" };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  api.get.mockImplementation(path => Promise.resolve({ data: path === "/lab/cohorts" ? { cohorts: [cohortA] } : { cohort: cohortA, learners: [] } }));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllMocks();
});
async function render() { await act(async () => root.render(<Instructor />)); }
async function click(label) {
  await act(async () => {
    const button = [...container.querySelectorAll("button")].find(item => item.textContent.includes(label));
    expect(button).toBeDefined();
    button.click();
  });
}

test("learner accounts cannot fetch or display instructor records", async () => {
  mockUser = { id: "learner", role: "user" };
  await render();
  expect(api.get).not.toHaveBeenCalled();
  expect(container.textContent).toContain("An administrator can enable instructor access");
  expect(container.querySelector("#cohort-name")).toBeNull();
});

test("displays recorded learner progress without inventing quiz results or aptitude", async () => {
  api.get.mockImplementation(path => Promise.resolve({ data: path === "/lab/cohorts" ? { cohorts: [cohortA] } : {
    cohort: cohortA,
    learners: [
      { id: "learner-1", name: "Asha", email: "asha@example.com", completed_lessons: 2, total_lessons: 6, progress_percent: 33, quiz_average: null, last_activity: null, lesson_records: [{ lesson_id: "sense", completed: true, attempts: 2, prediction: "Pause and reconsider", reflection: "An observation changes the next action.", last_attempt: "2026-10-18T09:00:00Z" }] },
      { id: "learner-2", name: "Ravi", email: "ravi@example.com", completed_lessons: 6, total_lessons: 6, progress_percent: 100, quiz_average: 75, last_activity: "2026-10-18T09:00:00Z" },
    ],
  } }));
  await render();
  expect(container.textContent).toContain("Asha");
  expect(container.textContent).toContain("2 / 6 lessons");
  expect(container.textContent).toContain("No quiz yet");
  expect(container.textContent).toContain("75%");
  expect(container.textContent).toContain("not an aptitude ranking");
  expect(container.querySelectorAll("progress")).toHaveLength(2);
  expect(container.querySelector("progress").value).toBe(33);
  expect(container.textContent).not.toContain("An observation changes the next action.");
  await click("View learning notes");
  expect(container.textContent).toContain("An observation changes the next action.");
  expect(container.textContent).toContain("2 attempts");
});

test("late responses from a previous cohort cannot overwrite the selected roster", async () => {
  let resolveOldCohort;
  api.get.mockImplementation(path => {
    if (path === "/lab/cohorts") return Promise.resolve({ data: { cohorts: [cohortA, cohortB] } });
    if (path === "/lab/cohorts/a") return new Promise(resolve => { resolveOldCohort = resolve; });
    return Promise.resolve({ data: { cohort: cohortB, learners: [] } });
  });
  await render();
  await click("November explorers");
  expect(container.textContent).toContain("COHORT-B");
  await act(async () => resolveOldCohort({ data: { cohort: cohortA, learners: [] } }));
  expect(container.textContent).toContain("COHORT-B");
  expect(container.textContent).not.toContain("COHORT-A");
});

test("cohort load failures offer a retry without showing an empty success state", async () => {
  api.get.mockRejectedValueOnce(new Error("Disconnected"));
  await render();
  expect(container.querySelector('[role="alert"]').textContent).toContain("could not be loaded");
  expect(container.textContent).not.toContain("Good learning starts together");
  await click("Try again");
  expect(container.textContent).toContain("COHORT-A");
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
