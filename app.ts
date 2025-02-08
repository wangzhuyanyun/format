import path from 'path';
import * as fs from 'fs/promises';
//add divisionName to items
async function addDivisionNameToItems() {
  const templatePath = path.join(__dirname, './data2.5/data2.5/template-items.json');
  const csiPath = path.join(__dirname, './data2.5/CSI_TO_Divsion.json');

  const [templateItems, csiData] = await Promise.all([
    fs.readFile(templatePath, 'utf-8').then(JSON.parse),
    fs.readFile(csiPath, 'utf-8').then(JSON.parse),
  ]);

  // Process each room's items
  const updatedTemplateItems = Object.fromEntries(
    Object.entries(templateItems).map(([room, items]) => {
      const updatedItems = (items as any[]).map((item) => {
        const csiPrefix = item.csiSection?.substring(0, 2);
        const division = csiData.divisions.find(
          (div) => div.number === csiPrefix,
        );
        return {
          ...item,
          divisionName: division ? division.title : 'Unknown',
        };
      });
      return [room, updatedItems];
    }),
  );

  await fs.writeFile(
    templatePath,
    JSON.stringify(updatedTemplateItems, null, 2),
  );
  return updatedTemplateItems;
}
//add unit、formulas、tradeType to items
async function addformulasItems() {
  const templatePath = path.join(__dirname, './data2.5/template-items.json');
  const formulasPath = path.join(__dirname, './data2.5/formulas.json');

  const [templateItems, formulasData] = await Promise.all([
    fs.readFile(templatePath, 'utf-8').then(JSON.parse),
    fs.readFile(formulasPath, 'utf-8').then(JSON.parse),
  ]);

  // Process each room's items
  const updatedTemplateItems = Object.fromEntries(
    Object.entries(templateItems).map(([room, items]) => {
      const updatedItems = (items as any[]).map((item) => {
        const normalizedCsiSection = item.csiSection.replace(/\s+/g, ''); // 去除空格
        // 先尝试完整匹配
        let formulasItem = formulasData.find(
          (f) => f.csiSection.replace(/\s+/g, '') === normalizedCsiSection
        );
        
        // 如果没找到，再尝试4位匹配
        if (!formulasItem) {
          formulasItem = formulasData.find(
            (f) => f.csiSection.replace(/\s+/g, '').startsWith(normalizedCsiSection.substring(0, 4))
          );
        }

        return {
          ...item,
          tradeType: formulasItem ? formulasItem.tradeType : '',
          unit: formulasItem ? formulasItem.unit : '',
          formulas: formulasItem ? formulasItem.formulas : {},
          materialType: 'item',
        };
      });
      return [room, updatedItems];
    }),
  );

  await fs.writeFile(
    templatePath,
    JSON.stringify(updatedTemplateItems, null, 2),
  );
  return updatedTemplateItems;
}
//templateId
async function addtenplateIdItems() {
  const itemsPath = path.join(__dirname, './data2.5/template-items.json');
  const templatePath = path.join(__dirname, './data2.5/customer-templates.json');

  const [templateItems, customerTemplates] = await Promise.all([
    fs.readFile(itemsPath, 'utf-8').then(JSON.parse),
    fs.readFile(templatePath, 'utf-8').then(JSON.parse),
  ]);

  // Process each room's items
  const updatedTemplateItems = Object.fromEntries(
    Object.entries(templateItems).map(([room, items]) => {
      // Find matching template in customer-templates.json
      const template = customerTemplates.find((t) => t.roomType === room);
      const templateId = template ? template._id : '';

      const updatedItems = (items as any[]).map((item) => {
        return {
          ...item,
          templateId: templateId,
        };
      });
      return [room, updatedItems];
    }),
  );

  await fs.writeFile(itemsPath, JSON.stringify(updatedTemplateItems, null, 2));
  return updatedTemplateItems;
}
//templateId
async function addtenplateIdAssemblies() {
  const assembliesPath = path.join(__dirname, './data2.5/default_assemblies_v1.json');
  const templatePath = path.join(__dirname, './data2.5/customer-templates.json');
  const newAssembliesFilePath = path.join(__dirname, './data2.5/template-assemblies.json');
  const newAssembliesItemsFilePath = path.join(__dirname, './data2.5/template-assemblies-items.json');
  const csiPath = path.join(__dirname, './data2.5/CSI_TO_Divsion.json');
  const tradePath = path.join(__dirname, './data2.5/csi_to_trade_type_map_v1.json');
  const formulasPath = path.join(__dirname, './data2.5/formulas.json');
  const [templateAssemblies, customerTemplates,csiData,tradeData,formulasData] = await Promise.all([
    fs.readFile(assembliesPath, 'utf-8').then(JSON.parse),
    fs.readFile(templatePath, 'utf-8').then(JSON.parse),
     fs.readFile(csiPath, 'utf-8').then(JSON.parse),
     fs.readFile(tradePath, 'utf-8').then(JSON.parse),
      fs.readFile(formulasPath, 'utf-8').then(JSON.parse),
  ]);
  let assemblyItems:any[]=[];
  // Process each room's items
  const updatedTemplateAsemblies = Object.fromEntries(
    Object.entries(templateAssemblies).map(([room, items]) => {
      // Find matching template in customer-templates.json
      const template = customerTemplates.find((t) => t.roomType === room);
      const templateId = template ? template._id : '';
      const updatedItems = (items as any[]).map((item) => {
      const csiPrefix = item.CSI_ID?.substring(0, 2);
      const division = csiData.divisions.find(
        (div) => div.number === csiPrefix,
      );
      const tradeType=tradeData.find(
        (trade) => trade.id === item.CSI_ID,
      )
     
      const items = item.Line_Items.map((it:any) => {
          const itemDivision = csiData.divisions.find(
            (div) => div.number ===  it.CSI_ID?.substring(0, 2),
          );
          const itemTradeType=tradeData.find(
            (trade) => trade.id === it.CSI_ID,
          )
        const normalizedCsiSection = it.CSI_ID.replace(/\s+/g, ''); // 去除空格
         // 先尝试完整匹配
         let formulasItem = formulasData.find(
          (f) => f.csiSection.replace(/\s+/g, '') === normalizedCsiSection
        );
        
        // 如果没找到，再尝试4位匹配
        if (!formulasItem) {
          formulasItem = formulasData.find(
            (f) => f.csiSection.replace(/\s+/g, '').startsWith(normalizedCsiSection.substring(0, 4))
          );
        }
        // const formulasItem = formulasData.find(
        //   (f) =>
        //     f.csiSection.replace(/\s+/g, '') === normalizedCsiSection ||
        //     f.csiSection
        //       .replace(/\s+/g, '')
        //       .startsWith(normalizedCsiSection.substring(0, 4)),
        // );
        const formula=it.formula;
        const unit = it.output_variable === 'lengthLF' ? 'LF' : it.output_variable === 'qtyEach' ? 'EACH' : it.output_variable === 'areaSF' ? 'SQFT' : 'LBS';
         formulasItem.formulas[unit] = formula;
        const data={
            assemblyId: item.assemblyId,
            name:it.Line_Item_Name,
            showName:it.show_name,
            csiSection:it.CSI_ID,
            divisionName:itemDivision.title||'',
            tradeType:itemTradeType.trade_type,
            unit:unit,
            formulas: formulasItem ? formulasItem.formulas : {},
            materialType: 'assembly-item',
          }
        const dataCopy = JSON.parse(JSON.stringify(data));
        assemblyItems.push(dataCopy)
        return data;
        });
        return {
          _id:item.assemblyId,
          name:item.Assembly_Name,
          csiSection:item.CSI_ID,
          divisionName:division.title||'',
          tradeType:tradeType.trade_type,
          materialType: 'assembly',
          templateId: templateId,
        };
      });
      return [room, updatedItems];
    }),

  );
   await fs.writeFile(newAssembliesItemsFilePath, JSON.stringify(assemblyItems, null, 2));
// Process data to convert to array format
const processedData = Object.values(updatedTemplateAsemblies).flat();
  await fs.writeFile(newAssembliesFilePath, JSON.stringify(processedData, null, 2));
 
  return updatedTemplateAsemblies;
}
//format equation
async function convertCsiToFormulas() {
  const csiPath = path.join(__dirname, './data2.5/csi_to_equation_map_v3.json');
 // const csiPath = path.join(__dirname, './data2.5/csi_to_equation_map_v1.json');
 // const outputPath = path.join(__dirname, './data2.5/formulas.json');
  const outputPath = path.join(__dirname, './data2.5/formulas_v3.json');

  // 读取源文件
  const csiData = await fs.readFile(csiPath, 'utf-8').then(JSON.parse);

  // 转换数据格式
  const formattedData = csiData.map((item) => {
    // 从formulas数组中提取公式
    const formulasObj: Record<string, string> = {};
    item.formulas.forEach((formula) => {
      // 将output_variable转换为对应的单位格式
      const unit = {
        lengthLF: 'LF',
        qtyEach: 'EACH',
        areaSF: 'SQFT',
        weightLBS: 'LBS',
      }[
        formula.output_variable as
          | 'lengthLF'
          | 'qtyEach'
          | 'areaSF'
          | 'weightLBS'
      ];

      if (unit) {
        formulasObj[unit] = formula.formula;
      }
    });

    return {
      csiSection: item.csi_id,
      csiTitle: item.csi_title,
      tradeType: item.trade_type==="Exterior Insulation and Finish Systems (EIFS)"?"EIFS":item.trade_type,
      unit:
        item.default_output_variable.variable === 'areaSF'
          ? 'SQFT'
          : item.default_output_variable.variable === 'lengthLF'
            ? 'LF'
            : item.default_output_variable.variable === 'qtyEach'
              ? 'EACH'
              : item.default_output_variable.variable === 'weightLBS'
                ? 'LBS'
                : 'SQFT',
      formulas: formulasObj,
    };
  });

  // 写入新文件
  await fs.writeFile(outputPath, JSON.stringify(formattedData, null, 2));

  return formattedData;
}
//update items with formulas data
async function updateItemsWithFormulas() {
  const templatePath = path.join(__dirname, './data2.5/new-template-items.json');
  const formulasPath = path.join(__dirname, './data2.5/formulas_v3.json');

  const [items, formulasData] = await Promise.all([
    fs.readFile(templatePath, 'utf-8').then(JSON.parse),
    fs.readFile(formulasPath, 'utf-8').then(JSON.parse),
  ]);

  const updatedItems = items.map((item: any) => {
    const normalizedCsiSection = item.csiSection.replace(/\s+/g, ''); // 去除空格
    // 先尝试完整匹配
    let formulasItem = formulasData.find(
      (f) => f.csiSection.replace(/\s+/g, '') === normalizedCsiSection
    );
    
    // 如果没找到，再尝试4位匹配
    if (!formulasItem) {
      formulasItem = formulasData.find(
        (f) => f.csiSection.replace(/\s+/g, '').startsWith(normalizedCsiSection.substring(0, 4))
      );
    }

    return {
      ...item,
      tradeType: formulasItem?.tradeType || '',
      unit: formulasItem?.unit || '',
      formulas: formulasItem?.formulas || {},
    };
  });

  await fs.writeFile(templatePath, JSON.stringify(updatedItems, null, 2));
  return updatedItems;
}
//update items with formulas data
// async function updateAssemblyItemsWithFormulas() {
//   const templatePath = path.join(__dirname, './data2.5/template-assemblies-items.json');
//   const formulasPath = path.join(__dirname, './data2.5/formulas_v3.json');

