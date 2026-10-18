import React, { act } from "react";
import { createRoot } from "react-dom/client";
import MentalRotation from "./MentalRotation";
import Trainability from "./Trainability";
import Vigilance from "./Vigilance";

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers("modern");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("rotation accepts only one answer during the feedback interval", () => {
  act(() => root.render(<MentalRotation onDone={jest.fn()} />));
  const option = container.querySelector('[aria-label="Matching rotation option 1"]');
  act(() => { option.click(); option.click(); option.click(); });
  expect([...container.querySelectorAll("button")].every(button => button.disabled)).toBe(true);
  act(() => jest.advanceTimersByTime(400));
  expect(container.textContent).toContain("2/6");
  expect(container.textContent).not.toContain("4/6");
  act(() => container.querySelector("button").click());
  act(() => root.render(null));
  expect(jest.getTimerCount()).toBe(0);
});

test("target practice counts one response per rendered target and completes once", () => {
  const onDone = jest.fn();
  act(() => root.render(<Trainability label="Attempt 1" onDone={onDone} />));
  act(() => container.querySelector("button").click());
  let target = container.querySelector('[aria-label="Target 1 of 8"]');
  act(() => { target.click(); target.click(); });
  expect(container.textContent).toContain("1/8");
  for (let index = 2; index <= 8; index += 1) {
    act(() => {
      jest.advanceTimersByTime(100);
      container.querySelector(`[aria-label="Target ${index} of 8"]`).click();
    });
  }
  expect(container.querySelector("button")).toBeNull();
  expect(container.textContent).toContain("Attempt complete");
  act(() => jest.advanceTimersByTime(1000));
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test("leaving target practice cancels its pending completion", () => {
  const onDone = jest.fn();
  act(() => root.render(<Trainability label="Attempt 1" onDone={onDone} />));
  act(() => container.querySelector("button").click());
  for (let index = 1; index <= 8; index += 1) {
    act(() => container.querySelector(`[aria-label="Target ${index} of 8"]`).click());
  }
  act(() => root.render(null));
  act(() => jest.advanceTimersByTime(1000));
  expect(onDone).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test("attention practice does not double-count hits and stops scheduling after completion", () => {
  jest.spyOn(Math, "random").mockReturnValue(0);
  const onDone = jest.fn();
  act(() => root.render(<Vigilance onDone={onDone} />));
  act(() => container.querySelector("button").click());
  act(() => jest.advanceTimersByTime(2500));
  const response = container.querySelector("button");
  act(() => { response.click(); response.click(); });
  expect(container.textContent).toContain("HITS · 1");
  expect(container.textContent).toContain("FALSE · 1");
  act(() => jest.advanceTimersByTime(33100));
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(container.querySelector("button")).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

test("leaving attention practice while a target is visible clears its hide timer", () => {
  jest.spyOn(Math, "random").mockReturnValue(0);
  const onDone = jest.fn();
  act(() => root.render(<Vigilance onDone={onDone} />));
  act(() => container.querySelector("button").click());
  act(() => jest.advanceTimersByTime(2500));
  act(() => root.render(null));
  act(() => jest.advanceTimersByTime(60000));
  expect(onDone).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});
