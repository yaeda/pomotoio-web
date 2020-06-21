import React from "react";
import { GoMarkGithub } from "react-icons/go";
import styles from "../styles/utils.module.css";

function Footer() {
  return (
    <footer>
      <p>
        by{" "}
        <a
          className={styles.colorInherit}
          href="https://twitter.com/yaeda"
          target="_blank"
          rel="noopener noreferrer"
        >
          @yaeda
        </a>{" "}
        on{" "}
        <a
          className={styles.colorInherit}
          href="https://github.com/yaeda/pomotoio-web"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GoMarkGithub style={{ verticalAlign: "middle" }} />
        </a>
      </p>
    </footer>
  );
}

export default Footer;
