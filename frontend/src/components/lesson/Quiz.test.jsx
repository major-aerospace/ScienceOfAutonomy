import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Quiz from "./Quiz";

test("submits the selected answer indices for server grading", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container=document.createElement("div"); document.body.appendChild(container);
  const root=createRoot(container); const onPass=jest.fn().mockResolvedValue();
  const questions=[{prompt:"First",options:["A","B"],answer:1},{prompt:"Second",options:["C","D"],answer:0}];
  const click=async text => act(async () => [...container.querySelectorAll("button")].find(b=>b.textContent===text).click());
  await act(async()=>root.render(<Quiz questions={questions} onPass={onPass}/>));
  await click("A"); await click("Check"); await click("Next question");
  await click("C"); await click("Check"); await click("See results"); await click("Save completion");
  expect(onPass).toHaveBeenCalledWith(.5,[0,0]);
  act(()=>root.unmount()); container.remove();
});
