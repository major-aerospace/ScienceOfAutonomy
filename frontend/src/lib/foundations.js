// Original teaching material. These small models illustrate concepts; they are not validated aptitude tests.
export const COURSE_VERSION = "foundations-1";
export const PRESENTATIONS = [
  { id: "explorer", label: "Explorer", description: "Everyday examples" },
  { id: "standard", label: "Foundations", description: "Concepts in context" },
  { id: "advanced", label: "Go deeper", description: "Models & assumptions" },
];
const sources = {
  nasa: { title: "NASA · Autonomous Systems & Robotics", url: "https://www.nasa.gov/intelligent-systems-division/autonomous-systems-and-robotics/", note: "Explore the fields that come together in autonomous systems." },
  feedback: { title: "Åström & Murray · Feedback Systems", url: "https://www.cds.caltech.edu/~murray/FBS/Second_Edition.html", note: "Open textbook. Start with the introduction and system modelling chapters." },
  uncertainty: { title: "NIST · Measurement uncertainty", url: "https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-2-classification-components-uncertainty", note: "Distinguish a measurement, its error, and its uncertainty." },
  planning: { title: "Carnegie Mellon · Planning Techniques for Robotics", url: "https://www.cs.cmu.edu/~maxim/classes/robotplanning/", note: "University course materials on representing and searching possible actions." },
  responsibility: { title: "NIST · AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", note: "A broader framework for evaluating and managing risks in AI systems." },
};
export const LESSONS = [
  {
    id: "sense", title: "From sensing to action", shortTitle: "The autonomy loop", category: "Understand", minutes: 12, accent: "mint",
    description: "Discover how a machine turns observations into decisions—and why the loop never really ends.",
    objective: "Trace an observation through sensing, estimation, planning, action, and a new observation.",
    takeaway: "Autonomy is a loop of observation and action within boundaries set by people.",
    content: {
      explorer: ["Imagine a small robot delivering books around a library. Its camera notices a chair, its software works out where the chair is, and it chooses a clear route. Its wheels move—and then it looks again. Looking once would not help if someone moved the chair.", "The robot does not choose the purpose of the library. People give it a goal, define where it may go, and decide when it should stop or ask for help. A machine can act on its own in a limited situation without understanding everything around it."],
      standard: ["An autonomous system combines several functions: sensors collect observations, estimation turns those observations into a useful account of the current state, planning chooses actions toward a goal, and control carries them out. New observations close the loop.", "These functions are related but different. A distance sensor reports a measurement; it does not decide whether a corridor is suitable. That decision also depends on the robot's size, the goal, uncertainty, and human-defined constraints. Autonomy is always bounded by the situations the system was designed and evaluated for."],
      advanced: ["A useful abstraction separates the physical state x, observations y, an estimated state x̂, and action u. The controller cannot usually access x directly: it acts on an estimate built from observations and a model. State estimation and action selection therefore deserve separate scrutiny.", "The diagram is a functional decomposition, not a claim that every architecture has five separate programs. Learned policies may combine functions, while deployed systems may add monitors, fallback controllers, and human approval. A goal alone does not specify acceptable behaviour; constraints and operating assumptions matter."],
    },
    prediction: "A chair is moved into the robot's route after it starts. What does the robot need next?",
    predictions: ["The original route is enough", "A fresh observation and an updated decision", "A faster motor"],
    activity: "Toggle the corridor between clear and blocked. Follow which part of the loop changes the action.",
    reflection: "Which part of the loop would you investigate if the robot kept using an out-of-date map?",
    limits: "This rule-based library example has only two situations and perfect obstacle detection. Real perception has missed detections, false alarms, and delayed information.",
    checks: [
      { prompt: "A sensor reports an object 2 metres away. Which step decides what that means for the route?", options: ["The measurement alone chooses the route", "Estimation and planning interpret it in context", "The wheels determine whether it is an obstacle"], answer: 1, explanation: "A measurement needs interpretation and a decision rule. The goal, available space, and constraints determine the next action." },
      { prompt: "Why must the robot observe again after moving?", options: ["Its position and surroundings may have changed", "Repeated observation guarantees perfect knowledge", "The original goal is always wrong"], answer: 0, explanation: "Action changes the state, and the environment may change independently. Fresh observations help update the estimate; they still do not guarantee certainty." },
    ], sources: [sources.nasa],
  },
  {
    id: "feedback", title: "Make a correction. Observe again.", shortTitle: "Feedback & control", category: "Experiment", minutes: 14, accent: "sand",
    description: "Explore why stronger corrections can help, overshoot, or make a system unstable.",
    objective: "Explain how feedback uses error, and compare gentle and aggressive corrections in a simple model.",
    takeaway: "Good control depends on the system, its delays, and its limits—not simply on making the strongest correction.",
    content: {
      explorer: ["You are trying to stop a small cart at a line. If it is far from the line, you move it forward. When it gets close, you use a smaller move. Each time you look at where it ended up before deciding what to do next. That is feedback.", "If every correction is too big, the cart jumps past the line and then back again. A gentle correction is slower, but a very strong one can make the mistake grow. Try the model and watch the whole path, not only the final dot."],
      standard: ["Feedback compares a desired state with a measured state. Their difference is the error. A proportional controller scales that error to choose an action, then measures the result and repeats.", "The gain sets the strength of the response. In our simplified model, small positive gain approaches the target slowly. Larger gain may cross it repeatedly. Beyond a limit, each correction makes the next error larger. Real controllers must also account for time delays, noise, actuator limits, and the dynamics of the physical system."],
      advanced: ["The experiment uses x[k+1] = x[k] + K(r − x[k]), where r = 50 and x[0] = 10. Therefore e[k+1] = (1 − K)e[k]. For this particular discrete-time model, errors decay when 0 < K < 2; at K = 2 they alternate without decaying.", "This stability result belongs to this model only. A real actuator is not an instantaneous position increment. Sampling, inertia, saturation, and delayed feedback alter the dynamics. Do not transfer the numerical gain from this demonstration to a physical device."],
    },
    prediction: "What do you expect when the correction gain is increased from 0.4 to 1.6?",
    predictions: ["The cart can never cross the target", "Corrections may alternate across the target", "Feedback is no longer needed"],
    activity: "Move the correction-strength slider. Compare gains of 0.4, 1.6, and 2.2, then explain the different paths.",
    reflection: "What would you want to know about a real cart before choosing its correction strength?",
    limits: "An idealised discrete model with exact position measurements, no physical inertia, no delay, and no actuator saturation. The chart is clipped for readability when positions diverge.",
    checks: [
      { prompt: "What does feedback compare to calculate the error?", options: ["Two unrelated sensors", "The target and the measured state", "Only the previous command"], answer: 1, explanation: "The error is the gap between the desired state and the observed state. Feedback uses that gap to choose the next correction." },
      { prompt: "A larger gain makes the model oscillate. What is the best conclusion?", options: ["A stronger correction is not always a better correction", "Every real controller needs the same gain", "Oscillation proves the sensor is broken"], answer: 0, explanation: "The response depends on the dynamics and gain together. A model can show a trade-off, but its numerical settings are not universal." },
    ], sources: [sources.feedback],
  },
  {
    id: "uncertainty", title: "A reading is not the whole truth", shortTitle: "Sensing & uncertainty", category: "Investigate", minutes: 15, accent: "sky",
    description: "See how noise and bias affect measurements. Discover what averaging can—and cannot—repair.",
    objective: "Distinguish measurement spread from a consistent offset, and explain a limit of averaging.",
    takeaway: "More readings can help with random variation. They do not automatically remove a shared error.",
    content: {
      explorer: ["Imagine measuring a shelf several times. Your readings might be a little different each time. Their average can be useful, but what if your ruler starts at the wrong mark? Every reading could be too large—even when the readings agree closely.", "In this experiment, we know the shelf is 50 centimetres long. The dots are simulated measurements. Increase the noise to spread them out. Then turn on the 5 cm offset: the whole group moves. An accurate-looking average can still be wrong."],
      standard: ["A measurement is an estimate, not a direct guarantee of the true value. Repeated readings can vary because of noise. A calibration error can also shift readings consistently, creating bias. Precision describes agreement between readings; close agreement alone does not establish accuracy.", "Averaging independent, zero-mean noise can reduce the variability of an estimate. It does not remove a shared offset. In a small sample, adding a reading can even move the average farther from the truth. Inspect both the measurement process and the data, rather than treating sample count as a guarantee."],
      advanced: ["The model is yᵢ = 50 + b + nᵢ, with optional bias b = 5 cm and a fixed synthetic sequence nᵢ scaled by the noise slider. The sample mean estimates 50 + b. With independent zero-mean noise of variance σ², the variance of the mean is σ²/N; the bias remains.", "Our deterministic sequence makes comparisons repeatable; it is not a random sample generator or a confidence-interval calculator. Correlated errors, drift, changing conditions, and miscalibration violate assumptions behind simple averaging. The true value is visible here for teaching; real measurement tasks rarely provide it."],
    },
    prediction: "If every measurement is shifted upward by 5 cm, what will taking more readings do?",
    predictions: ["Always remove the offset", "Leave a shared offset in the average", "Make all readings identical"],
    activity: "Compare 4 and 20 readings. Change the noise, then switch on the calibration offset. Watch the average and its error separately.",
    reflection: "What extra evidence would help you detect an offset if the true shelf length were hidden?",
    limits: "A fixed synthetic noise sequence, constant truth, and an optional fixed bias. No confidence interval is computed. This is an explanation of measurement behaviour, not a sensor calibration tool.",
    checks: [
      { prompt: "Twenty readings cluster tightly around 55 cm, but the shelf is 50 cm. What might explain this?", options: ["Many readings guarantee the shelf is 55 cm", "A shared calibration offset", "Random variation is impossible"], answer: 1, explanation: "Consistent readings can share the same error. A reference measurement or calibration check can help investigate an offset." },
      { prompt: "What can averaging independent, zero-mean noise usually improve?", options: ["The variability of the estimated mean", "Every source of bias", "Knowledge of all unobserved conditions"], answer: 0, explanation: "Under those assumptions, averaging reduces variance. It does not solve bias, missing information, or changes in the quantity being measured." },
    ], sources: [sources.uncertainty],
  },
  {
    id: "planning", title: "The shortest route is not always the right one", shortTitle: "Plans & constraints", category: "Decide", minutes: 12, accent: "sand",
    description: "Choose between routes using distance, effort, and a constraint that cannot be traded away.",
    objective: "Separate an objective to optimise from a constraint that an acceptable plan must satisfy.",
    takeaway: "A plan is only meaningful when its objective, constraints, and assumptions are explicit.",
    content: {
      explorer: ["A library robot has two ways to reach the returns desk. The short route crosses a busy reading area. The long route goes around it. Which is better? That depends on the rules: a shorter trip and a quieter route are different goals.", "Now imagine the short corridor is closed. It is not just less convenient; it is unavailable. A good planner first respects the rules, then compares the routes that remain. If every route is unavailable, it should say so instead of pretending there is a valid plan."],
      standard: ["Planning compares possible actions using a representation of the environment. An objective ranks acceptable plans—for example, by distance or energy. A constraint excludes unacceptable plans, such as entering a closed corridor.", "In this experiment, route A is shorter but passes through a busy area. Route B is longer and avoids it. A preference weight lets us explore a trade-off. Closing route A makes it infeasible regardless of its score. In a changing environment, the planner must revisit the assumptions behind a previously selected route."],
      advanced: ["We compare two precomputed candidates with cost J = distance + w × busy-area exposure. The units are illustrative: w converts the chosen exposure unit into the distance-equivalent cost used by this model. A closure is a feasibility condition, not a finite penalty.", "This is not a search algorithm and the two candidates do not exhaust all possible paths. Real planning requires representations, feasible actions, and often uncertainty about the map and execution. An optimiser can choose the best candidate under its model while still producing a poor real-world outcome if the model omits something important."],
    },
    prediction: "If the short corridor closes, should a low distance score keep it available?",
    predictions: ["Yes, distance is the only goal", "No, the closure makes that route infeasible", "Only if the robot moves faster"],
    activity: "Change the importance of avoiding the busy area. Then close the short corridor and observe how a constraint changes the choice.",
    reflection: "Name one assumption about this map that you would recheck before the robot starts moving.",
    limits: "Two fixed candidate routes and a simple additive cost. No dynamic people, map errors, vehicle geometry, or full path-search algorithm are modelled.",
    checks: [
      { prompt: "What is the difference between an objective and a hard constraint?", options: ["They are always interchangeable", "An objective ranks feasible plans; a constraint excludes unacceptable ones", "A constraint only makes a route slower"], answer: 1, explanation: "A short travel time cannot compensate for violating a hard constraint. Compare costs only among feasible options." },
      { prompt: "The route was clear earlier but is now blocked. What should happen?", options: ["Update the situation and reconsider the plan", "Keep following the earlier plan regardless", "Assume the map can never be wrong"], answer: 0, explanation: "A plan depends on assumptions about the environment. New information can invalidate it, requiring replanning or a safe pause." },
    ], sources: [sources.planning],
  },
  {
    id: "human", title: "Know when to ask for help", shortTitle: "People & responsibility", category: "Reflect", minutes: 12, accent: "mint",
    description: "Design a useful handover: what happened, what is uncertain, and what a person can do next.",
    objective: "Explain why useful human supervision needs information, time, and a safe fallback.",
    takeaway: "Human oversight works when a person can understand the situation and meaningfully intervene.",
    content: {
      explorer: ["The library robot reaches a doorway it cannot identify. It could guess, but a better design might stop at a suitable waiting place and ask a librarian. A useful message says what is confusing, where the robot is, and what help it needs.", "A button saying 'Take over!' is not enough if the person does not understand the situation. They also need time to respond. Until then, the robot needs a sensible way to wait. People remain responsible for deciding the robot's purpose, limits, and supervision."],
      standard: ["A human-in-the-loop label does not by itself make a system well supervised. The person needs an understandable view of the state, a clear request, sufficient response time, and an action they are authorised and able to take.", "Consider two alerts: 'Error 17' and 'Doorway identification is uncertain; paused at the waiting point; please confirm the destination.' The second supports a decision. If no one responds, the fallback should already be specified. It should not rely on an operator noticing a vague message at exactly the right moment."],
      advanced: ["A handover is a transition in authority and responsibility, not merely a notification. Evaluate the system mode, information available to the person, response-time budget, and behaviour during a delayed or absent response. Interface clarity and organisational arrangements both matter.", "The scenario below intentionally avoids a numerical confidence threshold. A model score is not automatically a calibrated probability, and an acceptable escalation policy depends on consequences and context. The educational goal is to identify missing handover information, not to prescribe an operational procedure."],
    },
    prediction: "Which detail helps a person respond to an ambiguous doorway report?",
    predictions: ["A larger warning icon alone", "The uncertainty, current state, and requested decision", "Only the software's internal error number"],
    activity: "Compare the two handover designs. Inspect what each tells the learner about the situation and the next decision.",
    reflection: "What should the robot do if the person is unavailable, and why must that behaviour be decided in advance?",
    limits: "A fictional library handover with qualitative choices. It is not a validated human-factors assessment or a procedure for any physical robot.",
    checks: [
      { prompt: "What makes a request for human help useful?", options: ["An unexplained alarm and immediate deadline", "Context, uncertainty, a clear decision, and time to respond", "The promise that a person can always fix it"], answer: 1, explanation: "Meaningful intervention requires information and a realistic opportunity to act. A warning by itself does not provide either." },
      { prompt: "Why specify a fallback before deployment?", options: ["The person may be unavailable or unable to respond in time", "Fallbacks remove all responsibility", "Every situation can be predicted perfectly"], answer: 0, explanation: "A system needs defined behaviour when a handover cannot be completed. Designing for delayed or absent responses is part of supervision." },
    ], sources: [sources.responsibility, sources.nasa],
  },
  {
    id: "systems", title: "One successful run is a beginning", shortTitle: "Test the whole system", category: "Connect", minutes: 15, accent: "sky",
    description: "Bring the loop together. Look beyond a headline success rate to the conditions that matter.",
    objective: "Use a test matrix to identify an evidence gap and propose a more informative next test.",
    takeaway: "Describe what was tested, under which conditions, and what remains unknown.",
    content: {
      explorer: ["Your library robot delivered a book successfully in an empty room. Does that mean it will work when the light is dim or a chair is in the way? You need to try different situations and keep a record of what happened.", "Tests that reveal a problem are useful. They show what to improve or what limit to state. A summary such as 'it worked 90% of the time' hides a lot if all the difficult situations failed. Ask where the failures happened, not just how many."],
      standard: ["Testing should connect requirements to evidence. A single successful demonstration establishes that one run succeeded under those conditions. It does not establish reliability across a wider operating range. Define relevant conditions, record outcomes, and inspect important groups separately.", "The fictional matrix below covers lighting and corridor layout. A large number of easy trials can hide poor results in a smaller difficult group. Empty cells represent missing evidence, not success. A useful next test targets an uncertainty or failure mode and states what the result would change."],
      advanced: ["A reported success rate depends on the test distribution and the definition of success. Pooling heterogeneous conditions can conceal conditional failure patterns. Stratified reporting makes coverage gaps visible, although small samples still support only limited conclusions.", "The matrix is synthetic and intentionally too small for a reliability claim. Real evaluation also needs representative scenarios, repeatability, independent checks, versioned configurations, and explicit acceptance criteria. The learning record in this course reports formative answers; it does not establish professional aptitude, job suitability, or operational certification."],
    },
    prediction: "A system succeeds in 18 of 20 bright-room trials. What do we know about dim rooms that were never tested?",
    predictions: ["They will have the same success rate", "Their performance remains unknown", "They must be easier"],
    activity: "Select a test condition to reveal the recorded result. Find a weak result and an untested condition, then choose what you would investigate next.",
    reflection: "Propose one next test, describe the uncertainty it addresses, and explain what result would change your conclusion.",
    limits: "Synthetic outcomes with small sample sizes. These numbers describe only the fictional trials shown; they are not benchmark results or a reliability estimate for any product.",
    checks: [
      { prompt: "What does an empty cell in a test matrix mean?", options: ["The system passed automatically", "There is no evidence from that condition yet", "The condition can be ignored"], answer: 1, explanation: "Untested conditions are evidence gaps. State that limitation and decide whether testing them is relevant to the intended use." },
      { prompt: "Which report is most informative?", options: ["Results by condition, sample counts, failures, and limitations", "Only the best run", "A single percentage without describing the trials"], answer: 0, explanation: "Conditions and counts make the evidence interpretable. Failures and limitations help readers understand what the results can and cannot support." },
    ], sources: [sources.responsibility],
  },
];
export const getLesson = (id) => LESSONS.find(lesson => lesson.id === id);
export function sensorReadings(noise, samples, biased = false) {
  const sequence = [.72, -.31, .45, -.84, .12, .59, -.66, .23, -.43, .89, -.18, -.51, .35, -.76, .61, -.08, .27, -.94, .49, -.36];
  return sequence.slice(0, samples).map(value => 50 + (biased ? 5 : 0) + value * noise);
}
export function feedbackPositions(gain) {
  const positions = [10];
  for (let step = 0; step < 12; step++) positions.push(positions[step] + gain * (50 - positions[step]));
  return positions;
}
