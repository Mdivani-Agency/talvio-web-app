# Resume template fonts

Embedded in resume PDFs for the templates' `serif` and `mono` typeface roles (`lib/pdf-templates/fonts.ts`).
Both are under the SIL Open Font License 1.1 (see the licence files here).

- `SourceSerif4-*.ttf`: Source Serif 4.005, from the `source-serif@4.5.0` npm package (adobe-fonts/source-serif).
- `IBMPlexMono-*.ttf`: IBM Plex Mono 2.5.0, from the `@ibm/plex-mono@2.5.0` npm package, converted from WOFF to
  TTF with fontTools. A WOFF embedded by pdf-lib is not a valid PDF font file (poppler and other readers reject it).
