-- CreateEnum
CREATE TYPE "LmsProvider" AS ENUM ('BLACKBOARD', 'CANVAS', 'MOODLE');

-- AlterTable: add optional LMS link to workspaces
ALTER TABLE "workspaces" ADD COLUMN "lmsIntegrationId" TEXT;

-- CreateTable
CREATE TABLE "lms_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "LmsProvider" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_courses" (
    "id" TEXT NOT NULL,
    "lmsIntegrationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "term" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_assignments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "points" DOUBLE PRECISION,

    CONSTRAINT "lms_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_lmsIntegrationId_key" ON "workspaces"("lmsIntegrationId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_courses_lmsIntegrationId_externalId_key" ON "lms_courses"("lmsIntegrationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_assignments_courseId_externalId_key" ON "lms_assignments"("courseId", "externalId");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_lmsIntegrationId_fkey" FOREIGN KEY ("lmsIntegrationId") REFERENCES "lms_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_integrations" ADD CONSTRAINT "lms_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_lmsIntegrationId_fkey" FOREIGN KEY ("lmsIntegrationId") REFERENCES "lms_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_assignments" ADD CONSTRAINT "lms_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
