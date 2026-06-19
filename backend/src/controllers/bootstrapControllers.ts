import { Request, Response } from 'express'
import { bootstrapUser } from '../config/userBootstrap'

class bootstrapControllers {
  static setup = async (req: Request, res: Response) => {
    if (!req.userId) return res.sendStatus(401)

    try {
      const profile = await bootstrapUser({
        id: req.userId,
        email: req.email,
        user_metadata: req.userMetadata ?? {},
      })
      res.status(200).json({
        id: profile.id,
        username: profile.username,
        role: profile.role,
      })
    } catch (err) {
      console.error('Error en bootstrap', err)
      res.status(500).json({ message: 'No se pudo preparar la cuenta' })
    }
  }
}

export default bootstrapControllers
