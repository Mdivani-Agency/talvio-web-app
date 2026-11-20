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
 * Ported from the talv-pdf playground (playground/templates/graduate.ts, commit 1dedd54, v0.4.0); the web
 * app owns this copy. Links use `formattedUrl`, without the protocol.
 *
 * Graduate: education and projects before experience, a centred header, and section headings on
 * filled bars in the accent. Board 6 on the design canvas.
 */

const heading = (value: string): LabelItem => ({
  text: value.toUpperCase(),
  fontSize: "md",
  font: "semibold",
  color: "onSecondary",
  padding: { x: "md", y: "sm" },
  background: { color: "secondary", radius: 2 },
  margins: { top: "md", bottom: "md" },
});

/** "Technical:" before a joined list, in a narrow column of its own. */
const inline = (value: string): LabelItem => ({
  text: value,
  fontSize: "md",
  font: "semibold",
  color: "primary",
  column: 90,
});

const muted = { color: "neutral" as const };

export const graduate: Template = {
  defaultSectionOrder: [
    "summary",
    "education",
    "projects",
    "experience",
    "skills",
    "recommendations",
  ],
  groups: [
    page([
      {
        width: "full",
        fields: [
          root([
            text("name", { fontSize: "xl", font: "bold", justify: "center" }),
            text(
              "role",
              { font: "semibold", color: "secondary", justify: "center" },
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
              { justify: "center", separator: " · ", margins: { top: "sm" } },
            ),
          ]),
        ],
      },
      section("summary", heading("Objective"), [root([text("description")])]),
      section("education", heading("Education"), [
        entries("education", [
          row(
            ["degree", "dateRangeShort"],
            { degree: { font: "semibold" }, dateRangeShort: muted },
            { justify: "split" },
          ),
          text("school", muted),
          description(),
        ]),
      ]),
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
      section(
        "skills",
        heading("Skills"),
        [
          joined("skills", {}, { label: inline("Technical:") }),
          joined("tools", {}, { label: inline("Tools:") }),
          joined("languages", {}, { label: inline("Languages:") }),
        ],
        { gap: "sm" },
      ),
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
