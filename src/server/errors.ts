/** Domain error carrying the HTTP status the API layer should respond with. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = "error",
  ) {
    super(message);
  }
}

export const badRequest = (m: string) => new ApiError(400, m, "bad_request");
export const notFound = (m: string) => new ApiError(404, m, "not_found");
export const conflict = (m: string) => new ApiError(409, m, "conflict");
