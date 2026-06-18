declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: string
      role?: number
    }
  }
}

export {}
