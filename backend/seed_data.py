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
            {"type": "caption", "text": "Each rung removes a human decision and gives it to the machine."},
            {"type": "diagram", "diagramId": "ooda-mini"},
            {"type": "takeaway", "text": "Autonomy is not a switch — it's a ladder of trust."},
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
            {"type": "caption", "text": "Observe, Orient, Decide, Act — and repeat 100× a second."},
            {"type": "widget", "widgetId": "signal-noise"},
            {"type": "takeaway", "text": "Autonomy = a loop that never stops correcting itself."},
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
            {"type": "caption", "text": "Lift grows with speed² and with angle of attack — until the wing stalls."},
            {"type": "takeaway", "text": "Lift is free. Drag is the bill."},
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
            {"type": "caption", "text": "Multirotor hovers. Fixed-wing endures. VTOL tries to do both."},
            {"type": "takeaway", "text": "There is no best airframe — only the right one for the mission."},
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
            {"type": "caption", "text": "A quadrotor is unstable by design. Without code, it tips over."},
            {"type": "takeaway", "text": "Stability is software."},
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
            {"type": "caption", "text": "A base station broadcasts corrections. The rover shrinks its error."},
            {"type": "takeaway", "text": "RTK is centimetres. GPS alone is metres."},
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
            {"type": "caption", "text": "P reacts now · I cleans drift · D damps overshoot."},
            {"type": "diagram", "diagramId": "feedback-loop"},
            {"type": "takeaway", "text": "Autonomy starts with a loop that never stops correcting itself."},
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
            {"type": "caption", "text": "Fusion turns several lying sensors into one truth."},
            {"type": "takeaway", "text": "No single sensor is enough. Together, they are."},
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
}


def all_lessons_list():
    return list(LESSONS.values())
