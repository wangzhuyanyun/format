import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as fs from "fs/promises";
import Koa from "koa";
import Router from "koa-router";
import serve from "koa-static";
import multer from "multer";
import bodyParser from "koa-bodyparser";
import { defaultPaths } from "./config/defaultPaths";

//Extend the Request type
declare module "http" {
  interface IncomingMessage {
    files: { [fieldname: string]: Express.Multer.File[] };
  }
}

// declare module "koa" {
//   interface Request {
//     body: any;
//   }
// }

import { formatTemplateItems } from "./methods/format_template_Items";
import { formatTemplateAssemblies } from "./methods/format_template_Assemblies";
import { formatEquationsToFormulas } from "./methods/format_equations_to_formulas";
import { updateItemsWithFormulas } from "./methods/updateItemsWithFormulas";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保上传目录存在
const uploadsDir = path.join(__dirname, "uploads");
try {
  await fs.access(uploadsDir);
} catch {
  await fs.mkdir(uploadsDir, { recursive: true });
}
const app = new Koa();
const router = new Router();

app.use(bodyParser());

// 配置 multer
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 使用原始文件名，但要确保文件名唯一
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

app.use(serve(path.join(__dirname, "public")));

router.post("/upload", async (ctx) => {
  try {
    // 使用 Promise 包装 multer 中间件
    const handleMulterUpload = () => {
      return new Promise((resolve, reject) => {
        const middleware = upload.fields([
          { name: "customerTemplates", maxCount: 1 },
          { name: "templateItems", maxCount: 1 },
          { name: "templateAssemblies", maxCount: 1 },
          { name: "csiData", maxCount: 1 },
          { name: "formulasData", maxCount: 1 },
          { name: "tradeData", maxCount: 1 },
          { name: "equationsData", maxCount: 1 },
        ]);

        middleware(ctx.req, ctx.res, (err) => {
          if (err) reject(err);
          else resolve(ctx.req);
        });
      });
    };

    await handleMulterUpload();

    const files = ctx.req.files || {};
    // 从 ctx.req.body 获取表单数据
    const method = ctx.req.body?.method;
    let outputPath = (ctx.req.body?.outputPath || "output") + ".json";

    // 处理组件和项目的输出路径
    const assembliesPath =
      (ctx.req.body?.assembliesPath || "assemblies") + ".json";
    const assemblyItemsPath =
      (ctx.req.body?.assemblyItemsPath || "items") + ".json";

    console.log("Received method:", method); // 调试日志
    console.log("Form data:", ctx.req.body); // 调试日志

    if (!method) {
      throw new Error("Method is required");
    }

    // 确保输出目录存在
    const outputDir = path.join(__dirname, "output");
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
    }

    let result;
    const finalOutputPath = path.join(outputDir, outputPath);
    const finalAssembliesPath = path.join(outputDir, assembliesPath);
    const finalAssemblyItemsPath = path.join(outputDir, assemblyItemsPath);

    // 创建清理文件的辅助函数
    const cleanupFiles = async (fileKeys: string[]) => {
      for (const key of fileKeys) {
        if (files[key] && files[key][0]) {
          try {
            await fs.unlink(files[key][0].path);
          } catch (err) {
            console.warn(`Failed to cleanup file: ${key}`, err);
          }
        }
      }
    };

    // 创建读取文件的辅助函数
    const readJsonFile = async (fieldName: string) => {
      if (files[fieldName] && files[fieldName][0]) {
        return JSON.parse(await fs.readFile(files[fieldName][0].path, "utf-8"));
      }
      // 如果没有上传文件，使用默认文件
      return JSON.parse(await fs.readFile(defaultPaths[fieldName], "utf-8"));
    };

    try {
      switch (method) {
        case "formatTemplateItems":
          const customerTemplates = await readJsonFile("customerTemplates");
          const templateItems = await readJsonFile("templateItems");
          const csiData = await readJsonFile("csiData");
          const equationsData = await readJsonFile("equationsData");
          result = await formatTemplateItems(
            customerTemplates,
            templateItems,
            csiData,
            equationsData,
            finalOutputPath
          );
          await cleanupFiles(Object.keys(files));
          break;

        case "formatTemplateAssemblies":
          const templateItemsAssemblies = await readJsonFile(
            "templateAssemblies"
          );
          const templates = await readJsonFile("customerTemplates");
          const csi = await readJsonFile("csiData");
          const tradeData = await readJsonFile("tradeData");
          const equation = await readJsonFile("equationsData");
          result = await formatTemplateAssemblies(
            templates,
            templateItemsAssemblies,
            csi,
            tradeData,
            equation,
            finalAssembliesPath,
            finalAssemblyItemsPath // 添加第二个输出路径
          );
          await cleanupFiles(Object.keys(files));
          break;
        case "formatEquationsToFormulas":
          const equations = await readJsonFile("equationsData");
          result = await formatEquationsToFormulas(equations, finalOutputPath);
          await cleanupFiles(Object.keys(files));
          break;
        case "updateItemsWithFormulas":
          const templateItemsUpdate = await readJsonFile("templateItems");
          const formulasDataUpdate = await readJsonFile("formulasData");
          result = await updateItemsWithFormulas(
            templateItemsUpdate,
            formulasDataUpdate,
            finalOutputPath
          );
          await cleanupFiles(Object.keys(files));
          break;

          const templateItemsNewJson = await readJsonFile("templateItems");
          result = await generateNewJsonFromTemplateItems(
            templateItemsNewJson,
            finalOutputPath
          );
          await cleanupFiles(Object.keys(files));
          break;
        default:
          throw new Error("Unknown method");
      }

      ctx.body = {
        success: true,
        outputPath:
          method === "formatTemplateAssemblies"
            ? {
                assembliesPath: finalAssembliesPath,
                assemblyItemsPath: finalAssemblyItemsPath,
              }
            : finalOutputPath,
        result,
      };
    } catch (error) {
      // 如果处理过程中出错，只清理上传的文件
      if (files) {
        await cleanupFiles(Object.keys(files));
      }
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message,
    };
  }
});

router.get("/default-files", async (ctx) => {
  const result = {};
  for (const [key, filePath] of Object.entries(defaultPaths)) {
    try {
      await fs.access(filePath);
      result[key] = {
        exists: true,
        path: filePath,
        fileName: path.basename(filePath),
      };
    } catch {
      result[key] = {
        exists: false,
        path: filePath,
        fileName: path.basename(filePath),
      };
    }
  }
  ctx.body = result;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(9000, () => {
  console.log("Server is running on http://localhost:9000");
});
