import React from "react";
import cn from "classnames";
import styles from "../styles/utils.module.css";

const padding = (pad, value) => {
  return (pad + value).slice(-pad.length);
};

function Time({ time, disabled }) {
  const minute = new Date(time).getUTCMinutes();
  const second = new Date(time).getUTCSeconds();

  return (
    <div
      className={cn(styles.textAxl, styles.colorTransition, styles.textMono, {
        [styles.textWhite]: !disabled,
        [styles.textGray]: disabled,
      })}
    >
      {padding("00", minute)}&prime;{padding("00", second)}&Prime;
    </div>
  );
}

export default Time;
