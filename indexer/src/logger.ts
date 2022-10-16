import { LogLevel } from "./types"

export default class Logger {
  constructor(private logLevel: LogLevel) {}

  log(message: string, level: LogLevel) {
    if (this.logLevel !== "none") {
      console.log(`[${new Date().toLocaleString()}] [${level}] ${message}`)
    }
  }

  info(message: string) {
    this.log(message, "info")
  }

  debug(message: string) {
    this.log(message, "debug")
  }

  error(message: string) {
    this.log(message, "error")
  }

  warn(message: string) {
    this.log(message, "warn")
  }

  success(message: string) {
    this.log(message, "success")
  }
}
