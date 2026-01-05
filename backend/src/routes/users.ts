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
                .regex(/[a-zA-Z]/, "Deve conter pelo menos uma letra!")
                .regex(/[0-9]/, "Deve conter pelo menos um número!")
            }),
            response:{
                200:z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    email: z.string().email(),
                    createdAt: z.date()
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
                reply.status(400).send({error: "Usuário já existente!"})
            }

            const hashedPassword = await hashPassword(password)

            const newUser = await prisma.user.create({
                data:{
                    name,
                    email,
                    password: hashedPassword
                }
            })

            return reply.status(200).send(newUser)
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
                        email: z.string(),
                        createdAt: z.date()
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
            reply.status(500).send({error:"Erro ao encontrar usuários!"})        
        }
    })

    app.put("/user", {
        schema:{
            params:z.object({
                id: z.string().uuid("ID inválido!")
            }),
            body:z.object({
                name: z.string().min(5, "Deve conter pelo menos 5 caracteres!").max(35, "Deve ter no máximo 35 caracteres!"),
                email: z.string().email("Não está no formato correto de email!"),
                password: z.string()
                .min(12, "Deve conter pelo menos 12 caracteres!")
                .regex(/[a-zA-Z]/, "Deve conter pelo menos uma letra!")
                .regex(/[0-9]/, "Deve conter pelo menos um número!")
            }),
            response:{
                200:z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    email: z.string().email(),
                    createdAt: z.date(),
                    updatedAt: z.date()
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
        const {id} = request.params
        const {name, email, password} = request.body

        try {
            const existUser = await prisma.user.findUnique({
                where:{id}
            })

            if(!existUser){
                return reply.status(400).send({error:"Usuário inexistente!"})
            }

            if(email && email !== existUser.email){
                const emailTaken = await prisma.user.findUnique({
                    where:{email}
                })

                if(emailTaken){
                    return reply.status(400).send({error: "Email já está sendo utilizado!"})
                }
            }

            const updateUser = await prisma.user.update({
                where:{id},
                data:{
                    name,
                    email,
                    password
                }
            })

            return reply.status(200).send(updateUser)
        } catch (error) {
            return reply.status(500).send({error: "Não foi possível atualizar!"})
        }
    })

    app.delete("/user", {
        preHandler: verifyAdmin,
        schema:{
            params: z.object({
                id: z.string().uuid("ID inválido!")
            }),
            response:{
                200:z.object({
                    message: z.string("Usuário deletado com sucesso!"),
                    id: z.string().uuid()
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
        const {id} = request.params

        try {
            const existUser = await prisma.user.findUnique({
            where:{id}
        })

        if(!existUser){
            return reply.status(400).send({error: "Usuário inexistente!"})
        }

        await prisma.user.delete({
            where:{id}
        })

        return reply.status(200).send({message: "Usuário deletado com sucesso!", id})
        } catch (error) {
            return reply.status(500).send({error: "Não foi possível deletar usuário!"})
        }
    })
}