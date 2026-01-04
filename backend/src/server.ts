import fastify from "fastify"
import {serializerCompiler, validatorCompiler, ZodTypeProvider} from "fastify-type-provider-zod"
import { User } from "./routes/users"

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(User)

app.get("/", () => {
    return "Hello World"
})

app.listen({port: 3000}, () => {
    console.log("Server Running in http://localhost:3000")
})