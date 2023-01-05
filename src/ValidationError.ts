export class ValidationError extends Error {
  constructor(name: string, message: string) {
    super(name + " " + message);
    this.name = "ValidationError";
  }
}