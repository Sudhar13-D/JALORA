import React, { useEffect } from 'react';
import {
  X,
  PlayCircle,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Flame,
  VolumeX,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ScenarioPreset } from '../../types';

interface DemoControllerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoController: React.FC<DemoControllerProps> = ({ isOpen, onClose }) => {
  const {
    scenario,
    setScenario,
    resetDemo,
    isGuidedTourActive,
    guidedTourStep,
    runGuidedTour,
    cancelGuidedTour,
    markRepaired,
    confirmCitizen,
    tickets,
  } = useAppStore();

  const scenariosList: { id: ScenarioPreset; name: string; desc: string; icon: React.FC<{ size: number; className?: string }> }[] = [
    {
      id: 'normal',
      name: 'Normal Supply',
      desc: 'All branches pressurized, no anomalies, 100% functional FHTCs',
      icon: CheckCircle
    },
    {
      id: 'off_schedule',
      name: 'Off-schedule Zero Flow',
      desc: '13:00 outside window. Zero flow is NORMAL and raises NO alerts',
      icon: VolumeX
    },
    {
      id: 'blockage_s8',
      name: 'Blockage on S8 (B1-B2)',
      desc: 'Severe downstream drop at B2, backpressure at B1, 9 households affected',
      icon: AlertTriangle
    },
    {
      id: 'leak_s3',
      name: 'Leak on S3 (J1-J2)',
      desc: 'Flow imbalance across S3, downstream pressure collapsed',
      icon: Flame
    },
    {
      id: 'sensor_fault_b1',
      name: 'Sensor Failure at B1',
      desc: 'Erratic readings with 0 citizen complaints -> Unresolved anomaly',
      icon: Radio
    },
    {
      id: 'normal_fluctuation',
      name: 'Pressure Fluctuation',
      desc: 'Turbulence within 3.5 MAD threshold -> No false alarms',
      icon: Sliders
    },
    {
      id: 'false_complaint_burst',
      name: 'False-Complaint Burst',
      desc: 'Isolated complaint with normal telemetry -> robust rejection',
      icon: Sparkles
    }
  ];

  // Guided demo tour runner
  useEffect(() => {
    if (!isGuidedTourActive) return;

    const timer = setTimeout(() => {
      if (guidedTourStep === 1) {
        // Step 1: Normal -> transition to Step 2: Off-schedule
        setScenario('off_schedule');
        useAppStore.setState({ guidedTourStep: 2 });
      } else if (guidedTourStep === 2) {
        // Step 2: Off schedule verified -> Step 3: Inject blockage on S8
        setScenario('blockage_s8');
        useAppStore.setState({ guidedTourStep: 3 });
      } else if (guidedTourStep === 3) {
        // Step 3: Blockage detected & tickets created -> Step 4: Mark repaired
        const activeTicket = tickets.find((t) => t.segmentId === 'S8');
        if (activeTicket) {
          markRepaired(activeTicket.id, 'Pipe flushed and cleared sediment obstruction at junction');
        }
        useAppStore.setState({ guidedTourStep: 4 });
      } else if (guidedTourStep === 4) {
        // Step 4: Repaired -> Step 5: Citizen confirms and scores recover
        const activeTicket = tickets.find((t) => t.segmentId === 'S8');
        if (activeTicket) {
          confirmCitizen(activeTicket.id);
        }
        useAppStore.setState({ guidedTourStep: 5, isGuidedTourActive: false });
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [isGuidedTourActive, guidedTourStep, setScenario, markRepaired, confirmCitizen, tickets]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Demo Controller Scenarios"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-[#1C2541] shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col p-4 transition-transform overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders size={18} className="text-jalora-blue" />
            Demo Controller
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One-click scenario simulation & testing
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          aria-label="Close demo controller"
        >
          <X size={18} />
        </button>
      </div>

      {/* Guided Tour Banner */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-jalora-navy dark:text-blue-300">
              Guided Full Tour
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Normal &rarr; Off-Schedule &rarr; Blockage &rarr; Detection &rarr; Repair &rarr; Citizen Confirm
            </p>
          </div>
          {isGuidedTourActive ? (
            <button
              type="button"
              id="cancel-guided-tour-btn"
              onClick={cancelGuidedTour}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600"
            >
              Stop Tour (Step {guidedTourStep}/5)
            </button>
          ) : (
            <button
              type="button"
              id="run-guided-tour-btn"
              onClick={runGuidedTour}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-jalora-blue text-white hover:bg-jalora-blue-dark shadow-xs"
            >
              <PlayCircle size={14} />
              Run Full Demo
            </button>
          )}
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="mt-4 space-y-2 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Instant Scenarios
        </h3>
        {scenariosList.map((sc) => {
          const Icon = sc.icon;
          const isSelected = scenario === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              id={`scenario-btn-${sc.id}`}
              onClick={() => {
                setScenario(sc.id);
              }}
              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                isSelected
                  ? 'border-jalora-blue bg-blue-50/70 dark:bg-blue-950/50 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  size={16}
                  className={
                    isSelected
                      ? 'text-jalora-blue dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sc.name}
                </span>
                {isSelected && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-jalora-blue text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                {sc.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer Reset Button */}
      <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          id="demo-controller-reset-btn"
          onClick={() => {
            resetDemo();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RotateCcw size={14} />
          Reset Demo to Factory State
        </button>
      </div>
    </div>
  );
};
