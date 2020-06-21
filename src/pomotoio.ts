import { createCountdownTimer } from "./lib/timer";
import { Cube } from "./lib/cube";

export class Pomotoio {
  private cube?: Cube;
  constructor(private timer = createCountdownTimer()) {
    this.timer.onFinish(this.handleFinish);
  }

  public async setCube(cube?: Cube) {
    this.cube?.off("sensor:orientation", this.handleOrientation);
    this.cube = cube;
    this.cube?.on("sensor:orientation", this.handleOrientation);
    const values = await this.cube?.readSensor();
    const orientation = values?.["sensor:orientation"];
    if (orientation !== undefined) {
      this.handleOrientation(orientation);
    }
  }

  private handleFinish = () => {
    // sound
    this.cube?.playSound(
      [
        { note: 64, duration: 120 },
        { note: 62, duration: 120 },
        { note: 64, duration: 120 },
        { note: 62, duration: 120 },
        { note: 64, duration: 120 },
        { note: 62, duration: 120 },
        { note: 64, duration: 120 },
        { note: 62, duration: 120 },
      ],
      1
    );

    // light
    this.cube?.lightOn(
      [
        { red: 0, green: 255, blue: 0, duration: 240 },
        { red: 0, green: 0, blue: 0, duration: 240 },
        { red: 0, green: 255, blue: 0, duration: 240 },
        { red: 0, green: 0, blue: 0, duration: 240 },
      ],
      1
    );

    // move
    this.cube?.move({ left: 100, right: -100, duration: 120 * 8 });
  };

  private handleOrientation = (orientation: number) => {
    switch (orientation) {
      case 1:
      case 2:
        this.timer.start();
        break;
      case 3:
        this.timer.setTime(15 * 60 * 1000);
        this.cube?.playSound(
          [
            { note: 64, duration: 120 },
            { note: 128, duration: 60 },
            { note: 62, duration: 120 },
          ],
          1
        );
        break;
      case 4:
        this.timer.setTime(3 * 60 * 1000);
        this.cube?.playSound([{ note: 64, duration: 120 }], 1);
        break;
      case 5:
        this.timer.setTime(25 * 60 * 1000);
        this.cube?.playSound(
          [
            { note: 62, duration: 120 },
            { note: 128, duration: 60 },
            { note: 62, duration: 120 },
          ],
          1
        );
        break;
      case 6:
        this.timer.setTime(5 * 60 * 1000);
        this.cube?.playSound([{ note: 62, duration: 120 }], 1);
        break;
      default:
        break;
    }
  };
}
