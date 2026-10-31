-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('IN_SERVICE', 'RESERVE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- DropForeignKey
ALTER TABLE "Bus" DROP CONSTRAINT "Bus_routeId_fkey";

-- AlterTable
ALTER TABLE "Bus" ADD COLUMN     "status" "BusStatus" NOT NULL DEFAULT 'IN_SERVICE',
ALTER COLUMN "routeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CrowdReport" ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DispatchAction" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "busId" INTEGER NOT NULL,
    "fromRouteId" INTEGER,
    "toRouteId" INTEGER,
    "operatorId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "DispatchAction_toRouteId_createdAt_idx" ON "DispatchAction"("toRouteId", "createdAt");

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_fromRouteId_fkey" FOREIGN KEY ("fromRouteId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_toRouteId_fkey" FOREIGN KEY ("toRouteId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
