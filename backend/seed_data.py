"""Curriculum seed data — vendor-neutral, visual-first.

Each lesson is a sequence of `blocks`. Block types:
  widget    -> renders an interactive component (widgetId)
  chart     -> renders a Recharts chart (chartId)
  diagram   -> renders an animated diagram component (diagramId)
  caption   -> a short one-line caption (text)
  takeaway  -> highlighted single-line takeaway (text)
  deepdive  -> long-form text hidden behind an expander (text)
  image     -> illustration (url, alt)

Every lesson includes a quiz and a socialClip.
"""

TRACKS = [
    {
        "id": "track-foundations",
        "order": 1,
        "title": "Foundations of Flight & Autonomy",
        "summary": "How autonomy is defined, why things fly, and why a quadrotor needs a computer to stay in the sky.",
        "color": "#0047FF",
        "modules": [
            {
                "id": "mod-foundations-1",
                "order": 1,
                "title": "What Autonomy Means",
                "lessons": ["l-autonomy-ladder", "l-ooda-loop"],
            },
            {
                "id": "mod-foundations-2",
                "order": 2,
                "title": "Why Things Fly",
                "lessons": ["l-lift-drag", "l-airframes", "l-stability"],
            },
        ],
    },
    {
        "id": "track-anatomy",
        "order": 2,
        "title": "Anatomy of a Modern Drone",
        "summary": "Take a present-day drone apart and learn every component — motors, ESCs, IMU, GNSS, gimbal, radio.",
        "color": "#0047FF",
        "modules": [
            {
                "id": "mod-anatomy-1",
                "order": 1,
                "title": "The Exploded Drone",
                "lessons": ["l-exploded-tour", "l-propulsion-chain"],
            },
            {
                "id": "mod-anatomy-2",
                "order": 2,
                "title": "The Brain & The Eyes",
                "lessons": ["l-flight-controller", "l-gnss-rtk", "l-gimbal-payload"],
            },
        ],
    },
    {
        "id": "track-gnc",
        "order": 3,
        "title": "Guidance, Navigation & Control",
        "summary": "The feedback loops that turn a wobbly machine into a stable, navigating, autonomous flyer.",
        "color": "#0047FF",
        "modules": [
            {
                "id": "mod-gnc-1",
                "order": 1,
                "title": "Control Basics",
                "lessons": ["l-feedback-loop", "l-pid", "l-cascaded"],
            },
            {
                "id": "mod-gnc-2",
                "order": 2,
                "title": "Navigation & Planning",
                "lessons": ["l-waypoints", "l-avoidance", "l-no-gps"],
            },
        ],
    },
    {
        "id": "track-sensing",
        "order": 4,
        "title": "Sensing & Perception",
        "summary": "How a drone turns photons, accelerations and radio echoes into a model of the world.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-sensing-1", "order": 1, "title": "The Sensor Zoo", "lessons": ["l-sensor-zoo", "l-seeing-world"]},
            {"id": "mod-sensing-2", "order": 2, "title": "Estimation & Mapping", "lessons": ["l-filtering", "l-slam"]},
        ],
    },
    {
        "id": "track-comms",
        "order": 5,
        "title": "Communications & Connectivity",
        "summary": "Radio, latency, link loss — and why autonomy is the answer when comms fail.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-comms-1", "order": 1, "title": "RF & Datalinks", "lessons": ["l-rf-fundamentals", "l-telemetry"]},
            {"id": "mod-comms-2", "order": 2, "title": "Loss & Networks", "lessons": ["l-link-loss", "l-mesh"]},
        ],
    },
    {
        "id": "track-stack",
        "order": 6,
        "title": "The Autonomy Stack & AI",
        "summary": "From flight controller to companion computer — the pipeline that makes a drone think.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-stack-1", "order": 1, "title": "Software Anatomy", "lessons": ["l-software-anatomy", "l-pipeline"]},
            {"id": "mod-stack-2", "order": 2, "title": "Edge AI & Learning", "lessons": ["l-edge-ai", "l-cv-autonomy", "l-rl-intro"]},
        ],
    },
    {
        "id": "track-swarms",
        "order": 7,
        "title": "Multi-Agent Systems & Swarms",
        "summary": "Why coordination is hard, and how simple rules produce emergent group behavior.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-swarms-1", "order": 1, "title": "Emergence", "lessons": ["l-one-to-many", "l-emergent"]},
            {"id": "mod-swarms-2", "order": 2, "title": "Coordination", "lessons": ["l-consensus", "l-resilience"]},
        ],
    },
    {
        "id": "track-human",
        "order": 8,
        "title": "Human Factors & Operations",
        "summary": "The operator is half the system. Attention, workload, and the missions that drones really fly.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-human-1", "order": 1, "title": "The Operator's Mind", "lessons": ["l-sa-levels", "l-workload"]},
            {"id": "mod-human-2", "order": 2, "title": "Mission Lifecycle", "lessons": ["l-gcs-design", "l-mission-lifecycle"]},
        ],
    },
    {
        "id": "track-safety",
        "order": 9,
        "title": "Safety, Airspace & Ethics",
        "summary": "How airspace is shared, how to design for failure, and the open questions of autonomous accountability.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-safety-1", "order": 1, "title": "Airspace & Failure", "lessons": ["l-airspace", "l-design-for-failure"]},
            {"id": "mod-safety-2", "order": 2, "title": "Ethics", "lessons": ["l-ethics"]},
        ],
    },
    {
        "id": "track-apps",
        "order": 10,
        "title": "Drones in the Real World",
        "summary": "Where the science meets the field — mapping, agriculture, inspection, response and beyond.",
        "color": "#0047FF",
        "modules": [
            {"id": "mod-apps-1", "order": 1, "title": "Production Use", "lessons": ["l-mapping", "l-agriculture", "l-inspection"]},
            {"id": "mod-apps-2", "order": 2, "title": "Frontiers", "lessons": ["l-delivery", "l-public-safety", "l-frontiers"]},
        ],
    },
]


def _q(prompt, options, answer_idx, explanation):
    return {
        "type": "mcq",
        "prompt": prompt,
        "options": options,
        "answer": answer_idx,
        "explanation": explanation,
    }