//   const [items, formulasData] = await Promise.all([
//     fs.readFile(templatePath, 'utf-8').then(JSON.parse),
//     fs.readFile(formulasPath, 'utf-8').then(JSON.parse),
//   ]);

//   const updatedItems = items.map((item: any) => {
//     const normalizedCsiSection = item.csiSection.replace(/\s+/g, ''); // 去除空格
//     // 先尝试完整匹配
//     let formulasItem = formulasData.find(
//       (f) => f.csiSection.replace(/\s+/g, '') === normalizedCsiSection
//     );
    
//     // 如果没找到，再尝试4位匹配
//     if (!formulasItem) {
//       formulasItem = formulasData.find(
//         (f) => f.csiSection.replace(/\s+/g, '').startsWith(normalizedCsiSection.substring(0, 4))
//       );
//     }

//     return {
//       ...item,
//       tradeType: formulasItem?.tradeType || '',
//       unit: formulasItem?.unit || '',
//       formulas: formulasItem?.formulas || {},
//     };
//   });

//   await fs.writeFile(templatePath, JSON.stringify(updatedItems, null, 2));
//   return updatedItems;
// }
// Generate new JSON file from template-items
async function generateNewJsonFromTemplateItems() {
  const templatePath = path.join(__dirname, './data2.5/template-items.json');
  const newFilePath = path.join(__dirname, './data2.5/new-template-items.json');

  const templateItems = await fs
    .readFile(templatePath, 'utf-8')
    .then(JSON.parse);

  // Process data to convert to array format
  const processedData = Object.values(templateItems).flat();

  // Write to new JSON file
  await fs.writeFile(newFilePath, JSON.stringify(processedData, null, 2));
  return processedData;
}
//f;
// 执行转换

// 执行更新
updateItemsWithFormulas()
  .then(() => {
    console.log('更新完成');
    process.exit(0); // 终止程序
  })
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1); // 发生错误时终止程序
  });
