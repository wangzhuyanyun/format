import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const defaultPaths = {
  customerTemplates: path.join(__dirname, "default_templates.json"),
  templateItems: path.join(__dirname, "default_items_v4.json"),
  templateAssemblies: path.join(__dirname, "default_assemblies_v1.json"),
  csiData: path.join(__dirname, "CSI_To_Divsion.json"),
  equationsData: path.join(__dirname, "csi_to_equation_map_v1.json"),
  tradeData: path.join(__dirname, "csi_to_trade_type_map_v1.json"),
};
