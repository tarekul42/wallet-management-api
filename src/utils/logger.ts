import { envVars } from "../config/env";

const isDev = () => envVars.NODE_ENV === "development";

const logger = {
  info: (...args: unknown[]) => {
    if (isDev()) console.info(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev()) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev()) console.warn(...args);
  },
  log: (...args: unknown[]) => {
    if (isDev()) console.log(...args);
  },
};

export default logger;
