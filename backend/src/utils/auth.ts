import { FastifyRequest, FastifyReply } from "fastify"
import z from "zod"

const jwtUserPayloadSchema = z.object({
  sub: z.coerce.number().positive(),
  role: z.enum(["ADMIN", "USER"]), 
})

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()

    request.user = jwtUserPayloadSchema.parse(request.user)

  } catch (error) {
    return reply.status(401).send({ error: "Token de autenticação inválido ou ausente." })
  }
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { role } = request.user as z.infer<typeof jwtUserPayloadSchema>

    if (role !== "ADMIN") {
      return reply.status(403).send({ error: "Acesso negado. Requer privilégios de administrador." })
    }

  } catch (error) {
    return reply.status(500).send({ error: "Erro interno de autorização." })
  }
}