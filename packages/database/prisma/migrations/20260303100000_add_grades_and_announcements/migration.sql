-- CreateTable: grades per course (from LMS gradebook)
CREATE TABLE "lms_grades" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "externalColumnId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "letterGrade" TEXT,
    "feedback" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable: announcements from LMS
CREATE TABLE "lms_announcements" (
    "id" TEXT NOT NULL,
    "lmsIntegrationId" TEXT NOT NULL,
    "courseId" TEXT,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_announcements_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "lms_grades_courseId_externalColumnId_key" ON "lms_grades"("courseId", "externalColumnId");
CREATE UNIQUE INDEX "lms_announcements_lmsIntegrationId_externalId_key" ON "lms_announcements"("lmsIntegrationId", "externalId");

-- Foreign keys
ALTER TABLE "lms_grades" ADD CONSTRAINT "lms_grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lms_announcements" ADD CONSTRAINT "lms_announcements_lmsIntegrationId_fkey" FOREIGN KEY ("lmsIntegrationId") REFERENCES "lms_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lms_announcements" ADD CONSTRAINT "lms_announcements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
