-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'OPERATOR');

-- AlterTable
ALTER TABLE "CrowdReport" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PASSENGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CrowdReport_userId_routeId_createdAt_idx" ON "CrowdReport"("userId", "routeId", "createdAt");

-- AddForeignKey
ALTER TABLE "CrowdReport" ADD CONSTRAINT "CrowdReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
