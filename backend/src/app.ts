import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerOwnerRoutes } from './routes/owner.js'
import { registerGuestRoutes } from './routes/guest.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
  })

  registerOwnerRoutes(app)
  registerGuestRoutes(app)

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode ?? 500
    reply.status(statusCode).send({
      code: statusCode,
      message: err.message ?? 'Internal server error',
    })
  })

  return app
}
