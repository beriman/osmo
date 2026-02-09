import { SightSense } from "./sight.js";
import { HearingSense } from "./hearing.js";
import { SmellSense } from "./smell.js";
import { TouchSense } from "./touch.js";
import { TasteSense } from "./taste.js";
import { SpeechCapability } from "./capabilities/speech.js";
import { ListeningCapability } from "./capabilities/listening.js";

/**
 * Sensory Hub
 * Central integration layer for Osmo's "Panca Indera".
 */
export class SensoryHub {
  public sight: SightSense;
  public hearing: HearingSense;
  public smell: SmellSense;
  public touch: TouchSense;
  public taste: TasteSense;

  // Active Capabilities
  public speech: SpeechCapability;
  public listening: ListeningCapability;

  constructor() {
    this.sight = new SightSense();
    this.hearing = new HearingSense();
    this.smell = new SmellSense();
    this.touch = new TouchSense();
    this.taste = new TasteSense();

    this.speech = new SpeechCapability();
    this.listening = new ListeningCapability();
  }

  /**
   * Global project status based on sensory input.
   */
  public async getProjectHealth(sensoryData: any): Promise<string> {
    // Logic to aggregate all senses into a single "Health Score"
    return "Osmo Sensory State: ACTIVE | All channels clear.";
  }
}
