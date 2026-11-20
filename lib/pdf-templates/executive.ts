import type { LabelItem, Template } from "@pdf-tlv/resume";

import {
  description,
  entries,
  joined,
  page,
  root,
  row,
  section,
  text,
} from "./shared";

/**
 * Executive (board 4): a serif name, the role in the accent, an accent rule under the header, then a
 * summary and up to three headline achievements before the work history. Education and core
 * strengths sit side by side at the end.
 *
 * The headline achievements are an unnamed group, so they stay right under the summary whatever the
 * section order; without any, the group draws nothing.
 */

const heading = (value: string): LabelItem => ({
  text: value,
  fontSize: "lg",
  font: "bold",
  family: "serif",
  color: "secondary",
  margins: { top: "md", bottom: "sm" },
});

const muted = { color: "neutral" as const };

export const executive: Template = {
  defaultSectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "recommendations",
  ],
  groups: [
    page([
      {
        width: "full",
        padding: { y: "md" },
        background: {
          border: { color: "secondary", width: 2.25, sides: ["bottom"] },
        },
        fields: [
          root([
            text("name", { fontSize: "xl", font: "bold", family: "serif" }),
            text(
              "role",
              { font: "semibold", color: "secondary" },
              { top: "sm" },
            ),
            row(
              ["email", "phone", "location", "primaryProfile"],
              {
                email: muted,
                phone: muted,
                location: muted,
                primaryProfile: muted,
              },
              { separator: "  |  ", margins: { top: "sm" } },
            ),
          ]),
        ],
      },
      section("summary", heading("Executive summary"), [
        root([text("description")]),
      ]),
      {
        width: "full",
        gap: "md",
        label: heading("Selected achievements"),
        when: "headlineAchievements",
        fields: [
          entries(
            "headlineAchievements",
            [
              text("value", { fontSize: "lg", font: "bold", family: "serif" }),
              text("label", { fontSize: "sm", color: "neutral" }),
            ],
            {
              columns: 3,
              padding: { x: "md", y: "sm" },
              background: {
                border: { color: "secondary", width: 2.25, sides: ["left"] },
              },
            },
          ),
        ],
      },
      section("experience", heading("Experience"), [
        entries("experience", [
          row(
            ["jobTitle", "company", "dateRange"],
            { jobTitle: { font: "semibold" }, dateRange: muted },
            { justify: "split", separator: " · " },
          ),
          description(),
        ]),
      ]),
      {
        width: "full",
        direction: "horizontal",
        gap: "lg",
        groups: [
          section(
            "education",
            heading("Education"),
            [
              entries("education", [
                text("degree", { font: "semibold" }),
                row(
                  ["school", "dateRangeShort"],
                  { school: muted, dateRangeShort: muted },
                  { separator: " · " },
                ),
              ]),
            ],
            { width: "1/2" },
          ),
          section("skills", heading("Core strengths"), [joined("skills")], {
            width: "1/2",
          }),
        ],
      },
      section("projects", heading("Projects"), [
        entries("projects", [
          row(
            ["projectName", "formattedUrl"],
            { projectName: { font: "semibold" }, formattedUrl: muted },
            { justify: "split" },
          ),
          description(),
        ]),
      ]),
      section("recommendations", heading("Recommendations"), [
        entries("recommendations", [
          row(
            ["recommendeeName", "formattedUrl"],
            { recommendeeName: { font: "semibold" }, formattedUrl: muted },
            { justify: "split" },
          ),
          description(),
        ]),
      ]),
    ]),
  ],
};
