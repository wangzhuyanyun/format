import path from "path";
import * as fs from "fs/promises";

export async function formatTemplateAssemblies(
  customerTemplates,
  templateAssemblies,
  csiData,
  tradeData,
  equationsData,
  outputPath,
  finalAssemblyItemsPath
) {
  //const templateAssemblies = templateItems;
  let assemblyItems: any[] = [];
  const updatedTemplateAsemblies = Object.fromEntries(
    Object.entries(templateAssemblies).map(([room, items]) => {
      if (room === "Dining Room") {
        room = "Dining";
      }
      const template = customerTemplates.find((t) => t.roomType === room);
      const templateId = template ? template._id : "";
      const updatedItems = (items as any[]).map((item) => {
        const csiPrefix = item.CSI_ID?.substring(0, 2);
        const division = csiData.divisions.find(
          (div) => div.number === csiPrefix
        );
        const tradeType = tradeData.find((trade) => trade.id === item.CSI_ID);

        const items = item.Line_Items.map((it: any) => {
          const itemDivision = csiData.divisions.find(
            (div) => div.number === it.CSI_ID?.substring(0, 2)
          );
          const normalizedCsiSection = it.CSI_ID.replace(/\s+/g, ""); // 去除空格
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
          const formula = it.formula;
          const unit =
            it.output_variable === "lengthLF"
              ? "LF"
              : it.output_variable === "qtyEach"
              ? "EACH"
              : it.output_variable === "areaSF"
              ? "SQFT"
              : "LBS";
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
          const tradeType = formulasItem.tradeType || "";
          const data = {
            assemblyId: item.assemblyId,
            name: it.Line_Item_Name,
            showName: it.show_name,
            csiSection: it.CSI_ID,
            divisionName: itemDivision.title || "",
            tradeType:
              formulasItem.trade_type ===
              "Exterior Insulation and Finish Systems (EIFS)"
                ? "EIFS"
                : formulasItem.trade_type || "",
            unit: unit,
            formulas: formulasObj || {},
            materialType: "assembly-item",
          };
          const dataCopy = JSON.parse(JSON.stringify(data));
          assemblyItems.push(dataCopy);
          return data;
        });
        return {
          _id: item.assemblyId,
          name: item.Assembly_Name,
          csiSection: item.CSI_ID,
          divisionName: division.title || "",
          tradeType: tradeType.trade_type,
          materialType: "assembly",
          templateId: templateId,
        };
      });
      return [room, updatedItems];
    })
  );
  await fs.writeFile(
    finalAssemblyItemsPath,
    JSON.stringify(assemblyItems, null, 2)
  );
  const processedData = Object.values(updatedTemplateAsemblies).flat();
  await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));

  return updatedTemplateAsemblies;
}