LESSONS = {
    # ---------------- TRACK 1: FOUNDATIONS ----------------
    "l-autonomy-ladder": {
        "id": "l-autonomy-ladder",
        "moduleId": "mod-foundations-1",
        "trackId": "track-foundations",
        "order": 1,
        "title": "The Autonomy Ladder",
        "summary": "From teleoperation to full autonomy — climb the ladder.",
        "estMinutes": 4,
        "blocks": [
            {"type": "widget", "widgetId": "autonomy-ladder"},
            {
                "type": "caption",
                "text": "Each rung removes a human decision and gives it to the machine.",
                "eli12": "Imagine a ladder. At the bottom, you do everything. At the top, the robot does everything. Each step up, you let the robot do one more job.",
                "deep": "Autonomy is a discrete spectrum, not a boolean. SAE J3016 (cars) and similar drone scales define 5–6 levels of operational design domain (ODD), each shrinking the human's required intervention envelope.",
            },
            {"type": "diagram", "diagramId": "ooda-mini"},
            {
                "type": "takeaway",
                "text": "Autonomy is not a switch — it's a ladder of trust.",
                "eli12": "It's a LADDER, not a SWITCH. You can stop on any step.",
                "deep": "Autonomy is a contract: every level i specifies what the system handles vs. what the human must monitor. Mismatched expectations = the #1 cause of automation accidents.",
            },
        ],
        "quiz": [
            _q("Which level still requires the human to actively fly?",
               ["Full autonomy", "Teleoperation", "Conditional autonomy", "Assisted"],
               1, "Teleoperation = human flies via remote link. The machine only obeys."),
            _q("'Conditional autonomy' means…",
               ["The machine flies but the human can take over",
                "The human flies but the machine can take over",
                "The machine always flies", "The human always flies"],
               0, "Conditional = machine handles the mission, human is a fallback."),
        ],
        "socialClip": {
            "hook": "Is your drone really 'autonomous'?",
            "coreIdea": "Autonomy is a ladder, not a switch.",
            "visualSuggestion": "Climb a 5-rung ladder — each rung lights up.",
            "takeaway": "Levels matter. Don't mistake assisted for autonomous.",
            "hashtags": ["#autonomy", "#drones", "#howitworks"],
        },
    },
    "l-ooda-loop": {
        "id": "l-ooda-loop",
        "moduleId": "mod-foundations-1",
        "trackId": "track-foundations",
        "order": 2,
        "title": "Sense → Think → Act",
        "summary": "Every autonomous system runs a loop. Here's the loop.",
        "estMinutes": 3,
        "blocks": [
            {"type": "diagram", "diagramId": "ooda-loop"},
            {
                "type": "caption",
                "text": "Observe, Orient, Decide, Act — and repeat 100× a second.",
                "eli12": "The robot keeps asking itself: What do I see? What does it mean? What should I do? Then it does it. Over and over, super fast.",
                "deep": "OODA (Boyd, 1976) generalizes to all closed-loop autonomy: at runtime, this becomes a 50–1000 Hz control loop where sensor fusion, state estimation, planning and actuation share a strict deadline.",
            },
            {"type": "widget", "widgetId": "signal-noise"},
            {
                "type": "takeaway",
                "text": "Autonomy = a loop that never stops correcting itself.",
                "eli12": "Autonomous things are always checking their work — like you do when riding a bike.",
                "deep": "Closed-loop > open-loop. Latency × gain × phase margin determines whether the loop is stable, marginally stable, or unstable.",
            },
        ],
        "quiz": [
            _q("Which step turns raw sensor data into a world model?",
               ["Observe", "Orient", "Decide", "Act"],
               1, "Orient builds the model. Observe just gathers."),
            _q("If the loop runs slower, the system is…",
               ["More accurate", "Less reactive", "More stable", "More autonomous"],
               1, "Slow loop = lag. Lag = instability and slower reaction."),
        ],
        "socialClip": {
            "hook": "The 4 letters behind every autonomous machine.",
            "coreIdea": "OODA — Observe, Orient, Decide, Act.",
            "visualSuggestion": "Animated 4-node loop with signals flowing.",
            "takeaway": "Faster loops = smarter machines.",
            "hashtags": ["#OODA", "#autonomy", "#engineering"],
        },
    },
    "l-lift-drag": {
        "id": "l-lift-drag",
        "moduleId": "mod-foundations-2",
        "trackId": "track-foundations",
        "order": 1,
        "title": "Lift Lab",
        "summary": "Drag the sliders. Watch lift and drag fight.",
        "estMinutes": 5,
        "blocks": [
            {"type": "widget", "widgetId": "lift-lab"},
            {
                "type": "caption",
                "text": "Lift grows with speed² and with angle of attack — until the wing stalls.",
                "eli12": "Push air down → it pushes the wing up. Push twice as fast, get four times the push. But tilt too much and it suddenly stops working.",
                "deep": "Aerodynamic lift derives from the pressure differential across the airfoil per Bernoulli + Kutta-Joukowski. Lift scales with v² (dynamic pressure) and CL(α), which collapses at the critical angle of attack (~15° for most wings).",
            },
            {
                "type": "takeaway",
                "text": "Lift is free. Drag is the bill.",
                "eli12": "Going up = cheap. Going forward = costs energy.",
                "deep": "Endurance ∝ (L/D)^(3/2). Maximize lift-to-drag ratio at cruise, not just lift coefficient — that's the dominant design constraint for fixed-wing UAVs.",
            },
            {"type": "deepdive", "text": "L = ½·ρ·v²·S·CL where CL itself depends on angle of attack. Past the stall angle CL collapses and the wing stops flying."},
        ],
        "quiz": [
            _q("Doubling airspeed (other things equal) increases lift by roughly…",
               ["2×", "4×", "8×", "1.4×"],
               1, "Lift scales with the square of velocity."),
            _q("What happens at the stall angle?",
               ["Drag vanishes", "Lift collapses", "Thrust doubles", "Weight drops"],
               1, "Flow separates from the wing and lift falls off a cliff."),
        ],
        "socialClip": {
            "hook": "Why do wings stop working?",
            "coreIdea": "Past the stall angle, lift collapses.",
            "visualSuggestion": "Airfoil tilting until streamlines tear off the top.",
            "takeaway": "Angle of attack has a ceiling.",
            "hashtags": ["#aerodynamics", "#STEM", "#flight"],
        },
    },
    "l-airframes": {
        "id": "l-airframes",
        "moduleId": "mod-foundations-2",
        "trackId": "track-foundations",
        "order": 2,
        "title": "Airframe Families",
        "summary": "Multirotor, fixed-wing, or VTOL? Pick your trade-off.",
        "estMinutes": 4,
        "blocks": [
            {"type": "chart", "chartId": "airframe-radar"},
            {"type": "caption", "text": "Multirotor hovers. Fixed-wing endures. VTOL tries to do both.",
             "eli12": "Helicopter-style drones can stop in mid-air. Plane-style drones fly farther but never stop. VTOL drones do both — but it's tricky.",
             "deep": "Multirotor: low disk loading, high thrust-to-weight (~2:1), poor endurance (15–40 min). Fixed-wing: high L/D (~15), 2–10× endurance. VTOL: dual propulsion penalty (~20–30% payload loss)."},
            {"type": "takeaway", "text": "There is no best airframe — only the right one for the mission.",
             "eli12": "Different drones for different jobs — like different cars for different roads.",
             "deep": "Airframe choice is a mission-profile optimization: range × payload × on-station time × precision-hover. No global optimum."},
        ],
        "quiz": [
            _q("Best endurance per Wh of battery?",
               ["Quadrotor", "Fixed-wing", "Hexarotor", "Flapping-wing"],
               1, "Fixed wings glide. Rotors fight gravity every second."),
            _q("Can hover and fly forward efficiently?",
               ["Multirotor", "Fixed-wing", "Hybrid VTOL", "None"],
               2, "VTOL transitions between hover and cruise."),
        ],
        "socialClip": {
            "hook": "Drone or plane? The hidden trade-off.",
            "coreIdea": "Hover costs endurance.",
            "visualSuggestion": "Side-by-side hover-time vs range bar chart.",
            "takeaway": "Pick the mission, then pick the frame.",
            "hashtags": ["#drones", "#engineering", "#tradeoffs"],
        },
    },
    "l-stability": {
        "id": "l-stability",
        "moduleId": "mod-foundations-2",
        "trackId": "track-foundations",
        "order": 3,
        "title": "Why a Quadrotor Needs a Computer",
        "summary": "Push the drone. Watch it correct — or fail.",
        "estMinutes": 4,
        "blocks": [
            {"type": "widget", "widgetId": "stability-drone"},
            {"type": "caption", "text": "A quadrotor is unstable by design. Without code, it tips over.",
             "eli12": "A quadcopter wants to fall over. The computer catches it 1000 times every second — that's why it flies.",
             "deep": "A quadrotor has 4 actuators and 6 DOF — under-actuated. It is open-loop unstable: pitch/roll dynamics are non-minimum-phase and require active control via differential thrust at >100 Hz to remain bounded."},
            {"type": "takeaway", "text": "Stability is software.",
             "eli12": "The brain does the balancing — not the body.",
             "deep": "Stability isn't a property of the airframe; it's a property of the airframe + controller + sensor + latency stack as a closed-loop system."},
        ],
        "quiz": [
            _q("Without a flight controller, a quadrotor will…",
               ["Hover perfectly", "Tip over within a second", "Spin in place", "Climb forever"],
               1, "Asymmetric thrust feedback is needed continuously."),
        ],
        "socialClip": {
            "hook": "Why won't a quadrotor just hover?",
            "coreIdea": "Stability is code, not chassis.",
            "visualSuggestion": "A drone tipping over with the computer off.",
            "takeaway": "Software keeps it in the sky.",
            "hashtags": ["#flight", "#controls", "#drones"],
        },
    },

    # ---------------- TRACK 2: ANATOMY ----------------
    "l-exploded-tour": {
        "id": "l-exploded-tour",
        "moduleId": "mod-anatomy-1",
        "trackId": "track-anatomy",
        "order": 1,
        "title": "Exploded Drone Tour",
        "summary": "Pull the drone apart. Tap each part. Put it back together.",
        "estMinutes": 6,
        "blocks": [
            {"type": "widget", "widgetId": "exploded-drone"},
            {"type": "caption", "text": "Six subsystems. One flying machine."},
            {"type": "takeaway", "text": "A drone is a coordinated society of subsystems."},
        ],
        "quiz": [
            _q("Which component decides motor speeds in flight?",
               ["GNSS module", "Flight controller", "ESC", "Battery"],
               1, "The flight controller computes setpoints; ESCs execute them."),
            _q("Which part converts DC battery power into 3-phase motor drive?",
               ["IMU", "ESC", "Receiver", "Gimbal"],
               1, "ESC = Electronic Speed Controller."),
        ],
        "socialClip": {
            "hook": "What's inside a drone?",
            "coreIdea": "6 subsystems, 1 flying machine.",
            "visualSuggestion": "Exploded view, parts floating apart.",
            "takeaway": "Every part has one job.",
            "hashtags": ["#drones", "#engineering", "#teardown"],
        },
    },
    "l-propulsion-chain": {
        "id": "l-propulsion-chain",
        "moduleId": "mod-anatomy-1",
        "trackId": "track-anatomy",
        "order": 2,
        "title": "The Propulsion Chain",
        "summary": "Battery → ESC → BLDC motor → prop. Watch the electrons fly.",
        "estMinutes": 5,
        "blocks": [
            {"type": "widget", "widgetId": "motor-commutation"},
            {"type": "caption", "text": "An ESC fires the motor's coils in sequence. No brushes."},
            {"type": "chart", "chartId": "thrust-vs-rpm"},
            {"type": "takeaway", "text": "Thrust costs current. Current drains the battery."},
        ],
        "quiz": [
            _q("BLDC motors have…",
               ["Brushes and a commutator", "No brushes, electronically switched", "Brushes only", "A gearbox always"],
               1, "Brushless DC = electronic commutation."),
            _q("Thrust scales roughly with…",
               ["RPM", "RPM²", "RPM³", "√RPM"],
               1, "Aerodynamic load scales with RPM²."),
        ],
        "socialClip": {
            "hook": "How does a brushless motor spin without brushes?",
            "coreIdea": "Electronic commutation.",
            "visualSuggestion": "3 coils glowing in rotating sequence.",
            "takeaway": "Power electronics replaced the brush.",
            "hashtags": ["#BLDC", "#motors", "#engineering"],
        },
    },
    "l-flight-controller": {
        "id": "l-flight-controller",
        "moduleId": "mod-anatomy-2",
        "trackId": "track-anatomy",
        "order": 1,
        "title": "The Brain on the Board",
        "summary": "MCU, IMU, baro, compass — meet the flight controller.",
        "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "fc-board"},
            {"type": "caption", "text": "An MCU, an IMU, a barometer, a compass — and firmware like PX4 or ArduPilot."},
            {"type": "takeaway", "text": "The flight controller is the spinal cord of the drone."},
        ],
        "quiz": [
            _q("Which sensor measures angular rate?",
               ["Accelerometer", "Gyroscope", "Barometer", "Magnetometer"],
               1, "Gyro = rate of rotation. Accel = linear acceleration."),
            _q("What gives an absolute heading reference (north)?",
               ["IMU", "Barometer", "Magnetometer", "GNSS only"],
               2, "The magnetometer reads Earth's field."),
        ],
        "socialClip": {
            "hook": "How does a drone know which way is up?",
            "coreIdea": "IMU + baro + compass + math.",
            "visualSuggestion": "Tappable flight controller board.",
            "takeaway": "Sensors lie. Fusion tells the truth.",
            "hashtags": ["#sensors", "#avionics", "#engineering"],
        },
    },
    "l-gnss-rtk": {
        "id": "l-gnss-rtk",
        "moduleId": "mod-anatomy-2",
        "trackId": "track-anatomy",
        "order": 2,
        "title": "GNSS & RTK",
        "summary": "From metre-error to centimetre-error in one correction stream.",
        "estMinutes": 5,
        "blocks": [
            {"type": "widget", "widgetId": "rtk-visualizer"},
            {"type": "caption", "text": "A base station broadcasts corrections. The rover shrinks its error.",
             "eli12": "One radio sits perfectly still and yells 'I am HERE'. The drone listens and uses that to know exactly where IT is.",
             "deep": "RTK uses the carrier phase (cm-wavelength) rather than just code-phase pseudoranges, plus a known-position base station's correction stream over RTCM-3 to resolve integer ambiguities — yielding 1–2 cm precision."},
            {"type": "takeaway", "text": "RTK is centimetres. GPS alone is metres.",
             "eli12": "Plain GPS = 'within a parking spot'. RTK = 'on the exact paint stripe'.",
             "deep": "Standard SPS GPS: ~3–10 m CEP. RTK fixed: ~1–2 cm horizontal, 2–5 cm vertical. Trade-off: requires base station within ~30 km and continuous radio link."},
        ],
        "quiz": [
            _q("RTK improves accuracy from… to…",
               ["km → m", "m → cm", "cm → mm", "m → m"],
               1, "Typical: ~2 m standalone → ~1–3 cm with RTK."),
            _q("RTK needs…",
               ["A second satellite", "A base-station correction stream", "More batteries", "A bigger antenna"],
               1, "The base provides phase corrections."),
        ],
        "socialClip": {
            "hook": "How does a drone land on a coin?",
            "coreIdea": "RTK GNSS corrections.",
            "visualSuggestion": "Error circle shrinks around the drone.",
            "takeaway": "Precision is a correction away.",
            "hashtags": ["#GNSS", "#RTK", "#mapping"],
        },
    },
    "l-gimbal-payload": {
        "id": "l-gimbal-payload",
        "moduleId": "mod-anatomy-2",
        "trackId": "track-anatomy",
        "order": 3,
        "title": "Eyes & Gimbals",
        "summary": "Cameras, LiDAR, multispectral — and the gimbals that hold them steady.",
        "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "gimbal-stabilize"},
            {"type": "caption", "text": "Three motors cancel three axes of motion."},
            {"type": "takeaway", "text": "A gimbal is a tiny control system carried by a bigger one."},
        ],
        "quiz": [
            _q("A 3-axis gimbal stabilizes which axes?",
               ["X only", "Roll, pitch, yaw", "Roll & pitch only", "X, Y"],
               1, "Roll, pitch, yaw — all three rotations."),
        ],
        "socialClip": {
            "hook": "Why doesn't drone footage shake?",
            "coreIdea": "3-axis gimbal cancels rotation.",
            "visualSuggestion": "Gimbal staying flat as drone tilts.",
            "takeaway": "Cinematic stability = miniature control loops.",
            "hashtags": ["#gimbal", "#cinematography", "#engineering"],
        },
    },

    # ---------------- TRACK 5: GNC ----------------
    "l-feedback-loop": {
        "id": "l-feedback-loop",
        "moduleId": "mod-gnc-1",
        "trackId": "track-gnc",
        "order": 1,
        "title": "The Feedback Loop",
        "summary": "Setpoint, measurement, error. The atom of control.",
        "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "feedback-loop"},
            {"type": "caption", "text": "Error = setpoint − measurement. Everything else is response."},
            {"type": "takeaway", "text": "Control is the art of correcting error."},
        ],
        "quiz": [
            _q("Error is defined as…",
               ["setpoint × measurement", "setpoint + measurement", "setpoint − measurement", "measurement / setpoint"],
               2, "Error is the gap between desired and actual."),
        ],
        "socialClip": {
            "hook": "The simplest idea in autonomy.",
            "coreIdea": "Error = setpoint − measurement.",
            "visualSuggestion": "Animated loop with error highlighted.",
            "takeaway": "Every controller is a loop.",
            "hashtags": ["#controls", "#engineering", "#STEM"],
        },
    },
    "l-pid": {
        "id": "l-pid",
        "moduleId": "mod-gnc-1",
        "trackId": "track-gnc",
        "order": 2,
        "title": "Meet the PID Controller",
        "summary": "Drag P, I, D. Tune a hover.",
        "estMinutes": 7,
        "blocks": [
            {"type": "widget", "widgetId": "pid-tuner"},
            {"type": "caption", "text": "P reacts now · I cleans drift · D damps overshoot.",
             "eli12": "P pushes harder when you're far off. I notices when you keep being slightly off. D slows you down before you overshoot.",
             "deep": "u(t) = Kp·e(t) + Ki·∫e(τ)dτ + Kd·de/dt. Kp sets bandwidth, Ki removes steady-state error (at the cost of phase lag), Kd improves transient response (at the cost of noise amplification)."},
            {"type": "diagram", "diagramId": "feedback-loop"},
            {"type": "takeaway", "text": "Autonomy starts with a loop that never stops correcting itself.",
             "eli12": "Set a goal. Notice the gap. Fix the gap. Repeat — forever.",
             "deep": "PID is the simplest universal closed-loop controller. Tune it correctly and it solves 90% of real-world control problems; tune it wrong and it builds the resonant frequency of disaster."},
            {"type": "deepdive", "text": "u(t) = Kp·e(t) + Ki·∫e(τ)dτ + Kd·de/dt. Kp speeds response, Ki kills steady-state error, Kd opposes velocity to reduce overshoot."},
        ],
        "quiz": [
            _q("Your drone oscillates around the target. Which gain is likely too high?",
               ["P", "I", "D", "None"],
               0, "High P over-corrects, producing oscillation."),
            _q("Steady-state error refuses to go to zero. Which gain to raise?",
               ["P", "I", "D", "None"],
               1, "I integrates error over time and erases steady offsets."),
        ],
        "socialClip": {
            "hook": "Why does a drone wobble?",
            "coreIdea": "PID = correct, don't overcorrect.",
            "visualSuggestion": "Drone overshooting target then settling.",
            "takeaway": "Stability is a feedback loop.",
            "hashtags": ["#PID", "#controls", "#autonomy"],
        },
    },
    "l-cascaded": {
        "id": "l-cascaded",
        "moduleId": "mod-gnc-1",
        "trackId": "track-gnc",
        "order": 3,
        "title": "Cascaded Control",
        "summary": "Position loop wraps attitude loop wraps rate loop.",
        "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "cascaded"},
            {"type": "caption", "text": "Inner loops run fast. Outer loops set their goals."},
            {"type": "takeaway", "text": "Big problems = small loops nested inside bigger loops."},
        ],
        "quiz": [
            _q("Which loop runs fastest in a drone?",
               ["Position", "Velocity", "Attitude", "Rate (angular)"],
               3, "Rate loop is innermost and fastest (~1 kHz)."),
        ],
        "socialClip": {
            "hook": "One loop isn't enough.",
            "coreIdea": "Cascaded control: nested loops.",
            "visualSuggestion": "Three concentric rings spinning at different speeds.",
            "takeaway": "Speed scales with depth.",
            "hashtags": ["#controls", "#engineering", "#drones"],
        },
    },
    "l-waypoints": {
        "id": "l-waypoints",
        "moduleId": "mod-gnc-2",
        "trackId": "track-gnc",
        "order": 1,
        "title": "Waypoints & Trajectories",
        "summary": "Click points. Watch a smooth path appear.",
        "estMinutes": 4,
        "blocks": [
            {"type": "widget", "widgetId": "waypoint-planner"},
            {"type": "caption", "text": "Waypoints are wishes. Trajectories make them feasible."},
            {"type": "takeaway", "text": "A path is not a plan — a trajectory is."},
        ],
        "quiz": [
            _q("Why isn't a straight line between waypoints enough?",
               ["It's always enough", "The drone has dynamics; corners are infeasible", "GPS is broken", "Battery limits"],
               1, "Real drones can't make sharp corners — they need smooth curves."),
        ],
        "socialClip": {
            "hook": "How does a drone fly a mission?",
            "coreIdea": "Waypoints become smooth trajectories.",
            "visualSuggestion": "Dots becoming a curving line.",
            "takeaway": "Smooth = feasible.",
            "hashtags": ["#planning", "#drones", "#engineering"],
        },
    },
    "l-avoidance": {
        "id": "l-avoidance",
        "moduleId": "mod-gnc-2",
        "trackId": "track-gnc",
        "order": 2,
        "title": "Sensor Fusion & Avoidance",
        "summary": "Drop sensors in and out. Watch the estimate behave.",
        "estMinutes": 6,
        "blocks": [
            {"type": "widget", "widgetId": "sensor-fusion"},
            {"type": "caption", "text": "Fusion turns several lying sensors into one truth.",
             "eli12": "If your watch says 8:00 and your phone says 8:02, you don't pick one — you find a smart middle. That's sensor fusion.",
             "deep": "An extended Kalman filter (EKF) merges noisy IMU integration with periodic absolute fixes (GPS, vision) using a weighted average inversely proportional to each source's covariance — minimizing the L2 estimation error of the fused state."},
            {"type": "takeaway", "text": "No single sensor is enough. Together, they are.",
             "eli12": "Many imperfect senses make one good one.",
             "deep": "Observability ≠ measurability. Fusion creates observable states (like global position from inertial+GPS) that no single sensor alone could provide."},
        ],
        "quiz": [
            _q("Why fuse sensors at all?",
               ["More data is always better", "Each sensor has different strengths and failure modes", "Redundancy is required by law", "To use more battery"],
               1, "Fusion exploits complementary strengths."),
        ],
        "socialClip": {
            "hook": "How does a drone know where it is?",
            "coreIdea": "Sensor fusion.",
            "visualSuggestion": "Toggle GPS/IMU/vision, watch position drift.",
            "takeaway": "Truth is an average over honest mistakes.",
            "hashtags": ["#sensorfusion", "#autonomy", "#kalman"],
        },
    },
    "l-no-gps": {
        "id": "l-no-gps",
        "moduleId": "mod-gnc-2",
        "trackId": "track-gnc",
        "order": 3,
        "title": "Navigating Without GPS",
        "summary": "Drift accumulates. Vision corrects.",
        "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "no-gps-drift"},
            {"type": "caption", "text": "Dead reckoning grows error linearly. Vision snaps it back."},
            {"type": "takeaway", "text": "Eyes beat inertia when GPS goes dark."},
        ],
        "quiz": [
            _q("Without GPS, IMU-only position estimates…",
               ["Stay accurate forever", "Drift over time", "Get more accurate", "Stop working immediately"],
               1, "Tiny biases integrate into unbounded position error."),
        ],
        "socialClip": {
            "hook": "What happens when GPS dies?",
            "coreIdea": "Vision rescues navigation.",
            "visualSuggestion": "Estimate diverging then snapping back.",
            "takeaway": "Eyes > inertia indoors.",
            "hashtags": ["#SLAM", "#navigation", "#drones"],
        },
    },

    # ============================================================
    # TRACK 4 — SENSING & PERCEPTION
    # ============================================================
    "l-sensor-zoo": {
        "id": "l-sensor-zoo", "moduleId": "mod-sensing-1", "trackId": "track-sensing", "order": 1,
        "title": "The Sensor Zoo", "summary": "Each sensor measures something — and lies in its own way.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "sensor-zoo"},
            {"type": "caption", "text": "IMU is fast and drifty. GNSS is absolute and noisy. Cameras are rich and ambiguous."},
            {"type": "takeaway", "text": "Pick sensors for what they don't lie about."},
        ],
        "quiz": [
            _q("Which sensor gives an absolute position fix?", ["IMU", "Camera", "GNSS", "Barometer"], 2, "GNSS is the only one absolute."),
            _q("Which sensor has the highest update rate?", ["GNSS", "IMU", "LiDAR", "Camera"], 1, "IMU runs at ~1 kHz."),
        ],
        "socialClip": {"hook": "Every drone sensor lies. Differently.", "coreIdea": "Strengths and failure modes.", "visualSuggestion": "Sensor cards with green/red dots.", "takeaway": "Fusion exploits differences.", "hashtags": ["#sensors", "#robotics"]},
    },
    "l-seeing-world": {
        "id": "l-seeing-world", "moduleId": "mod-sensing-1", "trackId": "track-sensing", "order": 2,
        "title": "Seeing the World", "summary": "Cameras, LiDAR, radar — each builds a different picture of the same scene.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "sensor-views"},
            {"type": "caption", "text": "A camera sees colour. LiDAR sees distance. Radar sees velocity."},
            {"type": "takeaway", "text": "Truth depends on which sense you trust."},
        ],
        "quiz": [
            _q("LiDAR primarily measures…", ["Color", "Distance", "Heat", "Sound"], 1, "LiDAR = laser ranging."),
        ],
        "socialClip": {"hook": "Three sensors. Same scene. Three different worlds.", "coreIdea": "Modality matters.", "visualSuggestion": "Triptych view.", "takeaway": "Modalities are not redundant.", "hashtags": ["#perception", "#lidar"]},
    },
    "l-filtering": {
        "id": "l-filtering", "moduleId": "mod-sensing-2", "trackId": "track-sensing", "order": 1,
        "title": "Filtering Intuition", "summary": "From average → complementary → Kalman. The noise-killer ladder.", "estMinutes": 5,
        "blocks": [
            {"type": "widget", "widgetId": "signal-noise"},
            {"type": "caption", "text": "A filter trades responsiveness for smoothness."},
            {"type": "takeaway", "text": "All filters are weighted memory."},
            {"type": "deepdive", "text": "A Kalman filter maintains a belief (mean + covariance), predicts forward via a motion model, then updates with each measurement weighted by sensor variance."},
        ],
        "quiz": [
            _q("A filter trades…", ["Mass for speed", "Responsiveness for smoothness", "Cost for power", "Range for accuracy"], 1, "Smoother output reacts slower."),
        ],
        "socialClip": {"hook": "Your IMU is screaming nonsense. What now?", "coreIdea": "Filter, don't trust.", "visualSuggestion": "Noisy line tamed into a smooth curve.", "takeaway": "Filters = weighted memory.", "hashtags": ["#kalman", "#sensors"]},
    },
    "l-slam": {
        "id": "l-slam", "moduleId": "mod-sensing-2", "trackId": "track-sensing", "order": 2,
        "title": "Mapping While Moving", "summary": "SLAM: building a map and locating yourself in it — at the same time.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "slam-build"},
            {"type": "caption", "text": "Loop-closure: when you recognize where you've been, error collapses."},
            {"type": "takeaway", "text": "Locate by mapping. Map by locating."},
        ],
        "quiz": [
            _q("SLAM stands for…", ["Speed-Level Auto-Mode", "Simultaneous Localization And Mapping", "Sensor-Linked Algorithmic Method", "Stereo Laser Auto-Mapping"], 1, "S = Simultaneous, L = Localization, A = And, M = Mapping."),
        ],
        "socialClip": {"hook": "Walk into a new room. Now make a map.", "coreIdea": "SLAM = both at once.", "visualSuggestion": "Map drawing itself as drone moves.", "takeaway": "Where you are is where the map says you are.", "hashtags": ["#SLAM", "#robotics"]},
    },

    # ============================================================
    # TRACK 5 — COMMUNICATIONS
    # ============================================================
    "l-rf-fundamentals": {
        "id": "l-rf-fundamentals", "moduleId": "mod-comms-1", "trackId": "track-comms", "order": 1,
        "title": "RF Fundamentals", "summary": "Frequency, bandwidth, line-of-sight — the physics of the link.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "rf-wave"},
            {"type": "caption", "text": "More bandwidth costs more power and shrinks range."},
            {"type": "takeaway", "text": "Range × bandwidth × power = pick two."},
        ],
        "quiz": [
            _q("Higher frequency generally means…", ["Longer range", "More bandwidth, shorter range", "Lower power", "More antennas"], 1, "Higher freqs carry more data but attenuate faster."),
        ],
        "socialClip": {"hook": "Why does your drone lose link behind a tree?", "coreIdea": "Line of sight + frequency.", "visualSuggestion": "Wave bouncing off obstacles.", "takeaway": "RF is geometry.", "hashtags": ["#RF", "#radio"]},
    },
    "l-telemetry": {
        "id": "l-telemetry", "moduleId": "mod-comms-1", "trackId": "track-comms", "order": 2,
        "title": "Telemetry & Latency", "summary": "Command up. Video down. Every millisecond matters.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "telemetry-flow"},
            {"type": "caption", "text": "200 ms latency feels alive. 800 ms feels broken."},
            {"type": "takeaway", "text": "Latency is the invisible budget."},
        ],
        "quiz": [
            _q("Tele-operation generally needs latency below…", ["1 s", "300 ms", "10 ms", "1 ms"], 1, "Roughly 200–300 ms is the upper bound for direct control."),
        ],
        "socialClip": {"hook": "What 1 second of lag does to a pilot.", "coreIdea": "Latency budget.", "visualSuggestion": "Packet flow with rising timeline.", "takeaway": "Milliseconds steer drones.", "hashtags": ["#latency", "#networking"]},
    },
    "l-link-loss": {
        "id": "l-link-loss", "moduleId": "mod-comms-2", "trackId": "track-comms", "order": 1,
        "title": "Losing the Link", "summary": "When comms die, autonomy lives. Failsafes and return-to-home.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "link-loss-rth"},
            {"type": "caption", "text": "On link loss the drone keeps thinking. That's the point of autonomy."},
            {"type": "takeaway", "text": "Autonomy is what survives a dead radio."},
        ],
        "quiz": [
            _q("'RTH' stands for…", ["Real-Time Heading", "Return-To-Home", "Remote-Telemetry-Hub", "Roll-Then-Hover"], 1, "Return-To-Home failsafe."),
        ],
        "socialClip": {"hook": "Your radio dies. What does the drone do?", "coreIdea": "Failsafe = autonomy minimum.", "visualSuggestion": "Drone tracing path back to home.", "takeaway": "Autonomy is a parachute.", "hashtags": ["#failsafe", "#drones"]},
    },
    "l-mesh": {
        "id": "l-mesh", "moduleId": "mod-comms-2", "trackId": "track-comms", "order": 2,
        "title": "Mesh Networks", "summary": "When one radio isn't enough, the swarm becomes the radio.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "mesh-network"},
            {"type": "caption", "text": "Drop a node, re-route. Networks heal."},
            {"type": "takeaway", "text": "Mesh = redundancy in shape."},
        ],
        "quiz": [
            _q("When a mesh node fails…", ["The network collapses", "Traffic re-routes", "Everyone calls base", "The radio frequency changes"], 1, "Mesh routing protocols heal around failures."),
        ],
        "socialClip": {"hook": "When 1 drone isn't enough, the swarm becomes the radio.", "coreIdea": "Mesh networking.", "visualSuggestion": "Node graph re-routing.", "takeaway": "Networks heal.", "hashtags": ["#mesh", "#networking"]},
    },

    # ============================================================
    # TRACK 6 — AUTONOMY STACK & AI
    # ============================================================
    "l-software-anatomy": {
        "id": "l-software-anatomy", "moduleId": "mod-stack-1", "trackId": "track-stack", "order": 1,
        "title": "Software Anatomy", "summary": "Flight controller, companion computer, ground station — three boxes, one mission.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "software-anatomy"},
            {"type": "caption", "text": "FC handles 'don't fall'. Companion handles 'think'. GCS handles 'humans'."},
            {"type": "takeaway", "text": "Different brains for different deadlines."},
        ],
        "quiz": [
            _q("Which runs the inner control loops at 1 kHz?", ["Companion computer", "Ground station", "Flight controller", "Cloud"], 2, "FC handles hard real-time."),
        ],
        "socialClip": {"hook": "Three computers in every modern drone. Here's why.", "coreIdea": "Layered compute.", "visualSuggestion": "Stacked boxes with arrows.", "takeaway": "Right brain for right deadline.", "hashtags": ["#autonomy", "#architecture"]},
    },
    "l-pipeline": {
        "id": "l-pipeline", "moduleId": "mod-stack-1", "trackId": "track-stack", "order": 2,
        "title": "Perception → Planning → Control", "summary": "Every autonomous machine runs the same three-stage pipeline.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "perception-pipeline"},
            {"type": "caption", "text": "See the world. Decide the move. Send the motors."},
            {"type": "takeaway", "text": "Three stages. One mission per second, 1000 times a second."},
        ],
        "quiz": [
            _q("Which stage produces motor commands?", ["Perception", "Planning", "Control", "Mapping"], 2, "Control issues actuator commands."),
        ],
        "socialClip": {"hook": "The 3 stages every autonomous machine runs.", "coreIdea": "P → P → C.", "visualSuggestion": "Pipeline with flowing data.", "takeaway": "Every autonomy is a pipe.", "hashtags": ["#robotics", "#pipeline"]},
    },
    "l-edge-ai": {
        "id": "l-edge-ai", "moduleId": "mod-stack-2", "trackId": "track-stack", "order": 1,
        "title": "Edge AI Trade-offs", "summary": "Smarter onboard means heavier, hotter, hungrier.", "estMinutes": 4,
        "blocks": [
            {"type": "chart", "chartId": "edge-ai"},
            {"type": "caption", "text": "Compute × latency × power × weight — pick your battle."},
            {"type": "takeaway", "text": "Onboard intelligence has a metabolic cost."},
        ],
        "quiz": [
            _q("Sending video to the cloud trades…", ["Power for latency", "Latency for compute", "Range for weight", "Cost for trust"], 1, "You save compute on the drone at the cost of latency."),
        ],
        "socialClip": {"hook": "Why isn't AI just on the drone?", "coreIdea": "Compute has weight.", "visualSuggestion": "4-axis trade-off chart.", "takeaway": "Smart costs grams.", "hashtags": ["#edgeAI", "#drones"]},
    },
    "l-cv-autonomy": {
        "id": "l-cv-autonomy", "moduleId": "mod-stack-2", "trackId": "track-stack", "order": 2,
        "title": "Computer Vision for Autonomy", "summary": "Detection, tracking, segmentation — turning pixels into decisions.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "cv-bboxes"},
            {"type": "caption", "text": "Bounding boxes find. Trackers follow. Masks separate."},
            {"type": "takeaway", "text": "Pixels become decisions when models attach meaning."},
        ],
        "quiz": [
            _q("Tracking is harder than detection because…", ["Light is brighter", "Objects move and look different", "Cameras are slower", "Pixels are denser"], 1, "Identity must persist across frames despite motion/occlusion."),
        ],
        "socialClip": {"hook": "How does a drone know what it's looking at?", "coreIdea": "Detection → tracking → segmentation.", "visualSuggestion": "Live boxes over a scene.", "takeaway": "Pixels → decisions.", "hashtags": ["#computerVision", "#AI"]},
    },
    "l-rl-intro": {
        "id": "l-rl-intro", "moduleId": "mod-stack-2", "trackId": "track-stack", "order": 3,
        "title": "Learning to Act", "summary": "A gentle intro to reinforcement learning for control.", "estMinutes": 5,
        "blocks": [
            {"type": "chart", "chartId": "reward-curve"},
            {"type": "caption", "text": "An RL agent tries, fails, and trains a policy that maximizes reward over time."},
            {"type": "takeaway", "text": "Reward shapes behavior."},
        ],
        "quiz": [
            _q("In RL, the agent maximizes…", ["Battery life", "Cumulative reward", "Camera resolution", "Wind speed"], 1, "Cumulative discounted reward is the objective."),
        ],
        "socialClip": {"hook": "How do drones learn to fly themselves?", "coreIdea": "Reinforcement learning.", "visualSuggestion": "Reward curve rising over episodes.", "takeaway": "Practice. Reward. Repeat.", "hashtags": ["#RL", "#AI"]},
    },

    # ============================================================
    # TRACK 7 — SWARMS
    # ============================================================
    "l-one-to-many": {
        "id": "l-one-to-many", "moduleId": "mod-swarms-1", "trackId": "track-swarms", "order": 1,
        "title": "One to Many", "summary": "Why coordinating two drones is harder than flying one twice.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "one-to-many"},
            {"type": "caption", "text": "Independent ≠ coordinated. Coordination needs shared state."},
            {"type": "takeaway", "text": "Coordination is the hidden tax of multi-agent."},
        ],
        "quiz": [
            _q("Two independent drones avoid each other by…", ["Magic", "Shared world model", "Higher altitude only", "Lower battery"], 1, "Each must know roughly where the others are."),
        ],
        "socialClip": {"hook": "Two drones. Twice the problem.", "coreIdea": "Coordination cost.", "visualSuggestion": "Two paths colliding then separating.", "takeaway": "More agents, more questions.", "hashtags": ["#swarm", "#robotics"]},
    },
    "l-emergent": {
        "id": "l-emergent", "moduleId": "mod-swarms-1", "trackId": "track-swarms", "order": 2,
        "title": "Emergent Behavior", "summary": "Tune three rules. Watch a flock appear.", "estMinutes": 6,
        "blocks": [
            {"type": "widget", "widgetId": "swarm-sandbox"},
            {"type": "caption", "text": "Separation, alignment, cohesion. Local rules. Global pattern."},
            {"type": "takeaway", "text": "Complex behavior. Trivial rules."},
        ],
        "quiz": [
            _q("Which rule keeps boids from colliding?", ["Cohesion", "Alignment", "Separation", "Gravity"], 2, "Separation pushes apart at close range."),
            _q("Which rule pulls boids together?", ["Cohesion", "Alignment", "Separation", "Gravity"], 0, "Cohesion biases motion toward the local centroid."),
        ],
        "socialClip": {"hook": "3 rules. A flock. No central brain.", "coreIdea": "Emergence.", "visualSuggestion": "Boids in motion.", "takeaway": "Simple rules. Complex life.", "hashtags": ["#emergence", "#swarm"]},
    },
    "l-consensus": {
        "id": "l-consensus", "moduleId": "mod-swarms-2", "trackId": "track-swarms", "order": 1,
        "title": "Distributed Decisions", "summary": "How a swarm agrees without a leader.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "consensus"},
            {"type": "caption", "text": "Each node averages neighbors. Eventually, everyone agrees."},
            {"type": "takeaway", "text": "Consensus is averaging with patience."},
        ],
        "quiz": [
            _q("Distributed consensus needs…", ["A leader", "Local communication", "GPS", "Manual control"], 1, "Each node exchanges with neighbors only."),
        ],
        "socialClip": {"hook": "How do swarms make decisions without a leader?", "coreIdea": "Consensus averaging.", "visualSuggestion": "Node values converging.", "takeaway": "Average. Repeat. Agree.", "hashtags": ["#consensus", "#multiagent"]},
    },
    "l-resilience": {
        "id": "l-resilience", "moduleId": "mod-swarms-2", "trackId": "track-swarms", "order": 2,
        "title": "Graceful Degradation", "summary": "Swarms don't crash. They thin.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "resilience"},
            {"type": "caption", "text": "Lose 30% of agents. Mission still flies — slower, smaller."},
            {"type": "takeaway", "text": "Resilience = no single drone is critical."},
        ],
        "quiz": [
            _q("A resilient swarm…", ["Stops on first failure", "Adapts to losses", "Needs all members", "Calls home"], 1, "Roles re-allocate dynamically."),
        ],
        "socialClip": {"hook": "Knock out half the swarm. It still flies.", "coreIdea": "Graceful degradation.", "visualSuggestion": "Swarm thinning but holding shape.", "takeaway": "No drone is essential.", "hashtags": ["#resilience", "#swarm"]},
    },

    # ============================================================
    # TRACK 8 — HUMAN FACTORS
    # ============================================================
    "l-sa-levels": {
        "id": "l-sa-levels", "moduleId": "mod-human-1", "trackId": "track-human", "order": 1,
        "title": "Situational Awareness", "summary": "Endsley's three levels: perceive, comprehend, project.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "sa-layers"},
            {"type": "caption", "text": "See it. Understand it. Predict it."},
            {"type": "takeaway", "text": "Awareness is not vision. It's prediction."},
        ],
        "quiz": [
            _q("Endsley's highest SA level is…", ["Perception", "Comprehension", "Projection", "Reaction"], 2, "Projection = anticipating future states."),
        ],
        "socialClip": {"hook": "Three levels of seeing.", "coreIdea": "Perceive → Comprehend → Project.", "visualSuggestion": "Stacked layers diagram.", "takeaway": "Best operators predict.", "hashtags": ["#SA", "#humanfactors"]},
    },
    "l-workload": {
        "id": "l-workload", "moduleId": "mod-human-1", "trackId": "track-human", "order": 2,
        "title": "Workload Curve", "summary": "Too little to do is as dangerous as too much.", "estMinutes": 4,
        "blocks": [
            {"type": "chart", "chartId": "workload-curve"},
            {"type": "caption", "text": "Performance peaks at moderate workload. Boredom and overload both kill."},
            {"type": "takeaway", "text": "Design for the middle of the curve."},
        ],
        "quiz": [
            _q("Vigilance decrement means…", ["You get more alert", "Attention falls off with monotony", "Workload rises", "Battery drains"], 1, "Sustained-attention performance drops over time."),
        ],
        "socialClip": {"hook": "Bored pilots crash drones.", "coreIdea": "Workload curve.", "visualSuggestion": "Inverted-U graph.", "takeaway": "Design for the middle.", "hashtags": ["#humanfactors", "#design"]},
    },
    "l-gcs-design": {
        "id": "l-gcs-design", "moduleId": "mod-human-2", "trackId": "track-human", "order": 1,
        "title": "Ground Station Design", "summary": "Information, not decoration. What a GCS owes its operator.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "gcs-mock"},
            {"type": "caption", "text": "Map. Telemetry. Camera. Alarms. The four corners of a good GCS."},
            {"type": "takeaway", "text": "A great GCS hides what's healthy and shouts what's wrong."},
        ],
        "quiz": [
            _q("A well-designed GCS prioritizes…", ["Beautiful graphics", "Critical alarms", "Many menus", "Loud sounds"], 1, "Information hierarchy beats cosmetics."),
        ],
        "socialClip": {"hook": "What's wrong with most drone interfaces?", "coreIdea": "Hide healthy. Shout broken.", "visualSuggestion": "Annotated GCS mock.", "takeaway": "Design for emergencies.", "hashtags": ["#UX", "#GCS"]},
    },
    "l-mission-lifecycle": {
        "id": "l-mission-lifecycle", "moduleId": "mod-human-2", "trackId": "track-human", "order": 2,
        "title": "Mission Lifecycle", "summary": "Plan, brief, fly, debrief — the rhythm of every operation.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "mission-timeline"},
            {"type": "caption", "text": "Most accidents are decided long before takeoff."},
            {"type": "takeaway", "text": "Missions are paperwork bookended by flight."},
        ],
        "quiz": [
            _q("Which phase reduces future accidents most?", ["Plan", "Brief", "Fly", "Debrief"], 3, "Debrief turns experience into next-time prevention."),
        ],
        "socialClip": {"hook": "When does a mission actually start?", "coreIdea": "Plan → Brief → Fly → Debrief.", "visualSuggestion": "Timeline with milestones.", "takeaway": "Flight is the smallest part.", "hashtags": ["#ops", "#missions"]},
    },

    # ============================================================
    # TRACK 9 — SAFETY, AIRSPACE & ETHICS
    # ============================================================
    "l-airspace": {
        "id": "l-airspace", "moduleId": "mod-safety-1", "trackId": "track-safety", "order": 1,
        "title": "Sharing the Sky", "summary": "Why airspace has layers — and why BVLOS is the hard one.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "airspace-layers"},
            {"type": "caption", "text": "Higher = busier. Closer to terrain = unmanned."},
            {"type": "takeaway", "text": "Airspace is geometry plus rules plus trust."},
        ],
        "quiz": [
            _q("'BVLOS' means…", ["Beyond Visual Line of Sight", "Battery Voltage Loss", "Beacon-Visible Local Override", "Boost-Vector Low Speed"], 0, "Operating beyond what the pilot can see directly."),
        ],
        "socialClip": {"hook": "Why can't drones fly anywhere?", "coreIdea": "Airspace layers.", "visualSuggestion": "Cake-slice of airspace.", "takeaway": "Sky has zoning.", "hashtags": ["#airspace", "#BVLOS"]},
    },
    "l-design-for-failure": {
        "id": "l-design-for-failure", "moduleId": "mod-safety-1", "trackId": "track-safety", "order": 2,
        "title": "Designing for Failure", "summary": "Redundancy, geofences, failsafes — assume things break.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "geofence"},
            {"type": "caption", "text": "A geofence is a hard 'no' the drone enforces on itself."},
            {"type": "takeaway", "text": "Designing for failure is how you avoid it."},
        ],
        "quiz": [
            _q("A geofence is…", ["A physical wall", "A virtual boundary enforced by the drone", "A radio jammer", "A camera mode"], 1, "Virtual boundary stored in the autopilot."),
        ],
        "socialClip": {"hook": "How do drones know not to cross the fence?", "coreIdea": "Geofencing.", "visualSuggestion": "Boundary line + drone halting.", "takeaway": "Limits live in software.", "hashtags": ["#safety", "#geofence"]},
    },
    "l-ethics": {
        "id": "l-ethics", "moduleId": "mod-safety-2", "trackId": "track-safety", "order": 1,
        "title": "The Ethics of Autonomy", "summary": "Accountability, meaningful control, dual-use — the unresolved questions.", "estMinutes": 5,
        "blocks": [
            {"type": "diagram", "diagramId": "ethics-scales"},
            {"type": "caption", "text": "More autonomy. More speed. Less time to decide. Where is the human?"},
            {"type": "takeaway", "text": "Autonomy is a question, not just an engineering target."},
        ],
        "quiz": [
            _q("'Meaningful human control' is concerned with…", ["Battery life", "Whether a human can meaningfully decide", "Drone color", "Camera quality"], 1, "It asks whether the human is genuinely in the loop, not nominally."),
        ],
        "socialClip": {"hook": "Who's accountable when an autonomous machine errs?", "coreIdea": "Meaningful human control.", "visualSuggestion": "Scales tipping between human and machine.", "takeaway": "Autonomy is a question.", "hashtags": ["#ethics", "#autonomy"]},
    },

    # ============================================================
    # TRACK 10 — REAL-WORLD APPLICATIONS
    # ============================================================
    "l-mapping": {
        "id": "l-mapping", "moduleId": "mod-apps-1", "trackId": "track-apps", "order": 1,
        "title": "Mapping & Survey", "summary": "Photogrammetry turns photos into 3D worlds.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "photogrammetry"},
            {"type": "caption", "text": "Hundreds of overlapping photos. One point cloud."},
            {"type": "takeaway", "text": "Coverage > resolution."},
        ],
        "quiz": [
            _q("Photogrammetry needs…", ["A single photo", "Many overlapping photos", "Only LiDAR", "GPS only"], 1, "Overlap creates the parallax needed for 3D reconstruction."),
        ],
        "socialClip": {"hook": "How does a drone make a 3D model?", "coreIdea": "Photogrammetry.", "visualSuggestion": "Point cloud assembling.", "takeaway": "Many photos = one world.", "hashtags": ["#mapping", "#photogrammetry"]},
    },
    "l-agriculture": {
        "id": "l-agriculture", "moduleId": "mod-apps-1", "trackId": "track-apps", "order": 2,
        "title": "Drones in Agriculture", "summary": "NDVI: seeing what crops feel.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "ndvi"},
            {"type": "caption", "text": "Plants reflect more infrared when healthy. NDVI quantifies it."},
            {"type": "takeaway", "text": "Drones see what eyes can't — chlorophyll stress."},
        ],
        "quiz": [
            _q("NDVI exploits…", ["Heat", "Sound", "Near-infrared reflectance", "Wind"], 2, "Healthy chlorophyll strongly reflects NIR."),
        ],
        "socialClip": {"hook": "How does a drone see if your crop is sick?", "coreIdea": "NDVI multispectral.", "visualSuggestion": "Field tinted by NDVI.", "takeaway": "Invisible health, made visible.", "hashtags": ["#agtech", "#NDVI"]},
    },
    "l-inspection": {
        "id": "l-inspection", "moduleId": "mod-apps-1", "trackId": "track-apps", "order": 3,
        "title": "Asset Inspection", "summary": "Powerlines, turbines, pipelines — eyes that don't get tired.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "inspection-path"},
            {"type": "caption", "text": "Programmed paths. Repeatable angles. Comparable images over time."},
            {"type": "takeaway", "text": "Drones turn inspection into a dataset."},
        ],
        "quiz": [
            _q("The big win in repeatable drone inspection is…", ["Cheaper drones", "Comparable images over time", "Better wind", "Faster batteries"], 1, "Trend analysis matters more than any single photo."),
        ],
        "socialClip": {"hook": "How drones cut inspection costs by 80%.", "coreIdea": "Repeatable paths.", "visualSuggestion": "Drone tracing a tower.", "takeaway": "Routine, not heroic.", "hashtags": ["#inspection", "#drones"]},
    },
    "l-delivery": {
        "id": "l-delivery", "moduleId": "mod-apps-2", "trackId": "track-apps", "order": 1,
        "title": "Logistics & Delivery", "summary": "Payload, range, energy. The endurance equation.", "estMinutes": 5,
        "blocks": [
            {"type": "chart", "chartId": "payload-range"},
            {"type": "caption", "text": "Carry more = fly less. Always."},
            {"type": "takeaway", "text": "Endurance is the limit, not autonomy."},
        ],
        "quiz": [
            _q("Doubling payload roughly…", ["Doubles range", "Halves range", "No effect", "Quadruples range"], 1, "Energy is finite; more weight = more current."),
        ],
        "socialClip": {"hook": "Why are delivery drones still rare?", "coreIdea": "Payload kills range.", "visualSuggestion": "Curve falling as payload rises.", "takeaway": "Energy is destiny.", "hashtags": ["#delivery", "#logistics"]},
    },
    "l-public-safety": {
        "id": "l-public-safety", "moduleId": "mod-apps-2", "trackId": "track-apps", "order": 2,
        "title": "Public Safety", "summary": "Search-and-rescue, disaster mapping, firefighting support.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "search-pattern"},
            {"type": "caption", "text": "Lawnmower, expanding-square, sector — patterns matter."},
            {"type": "takeaway", "text": "In a crisis, drones buy time."},
        ],
        "quiz": [
            _q("Which is a common search pattern?", ["Spiral", "Expanding square", "Bouncing", "Free flight"], 1, "Expanding-square is standard SAR."),
        ],
        "socialClip": {"hook": "How drones find missing people faster.", "coreIdea": "Systematic search patterns.", "visualSuggestion": "Lawnmower transect over terrain.", "takeaway": "Pattern + payload = lives.", "hashtags": ["#SAR", "#publicSafety"]},
    },
    "l-frontiers": {
        "id": "l-frontiers", "moduleId": "mod-apps-2", "trackId": "track-apps", "order": 3,
        "title": "Frontiers", "summary": "Urban air mobility, counter-drone, bio-inspired flight.", "estMinutes": 4,
        "blocks": [
            {"type": "diagram", "diagramId": "frontiers"},
            {"type": "caption", "text": "The next decade: passengers, swarms, and wings that flap."},
            {"type": "takeaway", "text": "Autonomy is just getting started."},
        ],
        "quiz": [
            _q("'UAM' usually refers to…", ["Underwater Acoustic Monitoring", "Urban Air Mobility", "Universal Access Module", "Unidirectional Auto-Mapping"], 1, "Passenger or cargo aircraft in city airspace."),
        ],
        "socialClip": {"hook": "What's next for autonomous flight?", "coreIdea": "Frontiers: UAM, counter-drone, bio-inspired.", "visualSuggestion": "Montage of futures.", "takeaway": "Autonomy is starting.", "hashtags": ["#future", "#aviation"]},
    },
}


def all_lessons_list():
    return list(LESSONS.values())
