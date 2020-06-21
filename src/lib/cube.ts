import EventEmitter from "eventemitter3";

export class Cube {
  public static SERVICE_UUID = "10B20100-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();
  //const CHARACTERISTIC_ID_UUID = "10B20101-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();
  private static CHARACTERISTIC_MOTOR_UUID = "10B20102-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();
  private static CHARACTERISTIC_LIGHT_UUID = "10B20103-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();
  private static CHARACTERISTIC_SOUND_UUID = "10B20104-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();
  private static CHARACTERISTIC_SENSOR_UUID = "10B20106-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();
  private static CHARACTERISTIC_CONFIG_UUID = "10B201FF-5B3B-4571-9508-CF3EFCD7BBAE".toLowerCase();

  private eventEmitter: EventEmitter = new EventEmitter();
  private device: BluetoothDevice;
  private characteristics: Map<
    string,
    BluetoothRemoteGATTCharacteristic
  > = new Map();
  private prevValues: Map<string, number | boolean> = new Map();

  constructor(device: BluetoothDevice) {
    this.device = device;

    // handle disconnection
    this.device.addEventListener("gattserverdisconnected", this.onDisconnected);
  }

  public on(key: string, func: (...args: any[]) => any): EventEmitter {
    return this.eventEmitter.on(key, func);
  }

  public off(key: string, func?: (...args: any[]) => any): EventEmitter {
    return this.eventEmitter.off(key, func);
  }

  public isConnected(): boolean {
    return this.device?.gatt?.connected === true;
  }

  public async connect() {
    // connect to device
    const server = await this.device?.gatt?.connect();
    // retrieve primary service
    const service = await server?.getPrimaryService(Cube.SERVICE_UUID);
    // retrieve all characteristics
    const characteristics = await service?.getCharacteristics();
    this.characteristics.clear();
    characteristics?.forEach((characteristic) => {
      this.characteristics.set(characteristic.uuid, characteristic);
    });

    // sensor monitoring
    const sensorChar = await this.characteristics
      .get(Cube.CHARACTERISTIC_SENSOR_UUID)
      ?.startNotifications();
    sensorChar?.addEventListener(
      "characteristicvaluechanged",
      this.handleSensorNotification
    );

    // config monitoring
    const configChar = await this.characteristics
      .get(Cube.CHARACTERISTIC_CONFIG_UUID)
      ?.startNotifications();

    configChar?.addEventListener(
      "characteristicvaluechanged",
      this.handleConfigNotification
    );

    this.eventEmitter.emit("connected");
  }

  public async disconnect() {
    this.device.gatt?.disconnect();
  }

  public async readSensor() {
    const data = await this.characteristics
      .get(Cube.CHARACTERISTIC_SENSOR_UUID)
      ?.readValue();
    return this.handleSensorData(data);
  }

  public move = ({
    left,
    right,
    duration,
  }: {
    left: number;
    right: number;
    duration?: number;
  }) => {
    const lDirection = left > 0 ? 1 : 2;
    const rDirection = right > 0 ? 1 : 2;
    const lPower = Math.min(Math.abs(left), 115);
    const rPower = Math.min(Math.abs(right), 115);
    const validDuration =
      duration !== undefined ? Math.round(duration / 10) : 0;

    const buffer = Buffer.from([
      2,
      1,
      lDirection,
      lPower,
      2,
      rDirection,
      rPower,
      validDuration,
    ]);

    this.characteristics
      .get(Cube.CHARACTERISTIC_MOTOR_UUID)
      ?.writeValue(buffer);
  };

  public lightOn = (
    operations: {
      red: number;
      green: number;
      blue: number;
      duration?: number;
    }[],
    repeat = 0
  ) => {
    const validOperations = operations.slice(0, 29);

    const buffer = Buffer.alloc(3 + 6 * validOperations.length);
    buffer.writeUInt8(4, 0);
    buffer.writeUInt8(repeat, 1);
    buffer.writeUInt8(validOperations.length, 2);

    validOperations.forEach((operation, index) => {
      buffer.writeUInt8(
        operation.duration ? Math.round(operation.duration / 10) : 0xff,
        3 + 6 * index
      );
      buffer.writeUInt8(1, 4 + 6 * index);
      buffer.writeUInt8(1, 5 + 6 * index);
      buffer.writeUInt8(operation.red, 6 + 6 * index);
      buffer.writeUInt8(operation.green, 7 + 6 * index);
      buffer.writeUInt8(operation.blue, 8 + 6 * index);
    });

    this.characteristics
      .get(Cube.CHARACTERISTIC_LIGHT_UUID)
      ?.writeValue(buffer);
  };

