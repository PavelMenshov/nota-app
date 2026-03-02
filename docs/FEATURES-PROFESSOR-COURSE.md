# Professor & course features (scope)

This document outlines the scope for **professor accounts** and **course-wide tasks/deadlines** (from your NotebookLM-style list). These are not implemented yet; they require schema and API design.

## Desired behaviour

1. **Professor accounts**  
   - Unique accounts with extended features.  
   - Can see a **students list** for a particular course.  
   - Can **send email to everyone** in the course at once.

2. **Course tasks / deadlines**  
   - Tasks from professors assigned to **all people in a university course**.  
   - These tasks appear as **deadlines** for students.  
   - Students see professor-assigned tasks in their task list / calendar.

## What exists today

- **Tasks**: `Task` model with `workspaceId`, `creatorId`, `assignees` (TaskAssignee).  
- **Calendar**: `CalendarEvent` per workspace.  
- **LMS**: `Course`, `Assignment`, `LmsIntegration` (e.g. Blackboard, Canvas, Moodle).  
- **Users**: No role (e.g. professor vs student) or course enrolment in the schema.

## What would be needed

1. **Schema**  
   - Optional `User` role or a `CourseMember` (or similar) with role (e.g. `PROFESSOR`, `STUDENT`) per course.  
   - Or link to LMS course/enrolment so “professor” is derived from LMS.

2. **APIs**  
   - List students in a course (for professors).  
   - “Email all in course” (e.g. open mailto or integrate with email provider).  
   - Create task/event that is assigned to “all course members” (or sync from LMS assignments as deadlines).

3. **UI**  
   - Professor view: course → students list, “Email all”, create course-wide task/deadline.  
   - Student view: show professor-assigned tasks/deadlines in Tasks and Calendar.

## Suggested next steps

- Define how “course” and “professor” are represented (Nota-only vs LMS-backed).  
- Add minimal schema (e.g. course membership + role).  
- Implement list-students and “email all” for professors, then course-wide tasks/deadlines.
