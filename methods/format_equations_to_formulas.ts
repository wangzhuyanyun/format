import * as fs from "fs/promises";
export async function formatEquationsToFormulas(equations, outputPath) {
  const formattedData = equations.map((item) => {
    const formulasObj: Record<string, string> = {};
    item.formulas.forEach((formula) => {
      const unit = {
        lengthLF: "LF",
        qtyEach: "EACH",
        areaSF: "SQFT",
        weightLBS: "LBS",
      }[
        formula.output_variable as
          | "lengthLF"
          | "qtyEach"
          | "areaSF"
          | "weightLBS"
      ];
      if (unit) {
        formulasObj[unit] = formula.formula;
      }
    });
    return {
      csiSection: item.csi_id,
      csiTitle: item.csi_title,
      tradeType:
        item.trade_type === "Exterior Insulation and Finish Systems (EIFS)"
          ? "EIFS"
          : item.trade_type,
      unit:
        item.default_output_variable.variable === "areaSF"
          ? "SQFT"
          : item.default_output_variable.variable === "lengthLF"
          ? "LF"
          : item.default_output_variable.variable === "weightLBS"
          ? "LBS"
          : item.default_output_variable.variable === "EA" || "qtyEach"
          ? "EACH"
          : "EACH",
      formulas: formulasObj,
    };
  });

  await fs.writeFile(outputPath, JSON.stringify(formattedData, null, 2));

  return formattedData;
}
