import React, { act } from "react";
import { createRoot } from "react-dom/client";
import LearningLesson from "./LearningLesson";
import LearningHub from "./LearningHub";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useParams } from "react-router-dom";
import { sensorReadings, feedbackPositions, LESSONS } from "@/lib/foundations";

jest.mock("@/lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() }, formatApiErrorDetail: detail => String(detail) }));
jest.mock("@/lib/auth", () => ({ useAuth: jest.fn() }));
jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>, useParams: jest.fn() }), { virtual: true });
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = jest.fn(); localStorage.clear();
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  useAuth.mockReturnValue({ user: false, ready: true }); useParams.mockReturnValue({ lessonId: "sense" });
  api.get.mockResolvedValue({ data: { progress: [], cohorts: [] } });
  api.post.mockResolvedValue({ data: { score: 1, correct: [true, true], completed: true, best_score: 1, attempts: 1, content_version: "foundations-1" } });
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.clearAllMocks(); });
async function render(component) { await act(async () => root.render(component)); }
async function clickButton(text) { await act(async () => { const b=[...container.querySelectorAll("button")].find(el=>el.textContent.includes(text)); expect(b).toBeDefined(); b.click(); }); }
async function answer(first=1,second=0) { await act(async () => { container.querySelector(`input[name="check-0"][value="${first}"]`).click(); container.querySelector(`input[name="check-1"][value="${second}"]`).click(); }); }
async function type(selector,value) { await act(async () => { const el=container.querySelector(selector); Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value); el.dispatchEvent(new Event('input',{bubbles:true})); }); }

test("guests receive formative feedback without claiming saved progress or sending an attempt", async () => {
  await render(<LearningLesson/>);
  expect([...container.querySelectorAll('button')].find(b=>b.textContent==='Check my answers').disabled).toBe(true);
  await answer(); await clickButton("Check my answers");
  expect(api.post).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Practice feedback · not saved");
  expect(container.textContent).toContain("2 of 2 concepts checked correctly");
  await clickButton("Try again");
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0);
});

test("a failed save preserves answers and supports retry without reporting completion", async () => {
  useAuth.mockReturnValue({ user: { id: 'learner-a' }, ready: true });
  api.post.mockRejectedValueOnce(new Error('network'));
  await render(<LearningLesson/>); await answer(); await clickButton("Check & save");
  expect(container.textContent).toContain("We could not confirm that your answers were saved");
  expect(container.textContent).not.toContain("Saved to your learning record");
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(2);
  await clickButton("Check & save");
  expect(api.post).toHaveBeenLastCalledWith('/lab/attempts', expect.objectContaining({ lesson_id:'sense', content_version:'foundations-1', answers:[1,0], presentation:'standard' }));
  expect(container.textContent).toContain("Saved to your learning record");
  expect(container.querySelector('.learn-exploration').disabled).toBe(true);
  await clickButton('Try again');
  expect(container.querySelector('.learn-exploration').disabled).toBe(false);
});

test("signed-in feedback follows server grading and records uncertainty model context", async () => {
  useAuth.mockReturnValue({ user:{id:'learner-a'},ready:true }); useParams.mockReturnValue({lessonId:'uncertainty'});
  api.post.mockResolvedValue({data:{score:.5,correct:[false,true],completed:false}});
  await render(<LearningLesson/>); await answer(0,0);
  await act(async()=>container.querySelector('input[type="checkbox"]').click());
  await clickButton('Check & save');
  expect(api.post).toHaveBeenCalledWith('/lab/attempts',expect.objectContaining({experiment:{noise:8,samples:8,biased:true}}));
  expect(container.textContent).toContain('1 of 2 concepts checked correctly');
});

test("switching accounts clears private reflection and the previous account's quiz result", async () => {
  useAuth.mockReturnValue({user:{id:'learner-a'},ready:true});
  await render(<LearningLesson/>); await type('#learning-reflection','A private learning reflection'); await answer(); await clickButton('Check & save');
  useAuth.mockReturnValue({user:{id:'learner-b'},ready:true}); await render(<LearningLesson/>);
  expect(container.querySelector('#learning-reflection').value).toBe('');
  expect(container.textContent).not.toContain('Saved to your learning record');
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0);
});

test("a late progress response cannot reveal the signed-out learner's groups", async () => {
  let resolve; api.get.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
  useAuth.mockReturnValue({user:{id:'learner-a'},ready:true}); await render(<LearningHub/>);
  useAuth.mockReturnValue({user:false,ready:true}); await render(<LearningHub/>);
  await act(async()=>resolve({data:{progress:LESSONS.map(l=>({lesson_id:l.id,completed:true})),cohorts:[{id:'private',name:'Private cohort'}]}}));
  expect(container.textContent).not.toContain('Private cohort');
  expect(container.textContent).toContain('Create your account');
  expect(container.querySelector('[role="progressbar"]')).toBeNull();
});

test("joining a group submits the trimmed code and explains what is shared", async () => {
  useAuth.mockReturnValue({user:{id:'learner-a'},ready:true}); await render(<LearningHub/>);
  await type('#cohort-code','  GROUP12  '); await clickButton('Join');
  expect(api.post).toHaveBeenCalledWith('/lab/join',{code:'GROUP12'});
  expect(container.textContent).toContain('Your instructor can now see your course progress and submitted reflections');
});

test("the measurement model retains shared bias and the feedback model demonstrates its stated stability limits", () => {
  const average = xs => xs.reduce((a,b)=>a+b,0)/xs.length;
  expect(average(sensorReadings(8,20,true))-average(sensorReadings(8,20,false))).toBeCloseTo(5);
  expect(sensorReadings(0,20,true).every(v=>v===55)).toBe(true);
  const gentle=feedbackPositions(.4), aggressive=feedbackPositions(2.2);
  expect(Math.abs(gentle[12]-50)).toBeLessThan(.1);
  expect(Math.abs(aggressive[12]-50)).toBeGreaterThan(Math.abs(aggressive[0]-50));
});
