import * as fs from "fs/promises";

export async function formatTemplateItems(
  templates,
  templateItems,
  csiData,
  equationsData,
  outputPath
) {
  const updatedTemplateItems = Object.fromEntries(
    Object.entries(templateItems).map(([room, items]) => {
      const updatedItems = (items as any[]).map((item) => {
        const csiPrefix = item.CSI_ID?.substring(0, 2);
        const division = csiData.divisions.find(
          (div) => div.number === csiPrefix
        );
        if (room === "Dining Room") {
          room = "Dining";
        }
        const template = templates.find((t) => t.roomType === room);
        const templateId = template ? template._id : "";
        const normalizedCsiSection = item.CSI_ID.replace(/\s+/g, ""); // 去除空格
        let formulasItem = equationsData.find(
          (f) => f.csi_id.replace(/\s+/g, "") === normalizedCsiSection
        );

        if (!formulasItem) {
          formulasItem = equationsData.find((f) =>
            f.csi_id
              .replace(/\s+/g, "")
              .startsWith(normalizedCsiSection.substring(0, 4))
          );
        }
        const unit =
          item.output_variable === "lengthLF"
            ? "LF"
            : item.output_variable === "qtyEach"
            ? "EACH"
            : item.output_variable === "areaSF"
            ? "SQFT"
            : "LBS";
        const formula = item.formula;
        const formulasObj: Record<string, string> = {};
        formulasItem.formulas.forEach((equation) => {
          const equationUnit = {
            lengthLF: "LF",
            qtyEach: "EACH",
            areaSF: "SQFT",
            weightLBS: "LBS",
          }[
            equation.output_variable as
              | "lengthLF"
              | "qtyEach"
              | "areaSF"
              | "weightLBS"
          ];

          if (equationUnit) {
            if (equationUnit === unit) {
              formulasObj[equationUnit] = formula;
            } else {
              formulasObj[equationUnit] = equation.formula;
            }
          }
        });
        return {
          csiSection: item.CSI_ID,
          name: item.Line_Item_Name,
          divisionName: division ? division.title : "Unknown",
          unit: unit,
          formulas: formulasObj || {},
          tradeType:
            formulasItem.trade_type ===
            "Exterior Insulation and Finish Systems (EIFS)"
              ? "EIFS"
              : formulasItem.trade_type || "",
          materialType: "item",
          templateId: templateId,
        };
      });
      return [room, updatedItems];
    })
  );
  const processedData = Object.values(updatedTemplateItems).flat();

  // 直接使用传入的完整路径
  await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));

  return updatedTemplateItems;
}
