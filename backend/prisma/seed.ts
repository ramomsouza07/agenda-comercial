import { PrismaClient, Role } from "../src/generated/prisma";


const prisma = new PrismaClient()

async function main() {
    console.log("Gerando seed de ADM...")

    const admin = await prisma.user.upsert({
        where:{ email: "admin@123.com"},
        update:{ role: Role.ADMIN},
        create:{
            name: "ADMIN",
            email: "admin@123.com",
            password: "AG3ND4DM-123_"
        }
    })

    console.log("ADM criado!")
    console.log("Gerando seed de USER...")
    const user = await prisma.user.upsert({
        where:{email: "user@123.com"},
        update: {role: Role.USER},
        create:{
            name: "USER",
            email: "user@123.com",
            password: "U$3R-2025_"
        }
    })

    console.log("USER criado!")

    console.log("Processo finalizado!")
}main()
.catch((e) => {
    console.error(e)
    process.exit(1)
})
.finally(async () => {
    await prisma.$disconnect()
})