import React, { useState, useRef, useEffect } from "react";
import cmp from "semver-compare";
import cn from "classnames";
import { Pomotoio } from "./pomotoio";
import { createCountdownTimer } from "./lib/timer";
import Footer from "./components/Footer";
import Time from "./components/Time";
import styles from "./App.module.css";
import utilStyles from "./styles/utils.module.css";
import { Cube } from "./lib/cube";

function App() {
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState<number>();
  const [version, setVersion] = useState("");
  const cubeRef = useRef<Cube>();
  const timerRef = useRef<ReturnType<typeof createCountdownTimer>>();
  const pomotoioRef = useRef<Pomotoio>();
  const updateRef = useRef<number>();

  const update = () => {
    if (timerRef.current !== undefined) {
      setTime(timerRef.current.getRemainingTime());
    }
    updateRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    updateRef.current = requestAnimationFrame(update);
    return () => {
      if (updateRef.current !== undefined) {
        cancelAnimationFrame(updateRef.current);
      }
    };
  });

  useEffect(() => {
    timerRef.current = createCountdownTimer();
    pomotoioRef.current = new Pomotoio(timerRef.current);
    return () => {
      // TODO: dispose
    };
  }, []);

  useEffect(() => {
    if (connected) {
      pomotoioRef.current?.setCube(cubeRef.current);
    }
  }, [connected]);

  // version handling
  useEffect(() => {
    if (cubeRef.current?.isConnected() === true) {
      cubeRef.current?.on("configuration:bleProtocolVersion", setVersion);
      cubeRef.current.requestBleProtocolVersion();
    } else {
      cubeRef.current?.off("configuration:bleProtocolVersion", setVersion);
    }
    return () => {
      cubeRef.current?.off("configuration:bleProtocolVersion", setVersion);
    };
  }, [cubeRef.current]);

  const connect = async () => {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [Cube.SERVICE_UUID] }],
    });
    const cube = new Cube(device);
    cubeRef.current = cube;
    cubeRef.current.on("connected", () => {
      setConnected(true);
    });
    cube.connect();
  };

  const disconnect = () => {
    cubeRef.current?.disconnect();
    // TODO: should do in Pomotoio
    timerRef.current?.stop();
    setConnected(false);
  };

  // When browser doesn't support bluetooth
  if ((navigator as any).bluetooth === undefined) {
    return (
      <div className="container">
        <header className="header">
          <div className="notice">
            <p>This browser doesn't support Bluetooth.</p>
            <p>Please use Google Chrome on PC/Mac/Android.</p>
          </div>
        </header>
        <Footer />
      </div>
    );
  }

  const generateNotice = () => {
    if (version === "") {
      return null;
    }
    if (cmp(version, "2.1.0") < 0) {
      return (
        <>
          <p>This cube doesn't support new sensor features.</p>
          <p>
            <a
              className={styles.link}
              href="https://toio.io/update"
              target="_blank"
              rel="noopener noreferrer"
            >
              Please update system software{" "}
              <span role="img" aria-label="go to official information">
                👉
              </span>
            </a>
          </p>
        </>
      );
    }
    return null;
  };

  return (
    <div className={cn(styles.container, utilStyles.textWhite)}>
      <head className={cn(styles.header, utilStyles.textGray)}>
        {/* TODO: should make better */}
        <span style={{ color: "tomato" }}>pomodoro</span>
        <span>
          with<span style={{ color: "#00AECA" }}>toio</span>
        </span>
      </head>
      <div className={styles.content}>
        <Time time={time} disabled={!connected} />
        <div className={styles.notice}>{generateNotice()}</div>
        <div className={utilStyles.textGray}>
          {connected ? (
            <span className={utilStyles.textClickable} onClick={disconnect}>
              Disconnect a Cube
            </span>
          ) : (
            <span className={utilStyles.textClickable} onClick={connect}>
              Connect a Cube
            </span>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
