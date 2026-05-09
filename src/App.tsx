import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  Gauge,
  HelpCircle,
  ListChecks,
  Plane,
  Radio,
  RotateCcw,
  Shuffle,
  Target,
  Trash2,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Procedure, ProcedureStep, procedures, sourcePageImage } from "./procedures";

type Mode = "study" | "recall" | "sequence" | "oral";

type Progress = {
  mastery: Record<string, number>;
  attempts: number;
  correct: number;
};

const modes: Array<{ id: Mode; label: string; icon: typeof BookOpen }> = [
  { id: "study", label: "Study", icon: BookOpen },
  { id: "recall", label: "Recall", icon: Brain },
  { id: "sequence", label: "Sequence", icon: Shuffle },
  { id: "oral", label: "Oral", icon: Radio },
];

const categoryIcons = {
  "Run-up": Gauge,
  Briefing: ClipboardCheck,
  Maneuver: Plane,
  Emergency: AlertTriangle,
};

const initialProgress: Progress = {
  mastery: {},
  attempts: 0,
  correct: 0,
};

function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreAnswer(answer: string, step: ProcedureStep) {
  const text = normalize(answer);
  const hits = step.keywords.filter((keyword) => text.includes(normalize(keyword))).length;
  const total = Math.max(step.keywords.length, 1);
  return { hits, total, ratio: hits / total };
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function clampMastery(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function App() {
  const [selectedId, setSelectedId] = useState(procedures[0].id);
  const [mode, setMode] = useState<Mode>("study");
  const [progress, setProgress] = useLocalStorageState<Progress>("flying-procedure-progress-v1", initialProgress);

  const selected = procedures.find((procedure) => procedure.id === selectedId) ?? procedures[0];
  const selectedMastery = progress.mastery[selected.id] ?? 0;
  const averageMastery = Math.round(
    procedures.reduce((sum, procedure) => sum + (progress.mastery[procedure.id] ?? 0), 0) / procedures.length,
  );
  const accuracy = progress.attempts === 0 ? 0 : Math.round((progress.correct / progress.attempts) * 100);
  const firstManeuverIndex = useMemo(() => procedures.findIndex((procedure) => procedure.id === "pre-maneuver-abccd"), []);

  function recordResult(procedureId: string, correct: boolean, masteryDelta: number) {
    setProgress((current) => {
      const previous = current.mastery[procedureId] ?? 0;
      return {
        mastery: {
          ...current.mastery,
          [procedureId]: clampMastery(previous + (correct ? masteryDelta : -2)),
        },
        attempts: current.attempts + 1,
        correct: current.correct + (correct ? 1 : 0),
      };
    });
  }

  function resetProgress() {
    setProgress(initialProgress);
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brandBlock">
          <div className="brandIcon" aria-hidden="true">
            <Plane size={22} />
          </div>
          <div>
            <p className="eyebrow">Private Pilot</p>
            <h1>Procedure Trainer</h1>
          </div>
        </div>
        <div className="sessionStats" aria-label="Session progress">
          <Stat label="Average" value={`${averageMastery}%`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <button className="iconButton" type="button" onClick={resetProgress} title="Reset progress">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="procedureRail" aria-label="Procedure list">
          <div className="railHeader">
            <p className="eyebrow">Focus Set</p>
            <strong>{procedures.length} drills</strong>
          </div>
          <div className="procedureList">
            {procedures.map((procedure, index) => {
              const Icon = categoryIcons[procedure.category];
              const active = procedure.id === selected.id;
              const mastery = progress.mastery[procedure.id] ?? 0;

              return (
                <Fragment key={procedure.id}>
                  {index === firstManeuverIndex && (
                    <div className="procedureSeparator" role="separator" aria-label="Private Pilot Maneuvers">
                      <span>Private Pilot Maneuvers</span>
                      <small>Pages 24-30</small>
                    </div>
                  )}
                  <button
                    className={`procedureCard accent-${procedure.accent} ${active ? "active" : ""}`}
                    type="button"
                    onClick={() => setSelectedId(procedure.id)}
                  >
                    <span className="procedureIcon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span className="procedureText">
                      <span className="procedureTitle">{procedure.shortTitle}</span>
                      <span className="procedureMeta">
                        {procedure.memoryCode ? `${procedure.category} - ${procedure.memoryCode}` : procedure.category}
                      </span>
                    </span>
                    <span className="miniMeter" aria-label={`${mastery}% mastery`}>
                      <span style={{ width: `${mastery}%` }} />
                    </span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </aside>

        <section className="trainerPane">
          <ProcedureHeader procedure={selected} mastery={selectedMastery} />

          <nav className="modeTabs" aria-label="Trainer modes">
            {modes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={mode === item.id ? "active" : ""}
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {mode === "study" && <StudyPanel procedure={selected} />}
          {mode === "recall" && <RecallPanel procedure={selected} onResult={recordResult} />}
          {mode === "sequence" && <SequencePanel procedure={selected} onResult={recordResult} />}
          {mode === "oral" && <OralPanel procedure={selected} onResult={recordResult} />}
        </section>

        <SourcePanel procedure={selected} />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProcedureHeader({ procedure, mastery }: { procedure: Procedure; mastery: number }) {
  const Icon = categoryIcons[procedure.category];

  return (
    <div className={`procedureHeader accent-${procedure.accent}`}>
      <div className="headerText">
        <span className="categoryBadge">
          <Icon size={16} />
          {procedure.category}
        </span>
        <h2>{procedure.title}</h2>
        <p>
          Pages {procedure.sourcePages.join(", ")}
          {procedure.memoryCode ? ` - ${procedure.memoryCode}` : ""}
        </p>
      </div>
      <div className="masteryDial" aria-label={`${mastery}% mastery`}>
        <svg viewBox="0 0 42 42" role="img">
          <circle className="dialTrack" cx="21" cy="21" r="16" />
          <circle
            className="dialProgress"
            cx="21"
            cy="21"
            r="16"
            strokeDasharray={`${mastery} ${100 - mastery}`}
          />
        </svg>
        <strong>{mastery}%</strong>
      </div>
    </div>
  );
}

function StudyPanel({ procedure }: { procedure: Procedure }) {
  const [covered, setCovered] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCovered(false);
    setRevealedSteps({});
  }, [procedure.id]);

  function revealStep(stepId: string) {
    setRevealedSteps((current) => ({ ...current, [stepId]: true }));
  }

  return (
    <div className="studySurface simpleStudy">
      <div className="studyTools">
        <div>
          <p className="eyebrow">Study Checklist</p>
          <h3>Read it in order</h3>
        </div>
        <button className="toolButton" type="button" onClick={() => setCovered((value) => !value)}>
          {covered ? <Eye size={17} /> : <EyeOff size={17} />}
          {covered ? "Reveal Mode" : "Cover Mode"}
        </button>
      </div>

      <div className="studyList">
        {procedure.steps.map((step, index) => {
          const isVisible = !covered || revealedSteps[step.id];

          return (
            <article className="studyListItem" key={step.id}>
              <span className="stepNumber">{String(index + 1).padStart(2, "0")}</span>
              <div className="studyListCopy">
                <strong>{step.cue}</strong>
                {isVisible ? (
                  <>
                    <p>{step.action}</p>
                    {step.details?.map((detail) => (
                      <small key={detail}>{detail}</small>
                    ))}
                  </>
                ) : (
                  <button className="inlineReveal" type="button" onClick={() => revealStep(step.id)}>
                    <HelpCircle size={16} />
                    Reveal
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RecallPanel({
  procedure,
  onResult,
}: {
  procedure: Procedure;
  onResult: (procedureId: string, correct: boolean, masteryDelta: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAnswers({});
    setChecked(false);
  }, [procedure.id]);

  const results = procedure.steps.map((step) => scoreAnswer(answers[step.id] ?? "", step));
  const totalHits = results.reduce((sum, result) => sum + result.hits, 0);
  const totalKeywords = results.reduce((sum, result) => sum + result.total, 0);
  const score = totalKeywords === 0 ? 0 : Math.round((totalHits / totalKeywords) * 100);

  function checkRecall() {
    setChecked(true);
    onResult(procedure.id, score >= 70, 12);
  }

  function clearRecall() {
    setAnswers({});
    setChecked(false);
  }

  return (
    <div className="recallPanel">
      <div className="modeHeader">
        <div>
          <p className="eyebrow">Ordered Recall</p>
          <h3>Write the callouts from memory</h3>
        </div>
        <div className={`scorePill ${checked ? (score >= 70 ? "pass" : "miss") : ""}`}>
          <Target size={16} />
          {checked ? `${score}%` : "Ready"}
        </div>
      </div>

      <div className="recallRows">
        {procedure.steps.map((step, index) => {
          const result = scoreAnswer(answers[step.id] ?? "", step);
          return (
            <article className="recallRow" key={step.id}>
              <div className="recallCue">
                <span>{index + 1}</span>
                <strong>{step.cue}</strong>
              </div>
              <textarea
                value={answers[step.id] ?? ""}
                onChange={(event) => {
                  setAnswers((current) => ({ ...current, [step.id]: event.target.value }));
                  setChecked(false);
                }}
                placeholder="Type your memory item..."
              />
              {checked && (
                <div className={result.ratio >= 0.7 ? "answerCheck pass" : "answerCheck miss"}>
                  <strong>
                    {result.hits}/{result.total} key points
                  </strong>
                  <p>{step.action}</p>
                  {step.details?.map((detail) => (
                    <small key={detail}>{detail}</small>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="actionBar">
        <button className="primaryButton" type="button" onClick={checkRecall}>
          <CheckCircle2 size={18} />
          Check recall
        </button>
        <button className="secondaryButton" type="button" onClick={clearRecall}>
          <RotateCcw size={18} />
          Clear
        </button>
      </div>
    </div>
  );
}

function SequencePanel({
  procedure,
  onResult,
}: {
  procedure: Procedure;
  onResult: (procedureId: string, correct: boolean, masteryDelta: number) => void;
}) {
  const [available, setAvailable] = useState<ProcedureStep[]>(() => shuffle(procedure.steps));
  const [chosen, setChosen] = useState<ProcedureStep[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAvailable(shuffle(procedure.steps));
    setChosen([]);
    setChecked(false);
  }, [procedure]);

  const correct = chosen.length === procedure.steps.length && chosen.every((step, index) => step.id === procedure.steps[index].id);

  function choose(step: ProcedureStep) {
    setAvailable((current) => current.filter((item) => item.id !== step.id));
    setChosen((current) => [...current, step]);
    setChecked(false);
  }

  function undo() {
    const last = chosen[chosen.length - 1];
    if (!last) return;
    setChosen((current) => current.slice(0, -1));
    setAvailable((current) => [last, ...current]);
    setChecked(false);
  }

  function reset() {
    setAvailable(shuffle(procedure.steps));
    setChosen([]);
    setChecked(false);
  }

  function checkSequence() {
    setChecked(true);
    onResult(procedure.id, correct, 14);
  }

  return (
    <div className="sequencePanel">
      <div className="modeHeader">
        <div>
          <p className="eyebrow">Sequence Builder</p>
          <h3>Build the procedure in order</h3>
        </div>
        <div className={`scorePill ${checked ? (correct ? "pass" : "miss") : ""}`}>
          <ListChecks size={16} />
          {checked ? (correct ? "Correct" : "Check order") : `${chosen.length}/${procedure.steps.length}`}
        </div>
      </div>

      <div className="sequenceGrid">
        <section className="sequenceColumn">
          <h4>Available</h4>
          <div className="choiceStack">
            {available.map((step) => (
              <button key={step.id} type="button" onClick={() => choose(step)}>
                <strong>{step.cue}</strong>
                <span>{step.action}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="sequenceColumn">
          <h4>Your order</h4>
          <div className="orderStack">
            {chosen.map((step, index) => {
              const isRight = step.id === procedure.steps[index]?.id;
              return (
                <div className={checked ? (isRight ? "right" : "wrong") : ""} key={`${step.id}-${index}`}>
                  <span>{index + 1}</span>
                  <strong>{step.cue}</strong>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="actionBar">
        <button className="primaryButton" type="button" onClick={checkSequence} disabled={chosen.length !== procedure.steps.length}>
          <CheckCircle2 size={18} />
          Check sequence
        </button>
        <button className="secondaryButton" type="button" onClick={undo} disabled={chosen.length === 0}>
          <ChevronLeft size={18} />
          Undo
        </button>
        <button className="secondaryButton" type="button" onClick={reset}>
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </div>
  );
}

function OralPanel({
  procedure,
  onResult,
}: {
  procedure: Procedure;
  onResult: (procedureId: string, correct: boolean, masteryDelta: number) => void;
}) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setPromptIndex(0);
    setRevealed(false);
  }, [procedure.id]);

  const prompt = procedure.oralPrompts[promptIndex];

  function nextPrompt() {
    setPromptIndex((index) => (index + 1) % procedure.oralPrompts.length);
    setRevealed(false);
  }

  function randomPrompt() {
    const next = Math.floor(Math.random() * procedure.oralPrompts.length);
    setPromptIndex(next === promptIndex ? (next + 1) % procedure.oralPrompts.length : next);
    setRevealed(false);
  }

  return (
    <div className="oralPanel">
      <div className="oralCard">
        <p className="eyebrow">Oral Practice</p>
        <h3>{prompt.prompt}</h3>
        {revealed ? (
          <div className="oralAnswer">
            {prompt.answer.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          <button className="revealButton" type="button" onClick={() => setRevealed(true)}>
            <Eye size={19} />
            Show answer
          </button>
        )}
      </div>

      <div className="actionBar">
        <button className="primaryButton" type="button" onClick={() => onResult(procedure.id, true, 8)}>
          <CheckCircle2 size={18} />
          Got it
        </button>
        <button className="secondaryButton" type="button" onClick={() => onResult(procedure.id, false, 0)}>
          <AlertTriangle size={18} />
          Missed
        </button>
        <button className="secondaryButton" type="button" onClick={nextPrompt}>
          <ChevronRight size={18} />
          Next
        </button>
        <button className="secondaryButton" type="button" onClick={randomPrompt}>
          <Shuffle size={18} />
          Random
        </button>
      </div>
    </div>
  );
}

function SourcePanel({ procedure }: { procedure: Procedure }) {
  const [selectedPage, setSelectedPage] = useState(procedure.sourcePages[0]);

  useEffect(() => {
    setSelectedPage(procedure.sourcePages[0]);
  }, [procedure.id, procedure.sourcePages]);

  return (
    <aside className="sourcePane" aria-label="Source pages">
      <div className="sourceHeader">
        <div>
          <p className="eyebrow">PDF Source</p>
          <strong>Page {selectedPage}</strong>
        </div>
        <div className="pageChips">
          {procedure.sourcePages.map((page) => (
            <button className={page === selectedPage ? "active" : ""} key={page} type="button" onClick={() => setSelectedPage(page)}>
              {page}
            </button>
          ))}
        </div>
      </div>
      <img src={sourcePageImage(selectedPage)} alt={`PDF page ${selectedPage}`} />
      <p className="safetyNote">Study aid only. Fly the aircraft using your CFI, POH, ACS, and approved checklist.</p>
    </aside>
  );
}

export default App;
