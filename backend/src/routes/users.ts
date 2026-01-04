import z from "zod"
import {prisma} from "../lib/prisma"
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { hashPassword } from "../utils/hash"
import "@fastify/jwt"
import { verifyAdmin, authenticate} from "../utils/auth"

declare module "@fastify/jwt"{
    interface FastifyJwt{
        user : {id: string, email: string, role: string}
    }
}

export const User:FastifyPluginAsyncZod = async app => {
    app.post("/user", {
        schema:{
            body:z.object({
                name: z.string().min(5, "Deve conter pelo menos 5 caracteres!").max(35, "Deve ter no máximo 35 caracteres!"),
                email: z.string().email("Não está no formato correto de email!"),
                password: z.string()
                .min(12, "Deve conter pelo menos 12 caracteres!")
                .regex(/[a-zA-Z]/, "Deve conter pelo menos uma letra")
                .regex(/[0-9]/, "Deve conter pelo menos um número")
            }),
            response:{
                201:z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    email: z.string().email()
                }),
                400:z.object({
                    error: z.string()
                }),
                500:z.object({
                    error: z.string()
                })
            }
        }
    }, async(request, reply) => {
        const {name, email, password} = request.body

        try {
            const existUser = await prisma.user.findUnique({
                where:{
                    email
                }
            })

            if(existUser){
                reply.status(400).send({error: "Usuário já existente"})
            }

            const hashedPassword = await hashPassword(password)

            const newUser = await prisma.user.create({
                data:{
                    name,
                    email,
                    password: hashedPassword
                }
            })

            return reply.status(201).send(newUser)
        } catch (error) {
            reply.status(500).send({error: "Não foi possível cadastrar!"})            
        }
    })

    app.get("/user", {
        preHandler: authenticate,
        schema:{
            response:{
                200:z.array(
                    z.object({
                        id: z.string().uuid(),
                        name: z.string(),
                        email: z.string()
                    })
                ),
                500:z.object({
                    error: z.string()
                })
            }
        }
    }, async(request, reply) => {
        try {
            const users = await prisma.user.findMany()
            reply.send(users)
        } catch (error) {
            reply.status(500).send({error:"Erro ao encontrar usuários"})        
        }
    })
}