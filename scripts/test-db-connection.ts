
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing DB connection...')
  try {
    const count = await prisma.user.count()
    console.log(`Connection successful. Users count: ${count}`)
  } catch (e: any) {
    console.error('Connection failed:', e.message)
    console.error('Full error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
