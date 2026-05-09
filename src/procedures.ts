export type ProcedureCategory = "Run-up" | "Briefing" | "Maneuver" | "Emergency";

export type ProcedureStep = {
  id: string;
  cue: string;
  action: string;
  details?: string[];
  keywords: string[];
};

export type OralPrompt = {
  prompt: string;
  answer: string[];
};

export type Procedure = {
  id: string;
  title: string;
  shortTitle: string;
  category: ProcedureCategory;
  memoryCode?: string;
  sourcePages: number[];
  accent: "teal" | "amber" | "red" | "blue" | "green" | "violet";
  steps: ProcedureStep[];
  oralPrompts: OralPrompt[];
};

type ProcedureStepInput = Omit<ProcedureStep, "keywords"> & { keywords?: string[] };
type ProcedureInput = Omit<Procedure, "steps" | "oralPrompts"> & {
  steps: ProcedureStepInput[];
  oralPrompts?: OralPrompt[];
};

const stopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "into",
  "then",
  "when",
  "until",
  "this",
  "that",
  "your",
  "over",
  "under",
  "above",
  "below",
  "about",
  "than",
  "onto",
  "only",
  "same",
  "each",
  "need",
  "needs",
  "using",
  "used",
  "use",
  "not",
  "off",
  "on",
]);

function deriveKeywords(step: ProcedureStepInput) {
  const source = [step.cue, step.action, ...(step.details ?? [])].join(" ").toLowerCase();
  const words = source
    .replace(/[^a-z0-9.]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 || /\d/.test(word))
    .filter((word) => !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 10);
}

function answerLines(steps: ProcedureStep[]) {
  return steps.flatMap((step) => [`${step.cue}: ${step.action}`, ...(step.details ?? [])]);
}

function defineProcedure(procedure: ProcedureInput): Procedure {
  const steps = procedure.steps.map((step) => ({
    ...step,
    keywords: step.keywords?.length ? step.keywords : deriveKeywords(step),
  }));

  return {
    ...procedure,
    steps,
    oralPrompts:
      procedure.oralPrompts ??
      [
        {
          prompt: `Recite ${procedure.title}.`,
          answer: answerLines(steps),
        },
      ],
  };
}

