import type { CssValueInputValue } from "./css-value-input";
import {
  keywordValues,
  properties,
  units,
  isValidDeclaration,
} from "@webstudio-is/css-data";
import type { UnitOption } from "./unit-select";

// To make sorting stable
const preferedSorting = [
  "number",
  "px",
  ...units.percentage,
  "em",
  "rem",
  "svw",
  "svh",
  "lvw",
  "lvh",
  "dvw",
  "dvh",
  ...units.length,
  ...units.angle,
  ...units.decibel,
  ...units.flex,
  ...units.frequency,
  ...units.resolution,
  ...units.semitones,
  ...units.time,
];

const initialLengthUnits = [
  "px",
  "em",
  "rem",
  "ch",
  "svw",
  "svh",
  "lvw",
  "lvh",
] as const;

export const buildOptions = (
  property: string,
  value: CssValueInputValue,
  nestedSelectButtonUnitless: string
) => {
  const unit =
    value.type === "unit" || value.type === "intermediate"
      ? value.unit
      : undefined;

  const options: UnitOption[] = [];

  if (property in properties === false) {
    return options;
  }
  const { unitGroups } = properties[property as keyof typeof properties];

  for (const unitGroup of unitGroups) {
    if (unitGroup === "number") {
      options.push({
        id: "number",
        type: "unit",
        label: nestedSelectButtonUnitless,
      });
      continue;
    }

    const visibleUnits =
      unitGroup === "length" ? initialLengthUnits : units[unitGroup];
    for (const unit of visibleUnits) {
      options.push({
        id: unit,
        type: "unit",
        label: unit,
      });
    }
  }

  // Special case for 0, which is often used as a unitless value
  const showUnitless =
    value.type === "unit" || value.type === "intermediate"
      ? isValidDeclaration(property, `${value.value}`)
      : false;

  if (
    showUnitless &&
    options.some((option) => option.id === "number") === false
  ) {
    options.push({
      id: "number",
      type: "unit",
      label: nestedSelectButtonUnitless,
    });
  }

  // Add a valid unit, such as ch or vw, to the list of options, even if it's not already visible
  // This allows the currently selected unit to be displayed selected when the menu is opened
  if (
    unit !== undefined &&
    options.some((option) => option.id === unit) === false
  ) {
    options.push({
      id: unit,
      type: "unit",
      label: unit === "number" ? nestedSelectButtonUnitless : unit,
    });
  }

  const indexSortValue = (number: number) =>
    number === -1 ? Number.POSITIVE_INFINITY : number;

  // Use a stable sort for known dimensions, such as percentages after lengths
  // This ensures that the order of options remains consistent between renders
  options.sort(
    (optionA, optionB) =>
      indexSortValue(preferedSorting.indexOf(optionA.id)) -
      indexSortValue(preferedSorting.indexOf(optionB.id))
  );

  // This value can't have units, skip select
  // (show keywords menu instead)
  if (options.length === 0) {
    return [];
  }

  const propertyKeywordsSet = new Set(
    keywordValues[property as keyof typeof keywordValues]
  );

  // Opinionated set of keywords to show
  const webstudioKeywords = ["auto", "normal", "none"].filter((keyword) =>
    propertyKeywordsSet.has(keyword as never)
  );

  for (const keyword of webstudioKeywords) {
    options.push({
      id: keyword,
      label: keyword,
      type: "keyword",
    });
  }

  if (
    value.type === "keyword" &&
    options.some((option) => option.id === value.value) === false
  ) {
    options.push({
      id: value.value,
      label: value.value,
      type: "keyword",
    });
  }

  return options;
};