  /**
   *
   * @param operations note sound operations (over 60th operations will be discarded. duration is in milliseconds)
   * @param repeat number of repeat (0 means eternal loop)
   */
  public playSound(
    operations: { note: number; duration?: number }[],
    repeat = 0
  ) {
    const validOperations = operations.slice(0, 59);

    const buffer = Buffer.alloc(3 + 3 * validOperations.length);
    buffer.writeUInt8(0x03, 0);
    buffer.writeUInt8(repeat, 1);
    buffer.writeUInt8(validOperations.length, 2);

    validOperations.forEach((operation, index) => {
      buffer.writeUInt8(
        operation.duration ? Math.round(operation.duration / 10) : 0xff,
        3 + 3 * index
      );
      buffer.writeUInt8(operation.note, 4 + 3 * index);
      buffer.writeUInt8(0xff, 5 + 3 * index);
    });

    // (this.characteristics.get(
    //   Cube.CHARACTERISTIC_SOUND_UUID
    // ) as any)?.writeWithResponse(buffer);
    this.characteristics
      .get(Cube.CHARACTERISTIC_SOUND_UUID)
      ?.writeValue(buffer);
  }

  public stopSound() {
    const buffer = Buffer.from([0x01]);

    (this.characteristics.get(
      Cube.CHARACTERISTIC_SOUND_UUID
    ) as any)?.writeWithResponse(buffer.toString("base64"));
  }

  public requestBleProtocolVersion() {
    this.characteristics
      .get(Cube.CHARACTERISTIC_CONFIG_UUID)
      ?.writeValue(Buffer.from([0x01, 0x00]));
  }

  private onDisconnected = () => {
    // unsubscribe notification
    this.characteristics
      .get(Cube.CHARACTERISTIC_SENSOR_UUID)
      ?.removeEventListener(
        "characteristicvaluechanged",
        this.handleSensorNotification
      );
    this.characteristics
      .get(Cube.CHARACTERISTIC_CONFIG_UUID)
      ?.removeEventListener(
        "characteristicvaluechanged",
        this.handleConfigNotification
      );

    // clear cached characteristics
    this.characteristics.clear();

    this.eventEmitter.emit("disconnected");
  };

  private handleSensorData = (data?: DataView) => {
    if (data?.getUint8(0) === 0x01) {
      if (data.byteLength >= 5) {
        const doubleTap = data.getUint8(3);
        const orientation = data.getUint8(4);
        return {
          "sensor:orientation": orientation,
          "sensor:doubleTap": doubleTap,
        };
      }
    }
    return null;
  };

  private handleSensorNotification = (event: Event) => {
    const data = (event.target as BluetoothRemoteGATTCharacteristic).value;
    const values = this.handleSensorData(data);

    const orientation = values?.["sensor:orientation"];
    const doubleTap = values?.["sensor:doubleTap"];
    if (
      orientation !== undefined &&
      this.prevValues.get("sensor:orientation") !== orientation
    ) {
      this.prevValues.set("sensor:orientation", orientation);
      this.eventEmitter.emit("sensor:orientation", orientation);
    }
    if (doubleTap !== undefined) {
      this.eventEmitter.emit("sensor:doubleTap", doubleTap);
    }
  };

  private handleConfigNotification = (event: Event) => {
    const data = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (data?.getUint8(0) === 0x81) {
      if (data.byteLength >= 3) {
        const decoder = new TextDecoder("utf-8");
        const version = decoder.decode(data.buffer.slice(2));
        this.eventEmitter.emit("configuration:bleProtocolVersion", version);
      }
    }
  };
}