export const procedures: Procedure[] = [
  defineProcedure({
    id: "flight-instrument-check",
    title: "Flight Instrument Check During Run-Up",
    shortTitle: "Run-up Instruments",
    category: "Run-up",
    sourcePages: [12],
    accent: "teal",
    steps: [
      {
        id: "airspeed",
        cue: "Airspeed",
        action: "Airspeed 0.",
        details: ["Close canopy."],
        keywords: ["airspeed", "0", "canopy"],
      },
      {
        id: "attitude",
        cue: "Attitude",
        action: "Attitude level.",
        details: ["Pitch and bank no more than 5 degrees."],
        keywords: ["attitude", "level", "pitch", "bank", "5"],
      },
      {
        id: "altimeter",
        cue: "Altimeter / VSI / Alt bug",
        action: "Altimeter set.",
        details: ["Within +/- 75 ft of airport elevation.", "VSI 0.", "Altitude bug set."],
        keywords: ["altimeter", "75", "airport", "vsi", "0", "altitude bug"],
      },
      {
        id: "ball",
        cue: "Ball",
        action: "Ball centered.",
        keywords: ["ball", "centered"],
      },
      {
        id: "heading-bug",
        cue: "Heading bug",
        action: "Heading bug set to runway.",
        keywords: ["heading bug", "runway"],
      },
      {
        id: "heading-match",
        cue: "Heading cross-check",
        action: "Heading matches compass or MFD.",
        keywords: ["heading", "matches", "compass", "mfd"],
      },
      {
        id: "g5",
        cue: "G5",
        action: "G5 instruments matching.",
        details: ["G5 battery is charging. Sling only."],
        keywords: ["g5", "matching", "battery", "charging"],
      },
    ],
    oralPrompts: [
      {
        prompt: "Run the flight instrument check from memory.",
        answer: [
          "Airspeed 0, canopy closed.",
          "Attitude level, pitch and bank no more than 5 degrees.",
          "Altimeter set within +/- 75 ft, VSI 0, altitude bug set.",
          "Ball centered.",
          "Heading bug set to runway.",
          "Heading matches compass or MFD.",
          "G5 instruments match and battery is charging.",
        ],
      },
      {
        prompt: "What must the altimeter and VSI show during the run-up instrument check?",
        answer: ["Altimeter set within +/- 75 ft of airport elevation.", "VSI 0.", "Altitude bug set."],
      },
    ],
  }),
  defineProcedure({
    id: "takeoff-emergency-brief",
    title: "Engine Failure During Takeoff Brief",
    shortTitle: "Run-up Emergency Brief",
    category: "Briefing",
    sourcePages: [13],
    accent: "red",
    steps: [
      {
        id: "abort",
        cue: "Before rotation / takeoff roll",
        action: "If RPM below 4600, engine not green, or airspeed not alive: power idle, brake, exit the runway.",
        keywords: ["rpm", "4600", "engine", "green", "airspeed", "alive", "power idle", "brake", "exit"],
      },
      {
        id: "below-700",
        cue: "After rotation below 700 ft",
        action: "Lower pitch Vg, maintain directional control, declare, and land straight ahead.",
        keywords: ["below", "700", "lower pitch", "vg", "directional control", "declare", "straight ahead"],
      },
      {
        id: "above-700",
        cue: "After rotation above 700 ft",
        action: "Lower pitch Vg, maintain directional control, declare emergency, and turn back.",
        keywords: ["above", "700", "lower pitch", "vg", "directional control", "declare emergency", "turn back"],
      },
    ],
    oralPrompts: [
      {
        prompt: "Give the takeoff emergency briefing you would say during run-up.",
        answer: [
          "On the roll: if RPM is below 4600, engine is not green, or airspeed is not alive, power idle, brake, exit runway.",
          "Below 700 ft after rotation: lower pitch Vg, directional control, declare, land straight ahead.",
          "Above 700 ft after rotation: lower pitch Vg, directional control, declare emergency, turn back.",
        ],
      },
      {
        prompt: "What changes at 700 ft in the takeoff emergency brief?",
        answer: ["Below 700 ft: land straight ahead.", "Above 700 ft: declare emergency and turn back."],
      },
    ],
  }),
  defineProcedure({
    id: "engine-failure-flight",
    title: "Engine Failure Procedure In Flight",
    shortTitle: "Simulated Engine Out",
    category: "Emergency",
    memoryCode: "ABC",
    sourcePages: [13],
    accent: "red",
    steps: [
      {
        id: "airspeed",
        cue: "A - Airspeed",
        action: "Airspeed for best glide.",
        details: ["Level pitch for the Sling."],
        keywords: ["airspeed", "best glide", "level pitch"],
      },
      {
        id: "best-place",
        cue: "B - Best place",
        action: "Best place to land.",
        details: ["Fly toward the place."],
        keywords: ["best place", "land", "fly toward"],
      },
      {
        id: "configuration",
        cue: "C - Configuration / 7 Up",
        action: "Configuration: 7 Up.",
        details: ["Lanes on, master on, pumps on, ECU BKUP on simulated, fuel selector highest."],
        keywords: ["configuration", "7 up", "lanes", "master", "pumps", "ecu", "fuel highest"],
      },
      {
        id: "restart",
        cue: "Restart attempt",
        action: "Throttle half, attempt starter simulated.",
        keywords: ["throttle half", "starter", "simulate"],
      },
      {
        id: "mayday",
        cue: "No restart",
        action: "If no restart: 7700, 121.50, Mayday x3 plus callsign.",
        details: ["Example: engine failure about 15 miles west of KHWO, 2 souls on board."],
        keywords: ["7700", "121.50", "mayday", "callsign", "khwo", "souls"],
      },
      {
        id: "before-landing",
        cue: "Before landing",
        action: "Flap as needed, switches off, canopy open, ELT on.",
        keywords: ["flap", "switches off", "canopy open", "elt"],
      },
    ],
    oralPrompts: [
      {
        prompt: "Run the simulated engine-out procedure in flight.",
        answer: [
          "Airspeed best glide, level pitch for the Sling.",
          "Best place to land and fly toward it.",
          "Configuration 7 Up: lanes, master, pumps, simulated ECU BKUP, fuel highest.",
          "Throttle half, attempt starter simulated.",
          "If no restart: 7700, 121.50, Mayday x3 and callsign.",
          "Before landing: flaps as needed, switches off, canopy open, ELT on.",
        ],
      },
      {
        prompt: "What is 7 Up in the engine-failure procedure?",
        answer: ["Lanes on.", "Master on.", "Pumps on.", "ECU BKUP on simulated.", "Fuel selector highest."],
      },
    ],
  }),
  defineProcedure({
    id: "pre-maneuver-abccd",
    title: "Pre-Maneuver Checklist (ABCCD)",
    shortTitle: "Pre-Maneuver Checklist (ABCCD)",
    category: "Maneuver",
    memoryCode: "ABCCD",
    sourcePages: [12],
    accent: "amber",
    steps: [
      {
        id: "altitude",
        cue: "A - Altitude",
        action: "Altitude set above 1500 AGL or as required by the ACS.",
        keywords: ["altitude", "1500", "agl", "acs"],
      },
      {
        id: "best-place",
        cue: "B - Best place",
        action: "Best place to land in case of emergency.",
        keywords: ["best", "place", "land", "emergency"],
      },
      {
        id: "clearing",
        cue: "C - Clearing turn",
        action: "Clearing turn left 360 degrees and clear traffic ahead on TCAS.",
        keywords: ["clearing", "left", "360", "traffic", "tcas"],
      },
      {
        id: "configuration",
        cue: "C - Configuration",
        action: "Configuration: everything on.",
        details: ["Lanes on, pumps on, engine green, fuel highest, all lights on.", "Set heading bug and altitude bug."],
        keywords: ["configuration", "lanes", "pumps", "engine green", "fuel highest", "lights", "heading bug", "altitude bug"],
      },
      {
        id: "declare",
        cue: "D - Declare",
        action: "Declare intention over the practice area frequency if time permits.",
        keywords: ["declare", "intention", "practice area", "frequency", "time permits"],
      },
    ],
    oralPrompts: [
      {
        prompt: "Recite ABCCD before a maneuver.",
        answer: [
          "Altitude set above 1500 AGL or ACS requirement.",
          "Best place to land in case of emergency.",
          "Clearing turn left 360 and traffic ahead on TCAS.",
          "Configuration: lanes, pumps, engine green, fuel highest, lights, heading bug, altitude bug.",
          "Declare intention on practice area frequency if time permits.",
        ],
      },
      {
        prompt: "What is included in the Configuration step of ABCCD?",
        answer: ["Lanes on, pumps on, engine green, fuel highest, all lights on.", "Heading bug and altitude bug set."],
      },
    ],
  }),
  defineProcedure({
    id: "p24-01-appropriate-power-settings",
    title: "1. Appropriate Power Settings",
    shortTitle: "01. Power Settings",
    category: "Maneuver",
    sourcePages: [24],
    accent: "blue",
    steps: [
      { id: "ground", cue: "Ground, not moving", action: "Use at least 2500 rpm." },
      { id: "takeoff", cue: "Takeoff", action: "Use full power, more than 4600 rpm." },
      { id: "normal-cruise", cue: "Normal cruise", action: "Use 4600 to 5000 rpm.", details: ["Anything less will lose altitude."] },
      { id: "descent", cue: "Descent", action: "Use 3700 to 4000 rpm, then gently pitch down." },
    ],
  }),
  defineProcedure({
    id: "p24-02-straight-level-flight",
    title: "2. Maintain Straight and Level Flight",
    shortTitle: "02. Straight/Level",
    category: "Maneuver",
    memoryCode: "Pitch Power Trim",
    sourcePages: [24],
    accent: "teal",
    steps: [
      { id: "pitch", cue: "Pitch", action: "Pitch for the horizon slightly above the cowling." },
      { id: "power", cue: "Power", action: "Set cruise power to 4600 to 4900 rpm." },
      { id: "trim", cue: "Trim", action: "Trim only if needed to relieve control stick pressure." },
      {
        id: "track",
        cue: "Track / bug",
        action: "Fly the proper GPS TRK, such as 275 if westbound.",
        details: ["Then set the heading bug to maintain proper wind correction."],
      },
    ],
  }),
  defineProcedure({
    id: "p24-03-rectangular-course",
    title: "3. Rectangular Course",
    shortTitle: "03. Rectangular Course",
    category: "Maneuver",
    sourcePages: [24],
    accent: "green",
    steps: [
      { id: "reference", cue: "Reference", action: "Use the grass strip as reference to simulate a runway." },
      { id: "altitude", cue: "Altitude", action: "Maintain 1000 ft AGL." },
      {
        id: "pattern",
        cue: "Course",
        action: "Maintain approximately 1 mile from the reference.",
        details: ["Fly a rectangular pattern around it with proper wind drift correction."],
      },
      {
        id: "traffic-pattern",
        cue: "Pattern practice",
        action: "Simulate each leg of the pattern and announce the procedures for each leg.",
        details: ["Prepare ahead for the traffic pattern without losing altitude."],
      },
    ],
  }),
  defineProcedure({
    id: "p24-04-vor-working",
    title: "4. Identifying If VOR Is Working",
    shortTitle: "04. VOR Check",
    category: "Maneuver",
    sourcePages: [24],
    accent: "violet",
    steps: [
      { id: "tune", cue: "Tune", action: "Tune the VOR frequency using the G650." },
      { id: "identifier", cue: "Identifier", action: "Verify the G650 is showing the 3-letter identifier, such as DHP." },
      { id: "id-button", cue: "ID button", action: "Press the ID button and verify ID is showing on the G650." },
      { id: "volume", cue: "Volume", action: "Verify the ID volume is at least 50% on the G650." },
      { id: "cdi", cue: "CDI", action: "Press the CDI button on the G650 to change CDI to green course." },
      { id: "audio", cue: "Audio", action: "Press Audio, then NAV on the G3X, to listen to the Morse code sound." },
      { id: "tcas", cue: "TCAS", action: "Do not block TCAS on the MFD when listening to NAV audio." },
    ],
  }),
  defineProcedure({
    id: "p25-05-short-field-takeoff",
    title: "5. Short Field Takeoff",
    shortTitle: "05. Short Field TO",
    category: "Maneuver",
    sourcePages: [25],
    accent: "blue",
    steps: [
      { id: "tower", cue: "Tower request", action: "Request short delay with tower." },
      { id: "runway", cue: "Runway use", action: "Simulate full use of runway." },
      { id: "brake-power", cue: "Brake / power", action: "Hold the brake, apply full power, verify RPM more than 4600 and engine green." },
      { id: "release-rotate", cue: "Release / rotate", action: "Release brake, confirm airspeed alive, rotate at 50 knots." },
      { id: "vx", cue: "Vx climb", action: "Climb with Vx 65 until 50 ft of altitude." },
      { id: "vy", cue: "Vy climb", action: "Lower pitch to Vy 72 and continue to climb." },
      { id: "flap1", cue: "Positive rate", action: "After positive-rate VSI, set flaps 1." },
      { id: "flaps-up", cue: "Safe altitude", action: "At safe altitude 300 ft, flaps up." },
    ],
  }),
  defineProcedure({
    id: "p25-06-short-field-landing",
    title: "6. Short Field Landing",
    shortTitle: "06. Short Field LDG",
    category: "Maneuver",
    sourcePages: [25],
    accent: "green",
    steps: [
      {
        id: "abeam",
        cue: "Abeam stripe",
        action: "Abeam the stripe: 3700 rpm, hold pitch, below white arc, flaps 1.",
      },
      { id: "final", cue: "Final", action: "On final, approach at 65 knots and short final at 60 knots." },
      { id: "threshold", cue: "Threshold", action: "Maintain 100 ft when above the threshold, nose aiming to the numbers." },
      { id: "transition", cue: "Transition", action: "Transition close over the runway and fly level.", details: ["Power idle after transition."] },
      { id: "touchdown", cue: "Touchdown", action: "Touch down on the first or second stripe, +200/-0 ft." },
    ],
  }),
  defineProcedure({
    id: "p25-07-soft-field-takeoff",
    title: "7. Soft Field Takeoff",
    shortTitle: "07. Soft Field TO",
    category: "Maneuver",
    sourcePages: [25],
    accent: "amber",
    steps: [
      { id: "back-pressure", cue: "Back pressure", action: "Use half back pressure on the control with minimum braking." },
      { id: "align", cue: "Align / power", action: "Align on centerline, full power, verify 4600 rpm, engine green, airspeed alive." },
      { id: "rotate", cue: "Rotate", action: "Rotate at 50 knots, then level flight over the runway.", details: ["Remain in ground effect."] },
      { id: "accelerate", cue: "Accelerate", action: "Accelerate to Vy 72 over the runway, then gentle climb out." },
      { id: "flap1", cue: "Positive rate", action: "After positive-rate VSI, set flaps 1." },
      { id: "flaps-up", cue: "Safe altitude", action: "At safe altitude 300 ft, flaps up." },
    ],
  }),
  defineProcedure({
    id: "p25-08-soft-field-landing",
    title: "8. Soft Field Landing",
    shortTitle: "08. Soft Field LDG",
    category: "Maneuver",
    sourcePages: [25],
    accent: "amber",
    steps: [
      {
        id: "touchdown",
        cue: "Touchdown",
        action: "Upon touchdown, hold back pressure to prevent the nose from touching the ground.",
        details: ["Add power as needed."],
      },
      {
        id: "taxi",
        cue: "Runway taxi",
        action: "Do not let the nose touch the ground during taxiing on the runway.",
        details: ["Continue until the instructor says to terminate before exiting the runway."],
      },
    ],
  }),
  defineProcedure({
    id: "p26-09-rejected-landing",
    title: "9. Rejected Landing",
    shortTitle: "09. Go-Around",
    category: "Maneuver",
    sourcePages: [26],
    accent: "red",
    steps: [
      { id: "power", cue: "Power first", action: "Full power first, then pitch slightly above the horizon for a gentle climb." },
      { id: "trim", cue: "Trim", action: "Release trim if needed." },
      { id: "flap2", cue: "Flap 2", action: "After positive-rate VSI, set flaps 2." },
      { id: "flap1", cue: "Flap 1", action: "After positive-rate VSI again, set flaps 1." },
      { id: "flaps-up", cue: "Safe altitude", action: "At safe altitude 300 ft, flaps up." },
      {
        id: "decision-tip",
        cue: "Decision tip",
        action: "Practice go-around decision automatically if rudder pressure is applied before touchdown without warning.",
        details: ["This is a CFI practice tip from the PDF."],
      },
    ],
  }),
  defineProcedure({
    id: "p26-10-forward-slip",
    title: "10. Forward Slip to Land",
    shortTitle: "10. Forward Slip",
    category: "Maneuver",
    sourcePages: [26],
    accent: "violet",
    steps: [
      { id: "power", cue: "Power", action: "Power idle." },
      { id: "controls", cue: "Controls", action: "Aileron into the wind, apply half opposite rudder as needed for descent rate." },
      { id: "pitch", cue: "Pitch / speed", action: "Adjust pitch for approximately 70 knots.", details: ["Do not pitch up above the horizon."] },
      { id: "recover", cue: "Recover / land", action: "At proper altitude, release rudder to align nose to centerline and level the airplane to land." },
    ],
  }),
  defineProcedure({
    id: "p26-11-slow-flight",
    title: "11. Slow Flight",
    shortTitle: "11. Slow Flight",
    category: "Maneuver",
    sourcePages: [26],
    accent: "blue",
    steps: [
      { id: "reduce-power", cue: "Entry power", action: "Reduce power to 3000 rpm and hold altitude with back pressure." },
      {
        id: "flaps",
        cue: "White arc / flaps",
        action: "Below white arc 85: flaps 1, flaps 2, flaps 3.",
        details: ["Pause about 1 second when lowering each flap.", "Note the speed of first indication, usually 55 knots."],
      },
      { id: "add-power", cue: "Target altitude", action: "Increase power to 4000 rpm and hold target altitude." },
      { id: "target-speed", cue: "Target airspeed", action: "Lower pitch to hold 5 knots more than first indication, about 60 knots." },
      { id: "callout", cue: "Callout", action: "Say: Pitch for airspeed and power for altitude.", details: ["Backside of power curve."] },
      { id: "turns", cue: "Turns", action: "When turning, use approximately 10 degrees of bank." },
    ],
    oralPrompts: [
      {
        prompt: "Talk through slow flight entry and stabilized flight.",
        answer: [
          "3000 rpm, hold altitude with back pressure.",
          "Below white arc 85, flaps 1-2-3 with one-second pauses, note first indication.",
          "4000 rpm, hold altitude.",
          "Lower pitch for first indication plus 5 knots, about 60 knots.",
          "Call out pitch for airspeed and power for altitude.",
          "Turns about 10 degrees bank.",
        ],
      },
    ],
  }),
  defineProcedure({
    id: "p26-12-slow-flight-recovery",
    title: "12. Slow Flight Recovery",
    shortTitle: "12. Slow Recovery",
    category: "Maneuver",
    sourcePages: [26],
    accent: "teal",
    steps: [
      { id: "power", cue: "Power", action: "Apply full power and maintain level flight.", details: ["Do not climb."] },
      { id: "flaps", cue: "Flaps", action: "When airspeed is above 65 knots, bring flaps up incrementally." },
    ],
  }),
  defineProcedure({
    id: "p27-13-power-off-stall",
    title: "13. Power-Off Stall to Recovery",
    shortTitle: "13. Power-Off Stall",
    category: "Maneuver",
    sourcePages: [27],
    accent: "violet",
    steps: [
      { id: "simulate", cue: "Scenario", action: "Simulate an approach-to-land stall." },
      { id: "idle", cue: "Entry", action: "Lower pitch below the horizon, then power idle." },
      { id: "pitch-up", cue: "Develop stall", action: "Pitch up to maintain altitude and use rudder for heading control." },
      { id: "first-indication", cue: "First indication", action: "Verbally announce first indication.", details: ["AOA blink or stall warning."] },
      { id: "full-stall", cue: "Full stall", action: "Continue holding for full stall.", details: ["Control stick buffet."] },
      { id: "recover-pitch", cue: "Recovery pitch", action: "Lower pitch for horizon." },
      { id: "recover-power", cue: "Recovery power", action: "Full power, climb, positive rate." },
      { id: "recover-flaps", cue: "Recovery flaps", action: "Flaps up incrementally.", details: ["Continue climb. Do not level off until notified."] },
    ],
  }),
  defineProcedure({
    id: "p27-14-crosswind-takeoff",
    title: "14. Crosswind Takeoff Technique",
    shortTitle: "14. Crosswind TO",
    category: "Maneuver",
    sourcePages: [27],
    accent: "green",
    steps: [
      {
        id: "ground",
        cue: "On the ground",
        action: "Apply aileron correction into the wind and keep the nose aligned with centerline while wheels are on the ground.",
      },
      {
        id: "liftoff",
        cue: "After liftoff",
        action: "Aircraft should face into the wind with wings level, ball centered, and crab on the proper ground track in departure leg.",
      },
    ],
  }),
  defineProcedure({
    id: "p27-15-crosswind-landing",
    title: "15. Crosswind Landing",
    shortTitle: "15. Crosswind LDG",
    category: "Maneuver",
    sourcePages: [27],
    accent: "green",
    steps: [
      { id: "aileron", cue: "Aileron first", action: "Aileron into the wind first to correct the ground track of the airplane." },
      {
        id: "rudder",
        cue: "Rudder second",
        action: "Once flying toward the runway while correcting wind, apply rudder as needed to align the nose with runway centerline.",
      },
      { id: "callout", cue: "Memory callout", action: "Aileron for wind first, then rudder for the nose for centerline." },
    ],
  }),
  defineProcedure({
    id: "p28-16-power-on-stall",
    title: "16. Power-On Stall to Recovery",
    shortTitle: "16. Power-On Stall",
    category: "Maneuver",
    sourcePages: [28],
    accent: "green",
    steps: [
      { id: "scenario", cue: "Scenario", action: "Simulate a departure stall, up to 20 degrees of bank." },
      { id: "slow", cue: "Entry speed", action: "Power idle, hold altitude, and slow to 65 knots." },
      { id: "takeoff-power", cue: "Takeoff power", action: "Announce takeoff power at half position, then pitch up for 20 degrees and hold." },
      { id: "rudder", cue: "Directional control", action: "Use rudder to maintain heading." },
      { id: "first-indication", cue: "First indication", action: "Announce first indication.", details: ["AOA flashing."] },
      { id: "full-stall", cue: "Full stall", action: "Continue for full stall.", details: ["Control stick buffet."] },
      { id: "recover-pitch", cue: "Recovery pitch", action: "Lower pitch for horizon." },
      { id: "recover-power", cue: "Recovery power", action: "Full power, climb.", details: ["Do not level off until notified."] },
    ],
  }),
  defineProcedure({
    id: "p28-17-steep-turn",
    title: "17. Steep Turn",
    shortTitle: "17. Steep Turn",
    category: "Maneuver",
    sourcePages: [28],
    accent: "blue",
    steps: [
      { id: "power-speed", cue: "Power / Va", action: "Set power to 4500 rpm and verify speed is below Va 91." },
      {
        id: "bank",
        cue: "Bank / altitude",
        action: "Roll to 45 degrees and use back pressure as necessary to maintain altitude.",
        details: ["Correct altitude with back stick pressure.", "Correct airspeed with throttle.", "No need for trim in light sport aircraft."],
      },
      { id: "engine-sound", cue: "Speed management", action: "Manage speed by listening to the engine sound for cruise power setting." },
      { id: "exit", cue: "Exit standards", action: "Level airplane at entry heading +/- 10 degrees and altitude +/- 100 ft." },
    ],
  }),
  defineProcedure({
    id: "p28-18-emergency-descent",
    title: "18. Emergency Descent",
    shortTitle: "18. Emergency Descent",
    category: "Emergency",
    sourcePages: [28],
    accent: "red",
    steps: [
      { id: "target", cue: "Target altitude", action: "Set target altitude." },
      { id: "power", cue: "Power", action: "Power idle." },
      { id: "bank", cue: "Bank / pitch", action: "Bank 30 degrees away left, then lower the pitch." },
      { id: "speed", cue: "Airspeed", action: "Use pitch to hold approximately 90 to 95 knots." },
      { id: "level-early", cue: "Level lead", action: "About 100 ft above desired altitude, begin to level." },
      { id: "resume", cue: "Resume", action: "Resume straight and level at desired altitude, then smoothly set power to cruise." },
    ],
  }),
  defineProcedure({
    id: "p29-19-s-turns",
    title: "19. S-Turns",
    shortTitle: "19. S-Turns",
    category: "Maneuver",
    sourcePages: [29],
    accent: "violet",
    steps: [
      {
        id: "purpose",
        cue: "Purpose",
        action: "Draw two half circles over the ground with equal radius on both sides of the reference.",
      },
      { id: "entry", cue: "Entry", action: "Enter at 800 ft and perpendicular to the reference, such as a canal or road." },
      {
        id: "initial-bank",
        cue: "Initial bank",
        action: "When wings are over the reference, bank just 5 degrees and wait until around 1/2 mile from the reference.",
        details: ["Then proceed to turn more back to the reference."],
      },
      { id: "timing", cue: "Timing", action: "Time the bank carefully so you do not level too early before reaching the reference." },
      { id: "wings-level", cue: "Wings level", action: "Wings are level only when the wings are over the road or canal reference." },
      { id: "wind", cue: "Wind drift", action: "Use eyes and feelings to judge distance and wind drift." },
      { id: "altitude", cue: "Altitude", action: "Maintain 800 ft the whole time." },
    ],
  }),
  defineProcedure({
    id: "p29-20-turn-around-point",
    title: "20. Turn Around a Point",
    shortTitle: "20. Turn Around Point",
    category: "Maneuver",
    sourcePages: [29],
    accent: "amber",
    steps: [
      { id: "entry", cue: "Entry", action: "Enter 800 ft downwind." },
      { id: "reference", cue: "Reference", action: "Pick a reference 1 to 2 miles on the pilot side." },
      { id: "circle", cue: "Circle", action: "Draw a circle over the ground with a constant radius around the reference." },
      {
        id: "wind-drift",
        cue: "Wind drift",
        action: "Base the maneuver on the pilot's feeling of wind drift.",
        details: [
          "Do not base it on heading or using the wingtip to match the reference.",
          "Point the nose wherever needed to maintain proper wind drift correction.",
        ],
      },
    ],
  }),
  defineProcedure({
    id: "p29-21-lost-procedures",
    title: "21. Lost Procedures",
    shortTitle: "21. Lost Procedures",
    category: "Emergency",
    memoryCode: "Triangulation + 5C",
    sourcePages: [29, 30],
    accent: "red",
    steps: [
      { id: "gps-location", cue: "GPS / MFD", action: "Use onboard GPS and MFD to identify your location." },
      { id: "visual-scan", cue: "Visual aids", action: "Visually scan the area for familiar VFR checkpoints." },
      { id: "vor-if-needed", cue: "If GPS inoperative", action: "Proceed with VOR triangulation." },
      { id: "square", cue: "Triangulation - square", action: "Find a landmark and fly a square over it.", details: ["Avoid constant banking."] },
      { id: "identify-vors", cue: "Triangulation - VORs", action: "Identify the VORs." },
      { id: "two-vors", cue: "Triangulation - CDI", action: "Use 2 nearby VORs and center CDI with a FROM indication." },
      { id: "radials", cue: "Triangulation - radials", action: "Note the FROM radials from each VOR." },
      { id: "draw", cue: "Triangulation - draw", action: "Draw the two radials from VOR stations on the iPad sectional." },
      { id: "intersection", cue: "Triangulation - position", action: "Where the two radials intersect is your approximate current location." },
      { id: "circle", cue: "5C - Circle", action: "Circle to check visual reference and avoid getting more lost." },
      { id: "climb", cue: "5C - Climb", action: "Climb for better visual range and VOR reception." },
      { id: "conserve", cue: "5C - Conserve", action: "Conserve with slow cruise to save fuel." },
      { id: "confess", cue: "5C - Confess", action: "Confess to ATC that you require assistance." },
      { id: "comply", cue: "5C - Comply", action: "Comply with ATC instructions." },
    ],
  }),
  defineProcedure({
    id: "p30-22-diversion",
    title: "22. Diversion",
    shortTitle: "22. Diversion",
    category: "Maneuver",
    sourcePages: [30],
    accent: "teal",
    steps: [
      { id: "gps-direct", cue: "GPS direct", action: "Use direct on the G650 GPS and enter the diversion airport." },
      { id: "gps-info", cue: "GPS info", action: "Read the info on the GPS and make a simulated call to FSS on 122.2." },
      { id: "fuel-required", cue: "Fuel required", action: "Fuel required equals ETE divided by 10, based on 6 GPH." },
      {
        id: "fss-call",
        cue: "FSS call",
        action: "Contact FSS.",
        details: [
          "Miami Radio, N12345, divert to airport on a course of XXX.",
          "Report ETE in minutes, fuel required in gallons, and fuel onboard in gallons.",
        ],
      },
    ],
  }),
  defineProcedure({
    id: "p30-23-instrument-skills",
    title: "23. Flight Solely by Reference to Instrument Skills",
    shortTitle: "23. Instrument Skills",
    category: "Maneuver",
    sourcePages: [30],
    accent: "blue",
    steps: [
      { id: "cross-radial-scan", cue: "Cross radial scan", action: "Always start and finish with the attitude indicator." },
      { id: "standard-rate", cue: "Standard rate turn", action: "Use a 3 degree per second turn.", details: ["1 minute equals 180 degrees to exit IMC."] },
      { id: "pitch-up", cue: "Unusual attitude - pitching up", action: "Full power, level, then power to cruise." },
      { id: "pitch-down", cue: "Unusual attitude - pitching down", action: "Power idle, level, then power to cruise." },
    ],
  }),
];

export const sourcePageImage = (page: number) => `/source-pages/page_${page}.png`;
