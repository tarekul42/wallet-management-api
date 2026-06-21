import { envVars } from "../config/env.js";

const isDev = () => envVars.NODE_ENV === "development";

const logger = {
  info: (...args: unknown[]) => {
    if (isDev()) console.info(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  log: (...args: unknown[]) => {
    if (isDev()) console.log(...args);
  },
};

export default logger;
