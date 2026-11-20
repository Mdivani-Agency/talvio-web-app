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
 * Ported from the talv-pdf playground (playground/templates/compact.ts, commit 1dedd54, v0.4.0); the web
 * app owns this copy. Links use `formattedUrl`, without the protocol.
 *
 * Compact: small type and tight margins, to fit a long career on one page. Name and role on the
 * left, contact lines on the right, an accent rule under the header, and skills beside education
 * near the end. Board 2 on the design canvas.
 */

const heading = (value: string): LabelItem => ({
  text: value.toUpperCase(),
  fontSize: "sm",
  font: "bold",
  color: "secondary",
  margins: { top: "md", bottom: "sm" },
});

const small = { fontSize: "sm" as const };
const muted = { fontSize: "sm" as const, color: "neutral" as const };

export const compact: Template = {
  defaultSectionOrder: [
    "summary",
    "experience",
    "skills",
    "education",
    "languages",
    "projects",
    "recommendations",
  ],
  groups: [
    page(
      [
        {
          width: "full",
          direction: "horizontal",
          gap: "md",
          padding: { y: "sm" },
          background: {
            border: { color: "secondary", width: 1.5, sides: ["bottom"] },
          },
          groups: [
            {
              width: "3/5",
              fields: [
                root([
                  text("name", { fontSize: "xl", font: "bold" }),
                  text(
                    "role",
                    { font: "semibold", color: "secondary" },
                    { top: "sm" },
                  ),
                ]),
              ],
            },
            {
              width: "2/5",
              fields: [
                root(
                  [
                    row(
                      ["email", "phone"],
                      { email: muted, phone: muted },
                      { justify: "end", separator: " · " },
                    ),
                    row(
                      ["location", "primaryProfile"],
                      { location: muted, primaryProfile: muted },
                      { justify: "end", separator: " · " },
                    ),
                  ],
                  { gap: "sm" },
                ),
              ],
            },
          ],
        },
        section("summary", heading("Summary"), [
          root([text("description", small)]),
        ]),
        section(
          "experience",
          heading("Experience"),
          [
            entries("experience", [
              row(
                ["jobTitle", "company", "dateRange"],
                {
                  jobTitle: { ...small, font: "semibold" },
                  company: small,
                  dateRange: muted,
                },
                { justify: "split", separator: ", " },
              ),
              description(small, "sm"),
            ]),
          ],
          { gap: "sm" },
        ),
        {
          width: "full",
          direction: "horizontal",
          // Also the space below the two columns.
          gap: "lg",
          groups: [
            {
              width: "1/2",
              groups: [
                section("skills", heading("Skills"), [joined("skills", small)]),
                section("skills", heading("Tools"), [joined("tools", small)]),
              ],
            },
            {
              width: "1/2",
              groups: [
                section("education", heading("Education"), [
                  entries("education", [
                    text("degree", { ...small, font: "semibold" }),
                    row(
                      ["school", "dateRangeShort"],
                      { school: muted, dateRangeShort: muted },
                      { separator: " · " },
                    ),
                    description(small, "sm"),
                  ]),
                ]),
                section("languages", heading("Languages"), [
                  joined("languages", small),
                ]),
              ],
            },
          ],
        },
        section(
          "projects",
          heading("Projects"),
          [
            entries("projects", [
              row(
                ["projectName", "formattedUrl"],
                {
                  projectName: { ...small, font: "semibold" },
                  formattedUrl: muted,
                },
                { separator: " · " },
              ),
              description(small, "sm"),
            ]),
          ],
          { gap: "sm" },
        ),
        section(
          "recommendations",
          heading("Recommendations"),
          [
            entries("recommendations", [
              row(
                ["recommendeeName", "formattedUrl"],
                {
                  recommendeeName: { ...small, font: "semibold" },
                  formattedUrl: muted,
                },
                { separator: " · " },
              ),
              description(small, "sm"),
            ]),
          ],
          { gap: "sm" },
        ),
      ],
      { x: "lg" },
    ),
  ],
};
